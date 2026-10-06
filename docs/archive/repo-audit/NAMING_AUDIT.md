# NAMING AUDIT

## Anti-pattern scan (`*_v2/_new/_final/_latest/_backup/_old/_temp`)

**Result: NO `*_v2`, `*_new`, `*_final`, `*_latest`, `_old` source files found** in tracked code. ✓

Files that superficially match but are legitimate:
- `docs/specs/remaining-items-remediation.md` — descriptive, not a version suffix
- `scripts/keyword_bank_recovered.json` — `_recovered` suffix indicates provenance; acceptable but REVIEW (could be merged into canonical keyword bank)

## Versioned / sequential root docs (naming inconsistency)

```
WAYFINDER_MAP_1_Metrics_Registry.md
WAYFINDER_MAP_2_Scraper_Discovery_Gap.md
WAYFINDER_MAP_3_Merge_Checklist.md
WAYFINDER_MAP_4_E2E_Tests.md
WAYFINDER_MAP_5_Configuration_Environment.md
```
Numbered working notes — violate "root intentionally sparse" (§18) and the
one-topic-per-canonical-doc rule (§10). → Consolidate/delete per DOCUMENTATION_AUDIT.

## Casing inconsistency

| Style | Examples |
|---|---|
| UPPER_SNAKE | `ATHENA_MASTER_SPEC.md`, `ATHENA_AGENT_RULES.md`, `ROADMAP_STEP2_ANALYSIS.md` |
| lower_snake | `athena-aistudio-opencode-handoff-package.md`, `dual_environment_compatibility_standard.md` |
| Title-ish | `UI_FIX_PLAN.md`, `README.md`, `ARCHITECTURE.md` |

**Rule to adopt:** repo-level docs = `UPPER_SNAKE` for directives/specs, `README/ARCHITECTURE/AGENTS`
conventional names; archived docs keep their original names (no renaming churn).

## Directory naming

| Pattern | Example | Assessment |
|---|---|---|
| Duplicate `athena/` at root AND inside | `athena/src/ai_company/athena/athena/` | **Triple-nested, confusing** → removed with fork |
| `athena/company/athena/athena/` | runtime data nested 3 deep | removed with fork |
| `tests/` vs `backend/tests/` vs `athena/tests/` | 3 test roots | → 2 after cleanup (Node + Python) |

## Snake vs camel in scripts

`scripts/*.py` snake_case ✓; `scripts/*.ps1` fine; consistent enough.

## Recommendation for post-cleanup naming rules (goes into AGENTS.md)

- No new `*_v2/_new/_final/_backup` ever — modify the canonical file, or replace atomically.
- New docs go in `docs/`, not root.
- One concept → one file → one home.
