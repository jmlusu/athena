# DUPLICATES — Current (Phase 1, read-only)

**Baseline:** `d674075` · MD5 sweep of all 185 tracked files + symbol/env/port greps + doc recency (`git log -1`).
**Legend:** disposition KEEP / CONSOLIDATE / ARCHIVE / DELETE / INVESTIGATE · risk R1 (agent) / R2 (agent+validation) / R3 (human approval).
**Note:** Supersedes archived `docs/archive/repo-audit/DUPLICATES.md`; prior waves (fork removal, docs consolidation) already executed.

## Findings

| ID | Finding | Evidence | Disposition | Risk |
|---|---|---|---|---|
| **D1** | **Two JobStatus↔PipelineStatus maps that DISAGREE** (`scored`→tailored vs evaluated; `rejected`→evaluated vs submitted) | `athena-mapper.ts:44-55` vs `backend/src/athena/models/status_mapping.py:6-28`; consumers `server.ts:515-531`, `adapters/ai_studio.py:10` | One authoritative mapping + cross-language contract test | **R3** |
| **D2** | ATS threshold literals (90/80) in ≥7 places, contradicting the registry's own rule | canonical `src/lib/athena/metrics-registry.ts:3-5`; copies: PipelineView:88, ScraperDiscoveryView:130, OpportunityDetailModal:39, athena-mapper:59, scorer.py:433, engine.py:145, fallback.py:57 | Frontend → registry imports; backend → one shared module | **R3** |
| **D3** | `documents/humanizer.py` (586 LOC) = parallel DEAD humanization stack; live path is AI provider | zero callers (only `documents/__init__.py` re-exports); live: `ai_routes.py:98-108` → gemini/fallback; ARCHITECTURE.md:44 wrongly lists it as live | INVESTIGATE → delete or wire; never keep two prompt stacks | **R3** |
| **D4** | Backend test fixtures copy-pasted ×5 while `conftest.py` exists | `client` fixture ×5, `HEADERS`/`dev-admin-key` ×5, `BASE` ×3; `conftest.py` defines none | Consolidate into conftest fixtures | **R3** |
| **D5** | Profile fixtures duplicated, one drifting | `scripts/test_profile.json` ≈ `src/data/mockData.ts:4-75` (differs only in name) + zero code refs; canonical seed = `scripts/profile_schema.json` | DELETE test_profile.json (after ref check) | **R2** |
| **D6** | Two identical backend runners; stale git-hook script | `backend/run_backend_test.{bat,py}` (identical env+uvicorn); `setup-git-hooks.sh` registers pnpm merge drivers, installs no hooks | Keep .py, DELETE .bat; DELETE/narrow hooks script | **R2**/**R1** |
| **D7** | CI runs every gate twice (quality/backend-quality then health job re-runs all) | `ci.yml:33,36,62,70` vs `health.mjs:101-135` | De-duplicate execution (keep both concerns) | **R2** |
| **D8** | Two example env files, divergent var sets; key switch missing from canonical | `.env.example` (18) vs `backend/.env.production.example` (19); `ATHENA_AI_PROVIDER` absent from root; health.mjs:94 requires both | Consolidate to superset `.env.example` + prod-delta; update health | **R2** |
| **D9** | Ports/URLs hardcoded in 4+ places; stale CORS origins | 3000 ×9, 8000 ×8; `app.py:286-293` fallback still lists legacy `:8530` | Code defaults OK; drop `:8530`; PORT env-driven optional | **R1/R2** |
| **D10** | Architecture doc cluster | `ARCHITECTURE.md` = CANONICAL; `repo-audit/ARCHITECTURE_MAP.md` = index (stale rows); `docs/DATA_STORES.md` falsely lists PostgreSQL/Redis as "configured" | KEEP canonical; fix stale rows | **R1** |
| **D11** | `ATHENA_MASTER_SPEC.md` (oldest live doc) contradicts tree | :181 docker-compose ✅ (absent), :192 vitest (absent), :102 port 8530, :53 "28 endpoints" (46) | UPDATE spec — product doc → owner sign-off | **R3** |
| **D12** | Deployment artifacts orphaned | `Caddyfile:8` proxies deleted `frontend:3000`; `backend/Dockerfile` unreferenced; ARCHITECTURE.md:215 says stack removed | One decision: delete both or restore compose | **R2** |
| **D13** | Executed plans still in live tree | `docs/specs/legacy-cleanup.md`, `docs/implementation-plans/LEGACY_RETIREMENT_PLAN.md` (49 unchecked, target gone), `remaining-items-remediation.md`, `PDF_GENERATION_PLAN.md`; `tasks/` 21/21 done | ARCHIVE plans; delete/archive tasks scratch | **R1/R2** |
| **D14** | Governance triplicate | AGENTS.md (canonical) + PROTOCOL + `docs/agent-authority-matrix.md` (879 L, 0 inbound refs, A0–A4 taxonomy vs R0–R5, stale DB-permissions §15) | Cross-link or merge matrix into PROTOCOL | **R2** |
| **D15** | Misc stale refs in live docs | README:106 dead `VITE_ATHENA_API_BASE`; PRS_TRACEABILITY_MATRIX = 36 refs into deleted `frontend/`; AGENTS:108 requires nonexistent `ai/prompts/`; scraper-discovery-gap dead ref | DELETE row / ARCHIVE matrix / fix rule | **R1/R2** |

## Confirmed NO duplicates

- **Byte-identical tracked files:** 0 (MD5 sweep of 185 files).
- **Naming debt** (`*_v2/*_new/*_backup/*copy*`): 0 in tracked files.
- `scripts/` vs `backend/scripts/`: latter doesn't exist. `tests/` vs `backend/tests/`: language split, not duplication.
- camelCase/snake_case coercion helpers: defined once (`server.ts:370,381`); mapper imported not reimplemented.
- E2E specs: no overlapping test names. `athena-mapper.ts` exports: all 19 consumed.

## Priority order

1. D1 + D3 (correctness) · 2. D2 (rule violation) · 3. D4/D5 (test/fixture hygiene) · 4. D10/D11/D15 (doc-vs-tree) · 5. D8/D9/D6/D7 (config/scripts/CI) · 6. D13/D14 (archive/link).

## Uncertainties

- D1 maps may be intentionally directional — owner ruling required before edit (R3).
- D3 static grep can't prove no reflection-based use; `MERGE_DECISIONS.md` DEC-004 historically decided to port prompts into `humanizer.py` — recorded history vs current reality conflict.
- D7 duplication may be deliberate belt-and-braces; cost issue, not correctness.
