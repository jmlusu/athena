# Athena — OpenCode Migration Verification Checklist

> **Category**: Engineering & QA Verification Checklist  
> **Audience**: OpenCode Engineering Leads & QA Engineers  
> **Status**: COMPLETE & VERIFIED  

---

## Pre-Migration Verification
- [x] AI Studio prototype frozen at v2.4.0
- [x] Source code inspected across all files
- [x] Design tokens (colors, typography, spacing, shadows) documented in `DESIGN_SYSTEM.md`
- [x] All 7 views and 3 modal dialogs inventoried in `SCREEN_INVENTORY.md`
- [x] All 18 reusable components cataloged in `COMPONENT_INVENTORY.md`
- [x] Routes and deep linking mapped in `ROUTE_MAPPING.md`
- [x] User flows documented in `USER_FLOWS.md`
- [x] Interactions and micro-interactions documented in `INTERACTION_SPEC.md`
- [x] Animations and easing documented in `MOTION_SPEC.md`
- [x] Responsive breakpoints documented in `RESPONSIVE_SPEC.md`
- [x] Asset manifest cataloged in `ASSET_MANIFEST.md`
- [x] Data contracts and TypeScript interfaces specified in `DATA_CONTRACT.md`
- [x] Backend API expectations specified in `INTEGRATION_REQUIREMENTS.md`
- [x] Component mapping matrix completed in `COMPONENT_MAPPING.md`
- [x] Visual acceptance criteria defined in `VISUAL_ACCEPTANCE_CRITERIA.md`
- [x] OpenCode migration prompt created in `OPENCODE_MIGRATION_PROMPT.md`

---

## OpenCode Implementation Verification
- [ ] Google Fonts (`Cinzel`, `Lora`, `Plus Jakarta Sans`) loaded and configured
- [ ] Theme colors (`#F97316`, `#DC2626`, `#1E2024`, `#141619`, `#E2E8F0`) configured in Tailwind
- [ ] Tactile and depth shadow primitives (`.raised`, `.sunken`, `.glow-amber`, `.tactile`) integrated
- [ ] Left sidebar navigation with 3-scope filters and 4-hour countdown widget operational
- [ ] Right sidebar automation toggles and human sign-off queue operational
- [ ] Mountain dynamics chart rendered with SVG gradients and hover telemetry tooltip
- [ ] Numerical metric cards and skills compatibility bar chart rendered
- [ ] 6-stage Kanban pipeline board with search filter and stage pills functional
- [ ] Scraper discovery view with 4 scope selector pills and live crawl action connected
- [ ] Document Studio 1-column vs 2-column switcher and Dehumanizer toggle functional
- [ ] Document print / PDF export verified with clean chrome-free vector output
- [ ] Mandatory human sign-off gate enforced with checkbox and typed signature validation
- [ ] Application submission receipts generated with SHA-256 hash and 7-day follow-up outreach draft
- [ ] LinkedIn export modal functional with Easy Apply draft, Experience mapping, and JSON/MD downloads
- [ ] n8n workflow visualizer and webhook receiver operational
- [ ] Candidate profile dossier and dynamic ATS keywords manager connected
- [ ] End-to-end tests passing without regressions
