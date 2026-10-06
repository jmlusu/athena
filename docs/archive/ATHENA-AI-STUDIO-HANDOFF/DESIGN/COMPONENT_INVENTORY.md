# Athena — Component Inventory & Architecture

> **Category**: UI / UX Reference  
> **Extraction Source**: `src/components/**/*`  
> **Total Components**: 18 Reusable & Structural Components  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Structural Layout Components

### 1.1 `LeftSidebar`
- **Location**: `src/components/layout/LeftSidebar.tsx`
- **Purpose**: System-wide navigation, 3-scope quick toggles, category selector, and 4-hour countdown crawler timer widget.
- **Props**:
  ```typescript
  interface LeftSidebarProps {
    currentView: NavView;
    onSelectView: (view: NavView) => void;
    selectedScope: OpportunityScope | "all";
    onSelectScope: (scope: OpportunityScope | "all") => void;
    selectedCategory: OpportunityCategory | "all";
    onSelectCategory: (category: OpportunityCategory | "all") => void;
    cronState: CronScheduleState;
    onTriggerCronNow: () => void;
  }
  ```
- **Visual Features**: Dark `#1E2024` container, pulsing green engine status dot, active orange indicator border (`border-l-2 border-[#F97316]`), dual countdown progress bars (Job + Consultancy), and "Execute 4h Cycle Now" manual trigger.

---

### 1.2 `RightSidebar`
- **Location**: `src/components/layout/RightSidebar.tsx`
- **Purpose**: Autonomous auto-pilot toggle controls, pending human sign-off authorization queue, live aggregator ingress status, and n8n webhook health badge.
- **Props**:
  ```typescript
  interface RightSidebarProps {
    settings: AutomationSettings;
    onUpdateSettings: (newSettings: Partial<AutomationSettings>) => void;
    opportunities: Opportunity[];
    onOpenSignOff: (opp: Opportunity) => void;
    onOpenDetails: (opp: Opportunity) => void;
  }
  ```
- **Visual Features**: Toggle switches for $\ge 90\%$ Auto-Generate and Dehumanize voice, pending sign-off cards with red alert badge, and live aggregator ingress stream readouts.

---

## 2. Visualization & Chart Components

### 2.1 `CircularGauge`
- **Location**: `src/components/charts/CircularGauge.tsx`
- **Purpose**: Render radial percentage compatibility dials ($0 - 100\%$) for ATS semantic scoring.
- **Props**:
  ```typescript
  interface CircularGaugeProps {
    score: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
  }
  ```
- **Visual Features**: Dynamic SVG stroke calculation, emerald for $\ge 90\%$, amber for $80 - 89\%$, and slate for $< 80\%$.

---

### 2.2 `LayeredMountainChart`
- **Location**: `src/components/charts/LayeredMountainChart.tsx`
- **Purpose**: Abstract 3-layer mountain topography visual showing momentum across Global Remote, Lilongwe Hub, and Consultancies over 4-hour intervals.
- **Props**:
  ```typescript
  interface LayeredMountainChartProps {
    title?: string;
    subtitle?: string;
    opportunities?: Opportunity[];
    onSelectScope?: (scope: string) => void;
    onFilterClick?: (metric: string) => void;
  }
  ```
- **Visual Features**: Gradient filled SVG polygon mountain peaks with topographic background pattern, layer filter toggles, interactive hover tooltip with telemetry data.

---

### 2.3 `MetricsAndBarChart`
- **Location**: `src/components/charts/MetricsAndBarChart.tsx`
- **Purpose**: 5 numerical metric cards + 5-bar Skills Compatibility distribution + SVG conversion funnel line graph with circular data markers.
- **Props**:
  ```typescript
  interface MetricsAndBarChartProps {
    opportunities: Opportunity[];
    onCardClick?: (filterType: string) => void;
  }
  ```

---

## 3. View Components

| Component | File Location | Key Responsibility |
|---|---|---|
| `PipelineView` | `src/components/views/PipelineView.tsx` | Search filter, stage filter pills, 6-stage Kanban board with drag/status progression triggers |
| `ScraperDiscoveryView` | `src/components/views/ScraperDiscoveryView.tsx` | Live crawler trigger, keyword search, scope cards, platform selector, discovery listings table |
| `DocumentStudioView` | `src/components/views/DocumentStudioView.tsx` | Opportunity selector, 1-col vs 2-col switcher, Dehumanizer toggle, Gemini re-tailor trigger, Print/PDF export |
| `FormFillerView` | `src/components/views/FormFillerView.tsx` | Online fields manifest, screening responses, human power-of-attorney sign-off gate |
| `ReceiptsView` | `src/components/views/ReceiptsView.tsx` | SHA-256 submission certificates, follow-up email draft generator, LinkedIn export trigger |
| `N8nIntegrationView` | `src/components/views/N8nIntegrationView.tsx` | 5-node visual topology, inbound webhook tester (`POST /api/webhooks/n8n`), response terminal |
| `ApplicantProfileView` | `src/components/views/ApplicantProfileView.tsx` | Profile dossier, hourly/monthly rates, dynamic ATS skills keywords, master document uploads |

---

## 4. Modal Dialog Components

### 4.1 `OpportunityDetailModal`
- **Location**: `src/components/modals/OpportunityDetailModal.tsx`
- **Purpose**: Comprehensive view of an opportunity with ATS score dial, dehumanized pitch callout, TOR description, requirements checklist, and actions ("Export to LinkedIn", "Inspect Documents", "Authorize & Submit").

### 4.2 `LinkedInExportModal`
- **Location**: `src/components/modals/LinkedInExportModal.tsx`
- **Purpose**: Dedicated multi-tab export dialog for LinkedIn:
  1. *LinkedIn Easy Apply Draft* (Headline, Pitch, Skills Hashtags, Full Cover Note).
  2. *Profile Experience Entry* (Field mappings & formatted description).
  3. *JSON & Markdown Downloads* (`.json` and `.md` file generators).
