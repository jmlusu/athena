# Roadmap Step 2: Canonical Metrics Registry + Stale 2,557 Fix

**Current Status**: NOT completed — per chief-of-staff, cpo, and qa-lead initial agents

**Date**: Mon Sep 28 2026

---

## 1. Synthesis of Progress Across Four Remaining Items

### Item 1: Fix conversion rate calculation (line 368)
- **Status**: Being handled by lead-frontend
- **Location**: `athena/frontend/src/components/athena/charts/MetricsAndBarChart.tsx`, line 368
- **Issue**: The default funnel chart conversion rate uses `stats.total_jobs` as the denominator:
  ```tsx
  conversionRate: stats.total_jobs ? ((stats.criticalMatch + stats.flaggedReview) / stats.total_jobs) * 100 : 0,
  ```
- **Problem**: `stats.total_jobs` = total jobs in DB (includes jobs without ATS scores), while `criticalMatch + flaggedReview` = jobs with ATS scores >= 80. This produces an inaccurate conversion rate because the denominator doesn't match the evaluated population.
- **Fix needed**: Use the correct denominator — jobs that have actually received an ATS score — or restructure the conversion rate calculation to be consistent with the metric definitions.

### Item 2: Establish canonical metrics registry project-wide
- **Status**: Being handled by cpo (Chief Product Officer)
- **QA Audit Recommendation #1**: "Establish a metrics registry — define standard metrics (ATS scores, pipeline stage counts, automation thresholds, receipt generation rates) and add Prometheus-style exposure or test helpers to surface them."
- **Current State**: No formal metrics registry exists. Metrics are ad-hoc and endpoint-specific:
  - `total_jobs`, `ats_score`, `match_score`, `jobs_found`, `jobs_new`, `pipeline.total`, `scraping.total_jobs_scraped`
  - No centralized metric definitions, Prometheus metrics, or dashboard metrics
- **Goal**: Create a canonical metrics registry with defined metric names, calculation logic, and project-wide consistency.

### Item 3: Complete Wayfinder Map tickets B-D
- **Ticket B**: Implement MetricsAndBarChart Aggregation — partially done but needs the conversion rate fix (Item 1) and metric definitions formalized
- **Ticket C**: Kanban Stage Alignment — map AI Studio's 6 stages to OpenCode's 7 stages; currently 7 stages: New, Fetched, Matched, Scored, Applied, Interview, Offer vs AI Studio's 6: Discovered, Evaluated, Tailored, Awaiting Sign-Off, Submitted, Interview & Award
- **Ticket D**: Design System Theme Updates (Phase 1) — update Tailwind config with LightSpeed brand tokens; separate from metrics but affects metric card visual presentation

### Item 4: Address QA audit's core recommendations
- **#1**: Establish a metrics registry — NOT STARTED
- **#4**: Document the "2,557" — add to project's metrics glossary to avoid confusion
- **#3**: Add metrics-based test assertions — e.g., verify ATS score distribution, pipeline stage counts
- **#5**: Consider adding a metrics dashboard wireup in the backend

---

## 2. Clear Roadmap for advancing Step 2 from "In-Progress" toward "Complete"

### Phase 2A — Fix the "2,557" Conversion Rate Calculation (Immediate win)
**Objective**: Fix the inaccurate conversion rate in the funnel chart.

**Steps**:
1. Identify the correct denominator for each funnel stage conversion rate
2. The "ATS Evaluated" rate should use jobs-with-ATS-scores as denominator, not total_jobs
3. The "Tailored" rate should use ATS-evaluated jobs as denominator
4. Update `MetricsAndBarChart.tsx` line 368 with the corrected formula
5. Ensure the `defaultFunnelData` calculation is consistent with metric definitions

**Deliverable**: Corrected funnel chart conversion rates that accurately reflect pipeline progression.

### Phase 2B — Establish Canonical Metrics Definitions
**Objective**: Create the central metrics registry that defines every metric project-wide.

**Steps**:
1. Define metric name, description, calculation formula, and data source for each standard metric:
   - `total_jobs` — count of all jobs in pipeline
   - `new_jobs` — jobs with status NEW
   - `critical_match` — jobs with ATS score >= 90
   - `flagged_review` — jobs with ATS score 80-89
   - `signoff_pending` — jobs with status SCORED awaiting human sign-off
   - `submitted` — jobs with status applied/interview/offer
   - `avg_ats_score` — average ATS score across all scored jobs
   - `avg_match_score` — average match score across all scored jobs
2. Create a `metrics-registry.ts` or similar module that exports:
   - Metric type definitions
   - Calculation functions
   - Data normalization helpers
3. Update all components to import from the registry instead of computing metrics inline
4. Ensure the backend `get_pipeline_stats()` API returns metrics consistent with the registry

**Deliverable**: A canonical metrics registry file used by all frontend and backend components.

### Phase 2C — Resolve Wayfinder Ticket B: MetricsAndBarChart Aggregation
**Objective**: Complete the MetricsAndBarChart implementation with proper data flow.

**Steps**:
1. Integrate the canonical metrics registry into MetricsAndBarChart
2. Pass properly calculated stats from Dashboard (using registry functions)
3. Add skills bars and funnel graph using corrected conversion rates
4. Ensure the component renders all 5 metric card variants correctly

**Deliverable**: Fully functional MetricsAndBarChart with skills compatibility bars and conversion funnel using canonical metrics.

### Phase 2D — Resolve Wayfinder Ticket C: Kanban Stage Alignment
**Objective**: Align pipeline stage definitions between AI Studio and OpenCode.

**Steps**:
1. Map the 7 OpenCode stages (New, Fetched, Matched, Scored, Applied, Interview, Offer) to AI Studio's 6 stages (Discovered, Evaluated, Tailored, Awaiting Sign-Off, Submitted, Interview & Award)
2. Decide: either update to 6 stages matching AI Studio spec, or document the 7-stage workflow with mapping
3. Update PipelineKanbanBoard component props and state management
4. Ensure stage labels are consistent with the metrics registry

**Deliverable**: Consistent pipeline stage definitions across the codebase.

### Phase 2E — Address Remaining QA Recommendations
**Objective**: Tackle QA audit items #3, #4, #5.

**Steps**:
- #3: Add metrics-based test assertions (verify ATS score distribution, pipeline stage counts)
- #4: Document the "2,557" in a metrics glossary
- #5: Consider adding a `/api/v1/athena/metrics` endpoint for dashboard and test use

**Deliverable**: QA audit recommendations addressed or documented as exceptions.

---

## 3. Critical Path — Order of Operations

The critical path for Roadmap Step 2 is:

```
Phase 2A → Phase 2B → (Phase 2C and Phase 2D in parallel) → Phase 2E
```

**Why this order**:

1. **Phase 2A (Fix conversion rate)** must come first because:
   - It fixes the immediate "2,557" bug
   - It corrects the data that Phase 2B (MetricsAndBarChart) depends on
   - It provides correct metrics that the registry (Phase 2B) will formalize

2. **Phase 2B (Canonical metrics registry)** depends on Phase 2A because:
   - The registry needs correct calculation logic as its foundation
   - Metric definitions must be based on verified formulas
   - Other components will import from the registry

3. **Phases 2C and 2D** can proceed in parallel after Phase 2B starts:
   - Ticket C (stage alignment) depends on metric definitions being settled
   - Ticket D (theme updates) is largely independent but affects metric card visuals

4. **Phase 2E (QA recommendations)** is ongoing but doesn't block the core work

**Critical path length**: Approximately 3-4 weeks if worked on sequentially by the respective agents.

---

## 4. What "Complete" Looks Like for Roadmap Step 2

Roadmap Step 2 is **"Complete"** when all of the following deliverables are satisfied:

### 4.1 Metrics Registry Deliverables
- [ ] `metrics-registry.ts` (or equivalent) exists in the project, defining:
  - All standard metric names with descriptions
  - Calculation formulas for each metric
  - Data sources and normalization functions
  - Exportable functions that components import
- [ ] No ad-hoc metric calculations exist inline in components
- [ ] All components import metrics from the registry

### 4.2 "2,557 Fix" Deliverables
- [ ] Conversion rate calculation in `MetricsAndBarChart.tsx` line 368 uses the correct denominator
- [ ] Funnel chart conversion rates are mathematically consistent with metric definitions
- [ ] The "ATS Evaluated" rate divides by jobs with ATS scores, not total jobs
- [ ] Documentation added to the metrics glossary explaining the fix

### 4.3 Wayfinder Map Progress
- [ ] Ticket B: MetricsAndBarChart fully implemented with skills bars and funnel graph using canonical metrics
- [ ] Ticket C: Kanban stage alignment resolved (either 6 stages matching AI Studio or 7 stages with documented mapping)
- [ ] Ticket A: 5 metric card variants designed and implemented (already done)
- [ ] Ticket D: Design system theming updates applied (if in scope for Step 2)

### 4.4 QA Audit Recommendations
- [ ] Recommendation #1 met: Metrics registry established
- [ ] Recommendation #4 met: "2,557" documented in metrics glossary
- [ ] Recommendations #3 and #5 addressed (test assertions or documented exceptions)

### 4.5 Project-wide Impact
- [ ] No component computes a metric independently without referencing the registry
- [ ] Backend `get_pipeline_stats()` API returns metrics consistent with the registry
- [ ] Frontend Dashboard uses registry functions to compute all displayed metrics
- [ ] New agents or contributors can understand how each metric is calculated by consulting the registry

---

## 5. Immediate Actions to Move the Needle

### High-Impact, Low-Effort Actions (can start today):

1. **Fix the conversion rate calculation (Phase 2A)** — This is the highest impact/lowest effort item:
   - Examine how `stats.total_jobs` is computed in `get_pipeline_stats()` vs how `criticalMatch + flaggedReview` are computed in `Dashboard.tsx`
   - Fix the denominator to use the count of jobs that have actual ATS scores
   - Estimated time: 2-3 hours

2. **Document the "2,557" fix (Phase 2A follow-up)**:
   - Add a comment in the code explaining what was fixed and why
   - Add an entry to any existing metrics glossary
   - Estimated time: 1 hour

3. **Create a minimal metrics registry stub (Phase 2B start)**:
   - Extract the metric calculation functions from Dashboard.tsx into a shared module
   - Have both Dashboard and MetricsAndBarChart import from this module
   - Estimated time: 4-5 hours

4. **Coordinate with lead-frontend** (who is already handling the conversion rate fix):
   - Sync on the exact formula change needed
   - Ensure the fix aligns with the broader metrics registry plan
   - Estimated time: Ongoing coordination

### Quick-Win Sequence:
```
Day 1: Fix conversion rate calculation + document the fix
Day 2: Extract metric calculations into a shared module (stub registry)
Day 3: Update Dashboard and MetricsAndBarChart to use the shared module
Day 4: Resolve Wayfinder Ticket C (stage alignment)
Day 5: Address QA recommendations #3 and #4
```

---

## 6. Connection to Broader AI Company Builder Project Strategy

### 6.1 Why Metrics Registry Matters to the Overall Project

The AI Company Builder project (`C:\Users\jmlus\light-speed-holdings`) is a framework for creating and orchestrating AI agent hierarchies. Roadmap Step 2's work on the athena project connects to the broader strategy in several ways:

**A. Agent Metrics and KPIs**: The company-registry.yaml defines executives, specialists, and their KPIs (e.g., `cto.kpis: [Platform reliability, Delivery lead time, Tech-debt burn-down]`). A canonical metrics registry for athena provides the same kind of structured, definitional clarity for *product metrics* that the company registry provides for *agent metrics*. Both are foundational for evidence-based decision-making.

**B. Strategy → Execution Visibility**: The board-strategy agent (this role) advises the board on long-term strategy, partnerships, and market expansion. Metrics are how strategy gets translated into measurable outcomes. Without a canonical metrics registry, both the AI Company Builder and athena suffer from "metric drift" — different teams measuring the same thing differently, or the same team losing track of how a metric was calculated.

**C. The "2,557" Pattern**: The "2,557 Fix" represents a class of problems that occur when metrics are ad-hoc rather than canonical. In the AI Company Builder, similar issues would manifest as:
- Different agents computing the same KPI differently
- Inconsistent reporting across the dashboard
- Difficulty diagnosing why a KPI changed
- Inability to compare performance over time

Fixing the metrics registry in athena establishes patterns and tools that can be replicated across the AI Company Builder project.

**D. QA Lead's Principle**: The QA audit's recommendation #1 ("Establish a metrics registry") mirrors the AI Company Builder's own need for a centralized agent metrics system. The company-registry.yaml already defines KPIs for each executive, but without a registry pattern, those KPIs risk becoming ad-hoc like the athena metrics. The athena work is a pilot for establishing the registry pattern organization-wide.

**E. Roadmap Dependency**: Roadmap Step 3 and beyond (likely involving agent orchestration, scheduler integration, and multi-agent coordination) will need reliable metrics to:
- Measure agent performance and workload
- Track pipeline health (scraping → matching → application)
- Identify bottlenecks in the AI agent hierarchy
- Make evidence-based decisions about resource allocation

A canonical metrics registry in athena is a down-payment on the metrics infrastructure the broader project will need.

### 6.2 Strategic Recommendation

**Treat the athena metrics registry as the reference implementation for the AI Company Builder's organization-wide metrics system.** The pattern established here (metric name → definition → calculation → export) should be:

1. **Generalized** into a shared package or module used across all projects
2. **Extended** to cover agent-level KPIs (beyond just product metrics)
3. **Integrated** into the dashboard/infrastructure that the AI Company Builder already provides

This doesn't mean we delay Roadmap Step 2 — we should complete it as outlined above, with the understanding that the patterns established will inform broader work. The immediate fix (conversion rate) and the registry skeleton can be delivered in the next 1-2 weeks, providing quick value while the broader pattern evolves.

---

## Summary

**Roadmap Step 2 "Canonical Metrics Registry + Stale 2,557 Fix" is currently "In-Progress" with four remaining work streams.** The critical path starts with fixing the conversion rate calculation (the literal "2,557" bug), then establishes a canonical metrics registry, resolves the Wayfinder tickets, and addresses QA audit recommendations.

**Completion criteria** are concrete: a metrics registry file, corrected conversion rates, resolved stage alignment, and documented QA recommendations. The immediate actions (fix conversion rate + document + extract metric calculations) can be started today and will show visible progress within a week.

This work connects directly to the AI Company Builder's broader need for standardized agent/product metrics, making it a strategic investment rather than a narrow bug fix.