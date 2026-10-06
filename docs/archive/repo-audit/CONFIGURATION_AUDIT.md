# CONFIGURATION AUDIT

> Requirement: an agent must never guess which file controls a behavior.

---

## Environment files

| File | Tracked | Status | Verdict |
|---|---|---|---|
| `.env.example` (root) | yes | 18 keys; matches README + real code | **CANONICAL** |
| `.env` (root) | no (ignored) | Local secrets: `ATHENA_API_KEY`, `GEMINI_API_KEY` set | KEEP local, never track |
| `backend/.env.production.example` | yes | 24 keys: `DATABASE_URL`, `REDIS_URL`, `SMTP_*`, `SECRET_KEY` — **none implemented** (ARCHITECTURE.md: no SQL, no queue, no email) | **OBSOLETE → DELETE** (or rewrite to reflect reality) |
| `.env.local`, `.env.staging`, `.env.production` | no | Ignored, absent | OK |

**Discrepancy:** root `.env.example` has `VITE_ATHENA_API_BASE` while commit `2854e41`
claims "dead VITE_ATHENA_API_BASE removed" — verify whether `.env.example` line is stale.

**Action:** keep single `.env.example` at root; delete/rewrite `backend/.env.production.example`.

---

## Code/behavior configuration

| Concern | File | Status |
|---|---|---|
| Python deps + tool config (ruff/mypy/pytest/coverage) | `backend/pyproject.toml` | Canonical; fix ruff `extend-exclude` dead paths (DUPLICATES D6) |
| Python lockfile | `backend/uv.lock` | Canonical, consistent |
| Node deps | `package.json` + `package-lock.json` | Canonical; remove unused deps (DEAD_CODE) |
| TS compiler | `tsconfig.json` | Canonical |
| Build/dev server | `vite.config.ts` | Canonical |
| E2E | `e2e/playwright.config.ts` | Canonical |
| Reverse proxy | `Caddyfile` (210 B) | Dormant (no deployment target) — INVESTIGATE |
| API auth mode / CORS / rate limit | env vars (`ATHENA_AUTH_MODE`, `ATHENA_CORS_ORIGINS`, `ATHENA_RATE_LIMIT`) | Canonical via env |
| AI provider selection | `ATHENA_AI_PROVIDER` env → `ai/providers/factory.py` | Canonical; only `gemini`/`fallback` implemented |
| Scheduler | `ATHENA_SCHEDULER_AUTOSTART` + `scheduler/jobs.py` constants (4h/30m/1d) | Canonical |

---

## Competing configuration systems — RESOLUTION

1. **Two env examples** → root `.env.example` wins; backend production example deleted/rewritten.
2. **Two AI configs** → Python `ai/providers/` is the only provider layer. Frontend must never
   hold provider config (`GEMINI_API_KEY` server-side only — already true).
3. **Mock vs real data** → `src/data/mockData.ts` is fallback, not config; documented in
   ARCHITECTURE §4.3 as pending work. KEEP until wiring completes.

---

## Secrets inventory (see SECURITY_AUDIT.md)

- `.env` untracked ✓; `.env` ignored ✓; `.env.example` contains placeholders only ✓
- One literal `"dev-admin-key"` in `scripts/cleanup_*.ps1` (default dev value — delete scripts)
- Placeholder `YOUR_GEMINI_API_KEY` in docs spec — harmless but tidy up
