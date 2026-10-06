# DOCUMENTATION AUDIT — Classification of Every Major Doc

Classes: CURRENT · HISTORICAL · IMPLEMENTATION · ARCHITECTURE · OPERATIONS · REFERENCE · TEMPORARY · OBSOLETE

---

## KEEP — root (entry points)

| Doc | Class | Notes |
|---|---|---|
| `README.md` | CURRENT | Accurate but needs repo-map (§30) + doc-index update after cleanup |
| `ARCHITECTURE.md` | ARCHITECTURE | **Canonical.** Code-accurate v2.4.0 |
| `CHANGELOG.md` | CURRENT | Keep |
| `ATHENA_MASTER_SPEC.md` | CURRENT | Named spec of record by AGENT_RULES |
| `ATHENA_AGENT_RULES.md` | CURRENT | Agent operating model; predecessor of AGENTS.md → REFACTOR into `AGENTS.md` |

## KEEP — docs/ (authoritative reference)

| Doc | Class |
|---|---|
| `docs/DATA_STORES.md` | REFERENCE |
| `docs/METRICS_REGISTRY_GUIDE.md` | REFERENCE |
| `docs/PRS_TRACEABILITY_MATRIX.md` | REFERENCE (PR history traceability) |
| `docs/specs/real-data-pipeline.md` | IMPLEMENTATION (recent, active pipeline spec) |
| `docs/specs/remaining-items-remediation.md` | IMPLEMENTATION (open items) |
| `docs/specs/legacy-cleanup.md` | IMPLEMENTATION (prior cleanup spec — boundaries respected here) |
| `docs/implementation-plans/E2E_PLAYWRIGHT_TESTS_PLAN.md` | IMPLEMENTATION (active: e2e exists) |
| `docs/implementation-plans/PDF_GENERATION_PLAN.md` | IMPLEMENTATION |
| `docs/implementation-plans/LEGACY_RETIREMENT_PLAN.md` | IMPLEMENTATION (in progress → validate against this cleanup) |
| `docs/integration/AI_PROVIDER_INTEGRATION.md` | REFERENCE (provider abstraction guide) |

## ARCHIVE → `docs/archive/` (historical, no longer operational guidance)

| Doc | Reason |
|---|---|
| `ATHENA-AI-STUDIO-HANDOFF/` (22 files) | Migration complete & merged |
| `athena-aistudio-opencode-handoff-package.md` | Duplicate form of the above |
| `docs/integration/AI_STUDIO_INVENTORY.md` | Snapshot of pre-merge state |
| `docs/integration/OPENCODE_INVENTORY.md` | Snapshot of pre-merge state |
| `docs/integration/ATHENA_IMPLEMENTATION_COMPARISON.md` | Comparison used to decide merge |
| `docs/integration/MERGE_DECISIONS.md` | Decisions executed |
| `docs/integration/FINAL_INTEGRATION_REPORT.md` | Report of finished work |
| `docs/audits/CODEBASE_AUDIT_MASTER_SPEC.md` | Dated 2026-09-26 audit |
| `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md` | Superseded by root ARCHITECTURE.md |
| `docs/ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md` | Superseded by code + ARCHITECTURE.md (also has placeholder API key line 470) |

## DELETE — one-off directives/plans already executed or obsolete

| Doc | Reason |
|---|---|
| `ATHENA_INVENTORY_DIRECTIVE.md` | Executed directive |
| `ATHENA_MERGE_DIRECTIVE.md` | Merge complete |
| `ATHENA_MERGE_CHECKLIST.md` | Merge complete |
| `ATHENA_VALIDATION_DIRECTIVE.md` | Validation complete |
| `UI_FIX_PLAN.md` (19 KB) | Plan executed (see commit history) |
| `ROADMAP_STEP2_ANALYSIS.md` | Strategic analysis; superseded — **confirm** (see OPEN_QUESTIONS) |
| `dual_environment_compatibility_standard.md` | Standard for a dual-env state that no longer exists? **confirm** |
| `WAYFINDER_MAP_3_Merge_Checklist.md` | Merge complete |
| `WAYFINDER_MAP_4_E2E_Tests.md` | E2E implemented |
| `WAYFINDER_MAP_5_Configuration_Environment.md` | Config consolidated |

## CONSOLIDATE into `docs/` (kept, relocated)

| Doc | Destination |
|---|---|
| `WAYFINDER_MAP_1_Metrics_Registry.md` | `docs/METRICS_REGISTRY_GUIDE.md` already covers → DELETE, or merge delta first |
| `WAYFINDER_MAP_2_Scraper_Discovery_Gap.md` | `docs/specs/scraper-discovery-gap.md` (still open gap?) → verify then move |
| `AUTONOMOUS_CONTROLS_RIGHT_PANE_REQUIREMENTS.md` | `docs/specs/right-pane-requirements.md` (requirements, still active?) → verify then move |

## TEMPORARY (agent scratch — DELETE or gitignore)

| Item | Reason |
|---|---|
| `tasks/plan.md`, `tasks/todo.md` | Agent scratch; git history preserves |
| `tmp_output.txt` (untracked) | Temp dump |
| `ATHENA REPOSITORY SANITIZATION & STREAMLINING DIRECTIVE.md` (untracked) | This directive; archive into `repo-audit/` or delete after run |

---

## Resulting documentation structure (target)

```
README.md                  ← entry point + repo map + doc index
AGENTS.md                  ← from ATHENA_AGENT_RULES.md (+ search-before-build rules)
ARCHITECTURE.md            ← canonical (exists)
CHANGELOG.md
docs/
├── DATA_STORES.md
├── METRICS_REGISTRY_GUIDE.md
├── PRS_TRACEABILITY_MATRIX.md
├── specs/           (active specs)
├── implementation-plans/
├── integration/AI_PROVIDER_INTEGRATION.md
├── archive/         (all HISTORICAL material above)
└── REPOSITORY_HEALTH.md   ← final report (§37)
```

**Conflicts resolved:** ARCHITECTURE.md wins over `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md`;
`.env.example` wins over `backend/.env.production.example`; master spec stays as *requirements*
while ARCHITECTURE.md is the *implementation truth*.
