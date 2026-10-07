# DEPENDENCY MAP — Current (Phase 1, read-only)

**Baseline:** `d674075` · npm `package-lock.json` (v3) + `backend/uv.lock` · evidence: `git grep`, `npm ls --depth=0` (exit 0), `tsc --noEmit` (exit 0).
**Note:** Supersedes archived `docs/archive/repo-audit/DEPENDENCY_MAP.md` (its "USED" verdicts for `lxml`/`structlog`/`pytest-cov`/`types-requests` are outdated — verified by live grep).

## 1. NPM (18 declared) — verdict: ZERO unused

| Dep | Verdict | Evidence |
|---|---|---|
| express, chokidar, dotenv | USED runtime | `server.ts:1,6,5` |
| react, react-dom, lucide-react | USED | `src/main.tsx:1-2`, `src/App.tsx:20` + 11 components |
| vite, @vitejs/plugin-react, @tailwindcss/vite, tailwindcss | BUILD-TOOL (USED) | `vite.config.ts:1,8`; `src/index.css:1`; `server.ts:644` dynamic `await import("vite")` |
| esbuild, tsx, typescript | BUILD/DEV (USED) | `package.json:8,7,11` scripts |
| @playwright/test | USED (e2e + CI) | `e2e/playwright.config.ts:1`, `e2e.yml:53` |
| @types/{express,node,react,react-dom} | BUILD (USED) | strict tsc |

Smell → CLOSED (do not reclassify): `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` sit in `dependencies` deliberately — production install must still build (`npm ci --omit=dev && npm run build`). The R2 reclassification was executed in `d8f68ee` and **reverted 2026-10-07**: it broke production-install builds (3 unresolved imports in `vite.config.ts`); both install modes + build re-verified OK post-revert. `tailwindcss` was never moved (stays `devDependencies`, installed transitively via `@tailwindcss/vite`).

## 2. Python (`backend/pyproject.toml`) — verdict: 6 candidates removed (B10); mypy kept (advisory CI job)

USED (verified imports): fastapi, uvicorn, pydantic, apscheduler, httpx, google-genai, beautifulsoup4, python-docx, weasyprint, pdfplumber, filelock, python-dotenv, email-validator (via `EmailStr`), numpy, sentence-transformers (guarded), playwright (guarded). Dev: pytest, pytest-asyncio, ruff.

| # | Candidate | Evidence of non-use | Risk | Note |
|---|---|---|---|---|
| 1 | `structlog` | 0 imports outside lock/pyproject:23 (stdlib logging used) | **R1** | removed (B10) |
| 2 | `types-requests` (dev) | no `import requests` in backend/scripts | **R1** | removed (B10) |
| 3 | `pydantic-settings` | no `pydantic_settings`/`BaseSettings` anywhere | **R2** | removed (B10); settings refactor re-adds if needed |
| 4 | `python-multipart` | no `Form/File/UploadFile/.form()`; upload route is JSON (`routes.py:414`) | **R2** | removed (B10); future upload route re-requires it |
| 5 | `pytest-cov` (dev) | config exists (`pyproject:114-125`), no `--cov` invocation anywhere | **R2** | removed (B10); `[tool.coverage]` config kept for the future gate |
| 6 | `lxml` direct pin | no direct import; bs4 always `"html.parser"` | **R2** | unpinned (B10); stays transitively via python-docx (6.1.3) |
| 7 | `mypy` (dev) | not in CI/health; manual only | **R3** | kept — advisory CI job added (C15 / NEW-Q7a) |

No npm package qualifies for outright removal.

## 3. Version/lock status

- Lockfiles present and in sync (`npm ls` exit 0). Python `>=3.12` consistent across pyproject/CI/ruff/mypy.
- **No `engines` field / `.nvmrc`** — CI pins Node 24; local unpinned.
- Drift: `@types/express@5` vs runtime `express@4`; `@types/node@26` vs CI Node 24.
- Python deps lower-bound only (`>=`); pins live in `uv.lock`. Dependabot: npm/pip/actions weekly; pip ecosystem vs `uv.lock` freshness unverified.
- Dev deps are an **extra** (`uv sync --extra dev`), not a uv group.

## 4. Overlapping functionality (observed, no action)

- 3 test stacks (node --test / Playwright / pytest) — different scopes, keep.
- `ATHENA_MASTER_SPEC.md:192` mandates vitest+jsdom — not installed; actual = node --test (doc drift, see DOCUMENTATION_AUDIT A12).
- Two lock implementations: `backend/.../lockfile.py` (filelock, live) vs `src/lockfile.ts` (dead, DC7).
- Two env loaders (python-dotenv / dotenv) — per-runtime, expected.
- `prometheus-client` NOT a dependency — metrics are hand-rolled text (`metrics/prometheus.py:64`).

## 5. CI coverage

- `ci.yml` quality: npm ci → lint → build (hard). backend-quality: ruff (all `continue-on-error`), pytest (hard). health job: re-runs tsc+ruff+tests+build behind `needs:` (duplication — see DUPLICATES D7).
- **Hard ruff gate = `health.mjs:7` RUFF_BASELINE 81 only.**
- Not run anywhere: **mypy** (AGENTS §5 requires), coverage.

## 6. Uncertainties

1. Guarded `try/except ImportError` deps (sentence-transformers, pdfplumber, playwright) — referenced, not proven required; removal degrades features, doesn't crash.
2. One dynamic third-party import: `server.ts:644` (`await import("vite")`). No plugin/reflection loading found.
3. `uv lock --check` not run (read-only); sync status inferred structurally.
4. Removing `pytest-cov` silently drops `--cov` option (plugin autoload).
