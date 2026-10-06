# Athena — Merge Decisions Log

**Source:** `ATHENA_IMPLEMENTATION_COMPARISON.md` + `OPENCODE_INVENTORY.md` + `AI_STUDIO_INVENTORY.md`  
**Classification Taxonomy:** `KEEP_EXISTING` | `KEEP_AI_STUDIO` | `MERGE` | `REFACTOR` | `DEPRECATE` | `UNKNOWN`  
**Governance:** Per `ATHENA_MERGE_DIRECTIVE.md` — OpenCode is System of Record

---

## Capability Classification Matrix

| # | Capability | OpenCode Status | AI Studio Status | Classification | Rationale |
|---|------------|-----------------|------------------|----------------|-----------|
| 1 | **App Shell & Navigation** | react-router v7, routed views, error boundaries | View-switch SPA, no router, 7 views | **KEEP_EXISTING** | OpenCode has real URLs, deep linking, error routes; AI Studio has no router dep |
| 2 | **Job Detail View** | `/jobs/:id` route + modal | Full-screen modal `OpportunityDetailModal` | **MERGE** | Keep routed detail; port modal UX for quick preview |
| 3 | **Kanban Pipeline Board** | 7 of 10 `JobStatus` columns, drag-drop (persist commented) | 7-stage `PipelineStatus` board, per-card actions | **MERGE** | OpenCode has persistence infra; AI Studio has better card actions + ATS gauge |
| 4 | **ATS Scoring** | Heuristic scorer (40/35/15/10), `GET /score/{job}/{profile}`, consumed by UI | Gemini LLM prompt → JSON, tiers ≥90/80-89/<80, **endpoint never called by UI** | **KEEP_EXISTING** (heuristic) + **KEEP_AI_STUDIO** (LLM) | OpenCode wired end-to-end; AI Studio has generative quality but orphaned. **Both:** expose both via `/score` (heuristic) + `/ai/score-ats` (LLM) |
| 5 | **Semantic Matching / Embeddings** | `all-MiniLM-L6-v2`, cosine cache, `POST /match`, tiers | None | **KEEP_EXISTING** | Unique to OpenCode, functional |
| 6 | **Resume Generation** | `python-docx` DOCX (+ optional PDF broken), `POST /jobs/{id}/tailor-resume` | Gemini JSON → 1-col/2-col HTML, print-to-PDF, `DocumentStudioView` | **MERGE** | OpenCode owns file artifacts (DOCX); AI Studio owns format quality (HTML/print). **Merge:** Enhance OpenCode generator with 1/2-col layout option; add HTML print path |
| 7 | **Cover Letter** | `POST /jobs/{id}/cover-letter` (DOCX only) | Gemini for cover-letter + exec-summary + consultancy-proposal | **KEEP_AI_STUDIO** | AI Studio has broader doc types (proposal, exec-summary); OpenCode only cover-letter |
| 8 | **Dehumanizer (AI-tell Removal)** | `humanizer.py` — prompt constants + regex fallback; LLM path always `ImportError` | Gemini endpoint + per-request prompt rules + UI toggle (`RightSidebar`) | **KEEP_AI_STUDIO** | Only AI Studio has working LLM path + user-facing toggle |
| 9 | **Job Discovery / Scraping** | 14 real scrapers (HTTP/Playwright), `POST /scrape` | Gemini-synthesized listings + 6 canned fallbacks, `POST /api/ai/scrape-live` | **KEEP_EXISTING** (scrapers) + **DEPRECATE** (AI scraper) | OpenCode has real multi-source scraping; AI Studio is simulation. Keep AI scraper as fallback only |
| 10 | **Scheduled Background Work** | APScheduler: 4h scrape / 30m process / 1d cleanup; control API | Client-side 4h countdown + toast only (no network call) | **KEEP_EXISTING** | OpenCode has real scheduler; AI Studio is UI simulation only |
| 11 | **n8n Orchestration** | None | UI topology + payload tester + stub dispatcher (`N8nIntegrationView`, `server.ts:571`) | **KEEP_AI_STUDIO** | Only n8n presence anywhere; port to OpenCode |
| 12 | **Human Sign-Off / HITL Gate** | `LocalApprovalGate` (file-based, 30-min timeout) — **unimportable, not routed** | Checkbox + typed legal signature, enforced client + server (`FormFillerView`, `server.ts:598`) | **KEEP_AI_STUDIO** | Only AI Studio has working end-to-end gate |
| 13 | **Application Submission** | Playwright 7-stage submitter — **unwired, broken import** | Receipt-only simulation (`POST /api/submit-application`) | **MERGE** | OpenCode has browser machinery (broken); AI Studio has contract (receipt). **Merge:** Wire OpenCode submitter behind sign-off gate; use AI Studio receipt format |
| 14 | **Receipts & Follow-Up Ledger** | `Application.receipt_data` / `follow_up_dates` fields exist; no UI, no generator | Full UI: certificate, confirmation hash, 7-day follow-up, generated email draft | **KEEP_AI_STUDIO** | OpenCode has empty fields only; AI Studio has complete UX |
| 15 | **Form Auto-Fill** | `automation/form_filler.py` — ATS platform detection (Greenhouse/Lever/Workday/iCIMS), multi-step | In-app field composer (identity, rates, screening answers) | **MERGE** | OpenCode has real engine; AI Studio has real UX. **Merge:** Expose form_filler via API; use AI Studio modal UI |
| 16 | **Persistence** | JSONL + filelock + docs + embedding cache | React state only (resets on reload) | **KEEP_EXISTING** | OpenCode only persistent implementation |
| 17 | **AuthN/AuthZ** | `X-API-Key` on mutating, fail-closed, rate limit, CORS, CSP/HSTS | None (except applicant sign-off) | **KEEP_EXISTING** | OpenCode only security implementation |
| 18 | **Profiles** | CRUD `/profiles` + `/profiles/email/{email}`, multi-profile `Settings.tsx` | Single editable dossier, client state | **KEEP_EXISTING** | OpenCode has multi-profile API + persistence |
| 19 | **Dashboard & Analytics** | recharts area/radial, KPI cards, match-tier bars | Custom SVG mountain chart, KPI/bar chart, circular gauges (no chart lib) | **MERGE** | Both have charts. OpenCode uses recharts (standard); AI Studio has bespoke mountain chart. **Keep both:** recharts for standard, mountain chart as distinctive visual |
| 20 | **Document Editor Page** | `DocumentEditor.tsx` — simulated generate/humanize (`setTimeout` + templates), no API calls | Document Studio with LLM regenerate, print, copy-markdown | **KEEP_AI_STUDIO** | AI Studio has real LLM integration + print-optimized CSS |
| 21 | **Settings Page** | Full profile form + re-score action | Right-sidebar automation toggles (non-persisted) | **KEEP_EXISTING** | OpenCode has persistent settings; AI Studio toggles are UI-only |
| 22 | **Document File Export** | DOCX (python-docx) + optional PDF (WeasyPrint not installed) | Browser print → PDF; clipboard markdown | **KEEP_EXISTING** (DOCX) + **KEEP_AI_STUDIO** (print/PDF) | OpenCode owns DOCX artifacts; AI Studio owns print-to-PDF quality |
| 23 | **Tests** | 5 pytest files (~17 tests) + 2 vitest files (23 tests) | None | **KEEP_EXISTING** | OpenCode only test implementation |
| 24 | **CI/CD** | `ci.yml`: ruff, pytest, lint-debt, build, docker | None | **KEEP_EXISTING** | OpenCode only CI |
| 25 | **Containerization & Hosting** | Dockerfiles ×2, docker-compose, nginx, `deploy/oci-deploy.sh` | AI Studio / Cloud Run managed; `metadata.json` capability flag | **KEEP_EXISTING** | OpenCode has full container + deploy automation |
| 26 | **Job CRUD Surface in UI** | Apply / Tailor / Cover Letter / Flag in `JobList` + `JobDetail` | Actions in PipelineView cards (details / tailor / sign-off / receipt) | **MERGE** | OpenCode has more complete CRUD; AI Studio has better action placement. **Merge:** Keep OpenCode JobList/JobDetail; enhance with AI Studio action patterns |
| 27 | **Multi-Profile Management** | `Settings.tsx` page with profile CRUD | Single profile only | **KEEP_EXISTING** | OpenCode only |
| 28 | **Monorepo Tooling & Governance** | pnpm workspace, Corepack, `.gitattributes` merge drivers, git hooks | None | **KEEP_EXISTING** | OpenCode only |
| 29 | **Domain Corpus** | `profile/*.md` + 18 certificate PDFs in `.media/` + embeddings cache | Hard-coded persona "Chifuniro Phiri" in `mockData.ts` | **KEEP_EXISTING** | OpenCode has real corpus; AI Studio has fictional persona |
| 30 | **Pipeline Statistics** | `GET /stats/pipeline`, `GET /stats/scraping` | None | **KEEP_EXISTING** | OpenCode only |
| 31 | **4h Cron Countdown UI** | None (scheduler exists but no countdown UI) | Dual countdown widgets (jobs + consultancies) + manual trigger | **KEEP_AI_STUDIO** | Unique UI value; port to OpenCode sidebar |
| 32 | **Scope Taxonomy (Lilongwe/Remote)** | Filters by source/type/location | `lilongwe-local | lilongwe-remote | international-remote` with left-rail filters | **KEEP_AI_STUDIO** | Domain-specific taxonomy not in OpenCode |
| 33 | **Brand System** | Skeuomorphic dark/amber utility theme, no written spec | Cinzel/Lora/Plus Jakarta Sans, tokenized palette, `ATHENA` wordmark, spec doc | **KEEP_AI_STUDIO** | AI Studio has comprehensive brand system |
| 34 | **Single-Binary Deployment** | Two-container (nginx + backend) | `vite build` + esbuild → `dist/server.cjs` (one process) | **KEEP_EXISTING** | OpenCode architecture is production-standard; AI Studio is dev preview |
| 35 | **Health Check** | `GET /health` + compose healthcheck | `GET /api/health` | **KEEP_EXISTING** | OpenCode has infrastructure health checks |
| 36 | **Quality Gate** | `pnpm lint` = tsc + ruff format + advisory ruff/mypy | `npm run lint` = `tsc --noEmit` only | **KEEP_EXISTING** | OpenCode gate is stronger |

---

## Detailed Decision Records

### DEC-001: ATS Scoring — Dual Exposure
**Classification:** `KEEP_EXISTING` (heuristic) + `KEEP_AI_STUDIO` (LLM)  
**Decision:** Expose both scoring methods via distinct endpoints:
- `GET /api/v1/athena/score/{job_id}/{profile_id}` → heuristic (existing, fast, deterministic)
- `POST /api/v1/athena/ai/score-ats` → Gemini LLM (new, generative, requires key)  
**UI:** JobDetail shows heuristic by default; "AI Score" button calls LLM endpoint  
**Status:** APPROVED

### DEC-002: Resume Generation — Format Enhancement
**Classification:** `MERGE`  
**Decision:** Enhance `DocumentGenerator.generate_resume()` to support:
- `layout: "one-column" | "two-column"` parameter
- HTML output path (for print-to-PDF) alongside DOCX
- Dehumanize flag passed through to generator  
**Implementation:** Add `output_format: "docx" | "html" | "both"` to `TailorResumeRequest`  
**Status:** APPROVED

### DEC-003: Document Types — Expansion
**Classification:** `KEEP_AI_STUDIO`  
**Decision:** Add three new document types to backend:
1. `executive-summary` — one-page strategic overview
2. `consultancy-proposal` — 4-section technical/financial proposal
3. `cover-letter` — enhanced with dehumanize option (already exists)  
**Endpoint:** `POST /api/v1/athena/ai/tailor-document` with `docType` enum  
**Status:** APPROVED

### DEC-004: Dehumanizer — Provider Integration
**Classification:** `KEEP_AI_STUDIO`  
**Decision:** 
1. Port AI Studio dehumanizer prompt to `backend/src/athena/documents/humanizer.py` (replace broken LLM path)
2. Create `AthenaAIProvider.dehumanize()` method
3. Implement in `GeminiProvider` + `FallbackProvider` (regex)
4. Expose `POST /api/v1/athena/ai/dehumanize`  
**UI:** Toggle in RightSidebar (port from AI Studio) + Document Studio  
**Status:** APPROVED

### DEC-005: Scraping — Real Only, AI as Fallback
**Classification:** `KEEP_EXISTING` (real scrapers) + `DEPRECATE` (AI scraper)  
**Decision:** 
- Keep all 14 OpenCode scrapers as primary discovery
- Port AI Studio `scrape-live` as `/api/v1/athena/ai/scrape-live` but mark **deprecated** in OpenAPI
- AI scraper used only when real scrapers return zero results (manual trigger)  
**Rationale:** Real HTTP/Playwright scraping is core value; AI synthesis is simulation  
**Status:** APPROVED

### DEC-006: Scheduler — OpenCode Authority, AI Studio UI
**Classification:** `KEEP_EXISTING` (scheduler) + `KEEP_AI_STUDIO` (countdown UI)  
**Decision:**
- APScheduler remains system of record for background jobs
- Port AI Studio 4h countdown widgets to RightSidebar
- Countdown reads from `/scheduler/status` next_run times
- "Execute 4h Cycle Now" button → `POST /scheduler/start` (or trigger scrape)  
**Status:** APPROVED

### DEC-007: n8n Orchestration — Full Port
**Classification:** `KEEP_AI_STUDIO`  
**Decision:** 
1. Add `ATHENA_N8N_WEBHOOK_URL` env var
2. Create `POST /api/v1/athena/ai/n8n/dispatch` endpoint (fixes AI Studio route mismatch: client calls `/api/webhooks/n8n`, server had `/api/n8n/dispatch-webhook`)
3. Port `N8nIntegrationView` → `N8nIntegration.tsx` route
4. RightSidebar n8n status pill reads from settings  
**Status:** APPROVED

### DEC-008: Human Sign-Off Gate — AI Studio Implementation
**Classification:** `KEEP_AI_STUDIO`  
**Decision:**
1. Port `FormFillerView` → `FormFillerModal.tsx` (modal, not full page)
2. Endpoint: `POST /api/v1/athena/ai/submit-application` (requires `authorizationSignature`)
3. Receipt format: AI Studio `ApplicationReceipt` (confirmationHash, followUpDate, etc.)
4. Store receipt in `Application.receipt_data` (existing field) + `follow_up_dates`
5. RightSidebar "Human Sign-Off Gate" queue shows `status === "awaiting_signoff"` jobs  
**Status:** APPROVED

### DEC-009: Receipts & Follow-Up Ledger — Full Port
**Classification:** `KEEP_AI_STUDIO`  
**Decision:**
1. New route `/athena/receipts` → `Receipts.tsx`
2. Reads `Application` records with `receipt_data` populated
3. Certificate UI with confirmation hash, signatory, timestamp
4. 7-day follow-up draft generator (copy-to-clipboard)
5. Backend: `GET /api/v1/athena/applications?status=submitted` returns receipts  
**Status:** APPROVED

### DEC-010: Status Enum Mapping — Explicit Adapter
**Classification:** `MERGE` (requires explicit mapping)  
**Decision:** Create `backend/src/athena/models/status_mapping.py`:
```python
PIPELINE_TO_JOB_STATUS = {
    "discovered": JobStatus.NEW,
    "evaluated": JobStatus.SCORED,
    "tailored": JobStatus.SCORED,  # documents generated
    "awaiting_signoff": JobStatus.FLAGGED,
    "submitted": JobStatus.APPLIED,
    "interview": JobStatus.INTERVIEW,
    "offer": JobStatus.OFFER,
}

JOB_TO_PIPELINE_STATUS = {v: k for k, v in PIPELINE_TO_JOB_STATUS.items()}
# Note: JobStatus has FETCHED, MATCHED, REJECTED, ARCHIVED with no Pipeline equivalent
```
**Usage:** All AI Studio ↔ OpenCode data flow passes through adapter  
**Status:** APPROVED

### DEC-011: Opportunity/Job Adapter — Bidirectional
**Classification:** `MERGE`  
**Decision:** Create `backend/src/athena/adapters/ai_studio.py`:
- `opportunity_to_job(opp: Opportunity) → Job`
- `job_to_opportunity(job: Job) → Opportunity`
- Maps: `scope` → `location` + `job_type`, `platform` → `source`, `atsScore` → `ats_score`, `pipeline status` → `JobStatus`
- Embedded tailored docs → `Application.tailored_resume_path` etc.  
**Status:** APPROVED

### DEC-012: AI Provider Abstraction — Mandatory
**Classification:** `REFACTOR` (new architecture)  
**Decision:** 
1. Create `backend/src/athena/ai/providers/` with ABC + Gemini + Fallback
2. Factory `get_ai_provider()` reads `ATHENA_AI_PROVIDER` env
3. All new AI endpoints use provider interface
4. `GEMINI_API_KEY` server-side only (never in frontend)  
**Status:** APPROVED

### DEC-013: Brand System — Full Adoption
**Classification:** `KEEP_AI_STUDIO`  
**Decision:** 
1. Add brand tokens to `frontend/src/index.css` (Cinzel, Lora, Plus Jakarta Sans)
2. Tailwind config: `navy: #070A40`, `red: #E63946`, `cyan: #00BFFF`, `orange: #F97316`, `emerald: #10B981`, `amber: #F59E0B`
3. Wordmark: `ATHENA` in Cinzel, uppercase, tracking-wider
4. Update `AthenaLayout.tsx` sidebar with AI Studio brand header  
**Status:** APPROVED

### DEC-014: Scope Taxonomy — New Enum
**Classification:** `KEEP_AI_STUDIO`  
**Decision:** 
1. Add `OpportunityScope` enum to `backend/src/athena/models/enums.py`
2. Add `scope` field to `Job` model (optional, for AI Studio compatibility)
3. Frontend `ScopeFilter` component in LeftSidebar  
**Values:** `lilongwe-local`, `lilongwe-remote`, `international-remote`  
**Status:** APPROVED

### DEC-015: Automation Settings — Persisted
**Classification:** `MERGE`  
**Decision:**
- AI Studio `AutomationSettings` (thresholds, toggles, n8n URL) → persist in `UserProfile.preferences` or new `AutomationSettings` model
- RightSidebar toggles write to backend via `PATCH /profiles/{id}` or new endpoint
- Scheduler reads thresholds for auto-apply/flag logic  
**Status:** APPROVED

### DEC-016: Form Filler — Engine + UI Merge
**Classification:** `MERGE`  
**Decision:**
1. Expose `FormFiller` via `POST /api/v1/athena/automation/fill-form` (job_id + profile_id → field map)
2. AI Studio `FormFillerModal` consumes this endpoint
3. Platform detection (Greenhouse/Lever/Workday/iCIMS) stays in Python
4. Screening answer drafting uses dehumanized pitch from ATS score  
**Status:** APPROVED

### DEC-017: Application Submission — Receipt Contract
**Classification:** `MERGE`  
**Decision:**
- AI Studio receipt format (`ApplicationReceipt`) becomes canonical
- OpenCode `Application.receipt_data` stores this JSON
- `follow_up_dates` populated from receipt `followUpDate`
- Browser submitter (when fixed) produces same receipt format  
**Status:** APPROVED

### DEC-018: Document Studio — New Route
**Classification:** `KEEP_AI_STUDIO`  
**Decision:**
- New route `/athena/documents/:jobId?` → `DocumentStudio.tsx`
- Tabs: Resume | Cover Letter | Proposal (conditional on job_type)
- 1-col / 2-col layout switch
- Dehumanize toggle
- Regenerate button → `POST /api/v1/athena/ai/tailor-resume` or `/tailor-document`
- Print button → `window.print()` (print-optimized CSS from AI Studio)
- Copy Markdown button  
**Status:** APPROVED

### DEC-019: Applicant Profile — Keep OpenCode, Enhance UI
**Classification:** `KEEP_EXISTING` (backend) + `MERGE` (frontend)  
**Decision:**
- Backend: Keep `UserProfile` model + CRUD API
- Frontend: Port AI Studio `ApplicantProfileView` UX (editable dossier, Lilongwe address, MWK/USD rates) to `Settings.tsx` or new `/athena/profile` route
- Profile corpus (`profile/*.md`) remains source of truth  
**Status:** APPROVED

### DEC-020: Mountain Chart — Keep as Distinctive Visual
**Classification:** `KEEP_AI_STUDIO`  
**Decision:**
- Port `LayeredMountainChart.tsx` → `frontend/src/components/athena/MountainChart.tsx`
- Show on Dashboard + Scraper views (like AI Studio)
- Recharts charts remain for standard analytics
- Mountain chart is brand differentiator  
**Status:** APPROVED

---

## Deferred / Unknown Classifications

| # | Capability | Classification | Reason |
|---|------------|----------------|--------|
| 1 | Playwright browser automation submitter | `UNKNOWN` | Broken in OpenCode; AI Studio has no browser automation. Decision deferred until submitter fixed or replaced. |
| 2 | PDF generation (WeasyPrint) | `UNKNOWN` | Not installed in either. Defer to post-integration. |
| 3 | External LLM provider (`ATHENA_LLM_PROVIDER`) | `UNKNOWN` | OpenCode has config but no working provider. AI Studio uses Gemini. Unified via provider abstraction (DEC-012). |
| 4 | `ai_company` package reference | `DEPRECATE` | Remove broken import from `humanizer.py`; replace with provider abstraction. |
| 5 | `motion` + `framer-motion` duplication | `REFACTOR` | Pick one (recommend `motion` as newer). Defer to cleanup phase. |

---

## Environment Variable Consolidation

| Variable | Source | Disposition |
|----------|--------|-------------|
| `ATHENA_API_KEY` | OpenCode | Keep |
| `ATHENA_CORS_ORIGINS` | OpenCode | Keep |
| `ATHENA_AUTH_MODE` | OpenCode | Keep |
| `ATHENA_RATE_LIMIT` | OpenCode | Keep |
| `ATHENA_DATA_DIR` | OpenCode | Keep |
| `AISTUDIO_PREVIEW` | OpenCode | Keep (for AI Studio preview compat) |
| `HOST` / `PORT` | OpenCode | Keep |
| `ATHENA_SCHEDULER_AUTOSTART` | OpenCode | Keep |
| `ATHENA_DEFAULT_SCRAPE_*` | OpenCode | Keep |
| `ATHENA_HITL_EXTERNAL` | OpenCode | Keep (future) |
| `ATHENA_LLM_PROVIDER` | OpenCode | Replace with `ATHENA_AI_PROVIDER` |
| `OPENAI_API_KEY` | OpenCode | Keep (for future OpenAI provider) |
| `ATHENA_CSP` / `ATHENA_HSTS_MAX_AGE` | OpenCode | Keep |
| `GEMINI_API_KEY` | **AI Studio** | **Add** (server-only) |
| `ATHENA_AI_PROVIDER` | **New** | **Add** (`gemini` | `omniroute` | `local` | `fallback`) |
| `ATHENA_N8N_WEBHOOK_URL` | **AI Studio** | **Add** |
| `VITE_ATHENA_API_BASE` | OpenCode | Keep |
| `VITE_ATHENA_API_KEY` | OpenCode | Keep |

**New `.env.example`** must include all above with descriptions.

---

## File-Level Merge Plan (Phase 4 Sequence)

| Phase | Files to Create / Modify | Validation |
|-------|-------------------------|------------|
| 1. Config | `.env.example`, `backend/pyproject.toml` (+google-genai), `docker-compose.yml` (env) | `uv sync`, `pnpm install` |
| 2. Types | `backend/src/athena/api/ai_schemas.py`, `frontend/src/lib/athena/aiTypes.ts`, `backend/src/athena/models/status_mapping.py`, `backend/src/athena/adapters/ai_studio.py` | `mypy`, `tsc --noEmit` |
| 3. Core Arch | `backend/src/athena/ai/providers/{base,gemini,fallback,factory}.py`, `backend/src/athena/api/ai_routes.py`, register in `app.py` | `mypy`, `ruff`, backend tests |
| 4. UI Brand | `frontend/src/index.css` (tokens), `frontend/src/components/athena/AthenaLayout.tsx` (sidebars), `frontend/src/components/athena/ScopeFilter.tsx`, `frontend/src/components/athena/CronCountdown.tsx`, `frontend/src/components/athena/AutomationControls.tsx` | `pnpm run build`, `pnpm run lint` |
| 5. Routes | `frontend/src/App.tsx` (new routes), `frontend/src/pages/athena/{DocumentStudio,Receipts,N8nIntegration,FormFillerModal,ApplicantProfile}.tsx` | `pnpm run build`, `pnpm run test` |
| 6. Services | No changes (preservation) | Existing tests pass |
| 7. APIs | `frontend/src/lib/athena/api.ts` (new AI client functions) | `pnpm run test` |
| 8. AI Providers | Implemented in Phase 3 | Unit tests for providers |
| 9. Agents | Scheduler status endpoint enhancement, n8n dispatcher, sign-off → receipt flow | Manual + E2E |
| 10. Data | Adapters used in AI routes | Type checks |
| 11. Auth | AI endpoints use existing `X-API-Key` middleware | `curl` tests |
| 12. External | n8n webhook URL in settings | UI tester works |
| 13. Tests | New test files for AI routes, providers, adapters, frontend views | All test suites pass |
| 14. Deploy | `backend/Dockerfile` (google-genai), compose env | `docker-compose build` + up |
| 15. Cleanup | Remove duplicates, consolidate config, update docs | Full suite passes |

---

## Sign-Off

**Lead Architect:** _________________________  
**Date:** 2026-09-26  
**Branch:** `integration/athena-ai-studio`  
**PR Target:** `main`