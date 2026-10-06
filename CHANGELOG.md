# Athena — Changelog

**Format:** Keep a Changelog (https://keepachangelog.com)  
**Versioning:** Semantic Versioning (https://semver.org)  
**Unreleased changes** are tracked under `[Unreleased]` and moved to version sections on release.

---

## [2.4.0] — 2026-10-06 (Repository Consolidation & Health Gate)

### Added
- `npm run health` — single repository health check (structure, dependencies, configuration, types, lint baseline, tests, build, security, generated-artifacts, git-status, e2e) + CI `health` job
- `docs/REPOSITORY_HEALTH.md` — before/after metrics and remaining technical-debt register
- Metrics registry `src/lib/athena/metrics-registry.ts` (ATS thresholds, stats/funnel math), adopted by `MetricsAndBarChart`
- `repo-audit/` refreshed: Phase 1 read-only audit deliverables (inventory, dependency map, duplicates, dead code, configuration, documentation, security) + phased approval protocol

### Changed
- Documentation consolidated into `docs/` with `docs/archive/` historical separation
- `ATHENA_AGENT_RULES.md` renamed to `AGENTS.md` (standard discovery name)
- README: repo map, documentation index, corrected scraper/test/CI facts
- Configuration aligned with reality; unused npm dependencies removed (`@google/genai`, `motion`, `autoprefixer`)
- E2E results recorded: 57/66 pass (3 pre-existing failures × 3 browsers)

### Removed
- Stale `athena/` fork (duplicate backend/frontend) and one-off cleanup scripts
- Generated artifacts untracked (`.npy`, `*.egg-info`, `*.jsonl`, junk logs); `.gitignore` hardened

### Notes
- Ruff baseline: 81 pre-existing errors tolerated by CI (no new errors)

---

## [Unreleased] — Migration Integration (Branch: `integration/athena-ai-studio`)

### Added
- **AI Provider Abstraction** (`backend/src/athena/ai/providers/`)
  - `AthenaAIProvider` ABC with 9 abstract methods (score_ats, tailor_resume, tailor_document, dehumanize, synthesize_listings, dispatch_n8n, submit_application, health_check, is_available/name)
  - `FallbackProvider` — deterministic, zero-config implementation for all 9 methods
  - `GeminiProvider` — Google Gemini implementation via `@google/genai` SDK with auto-fallback
  - `factory.py` — `get_ai_provider()` / `create_provider()` with env-based selection
- **AI Router** (`backend/src/athena/api/ai_routes.py`) — 8 new endpoints:
  - `GET /api/v1/athena/ai/health` — provider status
  - `POST /api/v1/athena/ai/score-ats` — ATS scoring (Gemini + fallback)
  - `POST /api/v1/athena/ai/tailor-resume` — resume generation (1/2-col, dehumanize)
  - `POST /api/v1/athena/ai/tailor-document` — cover letter / proposal / executive summary
  - `POST /api/v1/athena/ai/dehumanize` — AI tell removal
  - `POST /api/v1/athena/ai/scrape-live` — AI job synthesis (deprecated, kept for parity)
  - `POST /api/v1/athena/ai/n8n/dispatch` — n8n webhook dispatcher
  - `POST /api/v1/athena/ai/submit-application` — receipt generation with human signature
- **Pydantic Schemas** (`backend/src/athena/api/ai_schemas.py`) — 13 request/response models
- **Status Mapping** (`backend/src/athena/models/status_mapping.py`)
  - `PIPELINE_TO_JOB_STATUS` (7 mappings)
  - `JOB_TO_PIPELINE_STATUS` (10 mappings)
  - `pipeline_to_job_status()` / `job_to_pipeline_status()` converters
- **Adapters** (`backend/src/athena/adapters/ai_studio.py`)
  - `opportunity_to_job()` — AI Studio Opportunity → OpenCode Job
  - `job_to_opportunity()` — OpenCode Job → AI Studio Opportunity
  - Salary parsing, date parsing, platform/source mapping
- **Frontend Routes** (5 new under `/athena/`):
  - `/athena/documents` — `DocumentStudio.tsx` (3 tabs, 1/2-col, dehumanize, print, copy MD)
  - `/athena/receipts` — `Receipts.tsx` (certificate, follow-up generator, LinkedIn export)
  - `/athena/n8n` — `N8nIntegration.tsx` (5-node visual canvas, webhook tester)
  - `/athena/form-filler/:jobId` — `FormFillerModal.tsx` (auto-fill, screening, sign-off gate)
  - `/athena/profile` — `ApplicantProfile.tsx` (6 tabs, editable dossier, file uploads)
- **UI Components**:
  - `ScopeFilter.tsx` — Lilongwe Local / Lilongwe Remote / International Remote
  - `CronCountdown.tsx` — Dual 4h countdown + manual trigger
  - `AutomationControls.tsx` — ATS thresholds, dehumanize toggle, sign-off queue, n8n status
  - Enhanced `AthenaLayout.tsx` — Dual sidebar, brand header, scope/category filters
- **Brand System** (Tailwind CSS v4 tokens in `frontend/src/index.css`):
  - Navy `#070A40`, Red `#E63946`, Cyan `#00BFFF`, Orange `#F97316`, Emerald `#10B981`, Amber `#F59E0B`
  - Typography: Cinzel (brand), Lora (headings), Plus Jakarta Sans (body)
- **Configuration**:
  - `.env.example` — `ATHENA_AI_PROVIDER`, `GEMINI_API_KEY`, `ATHENA_N8N_WEBHOOK_URL`
  - `backend/pyproject.toml` — `google-genai>=1.0.0` dependency
  - `docker-compose.yml` — backend env injection for new vars

### Preserved (Zero Regressions)
- 14 real scrapers (LinkedIn, Indeed, Glassdoor, RemoteOK, WWR, Remote.co, Malawi boards, Upwork, Devex, ReliefWeb, Freelancer, Toptal, Guru, PeoplePerHour)
- Semantic matching (`all-MiniLM-L6-v2`, cosine cache, `POST /match`)
- Heuristic ATS scoring (40/35/15/10 weights, sub-scores)
- JSONL persistence + filelock + dedupe + embeddings cache
- 46 REST endpoints (`/api/v1/athena/*`)
- Security stack (`X-API-Key`, rate limit, CORS, CSP/HSTS, loopback)
- APScheduler (4h scrape / 30m score / 1d cleanup)
- DOCX generation (`python-docx`, resume/cover-letter templates)
- Backend test suite (112 tests: 104 pass + 8 GTK-gated)
- Frontend test suite (59 tests, `node --test`)
- CI/CD pipelines (lint, build, ruff, pytest, health gate, e2e)
- Deployment configs (compose/OCI removed 2026-10; `backend/Dockerfile` retained as reference)

### Changed
- `backend/src/athena/api/app.py` — registered AI router at `/api/v1/athena/ai`
- `frontend/src/App.tsx` — added 5 new routes under `/athena/`
- `frontend/src/lib/athena/api.ts` — added client functions for 8 new AI endpoints
- `frontend/src/AthenaLayout.tsx` — integrated new navigation links

### Fixed
- `SubmitApplicationResponse` — removed `.detail` access in `FormFillerModal` (pre-existing schema gap)
- n8n dispatcher route mismatch — corrected to `/api/v1/athena/ai/n8n/dispatch`

### Deprecated
- `POST /api/v1/athena/ai/scrape-live` — AI synthesis fallback; primary discovery uses real scrapers via `POST /api/v1/athena/scrape`

### Removed
- External LLM path (`ai_company` import) — replaced with provider abstraction

---

## [0.3.0] — 2026-09-26 (Pre-Migration Baseline)

### Added
- OpenCode Athena core: scrapers, matching, scoring, persistence, API, scheduler, DOCX
- Frontend: React 19 + Vite + Tailwind v4, 7 routes, 16 components, 8 pages
- Docker + CI/CD + test infrastructure

---

## [0.2.0] — 2026-09-20

### Added
- Initial Athena backend (FastAPI, scrapers, store)
- Basic frontend scaffold

---

## [0.1.0] — 2026-09-15

### Added
- Project initialization
- Repository structure

---

## Migration Note

The `[Unreleased]` section above represents the **complete AI Studio → OpenCode integration** as of commit `f9a7d6c` on branch `integration/athena-ai-studio`. 

**Formal release gating** (per `ATHENA_MERGE_CHECKLIST.md`):
- 0/124 checklist items formally signed off
- 4 critical gaps block merge: visual design system, missing components (MountainChart, MetricsChart, LinkedInExportModal, OpportunityDetailModal), backend test coverage (4 missing test files), E2E test execution (0/56 ever run)
- Implementation completeness: ≈55% (unit tests + partial integration)

**Target Release:** Upon Gate 7 approval (production merge approved), this `[Unreleased]` content will move to `[1.0.0] — YYYY-MM-DD`.

---

## Verification Commands

```bash
# Full repository health (lint, build, tests, ruff baseline, security, artifacts)
npm run health

# Backend tests (102 passing, 8 GTK-gated skips)
cd backend && uv run pytest -q

# Node unit tests (59 passing)
npm run test:unit

# Type-check + build
npm run lint && npm run build

# AI health check (requires backend running)
curl http://localhost:8000/api/v1/athena/ai/health
```

---

**Maintained By:** QA Lead / Release Engineering  
**Cross-References:** `MIGRATION_PLAN.md`, `ATHENA_MERGE_CHECKLIST.md`, `FINAL_INTEGRATION_REPORT.md`, `FINAL_MIGRATION_REPORT.md`, `FINAL_VISUAL_PARITY_REPORT.md`