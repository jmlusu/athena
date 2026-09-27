# Athena — Migration Baseline

**Document Type**: Engineering Baseline Record
**Branch**: `integration/athena-ai-studio`
**Commit**: `f9a7d6c` (style(backend): ruff format fixes for CI pass)
**Date**: 2026-09-27

---

## 1. Current Application Structure

```
athena/
├── frontend/                    # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx             # Router + 7 routes + modals
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Tailwind v4 + design tokens
│   │   ├── components/athena/  # 16 reusable components
│   │   ├── pages/athena/       # 8 page components
│   │   └── lib/athena/         # API, types, utils
│   ├── package.json            # Dependencies
│   ├── vite.config.ts          # Vite + Tailwind v4
│   └── tsconfig.json           # TypeScript config
├── backend/                     # Python FastAPI + uv
│   ├── src/athena/             # Core modules
│   │   ├── scrapers/           # LinkedIn, ReliefWeb, etc.
│   │   ├── store.py            # Data persistence
│   │   └── paths.py            # Path management
│   ├── tests/                  # pytest test suite
│   └── pyproject.toml          # Python dependencies
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Production deployment
└── docs/                       # Documentation
```

---

## 2. Frontend Framework & Tooling

| Aspect | Current State |
|--------|---------------|
| **Framework** | React 19.3.0 |
| **Language** | TypeScript 7.0.2 (strict) |
| **Build Tool** | Vite 6.1.0 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **Routing** | React Router DOM 7.18.3 |
| **Icons** | Lucide React 1.47.0 |
| **Charts** | Recharts 3.10.1 |
| **Animation** | Framer Motion 13.4.0 + Motion 12.4.7 |
| **Testing** | Vitest 5.0.0 (unit) + Playwright 1.50.0 (e2e) |
| **Package Manager** | pnpm 9.15.0 |

---

## 3. Current Routes (from `App.tsx`)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` → `/dashboard` | `Dashboard` | Pipeline dashboard with Kanban |
| `/jobs` | `JobList` | Scraper & Discovery view |
| `/jobs/:id` | `JobDetail` | Job detail modal/page |
| `/documents` | `DocumentStudio` | Document studio (1/2 col) |
| `/documents/:jobId` | `DocumentStudio` | Deep-linked document |
| `/form-filler/:jobId?` | `FormFillerModalWrapper` | Landing + sign-off modal |
| `/receipts` | `Receipts` | Receipts & follow-ups |
| `/n8n` | `N8nIntegration` | n8n workflow visualizer |
| `/profile` | `ApplicantProfileWrapper` | Applicant skills & profile |
| `/settings` | `Settings` | Settings page |

---

## 4. Current UI Architecture (from `AthenaLayout.tsx`)

### 3-Column Chassis Layout
- **Left Sidebar** (`w-68` / `272px`): Navigation, scope filters, 4h cron widget
- **Center Canvas** (`flex-1`): Main content with top app bar + breadcrumbs
- **Right Sidebar** (`w-72` / `288px`): Automation controls, sign-off queue, n8n status

### Key Existing Components
| Component | File | Matches AI Studio Spec |
|-----------|------|------------------------|
| `AthenaLayout` | `AthenaLayout.tsx` | ✅ 3-column chassis |
| `LeftSidebar` | Built into `AthenaLayout` | ✅ Scope filters, nav, cron |
| `RightSidebar` | Built into `AthenaLayout` | ✅ Automation controls |
| `ScopeFilter` | `ScopeFilter.tsx` | ✅ 4 scopes + category |
| `CronCountdown` | `CronCountdown.tsx` | ✅ 4-hour countdown |
| `AutomationControls` | `AutomationControls.tsx` | ✅ Auto-pilot toggles |
| `PipelineView` | `Dashboard.tsx` (inline) | ⚠️ Different Kanban stages |
| `DocumentStudio` | `DocumentStudio.tsx` | ✅ 1/2 col, dehumanizer |
| `ATSGauge` | `ATSGauge.tsx` | ✅ Circular radial gauge |
| `MetricCard` | `MetricCard.tsx` | ⚠️ Different visual style |

---

## 5. Design Tokens Comparison

| Token | AI Studio Spec | Current OpenCode | Status |
|-------|---------------|------------------|--------|
| **Brand Orange** | `#F97316` | `#F97316` ✅ | Match |
| **Orange Hover** | `#EA580C` | `#EA580C` ✅ | Match |
| **Sign-Off Red** | `#DC2626` | `#E63946` | ❌ Different |
| **Chassis Base** | `#141619` | `#070A40` (navy) | ❌ Different |
| **Sidebar Frame** | `#1E2024` | `#070A40` (navy) | ❌ Different |
| **Canvas Background** | `#F4F5F7` | `#F4F5F7` ✅ | Match |
| **Surface White** | `#FFFFFF` | `#FFFFFF` ✅ | Match |
| **Border Slate** | `#E2E8F0` | `#E2E8F0` ✅ | Match |
| **Text Primary** | `#18181B` | `#18181B` ✅ | Match |
| **Text Body** | `#334155` | `#64748B` (muted) | ❌ Different |
| **Cinzel Font** | Required | Configured ✅ | Match |
| **Lora Font** | Required | Configured ✅ | Match |
| **Plus Jakarta Sans** | Required | Configured ✅ | Match |
| **Mono Font** | Cascadia Code | JetBrains Mono | ⚠️ Different |

---

## 6. Current Build & Test Status

```bash
# Build
cd frontend && pnpm run build
# Status: ✅ Passes (verified from CI logs)

# Lint/Typecheck
cd frontend && pnpm run lint
# Status: ✅ Passes

# Unit Tests
cd frontend && pnpm run test
# Status: ⚠️ Need to verify

# E2E Tests
cd frontend && pnpm run test:e2e
# Status: ⚠️ Need to verify (some failures seen in test-results/)
```

---

## 7. Backend Architecture (Python FastAPI)

| Module | Status |
|--------|--------|
| **Scrapers** | LinkedIn, ReliefWeb, Upwork, Corporate, Lilongwe |
| **Data Store** | File-based JSON (`backend/src/athena/store.py`) |
| **ATS Scorer** | Semantic matching + keyword overlap |
| **Document Generation** | AI-powered (Gemini via `@google/genai`) |
| **n8n Integration** | Webhook receiver at `/api/webhooks/n8n` |
| **API** | FastAPI with `/api/v1/athena` prefix |

---

## 8. Known Existing Failures / Gaps

1. **E2E Test Failures**: Scope filtering test failing (see `frontend/test-results/`)
2. **Kanban Stages**: Current has 7 stages, AI Studio requires 6 stages
3. **Color System**: Navy-based dark theme vs. AI Studio's charcoal chassis
4. **Typography**: Monospace font differs (JetBrains vs Cascadia Code)
5. **Pipeline Metrics**: Current uses `avg_ats_score`, AI Studio needs 5 specific metric cards
6. **Mountain Chart**: Not implemented in OpenCode (AI Studio has `LayeredMountainChart`)
7. **Skills Bar Chart**: Not implemented (AI Studio has `MetricsAndBarChart`)
8. **Funnel Graph**: Not implemented (AI Studio has conversion funnel)
9. **Right Sidebar Content**: Partially mirrored in main content, not in sidebar

---

## 9. Data Model Alignment

| AI Studio Type | OpenCode Equivalent | Mapping Status |
|----------------|---------------------|----------------|
| `Opportunity` | `Job` + `Opportunity` (types.ts:340) | ✅ Dual definitions exist |
| `ApplicantProfile` | `UserProfile` + `ApplicantProfile` | ✅ Dual definitions exist |
| `ApplicationReceipt` | `ApplicationReceipt` (types.ts:325) | ✅ Match |
| `AutomationSettings` | `AutomationSettings` (types.ts:443) | ✅ Match |
| `TailoredResume` | `TailoredResume` (types.ts:398) | ✅ Match |
| `PipelineStatus` | `JobStatus` (types.ts:28) | ⚠️ Different enum values |

---

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Color system rewrite affects all components | High | Phase 1: Design tokens only |
| Kanban stage mismatch breaks pipeline | Medium | Map AI Studio stages to existing |
| Missing mountain chart visualization | High | Build new component (Phase 2) |
| Missing skills bar + funnel charts | High | Build new components (Phase 3) |
| Right sidebar not fully implemented | Medium | Complete `AutomationControls` |
| Font substitution (monospace) | Low | Add Cascadia Code to font stack |

---

## 11. Migration Branch Status

```bash
git status
# On branch integration/athena-ai-studio
# Changes to be committed:
#   (modified frontend components from merge)
# Unmerged paths: (resolved)
#   deleted: backend/uv.lock, pnpm-lock.yaml
# Untracked files: (new from main merge)
```

---

**Baseline Complete** — Ready for Gap Analysis (MIGRATION_GAP_ANALYSIS.md)