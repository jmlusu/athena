"""Standalone Athena API application.

Security hardening (mirrors GAP-010 from dashboard):
- CORS origins configurable via ATHENA_CORS_ORIGINS env var (comma-separated; defaults to localhost-only).
- Auth is fail-closed by default (ATHENA_AUTH_MODE defaults to api_key): write endpoints require X-API-Key matching ATHENA_API_KEY.
- Set ATHENA_AUTH_MODE=open only for localhost-only development.
- Simple in-memory rate limiter protects all endpoints (100 req/min default, configurable via ATHENA_RATE_LIMIT).
- Response security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) applied to every response.
"""

from __future__ import annotations

import ipaddress
import logging
import os
import time
from collections import defaultdict
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def security_headers() -> dict[str, str]:
    """Return the hardened response-security headers for Athena API."""
    is_cloud_preview = (
        os.environ.get("AISTUDIO_PREVIEW") == "true"
        or os.environ.get("NODE_ENV") == "development_cloud"
    )

    csp_default = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "object-src 'none'"
    )

    if is_cloud_preview:
        csp = os.environ.get(
            "ATHENA_CSP",
            csp_default
            + "; frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com",
        )
    else:
        csp = os.environ.get(
            "ATHENA_CSP",
            csp_default + "; frame-ancestors 'none'",
        )

    hsts_max_age = int(os.environ.get("ATHENA_HSTS_MAX_AGE", "31536000"))
    headers = {
        "Content-Security-Policy": csp,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }
    if not is_cloud_preview:
        headers["X-Frame-Options"] = "DENY"
    if hsts_max_age > 0:
        headers["Strict-Transport-Security"] = f"max-age={hsts_max_age}; includeSubDomains"
    return headers


# ── Rate limiter (simple in-memory, sliding window per IP) ──────────────


class _RateLimiter:
    """Per-IP sliding-window rate limiter. No external dependencies."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Return (allowed, remaining) for the given key."""
        now = time.time()
        cutoff = now - self.window_seconds
        self._hits[key] = [t for t in self._hits[key] if t > cutoff]
        if len(self._hits[key]) >= self.max_requests:
            return False, 0
        self._hits[key].append(now)
        remaining = self.max_requests - len(self._hits[key])
        return True, remaining


# ── API key helper ──────────────────────────────────────────────────────


# Default dev key - should be overridden in production via ATHENA_API_KEY env var
_DEV_API_KEY = "dev-admin-key"


def _get_api_keys() -> set[str]:
    """Get the set of valid API keys from environment."""
    keys = set()
    # Primary key
    if primary := os.environ.get("ATHENA_API_KEY"):
        keys.add(primary.strip())
    # Legacy aliases (for backward compat)
    for var in ("ATHENA_ADMIN_KEY", "ATHENA_APPROVE_KEY", "ATHENA_RUN_KEY"):
        if val := os.environ.get(var):
            keys.add(val.strip())
    # Dev fallback (only used if no explicit keys configured)
    if not keys:
        keys.add(_DEV_API_KEY)
    return keys


def _check_api_key(request: Request) -> bool:
    """Return True if the request is authorised."""
    api_key = request.headers.get("X-API-Key", "")
    client_ip = request.client.host if request.client else "unknown"
    valid_keys = _get_api_keys()
    return api_key in valid_keys


# Paths that are exempt from the API-key guard
_API_EXEMPT_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
)


def _is_exempt_from_auth(path: str) -> bool:
    """Return True for paths that bypass the API-key middleware."""
    if path in _API_EXEMPT_PREFIXES:
        return True
    return any(path == prefix or path.startswith(prefix + "/") for prefix in _API_EXEMPT_PREFIXES)


def is_loopback_host(host: str) -> bool:
    """Return True when host resolves to a loopback interface."""
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return host.lower() in {"localhost", "localhost.localdomain"}


# ── Lifespan ────────────────────────────────────────────────────────────


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan handler for FastAPI Athena app."""
    # Initialize Athena data directory
    try:
        from athena.paths import get_data_root

        data_root = get_data_root()
        data_root.mkdir(parents=True, exist_ok=True)
        logger.info("Athena data directory initialised: %s", data_root)
    except Exception:  # noqa: BLE001 - non-critical startup hook
        logger.debug("Data directory initialisation skipped (non-critical)")

    # Auto-start scheduler with a default scrape config (unattended operation)
    scheduler_started = False
    try:
        from athena.scheduler import ScrapeConfig, athena_scheduler

        if not athena_scheduler.default_configs:
            default_query = os.environ.get("ATHENA_DEFAULT_SCRAPE_QUERY", "software engineer")
            default_location = os.environ.get("ATHENA_DEFAULT_SCRAPE_LOCATION") or None
            default_max = int(os.environ.get("ATHENA_DEFAULT_SCRAPE_MAX", "50"))
            athena_scheduler.add_default_config(
                ScrapeConfig(
                    query=default_query,
                    location=default_location,
                    max_results=default_max,
                ),
            )
            logger.info(
                "Default scrape config registered: query=%r location=%r max=%d",
                default_query,
                default_location,
                default_max,
            )

        if os.environ.get("ATHENA_SCHEDULER_AUTOSTART", "true").lower() in ("1", "true", "yes"):
            athena_scheduler.start()
            scheduler_started = True
        else:
            logger.info("Scheduler autostart disabled (ATHENA_SCHEDULER_AUTOSTART=false)")
    except Exception as e:  # noqa: BLE001 - non-critical startup hook
        logger.warning("Scheduler autostart skipped: %s", e)

    yield

    if scheduler_started:
        try:
            from athena.scheduler import athena_scheduler

            athena_scheduler.stop()
        except Exception:  # noqa: BLE001 - non-critical shutdown hook
            logger.debug("Scheduler shutdown skipped")


# ── App factory ─────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    app = FastAPI(
        lifespan=_lifespan,
        title="Athena Job-Scraping Platform API",
        description="REST API for Athena job scraping, matching, and application platform",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── Auth-mode loopback restriction ──────────────────────────────────
    if os.environ.get("ATHENA_AUTH_MODE", "api_key") == "open":
        bind_host = os.environ.get("ATHENA_HOST", "").strip()
        if bind_host and not is_loopback_host(bind_host):
            raise RuntimeError(
                "ATHENA_AUTH_MODE=open is only allowed on loopback hosts "
                f"(127.0.0.1 / ::1); ATHENA_HOST='{bind_host}'",
            )

    # ── CORS (configurable, restricted allowlist) ────────────────────────
    _DEFAULT_ORIGINS = [
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://localhost:8530",
        "http://127.0.0.1:8530",
    ]
    origins_raw = os.environ.get("ATHENA_CORS_ORIGINS", "")
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    if not origins:
        origins = _DEFAULT_ORIGINS
    if "*" in origins:
        logger.warning("ATHENA_CORS_ORIGINS contained '*'; ignoring wildcard for security.")
        origins = [o for o in origins if o != "*"]
    if not origins:
        origins = _DEFAULT_ORIGINS

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Rate limiter middleware ─────────────────────────────────────────
    rate_limit = int(os.environ.get("ATHENA_RATE_LIMIT", "100"))
    _limiter = _RateLimiter(max_requests=rate_limit)
    app.state.limiter = _limiter

    @app.middleware("http")
    async def _rate_limit_middleware(request: Request, call_next: Any) -> Response:
        if _is_exempt_from_auth(request.url.path):
            return cast(Response, await call_next(request))
        client_ip = request.client.host if request.client else "unknown"
        allowed, remaining = _limiter.is_allowed(client_ip)
        if not allowed:
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={
                    "X-RateLimit-Limit": str(rate_limit),
                    "X-RateLimit-Remaining": "0",
                },
            )
        response = cast(Response, await call_next(request))
        response.headers["X-RateLimit-Limit"] = str(rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    # ── API-key guard for write endpoints ───────────────────────────────
    @app.middleware("http")
    async def _api_key_middleware(request: Request, call_next: Any) -> Response:
        if _is_exempt_from_auth(request.url.path):
            return cast(Response, await call_next(request))
        # Only enforce on mutating methods
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            if not _check_api_key(request):
                return Response(
                    content='{"detail":"Invalid or missing API key"}',
                    status_code=401,
                    media_type="application/json",
                )
        return cast(Response, await call_next(request))

    # ── Security headers ────────────────────────────────────────────────
    @app.middleware("http")
    async def _security_headers_middleware(request: Request, call_next: Any) -> Response:
        response = cast(Response, await call_next(request))
        for name, value in security_headers().items():
            response.headers[name] = value
        return response

    # ── Routers ─────────────────────────────────────────────────────────
    from athena.api.routes import router as athena_router
    from athena.api.ai_routes import router as ai_router

    app.include_router(athena_router, prefix="/api/v1/athena")
    app.include_router(ai_router, prefix="/api/v1/athena")

    # ── Health check ───────────────────────────────────────────────────
    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "athena"}

    return app


app = create_app()
