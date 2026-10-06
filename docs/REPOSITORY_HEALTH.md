# Repository Health Report

**Date:** 2026-10-06 · **Baseline tag:** `cleanup/c0-baseline` (`2854e41`) · **Scope:** repository sanitation (no feature changes)

Reproduce at any time: `npm run health` (PASS/WARN/FAIL per area).

---

## 1. Before → After

| Metric | Before | After |
|---|---|---|
| Tracked files | 239 | **178** (−61, −26%) |
| Root loose `.md` files | 20 | **6** (allowlisted) |
| Duplicate `athena/` fork (backend+frontend copies) | 1 | **0** (deleted) |
| Generated files tracked (`.npy`, `*.egg-info`, caches) | 14 | **0** |
| Executed directives/plans in root | 13 | **0** (deleted/archived) |
| `npm run lint` (tsc) | **FAIL — 83 errors** (all in dead `athena/` fork) | **PASS — 0 errors** |
| `npm run test:unit` | 58/58 PASS | 58/58 PASS |
| `npm run build` | PASS | PASS |
| `uv run pytest -q` | 102/102 PASS | 102/102 PASS |
| `uv run ruff check .` | 237 errors (CI-tolerated) | 237 errors (unchanged, baseline) |
| Secrets committed | none (placeholders only) | none — enforced by `npm run health` |
| Repo health command | none | `npm run health` (10 areas) |

Aggregate diff: **135 files changed, +3,861 / −15,744** across 8 commits (`cleanup/c0-baseline..HEAD`).

## 2. Commits (in order)

| Commit | Wave |
|---|---|
| `03a1d32` | Audit baseline + protocol (repo-audit/, dedup protocol, drop tmp) |
| `6ea0ea3` | Untrack generated artifacts, harden `.gitignore` |
| `568cead` | Delete `athena/` fork + one-off cleanup scripts |
| `ce48633` | Documentation consolidation → `docs/` + archive separation |
| `ab09821` | Config truth (`backend/.env.production.example` rewrite) + drop 3 unused deps + dead ruff exclude |
| `be31414` | `AGENTS.md` (source-of-truth map, search-before-build, no-duplicates) |
| `e0662a6` | README repo map + doc index, test counts fixed |
| `be14655` | `npm run health` |

**Rollback:** `git revert <commit>` (atomic), or `git reset --hard cleanup/c0-baseline` for full undo. No history rewrite was performed.

## 3. Remaining debt

| # | Item | Severity | Notes |
|---|---|---|---|
| 1 | Ruff: 237 pre-existing errors in `backend/src/athena/` | Medium | CI `continue-on-error`; burn down separately, health fails only above baseline |
| 2 | E2E not executed during cleanup | Medium | Requires running services; run `npm run test:e2e` before any release |
| 3 | `docs/METRICS_REGISTRY_GUIDE.md` points at `frontend/src/lib/athena/metrics-registry.ts` — **deleted** with legacy `frontend/` in `64f8de0` | Medium | Pattern never re-implemented in root `src/`; re-implement or retitle as design doc |
| 4 | Dead branches: `humanizer.py:275-320` (`ai_company` import), `factory.py` omniroute comment | Low | `ai_company` package not bundled; unreachable code — refactor ticket |
| 5 | Provider coverage: `gemini` + rule fallback only; OmniRoute/external LLM unimplemented | Low | Documented as planned in architecture; do not present as implemented |
| 6 | `docs/archive/` retains ~45 historical docs (handoffs, audits, directives) | Low | Establish retention: delete after next major release if unneeded |
| 7 | Q6: `profile/` PII scan of **pre-cleanup** Git history | Medium | Files untracked now; history check still pending |
| 8 | `CHANGELOG.md` references deleted artifact names (`ATHENA_MERGE_CHECKLIST.md` etc.) | Low | Historical record — accepted as-is |

## 4. Evidence sources

- Inventory & plan: `repo-audit/INVENTORY.md` (archived: `docs/archive/repo-audit/`), `repo-audit/CLEANUP_PLAN.md`
- Decisions: `repo-audit/OPEN_QUESTIONS.md`
- Health: `npm run health` → last run: **8 PASS, 3 WARN (ruff baseline, e2e skipped, tree dirty), 0 FAIL**
- Directive: `repo-audit/DIRECTIVE_SOURCE.md`
