# Athena — AI Studio → OpenCode Master Handoff Document

> **Document Type**: Master Engineering & UX Reference Package  
> **Source Platform**: Google AI Studio Prototype (v2.4.0)  
> **Target Platform**: OpenCode Production Repository (`jmlusu/athena`)  
> **Audience**: OpenCode Frontend, Backend & Systems Engineering Teams  
> **Status**: Approved Visual & Interaction Baseline (FROZEN)  

---

## 1. Purpose of this Package

This package captures and specifies the complete user interface, visual aesthetics, design tokens, interactive behaviors, navigation paradigms, document layouts, and integration expectations of the Athena AI Studio application.

The OpenCode engineering team already maintains a separate GitHub repository and production architecture. **Your task is not to merge or copy the AI Studio project's internal scaffolding, but to reproduce the exact visual design, user experience, and behavior inside OpenCode's production architecture.**

---

## 2. Core Source of Truth Rule

```text
═════════════════════════════════════════════════════════════════════════
THE APPROVED AI STUDIO PROTOTYPE IS THE VISUAL AND UX SOURCE OF TRUTH.
═════════════════════════════════════════════════════════════════════════
```

When building or updating Athena in the OpenCode repository:
- **Visual Design Parity**: Layouts, typography, colors, borders, shadows, cards, gauges, charts, and document previews must look identical to this prototype.
- **Behavioral Parity**: Navigation, modal gates, interactive tabs, filtering, dehumanizer toggles, 4-hour countdown timers, and export actions must behave as documented in this package.
- **Do Not Redesign**: Do not "modernize", simplify, redesign, or convert into generic templates unless explicitly requested.

---

## 3. Boundary of Ownership

| Domain | AI Studio (This Package) | OpenCode Engineering Team |
|---|---|---|
| **Visual Appearance** | **Source of Truth** (Preserve 100%) | Implement to match visual spec |
| **User Interaction** | **Source of Truth** (Preserve 100%) | Implement to match user flows |
| **Typography & Styling** | **Source of Truth** (Preserve 100%) | Implement via production CSS / Tailwind |
| **Frontend Framework** | Reference (React 19 + TypeScript + Vite) | Implement in OpenCode production frontend |
| **Backend & APIs** | Reference Prototype Endpoints | **OpenCode Production Backend & DB** |
| **Database & Persistence** | In-Memory / Ephemeral Stubs | **OpenCode Database / Cloud SQL** |
| **Worker / Cron Engine** | Client-Side Interval Simulation | **Production Background Workers / Celery** |
| **Orchestration & LLMs** | Gemini 3.8 Flash / Server Express Routes | **Production Agent & LLM Pipelines** |

---

## 4. Key Architectural & Experience Highlights

1. **Autonomous 3-Scope Ingress**:
   - `Lilongwe Local (MW)`: In-person / Capital Hill / On-site roles
   - `Lilongwe Remote Hub`: 100% remote positions targeting Malawi residents
   - `International Remote`: Global opportunities across US/EU/African timezones

2. **Semantic ATS Compatibility Engine**:
   - $\ge 90\%$ (`CRITICAL_MATCH`): Triggers autonomous document tailoring (Resume, Cover Letter, Proposal)
   - $80 - 89\%$ (`FLAGGED_REVIEW`): Auto-flags into candidate priority review queue
   - $< 80\%$: Standard pipeline ingestion

3. **Upscale White-Collar Document Studio**:
   - Toggleable 1-Column vs. 2-Column pristine document layouts
   - Embedded **Dehumanizer Engine** that purges AI telltales (*"delve"*, *"spearhead"*, *"testament to"*, *"in today's fast-paced world"*) in favor of calm, assertive, human operational prose
   - Direct Print / PDF vector formatting

4. **Mandatory Human Sign-Off Gate**:
   - Athena acts as a digital agent but requires explicit human power-of-attorney sign-off with typed signature before submitting applications
   - Cryptographic SHA-256 submission confirmation receipts with 7-day follow-up outreach trackers

5. **Multi-Format LinkedIn Integration**:
   - Easy Apply draft generation (custom cover notes, screening answers, hashtags)
   - Profile Experience section form mapping
   - Cryptographic JSON and Markdown export downloads

6. **External n8n Workflow Automation Engine**:
   - 5-node visual topology with active webhook receiver `/api/webhooks/n8n` and payload dispatcher

---

## 5. Handoff Package Directory Structure

```text
ATHENA-AI-STUDIO-HANDOFF/
│
├── ATHENA_AI_STUDIO_HANDOFF.md         # Master overview (This file)
│
├── DESIGN/
│   ├── DESIGN_SYSTEM.md                # Colors, typography, spacing, shadows, tokens
│   ├── SCREEN_INVENTORY.md             # 7 Views + 3 Modal screens exhaustive table
│   ├── COMPONENT_INVENTORY.md          # 18 reusable & layout components
│   ├── NAVIGATION_SPEC.md              # Route map, sidebar states, breadcrumbs
│   ├── USER_FLOWS.md                   # 6 primary end-to-end user journeys
│   ├── INTERACTION_SPEC.md             # Button clicks, hovers, copies, inputs
│   ├── MOTION_SPEC.md                  # Transitions, pulses, radial progress fills
│   └── RESPONSIVE_SPEC.md              # Desktop (1440px), Tablet (768px), Mobile (375px)
│
├── IMPLEMENTATION/
│   ├── AI_STUDIO_IMPLEMENTATION.md     # Express server, Vite middleware, TS types
│   ├── DATA_CONTRACT.md                # Data schemas (Opportunity, Profile, Receipt, Settings)
│   ├── INTEGRATION_REQUIREMENTS.md     # Expected API contracts & payload schemas
│   ├── COMPONENT_MAPPING.md            # AI Studio component → OpenCode production component
│   └── ROUTE_MAPPING.md                # AI Studio routes → OpenCode route architecture
│
├── ASSETS/
│   └── ASSET_MANIFEST.md               # Fonts, icons (Lucide), logos, cert PDFs
│
├── VISUAL_QA/
│   ├── VISUAL_ACCEPTANCE_CRITERIA.md   # Pixel, typography, color tolerances
│   ├── VISUAL_REFERENCE_INDEX.md       # Screen-by-screen visual catalog
│   └── screenshots/
│       └── README.md                   # Screenshot capture guide
│
├── MIGRATION/
│   ├── OPENCODE_MIGRATION_PROMPT.md    # Ready-to-paste prompt for OpenCode engineer/agent
│   ├── MIGRATION_CHECKLIST.md          # Step-by-step verification checklist
│   └── KNOWN_ISSUES.md                 # Prototype-only mocks vs production decisions
│
└── PROTOTYPE/
    └── README.md                       # Local execution instructions
```

---

## 6. Migration Protocol for OpenCode

1. **Read all files in this handoff package** before writing any code.
2. **Inspect existing OpenCode production components** and identify matches in `IMPLEMENTATION/COMPONENT_MAPPING.md`.
3. **Incorporate the Design System** (`DESIGN/DESIGN_SYSTEM.md`) into your global CSS / Tailwind setup without altering backend business logic.
4. **Implement screens against `VISUAL_QA/VISUAL_ACCEPTANCE_CRITERIA.md`**.
5. **Connect real databases and backend agents** to the API contracts documented in `IMPLEMENTATION/INTEGRATION_REQUIREMENTS.md`.
