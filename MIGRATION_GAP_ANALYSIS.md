# Athena — Migration Gap Analysis

**Document Type**: Comparative Engineering Analysis
**Source**: AI Studio Prototype v2.4.0 vs OpenCode Production (branch: `integration/athena-ai-studio`)
**Date**: 2026-09-27

---

## 1. Screen-by-Screen Gap Analysis

### SCR-01: Pipeline & Command (`/dashboard`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Layout** | 3-column chassis (272px + fluid + 288px) | 3-column chassis (272px + fluid + 288px) | ✅ Match | Low |
| **Left Sidebar** | Scope filters (4), category (3), nav (8), cron widget | Scope filters (4), category (3), nav (8), cron widget | ✅ Match | Low |
| **Top App Bar** | Brand, breadcrumbs, scope pill, quick actions | Brand, breadcrumbs, scope pill, quick actions | ✅ Match | Low |
| **Mountain Chart** | 3-layer SVG mountain dynamics with hover tooltip | **MISSING** — has `MountainAreaChart` (different) | ❌ **MISSING** | High |
| **Metric Cards** | 5 specific: Discovered, ≥90%, 80-89%, Sign-Off, Submitted | 4 generic: Total Jobs, Avg ATS, Applications, Offers | ⚠️ Different metrics | High |
| **Skills Bar Chart** | 5-bar Skills Compatibility distribution | **MISSING** | ❌ **MISSING** | High |
| **Funnel Graph** | SVG conversion funnel with circular markers | **MISSING** | ❌ **MISSING** | High |
| **Kanban Board** | 6 stages: Discovered, Evaluated, Tailored, Awaiting Sign-Off, Submitted, Interview & Award | 7 stages: New, Fetched, Matched, Scored, Applied, Interview, Offer | ⚠️ Different stages | Medium |
| **Card Actions** | Click → modal, inspect docs, sign-off, receipt | Click → console.log | ⚠️ Incomplete | Medium |

---

### SCR-02: Scraper & Discovery (`/jobs`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Layout** | Search query, keyword bar, platform tags, 4 scope cards | Search + filters in `JobList` | ⚠️ Different layout | Medium |
| **Scope Selector** | 4 pill cards: All 3 Scopes, Lilongwe Local, Lilongwe Remote, Intl Remote | 4 scope buttons in left sidebar | ✅ Equivalent | Low |
| **Platform Filters** | Tags: All, LinkedIn, Upwork, ReliefWeb, Corporate | Source filter in job list | ⚠️ Different UI | Low |
| **Live Scrape Button** | "Run Live Semantic Scrape" triggers crawler | "Scrape Jobs" button in dashboard | ✅ Exists | Low |
| **Listings Table** | Category badges, platform tags, timestamp, org, compensation, reqs, circular gauge | Job cards with ATS score, status badges | ⚠️ Different density | Medium |
| **Circular Gauge** | Inline ATS score per row | `MiniATSGauge` on cards | ✅ Match | Low |

---

### SCR-03: Pristine Document Studio (`/documents`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Control Bar** | Opportunity selector, 1/2 col toggle, Dehumanizer, Gemini regenerate, Copy MD, Print | All present ✅ | ✅ Match | Low |
| **1-Column Layout** | Executive single-column resume | Implemented ✅ | ✅ Match | Low |
| **2-Column Layout** | Asymmetric 1/3 + 2/3 split | Implemented ✅ | ✅ Match | Low |
| **Dehumanizer Toggle** | Orange active state, purges AI tropes | Implemented ✅ | ✅ Match | Low |
| **Tabs** | Resume, Cover Letter, Consultancy Proposal | All 3 tabs ✅ | ✅ Match | Low |
| **Print/PDF** | `@media print` clean vector output | Implemented ✅ | ✅ Match | Low |
| **Proposal Styling** | Red-themed confidential advisory | Red border + executive summary box ✅ | ✅ Match | Low |
| **Sign-Off Button** | In proposal footer → sign-off modal | Present ✅ | ✅ Match | Low |

---

### SCR-04: Online Forms & Sign-Off (`/form-filler`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Form Structure** | Identity, screening fields, doc manifest, sign-off gate | Landing page + modal wrapper | ⚠️ Split across routes | Medium |
| **Auto-filled Fields** | Candidate identity & contact | Mock data in wrapper | ⚠️ Not connected | Medium |
| **Screening Responses** | 2 dehumanized prompt textareas | In `FormFillerModal` | ✅ Exists | Low |
| **Sign-Off Gate** | Red border, checkbox + typed signature | In `FormFillerModal` | ✅ Exists | Low |
| **Validation** | Disabled submit until both complete | Implemented | ✅ Match | Low |
| **Submission** | Generates SHA-256 receipt | Mock implementation | ⚠️ Not connected | High |

---

### SCR-05: Receipts & Follow-ups (`/receipts`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Left Column** | List of verified receipts with status, hash, timestamp | Not verified | ⚠️ Unknown | Medium |
| **Right Column** | Certificate card: receipt ID, company, date, signature, SHA-256, 7-day follow-up | `Receipts.tsx` exists | ⚠️ Need verification | Medium |
| **Follow-up Generator** | Email draft with copy/export | Not verified | ⚠️ Unknown | Medium |
| **LinkedIn Export** | Button triggers export modal | Not verified | ⚠️ Unknown | Medium |

---

### SCR-06: n8n Workflow Nodes (`/n8n`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Visual Canvas** | Dark `#18181B` bg, 5 sequential nodes | `N8nIntegration.tsx` exists | ⚠️ Need verification | Medium |
| **Node Types** | Cron 4h, Scraper, Gemini ATS, Switch Gate, Sign-Off Gate | Not verified | ⚠️ Unknown | Medium |
| **Webhook Tester** | JSON editor + "Fire Webhook" button + response terminal | Not verified | ⚠️ Unknown | Medium |

---

### SCR-07: Applicant Skills & Profile (`/profile`)

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Left: Identity** | Contact fields, rates (USD/MWK), Lilongwe station | `ApplicantProfile.tsx` | ✅ Exists | Low |
| **Left: ATS Keywords** | Dynamic badge list with add/remove | Not verified | ⚠️ Unknown | Medium |
| **Right: Uploads** | Dropzone + master resume/case study list | Not verified | ⚠️ Unknown | Medium |
| **Advisory** | Digital power-of-attorney notice | Not verified | ⚠️ Unknown | Medium |

---

### MOD-01: Opportunity Detail Modal

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Trigger** | Click job card / "Details" | `JobDetail` page (not modal) | ⚠️ Page vs Modal | Medium |
| **Header** | Category pill, platform badge, timestamp, title, company, location, compensation | `JobDetail` page | ✅ Equivalent | Low |
| **Body** | Circular ATS gauge, dehumanized pitch, full TOR, requirements grid | `JobDetail` page | ✅ Equivalent | Low |
| **Footer** | Close, Export LinkedIn, Inspect Documents, Authorize & Submit | `JobDetail` page | ⚠️ Different actions | Medium |

---

### MOD-02: LinkedIn Export Modal

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Tabs** | Easy Apply, Profile Experience, JSON/Markdown | **MISSING** | ❌ **MISSING** | High |
| **Easy Apply** | Headline, pitch, skills hashtags, cover note | **MISSING** | ❌ **MISSING** | High |
| **Experience** | Field mappings + formatted description | **MISSING** | ❌ **MISSING** | High |
| **JSON/MD Export** | Download buttons with SHA-256 | **MISSING** | ❌ **MISSING** | High |

---

### MOD-03: Human Sign-Off Modal

| Aspect | AI Studio Spec | OpenCode Current | Gap | Risk |
|--------|---------------|------------------|-----|------|
| **Dedicated Modal** | Power-of-attorney sign-off dialog | In `FormFillerModal` (inline) | ⚠️ Embedded not modal | Medium |
| **Authorization** | Checkbox + typed legal signature | Implemented | ✅ Match | Low |
| **Submission** | Generates receipt + redirects | Mock in wrapper | ⚠️ Not connected | High |

---

## 2. Component-by-Component Gap Analysis

| AI Studio Component | OpenCode Equivalent | Can Reuse? | Needs Modification? | Needs Replacement? | New Component? |
|---------------------|---------------------|------------|---------------------|-------------------|----------------|
| `LeftSidebar` | Built into `AthenaLayout` | ✅ Yes | ⚠️ Color system | No | No |
| `RightSidebar` | Built into `AthenaLayout` | ✅ Yes | ⚠️ Color system | No | No |
| `LayeredMountainChart` | `MountainAreaChart` | ❌ Different | No | **Yes** | Yes |
| `CircularGauge` | `ATSGauge` / `MiniATSGauge` | ✅ Yes | ⚠️ Color thresholds | No | No |
| `MetricsAndBarChart` | **None** | No | No | **Yes** | Yes |
| `PipelineView` | Inline in `Dashboard` | ⚠️ Partial | **Yes** (stages) | No | No |
| `ScraperDiscoveryView` | `JobList` | ⚠️ Partial | **Yes** (layout) | No | No |
| `DocumentStudioView` | `DocumentStudio` | ✅ Yes | ⚠️ Minor polish | No | No |
| `FormFillerView` | `FormFillerModal` + Landing | ⚠️ Partial | **Yes** (unify) | No | No |
| `ReceiptsView` | `Receipts` | ⚠️ Partial | **Yes** (verify) | No | No |
| `N8nIntegrationView` | `N8nIntegration` | ⚠️ Partial | **Yes** (verify) | No | No |
| `ApplicantProfileView` | `ApplicantProfile` | ⚠️ Partial | **Yes** (verify) | No | No |
| `OpportunityDetailModal` | `JobDetail` (page) | ❌ Page vs Modal | No | **Yes** | Yes |
| `LinkedInExportModal` | **None** | No | No | **Yes** | Yes |
| `FormFillerModal` | `FormFillerModal` | ✅ Yes | ⚠️ Extract sign-off | No | No |

---

## 3. Visual Design System Gaps

| Token Category | AI Studio Spec | OpenCode Current | Action Required |
|----------------|---------------|------------------|-----------------|
| **Chassis Colors** | `#141619`, `#1E2024`, `#24272F`, `#2A2E37` | Navy `#070A40` | **Replace entire dark theme** |
| **Sign-Off Red** | `#DC2626` / `#B91C1C` | `#E63946` / `#B91C1C` | **Update red token** |
| **Semantic Tints** | 7 status tints with specific values | Not implemented | **Add all 7 tint sets** |
| **Typography Scale** | 6-level hierarchy with exact sizes | Partial | **Verify all 6 levels** |
| **Monospace Font** | Cascadia Code | JetBrains Mono | **Add Cascadia Code** |
| **Shadows** | `.raised`, `.sunken`, `.glow-amber`, `.tactile` | `.raised`, `.tactile` | **Add `.sunken`, `.glow-amber`** |
| **Radii** | Pill, Badge(6px), Button(8px), Card(12px), Modal(16px) | Partial | **Verify all 5** |
| **Spacing** | 8pt grid, sidebar widths exact | Sidebar widths match | ✅ OK |

---

## 4. Interaction & Motion Gaps

| Interaction | AI Studio Spec | OpenCode Current | Gap |
|-------------|---------------|------------------|-----|
| **Nav Active State** | Orange bg + white text + border-l-2 | Orange bg + white text | ✅ Match |
| **Scope Pill Active** | `bg-[#2A2E37] text-white border-l-2 border-[#F97316]` | `bg-primary text-white border-l-2 border-accent` | ✅ Match (colors diff) |
| **Kanban Card Hover** | Border darken + shadow-xs | Shadow-lg + border-red | ⚠️ Different |
| **Mountain Chart Hover** | Circle expands + telemetry tooltip | Not implemented | ❌ Missing |
| **Skills Bar Expand** | Width 0→target duration-700 | Not implemented | ❌ Missing |
| **Modal Fade+Scale** | fade-in duration-200 + backdrop-blur | Not verified | ⚠️ Unknown |
| **Toast Entry** | slide-in-from-top-2 duration-300 | slide-in from right | ⚠️ Different |
| **Button Press** | translateY(1px) + inset shadow | `.tactile` class | ✅ Match |
| **Reduced Motion** | Clamp to 0.01ms, disable pulse | Implemented | ✅ Match |

---

## 5. Responsive Behavior Gaps

| Breakpoint | AI Studio Spec | OpenCode Current | Gap |
|------------|---------------|------------------|-----|
| **Desktop (≥1280px)** | Full 3-col, 6-col kanban, 4 legend items | Full 3-col, 7-col kanban | ⚠️ Kanban cols |
| **Tablet (768-1023px)** | Right sidebar collapses, 2-3 col kanban | Right sidebar collapses | ✅ Match |
| **Mobile (<640px)** | Left sidebar drawer, single-col kanban, full-width modals | Left sidebar drawer, single-col kanban | ✅ Match |
| **Document Studio** | 2-col stacks vertically, grid-cols-1 md:grid-cols-3 | Implemented | ✅ Match |
| **Metric Cards** | 2-3 cols responsive | 1-2-4 cols | ⚠️ Different |

---

## 6. Backend Integration Gaps

| AI Studio API | OpenCode Backend | Status |
|---------------|------------------|--------|
| `POST /api/ai/scrape-live` | `POST /api/v1/athena/scrape` | ⚠️ Different contract |
| `POST /api/ai/score-ats` | `POST /api/v1/athena/score-ats` | ⚠️ Different contract |
| `POST /api/ai/tailor-resume` | `POST /api/v1/athena/generate-resume` | ⚠️ Different contract |
| `POST /api/ai/tailor-document` | `POST /api/v1/athena/generate-document` | ⚠️ Different contract |
| `POST /api/ai/dehumanize` | Not exposed | ❌ Missing |
| `POST /api/n8n/dispatch-webhook` | `POST /api/v1/athena/webhooks/n8n` | ⚠️ Different path |
| `POST /api/submit-application` | Not implemented | ❌ Missing |
| `POST /api/webhooks/n8n` | `POST /api/v1/athena/webhooks/n8n` | ⚠️ Different path |

---

## 7. Data Contract Gaps

| AI Studio Type | OpenCode Type | Compatibility |
|----------------|---------------|---------------|
| `Opportunity` (with scope/category/platform enums) | `Job` + `Opportunity` | ⚠️ Dual types, needs unification |
| `PipelineStatus` (6 values) | `JobStatus` (11 values) | ⚠️ Different enums |
| `OpportunityScope` (3 values) | Same | ✅ Match |
| `OpportunityCategory` (2 values) | `JobType` (7 values) | ⚠️ Different |
| `ApplicationReceipt` | Same | ✅ Match |
| `TailoredResume` | Same | ✅ Match |
| `AutomationSettings` | Same | ✅ Match |

---

## 8. Asset Gaps

| Asset | AI Studio | OpenCode | Status |
|-------|-----------|----------|--------|
| **Fonts** | Cinzel, Lora, Plus Jakarta Sans, Cascadia Code | Cinzel, Lora, Plus Jakarta Sans, JetBrains Mono | ⚠️ Mono diff |
| **Icons** | Lucide React (18 specific icons) | Lucide React (20+ icons) | ✅ Match |
| **Certificates** | 13 PDFs in profile/media/ | 13 MD files in profile/media/ | ✅ Match |
| **Screenshots** | 12 reference screenshots | **None** | ❌ Missing |

---

## 9. Summary: Critical Path Items

### Must Implement (Blocking Visual Parity)
1. **Dark Chassis Color System** — Replace navy with charcoal (`#141619`, `#1E2024`, etc.)
2. **LayeredMountainChart** — New SVG mountain dynamics component
3. **MetricsAndBarChart** — 5 metric cards + skills bars + funnel graph
4. **LinkedInExportModal** — 3-tab modal with downloads
5. **OpportunityDetailModal** — Convert `JobDetail` page to modal
6. **Sign-Off Red Color** — Update `#E63946` → `#DC2626`
7. **Semantic Status Tints** — 7 tint sets for card backgrounds

### Must Adapt (Existing Components)
8. **Kanban Stages** — Map 7→6 stages with AI Studio labels
9. **Metric Cards** — Redesign to match AI Studio visual (5 specific metrics)
10. **PipelineView** — Extract from Dashboard, wire to real actions
11. **ScraperDiscoveryView** — Redesign JobList to match AI Studio layout
12. **FormFiller** — Unify landing + modal, connect to real submission
13. **ReceiptsView** — Verify and complete implementation
14. **N8nIntegrationView** — Verify 5-node topology + webhook tester
15. **ApplicantProfileView** — Verify ATS keywords + uploads

### Must Integrate (Backend)
16. **API Contract Alignment** — Map AI Studio endpoints to OpenCode
17. **Application Submission** — Implement real SHA-256 receipt generation
18. **Dehumanize Endpoint** — Expose text purification API
19. **n8n Webhook** — Align paths and payload contracts

---

## 10. Phase Prioritization

| Phase | Focus | Est. Effort | Dependencies |
|-------|-------|-------------|--------------|
| **Phase 0** | Baseline (this doc) | ✅ Done | — |
| **Phase 1** | Design System (colors, fonts, shadows) | 2-3 days | None |
| **Phase 2** | Application Shell (layout, sidebars, top bar) | 1-2 days | Phase 1 |
| **Phase 3** | Navigation (routes, breadcrumbs, scope pills) | 1 day | Phase 2 |
| **Phase 4** | Shared Components (gauges, cards, badges) | 2-3 days | Phase 1 |
| **Phase 5a** | Pipeline Dashboard (mountain chart, metrics, kanban) | 3-4 days | Phase 1, 4 |
| **Phase 5b** | Scraper Discovery View | 2 days | Phase 1, 4 |
| **Phase 5c** | Document Studio (polish) | 1-2 days | Phase 1 |
| **Phase 5d** | Form Filler + Sign-Off Modal | 2 days | Phase 1 |
| **Phase 5e** | Receipts View | 1-2 days | Phase 1 |
| **Phase 5f** | n8n Integration View | 1-2 days | Phase 1 |
| **Phase 5g** | Applicant Profile View | 1-2 days | Phase 1 |
| **Phase 5h** | Opportunity Detail Modal | 1 day | Phase 1, 4 |
| **Phase 5i** | LinkedIn Export Modal | 2 days | Phase 1, 4 |
| **Phase 6** | Interactions & Micro-interactions | 2 days | Phase 5 |
| **Phase 7** | Data Integration (API contracts) | 3-4 days | Phase 5 |
| **Phase 8** | Responsive Behavior | 1-2 days | Phase 5 |
| **Phase 9** | Motion & Animation | 1-2 days | Phase 6 |
| **Phase 10** | Visual QA (screenshot comparison) | 2-3 days | Phase 5-9 |
| **Phase 11** | Functional QA (e2e tests) | 2-3 days | Phase 7 |
| **Phase 12** | Cleanup & Reports | 1 day | Phase 10-11 |

---

**Gap Analysis Complete** — Ready for Migration Plan (MIGRATION_PLAN.md)