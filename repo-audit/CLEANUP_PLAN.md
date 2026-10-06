# CLEANUP PLAN — Proposed Dispositions (Phase 1 refresh — APPROVAL REQUIRED BEFORE EXECUTION)

**Status:** REFRESHED at `d674075` from the Phase 1 read-only audit. **Nothing deleted in this phase.**
Supersedes the 2026-10-06 plan; archived copy: `docs/archive/repo-audit/`.

Legend: **KEEP** · **CONSOLIDATE** · **ARCHIVE** · **DELETE** · **FIX** · **INVESTIGATE** · risk R1–R5.

---

## 0. Already executed (prior waves — recorded, no action)

| Wave | Status | Evidence |
|---|---|---|
| Tracked generated artifacts untracked (npy/egg-info/jsonl/logs) | **DONE** | `6ea0ea3`, `d674075`; health generated-artifacts scan = clean |
| Stale `athena/` fork + one-off cleanup scripts deleted | **DONE** | `568cead` |
| Docs consolidated into `docs/` + archive separation | **DONE** | `ce48633` |
| `ATHENA_AGENT_RULES.md` → `AGENTS.md` | **DONE** | `be31414` |
| Unused npm deps dropped; config aligned with reality | **DONE** | `ab09821` (npm = 0 unused now) |
| `npm run health` + CI health gate | **DONE** | `be14655`, `f86b704` |
| Metrics registry implemented | **DONE** | `aff4a37` |
| README repo map + `docs/REPOSITORY_HEALTH.md` | **DONE** | `e0662a6`, `2a11d8d` |

---

## Wave A — Low-risk sanitation (Phase 2 eligible, R1/R2, agent-executable)

| # | Action | Items | Refs |
|---|---|---|---|
| A1 | Local delete (ignored junk, no commit) | root `backend.err/.log/_uvicorn.log`, `frontend.err/.log`, `build_out.txt`, `test_unit_out.txt`; `backend/{fix_output,pytest_out,remaining,ruff_output}.txt` | DC20 |
| A2 | `.gitignore` harden | `company/` (gap), `.media/`, root `.venv/`/`venv/`; anchor `/dist/ /build/ /profile/ /test-results/ /AppData/`; drop redundant rules (`.pytest_cache` ×2, `athena/company/`, per-file jsonl, `remaining.txt`) | C9–C12, S17 |
| A3 | Doc fixes (accuracy) | README A1–A3; REPOSITORY_HEALTH A19–A23 (185 files, 11 areas, close debt #3, fix #4); DATA_STORES A26–A29; METRICS_REGISTRY_GUIDE A31 samples; CHANGELOG add `[2.4.0]` + remove broken `cd frontend && pnpm` block; ARCHITECTURE A5–A9 | R1 |
| A4 | Stale-ref fixes | `AGENTS.md:17` (MERGE_DECISIONS path), `test_prometheus_metrics.py:3` docstring, e2e `testIgnore` ghosts, `scraper-discovery-gap` dead ref | DC16 |
| A5 | Config hygiene | drop `.npmrc` (0 B) + `.gitattributes:1-3` pnpm drivers; trim ruff `extend-exclude` (note: removing `tests/` **increases lint scope → baseline re-measure**); delete dead mypy override; pytest marker decision (C23); drop `/58` literal in health.mjs | C22–C25, C19 |
| A6 | Env example sync | add `ATHENA_AI_PROVIDER` + documented block for C2 vars to `.env.example`; delete `VITE_ATHENA_API_BASE`/`ATHENA_N8N_WEBHOOK_URL` rows or wire them; fix `ATHENA_DATA_DIR` relative/absolute contradiction; `NODE_ENV=production` in README prod path | C1–C7 |
| A7 | Archive executed/superseded docs | `docs/specs/{legacy-cleanup,remaining-items-remediation}.md`, `docs/implementation-plans/{LEGACY_RETIREMENT_PLAN,PDF_GENERATION_PLAN}.md`, `docs/PRS_TRACEABILITY_MATRIX.md` → `docs/archive/`; verify inbound refs first | D13, doc dispositions |
| A8 | tasks/ scratch | ARCHIVE `tasks/{plan,todo}.md` (21/21 done) or delete per Q11 | DC2, Q11 |
| A9 | CORS/health quick fixes | drop `:8530` origins (C30); collapse `/api/health` fields (C32/S19); broaden health secret patterns (S23); e2e uvicorn → `127.0.0.1` (S22) | R1 |
| A10 | Git housekeeping (local, ask first) | delete merged local branch `chore/legacy-retirement`; propose stale remote branch cleanup (40+ dependabot/merged) — **remote changes = confirm** | INVENTORY |

**Validation after each group:** `npm run lint && npm run build && npm run test:unit && npm run health` + `cd backend && uv run ruff check . && uv run pytest -q`. One commit per group (§13 atomic commit rule).

## Wave B — Consolidation (Phase 3, per-item procedure + gate approvals)

| # | Item | Disposition | Risk |
|---|---|---|---|
| B1 | D1 divergent status maps | one authoritative mapping + cross-language contract test | **R3** |
| B2 | D2 ATS threshold literals ×7 | frontend → registry; backend → shared module | **R3** |
| B3 | D3 `documents/humanizer.py` dead stack | INVESTIGATE then DELETE (or wire); update ARCHITECTURE A6 | **R3** |
| B4 | DC5 `automation/` (1,827 LOC, unreachable) | **DECIDE: endpoint / archive / keep-planned** — ambiguous deletion = STOP condition | **R3** |
| B5 | DC4 `adapters/` + DC6 `api/server.py` + DC7 `src/lockfile.ts` + DC10 `api.ts` dead methods | DELETE after §6 reference check (grep verified; dynamic check: none found) | **R2** |
| B6 | D4/D5 test fixtures → conftest; delete `scripts/test_profile.json` | CONSOLIDATE/DELETE | **R3/R2** |
| B7 | D6 runners (keep .py), D7 CI de-dup, D8 env examples merge (health.mjs coupling!) | CONSOLIDATE | **R2** |
| B8 | D12/C26 `Caddyfile` + `backend/Dockerfile` | one ruling: delete both OR restore compose stack | **R2** |
| B9 | D14 `docs/agent-authority-matrix.md` | cross-link/merge into PROTOCOL, fix §15 DB section | **R2** |
| B10 | Dependency removals (DEPENDENCY_MAP: structlog, types-requests, pydantic-settings, python-multipart, pytest-cov, lxml pin) | SEARCH→STATIC→BUILD→TEST procedure (Phase 5) | **R2**; mypy removal = **R3** |
| B11 | CI hardening: mypy advisory job, direct `test:unit` step, hard `ruff format`, action SHA-pinning (C14/C15/C17) | MODIFY workflows | **R2** |

## Wave C — Security (Phase 6, APPROVAL GATE 4 — separate track)

| # | Item | Risk |
|---|---|---|
| C-sec1 | **S1/C29 fail-open dev key** → fail-closed + `CHANGE_ME` sentinel + key rotation check | **R3** |
| C-sec2 | **S2 unauthenticated PII reads / S3 BFF auth neutralization** (DEF-008) | **R4** |
| C-sec3 | **S4 stash credential** → `git stash drop` + rotation decision | **R3** |
| C-sec4 | **S5 PII in bundle** (mockData) → fictional fixture | **R3** |
| C-sec5 | **S7/S8/S9 pushed PII history** — needs repo-visibility answer → purge (R5) or documented acceptance | **R5/R4** |
| C-sec6 | S6/S20 tracked PII fixtures → untrack/fictionalize | **R2** |

## Wave D — Architectural (Phase 4, mini-proposal per §7 + GATE 3)

- `ATHENA_MASTER_SPEC.md` reality-update (A11–A17) — product-doc edit.
- Port SSOT (C27/C33): env-driven BFF PORT, UI relative webhook URL.
- Ruff baseline ratchet strategy + test-lint scope change (C22).

## Explicitly NOT doing

No history rewrite without R5 approval · no feature work · no test deletions for red status (failures classified: GTK-gated + 3 pre-existing E2E) · no `.gitignore` to hide source · no touching `profile/` PII or `company/` runtime data · no dependency removal on static analysis alone (plugins/dynamic checked: only `await import("vite")` exists) · no root loose-.md beyond the health-allowlisted 6.

---

## Expected outcome (approximate)

| Metric | Before (185 tracked) | After |
|---|---|---|
| Dead code removed (DC4/6/7/10 + scripts) | — | ~250 LOC + 5 files |
| Docs archived | 43 in archive | +5–7 |
| Env drift (C1–C7) | 7 findings | 0 |
| Stale refs (DC16) | 16 | 0 |
| Security findings closed | S1–S6, S12–S23 | open only S7–S9 pending visibility decision |

All changes recoverable via git; checkpoints `cleanup/c1-sanitization` … `c5-validated` (§12).
