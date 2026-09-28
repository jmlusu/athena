# Wayfinder Map 3: Merge Checklist Completion (ATHENA_MERGE_CHECKLIST.md)

## Current State
- **Status**: In-Progress — **0/124 boxes checked** (formal); evidence-based implementation ≈ **55%** (verified 2026-09-28)
  - **CORRECTION (2026-09-28, QA Lead):** "~90% complete" is **FALSE**. Verified counts: `ATHENA_MERGE_CHECKLIST.md` = **0/124 boxes checked**; `MIGRATION_PLAN.md` = **5/259** (Phase 0 only). Evidence-based implementation ≈ **55%**. Formal checklist completion is **0%**, not 90%.
- **Key File**: `ATHENA_MERGE_CHECKLIST.md` — 6 phases with KEEP_EXISTING, KEEP_AI_STUDIO, MERGE, REFACTOR, DEPRECATE, UNKNOWN classifications
- **Reference**: `ATHENA_MERGE_DIRECTIVE.md` for classification taxonomy

## Decision Tickets (Resolve One at a Time)

### Ticket A: Phase 1-3 Merge Classifications
- **Requirement**: Classify each Phase 1-3 item with KEEP_EXISTING, KEEP_AI_STUDIO, MERGE, REFACTOR, DEPRECATE, or UNKNOWN
- **Current**: Many items still `[ ] not done` across first 3 phases
- **Resolution**: Go through each checklist item; apply classification rules from merge directive; mark complete or add rationale for UNKNOWN
- **Dependencies**: Merge directive taxonomy; source code comparison; AI Studio spec alignment
- **Evidence**: Checklist uses 6-class classification system; each phase has specific screen/component items

### Ticket B: Phase 4-6 Merge Classifications
- **Requirement**: Classify each Phase 4-6 item with the 6-class taxonomy
- **Current**: Phase 4-6 items also have `[ ] not done` status
- **Resolution**: Same classification process as Ticket A but for remaining phases
- **Dependencies**: Consistent application of merge directive rules across all phases
- **Evidence**: Full checklist covers all 16 phases from design system through receipts and launch

### Ticket C: KEEP_AI_STUDIO vs KEEP_EXISTING Decisions
- **Requirement**: Make definitive keep/remove decisions for items marked ambiguous
- **Problem**: Some items unclear whether to keep existing code or adopt AI Studio equivalents
- **Resolution**: Apply merge directive rules:
  - **KEEP_EXISTING**: Current athena implementation is correct, AI Studio version not needed
  - **KEEP_AI_STUDIO**: AI Studio version is superior; replace athena implementation
  - **MERGE**: Combine best of both; de-duplicate logic
  - **REFACTOR**: Rewrite for clarity without changing behavior
  - **DEPRECATE**: Mark as deprecated but don't remove immediately
  - **UNKNOWN**: Insufficient information; needs research/consultation
- **Dependencies**: Cross-reference with AI Studio spec, talk to product team if unclear
- **Evidence**: Classification taxonomies documented in `ATHENA_MERGE_DIRECTIVE.md`

### Ticket D: Final Merge Checklist Sign-Off
- **Requirement**: Complete all 16 phases; achieve 100% checklist completion
- **Current**: ~90% complete; ~10% of items remain `[ ] not done`
  - **CORRECTION (2026-09-28):** **FALSE** — actual is **0/124 checked** (100% remain `[ ] not done`); evidence-based implementation ≈55%. No sign-off progress has been recorded in the checklist.
- **Resolution**: Systematically work through remaining items; apply classifications; update checklist status
- **Dependencies**: All prior tickets (A-C) must be complete first
- **Evidence**: Merge checklist is the gate to production merge; 100% completion required

## Path Forward
Resolve tickets in order: A → B → C → D. Critical path: Ticket D (final sign-off) depends on A-C being complete first. Start with Ticket A (Phases 1-3) as it's the earliest phases and sets the foundation for classification consistency across all remaining phases.

**Destination**: `ATHENA_MERGE_CHECKLIST.md` 100% complete with all items classified and marked done; merge directive applied consistently across all 16 phases; ready for production merge.

---
*Wayfinder Map generated for athena project. Resolve one ticket at a time until merge checklist is 100% complete.*