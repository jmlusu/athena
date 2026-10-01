# ATHENA — Master Product Specification

**Product:** Athena  
**Developer:** LightSpeed Holdings Limited  
**Status:** Independent software product (not merged into LightSpeed corporate app)  
**Canonical Repository:** `github.com/jmlus/athena`

---

## 1. Product Vision

Athena is an autonomous job-discovery, matching, and application platform for white-collar professionals operating in **Lilongwe, Malawi** and **international remote** markets. It combines:

- Real multi-source scraping (14 scrapers: LinkedIn, Indeed, Glassdoor, RemoteOK, WeWorkRemotely, Remote.co, Malawi boards, freelance platforms)
- Semantic embedding matching (`all-MiniLM-L6-v2` cosine similarity)
- Heuristic ATS scoring (keyword/semantic/experience/education weighted)
- Generative AI document tailoring (resume, cover letter, executive summary, consultancy proposal)
- "Dehumanizer" AI-tell removal for authentic professional voice
- Mandatory human-in-the-loop sign-off gate (legal authorization + typed signature)
- Cryptographic receipt ledger with 7-day follow-up automation
- n8n workflow orchestration integration
- Background scheduler (4h scrape / 30m process / 1d cleanup)
- Full persistence (JSONL + filelock + document files + embedding cache)

**Athena remains a separate product** — it is not merged into any LightSpeed Holdings corporate application.

---

## 2. Target Personas

| Persona | Context | Primary Need |
|---------|---------|--------------|
| **Senior Technical Consultant (Lilongwe-based)** | Malawi local + international remote | Discover consultancies, auto-generate proposals, human sign-off |
| **Remote Engineer (Global)** | International remote (US/EU timezones) | Scrape remote boards, tailor resumes, track pipeline |
| **Development Sector Professional** | UN/NGO/ReliefWeb/Devex Malawi | Lilongwe-local & hybrid roles, donor-compliant docs |

---

## 3. Core Capabilities (Must-Have)

| # | Capability | Description | Source |
|---|------------|-------------|--------|
| 1 | Multi-source job scraping | 14 scrapers, rate-limited, Playwright fallback | OpenCode |
| 2 | Semantic matching | `sentence-transformers` embeddings, cosine cache, `POST /match` | OpenCode |
| 3 | Heuristic ATS scoring | 40/35/15/10 weights, sub-scores, auto-apply/flag thresholds | OpenCode |
| 4 | Generative document tailoring | Resume (1/2-col), cover letter, exec summary, consultancy proposal | **AI Studio** |
| 5 | Dehumanizer | AI-tell removal via LLM + regex fallback, user toggle | **AI Studio** |
| 6 | Human sign-off gate | Checkbox + typed legal signature, enforced client + server | **AI Studio** |
| 7 | Receipt ledger | Confirmation hash, 7-day follow-up, generated email draft | **AI Studio** |
| 8 | n8n orchestration | Visual topology, webhook tester, dispatcher stub | **AI Studio** |
| 9 | Background scheduler | APScheduler, 4h/30m/1d jobs, control API | OpenCode |
| 10 | Persistence layer | JSONL + filelock, dedupe, document files, embedding cache | OpenCode |
| 11 | Full REST API | 28 endpoints `/api/v1/athena/*`, OpenAPI `/docs` | OpenCode |
| 12 | Security stack | `X-API-Key`, rate limit, CORS, CSP/HSTS, loopback restriction | OpenCode |
| 13 | Browser automation | Playwright stealth, form filler, submitter (currently broken) | OpenCode |
| 14 | DOCX generation | `python-docx` templates, resume/cover-letter | OpenCode |
| 15 | React SPA frontend | `react-router` v7, routed views, error boundaries | OpenCode |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ATHENA SYSTEM                              │
├──────────────────┬──────────────────────────────────────────────┤
│   FRONTEND       │                  BACKEND                     │
│  (React 19 +     │              (FastAPI + Python 3.12+)        │
│   Vite + TS)     │                                              │
│                  │  ┌────────────────────────────────────────┐  │
│  ┌────────────┐  │  │ API ROUTER /api/v1/athena/*            │  │
│  │ Pages/Views│──┼──│ Jobs, Profiles, Applications, Scrape   │  │
│  │ Components │  │  │ Match, Score, Stats, Scheduler, AI*    │  │
│  └────────────┘  │  └────────────────────────────────────────┘  │
│        │         │                     │                        │
│        ▼         │                     ▼                        │
│  ┌────────────┐  │  ┌────────────────────────────────────────┐  │
│  │ API Client │  │  │ SERVICE LAYER                          │  │
│  │ (fetch)    │  │  │ ats/, matching/, scrapers/, documents/,│  │
│  └────────────┘  │  │ automation/, scheduler/, store/        │  │
│                  │  └────────────────────────────────────────┘  │
│                  │                     │                        │
│                  │                     ▼                        │
│                  │  ┌────────────────────────────────────────┐  │
│                  │  │ DATA LAYER                             │  │
│                  │  │ JSONL stores (jobs, apps, profiles,    │  │
│                  │  │ scrape_jobs) + filelock + docs + cache │  │
│                  │  └────────────────────────────────────────┘  │
│                  │                     │                        │
│                  │                     ▼                        │
│                  │  ┌────────────────────────────────────────┐  │
│                  │  │ AI PROVIDERS (pluggable)               │  │
│                  │  │ ├─ Gemini (primary, server-side)       │  │
│                  │  │ ├─ OmniRoute (future)                  │  │
│                  │  │ ├─ OpenCode providers (future)         │  │
│                  │  │ ├─ Local models (future)               │  │
│                  │  │ └─ Regex/template fallbacks            │  │
│                  │  └────────────────────────────────────────┘  │
└──────────────────┴──────────────────────────────────────────────┘
```

**Ports:** Frontend 8530 (nginx) → Backend 8000 (FastAPI)  
**Auth:** `X-API-Key` on mutating endpoints (fail-closed)  
**Env:** `ATHENA_API_KEY`, `ATHENA_CORS_ORIGINS`, `ATHENA_AUTH_MODE`, `GEMINI_API_KEY` (server-only)

---

## 5. Data Models (Canonical)

### Job / Opportunity
- `id` (UUID), `source`, `source_job_id`, `title`, `company`, `location`, `job_type`, `description`, `requirements`, `salary_range`, `application_url`, `ats_score`, `match_score`, `match_tier`, `status` (10-stage `JobStatus`), `scraped_at`

### UserProfile
- `id`, `email`, `full_name`, `skills[]`, `experience[]`, `education[]`, `certifications[]`, `preferences`, `documents[]`

### Application
- `id`, `job_id`, `user_profile_id`, `resume_id`, `cover_letter_id`, `ats_score`, `match_score`, `status` (`ApplicationStatus`), `receipt_data`, `follow_up_dates[]`

### AutomationSettings
- `autoCreateThreshold` (90), `flagThresholdMin` (80), `flagThresholdMax` (89), `dehumanizeEnabled`, `n8nWebhookUrl`, `n8nActive`

### PipelineStatus (AI Studio) ↔ JobStatus (OpenCode) Mapping
| AI Studio | OpenCode |
|-----------|----------|
| discovered | NEW, FETCHED |
| evaluated | MATCHED, SCORED |
| tailored | (generated docs) |
| awaiting_signoff | FLAGGED (pending human) |
| submitted | APPLIED |
| interview | INTERVIEW |
| offer | OFFER |

---

## 6. AI Provider Abstraction

Athena MUST NOT hard-code around a single provider.

```
Athena AI Abstraction
        │
        ├── Gemini (current, @google/genai, server-side only)
        ├── OmniRoute (planned)
        ├── OpenCode providers (planned)
        ├── Local models (planned, llama.cpp / ollama)
        └── Regex/template fallbacks (always available)
```

**Rules:**
- API keys never reach the browser (server-side only)
- All LLM calls behind provider interface
- Deterministic fallbacks when no key configured
- Prompt templates versioned and testable

---

## 7. Brand & Design System

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#070A40` | Primary dark |
| Red | `#E63946` | Critical actions, consultancy |
| Cyan | `#00BFFF` | Links, active states |
| Orange | `#F97316` | Primary brand, ATS ≥90, cron |
| Emerald | `#10B981` | Success, synced, submitted |
| Amber | `#F59E0B` | Warnings, ATS 80-89 |

**Typography:**
- Brand/Wordmark: **Cinzel** (serif display)
- Headings: **Lora** (serif)
- Body/UI: **Plus Jakarta Sans** (sans)

**Wordmark:** `ATHENA` (Cinzel, uppercase, tracking-wider)

---

## 8. Deployment Targets

| Target | Stack | Status |
|--------|-------|--------|
| Local Dev | docker-compose (nginx + backend + frontend) | ✅ |
| OCI/Cloud | Docker + `deploy/oci-deploy.sh` SSH rollout | ✅ |
| AI Studio Preview | Single-process Node (Express + Vite) | Legacy |

---

## 9. Testing Requirements

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Backend unit/integration | pytest | ≥80% |
| Frontend unit | vitest + jsdom | ≥70% |
| E2E (critical flows) | Playwright | Core flows |
| Lint/Format | ruff + tsc --noEmit | Clean |

---

## 10. Non-Goals (Explicitly Out of Scope)

- Merging Athena into LightSpeed corporate app
- Building a generic HR platform
- Replacing n8n (Athena integrates with n8n, doesn't replace it)
- Building a job board for employers (Athena is applicant-facing)
- Multi-tenancy (single applicant profile scope)

---

## 11. Glossary

| Term | Definition |
|------|------------|
| ATS | Applicant Tracking System — algorithmic resume scoring |
| Dehumanizer | AI-tell removal (purges "delve", "spearhead", "testament to", etc.) |
| HITL | Human-In-The-Loop — mandatory sign-off before submission |
| Lilongwe Local | On-site roles in Lilongwe, Malawi |
| Lilongwe Remote | Remote roles for Malawi-based professionals |
| International Remote | Global remote roles (any timezone) |
| n8n | Workflow automation platform (external) |
| Pipeline | 7-stage kanban: discovered → offer |
| Receipt | Cryptographic proof of submission (ID, hash, timestamp, signatory) |