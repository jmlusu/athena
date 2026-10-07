# OPEN QUESTIONS — Refreshed Phase 1 @ `d674075`

Supersedes the 2026-10-06 list. Resolved questions recorded with commit evidence (Git history keeps the full trail).
**Rule:** §15 stop conditions — STOP → REPORT → WAIT on any ambiguity below.

---

## RESOLVED (recorded, no action needed)

| Q | Question | Resolution |
|---|---|---|
| Q1 | Directive §12–14 scope (90-agents, AI Company Builder, Lightspeed Memory) | **RESOLVED-by-consensus recorded:** N/A for this repo (zero references; separate repo `light-speed-holdings`). Audit confirmed again. Still needs a one-word confirmation at Gate 1. |
| Q2 | Delete stale `athena/ fork`? | **DONE** — `568cead` |
| Q3 | Delete 13 loose root directives? | **DONE** — root now 6 allowlisted `.md` |
| Q4 | `ATHENA-AI-STUDIO-HANDOFF/` archive? | **DONE** — `ce48633` → `docs/archive/` |
| Q5 | Runtime JSONL `.npy` tracked? | **DONE** — untracked `6ea0ea3`/`d674075`; answer = historically yes, none at HEAD (SECURITY_AUDIT Q5) |
| Q7 | `backend/.env.production.example` obsolete? | **DONE** — rewritten to reality `ab09821` |
| Q12 | `ATHENA_AGENT_RULES.md` → `AGENTS.md`? | **DONE** — `be31414` |
| Q13 | Health command form? | **DONE** — `npm run health` `be14655` + CI gate `f86b704` |
| Q14 | Unused npm deps? | **DONE** — `ab09821`; re-audit confirms **0 unused npm** |
| NEW-Q1 | GitHub remote public/private? | **ANSWERED 2026-10-07: PRIVATE** → no history purge (R5) for visibility; C-sec5 becomes documented-acceptance path; `.media/` already gitignored in `c71cea5` |
| NEW-Q2a | Status-claims doc authority? | **ANSWERED: DATA_STORES for stores, ARCHITECTURE for flow** (doc-level claim authority) |
| NEW-Q3 | humanizer.py + automation/ fate? | **ANSWERED: KEEP as live features** → B3/B4 = KEEP; ARCHITECTURE A6/A7 listings stand as-is |
| NEW-Q4 | Deployment story? | **ANSWERED: removed-for-good; keep `backend/Dockerfile` as reference** → delete `Caddyfile` (B8), no compose restore |
| NEW-Q5 | Auth posture scope? | **ANSWERED: security track (Wave C, Gate 4) IS in scope for this cleanup branch** → S1/S2/S3 proceed under Gate 4 |
| NEW-Q7 | mypy in CI? | **RESOLVED (a) advisory CI job** — `8b47fc6` (job `typecheck`, continue-on-error; 160 known errors) |
| NEW-Q8 | Ruff tests scope / baseline? | **RESOLVED lint-then-hold** — tests linted in `7d1c921`, format baseline `071aeac`, count 80 (`health.mjs` ratcheted) |
| NEW-Q9 | agent-authority-matrix merge/cross-link? | **RESOLVED cross-link + fix** — §15 rewritten to JSONL reality, linked from PROTOCOL + AGENTS §2, `9b0f159` |
| NEW-Q10 | vite-family → devDependencies? | **RESOLVED-keep-in-dependencies** — `d8f68ee` reclassification **reverted 2026-10-07**: it broke `npm ci --omit=dev` + `npm run build` (3 unresolved imports in `vite.config.ts`); `vite`/`@vitejs/plugin-react`/`@tailwindcss/vite` restored to `dependencies`, full + `--omit=dev` install and build re-verified |
| NEW-Q11 | Legacy auth aliases? | **RESOLVED document-path** — kept in `_get_api_keys`, documented in `.env.example` advanced block (`25e1d19`) |
| NEW-Q14 | mockData / fixture fictionalization? | **RESOLVED** — persona `9df6f9e`, keyword_bank `788715f`, test_profile deleted `2a568a0` (Gate 4 approved) |
| NEW-Q15 | `D15` spec update (`ATHENA_MASTER_SPEC.md` docker/vitest/ports/endpoints) | **DONE** — `0701095` (owner-approved) |
| NEW-Q12 | Remote branch cleanup: 40+ stale `origin/dependabot/*` + merged branches | **PARTIAL 2026-10-07** — `git fetch --prune` removed pre-existing stale refs (were 40+, now 13 remain). 1 verified-stale branch `dependabot/lucide-react` (zero PRs, last commit 2026-09-24, superseded by `-1.49.0`) was deleted. 12 retain open PRs (#37–#48) and are dependabot-active — deleting those would close pending dependency updates; retained per owner intent to only remove truly stale branches. |
| NEW-Q13 | Unpushed `main` (14 commits): push timing/PR strategy? | **DONE 2026-10-07** — pushed `origin/cleanup/sanitization` + PR #50 (push-now strategy, owner-approved) |

---

## BLOCKING — resolved (kept here for the audit trail)

**NEW-Q2 (D1) code-level mapping. Which mapping is authoritative?** `athena-mapper.ts:44-55` vs `models/status_mapping.py:6-28` disagree on `scored/rejected/archived`. Plan (B1, Gate 1 approved) = Python canonical + TS derived + cross-language contract test — proceeds under **R3**.

---

## NON-BLOCKING — decide during the wave that touches them

**Q8.** Caddyfile/Dockerfile → folded into NEW-Q4.
**Q9.** `scripts/seed_data.py` (unreferenced), `build_profile_payload.py` (**broken from clean clone** — missing `profile/*.md` inputs, runbook unrunnable), `setup-git-hooks.sh` (installs nothing): wire up or archive? `keyword_bank_recovered.json` + `profile_schema.json` are live pipeline (keep; but profile_schema has PII → S6 R2).
**Q10.** `ROADMAP_STEP2_ANALYSIS.md`, `dual_environment_compatibility_standard.md`, `AUTONOMOUS_CONTROLS_...`, `WAYFINDER_MAP_1/2` → already in archive or superseded; confirm at Gate 1.
**Q11.** `tasks/` — **RESOLVED conservatively 2026-10-07:** `plan.md`/`todo.md` (21/21 done) archived to `docs/archive/tasks/`; `tasks/` dir vacated, recreate on demand (no destructive delete).
**NEW-Q7.** `mypy` (dev dep) — AGENTS §5 mandates mypy-strict but CI never runs it. (a) add advisory CI job [recommended]; (b) remove dep + rule. **R3 to remove.**
**NEW-Q8.** Ruff scope: `extend-exclude="tests/"` hides 14 test files from lint. Enabling them **raises the 81 baseline** — accept new baseline or lint-then-fix? **R2.**
**NEW-Q9.** `docs/agent-authority-matrix.md` (879 L, zero inbound refs, stale §15): merge into PROTOCOL / cross-link from AGENTS / archive? **R2.**
**NEW-Q10.** npm `vite`-family reclassify `dependencies → devDependencies` (build-only). **R2.**
**NEW-Q11.** Legacy auth aliases `ATHENA_ADMIN_KEY/APPROVE_KEY/RUN_KEY` (undocumented, only in archive docs): remove from code or document? **R2.**
**NEW-Q14.** `src/data/mockData.ts` real-PII fixture → fictional replacement is an R3 product-data decision (S5); `test_profile.json`/`keyword_bank_recovered.json` fixtures fictionalization (S20, R2).

---

## Where decisions get recorded

Protocol approval replies in-session + `docs/integration/MERGE_DECISIONS.md` (live path **revived** `cd5f0d4`; historical records: `docs/archive/integration/`).
