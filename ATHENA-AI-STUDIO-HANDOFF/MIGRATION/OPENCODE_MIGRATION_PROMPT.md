# Athena — OpenCode Migration Execution Prompt

> **Instructions**: Paste the prompt below directly into your OpenCode engineering session to initiate the Athena UI/UX reproduction.

---

```markdown
# ATHENA MIGRATION — REPRODUCE AI STUDIO UI & UX IN OPENCODE PRODUCTION

## 1. CRITICAL DIRECTIVE

THE AI STUDIO PROTOTYPE IS NOT A REPLACEMENT FOR THE EXISTING ATHENA ARCHITECTURE.
IT IS THE REFERENCE IMPLEMENTATION FOR THE VISUAL AND USER EXPERIENCE LAYER.

Do NOT overwrite or delete existing OpenCode backend services, databases, Celery workers, or agent orchestration pipelines.
Your mission is to REPRODUCE the approved visual design, interactions, and user flows documented in the `ATHENA-AI-STUDIO-HANDOFF/` package inside our existing production repository.

---

## 2. REQUIRED EXECUTION SEQUENCE

### Step 1: Read the Master Handoff Package
Inspect all specifications located in `ATHENA-AI-STUDIO-HANDOFF/`:
- `ATHENA_AI_STUDIO_HANDOFF.md` (Master Overview)
- `DESIGN/DESIGN_SYSTEM.md` (Colors, Typography, Spacing, Shadows, Tokens)
- `DESIGN/SCREEN_INVENTORY.md` (7 Views + 3 Modals)
- `DESIGN/COMPONENT_INVENTORY.md` (Component hierarchy & props)
- `DESIGN/USER_FLOWS.md` & `DESIGN/INTERACTION_SPEC.md`
- `IMPLEMENTATION/COMPONENT_MAPPING.md` & `IMPLEMENTATION/ROUTE_MAPPING.md`
- `VISUAL_QA/VISUAL_ACCEPTANCE_CRITERIA.md`

### Step 2: Inspect Existing OpenCode Architecture
Before making any changes:
- Catalog existing frontend components, routing, and styling setup.
- Identify how existing backend APIs map to the contracts defined in `IMPLEMENTATION/INTEGRATION_REQUIREMENTS.md`.

### Step 3: Integrate Design Tokens & Styling
- Install or verify Google Fonts: `'Cinzel'`, `'Lora'`, and `'Plus Jakarta Sans'`.
- Configure Tailwind CSS tokens matching `DESIGN/DESIGN_SYSTEM.md` (Athena Brand Orange `#F97316`, Sign-off Red `#DC2626`, Dark Chassis `#1E2024` / `#141619`, Slate borders `#E2E8F0`).
- Implement the skeuomorphic depth primitives (`.raised`, `.sunken`, `.glow-amber`, `.tactile`).

### Step 4: Implement Core Views & Components
1. **Structural Shell**: 3-column chassis with `LeftSidebar` (3 scopes, categories, 4h countdown widget), Top Application Bar with breadcrumbs, and `RightSidebar` (auto-pilot toggles, pending sign-off queue).
2. **Pipeline & Command**:
   - `LayeredMountainChart` (3-layer SVG mountain dynamics with hover telemetry tooltip)
   - `MetricsAndBarChart` (5 metric cards, skills distribution bar chart, conversion funnel line graph with circular data point markers)
   - `PipelineView` (6-stage Kanban board with search and status progression triggers)
3. **Scraper & Discovery**: 4 scope selector pills, platform tags, and sourced opportunities table with circular ATS dials.
4. **Pristine Document Studio**:
   - 1-Column vs 2-Column layout toggle
   - Dehumanizer toggle
   - Resume, Cover Letter, and Consultancy Proposal tabs
   - `@media print` vector printout formatting
5. **Online Forms & Sign-Off**: Form manifest, screening responses, and mandatory human power-of-attorney sign-off gate with typed signature input.
6. **Receipts & Follow-ups**: SHA-256 verified certificates, 7-day follow-up email draft generator, and LinkedIn export trigger.
7. **LinkedIn Export Modal**: Multi-tab dialog for LinkedIn Easy Apply notes, screening answers, profile experience mapping, and `.json` / `.md` downloads.
8. **n8n Workflow Nodes**: 5-node visual topology and webhook tester.
9. **Applicant Profile**: Dossier settings, rates (USD/MWK), and dynamic ATS keywords manager.

### Step 5: Validation & QA
- Run tests and build verification (`npm run build` / `npm test`).
- Perform visual QA against `VISUAL_QA/VISUAL_ACCEPTANCE_CRITERIA.md`.
- Ensure all micro-interactions, copy buttons, layout switches, and modal gates function seamlessly.
```
