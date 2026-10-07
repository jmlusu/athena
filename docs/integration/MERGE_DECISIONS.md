# MERGE_DECISIONS — Current

Record integration/merge decisions here (or in the PR description), per `AGENTS.md` §1.

**Historical decisions (pre-consolidation):** `docs/archive/integration/MERGE_DECISIONS.md`.

---

## 2026-10-07 — C-sec5 / S7+S8+S9: pushed-history PII — DOCUMENTED ACCEPTANCE

**Decision:** Accept residual PII in pushed git history. No history rewrite (no R5 purge).

**Context:** Repository visibility is PRIVATE (NEW-Q1 answer, `repo-audit/OPEN_QUESTIONS.md`).
History contains: `.media/` certificates (17 files / 5.3 MB, added `579c7e7`, removed `1fe30bf`),
`profile/*.md` resume (same commits), one `user_profiles.jsonl` email value (removed `6ea0ea3`).
All are ancestors of `origin/main` but unreachable from HEAD.

**Acceptance rationale:** (a) exposure requires collaborator access to a private repo;
(b) an R5 history rewrite would invalidate every downstream SHA — breaking, and far above
this cleanup's risk budget.

**Conditions:**

1. Repository stays private. If visibility ever changes to public, this acceptance is void
   and an R5 purge becomes mandatory — revisit `repo-audit/SECURITY_AUDIT.md` S7–S9 first.
2. `.media/` remains gitignored (added `c71cea5`) so new certificate files cannot be tracked.
3. Live-tree PII removed independently: C-sec4 (bundle persona), C-sec6 (fixtures).

**Approval:** APPROVAL GATE 4 (PROTOCOL §9) — approved by repo owner 2026-10-07.
