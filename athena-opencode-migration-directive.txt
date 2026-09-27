# ATHENA — OPENCODE MIGRATION DIRECTIVE

## AI STUDIO → PRODUCTION IMPLEMENTATION

**Document Type:** Mandatory Engineering Directive
**Project:** Athena
**Source:** Google AI Studio Prototype
**Target:** Existing Athena OpenCode/GitHub Repository
**Primary Objective:** Production implementation with visual and UX parity
**Migration Principle:** Preserve the experience. Adapt the implementation.

---

# 0. EXECUTIVE DIRECTIVE

You are the **Athena Production Migration Team**.

You are receiving an approved Athena prototype created in Google AI Studio.

The existing OpenCode Athena repository is the **production system of record**.

The AI Studio application is the **approved visual and UX reference implementation**.

Your job is to integrate the AI Studio experience into the existing Athena production application.

## YOU ARE NOT PERFORMING A GIT MERGE.

You are performing a:

> **CONTROLLED PRODUCT + FRONTEND MIGRATION**

Do not attempt to combine the two applications mechanically.

Do not copy one application's architecture over the other.

Do not replace the existing Athena architecture simply because the AI Studio prototype uses a different structure.

Do not preserve an old production UI merely because it already exists.

Do not redesign the AI Studio prototype.

---

# 1. NON-NEGOTIABLE SOURCE-OF-TRUTH HIERARCHY

When requirements conflict, use this priority order.

```text
1. Explicit human instructions
2. Athena production architecture and functional requirements
3. Approved AI Studio visual/UX specification
4. AI Studio prototype implementation
5. Existing production implementation
6. Agent assumptions
```

However, there is an important distinction:

### Visual decisions

For visual and UX decisions:

```text
Approved AI Studio prototype
        >
AI Studio handoff documentation
        >
Existing Athena UI
```

### Production architecture

For architectural decisions:

```text
Existing Athena production architecture
        >
AI Studio implementation
```

### Business logic

For business and functional behavior:

```text
Explicit Athena requirements
        >
Existing production behavior
        >
AI Studio mock/prototype behavior
```

Never confuse these categories.

---

# 2. THE CENTRAL RULE

## VISUAL FIDELITY IS A REQUIREMENT, NOT A SUGGESTION.

If the AI Studio prototype contains a particular:

* layout
* color
* spacing
* font
* card
* button
* navigation pattern
* animation
* interaction
* icon
* background
* panel
* modal
* dashboard
* visual hierarchy

you must preserve it unless a human explicitly instructs you to change it.

You are **not authorized to improve the design**.

You are **not authorized to modernize the design**.

You are **not authorized to simplify the design**.

You are **not authorized to substitute your preferred component library** if doing so changes the visual result.

You are **not authorized to "make it cleaner."**

You are **not authorized to redesign a screen because you think another layout is better.**

---

# 3. ABSOLUTELY PROHIBITED BEHAVIOR

The following actions are prohibited unless explicitly approved by a human.

## DO NOT:

* redesign screens
* replace the visual system
* change colors
* change typography
* change spacing
* remove animations
* simplify animations
* replace icons unnecessarily
* change navigation hierarchy
* change component hierarchy
* remove visual effects
* replace backgrounds
* replace gradients
* remove shadows
* change border radii
* simplify responsive layouts
* replace cards with tables
* replace tables with cards
* change dashboard composition
* alter information hierarchy
* introduce a new design system
* introduce a competing design language
* "clean up" the UI
* make assumptions about what the user "probably wants"
* preserve obsolete UI merely because it already exists

---

# 4. DO NOT BLINDLY COPY AI STUDIO ARCHITECTURE

The AI Studio application is NOT automatically the production architecture.

Do not blindly copy:

* directory structure
* backend
* API implementation
* database
* authentication
* state management
* model integration
* agent orchestration
* environment configuration
* deployment configuration
* temporary mock services

Instead:

```text
AI Studio
    ↓
Experience reference

OpenCode Athena
    ↓
Production implementation
```

Translate the experience into the existing production architecture.

---

# 5. DO NOT PRESERVE LEGACY UI BY DEFAULT

The opposite mistake is equally dangerous.

If the existing Athena repository contains an older UI that conflicts with the approved AI Studio design, do NOT automatically preserve it.

Determine whether it is:

```text
A. Required production functionality
B. Reusable production infrastructure
C. Legacy visual implementation
D. Obsolete code
```

If it is merely obsolete visual implementation, replace it.

The objective is:

```text
Existing Athena functionality
        +
Approved AI Studio experience
        =
New Athena production UI
```

Not:

```text
Old Athena UI
        +
some AI Studio components
```

---

# 6. FIRST TASK: STOP AND INSPECT

Before modifying anything, inspect the entire existing repository.

Do NOT start coding immediately.

First understand:

```text
Repository
├── application structure
├── frontend
├── backend
├── APIs
├── agents
├── memory
├── data
├── authentication
├── configuration
├── tests
├── deployment
└── existing UI
```

Then inspect the complete AI Studio handoff package.

At minimum read:

```text
ATHENA_AI_STUDIO_HANDOFF.md

DESIGN/DESIGN_SYSTEM.md
DESIGN/SCREEN_INVENTORY.md
DESIGN/COMPONENT_INVENTORY.md
DESIGN/NAVIGATION_SPEC.md
DESIGN/USER_FLOWS.md
DESIGN/INTERACTION_SPEC.md
DESIGN/MOTION_SPEC.md
DESIGN/RESPONSIVE_SPEC.md

IMPLEMENTATION/AI_STUDIO_IMPLEMENTATION.md
IMPLEMENTATION/DATA_CONTRACT.md
IMPLEMENTATION/INTEGRATION_REQUIREMENTS.md
IMPLEMENTATION/COMPONENT_MAPPING.md
IMPLEMENTATION/ROUTE_MAPPING.md

ASSETS/ASSET_MANIFEST.md

VISUAL_QA/VISUAL_ACCEPTANCE_CRITERIA.md
VISUAL_QA/VISUAL_REFERENCE_INDEX.md

MIGRATION/KNOWN_ISSUES.md
```

If a referenced document does not exist, STOP and report it.

Do not invent its contents.

---

# 7. CREATE A MIGRATION BASELINE

Before changing code, create:

```text
MIGRATION_BASELINE.md
```

Record:

```text
Current branch
Current commit
Current application structure
Current frontend framework
Current build status
Current test status
Current routes
Current UI architecture
Known existing failures
```

The baseline protects against accidental regressions.

---

# 8. BUILD A GAP ANALYSIS

Create:

```text
MIGRATION_GAP_ANALYSIS.md
```

Compare:

```text
AI Studio
        VS
Existing Athena
```

For every screen identify:

```text
Screen
Existing Production Equivalent
AI Studio Equivalent
Functional Reuse
Visual Differences
Required Changes
Risk
Status
```

For every component identify:

```text
AI Studio Component
Existing Component
Can Reuse?
Needs Modification?
Needs Replacement?
New Component?
```

Do not start large-scale implementation until this analysis exists.

---

# 9. CREATE THE MIGRATION PLAN

Create:

```text
MIGRATION_PLAN.md
```

Break the migration into controlled stages.

Recommended order:

```text
Phase 0 — Baseline
Phase 1 — Design System
Phase 2 — Application Shell
Phase 3 — Navigation
Phase 4 — Shared Components
Phase 5 — Screens
Phase 6 — Interactions
Phase 7 — Data Integration
Phase 8 — Responsive Behavior
Phase 9 — Motion
Phase 10 — Visual QA
Phase 11 — Functional QA
Phase 12 — Cleanup
```

Do not perform everything in one uncontrolled rewrite.

---

# 10. PROTECT THE EXISTING PRODUCTION SYSTEM

Before modifying major functionality:

```text
git status
```

Confirm the working tree.

Create a migration branch.

Recommended:

```text
feat/athena-ai-studio-migration
```

Do not directly rewrite the main production branch.

---

# 11. DESIGN SYSTEM FIRST

Before rebuilding individual screens, establish the visual foundation.

Extract and implement:

```text
Colors
Typography
Spacing
Radius
Borders
Shadows
Gradients
Breakpoints
Transitions
Motion
```

Use reusable tokens where appropriate.

Do NOT create approximate values when exact values are documented.

For example, if the specification says:

```text
#123456
```

do not substitute:

```text
#14385A
```

because it "looks close."

---

# 12. APPLICATION SHELL SECOND

Implement the global Athena shell before individual screens.

This includes, where applicable:

```text
Application background
Sidebar
Header
Navigation
Command area
Content container
Global overlays
Notifications
Responsive shell
```

The shell must establish the correct visual language.

---

# 13. COMPONENT MIGRATION

For each major component:

1. Find whether an existing production component can support the design.
2. If yes, adapt it.
3. If no, create a production component.
4. Preserve the AI Studio visual behavior.
5. Keep business logic separate from presentation where practical.

Do not duplicate components unnecessarily.

But do not force an existing component to remain simply because it already exists if it cannot reproduce the approved design.

---

# 14. SCREEN MIGRATION

Migrate one screen at a time.

For each screen:

```text
1. Identify route
2. Identify existing functionality
3. Identify AI Studio visual reference
4. Implement layout
5. Implement components
6. Connect production data
7. Implement interactions
8. Implement states
9. Implement responsive behavior
10. Implement motion
11. Run visual QA
12. Run functional QA
```

Do not mark a screen complete because it merely compiles.

---

# 15. MOCK DATA MUST NOT BECOME PRODUCTION LOGIC

AI Studio may contain:

* hardcoded values
* mock users
* fake agents
* placeholder metrics
* simulated activity
* mock API responses

Do not blindly migrate these into production.

Instead:

```text
Prototype data
      ↓
Identify required data contract
      ↓
Connect to Athena production source
```

If the required production source does not exist:

```text
REQUIRES_BACKEND_INTEGRATION
```

Do not invent one.

---

# 16. PRESERVE EXISTING FUNCTIONALITY

During UI migration, existing working functionality must not disappear.

Before replacing a screen, identify:

```text
Existing functionality
Existing API calls
Existing state
Existing permissions
Existing data
Existing actions
Existing validation
Existing error handling
```

Then reproduce that functionality through the new visual interface.

The migration is successful only when:

```text
Old functionality
        +
New approved experience
        =
Production Athena
```

---

# 17. VISUAL COMPARISON IS MANDATORY

For every major screen, compare:

```text
AI Studio reference
        VS
OpenCode implementation
```

Do not rely on memory.

Do not rely on "looks about right."

Do not rely on another developer saying it looks similar.

Use screenshots.

---

# 18. VISUAL QA LOOP

For every major screen:

```text
IMPLEMENT
    ↓
RUN
    ↓
CAPTURE SCREENSHOT
    ↓
COMPARE WITH REFERENCE
    ↓
IDENTIFY DIFFERENCES
    ↓
FIX
    ↓
REPEAT
```

Continue until the visual differences are acceptable according to:

```text
VISUAL_ACCEPTANCE_CRITERIA.md
```

---

# 19. VISUAL QA CHECKLIST

Check:

### Layout

```text
[ ] Page dimensions
[ ] Content width
[ ] Margins
[ ] Padding
[ ] Grid
[ ] Alignment
[ ] Component positions
```

### Typography

```text
[ ] Font
[ ] Size
[ ] Weight
[ ] Line height
[ ] Letter spacing
```

### Color

```text
[ ] Background
[ ] Surface
[ ] Text
[ ] Borders
[ ] Accents
[ ] Gradients
```

### Components

```text
[ ] Buttons
[ ] Cards
[ ] Inputs
[ ] Tables
[ ] Navigation
[ ] Modals
[ ] Badges
[ ] Icons
```

### Motion

```text
[ ] Hover
[ ] Focus
[ ] Transitions
[ ] Loading
[ ] Expansion
[ ] Modal animation
```

### Responsive

```text
[ ] Desktop
[ ] Tablet
[ ] Mobile
```

---

# 20. VISUAL DIFFERENCES MUST BE CLASSIFIED

When a difference is found, classify it.

```text
DESIGN_ERROR
IMPLEMENTATION_ERROR
PRODUCTION_CONSTRAINT
MISSING_ASSET
MISSING_FUNCTIONALITY
PROTOTYPE_LIMITATION
INTENTIONAL_DIFFERENCE
```

Do not silently accept differences.

Document them.

---

# 21. DO NOT USE "CLOSE ENOUGH"

The following reasoning is prohibited:

> "The AI Studio version and production version are basically the same."

That is not a QA criterion.

Instead identify specific differences.

Example:

```text
AI Studio:
Sidebar = 264px

Production:
Sidebar = 240px

Status:
FAIL

Action:
Match reference.
```

---

# 22. FUNCTIONAL QA

After visual QA, verify:

```text
[ ] Navigation
[ ] Authentication
[ ] API calls
[ ] Forms
[ ] Validation
[ ] Data loading
[ ] Data updates
[ ] Error handling
[ ] Empty states
[ ] Loading states
[ ] Agent interactions
[ ] Existing Athena functionality
```

---

# 23. RESPONSIVE QA

Test at the viewport sizes defined in:

```text
RESPONSIVE_SPEC.md
```

Do not assume desktop CSS will automatically produce correct mobile behavior.

Verify:

```text
Navigation
Layout
Typography
Cards
Tables
Forms
Modals
Drawers
Scrolling
Touch interactions
```

---

# 24. ACCESSIBILITY

Preserve the visual design while maintaining reasonable accessibility.

Verify:

```text
Keyboard navigation
Focus states
ARIA where required
Semantic elements
Contrast
Labels
Form accessibility
Screen-reader behavior where appropriate
```

Do not remove visible focus states simply because they change the appearance.

If an accessibility requirement conflicts with the prototype, document the conflict.

---

# 25. PERFORMANCE

Do not sacrifice production performance simply to copy inefficient prototype implementation.

You may change implementation details if the visual and behavioral result remains equivalent.

For example:

```text
AI Studio implementation:
large client-side object

Production:
optimized data structure
```

is acceptable.

But:

```text
AI Studio animation:
smooth transition

Production:
animation removed
```

is not acceptable without approval.

---

# 26. ARCHITECTURAL ADAPTATION RULE

You are expected to translate.

For example:

```text
AI Studio
React component
      ↓
Athena production component
```

or:

```text
AI Studio mock API
      ↓
Athena production API
```

or:

```text
AI Studio local state
      ↓
Athena production state architecture
```

The implementation may change.

The user experience must not.

---

# 27. DO NOT CREATE PARALLEL SYSTEMS UNNECESSARILY

Do not introduce:

```text
Second router
Second state system
Second design system
Second API layer
Second authentication system
Second agent system
Second database
```

unless the existing architecture genuinely requires it and the change is documented.

Reuse existing Athena infrastructure wherever possible.

---

# 28. LEGACY CODE DECISIONS

For every legacy UI component encountered, classify it:

```text
KEEP
ADAPT
REPLACE
DEPRECATE
DELETE
```

Do not delete production functionality merely because the UI changed.

If deleting code:

1. verify no dependencies
2. run tests
3. document the deletion
4. ensure replacement functionality exists

---

# 29. NO BIG-BANG REWRITE

Do not rewrite the entire Athena application simply because the AI Studio prototype looks different.

Migrate incrementally.

After every major phase:

```text
BUILD
TEST
RUN
VERIFY
COMMIT
```

Maintain a recoverable history.

---

# 30. COMMIT DISCIPLINE

Use meaningful commits.

Example:

```text
feat(ui): establish Athena design tokens

feat(ui): migrate application shell

feat(ui): migrate navigation

feat(ui): migrate agent components

feat(ui): migrate dashboard

feat(ui): migrate agent workspace

feat(ui): migrate responsive behavior

test(ui): add visual regression coverage
```

Do not create one enormous:

```text
feat: migrate everything
```

commit.

---

# 31. HUMAN APPROVAL GATES

Do not proceed past major architectural decisions without documenting them.

Approval gates:

```text
GATE 1
Migration plan approved

GATE 2
Design system implemented

GATE 3
Application shell visually approved

GATE 4
Core screens visually approved

GATE 5
Functional integration approved

GATE 6
Final visual QA approved

GATE 7
Production merge approved
```

If this workflow is being executed autonomously, create a report at each gate rather than silently proceeding.

---

# 32. AGENT DELEGATION

If multiple OpenCode agents are available, divide work by responsibility.

Recommended:

```text
ARCHITECTURE AGENT
    Repository inspection
    Dependency analysis
    Migration planning

DESIGN SYSTEM AGENT
    Tokens
    Typography
    Colors
    Spacing
    Effects

UI COMPONENT AGENT
    Shared components

SCREEN AGENT
    Page implementations

INTEGRATION AGENT
    Production APIs
    State
    Data

VISUAL QA AGENT
    Screenshot comparison

TEST AGENT
    Functional regression
```

No agent may independently redesign Athena.

---

# 33. AGENTS MUST READ BEFORE MODIFYING

Every implementation agent must read:

```text
ATHENA_AI_STUDIO_HANDOFF.md

DESIGN_SYSTEM.md
COMPONENT_INVENTORY.md
SCREEN_INVENTORY.md
INTERACTION_SPEC.md
MOTION_SPEC.md
RESPONSIVE_SPEC.md

COMPONENT_MAPPING.md
ROUTE_MAPPING.md
VISUAL_ACCEPTANCE_CRITERIA.md
```

before modifying UI code.

---

# 34. IF DOCUMENTATION AND CODE DISAGREE

Do not guess.

Classify the discrepancy:

```text
DOCUMENTATION_CONFLICT
```

Then inspect:

1. Approved visual reference
2. Current AI Studio implementation
3. Handoff specification

If the conflict remains unresolved, document it for human decision.

Do not silently choose a design.

---

# 35. IF EXISTING ATHENA FUNCTIONALITY AND AI STUDIO CONFLICT

Separate the conflict into:

```text
VISUAL
FUNCTIONAL
ARCHITECTURAL
```

For visual conflict:

> AI Studio reference governs.

For production architecture:

> Existing Athena architecture governs.

For business functionality:

> Existing requirements govern.

Never resolve a three-way conflict by arbitrary preference.

---

# 36. IF THE AI STUDIO PROTOTYPE DOES SOMETHING THAT THE BACKEND CANNOT CURRENTLY SUPPORT

Do not remove the UI.

Instead:

```text
Preserve the approved UI
        ↓
Identify missing capability
        ↓
Document integration requirement
        ↓
Connect existing capability if available
        ↓
Otherwise create explicit backend task
```

The UI should not be downgraded simply because the backend is incomplete.

---

# 37. IF AN ASSET IS MISSING

Do not replace it with a random alternative.

Use:

```text
MISSING_ASSET
```

and document:

```text
Asset required
Where used
Expected dimensions
Expected format
Visual characteristics
```

A placeholder may be used temporarily, but it must be explicitly marked.

---

# 38. IF AN ICON IS MISSING

Do not substitute an unrelated icon because it is convenient.

First search existing Athena assets.

Then check the handoff package.

If still unavailable:

```text
MISSING_ICON
```

Document it.

---

# 39. IF ANIMATION IS HARD TO REPRODUCE

Do not simply delete it.

Document:

```text
Animation
Trigger
Expected visual result
Current implementation limitation
```

Then implement the closest technically appropriate equivalent while preserving the observable behavior.

---

# 40. PROTOTYPE-ONLY FEATURES

Some AI Studio features may be demonstrations rather than production requirements.

Identify them explicitly.

Use:

```text
PROTOTYPE_ONLY
```

Do not automatically build production infrastructure for them.

But do not remove their visual representation if it is part of the approved experience without documenting the reason.

---

# 41. PRODUCTION-ONLY FEATURES

The existing Athena repository may contain functionality not represented in AI Studio.

Do not remove it.

Instead integrate it into the new experience.

The objective is:

```text
AI Studio UX
+
Athena production capabilities
```

not:

```text
AI Studio replaces Athena
```

---

# 42. FINAL ACCEPTANCE STANDARD

The migration is complete only when all of the following are true:

```text
[ ] Application builds
[ ] Existing tests pass
[ ] New tests pass
[ ] Existing production functionality remains available
[ ] All required screens exist
[ ] All required routes exist
[ ] Navigation works
[ ] Production data is connected
[ ] Loading states work
[ ] Error states work
[ ] Empty states work
[ ] Responsive behavior works
[ ] Accessibility checks pass
[ ] Major animations are preserved
[ ] Required assets are present
[ ] Visual QA passes
[ ] No unauthorized redesign exists
[ ] No accidental architecture replacement occurred
```

---

# 43. FINAL VISUAL PARITY REPORT

Before declaring completion, create:

```text
FINAL_VISUAL_PARITY_REPORT.md
```

For every major screen:

```text
Screen
AI Studio Reference
Production Route
Visual Status
Functional Status
Known Differences
Reason
Approved?
```

Use:

```text
PASS
PASS WITH DOCUMENTED DIFFERENCE
FAIL
```

Do NOT use subjective scores.

---

# 44. FINAL MIGRATION REPORT

Create:

```text
FINAL_MIGRATION_REPORT.md
```

Include:

## Completed

What was migrated.

## Preserved

What existing Athena functionality was retained.

## Replaced

What old UI/components were replaced.

## Adapted

What was translated from AI Studio into production architecture.

## Known Differences

Any remaining differences.

## Technical Debt

Anything deferred.

## Missing Backend Capabilities

Anything still requiring engineering.

## Assets

Anything missing.

## Tests

Test results.

## Visual QA

Visual comparison results.

## Recommended Next Steps

Only concrete engineering actions.

---

# 45. FINAL GIT STATE

Before completion:

```text
git status
```

Verify:

* no accidental files
* no secrets
* no generated junk
* no temporary debug code
* no prototype credentials
* no AI Studio environment variables accidentally committed
* no unnecessary dependencies
* no duplicated applications

---

# 46. SECURITY REQUIREMENT

Never copy:

* API keys
* secrets
* credentials
* tokens
* private environment values

from AI Studio into the production repository.

Use the existing Athena configuration and secret-management mechanisms.

---

# 47. CLEANUP

After successful migration:

Remove only:

* temporary migration files
* debugging code
* unused prototype dependencies
* unused temporary components
* obsolete UI code proven to be replaced

Do NOT remove anything merely because it looks old.

Prove it is obsolete first.

---

# 48. THE "NO CREATIVE INTERPRETATION" RULE

When implementing the approved AI Studio experience:

Do not ask:

> "How would I design this?"

Ask:

> "How do I reproduce this?"

Do not ask:

> "What would be a better layout?"

Ask:

> "What layout does the reference specify?"

Do not ask:

> "Can I simplify this?"

Ask:

> "What behavior does the reference require?"

Do not ask:

> "Can I use my preferred component?"

Ask:

> "Can the existing architecture reproduce the approved experience?"

---

# 49. THE "STOP IF UNCERTAIN" RULE

If you encounter uncertainty that materially affects:

* visual design
* navigation
* user flow
* data behavior
* production architecture
* deletion of existing functionality

do not invent a solution.

Create:

```text
MIGRATION_DECISIONS_REQUIRED.md
```

Record:

```text
Decision
Context
Options
Impact
Recommended technical approach
```

Then continue only on work that does not depend on that decision.

---

# 50. FINAL DIRECTIVE TO ALL AGENTS

You are not being asked to create your own version of Athena.

You are being asked to turn an approved prototype into a production implementation.

The following principle governs this entire migration:

```text
                PRESERVE THE EXPERIENCE
                         │
                         ▼
                ADAPT THE IMPLEMENTATION
                         │
                         ▼
                 PROTECT THE SYSTEM
                         │
                         ▼
                  VERIFY THE RESULT
```

The final Athena application must combine:

```text
             AI STUDIO
          APPROVED EXPERIENCE
                  │
                  │
                  ▼
       ┌───────────────────────┐
       │        ATHENA         │
       │                       │
       │ Existing Production   │
       │ Architecture          │
       │         +             │
       │ Approved UI/UX        │
       │         +             │
       │ Production Data       │
       │         +             │
       │ Production Agents     │
       └───────────────────────┘
```

## SUCCESS CONDITION

A user who switches between the approved AI Studio prototype and the production Athena application should recognize them as **the same product**.

The implementation underneath may be completely different.

The architecture may be different.

The backend may be different.

The data layer may be different.

The agent system may be different.

That is acceptable.

### The experience must remain faithful.

---

# 51. FINAL COMMAND

**DO NOT BEGIN BY CODING.**

First:

```text
1. Inspect repository
2. Inspect handoff package
3. Establish baseline
4. Perform gap analysis
5. Create migration plan
6. Identify risks
7. Establish visual tokens
8. Establish application shell
9. Migrate components
10. Migrate screens
11. Integrate production functionality
12. Perform visual QA
13. Perform functional QA
14. Perform responsive QA
15. Perform regression testing
16. Produce final reports
17. Prepare migration branch
```

At every stage ask:

> **Does this preserve the approved Athena experience while strengthening the production implementation?**

If yes, proceed.

If no, stop and reassess.

If uncertain, document the decision rather than inventing one.

**The AI Studio prototype defines the approved experience.**

**The OpenCode Athena repository defines the production system.**

**Your responsibility is to unite those two without sacrificing either.**
