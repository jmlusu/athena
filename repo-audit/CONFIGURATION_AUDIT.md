# CONFIGURATION AUDIT — Current (Phase 1, read-only)

**Baseline:** `d674075` · static analysis only (no tests executed). Env matrix + .gitignore + CI + tool configs + server/app config surface.

## Env-var matrix (summary)

| Class | Vars |
|---|---|
| Read, documented in `.env.example` | GEMINI_API_KEY, ATHENA_API_KEY, AUTH_MODE, CORS_ORIGINS, RATE_LIMIT, DATA_DIR, SCHEDULER_AUTOSTART, DEFAULT_SCRAPE_{QUERY,MAX}, MAX_CONCURRENT_SCRAPERS, SCRAPE_SOURCE_TIMEOUT, SHORT_SOURCE_TIMEOUT, SOURCE_FAILURE_THRESHOLD, ALLOW_MULTIPLE_INSTANCES, NODE_ENV, DISABLE_HMR, ATHENA_BACKEND_URL, ATHENA_BACKEND_TIMEOUT_MS |
| Read, **documented nowhere** | `GEMINI_MODEL`, `ATHENA_ADMIN_KEY/APPROVE_KEY/RUN_KEY` (legacy auth aliases!), `ATHENA_AGENT_ID`, `ATHENA_DEFAULT_SCRAPE_LOCATION`, `AISTUDIO_PREVIEW`, `PORT`/`HOST` (python), `NODE_ENV=development_cloud` |
| Documented, **never read** | `ATHENA_N8N_WEBHOOK_URL` (real URL hardcoded in `fallback.py:447`), `VITE_ATHENA_API_BASE` (README:106 only) |

Full per-var read sites/defaults verified against `backend/**/*.py`, `server.ts`, `vite.config.ts`, e2e.

## Findings

| ID | Finding | Evidence | Disposition | Risk |
|---|---|---|---|---|
| **C1** | **`ATHENA_AI_PROVIDER` missing from canonical `.env.example`** (AGENTS §9 names it THE switch); CHANGELOG:50 claims it's there | `.env.example` (44 lines) vs `factory.py:19`; only in prod example | add `ATHENA_AI_PROVIDER=fallback`; fix CHANGELOG | **R2** |
| **C2** | 8+ read vars undocumented in either example (incl. 3 legacy key aliases = silent auth-surface extension) | matrix above | document in "advanced/legacy" block or remove aliases | **R2** |
| **C3** | `ATHENA_N8N_WEBHOOK_URL` dead; real target hardcoded | ARCHITECTURE:71, prod example:51 vs `fallback.py:447` literal | wire var OR delete doc + remove literal | **R2** |
| **C4** | `VITE_ATHENA_API_BASE` documented but dead; default claim wrong (`/api` not `/api/v1/athena`) | README:106 vs `src/api.ts:41` | delete README row | **R1** |
| **C5** | Dev/prod example var sets diverge (prod lacks BFF section; dev lacks HOST/PORT/TEST_MODE/HSTS/AI_PROVIDER) | `.env.example` vs `backend/.env.production.example` | make root the superset; prod = values only | **R2** |
| **C6** | `.env.example` `ATHENA_DATA_DIR=./company/athena` is relative while its own comment demands absolute → cwd-dependent data dir | `.env.example:9-11`, `paths.py:17` | ship unset/absolute placeholder | **R2** |
| **C7** | README prod path (`npm start`) + example `NODE_ENV=development` → blank-page branch the example warns about | `.env.example:31-36`, `server.ts:642`, README:85-91 | set `NODE_ENV=production` in README prod steps | **R2** |
| **C8** | Divergent dotenv semantics: Node reads cwd `.env`, Python walks up from file | `server.ts:10` vs `app.py:36` | document "run from repo root" or pin path | **R1** |
| **C9** | **`.gitignore` gap: `company/` root not ignored (only `company/athena/`)** | `.gitignore:55`; `git check-ignore company/foo.txt` → no match | change rule to `company/` (nothing tracked under it) | **R2** |
| **C10** | Root `.venv/`/`venv/` not ignored | `.gitignore:3` only backend | add rules | **R1** |
| **C11** | Unanchored rules could hide future source dirs (`build/`, `test-results/`, `profile/`, `dist/`) | verified `src/build/x` ignored | anchor root-only entries with `/` | **R1** |
| **C12** | Redundant/dead ignore rules (`.pytest_cache` ×2, `athena/company/`, per-file jsonl, `remaining.txt`) | `.gitignore:4,15,56,57-59,81` | collapse | **R1** |
| **C13** | All 10 requested ignore checks CLEAN; zero junk/log/env tracked | `git check-ignore -v`, `git ls-files` | no issue | R0 |
| **C14** | Ruff: only hard gate = `health.mjs:7` baseline 81; `ruff format --check` advisory; CI `--fix` step mutates then measures (masking); baseline never ratchets down | `ci.yml:58-67` | drop `--fix`, hard format gate, ratchet baseline in fix PRs | **R2** |
| **C15** | AGENTS §8 gaps: **mypy never in CI** (§5 mandates it); `npm run test:unit` only runs inside health job which is `needs:`-skipped on failure | ci.yml:74, no mypy ref | add mypy advisory + direct test:unit step | **R2** |
| **C16** | CI double-runs all gates (quality then health) | ci.yml:33/36/62/70 vs health.mjs | de-duplicate (D7) | **R1** |
| **C17** | Mixed action pinning: checkout/setup-uv SHA-pinned; setup-node/cache/upload-artifact floating tags; Dockerfile `uv:latest` | ci.yml:24,80; e2e.yml:40,60; Dockerfile:12 | pin all to SHA (dependabot maintains) | **R2** |
| **C19** | health.mjs hardcodes `/58` test count; stale baseline "41" in remediation doc | health.mjs:129 | drop literal | **R1** |
| **C21** | vite/tsconfig `@` alias unused (0 `@/` imports) and METRICS_REGISTRY_GUIDE samples use `@/lib/...` which resolves to nonexistent root path | vite.config.ts:11, tsconfig:20-24, guide:20,37,49,78,94 | fix samples (relative) or repoint alias to src/ | **R2** |
| **C22** | ruff `extend-exclude` stale: default no-ops + `"tests/"` → **all 14 backend test files never linted**; dead mypy override for excluded package | pyproject:51,84-101 | trim excludes; delete dead override | **R2** |
| **C23** | pytest marker `weasyprint` registered, never applied (0 `@pytest.mark.` in tests) | pyproject:110-112 | decorate or drop marker | **R1** |
| **C24** | `.npmrc` empty + no Node version pin outside CI | `.npmrc` 0 B; no engines/.nvmrc | add `engines.node >=24`; drop `.npmrc` deliberately | **R1** |
| **C25** | `.gitattributes:1-3` merge drivers for nonexistent pnpm files; driver only installed by a script that installs nothing | `.gitattributes:1-3`, `setup-git-hooks.sh` | drop lines 1-3 (keep 5-6 eol rules) | **R1** |
| **C26** | Caddyfile + Dockerfile reference deleted stack (`frontend:3000`, no compose) | Caddyfile:8,12; ARCHITECTURE:215 | same ruling as D12 | **R2** |
| **C27** | BFF `PORT=3000` + bind `0.0.0.0` hardcoded (backend has env knobs) | server.ts:92,664 | env-driven PORT/HOST optional | **R2** |
| **C28** | Prod static dir from `process.cwd()`, dev from `__dirname` → cwd-sensitive prod serving | server.ts:653 vs 656-659 | derive both from REPO_ROOT | **R1** |
| **C29** | **Fail-open dev key: `_DEV_API_KEY="dev-admin-key"` accepted when key env unset/empty; prod example ships `ATHENA_API_KEY=""` → example-driven deploy = auth bypass** | `app.py:114,127-130`; prod example:15 | fail-closed (refuse non-loopback without real key); `CHANGE_ME` sentinel in example | **R3 (security — also S1)** |
| **C30** | CORS fallback still lists legacy `:8530` origins + port-80 `http://localhost` | app.py:286-293 | drop stale entries | **R1** |
| **C31** | `ATHENA_AUTH_MODE=open` guard checks `ATHENA_HOST` env, not actual bind (uvicorn CLI `--host 0.0.0.0` bypasses) | app.py:278-283; Dockerfile:29; e2e:78 | validate effective bind | **R2** |
| **C32** | `/api/health` leaks `BACKEND_URL` + `hasBackendKey` (config oracle) | server.ts:108-115 | collapse fields | **R1** |
| **C33** | No port SSOT: 3000 ×9, 8000 ×8; ARCHITECTURE:187 says E2E uses 8001 (actually 8000); MASTER_SPEC:102 says 8530; UI hardcodes `localhost:3000` (N8nIntegrationView:17) | multiple | fix docs; relative URL in UI | **R1/R2** |

## Clean (verified no issue)

tsconfig `strict: true` · `.env` ignored & never tracked · e2e.yml hard gate + least-privilege permissions · dependabot present · `ATHENA_BACKEND_URL/TIMEOUT_MS` env-driven with correct defaults · `/api/v1/athena` prefix consistent across server.ts/app.py/docs · health-gate job exists · no `curl|bash`, no npm lifecycle scripts, no sudo.

## Uncertainties

- Whether legacy key aliases (ADMIN/APPROVE/RUN) are intentionally supported → C2 needs ruling.
- `git check-ignore` reports empty-pattern line 82 for `company/` — mechanism unexplained; empirical result (not ignored) is the actionable fact.
- Exact current ruff count not re-measured beyond baseline definition (Phase 0 measured: 81 = baseline, no new).
