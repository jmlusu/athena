# DOCUMENTATION AUDIT — Current (Phase 1, read-only)

**Baseline:** `d674075` · 68 tracked `*.md` · accuracy spot-checks vs code · `git log -1` recency.
**Note:** Archived copies under `docs/archive/repo-audit/` are historical; this file is CURRENT.

## 1. Inventory & status

| Location | # | Status summary |
|---|---:|---|
| Root | 6 | README/ARCHITECTURE/AGENTS/PROTOCOL = CURRENT (drift below); ATHENA_MASTER_SPEC = **STALE**; CHANGELOG = **STALE** |
| `docs/` root | 5 | DATA_STORES, METRICS_REGISTRY_GUIDE, REPOSITORY_HEALTH = CURRENT w/ drift; PRS_TRACEABILITY_MATRIX = **SUPERSEDED**; agent-authority-matrix = **ORPHAN** |
| `docs/specs/` | 5 | right-pane/real-data-pipeline = CURRENT; legacy-cleanup, remaining-items-remediation = **EXECUTED**; scraper-discovery-gap = STALE/OPEN |
| `docs/implementation-plans/` | 2 | LEGACY_RETIREMENT_PLAN, PDF_GENERATION_PLAN = **SUPERSEDED/EXECUTED** |
| `docs/integration/` | 1 | AI_PROVIDER_INTEGRATION = CURRENT (paths valid) |
| `repo-audit/` | 4→11 | refreshed this phase |
| `tasks/` | 2 | EXECUTED (21/21 checked) |
| `docs/archive/` | 43 | historical — do not treat as current (AGENTS §2) |

## 2. Accuracy findings (path:line evidence)

### README.md
- **A1** :112 — "14 scrapers (…ReliefWeb…)" → registry has 14 **without** ReliefWeb (`scrapers/__init__.py`); no ReliefWeb/Devex class exists.
- **A2** :106 — `VITE_ATHENA_API_BASE` row dead (C4) → delete.
- **A3** :146-148 — CI lists 2 jobs; `ci.yml` has 3 (`health`).
- **A4 VERIFIED OK** — 58 unit tests, 102 backend pass, `npm run health`, doc index links, ATS 40/35/15/10.

### ARCHITECTURE.md
- **A5** :33 — "31 CRUD endpoints" → actual **36+9+1+health = 46**; stale "31" also at DATA_STORES:43, ARCHITECTURE_MAP:17.
- **A6** :44 — lists `documents/humanizer` as live; zero callers (D3/DC4).
- **A7** :45,94 — automation 7-stage submitter presented as wired; no importer (DC5). `/ai/submit-application` explicitly "no actual submission" (`base.py:73-77`).
- **A8** :48 — `adapters/` presented as domain module; orphan (DC4).
- **A9** :187 — "FastAPI (E2E) 8001" → actually 8000.
- **A10 VERIFIED OK** — 14 scrapers, ports 3000/8000, scheduler 4h/30m/1d, provider factory, middleware chain, metrics mount, no SQL/queue.

### ATHENA_MASTER_SPEC.md (oldest live doc, 2026-09-26)
- **A11 HIGH** :181-182 — docker-compose ✅ + `deploy/oci-deploy.sh` ✅ → **neither exists**; contradicts ARCHITECTURE:215.
- **A12** :192 — mandates vitest+jsdom → not installed (node --test).
- **A13** :57 — react-router v7 → no dep; view switcher.
- **A14** :102 — port 8530 (nginx) → real 3000; nginx config nowhere.
- **A15** :53 — "28 endpoints" → 46. **A16** :159-167 — old brand hexes (Navy/Red/Cyan) = 0 occurrences in src/ (orange #F97316 is real). **A17** :35 — ReliefWeb/Devex persona sources (A1).
- **A18 VERIFIED OK** — 14 scrapers, weights, HITL enforcement, JSONL, scheduler.

### docs/REPOSITORY_HEALTH.md
- **A19** :13 — tracked files 178 → actual **185**. **A20** :49 — debt #3 (metrics registry never reimplemented) now **FALSE** (`aff4a37` landed it) → close row.
- **A21** :50 — debt #4 line ranges stale (humanizer refs at :17,:22,:291; `factory.py` OmniRoute comment doesn't exist).
- **A22** :24 vs :60 — "10 areas" vs health.mjs records 11. **A23** :26 — diff stats stale (13 commits/162 files now). **A24** :58 — refs `repo-audit/INVENTORY.md` (now regenerated ✅).
- **A25 VERIFIED OK** — ruff baseline 81, 58 test line.

### docs/DATA_STORES.md
- **A26** :21-22 — PostgreSQL/Redis "Configured only, not active" → **no DATABASE_URL/REDIS_URL anywhere in code/env/CI**; prod example itself says "NO PostgreSQL, NO Redis" → status = "not configured".
- **A27** :218,241 — lists `src/lockfile.ts` as active consumer → zero importers (DC7).
- **A28** :43 — "31 endpoints" (A5). **A29** — ARCHITECTURE:61 blurs Python vs Node lock namespaces.

### docs/METRICS_REGISTRY_GUIDE.md
- **A31** :20,37,49,78,94 — samples import `@/lib/athena/metrics-registry` → resolves to nonexistent `<root>/lib/...`; 0 `@/` imports exist in repo; real consumer uses relative import (C21).
- **A32** — `test_prometheus_metrics.py:3-5` claims registry tests at deleted `frontend/...` path → nonexistent.
- **A33 VERIFIED OK** — canonical registry path, adoption claim, ATS constants.

### Governance
- **A34** `AGENTS.md:17` — points to `docs/integration/MERGE_DECISIONS.md` → only `docs/archive/integration/` exists → new decisions have no home.
- **A35** `AGENTS.md:108` — requires versioned prompts in `backend/src/athena/ai/prompts/` → dir never existed; prompts inline in gemini.py; §7 claim "copy prompts from server.ts" false (0 prompts there).
- **A36** `docs/agent-authority-matrix.md` — zero inbound refs; A0–A4 taxonomy overlaps/differs from AGENTS §5-6 and PROTOCOL R0–R5; §15 "database destroy permissions" contradicts no-SQL reality; example cites nonexistent `docs/ARCHITECTURE.md`.
- **A37** — force-push: AGENTS bans outright, matrix bans only for protected branches (mild divergence).
- **A38 VERIFIED OK** — AGENTS:167 → PROTOCOL exists + health allowlisted; AGENTS §2 map paths exist (except A34/A35); "81 ruff" matches.

### CHANGELOG.md
- **A39 HIGH** — last updated 2026-10-01; **11 commits + v2.4.0 section missing** (metrics registry, health cmd, docs consolidation, fork removal, ruff baseline).
- **A40** :127-135 — runnable-broken commands `cd frontend && pnpm ...`; :52/:65-66 docker/vitest claims; :63-64 test counts.

### repo-audit self-drift (fixed this phase)
- **A42** ARCHITECTURE_MAP: `ATHENA_AGENT_RULES.md` (renamed), "31 endpoints", "16 test files" (14), archive-candidate paths now under archive/, "factory.py:27 comment" (absent).
- **A43** CLEANUP_PLAN:3 "PROPOSED — nothing deleted yet" while Waves 1–3 executed.
- **A44** OPEN_QUESTIONS: Q3/Q7/Q12/Q13 resolved in git but unmarked.

## 3. Broken path references (live docs only)

`AGENTS.md:17` · `AGENTS.md:108` · `ATHENA_MASTER_SPEC.md:182` · `repo-audit/ARCHITECTURE_MAP.md:20,68-70` · `docs/specs/scraper-discovery-gap.md:6` · `docs/PRS_TRACEABILITY_MATRIX.md` (36 refs to deleted `frontend/`) · `docs/agent-authority-matrix.md:949` · `CHANGELOG.md:127-135` (runnable-broken) · `docs/METRICS_REGISTRY_GUIDE` samples · `test_prometheus_metrics.py:3` · `METRICS_REGISTRY_GUIDE` vs `REPOSITORY_HEALTH.md:49`.

## 4. Sprawl dispositions

| Item | Disposition | Risk |
|---|---|---|
| `docs/specs/legacy-cleanup.md`, `remaining-items-remediation.md`, `PDF_GENERATION_PLAN.md` | ARCHIVE (executed) | R1 |
| `docs/implementation-plans/LEGACY_RETIREMENT_PLAN.md` | ARCHIVE (superseded) | R2 (check inbound basename refs) |
| `docs/PRS_TRACEABILITY_MATRIX.md` | ARCHIVE (dead tree mapping) | R2 |
| `tasks/plan.md`, `tasks/todo.md` | ARCHIVE or DELETE per Q11 | R1 |
| `docs/agent-authority-matrix.md` | UPDATE (cross-link/merge into PROTOCOL, fix §15) — don't silently delete | R2 |
| `ATHENA_MASTER_SPEC.md` | UPDATE deployment/testing/ports/endpoints/brand sections | **R3** (spec-of-record) |
| `CHANGELOG.md` | UPDATE: add [2.4.0]; remove broken frontend commands | R1 |
| `docs/REPOSITORY_HEALTH.md` | UPDATE: 185, 11 areas, close debt #3, fix #4 ranges, refresh stats | R1 |
| `docs/DATA_STORES.md` | UPDATE: A26/A27/A28 fixes | R1 |
| `docs/METRICS_REGISTRY_GUIDE.md` | UPDATE: fix 5 import samples (or alias, C21) | R1 |
| `README.md` | UPDATE: A1/A2/A3 | R1 |
| `ARCHITECTURE.md` | UPDATE: A5-A9 (humanizer/adapters/automation accuracy post-rulings) | R1/R2 |
| `repo-audit/*` (self) | refreshed this phase | R1 |

Root loose `.md` = 6, all health-allowlisted — within policy, no action.

## 5. Uncertainties

- Tests/health not re-executed during this doc pass (Phase 0 results used); E2E 57/66 accepted as reported by `a30b194` + results artifact.
- `agent-authority-matrix` orphan status is reference-based within repo; external consumers (opencode config, other repos) invisible from here.
- `docs/archive/` (43 files) not re-validated — historical by policy.
- DC5 (automation reachability) not excluded via reflection — none found in tracked entry points.
