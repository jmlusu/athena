# Athena — Component Mapping Specification

> **Category**: Engineering Integration Mapping  
> **Audience**: OpenCode Frontend & Component Architecture Teams  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Component Mapping Matrix

```text
AI Studio Component
        ↓
Visual & Behavioral Responsibility
        ↓
Expected Production Component (OpenCode)
        ↓
Production Integration Notes
```

| AI Studio Prototype Component | Visual & Behavioral Responsibility | Production Equivalent in OpenCode | Integration & Adaptation Notes |
|---|---|---|---|
| `LeftSidebar` (`src/components/layout/LeftSidebar.tsx`) | 3-scope filters, category switch, module navigation, 4-hour countdown widget | `NavigationSidebar` / `AppShell.Navigation` | Connect `cronState` to production Celery / worker scheduler status API. |
| `RightSidebar` (`src/components/layout/RightSidebar.tsx`) | Auto-pilot toggles, pending human sign-off queue, live ingress telemetry | `AutomationControlDrawer` / `TaskQueuePanel` | Wire toggle updates to user preferences / agent configuration store. |
| `LayeredMountainChart` (`src/components/charts/LayeredMountainChart.tsx`) | Multi-stream mountain momentum graph with hover telemetry | `MomentumMountainVisualizer` / `AnalyticsChart` | Keep exact SVG gradient definitions and curve formulas; bind data to production analytics endpoint. |
| `CircularGauge` (`src/components/charts/CircularGauge.tsx`) | Radial SVG percentage gauge with color thresholds | `ATSScoreDial` / `RadialProgress` | Preserve $C = 2\pi r$ stroke-dashoffset math and threshold colors ($\ge 90$ emerald, $80-89$ amber, $<80$ slate). |
| `MetricsAndBarChart` (`src/components/charts/MetricsAndBarChart.tsx`) | 5 numerical metric cards, skills bar chart, funnel throughput line graph | `PipelineMetricsDeck` | Populate numerical counts from database aggregate queries. |
| `PipelineView` (`src/components/views/PipelineView.tsx`) | 6-stage Kanban board with search, status triggers, and cards | `PipelineKanbanBoard` | Wire drag/drop or stage progression to production job application database state. |
| `ScraperDiscoveryView` (`src/components/views/ScraperDiscoveryView.tsx`) | Live aggregator trigger, scope cards, sourced listings table | `DiscoveryAggregatorView` | Connect "Run Live Semantic Scrape" button to production scraping pipeline / queue. |
| `DocumentStudioView` (`src/components/views/DocumentStudioView.tsx`) | 1-col vs 2-col resume, cover letter, proposal preview with Dehumanizer & PDF print | `DocumentStudio` / `PristineDocumentViewer` | Preserve `@media print` printout styles; connect regenerate button to production LLM service. |
| `FormFillerView` (`src/components/views/FormFillerView.tsx`) | Online portal field manifest, screening answers, power-of-attorney sign-off | `ApplicationSignOffModal` / `SubmissionGate` | Enforce required checkbox and typed signature validation prior to dispatch. |
| `ReceiptsView` (`src/components/views/ReceiptsView.tsx`) | Submission certificate display, SHA-256 token verification, 7-day follow-up draft | `ApplicationReceiptsViewer` | Retrieve persisted receipts from database with immutable audit hashes. |
| `N8nIntegrationView` (`src/components/views/N8nIntegrationView.tsx`) | 5-node visual topology, inbound webhook tester & response console | `WebhookIntegrationConsole` | Provide production webhook URL and authentication token. |
| `ApplicantProfileView` (`src/components/views/ApplicantProfileView.tsx`) | Candidate dossier, rates (USD/MWK), dynamic ATS skills keywords, background files | `ApplicantProfileSettings` | Store profile and uploaded files in production object storage (e.g. S3 / GCS). |
| `OpportunityDetailModal` (`src/components/modals/OpportunityDetailModal.tsx`) | Detailed TOR, ATS dial, dehumanized pitch, requirements checklist | `OpportunityDetailDrawer` | Render when opening any job card; trigger document inspection or sign-off. |
| `LinkedInExportModal` (`src/components/modals/LinkedInExportModal.tsx`) | Easy Apply draft, profile experience mapping, JSON & Markdown downloads | `LinkedInExportDialog` | Retain clipboard copy actions and `.json` / `.md` client-side download generators. |
