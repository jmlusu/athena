# Athena — Migration Plan

**Document Type**: Controlled Implementation Plan
**Source**: MIGRATION_GAP_ANALYSIS.md
**Branch**: `feat/athena-ai-studio-migration` (to be created)
**Date**: 2026-09-27

---

## 1. Migration Branch Strategy

```bash
# Create migration branch from current integration branch
git checkout integration/athena-ai-studio
git checkout -b feat/athena-ai-studio-migration
```

All migration work occurs on `feat/athena-ai-studio-migration`. Main branch `integration/athena-ai-studio` remains stable for hotfixes.

---

## 2. Phase Breakdown

### Phase 0: Baseline ✅ COMPLETE
- [x] Repository inspection
- [x] Handoff package review
- [x] MIGRATION_BASELINE.md
- [x] MIGRATION_GAP_ANALYSIS.md
- [x] This MIGRATION_PLAN.md

---

### Phase 1: Design System (Days 1-3)
**Goal**: Establish exact visual tokens from AI Studio spec

#### Tasks:
1. **Update Tailwind Theme** (`frontend/src/index.css`)
   - [ ] Replace navy `#070A40` with chassis colors:
     - `--color-chassis-base: #141619`
     - `--color-chassis-frame: #1E2024`
     - `--color-chassis-raised: #24272F`
     - `--color-chassis-active: #2A2E37`
     - `--color-chassis-border: #2D3139`
     - `--color-chassis-border-subtle: #3E4452`
   - [ ] Update sign-off red: `--color-danger: #DC2626`, `--color-danger-hover: #B91C1C`
   - [ ] Add semantic status tints (7 sets with bg/border/text)
   - [ ] Add Cascadia Code to mono font stack
   - [ ] Add shadow primitives: `.raised`, `.sunken`, `.glow-amber`, `.tactile`
   - [ ] Verify radii tokens: pill (full), badge (6px), button (8px), card (12px), modal (16px)

2. **Verify Google Fonts** (`index.html`)
   - [ ] Cinzel (500, 600, 700)
   - [ ] Lora (400, 500, 600, 700 + italic)
   - [ ] Plus Jakarta Sans (300-700)
   - [ ] Add Cascadia Code via `@font-face` or system fallback

3. **Create Design Token Test Page** (temporary)
   - [ ] Visual verification of all colors, typography, shadows
   - [ ] Remove after Phase 10

**Acceptance**: All tokens match DESIGN_SYSTEM.md exactly. Build passes.

---

### Phase 2: Application Shell (Days 3-4)
**Goal**: 3-column chassis with correct visual language

#### Tasks:
1. **Update `AthenaLayout.tsx`**
   - [ ] Apply chassis colors to left/right sidebars (`bg-chassis-frame`)
   - [ ] Update active nav item: `bg-accent text-white border-l-2 border-accent`
   - [ ] Update scope pill active: `bg-chassis-active text-white border-l-2 border-accent`
   - [ ] Update top app bar: `bg-white/90 backdrop-blur-md border-b border-border`
   - [ ] Verify sidebar widths: `w-68` (left), `w-72` (right)
   - [ ] Verify brand wordmark uses `font-brand` (Cinzel) with gradient
   - [ ] Verify engine pulse dot: `bg-emerald-500 animate-ping`
   - [ ] Verify breadcrumb typography: `font-brand` + `font-heading`

2. **Update `ScopeFilter.tsx`**
   - [ ] Scope buttons: active uses chassis colors
   - [ ] Category pills: Jobs=orange, Consultancies=sign-off red

3. **Update `CronCountdown.tsx`**
   - [ ] Container: `bg-chassis-base` with `.sunken` shadow
   - [ ] Timer text: mono font, amber `#FFA928`
   - [ ] Progress bars: amber glow

4. **Update `AutomationControls.tsx`**
   - [ ] Container: `bg-chassis-frame`
   - [ ] Toggles: orange active, proper labels
   - [ ] Pending sign-off cards: red alert badge

**Acceptance**: Shell visually matches AI Studio reference. No functional changes.

---

### Phase 3: Navigation (Day 4-5)
**Goal**: Route mapping + breadcrumb behavior

#### Tasks:
1. **Verify Route Mapping** (`App.tsx`)
   - [ ] `/dashboard` → Pipeline & Command
   - [ ] `/jobs` → Scraper & Discovery
   - [ ] `/documents` → Pristine Document Studio
   - [ ] `/form-filler` → Online Forms & Sign-Off
   - [ ] `/receipts` → Receipts & Follow-ups
   - [ ] `/n8n` → n8n Workflow Nodes
   - [ ] `/profile` → Applicant Skills & Profile
   - [ ] Deep links: `/documents/:jobId`, `/form-filler/:jobId`, `/receipts/:id`

2. **Breadcrumb Logic** (`AthenaLayout.tsx`)
   - [ ] Brand → Chevron → Module Name → Chevron → Scope Pill
   - [ ] Scope pill updates on sidebar change
   - [ ] Right status: "Lilongwe Gateway: Active" with pulse

3. **Mobile Navigation**
   - [ ] Left sidebar drawer (hamburger menu)
   - [ ] Right sidebar drawer (sliders icon)
   - [ ] Overlay backdrop on mobile

**Acceptance**: All routes accessible, breadcrumbs correct, mobile drawers work.

---

### Phase 4: Shared Components (Days 5-7)
**Goal**: Reusable visual primitives matching AI Studio

#### Tasks:
1. **`CircularGauge` / `ATSGauge`** — Refine existing
   - [ ] Threshold colors: ≥90% emerald `#10B981`, 80-89% amber `#FFA928`, <80% slate `#64748B`
   - [ ] Size variants: sm (40px), md (80px), lg (120px)
   - [ ] Stroke math: `C = 2πr`, `stroke-dashoffset = C * (1 - score/100)`

2. **`MetricCard`** — Redesign to AI Studio spec
   - [ ] 5 specific metric types with exact labels
   - [ ] Background tint per metric type
   - [ ] Monospace values, `font-brand` for labels

3. **`Badge` / `StatusPill`** — New component
   - [ ] 7 semantic variants with exact tints
   - [ ] Sizes: micro (10px mono), standard, large

4. **`Button` Variants** — Verify existing
   - [ ] Primary: chassis surface dark `#18181B`
   - [ ] Accent: orange `#F97316` hover `#EA580C`
   - [ ] Danger: sign-off red `#DC2626` hover `#B91C1C`
   - [ ] LinkedIn: blue `#0A66C2`
   - [ ] Ghost/Outline variants
   - [ ] Tactile press: `translateY(1px)`

5. **`Modal` Base** — New reusable
   - [ ] `rounded-2xl` (16px), backdrop blur
   - [ ] Fade-in 200ms, scale from 0.98
   - [ ] Focus trap, ESC to close

6. **`Toast`** — New component
   - [ ] Top-right, slide-in-from-top-2, 300ms
   - [ ] Auto-dismiss 5s, manual dismiss
   - [ ] Variants: info (amber), success (emerald), error (red)

**Acceptance**: All components visually match DESIGN_SYSTEM.md. Storybook/test page verifies.

---

### Phase 5a: Pipeline & Command Dashboard (Days 7-11)
**Goal**: Complete SCR-01 with all visualizations

#### Tasks:
1. **`LayeredMountainChart`** — NEW COMPONENT
   - [ ] 3-layer SVG polygon mountain peaks
   - [ ] Gradients: Global Remote (orange), Lilongwe Hub (charcoal), Consultancies (red dashed)
   - [ ] Topographic background pattern
   - [ ] Layer filter toggles (checkboxes)
   - [ ] Hover: circle expands r=4→6, telemetry tooltip top-right
   - [ ] Responsive: full width desktop, stacked mobile

2. **`MetricsAndBarChart`** — NEW COMPONENT
   - [ ] 5 Metric Cards:
     1. Discovered (total new)
     2. ATS ≥90% (Critical Match) — emerald tint
     3. ATS 80-89% (Flagged Review) — amber tint
     4. Human Sign-Off Pending — red tint
     5. Submitted — green tint
   - [ ] Skills Compatibility: 5 horizontal bars, animate width 0→target (700ms)
   - [ ] Conversion Funnel: SVG line graph with circular data markers
   - [ ] Click handlers for each metric card → filter pipeline

3. **`PipelineView` / `PipelineKanbanBoard`** — Extract from Dashboard
   - [ ] 6 Stages (exact labels):
     1. Discovered
     2. ATS Evaluated
     3. Tailored / Ready
     4. Awaiting Sign-Off
     5. Submitted
     6. Interview & Award
   - [ ] Search filter input
   - [ ] Stage filter pills
   - [ ] Drag/drop or click-to-advance
   - [ ] Cards show: category badge, platform, timestamp, org, compensation, reqs, circular gauge, actions

4. **Integrate into `Dashboard.tsx`**
   - [ ] Replace current metric cards with `MetricsAndBarChart`
   - [ ] Replace `MountainAreaChart` with `LayeredMountainChart`
   - [ ] Replace inline Kanban with `PipelineKanbanBoard`
   - [ ] Wire data from API to new components

**Acceptance**: Dashboard visually matches AI Studio SCR-01. All interactions work.

---

### Phase 5b: Scraper & Discovery View (Days 11-12)
**Goal**: Complete SCR-02

#### Tasks:
1. **Redesign `JobList.tsx`** → `ScraperDiscoveryView`
   - [ ] Search query input + keyword bar
   - [ ] Platform tag pills: All, LinkedIn, Upwork, ReliefWeb, Corporate
   - [ ] 4 Scope Selector Cards (not sidebar pills):
     - All 3 Scopes
     - Lilongwe Local (MapPin)
     - Lilongwe Remote Hub (Building)
     - International Remote (Globe)
   - [ ] "Run Live Semantic Scrape" button (primary action)
   - [ ] Listings table with: category badge, platform tag, relative time, org, compensation, req badges, circular gauge, action buttons
   - [ ] Emerald alert banner on scrape completion

**Acceptance**: View matches AI Studio SCR-02. Scrape triggers API.

---

### Phase 5c: Document Studio Polish (Days 12-13)
**Goal**: Perfect SCR-03 (mostly complete)

#### Tasks:
1. **Verify `DocumentStudio.tsx`**
   - [ ] 1-col / 2-col toggle instant switch
   - [ ] Dehumanizer toggle: orange active, real text transformation
   - [ ] Tabs: Resume, Cover Letter, Consultancy Proposal
   - [ ] Proposal: red theme, executive summary box, 4 sections, signatory seal
   - [ ] Print: `@media print` removes all chrome, clean white paper
   - [ ] Copy Markdown: clipboard + "Copied!" 2.5s feedback
   - [ ] Regenerate: calls AI API, shows loading spinner

2. **Typography Polish**
   - [ ] Candidate name: `text-2xl sm:text-3xl font-heading` (Lora, bold, tight)
   - [ ] Section headers: `text-xs font-bold uppercase tracking-wider font-mono`
   - [ ] Body: `text-xs text-muted leading-relaxed`
   - [ ] Monospace for numbers/timers

**Acceptance**: Document Studio matches AI Studio SCR-03 exactly.

---

### Phase 5d: Online Forms & Sign-Off (Days 13-14)
**Goal**: Complete SCR-04 + MOD-03

#### Tasks:
1. **Unify FormFiller** — Single route with modal
   - [ ] `/form-filler` shows landing with job selector
   - [ ] Click job → opens `FormFillerModal` (not page)
   - [ ] Modal: identity, screening fields, doc manifest, sign-off gate
   - [ ] Sign-off gate: red border (`border-2 border-danger`), checkbox + typed signature
   - [ ] Validation: submit disabled until both complete
   - [ ] On submit: calls API, generates receipt, redirects to `/receipts`

2. **Extract `SignOffModal`** — Reusable MOD-03
   - [ ] Dedicated modal component
   - [ ] Power-of-attorney legal text
   - [ ] Checkbox + signature input
   - [ ] Submit → receipt generation

**Acceptance**: Flow matches AI Studio Flows 2 & 3. Real submission works.

---

### Phase 5e: Receipts & Follow-ups (Days 14-15)
**Goal**: Complete SCR-05

#### Tasks:
1. **Complete `Receipts.tsx`**
   - [ ] Left column: receipt list with status badges, hashes, timestamps
   - [ ] Right column: certificate card with receipt ID, company, date, signature verification, SHA-256 token
   - [ ] 7-day follow-up generator: email draft with copy button
   - [ ] LinkedIn Export button → opens `LinkedInExportModal`
   - [ ] Data from real API (not mock)

**Acceptance**: View matches AI Studio SCR-05. Real data connected.

---

### Phase 5f: n8n Workflow Nodes (Days 15-16)
**Goal**: Complete SCR-06

#### Tasks:
1. **Complete `N8nIntegration.tsx`**
   - [ ] Dark canvas `#18181B` background
   - [ ] 5 sequential nodes with connectors:
     1. Cron 4h
     2. Scraper Node
     3. Gemini ATS Evaluator
     4. Switch Gate
     4. Human Sign-Off Gate
   - [ ] Node states: pending, active, complete, error
   - [ ] Left: JSON payload editor + "Fire n8n Webhook Trigger"
   - [ ] Right: Live JSON response terminal
   - [ ] Webhook URL from settings

**Acceptance**: View matches AI Studio SCR-06. Webhook tester functional.

---

### Phase 5g: Applicant Skills & Profile (Days 16-17)
**Goal**: Complete SCR-07

#### Tasks:
1. **Complete `ApplicantProfile.tsx`**
   - [ ] Left: Identity, contact, rates (USD/MWK), Lilongwe station
   - [ ] Left: Dynamic ATS keywords badge list with add/remove
   - [ ] Right: File upload dropzone (drag/drop + click)
   - [ ] Right: Uploaded master resumes, case studies, contracts list
   - [ ] Right: Digital power-of-attorney advisory notice
   - [ ] Persist to backend API

**Acceptance**: View matches AI Studio SCR-07. Data persists.

---

### Phase 5h: Opportunity Detail Modal (Day 17-18)
**Goal**: Complete MOD-01

#### Tasks:
1. **Create `OpportunityDetailModal.tsx`** (NEW)
   - [ ] Header: category pill, platform badge, timestamp, title, company, location, compensation
   - [ ] Body: Circular ATS gauge (large), dehumanized pitch callout, full TOR, requirements grid
   - [ ] Footer: Close, Export to LinkedIn, Inspect Tailored Documents, Authorize & Submit
   - [ ] Trigger from: Pipeline cards, Scraper table, Receipts list
   - [ ] Uses `Modal` base component

2. **Remove/Deprecate `JobDetail` page**
   - [ ] Redirect `/jobs/:id` → open modal
   - [ ] Or keep page for SEO, but modal is primary

**Acceptance**: Modal matches AI Studio MOD-01. Opens from all triggers.

---

### Phase 5i: LinkedIn Export Modal (Days 18-19)
**Goal**: Complete MOD-02

#### Tasks:
1. **Create `LinkedInExportModal.tsx`** (NEW)
   - [ ] Tab 1: Easy Apply Draft
     - Headline, dehumanized pitch, ATS skills tags (comma/hashtag copy), full cover note preview
   - [ ] Tab 2: Profile Experience Entry
     - Field mappings: Title, Company, Employment Type, Location Type
     - Formatted description box with copy buttons
   - [ ] Tab 3: JSON / Developer Export
     - Raw JSON payload with SHA-256 hash and screening answers
     - Download `.json` and `.md` buttons
   - [ ] Footer: Download MD, Download JSON, Open LinkedIn Jobs, Done
   - [ ] Uses `Modal` base component

**Acceptance**: Modal matches AI Studio MOD-02. Downloads generate valid files.

---

### Phase 6: Interactions & Micro-interactions (Days 19-20)
**Goal**: All INTERACTION_SPEC.md behaviors implemented

#### Tasks:
- [ ] Nav item click → active state visual
- [ ] Scope pill click → filter instant
- [ ] Category toggle → filter instant
- [ ] 4h Cron button → timer reset + amber toast (5s)
- [ ] Kanban card hover → border darken + shadow-xs
- [ ] Kanban card title click → OpportunityDetailModal
- [ ] Column switcher → instant re-render
- [ ] Dehumanizer toggle → orange active + text change
- [ ] Copy button → icon change + "Copied!" 2.5s
- [ ] Print button → `window.print()`
- [ ] Sign-off checkbox → unlocks submit button
- [ ] Typed signature → updates legal signer real-time
- [ ] Export LinkedIn button → opens modal
- [ ] Download buttons → file download prompt
- [ ] Mountain chart point hover → expand + tooltip
- [ ] Skills bar load → width animate 700ms
- [ ] Button press → tactile translateY(1px)
- [ ] Reduced motion → all animations 0.01ms

**Acceptance**: All 28 interactions from INTERACTION_SPEC.md verified.

---

### Phase 7: Data Integration (Days 20-23)
**Goal**: Connect all UI to production backend APIs

#### Tasks:
1. **API Contract Alignment** (`frontend/src/lib/athena/api.ts`)
   - [ ] Map AI Studio endpoints to OpenCode endpoints
   - [ ] Update request/response types to match INTEGRATION_REQUIREMENTS.md
   - [ ] Add missing endpoints: `dehumanize`, `submit-application`

2. **Connect Dashboard Data**
   - [ ] Mountain chart data from analytics endpoint
   - [ ] Metric cards from pipeline stats
   - [ ] Skills bars from applicant profile
   - [ ] Funnel from application progression

3. **Connect Scraper Discovery**
   - [ ] "Run Live Semantic Scrape" → `POST /api/v1/athena/scrape`
   - [ ] Listings table from `GET /api/v1/athena/jobs`
   - [ ] ATS scores from scorer service

4. **Connect Document Studio**
   - [ ] Regenerate → `POST /api/v1/athena/generate-resume` / `generate-document`
   - [ ] Dehumanize → `POST /api/v1/athena/dehumanize` (new)
   - [ ] Opportunity selector → real opportunities from API

5. **Connect Form Filler & Sign-Off**
   - [ ] Auto-fill from applicant profile
   - [ ] Sign-off submit → `POST /api/v1/athena/submit-application` (new)
   - [ ] Returns SHA-256 receipt → redirect to receipts

6. **Connect Receipts**
   - [ ] List from `GET /api/v1/athena/receipts`
   - [ ] Certificate data from receipt object
   - [ ] Follow-up email draft generation (client-side)
   - [ ] LinkedIn export → modal with real data

6. **Connect n8n**
   - [ ] Webhook URL from settings
   - [ ] Webhook tester → `POST /api/v1/athena/webhooks/n8n`
   - [ ] Node status from workflow engine

7. **Connect Profile**
   - [ ] Profile CRUD via API
   - [ ] File uploads to object storage
   - [ ] ATS keywords management

**Acceptance**: All UI connected to production APIs. No mock data remains.

---

### Phase 8: Responsive Behavior (Days 23-24)
**Goal**: Verify RESPONSIVE_SPEC.md at all breakpoints

#### Tasks:
- [ ] Desktop (≥1280px): Full 3-col, 6-col kanban, 4 legend items
- [ ] Tablet (768-1023px): Right sidebar collapses, 2-3 col kanban, doc studio stacks
- [ ] Mobile (<640px): Left drawer, single-col kanban, full-width modals, breadcrumb simplified
- [ ] Document Studio: 2-col → 1-col stack, print layout linear
- [ ] Metric cards: responsive grid (1-2-4-5 cols)
- [ ] Tables: horizontal scroll on mobile
- [ ] Touch targets: ≥44px on mobile

**Acceptance**: No horizontal overflow, all content accessible at all sizes.

---

### Phase 9: Motion & Animation (Days 24-25)
**Goal**: Implement MOTION_SPEC.md exactly

#### Tasks:
- [ ] Engine pulse: `animate-ping` + `animate-pulse` 2000ms
- [ ] Toast entry: `fade-in slide-in-from-top-2 duration-300`
- [ ] Modal: `fade-in duration-200` + `backdrop-blur-xs`
- [ ] Mountain chart hover: `r=4→6`, stroke-width `2→3`, `duration-150`
- [ ] Skills bar: `width 0→target duration-700 ease-out`
- [ ] Button press: `translateY(1px)` + inset shadow, `duration-120`
- [ ] Page transitions: `fade-in duration-200`
- [ ] Reduced motion: clamp all to `0.01ms`, disable pulse/ping

**Acceptance**: All animations match spec. Reduced motion works.

---

### Phase 10: Visual QA (Days 25-27)
**Goal**: Screenshot comparison against AI Studio reference

#### Tasks:
1. **Set up Visual Regression Testing**
   - [ ] Configure Playwright visual comparison
   - [ ] Capture baseline screenshots at 1440×900 and 1920×1080
   - [ ] Test states per VISUAL_REFERENCE_INDEX.md

2. **Run Visual QA Checklist** (per VISUAL_ACCEPTANCE_CRITERIA.md)
   - [ ] Frame & Color Fidelity (7 checks)
   - [ ] Typography & Hierarchy (4 checks)
   - [ ] Mountain Dynamics & Visualizations (3 checks)
   - [ ] Document Studio & Print (4 checks)
   - [ ] Mandatory Human Sign-Off Gate (3 checks)
   - [ ] LinkedIn Export Modal (3 checks)

3. **Document Differences**
   - [ ] Classify each: DESIGN_ERROR, IMPLEMENTATION_ERROR, PRODUCTION_CONSTRAINT, etc.
   - [ ] Fix all DESIGN_ERROR and IMPLEMENTATION_ERROR
   - [ ] Document PRODUCTION_CONSTRAINT with approval

**Acceptance**: All VISUAL_ACCEPTANCE_CRITERIA.md checks PASS.

---

### Phase 11: Functional QA (Days 27-29)
**Goal**: End-to-end functional verification

#### Tasks:
- [ ] Navigation: all routes accessible, breadcrumbs correct
- [ ] Authentication: profile loads, settings persist
- [ ] API calls: all endpoints return expected data
- [ ] Forms: validation, submission, error handling
- [ ] Data loading: skeletons, error states, empty states
- [ ] Data updates: optimistic updates, rollback on error
- [ ] Error handling: network errors, 4xx/5xx responses
- [ ] Empty states: no jobs, no receipts, no profile
- [ ] Loading states: all async operations
- [ ] Agent interactions: scrape, score, generate, submit
- [ ] Existing Athena functionality: all preserved

**Acceptance**: All functional tests pass. No regressions.

---

### Phase 12: Cleanup & Reports (Days 29-30)
**Goal**: Final deliverables and branch preparation

#### Tasks:
1. **Code Cleanup**
   - [ ] Remove temporary test pages
   - [ ] Remove debug code, console.logs
   - [ ] Remove unused legacy components (`JobDetail` page if replaced)
   - [ ] Verify no secrets in code
   - [ ] Run `pnpm run lint` and `pnpm run build`

2. **Final Reports**
   - [ ] `FINAL_VISUAL_PARITY_REPORT.md` — Screen-by-screen PASS/FAIL
   - [ ] `FINAL_MIGRATION_REPORT.md` — Complete per directive Section 44

3. **Git Preparation**
   - [ ] `git status` — verify clean
   - [ ] No accidental files, no secrets, no temp files
   - [ ] Meaningful commit history (per Section 30)

4. **Human Approval Gates**
   - [ ] Gate 1: Migration plan approved ✅ (this doc)
   - [ ] Gate 2: Design system implemented
   - [ ] Gate 3: Application shell visually approved
   - [ ] Gate 4: Core screens visually approved
   - [ ] Gate 5: Functional integration approved
   - [ ] Gate 6: Final visual QA approved
   - [ ] Gate 7: Production merge approved

---

## 3. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Color system breaks existing components | High | High | Phase 1 isolated, test page verifies |
| Mountain chart SVG complexity | Medium | High | Build incrementally, test each layer |
| API contract mismatches | High | High | Phase 7 early, mock server for UI dev |
| Visual QA failures | Medium | High | Automated screenshots, pixel tolerance |
| E2E test flakiness | Medium | Medium | Retry logic, stable selectors |
| Scope creep | Medium | Medium | Strict phase gates, no new features |

---

## 4. Resource Allocation

| Role | Phases |
|------|--------|
| **Frontend Engineer** | All phases (primary) |
| **Backend Engineer** | Phase 7 (API contracts) |
| **QA Engineer** | Phase 10, 11 (visual + functional) |
| **Designer** | Phase 1, 10 (token verification, visual approval) |

---

## 5. Success Criteria (per Directive Section 42)

- [ ] Application builds (`pnpm run build`)
- [ ] Existing tests pass (`pnpm run test`, `pnpm run test:e2e`)
- [ ] New tests pass
- [ ] Existing production functionality remains available
- [ ] All required screens exist (7 views + 3 modals)
- [ ] All required routes exist
- [ ] Navigation works
- [ ] Production data is connected
- [ ] Loading states work
- [ ] Error states work
- [ ] Empty states work
- [ ] Responsive behavior works
- [ ] Accessibility checks pass
- [ ] Major animations are preserved
- [ ] Required assets are present
- [ ] Visual QA passes
- [ ] No unauthorized redesign exists
- [ ] No accidental architecture replacement occurred

---

**Migration Plan Approved** — Ready for Phase 1 execution.