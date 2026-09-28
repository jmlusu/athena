# ATHENA — Merge Checklist

**Phase-gate checklist for the AI Studio → OpenCode integration.**

**Branch:** `integration/athena-ai-studio`  
**Target:** `main`  
**Definition of Done:** All phases ✅, all validation gates ✅, `FINAL_INTEGRATION_REPORT.md` complete.

> **STATUS (verified 2026-09-28, QA Lead / P0-d):** **0 of 124 boxes checked** — 0% formal completion; evidence-based implementation ≈55%. The DoD's referenced `FINAL_INTEGRATION_REPORT.md` "All Met" claim is **corrected as FALSE** in that document (2026-09-28). This track is documentation-only and **has not checked any boxes**; no sign-off has been granted.
>
> **CORRECTION (2026-09-28) — Commit `b814f9e` message claims:** *"e2e runner remediation (suite executes: 3 pass/29 fail)"* — **unsupported by any artifact** (grep: 0 hits; `results.json` = 280 skipped / 0 executed; `frontend/test-output.txt` is vitest 23/23). Treat "3 pass/29 fail" as **unverified, not fact**.

---

## Phase 0 — Prerequisites

- [ ] Required directive docs exist (6 files)
- [ ] `AI_STUDIO_INVENTORY.md` exists (complete)
- [ ] `ATHENA_IMPLEMENTATION_COMPARISON.md` exists (complete)
- [ ] `OPENCODE_INVENTORY.md` created
- [ ] `MERGE_DECISIONS.md` created (all capabilities classified)
- [ ] `integration/athena-ai-studio` branch created from `main`
- [ ] No uncommitted changes on `main` (clean baseline)

---

## Phase 1 — Configuration & Environment

- [ ] `.env.example` updated with all required vars (both implementations merged)
  - [ ] `GEMINI_API_KEY` (server-only)
  - [ ] `ATHENA_AI_PROVIDER` (gemini|omniroute|local|fallback)
  - [ ] `ATHENA_N8N_WEBHOOK_URL`
  - [ ] All existing OpenCode vars preserved
- [ ] `backend/pyproject.toml` — AI deps added (`google-genai`, `httpx`)
- [ ] `frontend/package.json` — no new deps needed (uses existing lucide, react-router, etc.)
- [ ] `docker-compose.yml` — backend env includes new vars
- [ ] **Validation:** `uv sync` + `pnpm install` clean

---

## Phase 2 — Dependencies

- [ ] Backend: `google-genai` added to `pyproject.toml` dependencies
- [ ] Backend: `httpx` already present (confirmed)
- [ ] Frontend: No new dependencies required
- [ ] Lockfiles updated: `uv.lock`, `pnpm-lock.yaml`
- [ ] **Validation:** `uv sync` + `pnpm install` clean

---

## Phase 3 — Types & Schemas

- [ ] Backend Pydantic schemas for AI endpoints (`backend/src/athena/api/ai_schemas.py`)
  - [ ] `ATSScoreRequest/Response`
  - [ ] `TailorResumeRequest/Response`
  - [ ] `TailorDocumentRequest/Response`
  - [ ] `DehumanizeRequest/Response`
  - [ ] `ScrapeLiveRequest/Response`
  - [ ] `SubmitApplicationRequest/Response`
  - [ ] `N8nDispatchRequest/Response`
- [ ] Frontend TypeScript types mirror backend (`frontend/src/lib/athena/aiTypes.ts`)
- [ ] Status mapping: `PipelineStatus ↔ JobStatus` (`backend/src/athena/models/status_mapping.py`)
- [ ] Adapter: `Opportunity ↔ Job` (`backend/src/athena/adapters/ai_studio.py`)
- [ ] **Validation:** `mypy` + `tsc --noEmit` clean

---

## Phase 4 — Core Architecture

- [ ] AI Provider abstraction (`backend/src/athena/ai/providers/`)
  - [ ] `base.py` — `AthenaAIProvider` ABC
  - [ ] `gemini.py` — `GeminiProvider` implementation
  - [ ] `fallback.py` — `FallbackProvider` (deterministic)
  - [ ] `factory.py` — `get_ai_provider()` from env
- [ ] AI Router: `backend/src/athena/api/ai_routes.py`
  - [ ] Registered in `app.py` under `/api/v1/athena/ai`
- [ ] Provider config in `backend/src/athena/__init__.py` or settings
- [ ] **Validation:** `mypy` + `ruff` + backend tests pass

---

## Phase 5 — UI Components (Brand & Layout)

- [ ] Brand tokens in `frontend/src/index.css` (Cinzel, Lora, Plus Jakarta Sans, Navy/Red/Cyan/Orange/Emerald/Amber)
- [ ] Tailwind config updated with brand colors
- [ ] `AthenaLayout.tsx` enhanced with Left/Right sidebar patterns from AI Studio
- [ ] `CronCountdown.tsx` component (4h dual countdown)
- [ ] `ScopeFilter.tsx` (Lilongwe Local / Lilongwe Remote / International Remote)
- [ ] `AutomationControls.tsx` (ATS thresholds, dehumanizer toggle, n8n status)
- [ ] **Validation:** `pnpm run build` + `pnpm run lint` clean

---

## Phase 6 — Frontend Routes

New routes under `/athena/` (react-router):

| Route | Component | Source |
|-------|-----------|--------|
| `/athena/documents` | `DocumentStudio.tsx` | AI Studio `DocumentStudioView` |
| `/athena/receipts` | `Receipts.tsx` | AI Studio `ReceiptsView` |
| `/athena/n8n` | `N8nIntegration.tsx` | AI Studio `N8nIntegrationView` |
| `/athena/form-filler/:jobId` | `FormFillerModal.tsx` (modal) | AI Studio `FormFillerView` |
| `/athena/profile` | `ApplicantProfile.tsx` | AI Studio `ApplicantProfileView` (enhanced) |

- [ ] Routes added to `frontend/src/App.tsx` router
- [ ] Navigation links in `AthenaLayout.tsx` sidebar
- [ ] API client functions in `frontend/src/lib/athena/api.ts` for all new endpoints
- [ ] **Validation:** `pnpm run build` + `pnpm run test` clean

---

## Phase 7 — Backend Services (Preservation)

- [ ] **NO CHANGES** to: `store.py`, `scheduler/jobs.py`, `scrapers/*.py`, `ats/`, `matching/`, `automation/`, `documents/generator.py` (DOCX path)
- [ ] Verify existing tests still pass
- [ ] **Validation:** `uv run pytest backend/tests` — all pass

---

## Phase 8 — API Endpoints (New AI Router)

`backend/src/athena/api/ai_routes.py` — all endpoints require `X-API-Key` (mutating) or public (GET health):

- [ ] `GET /api/v1/athena/ai/health` — provider status, key presence
- [ ] `POST /api/v1/athena/ai/score-ats` — Gemini ATS scoring + fallback
- [ ] `POST /api/v1/athena/ai/tailor-resume` — Resume (1/2-col) + fallback
- [ ] `POST /api/v1/athena/ai/tailor-document` — Cover letter / Proposal / Exec Summary + fallback
- [ ] `POST /api/v1/athena/ai/dehumanize` — Dehumanizer + fallback
- [ ] `POST /api/v1/athena/ai/scrape-live` — AI synthesis + curated fallback (DEPRECATED but kept for parity)
- [ ] `POST /api/v1/athena/ai/n8n/dispatch` — n8n webhook dispatcher
- [ ] `POST /api/v1/athena/ai/submit-application` — Receipt generation + signature validation
- [ ] All prompts ported verbatim from AI Studio `server.ts` with version headers
- [ ] **Validation:** `mypy` + `ruff` + manual curl tests

---

## Phase 9 — AI Providers

- [ ] `GeminiProvider` uses `@google/genai` SDK, `gemini-3.8-flash` model (configurable via env)
- [ ] `FallbackProvider` implements all methods deterministically (port from AI Studio fallbacks)
- [ ] Factory selects provider via `ATHENA_AI_PROVIDER` env
- [ ] `GEMINI_API_KEY` read server-side only, never exposed to frontend
- [ ] **Validation:** Unit tests for each provider method (mocked)

---

## Phase 10 — Agents & Orchestration

- [ ] Scheduler unchanged (OpenCode APScheduler) — `KEEP_EXISTING`
- [ ] n8n dispatcher endpoint wired (new)
- [ ] Sign-off gate: Frontend modal → `/api/v1/athena/ai/submit-application` → receipt
- [ ] Right sidebar automation controls → update `AutomationSettings` in backend (new endpoint or reuse profile settings)
- [ ] 4h Cron countdown UI reads from scheduler status endpoint (new or existing)
- [ ] **Validation:** Manual test — scheduler runs, sign-off works, n8n tester responds

---

## Phase 11 — Data Models

- [ ] `status_mapping.py` — explicit `PipelineStatus ↔ JobStatus` dict + conversion functions
- [ ] `ai_studio.py` adapter — `Opportunity ↔ Job`, `ApplicationReceipt ↔ Application.receipt_data`
- [ ] Migration script (if needed) for existing data — **document only, don't run yet**
- [ ] **Validation:** Type checks pass, adapter tests pass

---

## Phase 12 — Authentication

- [ ] New AI endpoints: `GET /health` public, all `POST` require `X-API-Key`
- [ ] Rate limiting applied (existing middleware)
- [ ] CORS origins unchanged
- [ ] CSP/HSTS headers unchanged
- [ ] **Validation:** `curl` tests — 401 without key, 200 with valid key

---

## Phase 13 — External Integrations

- [ ] n8n webhook URL configurable via env + frontend settings
- [ ] n8n dispatcher stub returns execution receipt (port from AI Studio)
- [ ] Future provider hooks documented in `AI_PROVIDER_INTEGRATION.md` (create if needed)
- [ ] **Validation:** n8n tester in UI returns valid JSON response

---

## Phase 14 — Tests

### Backend (pytest)
- [ ] `test_ai_routes.py` — all 8 endpoints (happy path + fallbacks + auth)
- [ ] `test_ai_providers.py` — GeminiProvider (mocked), FallbackProvider
- [ ] `test_status_mapping.py` — PipelineStatus ↔ JobStatus conversions
- [ ] `test_adapters.py` — Opportunity ↔ Job, Receipt mapping

### Frontend (vitest)
- [ ] `DocumentStudio.test.tsx` — render, regenerate, print, copy, layout switch
- [ ] `Receipts.test.tsx` — render, select receipt, follow-up draft, copy
- [ ] `FormFillerModal.test.tsx` — validation, signature requirement, submit
- [ ] `N8nIntegration.test.tsx` — payload edit, trigger, response display
- [ ] `api.test.ts` — new AI client functions

### E2E (Playwright) — Critical Flows
- [ ] Scrape → Score → Tailor → Sign-off → Receipt
- [ ] Document Studio: regenerate, layout switch, dehumanize toggle, print
- [ ] Receipts: view certificate, generate follow-up, copy
- [ ] n8n: trigger webhook, view response

- [ ] **Validation:** All test suites pass

---

## Phase 15 — Deployment

- [ ] `backend/Dockerfile` — installs `google-genai`, copies AI router
- [ ] `frontend/Dockerfile` — no changes needed
- [ ] `docker-compose.yml` — backend env includes `GEMINI_API_KEY`, `ATHENA_AI_PROVIDER`, `ATHENA_N8N_WEBHOOK_URL`
- [ ] `deploy/oci-deploy.sh` — no changes needed (env handled by target)
- [ ] `.github/workflows/ci.yml` — no changes needed (runs same commands)
- [ ] **Validation:** `docker-compose build` + `docker-compose up -d` → health checks pass

---

## Phase 16 — Final Cleanup (Only After All Above ✅)

- [ ] Remove duplicate components (if any)
- [ ] Remove duplicate services (if any)
- [ ] Remove obsolete API endpoints (if any)
- [ ] Remove unused dependencies
- [ ] Remove temporary integration code
- [ ] Consolidate configuration (single `.env.example`, single `docker-compose.yml`)
- [ ] Consolidate documentation (update `README.md`, `ARCHITECTURE.md`)
- [ ] **Validation:** Full test suite passes after cleanup

---

## Final Audit

- [ ] `docs/integration/FINAL_INTEGRATION_REPORT.md` complete
- [ ] All checklist items ✅ or documented exception
- [ ] No secrets committed
- [ ] Branch `integration/athena-ai-studio` up to date with `main` (rebased/merged)
- [ ] PR created against `main` with summary
- [ ] Human review requested