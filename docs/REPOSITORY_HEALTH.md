# Repository Health Report

**Date:** 2026-10-06 · **Baseline tag:** `cleanup/c0-baseline` (`2854e41`) · **Scope:** repository sanitation (no feature changes)

Reproduce at any time: `npm run health` (PASS/WARN/FAIL per area).

---

## 1. Before → After

| Metric | Before | After |
|---|---|---|
| Tracked files | 239 | **192** (−47, −20%) |
| Root loose `.md` files | 20 | **6** (allowlisted) |
| Duplicate `athena/` fork (backend+frontend copies) | 1 | **0** (deleted) |
| Generated files tracked (`.npy`, `*.egg-info`, caches) | 14 | **0** |
| Executed directives/plans in root | 13 | **0** (deleted/archived) |
| `npm run lint` (tsc) | **FAIL — 83 errors** (all in dead `athena/` fork) | **PASS — 0 errors** |
| `npm run test:unit` | 58/58 PASS | 59/59 PASS |
| `npm run build` | PASS | PASS |
| `uv run pytest -q` | 102/102 PASS | 104/104 PASS |
| `uv run ruff check .` | 237 errors (CI-tolerated) | **80 errors** (ruff format landed; baseline now 80) |
| Secrets committed | none (placeholders only) | none — enforced by `npm run health` |
| Repo health command | none | `npm run health` (11 areas) |

Aggregate diff: **185 files changed, +6,709 / −16,255** across 20 commits (`cleanup/c0-baseline..HEAD`).

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
| `2a11d8d` | This report (`REPOSITORY_HEALTH.md`) |
| `a30b194` | E2E results recorded (57/66) |
| `aff4a37` | Metrics registry implemented (`src/lib/athena/metrics-registry.ts`) |
| `f86b704` | Guide fixed + CI health gate job |
| `d674075` | Junk logs untracked; ruff baseline tightened to 81 |
| `d612b1d` … `1c1a4e8` | **Wave A** (tag `cleanup/c1-sanitization`): Phase 1 audit refresh, `.gitignore` hardening, doc accuracy, config hygiene, health.mjs fixes, weasyprint marker, doc archiving — 7 commits |

**Rollback:** `git revert <commit>` (atomic), or `git reset --hard cleanup/c0-baseline` for full undo. No history rewrite was performed.

## 3. Remaining debt

| # | Item | Severity | Notes |
|---|---|---|---|
| 1 | Ruff: 80 pre-existing errors in `backend/src/athena/` (was 237; batch fix landed 2026-10-06) | Medium | CI `continue-on-error`; burn down separately, health fails only above baseline |
| 2 | E2E run with services: **57/66 pass** (9 fail × 3 browsers) | Medium | 3 pre-existing failures in `real-data.spec.ts`: pagination fixture missing, profile `hourly_rate_usd` undefined, pager UI not found; smoke/contract tests all pass |
| 3 | ~~`METRICS_REGISTRY_GUIDE` points at deleted `frontend/` path~~ **CLOSED** — pattern implemented at `src/lib/athena/metrics-registry.ts` (`aff4a37`); guide samples fixed (`cd5f0d4`) | Closed | — |
| 4 | `humanizer.py` optional-`ai_company` branches (L17, L22, L291) | Low | Feature **kept live** per NEW-Q3; guarded imports are optional-dependency handling, not dead code. `factory.py` OmniRoute comment no longer exists |
| 5 | Provider coverage: `gemini` + rule fallback only; OmniRoute/external LLM unimplemented | Low | Documented as planned in architecture; do not present as implemented |
| 6 | `docs/archive/` retains ~45 historical docs (handoffs, audits, directives) | Low | Establish retention: delete after next major release if unneeded |
| 7 | ~~Q6: `profile/` PII scan of pre-cleanup Git history~~ **CHECKED** — PII is in pushed history (SECURITY_AUDIT Q5/Q6); repo is **private** (NEW-Q1) → documented acceptance, no R5 purge | Low | `.media/` gitignored (`c71cea5`) |
| 8 | `CHANGELOG.md` references deleted artifact names (`ATHENA_MERGE_CHECKLIST.md` etc.) | Low | Historical record — accepted as-is |

## 4. Evidence sources

- Inventory & plan: `repo-audit/INVENTORY.md` (archived: `docs/archive/repo-audit/`), `repo-audit/CLEANUP_PLAN.md`
- Decisions: `repo-audit/OPEN_QUESTIONS.md`
- Health: `npm run health` → last run: **8 PASS, 3 WARN (ruff baseline, git-status, e2e skipped), 0 FAIL**
- E2E with services: **57/66 pass** (3 distinct failures × 3 browsers; pre-existing)
- Directive: `repo-audit/DIRECTIVE_SOURCE.md`
