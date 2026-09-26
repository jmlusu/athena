# Athena — Dual-Implementation Comparison (AI Studio vs. OpenCode Repository)

**Side A — AI Studio export:** `C:\Users\jmlus\Downloads\athena-ai-studio-integration` (29 files, not a git repo)
**Side B — Canonical OpenCode repository:** `https://github.com/jmlus/athena` → `C:\Users\jmlus\athena` (git; `main` @ `31ff287`)

This document is read-only analysis. Nothing was deleted, moved, or overwritten in either project. Detailed inventory of Side A: [`AI_STUDIO_INVENTORY.md`](./AI_STUDIO_INVENTORY.md).

---

## 0. Executive Picture

| | AI Studio | OpenCode (canonical) |
|---|---|---|
| Shape | Single-process React SPA + Express BFF | pnpm monorepo: FastAPI backend + React frontend + Docker/CI |
| LOC / files | 29 files, ~110 KB src, 644-line server | ~90 source/config files across `backend/`, `frontend/`, `deploy/`, `profile/` |
| Real AI | ✅ Gemini (`gemini-3.8-flash`) server-side | ❌ no LLM SDK wired; embeddings only (`all-MiniLM-L6-v2`); optional humanizer LLM path is broken |
| Real data | ❌ mock seed + in-memory state, no persistence | ✅ JSONL store with filelock + on-disk documents/embeddings cache |
| Real scraping | ❌ LLM-synthesized / canned listings | ✅ 14 scrapers (httpx + Playwright) |
| Real submission | ⚠️ UI sign-off + receipt stub (no browser) | ⚠️ Playwright submitter exists but is unwired and currently fails to import |
| Tests / CI / deploy | ❌ none | ✅ pytest + vitest + GitHub Actions + docker-compose + OCI deploy script |

**Net:** the two implementations are complementary rather than forked — AI Studio owns *generative document quality + a finished sign-off/receipt UX*, OpenCode owns *data, scraping, scoring, security, tests and operations*. Neither is a strict superset.

---

## 1. Capability Ownership Matrix

Legend for **Owner**: `AI Studio` (only there or clearly better there) · `OpenCode` (only there or clearly better there) · `Both` (parallel implementations) · `Neither` (declared but not functional in either).

| # | Capability | AI Studio | OpenCode | Owner | Evidence |
|---|---|---|---|---|---|
| 1 | App shell & navigation | Sidebar view-switch SPA, 7 views, no URL router (`App.tsx:52,238-318`) | `react-router` 7 routes under `AthenaLayout`, error boundaries (`frontend/src/App.tsx:21-36`) | **OpenCode** (real URLs, error routes) | AI Studio has no router dep |
| 2 | Job detail view | Full-screen modal `OpportunityDetailModal` | Dedicated route `/jobs/:id` + modal (`JobDetail.tsx`, `JobList.tsx`) | **Both** | see §3 |
| 3 | Kanban pipeline board | 7-stage `PipelineStatus` incl. `awaiting_signoff` (`PipelineView.tsx`) | 7 of 10 `JobStatus` columns, drag-drop w/ (currently commented-out) persistence (`Dashboard.tsx`, `PipelineColumn.tsx`) | **Both** — different state models | see §3 |
| 4 | ATS scoring | Gemini prompt → JSON score, tiers ≥90/80–89/<80 (`server.ts:41-111`) — **endpoint never called by UI** | Heuristic `ATSScorer` 40/35/15/10 weights + `GET /score/{job}/{profile}`, consumed by `JobDetail.tsx:53` | **OpenCode** (actually wired end-to-end) | AI Studio scores come from mock/synthesized data |
| 5 | Semantic matching / embeddings | — | `sentence-transformers` `all-MiniLM-L6-v2`, cosine cache, `POST /match`, tiers | **OpenCode** | AI Studio has no embeddings |
| 6 | Resume generation | Gemini JSON → 1-col/2-col HTML print layout (`server.ts:114-242`, `DocumentStudioView.tsx`) | `python-docx` DOCX (+ optional PDF) via `POST /jobs/{id}/tailor-resume` → file on disk | **Both** — AI Studio owns *format/quality*, OpenCode owns *file artifacts* | see §3 |
| 7 | Cover letter / proposal / exec summary | Gemini for 3 doc types incl. 4-part consultancy proposal (`server.ts:245-357`) | Cover letter only (`POST /jobs/{id}/cover-letter`); no proposal/exec-summary | **AI Studio** (broader doc coverage) | `routes.py:298` |
| 8 | "Dehumanize" AI-tell removal | Gemini endpoint + per-request prompt rules + UI toggle (`server.ts:360-412`, `RightSidebar.tsx:116-136`) | `documents/humanizer.py` prompt constants + regex fallback; external LLM path always `ImportError` (`ai_company` absent) | **AI Studio** (functional path) | OpenCode's LLM branch is inert |
| 9 | Job discovery / scraping | Gemini-synthesized listings + 6 hard-coded fallbacks (`server.ts:415-568`) | 14 scrapers: LinkedIn, Indeed, Glassdoor, RemoteOK, WWR, Remote.co, 3 Malawi boards, 5 freelance boards (`scrapers/*.py`) | **OpenCode** (real HTTP/Playwright) | AI Studio makes zero outbound listing calls |
| 10 | Scheduled background work | Client-side 4h countdown + toast only (`App.tsx:72-112`) | APScheduler: scrape 4h, process 30m, cleanup daily; `start/stop/status` endpoints (`scheduler/jobs.py`) | **OpenCode** | AI Studio cron resets a counter, no request |
| 11 | n8n orchestration | UI topology + payload tester + stub dispatcher (`N8nIntegrationView.tsx`, `server.ts:571-592`) | — | **AI Studio** (only n8n presence anywhere) | but broken: client posts `/api/webhooks/n8n`, server defines `/api/n8n/dispatch-webhook` |
| 12 | Human sign-off / HITL gate | Checkbox + typed legal signature, enforced client *and* server (`FormFillerView.tsx:66-75`, `server.ts:598-600`) | `LocalApprovalGate` writes/reads `<data>/approvals/*.json`, 30-min timeout (`automation/submitter.py:31-97`) — module not importable, not routed | **AI Studio** (only working gate) | see §4 for defect detail |
| 13 | Application submission | Receipt-only simulation (`POST /api/submit-application`) | 7-stage browser submitter (Playwright) — unwired | **Neither** is fully real; AI Studio owns the *contract*, OpenCode owns the *machinery* | `submitter.py:172` NameError |
| 14 | Receipts & follow-up ledger | Receipt certificate UI, confirmation hash, 7-day follow-up + generated email draft (`ReceiptsView.tsx`) | `Application.receipt_data` / `follow_up_dates` fields exist; no UI, no generator | **AI Studio** | `models/jobs.py:103` |
| 15 | Form auto-fill | In-app field composer (identity, rates, screening answers) (`FormFillerView.tsx:182-282`) | `automation/form_filler.py` — ATS platform detection (Greenhouse/Lever/Workday/iCIMS…), multi-step forms | **OpenCode** (real engine) vs AI Studio (real UX) | split ownership |
| 16 | Persistence | — (React state only, resets on reload) | JSONL `jobs/applications/user_profiles/scrape_jobs` + `filelock` + docs + embedding cache | **OpenCode** | `store.py` |
| 17 | AuthN/AuthZ | None (except applicant sign-off) | `X-API-Key` on mutating methods, fail-closed, rate limit 100/min, CORS allowlist, CSP/HSTS headers | **OpenCode** | `api/app.py:289-301` |
| 18 | Profiles | Single editable dossier view, client state (`ApplicantProfileView.tsx`) | CRUD `/profiles` + `/profiles/email/{email}`, multi-profile `Settings.tsx` page | **OpenCode** | |
| 19 | Dashboard & analytics | Custom SVG mountain chart, KPI/bar chart, circular gauges (no chart lib) | recharts area/radial charts, KPI cards, match-tier bars (`Dashboard.tsx`) | **Both** (see §3) | |
| 20 | Document editor page | Document Studio with LLM regenerate, print, copy-markdown | `DocumentEditor.tsx` — simulated generate/humanize (`setTimeout` + templates), no API calls | **AI Studio** | |
| 21 | Settings page | Right-sidebar automation toggles (non-persisted) | Full profile form + re-score action (`Settings.tsx`) | **OpenCode** | |
| 22 | Document file export | Browser print → PDF; clipboard markdown | DOCX (python-docx) + optional PDF (WeasyPrint **not installed**) | **OpenCode** for DOCX; PDF broken on both | `generator.py:905-928` |
| 23 | Tests | — | 5 pytest files (~17 tests) + 2 vitest files (23 tests) | **OpenCode** | |
| 24 | CI | — | `ci.yml`: ruff format, pytest, lint-debt advisory, lint/test/build, docker builds | **OpenCode** | |
| 25 | Deployment | AI Studio / Cloud Run managed; `metadata.json` capability flag | Dockerfiles ×2, docker-compose (8520/8530), nginx proxy, `deploy/oci-deploy.sh`, `deploy.yml` SSH rollout | **Both** — different targets | |
| 26 | LLM API key handling | `GEMINI_API_KEY` server-side only, never in bundle | no LLM key exists at all | **AI Studio** | |
| 27 | Documentation | Brand/architecture spec v2.4.0, `.env.example` | `README.md`, `ARCHITECTURE.md`, `dual_environment_compatibility_standard.md`, `profile/` corpus | **OpenCode** (breadth) | |
| 28 | Applicant profile corpus | Hard-coded persona "Chifuniro Phiri" in `mockData.ts` | `profile/*.md` + 18 certificate PDFs in `.media/` + embeddings cache | **OpenCode** | |

---

## 2. Features in AI Studio That Do NOT Exist in the OpenCode Repository

1. **Server-side Gemini integration** — `@google/genai` with 5 prompt endpoints (`/api/ai/score-ats`, `tailor-resume`, `tailor-document`, `dehumanize`, `scrape-live`) and deterministic fallbacks when the key is missing (`server.ts`). The canonical repo has **no LLM SDK and no AI provider key at all**.
2. **"Dehumanizer" product feature** as a user-facing toggle + standalone endpoint with banned-word prompt rules (`server.ts:360-412`, `RightSidebar.tsx:116-136`). OpenCode has a `humanizer` module but no UI control and no working LLM path.
3. **n8n workflow integration** — dedicated view, visual node topology, payload tester, stub dispatcher (`N8nIntegrationView.tsx`, `server.ts:571`). OpenCode contains zero n8n references.
4. **Receipts & Follow-Up Ledger view** — receipt certificate, cryptographic confirmation hash display, 7-day follow-up scheduling and a generated, copyable follow-up email draft (`ReceiptsView.tsx`). OpenCode only has unused data fields.
5. **Consultancy proposal + executive summary document types** — 4-section technical/financial proposal generator for consultancies (`server.ts:252-283`). OpenCode generates resumes and cover letters only.
6. **Human sign-off gate that actually runs end-to-end** — mandatory authorization checkbox + typed legal signature enforced in the client and rejected server-side without it (`FormFillerView.tsx`, `server.ts:598-600`). OpenCode's gate is in an unimportable module.
7. **1-column / 2-column resume layout switching + print-optimized CSS** (`DocumentStudioView.tsx:41`, `index.css:35-54`). OpenCode emits fixed-template DOCX.
8. **Opportunity scope taxonomy** — `lilongwe-local | lilongwe-remote | international-remote` with left-rail scope filters and category (job vs consultancy) filters (`LeftSidebar.tsx:88-175`). OpenCode filters by source/type/location instead.
9. **Dual 4-hour cron countdown widgets** (jobs + consultancies) with a manual "Execute 4h Cycle Now" button (`LeftSidebar.tsx:215-275`). OpenCode has a scheduler but no countdown UI.
10. **Form filler with Malawi-specific compensation/work-authorization fields** and screening-answer drafting (`FormFillerView.tsx:33-54`) — e.g. MWK monthly vs USD/day rate logic by category.
11. **Layered mountain area chart + bespoke KPI/bar chart** hand-built in SVG (no chart dependency) (`LayeredMountainChart.tsx`, `MetricsAndBarChart.tsx`).
12. **Brand system**: Cinzel / Plus Jakarta Sans / Lora typography, tokenized palette, `ATHENA` wordmark, spec document (`docs/ATHENA_ARCHITECTURE_AND_BRANDING.md`). OpenCode uses a skeuomorphic dark/amber utility theme with no written brand spec.
13. **AI Studio platform integration**: `metadata.json` capability manifest, `DISABLE_HMR` agent-edit guard, `APP_URL` env convention, server-side key injection.
14. **Single-binary deployment path** (`vite build` + esbuild `dist/server.cjs`) — one process serves API and SPA.

---

## 3. Features in the OpenCode Repository That Do NOT Exist in AI Studio

1. **Real multi-source scraping** — 14 registered scrapers with rate limiting and Playwright fallback (`scrapers/base.py`, `remote.py`, `lilongwe.py`, `consultancy.py`); `POST /api/v1/athena/scrape` + `/scrape/history`.
2. **Semantic embedding matching** — `all-MiniLM-L6-v2`, `.npy` cache, cosine ranking, `POST /match`, match tiers (`matching/embeddings.py`, `matching/engine.py`).
3. **Heuristic ATS scorer with a scored breakdown** — keyword/semantic/experience/education sub-scores + `should_auto_apply` / `should_flag_for_review` (`ats/scorer.py`, `GET /score/{job}/{profile}`).
4. **Persistence layer** — JSONL stores with `filelock`, upsert-by-`source_job_id` dedupe, generated document files, audit trail (`store.py`, `paths.py`).
5. **Full REST API** — 28 endpoints under `/api/v1/athena` (jobs CRUD + apply/tailor/cover-letter/flag, profiles, applications, scrape, process, match, score, stats, scheduler control) with OpenAPI `/docs`.
6. **Security stack** — `X-API-Key` guard on mutating methods (fail-closed), per-IP rate limiting, CORS allowlist, CSP/HSTS/security headers, loopback restriction for `open` auth mode (`api/app.py`).
7. **Real background scheduler** — APScheduler jobs (4h scrape / 30m process / 1d cleanup), auto-start flag, `start/stop/status` endpoints.
8. **Browser automation package** — `AthenaBrowser` (Playwright, stealth, session, audit/screenshot), `FormFiller` with ATS platform detection, `ApplicationSubmitter` 7-stage workflow with file-based approval gate (`automation/`).
9. **DOCX document generation** with real templates (`documents/templates/*.docx`, `python-docx`) and resume/PDF parsing (`documents/parser.py`).
10. **Routing & error handling** — `react-router` with `errorElement`, `/jobs/:id` detail route, catch-all redirect.
11. **Testing** — `backend/tests/*` (pytest, ~17 tests), `frontend/src/lib/athena/*.test.ts` (vitest, 23 tests), run in CI.
12. **CI/CD** — `.github/workflows/ci.yml` (format check, pytest, typecheck, tests, build, docker build) and `deploy.yml` (SSH → OCI), `dependabot.yml` for github-actions/npm/pip.
13. **Containerization & hosting** — `backend/Dockerfile` (uv + Playwright Chromium), `frontend/Dockerfile` + nginx reverse proxy to `http://backend:8000`, `docker-compose.yml` with healthcheck and volumes, `deploy/oci-deploy.sh`.
14. **Application/job CRUD surface in UI** — Apply / Tailor / Cover Letter / Flag actions in `JobList` + `JobDetail`, pagination, debounced search, advanced filter panel.
15. **Multi-profile management + Settings page** with re-scoring trigger.
16. **Monorepo tooling & governance** — pnpm workspace, Corepack enforcement, `.gitattributes` merge drivers for lockfiles, `scripts/setup-git-hooks.sh`, `dual_environment_compatibility_standard.md`.
17. **Domain corpus** — `profile/*.md` (resume, education, certifications, publications, ATS keywords) and 18 credential PDFs in `.media/`.
18. **Pipeline statistics endpoints & UI** — `GET /stats/pipeline`, `GET /stats/scraping`.

---

## 4. Files That Implement the Same Functionality Differently

Pairings of conceptually identical features. Nothing was reconciled — this is a map for a future, deliberate merge.

| Capability | AI Studio implementation | OpenCode implementation | Divergence |
|---|---|---|---|
| **ATS scoring** | `server.ts:41-111` — LLM prompt returning a single 0–100 score + category; **no caller** | `backend/src/athena/ats/scorer.py` + `ats/keywords.py` — deterministic weighted score with 4 sub-scores, exposed at `routes.py:390`, consumed by `JobDetail.tsx:53` | Generative vs heuristic; AI Studio's is orphaned |
| **Resume tailoring** | `server.ts:114-242` + `DocumentStudioView.tsx` → JSON → HTML, print to PDF | `routes.py:283` → `documents/generator.py` → `.docx` file on disk | JSON/HTML vs DOCX; different field schemas |
| **Cover letter** | `server.ts:245-357` (`tailor-document`) | `routes.py:298` (`/jobs/{id}/cover-letter`) | Same intent, different payload/response shape |
| **Humanization** | `server.ts:360-412` live Gemini endpoint + `dehumanize` flag inside other prompts | `documents/humanizer.py` (prompt constants + regex fallback; LLM branch always ImportError) and `DocumentEditor.tsx:156-173` (client-side `String.replace` simulation) | Three different implementations of one idea |
| **Discovery / scraping** | `server.ts:415-568` Gemini list synthesis + 6 canned listings | `scrapers/*.py` real HTTP/Playwright + `routes.py:328` | Simulated vs real; **same user-facing verb ("scrape")** |
| **Cron / scheduling** | `App.tsx:72-112` + `LeftSidebar.tsx:215-275` (client countdown) | `scheduler/jobs.py` + `routes.py:477-501` (APScheduler + control API) | UI-only vs server-side; both advertise "4 hours" |
| **Sign-off / HITL gate** | `FormFillerView.tsx:66-75,306-347` + `server.ts:598-600` (checkbox + typed signature) | `automation/submitter.py:31-97,277-347` (approval file gate, 30-min timeout) | UX gate vs process gate; OpenCode's unreachable |
| **Submission** | `server.ts:595-617` receipt generator (no real dispatch) | `automation/submitter.py` browser submission (not routed) | Both partial |
| **Receipts** | `ReceiptsView.tsx` + `ApplicationReceipt` type | `Application.receipt_data`, `follow_up_dates` (`models/jobs.py`) | Rich UI vs empty fields |
| **n8n webhook** | Client `/api/webhooks/n8n` (`N8nIntegrationView.tsx:44`) vs server `/api/n8n/dispatch-webhook` (`server.ts:571`) — **mismatch** | absent | Single-sided |
| **Pipeline state model** | `PipelineStatus` ×7: `discovered, evaluated, tailored, awaiting_signoff, submitted, interview, offer` (`types.ts:4-11`) | `JobStatus` ×10: `new, fetched, matched, scored, applied, flagged, interview, offer, rejected, archived` (`models/enums.py:33-43`) | Only `interview`/`offer` overlap; no mapping table exists |
| **Opportunity/Job type** | `Opportunity` (`src/types.ts:28-58`) — `atsScore`, `scope`, `platform`, `dehumanizedPitch`, embedded tailored docs & receipt | `Job` (`backend/src/athena/models/jobs.py:72`) + mirrored `frontend/src/lib/athena/types.ts:122` — `application_url`, `match_score`, `match_tier`, `metadata`, `scraped_at` | Different keys for the same entity; would need an adapter |
| **Applicant profile** | `ApplicantProfile` (`types.ts:60-84`), mock persona, single record | `UserProfile` (`models/jobs.py:123`) + `profile/*.md` corpus + multi-profile API | Fictional persona vs real corpus |
| **Type definitions** | `src/types.ts` (11 types, one file) | `frontend/src/lib/athena/types.ts` (310 L) **and** `backend/src/athena/models/*.py` **and** `api/schemas.py` (21 Pydantic classes) | 3-way duplication in OpenCode vs 1-way in AI Studio |
| **App shell / nav** | `LeftSidebar` + `RightSidebar` + view switch (`App.tsx`) | `AthenaLayout` + `react-router` + `RouteError` | Static sidebar pair vs routed shell |
| **Charts** | `LayeredMountainChart`, `MetricsAndBarChart`, `CircularGauge` (hand-rolled SVG) | `AreaChart.tsx` (`AreaChart`, `MountainAreaChart`, `CircularGaugeChart`), `ATSGauge.tsx` (recharts) | Near-identical chart *concepts* with different names/implementations; several OpenCode exports are never rendered |
| **Seed/fixture data** | `src/data/mockData.ts` (opportunities + profile + settings + cron) | `company/athena/*.jsonl` (live store) + `profile/*.md` | Fixture vs production data |
| **Env example** | `.env.example`: `GEMINI_API_KEY`, `APP_URL` | root `.env.example`: 15 `ATHENA_*` + 2 `VITE_*` vars | No key overlap |
| **Server bootstrap** | `server.ts` Express: port 3000, Vite middleware / static dist | `api/server.py` uvicorn launcher + `api/app.py` factory; port 8000 (Docker) / 1111 (frontend dev) | Same "one process serves app + API" intent, different stack |
| **Health check** | `GET /api/health` (`server.ts:32`) | `GET /health` (`app.py:317`) + compose healthcheck | Different paths |
| **Quality gate** | `npm run lint` = `tsc --noEmit` | `pnpm lint` = `tsc --noEmit` + `ruff format --check` + advisory ruff/mypy | Same name, different strength |

---

## 5. Known Defects Observed (for the record)

**AI Studio side**
- Client/server n8n route mismatch (`/api/webhooks/n8n` vs `/api/n8n/dispatch-webhook`) → tester always errors.
- `/api/ai/score-ats` and `/api/ai/dehumanize` are unreachable dead endpoints.
- `npm start` does not set `NODE_ENV=production`, so `server.ts:621` would still boot the dev branch.
- `package.json` name is still `react-example`; `bun.lock` is empty; `motion` and `Type` imports unused.
- Zero tests, zero persistence (state lost on reload).

**OpenCode side**
- `import athena.automation` raises `NameError: SubmissionStage` (`automation/submitter.py:172`) — browser submitter unusable.
- External LLM path (`ATHENA_LLM_PROVIDER`) requires a non-existent `ai_company` package → always falls back to regex templates.
- `weasyprint` / `pdfplumber` not installed → PDF generation and PDF parsing unavailable.
- Dashboard kanban `updateJob` call is commented out → drag-drop changes are not persisted (`Dashboard.tsx:110`).
- `JobDetail` navigates to non-existent `/athena/jobs` (`JobDetail.tsx:83,165`).
- API key embedded in the frontend bundle; no auth on GET endpoints.

---

## 6. Non-Destructive Merge Guidance

Both trees remain untouched. If integration is attempted later, the lowest-risk seams are:

1. **Keep OpenCode as the system of record** (store, API, auth, scheduler, scrapers, tests, deploy).
2. **Port AI Studio's Gemini endpoints** as a new FastAPI router (e.g. `/api/v1/athena/ai/*`) — the prompt set in `server.ts` is the AI Studio project's highest-value asset and has no OpenCode equivalent.
3. **Port the Document Studio + Receipts + Sign-Off views** as frontend routes; they render against data OpenCode already models (`Application.receipt_data`, `follow_up_dates`, `should_auto_apply`).
4. **Reconcile the status enums** before any data merge: define an explicit `PipelineStatus ↔ JobStatus` mapping (they share only `interview`/`offer`).
5. **Do not port** AI Studio's mock scraper, client-side cron, or n8n stub as-is — they are simulations of capabilities OpenCode implements for real (except n8n, which OpenCode lacks entirely).
6. Follow `dual_environment_compatibility_standard.md` (Corepack/pnpm, `.gitattributes` lockfile merge drivers, environment-aware host/CSP) before adding any AI Studio-derived Node code to the monorepo.
