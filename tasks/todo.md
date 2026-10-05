# Tasks: Remaining Items Remediation

Implements [`docs/specs/remaining-items-remediation.md`](../docs/specs/remaining-items-remediation.md)
via [`tasks/plan.md`](./plan.md).

Run order: **T1 → T2 → T3** (scorer chain), **T4 → T5 → T6** (data chain, parallel-safe with
the first), then **T7** (gates). Decisions D1–D5 are human-validated — do not relitigate.

- [x] Task T1: Delete the dead duplicate module in `backend/src/athena/ats/scorer.py`
  - Acceptance: exactly one `class ATSScorer`, one `ATSScoreBreakdown`, one `import re`
    (at line 1); file ~470 lines; dead copy (old lines 1-248) gone; pre-delete method-by-method
    diff shows no unique code in the dead copy (if unique code found → STOP and report);
    `uv run ruff check src/athena/ats/scorer.py` reports < 18 errors (F811/E402 removed)
  - Verify: `cd backend; uv run pytest -q` → 88 passed; ruff count < 18
  - Files: `backend/src/athena/ats/scorer.py`

- [x] Task T2: Tokenize achievements in `_extract_profile_keywords` (D1)
  - Acceptance: achievement strings pass through `_extract_skills_from_text(str(achievement))`
    instead of being added as whole lowercased sentences; empty/garbage achievements handled
    without error; no other extraction logic altered
  - Verify: `cd backend; uv run pytest -q` → 88 passed (score-range test unaffected)
  - Files: `backend/src/athena/ats/scorer.py`

- [x] Task T3: Add pytest coverage for items 3 & 6 (D5)
  - Acceptance: 6 new cases in `backend/tests/test_athena_scorer.py` —
    (1) model defaults (`keywords_category == "core"`, three categorical lists empty),
    (2) categorical fields extracted into the keyword set,
    (3) `job_titles` extracted,
    (4) achievement "Led cloud migration to AWS" contributes `"aws"` (proves T2),
    (5) empty achievements/preferences safe,
    (6) flat `keywords` still contribute; none of the pre-existing tests modified or removed
  - Verify: `cd backend; uv run pytest tests/test_athena_scorer.py -v` → 7+ tests green;
    `uv run pytest -q` → 88+N passed; `npm run test:unit` → 41 pass; `npm run lint` → exit 0
  - Files: `backend/tests/test_athena_scorer.py`

- [x] Task T4: Extend `scripts/build_profile_payload.py` to emit new preference fields (D4)
  - Acceptance: `preferences` gains `job_titles` (5 titles per spec item 6.3),
    `keywords_category` ("executive"), `executive_keywords`, `functional_keywords`,
    `core_skill_tags` sourced from its existing ats-keywords.md section parse; flat `keywords`
    output unchanged (sourced + recovered merge intact); `--check` prints the new counts
  - Verify: `python scripts\build_profile_payload.py --check` → reports job_titles + 3
    categorical counts (24/26/34 or deduped equivalent)
  - Files: `scripts/build_profile_payload.py`

- [x] Task T5: Round-trip the profile JSONL preferences
  - Acceptance: rebuild preferences via the builder and merge ONLY the `preferences` object
    into `company/athena/user_profiles.jsonl`; flat `keywords` must still be the same 231
    terms (**if different → STOP, ask human** per spec boundary); all non-preference fields
    byte-identical (**if not → STOP, ask human**); categorical lists match current values
  - Verify: JSONL parses; `python -c` check that all 6 preference fields present with expected
    counts; `cd backend; uv run pytest -q` → still green (nothing reads the JSONL in tests,
    but run for safety)
  - Files: `company/athena/user_profiles.jsonl`

- [x] Task T6: Delete throwaway scripts
  - Acceptance: `extract_cats.py`, `update_profile.py`, `cats.json` removed from repo root;
    no file references them (`grep -r "extract_cats\|update_profile\|cats.json"` → nothing
    outside docs/); builder (T4) is the sole source for categorical preference fields
  - Verify: `Test-Path` all three → False; `npm run test:unit` → 41 pass
  - Files: `extract_cats.py`, `update_profile.py`, `cats.json` (deletions)

- [x] Task T7: Final verification against spec Success Criteria 1-9
  - Acceptance: all nine criteria from the spec pass in one pass (pytest 88+N, node 41,
    lint 0, scorer single-module grep, achievement test green, builder `--check` reports new
    fields, JSONL preferences verified, throwaway scripts gone, new tests present)
  - Verify: commands in spec "Verification (manual, end of work)" section
  - Files: none (read-only gate)

## Notes

- e2e (`npm run test:e2e`) is **excluded from gates** — 20/20 pre-existing failures without
  a live backend (connection refused); not a regression signal for this spec.
- Ruff baseline is 237 repo-wide errors, CI non-blocking; only the scorer.py file count is
  gated (< 18).
- If any STOP condition triggers (T1 unique code, T5 keyword drift, T5 non-preference churn),
  halt the chain and report to the human before proceeding.

## Status: COMPLETE (2026-10-04)

All 7 tasks verified against spec Success Criteria 1-9:

- pytest: 94 passed (88 baseline + 6 new)
- npm run test:unit: 41 pass
- npm run lint: exit 0
- scorer.py: single module (1 x ATSScorer, 1 x import re), ruff 7 errors (baseline 18)
- builder --check: job_titles 5, category executive, 24/26/34 categorical
- JSONL round-trip: key sets equal; categorical values identical; flat keywords same 231-term set (order preserved as deliberately written)
- throwaway scripts deleted (extract_cats.py, update_profile.py, cats.json)
- pre-existing note: builder payload vs JSONL non-preference fields differ only by Pydantic default keys (level/years/id nulls) - content identical, no action
