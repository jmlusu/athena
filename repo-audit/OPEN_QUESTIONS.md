# OPEN QUESTIONS — Require Human Decision Before Phase 4/5

> Directive §3: "If multiple competing versions exist, do not silently select one."
> Directive §2: no destructive cleanup before classification sign-off.

## BLOCKING (must answer before any deletion)

**Q1. Directive scope mismatch.**
Sections 12 (90-agent model), 13 (AI Company Builder), 14 (Lightspeed Memory) describe
subsystems that **do not exist in this repository** — zero references found. AI Company Builder
is a separate repo (`C:\Users\jmlus\light-speed-holdings`). Lightspeed here = company name only.
→ **Confirm: proceed with sanitation scoped to what actually exists, marking §12–14 N/A?**

**Q2. Delete or archive the stale `athena/` fork?** (58 tracked files, largest single item)
- Case for DELETE: broken imports, superseded by `backend/` + root `src/`, Git preserves history,
  never referenced by build/CI → deleting removes the #1 source of confusion.
- Case for ARCHIVE: `docs/specs/legacy-cleanup.md` "Never delete" list includes
  `ATHENA-AI-STUDIO-HANDOFF/` (not `athena/`) — but signals caution.
- **Options: (a) delete `athena/` entirely [recommended]; (b) move to `docs/archive/` as reference;**
- **(c) leave untouched.**

**Q3. Delete the 13 loose root directive/plan MDs?**
`ATHENA_INVENTORY/MERGE/MERGE_CHECKLIST/VALIDATION_DIRECTIVE`, `UI_FIX_PLAN`,
`WAYFINDER_MAP_3/4/5`, etc. are executed one-offs. Git history keeps them.
- **Options: (a) delete [recommended for executed ones]; (b) move all to `docs/archive/`.**

**Q4. `ATHENA-AI-STUDIO-HANDOFF/` (22 files) — move to `docs/archive/`?**
Prior spec says "never delete"; integration is complete. ARCHIVE (move) respects both.

**Q5. Runtime JSONL + `.npy` currently tracked in Git** (`athena/company/athena/athena/*`).
`jobs.jsonl`, `user_profiles.jsonl` may contain personal application data.
- **`git rm --cached` (keep local, drop from Git) — confirm.** History purge only if you
  authorize history rewrite (§31 says don't rewrite unless explicitly authorized).

**Q6. PII history check.** Run `git log --all -- profile/*` to confirm PII was never committed?
(Security §20 requires this determination.)

## NON-BLOCKING (decide during Phase 6/8)

**Q7. `backend/.env.production.example`** — obsolete (DATABASE_URL/REDIS/SMTP unimplemented).
(a) delete; (b) rewrite to match reality. *(Recommend b, since a prod deploy story is planned.)*

**Q8. `Caddyfile` + `backend/Dockerfile`** — no deployment target exists.
Keep as future deploy path, or delete until deployment work resumes?

**Q9. `scripts/seed_data.py`, `build_profile_payload.py`, `setup-git-hooks.sh`,
`keyword_bank_recovered.json`, `test_profile.json`, `profile_schema.json`** —
still used? Which are one-offs?

**Q10. `ROADMAP_STEP2_ANALYSIS.md`, `dual_environment_compatibility_standard.md`,
`AUTONOMOUS_CONTROLS_RIGHT_PANE_REQUIREMENTS.md`, `WAYFINDER_MAP_1/2`** —
current or historical? (legacy-cleanup.md itself marked these AMBIGUOUS.)

**Q11. `tasks/` directory** — delete scratch files but keep dir for future agent tasks,
or remove entirely?

**Q12. `ATHENA_AGENT_RULES.md` → new `AGENTS.md`** — replace in place, or keep both?
(Recommend: rename to `AGENTS.md`, add §27/§28/§29 rules, delete original name.)

**Q13. Health check command** (§26) — preferred form?
(a) `npm run health` orchestrating lint+build+tests; (b) `python backend/...health.py`; (c) both.

**Q14. Unused npm deps** (`@google/genai`, `motion`, `autoprefixer`) — remove in Phase 4?
(Recommend yes, gated by Phase 7 build/test.)
