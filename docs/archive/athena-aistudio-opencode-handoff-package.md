# ATHENA — AI STUDIO → OPENCODE HANDOFF PACKAGE

## ROLE

You are the **Athena Product Prototyping and Handoff Engineer**.

Your job is to prepare this current Google AI Studio Athena application for handoff to a separate OpenCode engineering team.

The OpenCode team already has a separate Athena GitHub repository and production-oriented architecture.

Your task is **NOT to redesign Athena** and **NOT to restructure the OpenCode repository**.

Your task is to document and package this AI Studio implementation so the OpenCode team can reproduce the current Athena application's:

* visual design
* user experience
* interaction behavior
* screens
* navigation
* components
* styling
* animations
* responsive behavior
* assets
* frontend implementation patterns

inside the existing OpenCode Athena architecture.

---

# 1. PRIMARY OBJECTIVE

Treat the current AI Studio application as the **Visual and UX Reference Implementation**.

The OpenCode team must be able to inspect your handoff package and reconstruct the application without having to guess:

* what a screen should look like
* how components behave
* how navigation works
* what colors are used
* what typography is used
* what spacing is used
* what animations exist
* what assets are required
* what happens when users interact with the UI
* which parts are visual-only prototypes
* which parts represent actual application behavior

The handoff must preserve the current design.

## CRITICAL RULE

Do NOT make unnecessary visual changes to the existing application while preparing this package.

The current application's visual appearance is the source of truth.

Do not "improve", modernize, simplify, redesign, or reinterpret the UI unless explicitly requested.

---

# 2. IMPORTANT ARCHITECTURAL BOUNDARY

The OpenCode team owns the production architecture.

Therefore, do NOT assume that the OpenCode repository should adopt the AI Studio project's:

* folder structure
* backend architecture
* API architecture
* database architecture
* authentication architecture
* agent architecture
* orchestration architecture
* state-management architecture
* deployment architecture
* dependency choices

Instead, clearly distinguish between:

### A. DESIGN TRUTH

What Athena should look and feel like.

### B. BEHAVIORAL TRUTH

What the user should experience when interacting with Athena.

### C. IMPLEMENTATION REFERENCE

How this AI Studio prototype currently implements the experience.

### D. PRODUCTION INTEGRATION REQUIREMENTS

What the OpenCode team needs to reproduce the experience in its existing architecture.

---

# 3. INSPECT THE ENTIRE CURRENT APPLICATION

Before producing the handoff, inspect the complete application.

Analyze:

* all routes
* all pages
* all screens
* all components
* all layouts
* all navigation
* all modals
* all forms
* all tables
* all cards
* all dashboards
* all charts
* all interactive elements
* all animations
* all transitions
* all responsive behavior
* all assets
* all fonts
* all icons
* all colors
* all gradients
* all shadows
* all borders
* all spacing
* all states
* all loading states
* all empty states
* all error states
* all hover states
* all selected states
* all disabled states
* all mobile behavior

Do not document only the obvious screens.

Identify everything required to reproduce the current experience.

---

# 4. CREATE A FORMAL DESIGN SYSTEM

Create:

`DESIGN_SYSTEM.md`

Document the actual design system currently used by the application.

Include, where applicable:

## Colors

Document exact values:

```text
Primary
Secondary
Accent
Background
Surface
Surface elevated
Text primary
Text secondary
Text muted
Border
Success
Warning
Error
Info
```

Include:

* HEX
* RGB where useful
* opacity values
* gradients
* background effects

Do not invent values.

Extract values from the actual implementation.

---

## Typography

Document:

* font family
* fallback fonts
* font sizes
* font weights
* line heights
* letter spacing
* heading hierarchy
* body text
* labels
* captions
* buttons
* navigation text
* data/table typography

---

## Spacing

Document the spacing system used by the application.

Identify recurring values for:

* page margins
* section spacing
* card padding
* component gaps
* grid gaps
* navigation spacing
* form spacing

---

## Shape

Document:

* border radius
* button radius
* card radius
* input radius
* modal radius
* pills
* badges

---

## Borders

Document:

* border widths
* colors
* opacity
* divider styles

---

## Shadows and Effects

Document:

* box shadows
* glow effects
* blur
* backdrop blur
* gradients
* overlays
* glass effects
* depth effects

---

# 5. CREATE THE SCREEN INVENTORY

Create:

`SCREEN_INVENTORY.md`

Create a complete inventory of every user-facing screen.

For each screen document:

```text
Screen Name
Route
Purpose
Entry Points
Primary User Actions
Secondary User Actions
Layout
Major Components
Navigation
Responsive Behavior
States
Animations
Dependencies
```

Use a table where useful.

Example:

```text
| Screen | Route | Purpose | Major Components |
|---|---|---|---|
| Dashboard | /dashboard | ... | Sidebar, Metrics, Activity |
```

Do not assume route names.

Extract them from the application.

---

# 6. CREATE A COMPONENT INVENTORY

Create:

`COMPONENT_INVENTORY.md`

Identify every reusable UI component.

For each component document:

```text
Component
Purpose
Props / Inputs
Visual Structure
States
Interactions
Responsive Behavior
Animation
Dependencies
```

Identify shared components separately from page-specific components.

Include components such as:

* App shell
* Sidebar
* Header
* Navigation
* Buttons
* Inputs
* Cards
* Tables
* Charts
* Dialogs
* Drawers
* Tabs
* Dropdowns
* Toasts
* Badges
* Status indicators
* Agent cards
* Agent panels
* Chat interfaces
* Command interfaces
* Data visualization
* Loading states
* Empty states
* Error states

Only document components that actually exist.

---

# 7. CREATE THE NAVIGATION SPECIFICATION

Create:

`NAVIGATION_SPEC.md`

Document:

* every route
* navigation hierarchy
* sidebar structure
* top navigation
* breadcrumbs
* tabs
* deep links
* back behavior
* modal navigation
* drawer navigation
* active-state behavior

Create a route map.

Example:

```text
Application
│
├── Dashboard
│
├── Agents
│   ├── Agent List
│   └── Agent Detail
│
├── Tasks
│
└── Settings
```

Use the actual Athena structure rather than this example.

---

# 8. CREATE THE USER FLOW SPECIFICATION

Create:

`USER_FLOWS.md`

Document the important user journeys.

For each flow:

```text
Flow Name
Starting Point
Steps
UI Changes
User Actions
System Feedback
Success State
Failure State
Exit Path
```

Include important interactions such as:

* creating something
* editing something
* deleting something
* searching
* filtering
* navigating
* opening dialogs
* changing settings
* interacting with agents
* submitting tasks
* viewing results
* handling errors

---

# 9. CREATE THE INTERACTION SPECIFICATION

Create:

`INTERACTION_SPEC.md`

Document all meaningful interactions.

For example:

```text
Hover
Click
Double-click
Focus
Keyboard interaction
Drag
Drop
Scroll
Expand
Collapse
Open
Close
Submit
Cancel
Confirm
Delete
Search
Filter
Sort
Refresh
```

For each interaction describe the observable UI result.

The OpenCode team must be able to reproduce the behavior without seeing the AI Studio application.

---

# 10. DOCUMENT ANIMATIONS AND MOTION

Create:

`MOTION_SPEC.md`

Document all meaningful animation.

For each animation record:

```text
Element
Trigger
Animation
Duration
Delay
Easing
Direction
Initial State
Final State
Purpose
```

Include:

* page transitions
* component transitions
* hover effects
* button effects
* loading animations
* modal transitions
* sidebar transitions
* card animations
* charts
* background effects
* particle effects
* gradients
* scrolling effects

If exact timing is not explicitly defined in the implementation, identify the observed or implemented behavior rather than inventing a value.

---

# 11. DOCUMENT RESPONSIVE BEHAVIOR

Create:

`RESPONSIVE_SPEC.md`

Document how the application behaves at different viewport sizes.

At minimum consider:

```text
Desktop
Tablet
Mobile
```

Document:

* sidebar behavior
* navigation behavior
* grid changes
* card changes
* typography changes
* table behavior
* modal behavior
* form behavior
* scrolling
* hidden elements
* collapsed elements
* mobile navigation

The goal is for OpenCode to reproduce the responsive experience.

---

# 12. DOCUMENT ALL ASSETS

Create:

`ASSET_MANIFEST.md`

Inventory every visual asset.

Include:

```text
Asset
Location
Type
Purpose
Dimensions
Usage
Required/Optional
```

Include:

* logos
* icons
* SVGs
* images
* illustrations
* backgrounds
* videos
* fonts
* animated assets

Do not merely describe assets.

Identify their actual locations whenever possible.

---

# 13. DOCUMENT DATA AND MOCK DATA

Create:

`DATA_CONTRACT.md`

Identify data currently displayed by the prototype.

Separate:

### Prototype/mock data

from:

### Data that clearly represents a production requirement.

For each major data object document:

```text
Entity
Fields
Field Type
Example Value
Displayed Where
Required/Optional
```

Do not invent backend requirements.

If something is only mocked, explicitly mark it:

```text
PROTOTYPE_ONLY
```

---

# 14. DOCUMENT API AND BACKEND ASSUMPTIONS

Create:

`INTEGRATION_REQUIREMENTS.md`

Identify places where the frontend expects backend functionality.

Document:

```text
Feature
Current Prototype Behavior
Expected Data
User Action
Expected Response
Loading State
Error State
Success State
```

Do NOT redesign the backend.

Do NOT prescribe the OpenCode architecture.

The purpose is to tell the OpenCode team what the frontend needs.

---

# 15. DOCUMENT CURRENT IMPLEMENTATION

Create:

`AI_STUDIO_IMPLEMENTATION.md`

Document the current AI Studio implementation.

Include:

* framework
* entry points
* application structure
* major dependencies
* styling approach
* component architecture
* state management
* routing
* API calls
* data handling
* asset handling
* environment variables
* build process

This is an implementation reference only.

Explicitly warn the OpenCode team that they should adapt these concepts to their existing Athena architecture rather than blindly copying the structure.

---

# 16. CREATE A COMPONENT MAPPING SPEC

Create:

`COMPONENT_MAPPING.md`

This is one of the most important files.

Create a mapping such as:

```text
AI Studio Component
        ↓
Visual Responsibility
        ↓
Expected Production Component
        ↓
Integration Notes
```

Example:

```text
AI Studio: AgentCard
Visual responsibility:
  Displays agent identity, status and activity

Production:
  Map to existing Athena agent component if available

Rule:
  Preserve AI Studio visual appearance
```

Do this for all major components.

---

# 17. CREATE A ROUTE MAPPING SPEC

Create:

`ROUTE_MAPPING.md`

Map the AI Studio routes to the conceptual production routes.

Do not assume the production repository has the same route structure.

Instead document:

```text
AI Studio Route
Purpose
Screen
Production Integration Requirement
Notes
```

---

# 18. CREATE VISUAL ACCEPTANCE CRITERIA

Create:

`VISUAL_ACCEPTANCE_CRITERIA.md`

Define what "correct" means.

The OpenCode implementation should be considered visually complete only when:

* layout matches
* typography matches
* colors match
* spacing matches
* component hierarchy matches
* navigation matches
* responsive behavior matches
* animations match
* interaction states match
* assets match

Define any known tolerances where exact pixel matching is not practical.

---

# 19. CREATE SCREENSHOT REFERENCES

Create:

`VISUAL_REFERENCE_INDEX.md`

Identify every important screen that should be captured as a visual reference.

For example:

```text
screenshots/
├── 001-dashboard.png
├── 002-agents.png
├── 003-agent-detail.png
├── 004-tasks.png
├── 005-settings.png
└── ...
```

If the environment allows you to generate or export screenshots, create them.

Use clear filenames.

Screenshots should represent the approved current design.

---

# 20. CREATE THE MASTER HANDOFF DOCUMENT

Create:

`ATHENA_AI_STUDIO_HANDOFF.md`

This is the document the OpenCode team should read first.

It must contain:

## 1. Purpose

Explain that this package documents the approved AI Studio Athena prototype.

## 2. Source of Truth

State clearly:

```text
The approved AI Studio prototype is the visual and UX
reference implementation for Athena.
```

## 3. What OpenCode Must Preserve

List:

* visual design
* UX
* interactions
* navigation intent
* animations
* responsive behavior
* assets

## 4. What OpenCode May Change

List:

* backend
* API implementation
* database
* agent architecture
* orchestration
* internal folder structure
* infrastructure
* state-management implementation where necessary

## 5. Migration Principles

State:

```text
Preserve experience.
Adapt implementation.
Do not redesign.
Do not blindly merge architectures.
Do not overwrite existing production functionality.
```

## 6. Known Prototype Limitations

Clearly identify anything that is:

* mocked
* simulated
* incomplete
* hardcoded
* placeholder
* temporary

## 7. Required OpenCode Work

Provide a checklist.

---

# 21. CREATE AN OPENCODE EXECUTION PROMPT

Create:

`OPENCODE_MIGRATION_PROMPT.md`

This must be a ready-to-use prompt that the Athena engineering team can paste directly into OpenCode.

The prompt must instruct the OpenCode agents to:

1. Read the entire handoff package.
2. Inspect the existing Athena repository.
3. Inspect the existing architecture before changing anything.
4. Create a migration plan.
5. Map existing production functionality to the prototype UI.
6. Reuse existing production capabilities where possible.
7. Implement the AI Studio visual design inside the existing architecture.
8. Preserve production functionality.
9. Avoid copying incompatible AI Studio architecture blindly.
10. Avoid redesigning the interface.
11. Implement visual parity.
12. Validate every major screen.
13. Run tests.
14. Run the application.
15. Perform visual QA.
16. Report discrepancies.
17. Fix discrepancies.
18. Only then prepare the integration branch.

The prompt must explicitly tell OpenCode:

```text
THE AI STUDIO PROTOTYPE IS NOT A REPLACEMENT
FOR THE EXISTING ATHENA ARCHITECTURE.

IT IS THE REFERENCE IMPLEMENTATION FOR THE
VISUAL AND USER EXPERIENCE LAYER.
```

---

# 22. CREATE A MIGRATION CHECKLIST

Create:

`MIGRATION_CHECKLIST.md`

Use checkboxes.

Include:

```text
[ ] AI Studio prototype frozen
[ ] Source code captured
[ ] Design system documented
[ ] Screens inventoried
[ ] Components inventoried
[ ] Routes documented
[ ] Navigation documented
[ ] User flows documented
[ ] Interactions documented
[ ] Motion documented
[ ] Responsive behavior documented
[ ] Assets documented
[ ] Mock data documented
[ ] Integration requirements documented
[ ] Screenshots captured
[ ] Visual acceptance criteria defined
[ ] OpenCode migration prompt created
```

---

# 23. CREATE A KNOWN ISSUES DOCUMENT

Create:

`KNOWN_ISSUES.md`

Document anything that should NOT be treated as intentional design.

Separate:

```text
Known Bug
Prototype Limitation
Placeholder
Intentional Design
Unresolved Decision
```

Do not hide limitations.

---

# 24. DO NOT INVENT INFORMATION

This is critical.

If you cannot determine something from the current application, write:

```text
UNKNOWN
```

or:

```text
REQUIRES_OPEN_CODE_DECISION
```

Do not invent:

* APIs
* backend behavior
* database schemas
* production architecture
* business rules
* authentication behavior
* agent behavior
* performance requirements

---

# 25. DO NOT MODIFY THE DESIGN FOR THE SAKE OF THE HANDOFF

The purpose of this task is documentation and extraction.

Do not:

* redesign the interface
* replace components unnecessarily
* change colors
* change typography
* change spacing
* change navigation
* remove visual effects
* simplify animations
* modernize the UI
* change layouts

unless explicitly required to make the handoff accurate.

---

# 26. FINAL DELIVERABLE STRUCTURE

Produce the following package:

```text
ATHENA-AI-STUDIO-HANDOFF/
│
├── ATHENA_AI_STUDIO_HANDOFF.md
│
├── DESIGN/
│   ├── DESIGN_SYSTEM.md
│   ├── SCREEN_INVENTORY.md
│   ├── COMPONENT_INVENTORY.md
│   ├── NAVIGATION_SPEC.md
│   ├── USER_FLOWS.md
│   ├── INTERACTION_SPEC.md
│   ├── MOTION_SPEC.md
│   └── RESPONSIVE_SPEC.md
│
├── IMPLEMENTATION/
│   ├── AI_STUDIO_IMPLEMENTATION.md
│   ├── DATA_CONTRACT.md
│   ├── INTEGRATION_REQUIREMENTS.md
│   ├── COMPONENT_MAPPING.md
│   └── ROUTE_MAPPING.md
│
├── ASSETS/
│   └── ASSET_MANIFEST.md
│
├── VISUAL_QA/
│   ├── VISUAL_ACCEPTANCE_CRITERIA.md
│   ├── VISUAL_REFERENCE_INDEX.md
│   └── screenshots/
│
├── MIGRATION/
│   ├── OPENCODE_MIGRATION_PROMPT.md
│   ├── MIGRATION_CHECKLIST.md
│   └── KNOWN_ISSUES.md
│
└── PROTOTYPE/
    └── README.md
```

If the environment does not allow creation of some files or screenshots, clearly identify what could not be produced and provide the exact information needed to recreate them.

---

# 27. FINAL QUALITY CHECK

Before completing the task, verify:

### Visual

```text
[ ] All screens identified
[ ] All major components identified
[ ] Design tokens extracted
[ ] Assets identified
[ ] Animations identified
[ ] Responsive behavior identified
```

### Functional

```text
[ ] Navigation documented
[ ] User flows documented
[ ] Interaction states documented
[ ] Loading states documented
[ ] Error states documented
[ ] Empty states documented
```

### Engineering

```text
[ ] Current implementation documented
[ ] Mock data identified
[ ] Backend assumptions identified
[ ] Integration boundaries identified
[ ] No unsupported architecture assumptions
```

### Handoff

```text
[ ] OpenCode migration prompt created
[ ] Migration checklist created
[ ] Visual acceptance criteria created
[ ] Known issues documented
[ ] Screenshot references created
```

---

# FINAL INSTRUCTION

Do not simply summarize the application.

**Reverse-engineer the current AI Studio prototype into a production-grade handoff specification.**

The OpenCode team should be able to receive this package and understand:

> "This is exactly what Athena looks like, exactly how users interact with it, exactly which visual rules must be preserved, and exactly which parts must be adapted to the existing production architecture."

The ultimate goal is:

```text
AI STUDIO PROTOTYPE
        ↓
VISUAL / UX SOURCE OF TRUTH
        ↓
STRUCTURED HANDOFF PACKAGE
        ↓
OPENCODE
        ↓
EXISTING ATHENA ARCHITECTURE
        ↓
SAME LOOK + SAME FEEL
        +
PRODUCTION-GRADE FUNCTIONALITY
```

Do not stop after generating a summary.

Produce the complete handoff package and clearly identify every file created.
