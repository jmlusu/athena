# Plan: Remaining Items Remediation

Implements [`docs/specs/remaining-items-remediation.md`](../docs/specs/remaining-items-remediation.md).
Decisions D1–D5 in that spec are human-validated; this plan assumes them.

**Baselines at plan time (must not regress):**
- `npm run lint` → exit 0
- `npm run test:unit` → 41 pass
- `cd backend && uv run pytest -q` → **88 passed (measured)**
- `cd backend && uv run ruff check src/athena/ats/scorer.py` → 18 errors (F811/E402 from the
  duplicate module; these must drop, count must never rise)

---

## Components and dependency graph

```
T1  backend/src/athena/ats/scorer.py        delete dead duplicate module (lines 1-248)
     │
     ├── T2  scorer.py                      achievements → _extract_skills_from_text (D1)
     │        │
     │        └── T3  backend/tests/test_athena_scorer.py   cases 1-6 (D5)
     │
T4  scripts/build_profile_payload.py        emit job_titles + categorical fields (D4)
     │        (parallel with T1-T3: different files, shared state: none)
     └── T5  company/athena/user_profiles.jsonl   rebuild preferences, round-trip verify
            └── T6  delete extract_cats.py, update_profile.py, cats.json
                   │
                   └── T7  full verification (all gates from spec Success Criteria)
```

**Hard ordering:** T1 → T2 → T3 (scorer chain). T4 → T5 → T6 (data chain).
**The two chains are independent** and may run in parallel by two agents.

---

## Implementation order

**Slice 1 — scorer integrity (T1, T2).**
Dedup first, then the achievements fix. Dedup precedes the edit so the achievements change
lands in exactly one place; editing first risks touching the dead copy. Each step ends with
`uv run pytest -q` green (88 passed).

**Slice 2 — test coverage (T3).**
Written against the post-T2 behavior. Case 4 (achievement "Led cloud migration to AWS" →
`"aws"` in set) must fail on pre-T2 code — run it once against the old logic if practical, or
at minimum assert it fails-then-passes mentally via the diff. Cases 1-3, 5-6 cover model
defaults, categorical extraction, job_titles, empty-input safety, flat-list regression.

**Slice 3 — reproducible data (T4, T5, T6).**
Builder emits `preferences.job_titles`, `keywords_category`, `executive_keywords`,
`functional_keywords`, `core_skill_tags` by reusing its existing `parse_keywords()` buckets
(`build_profile_payload.py:162-171` already regex-splits the three ats-keywords.md sections —
refactor so the per-section term lists are kept alongside the merged flat list). T5 regenerates
**only** the `preferences` object and merges it into the existing JSONL line; all other fields
stay byte-identical. T6 removes the throwaway scripts once the builder round-trips.

### T1 detail — dedup

`scorer.py` contains the whole module twice: a dead copy at lines 1–248 (truncated mid-
method, no `return` in its `_extract_profile_keywords`) and the live copy from line 249
(`import re` restarts). Python binds the second definition, so runtime is already correct —
this is a structural fix.

**Before deleting:** diff the dead copy against the live copy method-by-method (they should
be identical except the dead one is truncated). If the dead copy contains ANY method or
constant the live copy lacks, stop and report — do not delete. Expected diff: dead copy lacks
the achievements block, categorical loops, and is cut off inside `_extract_profile_keywords`.

After deletion, line 249's `import re` becomes line 1 (resolves the E402s) and the second
`ATSScorer`/`ATSScoreBreakdown` definitions vanish (resolves F811s).

### T2 detail — achievements tokenization

```python
for achievement in exp.achievements:
    keywords.update(self._extract_skills_from_text(str(achievement)))
```

`_extract_skills_from_text` already applies `NOISE_TERMS` filtering, so the separate
`_is_noise` guard is redundant here — but keep any behavior the spec's "handle empty
gracefully" boundary implies (empty achievement strings are safe: the function returns an
empty set for empty/garbage input).

### T4 detail — builder extension

Current builder (`build()`, lines 395-417) emits a flat preferences dict only. Extend:

```python
"preferences": {
    "keywords": keywords,                    # existing, unchanged
    "job_titles": JOB_TITLES,                # new: 5 titles (consistent with
                                             # existing hardcoded locations)
    "keywords_category": "executive",        # new: metadata (D3)
    "executive_keywords": exec_terms,        # new: from ats-keywords.md section
    "functional_keywords": functional_terms, # new: from section
    "core_skill_tags": core_terms,           # new: from section
    ...                                      # existing keys unchanged
},
```

Refactor `parse_keywords()` to return the merged flat list **and** the three per-section
lists (it already parses them into `buckets`; today it discards the boundary). Keep the
recovered-bank merge in the flat list only — the categorical lists mirror ats-keywords.md
exactly, matching the current JSONL (24/26/34 terms).

### T5 detail — JSONL round-trip

Run the builder, then merge ONLY `preferences` into the existing line. Compare:

- `keywords` (flat): builder output vs current 231 terms. **If different → STOP, ask human**
  (spec boundary: do not silently reword the keyword bank).
- Categorical lists: must match current JSONL (24/26/34).
- Everything outside `preferences`: must be byte-identical (if not → STOP, ask human).

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Dead copy has unique code | Silent behavior loss | Pre-delete diff of all methods; stop if anything is unique |
| Achievements tokenization inflates keyword set | Scores shift; possible new noise | Existing test only asserts score ranges; new case asserts token presence. `_extract_skills_from_text` noise filtering already applies |
| Builder flat keywords ≠ current 231 | Keyword bank silently reworded | Spec boundary: stop and ask; never auto-adopt |
| Regenerating JSONL churns unrelated fields | Data drift | Merge preferences only; byte-compare the rest |
| New tests depend on T2 ordering | Red tests mid-slice | T3 written after T2 within the same slice |
| Throwaway scripts deleted before builder proven | Data gap | T6 strictly after T5 round-trip passes |
| e2e unavailable (pre-existing, 20/20 fail without backend) | False regression signal | Spec excludes e2e from gates; unit + pytest are the gates |

**Sequential, not parallel within a chain:** each task consumes the previous state.
**Across chains (T1-T3 vs T4-T6):** independent files, safe for two agents.

---

## Verification checkpoints

**After Slice 1 (T1, T2):**
```powershell
cd backend; uv run pytest -q                          # 88 passed
uv run ruff check src/athena/ats/scorer.py            # < 18 (F811/E402 gone)
# exactly one module:
(Select-String -Path src\athena\ats\scorer.py -Pattern "^class ATSScorer").Count   # 1
(Select-String -Path src\athena\ats\scorer.py -Pattern "^import re").Count         # 1
```

**After Slice 2 (T3):**
```powershell
cd backend; uv run pytest tests/test_athena_scorer.py -v   # all cases green, 1+7 tests
cd ..; npm run test:unit                                    # 41 pass (untouched)
npm run lint                                                # exit 0
```

**After Slice 3 (T4-T6):**
```powershell
python scripts\build_profile_payload.py --check     # reports job_titles + 4 new counts
# round-trip: rebuilt preferences match JSONL (or diff limited to agreed fields)
Test-Path extract_cats.py, update_profile.py, cats.json   # all False
cd backend; uv run pytest -q                          # 88+N passed
```

**Final (T7):** every Success Criteria item 1-9 from the spec, in one pass.

---

## Out of scope

- Frontend/BFF (`athena-mapper.ts`, views) — untouched.
- Scoring weights, `keywords_category` consumption in scorer logic (D3: metadata only).
- Repo-wide ruff cleanup (237 pre-existing errors; CI non-blocking).
- e2e runs without a live backend environment.
- `test_output.txt` / other untracked debris at repo root.
