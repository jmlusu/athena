# DEAD CODE / ORPHANS — Current (Phase 1, read-only)

**Baseline:** `d674075` · import-graph closure from `src/main.tsx` (frontend) and `backend/src/athena/api/app.py` (backend), cross-checked vs package.json, CI, docs.
**Rule applied:** dynamic/config-based loading counts as REFERENCED; ambiguous → flagged, never declared dead. No files deleted.

## Definitely dead (evidence-backed)

| ID | Item | Evidence | Disposition | Risk |
|---|---|---|---|---|
| DC4 | `backend/src/athena/adapters/` (2 files, 203 LOC) | zero importers in src/tests/e2e/server.ts; only prose refs (ARCHITECTURE:48, CHANGELOG:31) | DELETE or wire into a route; sole prod importer of status_mapping.py (DC9a) | **R2** |
| DC6 | `backend/src/athena/api/server.py` (30 LOC) | orphan entry point; all launch paths use `uvicorn athena.api.app:app` | DELETE | **R1** |
| DC7 | `src/lockfile.ts` (200 LOC) + 5 dead lock methods in `src/api.ts:176-182` | zero importers; `tryReadLockContent` is a stub returning null; server side (`server.ts:134-297`) is live | DELETE + fix `docs/DATA_STORES.md:218,241` | **R2** |
| DC1 | `scripts/test_profile.json` | zero refs outside OPEN_QUESTIONS | DELETE | **R1** |
| DC1 | `scripts/seed_data.py`, `scripts/setup-git-hooks.sh` | unreferenced by package.json/CI/tests; hooks script installs nothing (.git/hooks = samples only) | confirm-then-DELETE or wire | **R1** |
| DC3a | `.npmrc` (0 bytes) | empty; only cited by superseded plan | DELETE (+ `.gitattributes:3`) | **R1** |
| DC16 | 16 stale path references in live docs | e.g. `AGENTS.md:17` → nonexistent `docs/integration/MERGE_DECISIONS.md`; `repo-audit/*` → `ATHENA_AGENT_RULES.md`; `test_prometheus_metrics.py:3` → nonexistent frontend test; `METRICS_REGISTRY_GUIDE` samples `@/lib/...` unresolvable | FIX refs | **R1** |

## Ambiguous / needs ruling

| ID | Item | Evidence | Options | Risk |
|---|---|---|---|---|
| DC5 | `backend/src/athena/automation/` (4 files, ~1,827 LOC) — **disabled feature, NOT proven dead** | never imported (only mypy override `pyproject:93`); no route references it; BUT ARCHITECTURE.md:45 documents the 7-stage submitter as live | (a) add endpoint (b) archive (c) keep as planned | **R3 — STOP condition (ambiguous deletion)** |
| DC5a | `submitter.py:95` dynamic import of nonexistent `athena.executor.hitl_gate` | guarded by try/except → falls back; `ATHENA_HITL_EXTERNAL` branch unreachable | fix or remove branch | **R1** |
| DC9a | `models/status_mapping.py` | importers = dead adapters (DC4) + its own test | follows D1/DC4 ruling | **R2** |
| DC10 | `src/api.ts` ~34 of ~40 methods uncalled | features call raw `fetch` instead (DocumentStudioView:163, FormFillerView:81, N8nIntegrationView:44) | trim or adopt (mirror routes — safe but design choice) | **R2** |
| DC11 | `metrics-registry.ts` 6 of 15 exports unused in code | documented API, guide mandates adoption | KEEP (PLANNED) | R1 |
| DC3c/DC3d | `Caddyfile` + `backend/Dockerfile` | orphan; proxy targets deleted service; no compose/CI consumer | delete OR restore deployment stack (same ruling as D12) | **R2** |
| DC1/DC2 | `tasks/plan.md`, `tasks/todo.md` | all `[x]` complete, no consumers | ARCHIVE/DELETE (Q11) | **R1** |
| DC19 | `backend/run_backend_test.{bat,py}` | unreferenced (D6) | consolidate → keep .py | **R1/R2** |
| DC1a | `scripts/build_profile_payload.py` **broken from clean clone** — reads `profile/*.md` files that don't exist | FileNotFoundError; runbook `docs/specs/remaining-items-remediation.md:56,158` unrunnable | fix inputs or archive | **R2** |

## Planned / disabled — explicitly NOT dead

- OmniRoute/local GGUF: PLANNED (`factory.py` branches gemini/fallback only; base.py:27 docstring).
- `humanizer.py:16-24 + 285-318` (`ai_company` import): unreachable but GUARDED — dies with D3 ruling, not standalone.
- `LEGACY_RETIREMENT_PLAN.md`: superseded (target `backend/` was deleted then restored `d539649`) → ARCHIVE (D13).

## Test debt (confirmed causes)

- **8 skipped pytest:** `test_pdf_generation.py:17-20` skipif on WeasyPrint/GTK (absent on Windows). No unconditional skips.
- **E2E 57/66:** 9 failures = 3 distinct × 3 browsers, all `real-data.spec.ts` (pagination ceiling, profile roundtrip, pager UI) — matches `REPOSITORY_HEALTH.md` exactly; confirmed via `e2e/test-results/aistudio-results.json`.
- Missing tests: none for `src/api.ts`, `metrics-registry.ts` despite doc claims (DC16 #6).
- Clean: **no commented-out code blocks**, no `if False`, no `@ts-ignore` anywhere.

## Untracked junk — Phase 2 local sanitation candidates (NO deletion now)

Root: `backend.err`, `backend.log`, `backend_uvicorn.log`, `frontend.err`, `frontend.log`, `build_out.txt`, `test_unit_out.txt` · `backend/{fix_output,pytest_out,remaining,ruff_output}.txt` · caches (`dist/`, `.pytest_cache/`, `.ruff_cache/`, `__pycache__/`, `athena.egg-info/`) · `.superpowers/` · stale branch `chore/legacy-retirement` (merged).
**NOT candidates:** `profile/`, `company/athena/`, `artifacts/`, `.env`, `e2e/test-results/aistudio-results.json` (keep until E2E re-verified).

## Positive confirmations

- No tracked generated artifacts (health.mjs generated-artifacts scan = empty).
- Frontend reachability: only `src/lockfile.ts` orphan; `athena-mapper.ts` and `src/types.ts` exports all consumed.
- `.env` correctly ignored, never tracked.

## Recommended execution order

R1 batch (DC1, DC3a, DC6, DC16, DC19) → R2 batch (DC4, DC7, DC10, DC3c/d, docs) → **STOP** on DC5 (automation/, R3 ambiguous deletion) and D3 humanizer.
