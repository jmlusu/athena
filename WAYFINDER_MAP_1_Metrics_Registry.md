# Wayfinder Map 1: Metrics Registry & Dashboard Components

## Current State
- **Status**: Metrics registry NOT STARTED (QA Lead audit); 5 metric cards required but only 4 implemented
- **Roadmap Step 2**: "Canonical Metrics Registry + Stale 2,557 Fix" — not completed in athena project
- **Key Files**: `MIGRATION_GAP_ANALYSIS.md` §9.2, `MetricsAndBarChart.tsx`, `Dashboard.tsx`, `types.ts` MatchTier enum

## Decision Tickets (Resolve One at a Time)

### Ticket A: Design 5 Metric Card Variants
- **Requirement**: Replace 4 generic metric cards with 5 specific types from gap analysis
- **Labels needed**: Discovered, ≥90% match, 80-89% match, Sign-Off, Submitted
- **Icons/tints**: Search, Award, AlertTriangle, ShieldCheck, CheckCircle2
- **Dependencies**: MatchTier enum in types.ts, dashboard state management
- **Resolution**: Design MetricCard.tsx variants; update Dashboard.tsx to use 5 cards instead of 4
- **Evidence**: Gap analysis SCR-01 specifies exact 5-card layout with data-testid attributes

### Ticket B: Implement MetricsAndBarChart Aggregation
- **Requirement**: Build component that aggregates all 5 metric cards + skills bars + funnel graph
- **Data pipeline**: Pull from API endpoints `GET /api/v1/athena/stats/pipeline`, `GET /api/v1/athena/stats/scraping`
- **Dependencies**: API responses must include all 5 metric fields; skills compatibility data
- **Resolution**: Enhance MetricsAndBarChart.tsx to receive and render full stats prop; add Skills Bar Chart; add Funnel Graph
- **Evidence**: Current component renders 5 metric cards but lacks skills bars and funnel graph

### Ticket C: Kanban Stage Alignment
- **Requirement**: Map AI Studio's 6 stages to OpenCode's 7 stages (or consolidate)
- **Current**: PipelineKanbanBoard component has stage logic needing alignment
- **Decision**: Either update to 6 stages matching AI Studio spec, or document the 7-stage workflow
- **Resolution**: Review stage definitions; update component props and state management accordingly
- **Evidence**: Gap analysis SCR-01 pipeline requirements specify stage mapping

### Ticket D: Design System Theme Updates (Phase 1)
- **Requirement**: Update Tailwind config with LightSpeed brand tokens
- **Changes needed**: 
  - Replace chassis colors: navy (#070A40) as primary, sign-off red (#E63946) as accent
  - Add semantic status tints: green (completed), amber (in-progress), red (blocked)
  - Migrate to Cascadia Mono font per spec
  - Add shadow primitives and radius tokens
- **Dependencies**: Tailwind config, global CSS, component styling
- **Resolution**: Update `tailwind.config.ts`; add design tokens; update component styles
- **Evidence**: Migration plan Phase 1 design system updates
- **Status (CORRECTION 2026-09-28, re-verified 09:19): PARTIAL / UNVERIFIED — do NOT mark done.**
  - At QA review time (2026-09-28, pre-08:38): `frontend/src/index.css` used `#DC2626` / charcoal `#141619` — `#070A40` had **0 hits**, `#E63946` only as raw literals → **NOT STARTED**.
  - **08:38:32** (unattributed edit this session): `index.css` mtime changed; now declares `--color-signoff-red: #E63946`, `--color-chassis-base: #070A40`, `--color-sidebar-frame: #070A40`.
  - My re-grep (2026-09-28 09:19, `frontend/src` `*.ts/*.tsx/*.css`): `#070A40` = **3**, `#E63946` = **11**, `#DC2626` = **still 7**, `#141619` = **0**.
  - Conclusion: token migration is **started but incomplete** (7 stale `#DC2626` literals remain) and the edit is **unattributed/unverified** — no build/QA sign-off on record.

## Path Forward
Resolve tickets in order: A → B → C → D. Each ticket is independent but builds toward a complete metrics dashboard system. Start with Ticket A (metric card design) as it has the most immediate visual impact and clear acceptance criteria from the gap analysis.

**Destination**: Fully implemented metrics dashboard with 5 card variants, skills bars, funnel graph, and LightSpeed branding — ready for AI Studio comparison and sign-off.

---
*Wayfinder Map generated for athena project. Resolve one ticket at a time until the dashboard metrics system is complete.*