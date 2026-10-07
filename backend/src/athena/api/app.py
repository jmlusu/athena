"""Standalone Athena API application.

Security hardening (mirrors GAP-010 from dashboard):
- CORS origins configurable via ATHENA_CORS_ORIGINS env var (comma-separated; defaults to localhost-only).
- Auth is fail-closed by default (ATHENA_AUTH_MODE defaults to api_key): write endpoints require X-API-Key matching ATHENA_API_KEY.
- Set ATHENA_AUTH_MODE=open only for localhost-only development.
- Simple in-memory rate limiter protects all endpoints (100 req/min default, configurable via ATHENA_RATE_LIMIT).
- Response security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) applied to every response.
"""

from __future__ import annotations

import contextlib
import ipaddress
import logging
import os
import time
from collections import defaultdict
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, cast

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from filelock import FileLock
from filelock import Timeout as FileLockTimeout

from athena.api.ai_routes import router as ai_router
from athena.api.routes import router as athena_router
from athena.metrics.prometheus import router as metrics_router
from athena.paths import get_data_root
from athena.scheduler import ScrapeConfig, athena_scheduler

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
# Placeholder values that count as "not configured" (fail-closed sentinel).
_KEY_SENTINELS = frozenset({"CHANGE_ME"})


def _get_api_keys() -> tuple[set[str], bool]:
    """Return (valid API keys, True when falling back to the dev key)."""
    keys = set()
    # Primary key
    primary = (os.environ.get("ATHENA_API_KEY") or "").strip()
    if primary and primary.upper() not in _KEY_SENTINELS:
        keys.add(primary)
    # Legacy aliases (for backward compat)
    for var in ("ATHENA_ADMIN_KEY", "ATHENA_APPROVE_KEY", "ATHENA_RUN_KEY"):
        val = (os.environ.get(var) or "").strip()
        if val and val.upper() not in _KEY_SENTINELS:
            keys.add(val)
    # Dev fallback (only used if no explicit keys configured)
    if not keys:
        return {_DEV_API_KEY}, True
    return keys, False


def _check_api_key(request: Request) -> bool:
    """Return True if the request is authorised."""
    api_key = request.headers.get("X-API-Key", "")
    valid_keys, using_fallback = _get_api_keys()
    if api_key not in valid_keys:
        return False
    if using_fallback:
        client = request.client
        return client is not None and is_loopback_host(client.host)
    return True


# Paths that are exempt from the API-key guard
_API_EXEMPT_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
)

# GET reads on these prefixes return personal data and need a key or loopback.
_PII_READ_PREFIXES = (
    "/api/v1/athena/profiles",
    "/api/v1/athena/applications",
    "/api/v1/athena/receipts",
)


def _is_exempt_from_auth(path: str) -> bool:
    """Return True for paths that bypass the API-key middleware."""
    if path in _API_EXEMPT_PREFIXES:
        return True
    return any(path == prefix or path.startswith(prefix + "/") for prefix in _API_EXEMPT_PREFIXES)


def _is_pii_read(path: str) -> bool:
    """Return True for GET paths that serve personal data."""
    return any(path == prefix or path.startswith(prefix + "/") for prefix in _PII_READ_PREFIXES)


def is_loopback_host(host: str) -> bool:
    """Return True when host resolves to a loopback interface."""
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return host.lower() in {"localhost", "localhost.localdomain"}


# ── Lifespan ────────────────────────────────────────────────────────────


def _acquire_instance_lock(data_root) -> FileLock | None:
    """Claim exclusive ownership of the data directory for this process.

    Returns the held lock, or None when there is nothing to hold (bypass enabled
    or no resolvable data root). Raises RuntimeError when another live instance
    already owns the directory.
    """
    if os.environ.get("ATHENA_ALLOW_MULTIPLE_INSTANCES", "").lower() in ("1", "true", "yes"):
        return None
    if data_root is None:
        return None

    lock_path = Path(data_root) / "athena_instance.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    # The guard file is held open exclusively while locked, so the pid breadcrumb
    # goes in a sidecar; Windows refuses a second writer on the locked file.
    owner_path = lock_path.with_name(lock_path.name + ".owner")
    lock = FileLock(str(lock_path), timeout=0)
    try:
        lock.acquire()
    except FileLockTimeout as err:
        holder = owner_path.read_text(encoding="utf-8").strip() if owner_path.exists() else "?"
        raise RuntimeError(  # noqa: TRY003
            f"Another Athena instance (pid={holder}) owns {data_root}. "
            "Stop it, set ATHENA_ALLOW_MULTIPLE_INSTANCES=true, or change ATHENA_DATA_DIR.",
        ) from err
    try:
        owner_path.write_text(str(os.getpid()), encoding="utf-8")
    except OSError:  # pragma: no cover - breadcrumb only
        logger.debug("Could not record instance pid in %s", owner_path)
    return lock


@asynccontextmanager
async def _lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Lifespan handler for FastAPI Athena app."""
    # Initialize Athena data directory
    data_root = None
    try:
        data_root = get_data_root()
        data_root.mkdir(parents=True, exist_ok=True)
        logger.info("Athena data directory initialised: %s", data_root)
    except Exception:  # noqa: BLE001 - non-critical startup hook
        logger.debug("Data directory initialisation skipped (non-critical)")

    # Claim a single-instance lock. Two servers pointed at one data directory both
    # write the same JSONL artifacts; making that explicit turns a silent
    # corruption risk into a loud startup failure.
    instance_lock = _acquire_instance_lock(data_root)
    logger.info("Athena instance lock acquired (pid=%d)", os.getpid())

    # Auto-start scheduler with a default scrape config (unattended operation)
    scheduler_started = False
    try:
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
            athena_scheduler.stop()
        except Exception:  # noqa: BLE001 - non-critical shutdown hook
            logger.debug("Scheduler shutdown skipped")

    if instance_lock is not None:
        with contextlib.suppress(Exception):
            instance_lock.release()
        with contextlib.suppress(Exception):
            if data_root is not None:
                (Path(data_root) / "athena_instance.lock.owner").unlink(missing_ok=True)
        logger.info("Athena instance lock released (pid=%d)", os.getpid())


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
    bind_host = os.environ.get("ATHENA_HOST", "").strip()
    if (
        os.environ.get("ATHENA_AUTH_MODE", "api_key") == "open"
        and bind_host
        and not is_loopback_host(bind_host)
    ):
        raise RuntimeError(  # noqa: TRY003
            f"ATHENA_AUTH_MODE=open only allowed on loopback hosts; got {bind_host}",
        )

    # ── Fail-closed: no real key on a non-loopback bind ─────────────────
    _, fallback_only = _get_api_keys()
    if fallback_only and bind_host and not is_loopback_host(bind_host):
        raise RuntimeError(  # noqa: TRY003
            "Fail-closed: ATHENA_API_KEY is unset or CHANGE_ME while "
            f"ATHENA_HOST={bind_host} is non-loopback. Set a real ATHENA_API_KEY "
            "and rotate any previously deployed key.",
        )
    if fallback_only:
        logger.warning(
            "ATHENA_API_KEY not configured — dev key fallback active, loopback clients only.",
        )

    # ── CORS (configurable, restricted allowlist) ────────────────────────
    _default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    origins_raw = os.environ.get("ATHENA_CORS_ORIGINS", "")
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    if not origins:
        origins = _default_origins
    if "*" in origins:
        logger.warning("ATHENA_CORS_ORIGINS contained '*'; ignoring wildcard for security.")
        origins = [o for o in origins if o != "*"]
    if not origins:
        origins = _default_origins

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

    # ── API-key guard for writes and PII reads ──────────────────────────
    @app.middleware("http")
    async def _api_key_middleware(request: Request, call_next: Any) -> Response:
        if _is_exempt_from_auth(request.url.path):
            return cast(Response, await call_next(request))
        needs_key = request.method in ("POST", "PUT", "PATCH", "DELETE")
        if not needs_key and request.method == "GET" and _is_pii_read(request.url.path):
            client = request.client
            needs_key = not (client is not None and is_loopback_host(client.host))
        if needs_key and not _check_api_key(request):
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

    app.include_router(athena_router, prefix="/api/v1/athena")
    app.include_router(ai_router, prefix="/api/v1/athena")
    app.include_router(metrics_router, prefix="/api/v1/athena")

    # ── Health check ───────────────────────────────────────────────────
    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "athena"}

    return app


app = create_app()
