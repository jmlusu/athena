# Spec: Remaining Items Remediation — Categorical Keywords & Achievements/Job Titles

Fixes the gaps found by the post-implementation verification of "Remaining Implementation
Items" (spec items 3 and 6). The original implementation satisfied the literal text of the
spec but left three defects: achievements extraction is a provable no-op, `keywords_category`
is a dead field, and the data pipeline silently drops everything this work added. It also
shipped a structurally corrupted `scorer.py` and zero test coverage.

## Objective

Make items 3 and 6 of the original spec *actually work*, not just *exist*:

1. Achievements contribute real, matchable keywords to the scorer (today: 0/243 jobs match).
2. `scorer.py` contains one copy of the module (today: two, with 248 dead lines).
3. The profile data pipeline reproduces `job_titles` + categorical fields (today: a
   regeneration would silently erase them).
4. Both items gain pytest coverage (today: zero tests).

**User story:** Jacob's profile achievements ("Led cloud migration to AWS…") should help his
profile match job postings the same way his titles and skills do — and a future engineer who
runs the profile builder must get the same rich preferences back, not a flat-list regression.

**Non-goals:** No frontend/BFF changes. No scorer scoring-weight changes. No removal of the
flat `keywords` list. No ruff baseline cleanup beyond what this work naturally removes.

## Decisions (validated with human)

| # | Question | Decision |
|---|---|---|
| D1 | Achievements added as whole sentences (never match) | **Tokenize** via `_extract_skills_from_text()` |
| D2 | `scorer.py` duplicated module (lines 1–248 dead) | **Delete the dead copy** |
| D3 | `keywords_category` declared but never read | **Keep as metadata only**; document, no scorer logic |
| D4 | Builder doesn't emit new fields; throwaway scripts at repo root | **Extend `build_profile_payload.py`**, delete throwaway scripts |
| D5 | Zero tests for items 3 & 6 | **backend pytest only** (scorer is Python; Node tests can't import it) |

## Tech Stack

- Python 3.12, Pydantic v2, pytest (backend)
- Node 24 + `node --test` (existing 41-test mapper suite — untouched)
- Existing tooling: `uv` in `backend/`, ruff (CI non-blocking)

## Commands

```powershell
# Backend tests (baseline: 88 passed, 33s)
cd backend; uv run pytest -q

# Node unit tests (baseline: 41 pass)
cd C:\Users\jmlus\athena; npm run test:unit

# Lint (baseline: exit 0)
npm run lint

# Profile builder check (parses, writes nothing)
cd C:\Users\jmlus\athena; python scripts\build_profile_payload.py --check

# ruff on the touched file (baseline: 18 errors on scorer.py; must not increase)
cd backend; uv run ruff check src/athena/ats/scorer.py
```

E2E (`npm run test:e2e`) requires a running backend/BFF and fails at baseline in this
environment (20/20 pre-existing failures, connection refused). **Not a gate for this spec** —
re-run only if a live environment is available.

## Project Structure

```
backend/src/athena/models/jobs.py        JobPreferences categorical fields (done, keep)
backend/src/athena/ats/scorer.py         achievements fix + delete duplicate module
backend/tests/test_athena_scorer.py      new coverage for items 3 & 6
scripts/build_profile_payload.py         emit job_titles + categorical fields
company/athena/user_profiles.jsonl       regenerate preferences via builder
profile/ats-keywords.md                  source of truth for categorical terms (read-only)
docs/specs/remaining-items-remediation.md  this spec
tasks/plan.md, tasks/todo.md             plan + task list
```

Deleted: `extract_cats.py`, `update_profile.py`, `cats.json` (throwaway scripts, superseded
by D4).

## Code Style

Achievements fix — match the surrounding extraction style (per-item iteration, noise guard
kept where it adds value; `_extract_skills_from_text` already filters `NOISE_TERMS`):

```python
# From experience achievements
for exp in profile.experience:
    for achievement in exp.achievements:
        keywords.update(self._extract_skills_from_text(str(achievement)))
```

Model additions stay as shipped (jobs.py:74-78), documented as metadata:

```python
# NEW: Categorical keyword structure
keywords_category: str = "core"  # "executive", "functional", "core"
```

## Testing Strategy

- **Framework:** pytest, in `backend/tests/test_athena_scorer.py` (existing file, 1 smoke
  test today).
- **Level:** unit tests against `ATSScorer._extract_profile_keywords` and `JobPreferences`.
- **Required cases:**
  1. Model defaults: `keywords_category == "core"`, three categorical lists empty.
  2. Categorical fields extracted: profile with exec/func/core populated → all terms in set.
  3. `job_titles` extracted → all titles in set.
  4. **Achievements tokenize:** achievement "Led cloud migration to AWS" → `"aws"` in set
     (fails today — proves D1).
  5. Empty achievements/preferences handled gracefully (no crash, no spurious terms).
  6. Flat `keywords` still contribute (regression guard for "never remove flat list").
- **Coverage expectation:** both items covered; no repo-wide coverage mandate.

## Boundaries

- **Always:** keep the flat `keywords` list; run backend pytest + node unit tests after each
  task; keep `keywords_category` assigned (default `"core"`, never `None`); preserve all
  non-preference profile fields byte-identical when updating the JSONL.
- **Ask first:** any change to the JSONL beyond `preferences`; any change to the scorer's
  scoring weights/formula; adding dependencies; touching CI config; if the builder's flat
  keyword list differs from the JSONL's current 231 terms (stop and ask — do not silently
  reword the keyword bank).
- **Never:** commit secrets; delete tests; remove the flat keywords list; modify
  `profile/ats-keywords.md`; let the new tests regress the 88/41 baselines.

## Success Criteria

1. `cd backend; uv run pytest -q` → **88 + N passed** (N = new tests, all green, none removed).
2. `npm run test:unit` → **41 pass** (unchanged).
3. `npm run lint` → exit 0.
4. `scorer.py` has exactly one `class ATSScorer` / one `import re` (grep count = 1);
   `uv run ruff check src/athena/ats/scorer.py` reports ≤ baseline 18 errors (F811/E402 gone).
5. Achievement tokenization proven by test 4 above (fails before D1, passes after).
6. `python scripts/build_profile_payload.py --check` reports `job_titles`, `keywords_category`,
   and the three categorical lists; rebuilding preferences yields terms identical to the
   current JSONL categorical lists (24/26/34 or their deduped equivalent).
7. JSONL diff touches only `preferences` keys `job_titles`, `keywords_category`,
   `executive_keywords`, `functional_keywords`, `core_skill_tags` (already present — verify
   builder round-trip is idempotent, i.e. rebuild changes nothing or only agreed fields).
8. `extract_cats.py`, `update_profile.py`, `cats.json` deleted; no script at repo root
   references them.
9. New tests in `backend/tests/test_athena_scorer.py` for cases 1–6.

## Open Questions

None — all ambiguities resolved in the Decisions table (D1–D5) and validated by the human.

## Verification (manual, end of work)

```powershell
cd C:\Users\jmlus\athena
npm run test:unit                                    # 41 pass
cd backend; uv run pytest -q                         # 88+N passed
uv run ruff check src/athena/ats/scorer.py           # < 18
cd ..; python scripts\build_profile_payload.py --check
# grep scorer.py for duplicate module:
#   (Select-String -Pattern "^class ATSScorer" scorer.py).Count  → 1
```

Last Updated: 2026-10-04
Specification Version: 1.0
