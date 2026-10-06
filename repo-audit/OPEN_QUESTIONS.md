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

---

## BLOCKING — must answer before Phase 2/3 execution

**NEW-Q1 (from S7/S8/S9). Is the GitHub remote public or private?**
PII (5.3 MB cert PDFs, resume markdown, JSONL with email) exists in **pushed history**. Public → history purge = **R5** (rewrite + force-push, explicit approval + plan). Private → document as accepted risk + add `.media/` to `.gitignore`.
→ Drives the entire security wave. **Also decide S4:** drop local stash (`git stash drop`) + rotate the Gemini credential found in it (R3)?

**NEW-Q2 (D1). Which status mapping is authoritative?** `athena-mapper.ts:44-55` vs `models/status_mapping.py:6-28` disagree on `scored/rejected/archived`. May be intentionally directional. Options: (a) Python canonical + TS derived + contract test [recommended]; (b) document as intentionally different layers. **R3.**

**NEW-Q3 (D3/DC5). Two dead-ish subsystems: keep, wire, or delete?**
(a) `documents/humanizer.py` (586 LOC, zero callers; live path = AI provider) — historical DEC-004 said to port prompts *into* it;
(b) `automation/` (1,827 LOC, unreachable; ARCHITECTURE documents it as live; `athena.executor.hitl_gate` target doesn't exist).
Options each: DELETE / ARCHIVE / implement endpoint. **Ambiguous deletion = §15 STOP. R3.**

**NEW-Q4 (D12/C26). Deployment story?** `Caddyfile` proxies a deleted `frontend` service; `backend/Dockerfile` orphaned; ARCHITECTURE:215 says "Docker/OCI removed". Options: (a) delete both [recommended if no near-term deploy]; (b) restore compose stack + fix Caddyfile. **R2.**

**NEW-Q5 (S1/S2/S3). Auth posture — how far does the cleanup go?**
These are behavior/security changes, not sanitation: fail-closed dev key (R3) · unauthenticated PII GETs (R4) · BFF auth neutralization DEF-008 (R4). Approve as separate Phase 6 track or defer with documented acceptance? **GATE 4.**

**NEW-Q6 (Q6-original). PII history check — ANSWERED:** `.media/` + `profile/` + JSONL **were committed and are on origin/main** (see SECURITY_AUDIT Q5/Q6). Decision rides on NEW-Q1.

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
**NEW-Q12.** Remote branch cleanup: 40+ stale `origin/dependabot/*` + merged branches (remote mutation → confirm). **R1 + confirm.**
**NEW-Q13.** Unpushed `main` (14 commits): push timing/PR strategy for this cleanup branch work? Baseline tag exists locally only until pushed.
**NEW-Q14.** `src/data/mockData.ts` real-PII fixture → fictional replacement is an R3 product-data decision (S5); `test_profile.json`/`keyword_bank_recovered.json` fixtures fictionalization (S20, R2).
**NEW-Q15.** `D15` spec update (`ATHENA_MASTER_SPEC.md` docker/vitest/ports/endpoints) — spec-of-record edit needs owner sign-off (**R3**).

---

## Where decisions get recorded

Protocol approval replies in-session + `docs/integration/MERGE_DECISIONS.md` (path fix pending — AGENTS.md:17 currently points at the nonexistent live path; real file is `docs/archive/integration/MERGE_DECISIONS.md` → decide: revive live file or retarget the rule).
