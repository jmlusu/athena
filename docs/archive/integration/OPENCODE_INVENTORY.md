# Athena — OpenCode Canonical Repository Forensic Inventory

**Subject:** `C:\Users\jmlus\athena` (git repo, `main` @ `f299484`)  
**Canonical Repository:** <https://github.com/jmlus/athena>  
**Method:** Read-only static analysis. No files modified.  
**Inventory Date:** 2026-09-26

---

## 1. Architecture

### 1.1 Process Layout
- **Monorepo:** pnpm workspace with two packages:
  - `backend/` — FastAPI application (Python 3.12+)
  - `frontend/` — React 19 + Vite SPA (TypeScript)
- **Communication:** Frontend (port 8530, nginx) → Backend (port 8000, FastAPI) via `/api/v1/athena/*`
- **Reverse Proxy:** `frontend/nginx.conf` proxies `/api/` to `http://backend:8000`
- **Docker Compose:** 3 services — `backend`, `frontend` (nginx), `redis` (not used by app, present in compose)

### 1.2 Entry Points
| Component | Entry Point | File:Line |
|-----------|-------------|-----------|
| Backend API | `uvicorn athena.api.server:app` | `backend/src/athena/api/server.py:1` |
| Backend CLI | `python -m athena.api.server` | `backend/src/athena/api/server.py:324` |
| Frontend Dev | `vite` | `frontend/package.json:12` |
| Frontend Build | `tsc --noEmit && vite build` | `frontend/package.json:13` |
| Frontend Preview | `vite preview` | `frontend/package.json:16` |

### 1.3 Ports & Networking
| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| Backend (FastAPI) | 8000 | 8000 (compose) / 1111 (dev) | HTTP |
| Frontend (nginx) | 80 | 8530 (compose) / 8530 (dev) | HTTP |
| Frontend (Vite dev) | 5173 | 5173 | HTTP + HMR |

### 1.4 Docker / Compose Wiring
- `docker-compose.yml:1-60` — defines `backend`, `frontend`, `redis` services
- `backend/Dockerfile:1-45` — uv + Playwright Chromium, non-root user
- `frontend/Dockerfile:1-28` — node:22-alpine, nginx, multi-stage
- `frontend/nginx.conf:1-42` — `/api/` → `http://backend:8000`, SPA fallback

---

## 2. Frameworks & Runtimes

| Layer | Technology | Version | Config File |
|-------|------------|---------|-------------|
| Backend Language | Python | 3.12+ (requires) | `pyproject.toml:6` |
| Backend Framework | FastAPI | 0.115+ | `pyproject.toml:8` |
| Backend Server | Uvicorn | 0.32+ | `pyproject.toml:9` |
| Backend Scheduler | APScheduler | 3.10+ | `pyproject.toml:13` |
| Backend HTTP Client | httpx | 0.28+ | `pyproject.toml:14` |
| Backend HTML Parsing | beautifulsoup4 + lxml | 4.12+ / 5.2+ | `pyproject.toml:15-16` |
| Backend Docs | python-docx | 1.1+ | `pyproject.toml:17` |
| Backend Concurrency | filelock | 3.16+ | `pyproject.toml:18` |
| Backend Env | python-dotenv | 1.0+ | `pyproject.toml:19` |
| Backend Logging | structlog | 25.1+ | `pyproject.toml:20` |
| Backend Validation | email-validator | 2.2+ | `pyproject.toml:21` |
| Backend ML | numpy + sentence-transformers | 2.5+ / 3.0+ | `pyproject.toml:22-23` |
| Backend Browser | Playwright | 1.63+ | `pyproject.toml:24` |
| Frontend Language | TypeScript | 7.0.2 | `frontend/tsconfig.json:3` |
| Frontend Framework | React | 19.3.0 | `frontend/package.json:23` |
| Frontend Router | react-router-dom | 7.18.3 | `frontend/package.json:25` |
| Frontend Build | Vite | 6.1.0 | `frontend/vite.config.ts:1` |
| Frontend CSS | Tailwind CSS | 4.0.0 | `frontend/vite.config.ts:4` |
| Frontend Charts | recharts | 3.10.1 | `frontend/package.json:26` |
| Frontend Animation | framer-motion + motion | 13.4.0 / 12.4.7 | `frontend/package.json:20,22` |
| Frontend Icons | lucide-react | 1.47.0 | `frontend/package.json:21` |
| Package Manager | pnpm | 9.15.0 | `package.json:8`, `pnpm-workspace.yaml` |
| Python Package Manager | uv | 0.12.5 | `backend/uv.lock` |

---

## 3. Dependencies

### 3.1 Backend (pyproject.toml)
**Production Dependencies (27):**
```
fastapi>=0.115.0, uvicorn[standard]>=0.32.0, pydantic>=2.10.0,
pydantic-settings>=2.6.0, python-multipart>=0.0.9, apscheduler>=3.10.0,
httpx>=0.28.1, beautifulsoup4>=4.12.0, lxml>=5.2.0, python-docx>=1.1.0,
filelock>=3.16.0, python-dotenv>=1.0.0, structlog>=25.1.0,
email-validator>=2.2.0, numpy>=2.5.3, sentence-transformers>=3.0.0,
playwright>=1.63.0
```

**Dev Dependencies (6):**
```
pytest>=9.1.1, pytest-asyncio>=0.24.0, pytest-cov>=6.0.0,
ruff>=0.8.0, mypy>=1.13.0, types-requests>=2.32.0
```

### 3.2 Frontend (package.json)
**Production Dependencies (10):**
```
clsx@^2.1.1, framer-motion@^13.4.0, lucide-react@^1.47.0,
motion@^12.4.7, react@^19.3.0, react-dom@^19.3.0,
react-router-dom@^7.18.3, recharts@^3.10.1, tailwind-merge@^3.0.1
```

**Dev Dependencies (12):**
```
@tailwindcss/vite@^4.0.0, @testing-library/jest-dom@^7.0.1,
@types/node@^22.13.4, @types/react@^19.3.0, @types/react-dom@^19.3.0,
@vitejs/plugin-react@^5.2.0, jsdom@^30.0.1, tailwindcss@^4.0.0,
typescript@^7.0.2, vite@^6.1.0, vitest@^5.0.0
```

### 3.3 Root Workspace
- `pnpm-workspace.yaml:3` — packages: `frontend`, `backend` (but backend is Python, so only frontend in pnpm)
- `package.json:8` — packageManager: `pnpm@9.15.0` enforced via Corepack
- `.npmrc:1` — `engine-strict=true`

---

## 4. Routes

### 4.1 Backend HTTP Endpoints (FastAPI Router: `/api/v1/athena`)

All endpoints in `backend/src/athena/api/routes.py` under `router = APIRouter(tags=["athena"])`:

| Method | Path | Handler | Purpose | File:Line |
|--------|------|---------|---------|-----------|
| POST | `/jobs` | `create_job` | Create job entry | routes.py:49 |
| GET | `/jobs` | `list_jobs` | List jobs with filters | routes.py:56 |
| GET | `/jobs/{job_id}` | `get_job` | Get single job | routes.py:111 |
| PATCH | `/jobs/{job_id}` | `update_job` | Update job fields | routes.py:120 |
| DELETE | `/jobs/{job_id}` | `delete_job` | Delete job | routes.py:134 |
| POST | `/profiles` | `create_profile` | Create user profile | routes.py:143 |
| GET | `/profiles` | `list_profiles` | List all profiles | routes.py:150 |
| GET | `/profiles/{profile_id}` | `get_profile` | Get profile by ID | routes.py:157 |
| GET | `/profiles/email/{email}` | `get_profile_by_email` | Get profile by email | routes.py:166 |
| PATCH | `/profiles/{profile_id}` | `update_profile` | Update profile | routes.py:175 |
| POST | `/applications` | `create_application` | Create application | routes.py:191 |
| GET | `/applications` | `list_applications` | List applications | routes.py:206 |
| GET | `/applications/{app_id}` | `get_application` | Get application | routes.py:220 |
| PATCH | `/applications/{app_id}` | `update_application` | Update application | routes.py:229 |
| POST | `/jobs/{job_id}/apply` | `apply_to_job` | Apply with tailored resume | routes.py:262 |
| POST | `/jobs/{job_id}/tailor-resume` | `tailor_resume` | Generate tailored resume (DOCX/PDF) | routes.py:294 |
| POST | `/jobs/{job_id}/cover-letter` | `generate_job_cover_letter` | Generate cover letter (DOCX/PDF) | routes.py:309 |
| POST | `/jobs/{job_id}/flag` | `flag_job` | Flag job for review | routes.py:327 |
| POST | `/scrape` | `trigger_scrape` | Trigger scrape job | routes.py:342 |
| GET | `/scrape/history` | `get_scrape_history` | Scrape job history | routes.py:357 |
| POST | `/process` | `process_jobs` | Re-run matching/scoring | routes.py:365 |
| POST | `/match` | `match_jobs` | Match jobs against profile | routes.py:374 |
| GET | `/score/{job_id}/{profile_id}` | `get_ats_score` | ATS score breakdown | routes.py:404 |
| GET | `/stats/pipeline` | `get_pipeline_stats` | Pipeline statistics | routes.py:433 |
| GET | `/stats/scraping` | `get_scraping_stats` | Scraping statistics | routes.py:474 |
| POST | `/scheduler/start` | `start_scheduler` | Start APScheduler | routes.py:491 |
| POST | `/scheduler/stop` | `stop_scheduler` | Stop APScheduler | routes.py:499 |
| GET | `/scheduler/status` | `get_scheduler_status` | Scheduler status | routes.py:507 |

**Health Check:** `GET /health` at `app.py:317` (not under `/api/v1/athena`)

**OpenAPI Docs:** `/docs` (Swagger UI), `/redoc`, `/openapi.json`

### 4.2 Frontend Routes (react-router v7)

Defined in `frontend/src/App.tsx:21-36`:

| Path | Component | File:Line |
|------|-----------|-----------|
| `/` | Redirect → `/athena/dashboard` | App.tsx:28 |
| `/athena/dashboard` | `Dashboard` | App.tsx:29 |
| `/athena/jobs` | `JobList` | App.tsx:30 |
| `/athena/jobs/:id` | `JobDetail` | App.tsx:31 |
| `/athena/documents/:jobId` | `DocumentEditor` | App.tsx:32 |
| `/athena/settings` | `Settings` | App.tsx:33 |
| `*` | `RouteError` (catch-all) | App.tsx:35 |

---

## 5. Components

### 5.1 Frontend Components (`frontend/src/components/athena/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AthenaLayout` | `AthenaLayout.tsx:1` | Root layout with sidebar, header, outlet |
| `AreaChart` | `AreaChart.tsx:1` | Recharts area + mountain + radial charts |
| `ATSGauge` | `ATSGauge.tsx:1` | Recharts radial gauge for ATS score |
| `JobCard` | `JobCard.tsx:1` | Job list card with actions |
| `MetricCard` | `MetricCard.tsx:1` | KPI metric display |
| `PipelineColumn` | `PipelineColumn.tsx:1` | Kanban column (drag-drop, commented persist) |
| `RouteError` | `RouteError.tsx:1` | Error boundary fallback |
| `SkillTags` | `SkillTags.tsx:1` | Skill badge rendering |

### 5.2 Frontend Pages (`frontend/src/pages/athena/`)

| Page | File | Purpose |
|------|------|---------|
| `Dashboard` | `Dashboard.tsx:1` | Kanban pipeline + charts + stats |
| `JobList` | `JobList.tsx:1` | Paginated, filterable job table |
| `JobDetail` | `JobDetail.tsx:1` | Job detail + actions (apply/tailor/flag) |
| `DocumentEditor` | `DocumentEditor.tsx:1` | Resume/cover letter generator (simulated) |
| `Settings` | `Settings.tsx:1` | Profile CRUD + re-score trigger |

---

## 6. APIs (Frontend Client)

**File:** `frontend/src/lib/athena/api.ts` (12,602 bytes, ~350 lines)

| Function | Method | Path | Request/Response |
|----------|--------|------|------------------|
| `listJobs` | GET | `/jobs` | `JobFilter` → `JobListResponse` |
| `getJob` | GET | `/jobs/{id}` | → `JobResponse` |
| `createJob` | POST | `/jobs` | `JobCreate` → `JobResponse` |
| `updateJob` | PATCH | `/jobs/{id}` | `Partial<Job>` → `JobResponse` |
| `deleteJob` | DELETE | `/jobs/{id}` | → `{success: boolean}` |
| `listProfiles` | GET | `/profiles` | → `UserProfileResponse[]` |
| `getProfile` | GET | `/profiles/{id}` | → `UserProfileResponse` |
| `getProfileByEmail` | GET | `/profiles/email/{email}` | → `UserProfileResponse` |
| `createProfile` | POST | `/profiles` | `UserProfileCreate` → `UserProfileResponse` |
| `updateProfile` | PATCH | `/profiles/{id}` | `Partial<Profile>` → `UserProfileResponse` |
| `listApplications` | GET | `/applications` | filters → `ApplicationListResponse` |
| `getApplication` | GET | `/applications/{id}` | → `ApplicationResponse` |
| `createApplication` | POST | `/applications` | `ApplicationCreate` → `ApplicationResponse` |
| `applyToJob` | POST | `/jobs/{id}/apply` | `ApplyRequest` → `ApplicationResponse` |
| `tailorResume` | POST | `/jobs/{id}/tailor-resume` | `TailorResumeRequest` → `DocumentGenerateResponse` |
| `generateCoverLetter` | POST | `/jobs/{id}/cover-letter` | `CoverLetterRequest` → `DocumentGenerateResponse` |
| `flagJob` | POST | `/jobs/{id}/flag` | `FlagJobRequest?` → `JobResponse` |
| `triggerScrape` | POST | `/scrape` | `ScrapeJobRequest` → `ScrapeJobResponse` |
| `getScrapeHistory` | GET | `/scrape/history` | `limit?` → `ScrapeJobResponse[]` |
| `processJobs` | POST | `/process` | → `{status, total_jobs, scored}` |
| `matchJobs` | POST | `/match` | `MatchJobsRequest` → `MatchJobsResponse` |
| `getATSScore` | GET | `/score/{jobId}/{profileId}` | → `ATSScoreResponse` |
| `getPipelineStats` | GET | `/stats/pipeline` | → `PipelineStatsResponse` |
| `getScrapingStats` | GET | `/stats/scraping` | → `ScrapeStatsResponse` |
| `startScheduler` | POST | `/scheduler/start` | → `{status, running}` |
| `stopScheduler` | POST | `/scheduler/stop` | → `{status, running}` |
| `getSchedulerStatus` | GET | `/scheduler/status` | → `{running, jobs[]}` |

**Auth:** All requests include `X-API-Key` header from `VITE_ATHENA_API_KEY` (build-time constant)

---

## 7. Services (Backend Service Modules)

### 7.1 ATS Scoring (`backend/src/athena/ats/`)
| Module | File | Key Exports |
|--------|------|-------------|
| `keywords.py` | `ats/keywords.py:1` | `TECH_KEYWORDS`, `SENIORITY_KEYWORDS`, `extract_keywords()` |
| `scorer.py` | `ats/scorer.py:1` | `ATSScorer`, `score_resume_against_job()`, `get_score_tier()`, `should_auto_apply()`, `should_flag_for_review()` |
| `__init__.py` | `ats/__init__.py:1` | `ats_scorer` instance |

**Algorithm:** Weighted heuristic — keyword_match(40%) + semantic_similarity(35%) + experience_relevance(15%) + education_match(10%)

### 7.2 Semantic Matching (`backend/src/athena/matching/`)
| Module | File | Key Exports |
|--------|------|-------------|
| `embeddings.py` | `matching/embeddings.py:1` | `EmbeddingEngine`, `get_embedding()`, `cosine_similarity()`, `.npy` cache |
| `engine.py` | `matching/engine.py:1` | `MatchingEngine`, `rank_jobs()` |
| `__init__.py` | `matching/__init__.py:1` | `matching_engine` instance |

**Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim), cached as `.npy` files in `company/athena/embeddings_cache/`

### 7.3 Scrapers (`backend/src/athena/scrapers/`)
| Scraper | File | Target |
|---------|------|--------|
| `base.py` | `scrapers/base.py:1` | `BaseScraper` abstract class, rate limiting, retry |
| `remote.py` | `scrapers/remote.py:1` | LinkedIn, Indeed, Glassdoor, RemoteOK, WeWorkRemotely, Remote.co |
| `lilongwe.py` | `scrapers/lilongwe.py:1` | Malawi boards (MyJobo, MalawiJobs, etc.) |
| `consultancy.py` | `scrapers/consultancy.py:1` | Upwork, Devex, ReliefWeb, UN Jobs |
| `__init__.py` | `scrapers/__init__.py:1` | `SCRAPER_REGISTRY` (14 scrapers), `get_scraper()` |

**14 Scrapers Registered:** LinkedIn, Indeed, Glassdoor, RemoteOK, WWR, Remote.co, MyJobo, MalawiJobs, MalawiGov, UNJobs, ReliefWeb, Devex, Upwork, Freelancer

### 7.4 Documents (`backend/src/athena/documents/`)
| Module | File | Key Exports |
|--------|------|-------------|
| `generator.py` | `documents/generator.py:1` | `DocumentGenerator`, `generate_resume()`, `generate_cover_letter()`, DOCX templates |
| `humanizer.py` | `documents/humanizer.py:1` | `DEHUMANIZE_PROMPTS`, `humanize_text()` (regex fallback + broken LLM path) |
| `parser.py` | `documents/parser.py:1` | `parse_resume_pdf()`, `parse_resume_docx()` (pdfplumber not installed) |
| `templates/` | `documents/templates/` | `resume_template.docx`, `cover_letter_template.docx` |

**Output:** DOCX via `python-docx`; PDF via WeasyPrint (**not installed** — `generator.py:905-928`)

### 7.5 Automation (`backend/src/athena/automation/`)
| Module | File | Status |
|--------|------|--------|
| `browser.py` | `automation/browser.py:1` | `AthenaBrowser` (Playwright stealth, session, audit) — **functional** |
| `form_filler.py` | `automation/form_filler.py:1` | `FormFiller` (ATS platform detection: Greenhouse/Lever/Workday/iCIMS) — **functional** |
| `submitter.py` | `automation/submitter.py:1` | `ApplicationSubmitter` (7-stage) — **BROKEN** `NameError: SubmissionStage` at line 172 |
| `__init__.py` | `automation/__init__.py:1` | Exports all — but submitter import fails |

### 7.6 Scheduler (`backend/src/athena/scheduler/`)
| Module | File | Key Exports |
|--------|------|-------------|
| `jobs.py` | `scheduler/jobs.py:1` | `AthenaScheduler`, `ScrapeConfig`, scrape (4h), process (30m), cleanup (1d) |
| `__init__.py` | `scheduler/__init__.py:1` | `athena_scheduler` instance |

### 7.7 Store / Persistence (`backend/src/athena/store.py`)
- **File:** `store.py` (9,912 bytes)
- **Engine:** JSONL files + `filelock` for concurrent safety
- **Collections:** `jobs.jsonl`, `applications.jsonl`, `user_profiles.jsonl`, `scrape_jobs.jsonl`
- **Dedupe:** Upsert by `source_job_id` (jobs) / `id` (others)
- **Documents:** Written to `company/athena/documents/{job_id}/`
- **Embeddings Cache:** `company/athena/embeddings_cache/{hash}.npy`

---

## 8. Database / Persistence

### 8.1 Storage Technology
- **Format:** JSON Lines (`.jsonl`) — one JSON object per line
- **Locking:** `filelock` (`.lock` files) for process-safe reads/writes
- **Directory:** `ATHENA_DATA_DIR` env var (default `./company/athena`)

### 8.2 Collections (in `company/athena/`)
| File | Record Type | Key Fields |
|------|-------------|------------|
| `jobs.jsonl` | `Job` | `id`, `source`, `source_job_id`, `title`, `company`, `location`, `job_type`, `description`, `requirements`, `salary_range`, `application_url`, `ats_score`, `match_score`, `match_tier`, `status`, `scraped_at` |
| `applications.jsonl` | `Application` | `id`, `job_id`, `user_profile_id`, `resume_id`, `cover_letter_id`, `ats_score`, `match_score`, `status`, `submitted_at`, `receipt_data`, `follow_up_dates[]` |
| `user_profiles.jsonl` | `UserProfile` | `id`, `email`, `full_name`, `skills[]`, `experience[]`, `education[]`, `certifications[]`, `documents[]`, `preferences` |
| `scrape_jobs.jsonl` | `ScrapeJob` | `id`, `source`, `query`, `location`, `job_type`, `max_results`, `status`, `jobs_found`, `jobs_new`, `error`, `started_at`, `completed_at` |

### 8.3 Document Storage
- Path: `company/athena/documents/{job_id}/{filename}.docx` (and `.pdf` if WeasyPrint worked)
- Generated by `DocumentGenerator._persist_document_output()` at `routes.py:244-259`

### 8.4 Embeddings Cache
- Path: `company/athena/embeddings_cache/{hash}.npy`
- 384-dim float32 numpy arrays from `all-MiniLM-L6-v2`
- Keyed by content hash of job description + requirements

---

## 9. Authentication & Authorization

### 9.1 Auth Scheme
- **Type:** API Key header (`X-API-Key`)
- **Mode:** Configurable via `ATHENA_AUTH_MODE` (`api_key` | `open`)
- **Default:** `api_key` (fail-closed)
- **Open Mode:** Only allowed on loopback (`127.0.0.1`) — `app.py:147-153`

### 9.2 Implementation (`backend/src/athena/api/app.py`)
| Component | File:Line |
|-----------|-----------|
| API Key validation | `app.py:123-128` (`_check_api_key`) |
| Valid keys source | `app.py:107-120` (`_get_api_keys`) — `ATHENA_API_KEY` + legacy aliases |
| Exempt paths | `app.py:132-144` (`_is_exempt_from_auth`) — `/docs`, `/redoc`, `/openapi.json`, `/health` |
| Middleware | `app.py:155-210` — applies to all non-exempt paths |
| Rate limiter | `app.py:79-97` (`_RateLimiter`) — 100 req/min per IP default |

### 9.3 Security Headers (`app.py:33-74`)
| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'` (+ frame-ancestors for AI Studio preview) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `geolocation=(), microphone=(), camera=()` |
| X-Frame-Options | `DENY` (except AI Studio preview) |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |

### 9.4 CORS (`app.py:220-250`)
- Origins from `ATHENA_CORS_ORIGINS` (comma-separated, default `http://localhost:8530,http://127.0.0.1:8530`)
- Credentials: true
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: `X-API-Key`, `Content-Type`, `Authorization`

---

## 10. AI Providers

### 10.1 Current State
| Provider | Status | Location |
|----------|--------|----------|
| **Embeddings** | `sentence-transformers` `all-MiniLM-L6-v2` | `matching/embeddings.py:18` — **WORKING** |
| **LLM (External)** | `ATHENA_LLM_PROVIDER` env → `ai_company` package | `documents/humanizer.py:45` — **BROKEN** (`ImportError: No module named 'ai_company'`) |
| **Gemini** | Not present | — |
| **OpenAI** | Not present | — |
| **Local (llama.cpp/ollama)** | Not present | — |

### 10.2 Humanizer Prompts (`documents/humanizer.py`)
- `DEHUMANIZE_SYSTEM_PROMPT` (line 13) — system prompt for LLM
- `DEHUMANIZE_USER_PROMPT_TEMPLATE` (line 45) — user prompt template
- `DEHUMANIZE_REGEX_FALLBACKS` (line 78) — regex replacements for "delve", "spearhead", "testament", etc.
- **Actual behavior:** Always falls back to regex because `ai_company` import fails

### 10.3 Environment Variables for AI
| Var | Purpose | Default |
|-----|---------|---------|
| `ATHENA_LLM_PROVIDER` | Select LLM provider (`openai` etc.) | Not set |
| `OPENAI_API_KEY` | OpenAI key (if provider=openai) | Not set |
| `GEMINI_API_KEY` | Not used in OpenCode | — |

---

## 11. Agents / Orchestration

### 11.1 Scheduler (`scheduler/jobs.py`)
| Job | Interval | Function | Endpoint |
|-----|----------|----------|----------|
| Scrape | 4 hours | `athena_scheduler.run_scrape_config()` | `POST /scheduler/start` |
| Process | 30 minutes | `athena_scheduler.process_new_jobs()` | `POST /process` |
| Cleanup | Daily | `athena_scheduler.cleanup_old_data()` | — |

**Auto-start:** `ATHENA_SCHEDULER_AUTOSTART=true` (default) — starts on app startup (`server.py:324`)

**Control Endpoints:** `/scheduler/start`, `/scheduler/stop`, `/scheduler/status`

### 11.2 Automation Pipeline (Broken)
- `ApplicationSubmitter` (7 stages): `NAVIGATE → FILL_PERSONAL → FILL_EXPERIENCE → FILL_SCREENING → UPLOAD_DOCUMENTS → REVIEW → SUBMIT`
- `LocalApprovalGate` — file-based approval (`data/approvals/*.json`), 30-min timeout
- **Status:** Not importable due to `NameError` in `submitter.py:172`; not routed in API

### 11.3 No Agent Loop
- No continuous agent process
- No message bus / event queue
- Orchestration is scheduler-triggered batch jobs only

---

## 12. Prompts

### 12.1 Document Generator Prompts (`documents/generator.py`)
| Prompt | Location | Purpose |
|--------|----------|---------|
| Resume system prompt | `generator.py:180-280` | Executive resume writer, structured sections |
| Cover letter system prompt | `generator.py:450-520` | Professional cover letter, 3 paragraphs |
| Resume template | `templates/resume_template.docx` | DOCX template with placeholders |
| Cover letter template | `templates/cover_letter_template.docx` | DOCX template with placeholders |

### 12.2 Humanizer Prompts (`documents/humanizer.py:13-76`)
- System: "You are an expert editor... remove AI tells..."
- User template: `{text}` + context
- Regex fallback: 15+ replacements (delve→examine, spearhead→lead, testament→proof, etc.)

### 12.3 Scraper Prompts
- No LLM prompts in scrapers — pure HTTP/Playwright parsing

---

## 13. Tools & Scripts

| Script | Path | Purpose |
|--------|------|---------|
| `dev-preview.sh` | `scripts/dev-preview.sh` | Local preview with AI Studio compatibility |
| `setup-git-hooks.sh` | `scripts/setup-git-hooks.sh` | Installs pre-commit (ruff, mypy) |
| `oci-deploy.sh` | `deploy/oci-deploy.sh` | SSH deploy to OCI (Oracle Cloud) |

### 13.1 Package Scripts
| Command | Package | Action |
|---------|---------|--------|
| `pnpm install` | root | Corepack enable + frontend install |
| `pnpm run build` | root | `pnpm --filter athena-frontend run build` |
| `pnpm run dev` | root | `pnpm --filter athena-frontend run dev` |
| `pnpm run lint` | root | `pnpm --filter athena-frontend run lint` |
| `pnpm run test` | root | `pnpm --filter athena-frontend run test` |
| `uv sync` | backend | Install Python deps |
| `uv run pytest` | backend | Run backend tests |
| `uv run ruff check` | backend | Lint |
| `uv run python -m mypy` | backend | Typecheck |

---

## 14. Configuration

### 14.1 Environment Variables (All Sources)

**Backend (grep `os.getenv` / `BaseSettings`):**
| Variable | Read At | Purpose | Default |
|----------|---------|---------|---------|
| `ATHENA_API_KEY` | `app.py:111` | Primary API key | `dev-admin-key` |
| `ATHENA_ADMIN_KEY` | `app.py:114` | Legacy alias | — |
| `ATHENA_APPROVE_KEY` | `app.py:114` | Legacy alias | — |
| `ATHENA_RUN_KEY` | `app.py:114` | Legacy alias | — |
| `ATHENA_CORS_ORIGINS` | `app.py:230` | CORS allowlist | `http://localhost:8530,http://127.0.0.1:8530` |
| `ATHENA_AUTH_MODE` | `app.py:258` | `api_key` \| `open` | `api_key` |
| `ATHENA_RATE_LIMIT` | `app.py:265` | Req/min per IP | `100` |
| `ATHENA_DATA_DIR` | `paths.py:15` | Data directory | `./company/athena` |
| `AISTUDIO_PREVIEW` | `app.py:35` | Relax CSP for AI Studio | `false` |
| `HOST` | `server.py:15` | Bind host | `127.0.0.1` |
| `PORT` | `server.py:16` | Bind port | `8000` |
| `ATHENA_SCHEDULER_AUTOSTART` | `server.py:327` | Auto-start scheduler | `true` |
| `ATHENA_DEFAULT_SCRAPE_QUERY` | `server.py:330` | Default scrape query | `software engineer` |
| `ATHENA_DEFAULT_SCRAPE_LOCATION` | `server.py:331` | Default location | empty |
| `ATHENA_DEFAULT_SCRAPE_MAX` | `server.py:332` | Default max results | `50` |
| `ATHENA_HITL_EXTERNAL` | `submitter.py:280` | External HITL gate | `false` |
| `ATHENA_LLM_PROVIDER` | `humanizer.py:45` | External LLM provider | Not set |
| `OPENAI_API_KEY` | `humanizer.py:48` | OpenAI key | Not set |
| `ATHENA_CSP` | `app.py:52` | Custom CSP | Computed |
| `ATHENA_HSTS_MAX_AGE` | `app.py:63` | HSTS max-age | `31536000` |

**Frontend (Vite build-time, `import.meta.env.VITE_*`):**
| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_ATHENA_API_BASE` | API base path | `/api/v1/athena` |
| `VITE_ATHENA_API_KEY` | API key (baked into bundle) | `dev-admin-key` |

### 14.2 Configuration Files
| File | Purpose |
|------|---------|
| `.env.example` | 15 `ATHENA_*` + 2 `VITE_*` vars (see above) |
| `backend/pyproject.toml` | Python deps, ruff, mypy, pytest config |
| `frontend/tsconfig.json` | TS strict config, path aliases |
| `frontend/vite.config.ts` | Vite + Tailwind + React plugin |
| `frontend/tailwind.config.js` | (Not present — Tailwind v4 uses CSS-first) |
| `docker-compose.yml` | Service definitions, env, volumes, healthchecks |
| `backend/Dockerfile` | Python uv + Playwright image |
| `frontend/Dockerfile` | Node + nginx multi-stage |
| `frontend/nginx.conf` | Reverse proxy config |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy.yml` | SSH deploy workflow |
| `.github/dependabot.yml` | Dependabot config |

---

## 15. Deployment

### 15.1 Docker
| File | Description |
|------|-------------|
| `backend/Dockerfile` | `ghcr.io/astral-sh/uv:python3.12-bookworm` → install deps → install Playwright Chromium → non-root user → `uvicorn` on `:8000` |
| `frontend/Dockerfile` | `node:22-alpine` → build → `nginx:alpine` → copy `nginx.conf` + `dist/` → port 80 |
| `docker-compose.yml` | 3 services: `backend` (8000), `frontend` (8530), `redis` (6379, unused); volumes for `company/athena`; healthchecks on both |

### 15.2 CI/CD (`.github/workflows/`)
| Workflow | Triggers | Jobs |
|----------|----------|------|
| `ci.yml` | push, PR to main | `ruff-format` → `ruff-lint` → `mypy` → `pytest` → `lint-debt` (advisory) → `frontend-build` → `frontend-lint` → `frontend-test` → `docker-build-backend` → `docker-build-frontend` |
| `deploy.yml` | manual (workflow_dispatch) | SSH to OCI host → `oci-deploy.sh` → health check → rollback on failure |

### 15.3 Deploy Script (`deploy/oci-deploy.sh`)
- SSH to target host
- `docker-compose pull` → `docker-compose up -d --remove-orphans`
- Health check: `curl -f http://localhost:8000/health`
- Rollback on failure: `docker-compose down && docker-compose up -d` (previous image)

---

## 16. Testing

### 16.1 Backend Tests (`backend/tests/`)
| File | Tests | Coverage |
|------|-------|----------|
| `test_athena_api.py` | ~6 | API endpoints (jobs, profiles, applications) |
| `test_athena_job_actions.py` | ~4 | Apply, tailor-resume, cover-letter, flag |
| `test_athena_matching.py` | ~3 | Matching engine, embeddings |
| `test_athena_scorer.py` | ~4 | ATS scorer breakdown, tiers |
| `test_athena_store.py` | ~5 | JSONL store CRUD, dedupe, filelock |

**Total:** ~22 tests  
**Run:** `uv run pytest backend/tests -v`  
**Config:** `pyproject.toml:94-100` (asyncio_mode=auto, testpaths=tests)

### 16.2 Frontend Tests (`frontend/src/lib/athena/`)
| File | Tests | Coverage |
|------|-------|----------|
| `api.test.ts` | ~12 | API client functions, error handling |
| `utils.test.ts` | ~5 | Utility functions (date, formatting) |

**Total:** ~17 tests  
**Run:** `pnpm run test` (vitest + jsdom)  
**Config:** `package.json:15`, `vite.config.ts` (test globals)

### 16.3 Known Test Gaps
- No E2E/Playwright tests in repo (`.playwright-cli/` exists but empty)
- Automation package (`submitter.py`) not tested (broken import)
- PDF generation not tested (WeasyPrint not installed)
- LLM path not tested (no provider configured)

---

## 17. External Services

| Service | Integration | Status |
|---------|-------------|--------|
| **LinkedIn** | Scraper (HTTP + Playwright) | Functional |
| **Indeed** | Scraper (HTTP) | Functional |
| **Glassdoor** | Scraper (HTTP) | Functional |
| **RemoteOK** | Scraper (HTTP) | Functional |
| **WeWorkRemotely** | Scraper (HTTP) | Functional |
| **Remote.co** | Scraper (HTTP) | Functional |
| **MyJobo (Malawi)** | Scraper (HTTP) | Functional |
| **MalawiJobs** | Scraper (HTTP) | Functional |
| **MalawiGov** | Scraper (HTTP) | Functional |
| **UN Jobs** | Scraper (HTTP) | Functional |
| **ReliefWeb** | Scraper (HTTP) | Functional |
| **Devex** | Scraper (HTTP) | Functional |
| **Upwork** | Scraper (HTTP) | Functional |
| **Freelancer** | Scraper (HTTP) | Functional |
| **sentence-transformers** | Local model (`all-MiniLM-L6-v2`) | Functional (cached) |
| **Playwright Chromium** | Browser automation | Installed in Docker |
| **n8n** | Not integrated | — |
| **Gemini / Google AI** | Not integrated | — |

---

## 18. Known Defects (OpenCode Side)

| # | Defect | File:Line | Impact |
|---|--------|-----------|--------|
| 1 | `NameError: SubmissionStage` in `submitter.py:172` | `automation/submitter.py:172` | Browser submitter unusable |
| 2 | External LLM path requires missing `ai_company` | `documents/humanizer.py:45` | Humanizer always uses regex fallback |
| 3 | WeasyPrint / pdfplumber not installed | `generator.py:905-928` | PDF generation & parsing unavailable |
| 4 | Dashboard kanban `updateJob` commented out | `Dashboard.tsx:110` | Drag-drop not persisted |
| 5 | `JobDetail` navigates to non-existent `/athena/jobs` | `JobDetail.tsx:83,165` | Broken navigation after actions |
| 6 | API key baked into frontend bundle | `api.ts:12` | Key exposed in client |
| 7 | No auth on GET endpoints | `app.py:132-144` | Read endpoints public |
| 8 | `motion` imported but unused in some components | `package.json:22` | Bundle bloat |
| 9 | `framer-motion` + `motion` both installed | `package.json:20,22` | Duplicate animation libs |

---

## 19. Git Status (at inventory time)

```bash
# Branch: main (ahead of origin/main by 3 commits)
# Uncommitted: none (clean working tree)
# Untracked: .playwright-cli/, docs/
# Recent commits:
f299484 build: install backend deps before copying sources
f277212 style: ruff format apply/tailor routes and job-actions tests
bbfb3da feat: wire apply/tailor/cover/flag buttons to real API endpoints
```

---

## Cross-References

- AI Studio Inventory: [`AI_STUDIO_INVENTORY.md`](./AI_STUDIO_INVENTORY.md)
- Capability Comparison: [`ATHENA_IMPLEMENTATION_COMPARISON.md`](./ATHENA_IMPLEMENTATION_COMPARISON.md)
- Merge Decisions: [`MERGE_DECISIONS.md`](./MERGE_DECISIONS.md)