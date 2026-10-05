# Athena Platform — Architecture Diagram

> Athena v2.4.0 — Autonomous Job & Consultancy Engine (LightSpeed Holdings Ltd.)
> Source of truth: `backend/`, root `server.ts`/`src/`, `.github/workflows/`.

---

## 1. System Architecture

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Plus Jakarta Sans, Arial'}}}%%
graph TB

    %% ===================== CLIENTS =====================
    subgraph CLIENTS["Clients"]
        direction LR
        BRA["<b>Browser</b><br/>React 19 SPA + Vite 8 + Tailwind 4<br/><i>src/ — view switcher, no router</i>"]
    end

    %% ===================== LANE A : EXPRESS BFF =====================
    subgraph LANEA["Express BFF — server.ts (port 3000)"]
        direction TB
        EXPR["<b>Express BFF</b> — server.ts<br/>Vite middleware (dev) / dist static (prod)<br/>─────────────────────────<br/>POST /api/ai/score-ats · tailor-resume<br/>POST /api/ai/tailor-document · dehumanize<br/>POST /api/ai/scrape-live<br/>POST /api/submit-application<br/>POST /api/webhooks/n8n · /api/n8n/dispatch-webhook<br/>POST /api/lock/artifact · /global · /stale<br/>GET /api/health · /api/backend-health<br/>─────────────────────────<br/><i>No auth middleware — API keys stay server-side</i>"]
    end

    %% ===================== LANE B : FASTAPI BACKEND =====================
    subgraph LANEB["FastAPI Backend — backend/src/athena/api/app.py (port 8000)"]
        direction TB

        subgraph FASTAPI["FastAPI Service"]
            direction TB
            MW["<b>Middleware chain</b><br/>CORS allowlist → rate limit 100/min/IP<br/>→ X-API-Key (mutating verbs only)<br/>→ CSP · HSTS · X-Frame-Options · Referrer-Policy"]
            RT["<b>api/routes.py</b> — 31 CRUD endpoints<br/>/jobs · /profiles · /applications · /receipts<br/>/stats · /scrape · /process · /match<br/>/score · /scheduler/start|stop|status"]
            AIR["<b>api/ai_routes.py</b><br/>/ai/score-ats · tailor-resume · tailor-document<br/>/ai/dehumanize · scrape-live · n8n/dispatch<br/>/ai/submit-application (rejects without<br/>authorization_signature)<br/>/ai/webhooks/n8n (ingress from n8n)"]
            MET["<b>metrics/prometheus.py</b><br/>GET /api/v1/athena/metrics<br/><i>auth-exempt</i>"]
            HP["GET /health · /docs · /redoc · /openapi.json"]
        end

        subgraph DOMAIN["Domain Modules — backend/src/athena/"]
            direction TB
            SCR["<b>scrapers/</b> — 14 scrapers + registry<br/>base · remote · lilongwe · consultancy<br/>httpx rate-limited, Playwright fallback"]
            MATCH["<b>matching/</b><br/>engine.py · embeddings.py<br/>all-MiniLM-L6-v2 (384-dim)"]
            ATS["<b>ats/</b><br/>scorer.py · keywords.py<br/>weights 40 / 35 / 15 / 10"]
            DOCS["<b>documents/</b><br/>generator · humanizer (Dehumanizer)<br/>python-docx templates · WeasyPrint PDF"]
            AUTO["<b>automation/</b><br/>browser.py (Playwright stealth)<br/>form_filler.py · submitter.py<br/>7-stage submitter + LocalApprovalGate"]
            AIPV["<b>ai/providers/</b><br/>base.py ABC → factory.py<br/>gemini.py ⇄ fallback.py (rule-based)"]
            SCHED["<b>scheduler/</b> — APScheduler AsyncIOScheduler<br/>4h scrape · 30m process · 1d cleanup<br/>autostart via lifespan"]
            ADAPT["<b>adapters/</b> · <b>models/</b><br/>ai_studio.py · Pydantic v2 domain models"]
        end
    end

    %% ===================== HITL =====================
    HITL["<b>⛔ MANDATORY HUMAN SIGN-OFF GATE (HITL)</b><br/>Digital power-of-attorney · authorization_signature<br/>SignOffModal → /ai/submit-application<br/><i>No application is dispatched without it</i>"]

    %% ===================== DATA =====================
    subgraph DATA["Data Layer — file-based, no SQL / no queue"]
        direction TB
        JSONL["<b>JSONL collections</b> — AthenaStore[T] + filelock<br/>jobs.jsonl · applications.jsonl<br/>user_profiles.jsonl · scrape_jobs.jsonl"]
        DOCDIR["<b>Documents</b><br/>company/athena/documents/{profile_id}/*.docx"]
        EMB["<b>Embeddings cache</b><br/>company/athena/embeddings_cache/{hash}.npy"]
        LOCKS["<b>Agent locks</b> — filelock<br/>artifacts/locks/*.lock"]
        PROF["<b>Applicant dossier</b> — profile/<br/>resume · education · certs · ATS keywords"]
    end

    %% ===================== EXTERNAL =====================
    subgraph EXT["External Services"]
        direction TB
        BOARDS["<b>Job boards (14 sources)</b><br/>LinkedIn · Indeed · Glassdoor · RemoteOK<br/>WeWorkRemotely · Remote.co<br/>Upwork · Toptal · Freelancer · Guru · PeoplePerHour<br/>malawijobs · malawiwork · jobs.malawi.net"]
        GEM["<b>Google Gemini</b><br/>gemini-3.8-flash · @google/genai + google-genai<br/><i>GEMINI_API_KEY (FastAPI only)</i>"]
        HF["<b>HuggingFace / sentence-transformers</b><br/>all-MiniLM-L6-v2"]
        N8N["<b>n8n</b> — webhook ingress/egress<br/><i>ATHENA_N8N_WEBHOOK_URL</i>"]
    end

    %% ===================== INFRA =====================
    subgraph INFRA["Infrastructure & CI/CD"]
        direction TB
        CICD["<b>GitHub Actions</b><br/>ci.yml (ruff · pytest · lint · build)<br/>e2e.yml (Playwright 3 engines + Chrome-only visual)<br/>dependabot.yml (npm + pip)"]
    end

    %% ===================== EDGES =====================
    BRA -->|"REST /api/*"| EXPR

    EXPR -->|"POST /ai/* proxy + X-API-Key"| AIR
    EXPR -.->|"GET /health probe"| MW

    MW --> RT
    MW --> AIR
    MW --> MET
    MW --> HP

    RT --> DOMAIN
    AIR --> DOMAIN
    AIR -.->|"authorization_signature<br/>verified"| HITL
    HITL --> AUTO

    SCHED -.->|"4h / 30m / 1d"| SCR
    SCHED -.->|"process_new_jobs"| MATCH
    SCHED -.->|"cleanup_old_jobs"| JSONL

    SCR -->|"httpx · Playwright"| BOARDS
    MATCH --> HF
    MATCH --> EMB
    ATS --> MATCH
    DOCS --> AIPV
    AUTO --> AIPV
    AIPV --> GEM
    AIR --> N8N

    DOMAIN --> JSONL
    ADAPT --> JSONL
    DOCS --> DOCDIR
    AUTO --> LOCKS
    RT --> PROF

    EXPR -->|"serves SPA + proxies AI/data"| BRA

    classDef client fill:#070A40,stroke:#E63946,stroke-width:2px,color:#FFFFFF
    classDef api fill:#111827,stroke:#00BFFF,stroke-width:2px,color:#F9FAFB
    classDef domain fill:#1F2937,stroke:#F97316,stroke-width:1px,color:#F9FAFB
    classDef data fill:#1E3A5F,stroke:#2563EB,stroke-width:1px,color:#F9FAFB
    classDef external fill:#052E16,stroke:#10B981,stroke-width:1px,color:#ECFDF5
    classDef infra fill:#1C1917,stroke:#78716C,stroke-width:1px,color:#F5F5F4
    classDef gate fill:#450A0A,stroke:#E63946,stroke-width:3px,color:#FEE2E2

    class BRA client
    class EXPR,MW,RT,AIR,MET,HP api
    class SCR,MATCH,ATS,DOCS,AUTO,AIPV,SCHED,ADAPT domain
    class JSONL,DOCDIR,EMB,LOCKS,PROF data
    class BOARDS,GEM,HF,N8N external
    class CICD infra
    class HITL gate
```

---

## 2. Core Pipeline Flow

The autonomous loop governed by the human sign-off gate:

```mermaid
%%{init: {'theme':'base'}}%%
graph LR
    A["⏰ 4h cron<br/>APScheduler"] --> B["🔍 Scrape<br/>14 job boards"]
    B --> C["📦 Store<br/>jobs.jsonl"]
    C --> D["🧠 Semantic match<br/>all-MiniLM-L6-v2"]
    D --> E["📊 ATS score<br/>40/35/15/10"]
    E --> F{"Decision<br/>router"}
    F -->|"≥ 90"| G["✅ Auto-queue"]
    F -->|"80–89"| H["🚩 Flag for review"]
    F -->|"< 80"| C2["⏭ Dismiss"]
    G --> I["📄 Pristine Document<br/>Studio (Dehumanizer)"]
    H --> I
    I --> J["🛑 HUMAN SIGN-OFF<br/>power-of-attorney"]
    J -->|"approved"| K["🚀 Dispatch"]
    J -->|"rejected"| I
    K --> L["🔐 SHA-256 receipt"]
    L --> M["⏰ 7-day follow-up"]

    classDef step fill:#1F2937,stroke:#00BFFF,color:#F9FAFB
    classDef gate fill:#450A0A,stroke:#E63946,stroke-width:3px,color:#FEE2E2
    classDef ok fill:#052E16,stroke:#10B981,color:#ECFDF5
    class A,B,C,D,E,F,G,H,C2,I,K,L,M step
    class J gate
    class K,L,M ok
```

---

## 3. Layer Reference

| Layer | Implementation | Entry point |
|---|---|---|
| **Presentation** | React 19 + Vite 8 + Tailwind 4, view switcher | `src/App.tsx` |
| **BFF / Proxy** | Express 4, single file | `server.ts` |
| **API / Backend** | FastAPI + Uvicorn + Pydantic v2 | `backend/src/athena/api/app.py` |
| **Domain** | Scrapers · matching · ATS · documents · automation · AI · scheduler | `backend/src/athena/` |
| **Data** | JSONL + `filelock` + in-memory cache | `backend/src/athena/store.py` |
| **Edge** | Express static + Vite middleware | `server.ts` |
| **Infra** | GitHub Actions (ruff · pytest · lint · build) | `.github/workflows/ci.yml` |

### Port map

| Service | Port |
|---|---|
| Express BFF + SPA (dev) | 3000 |
| FastAPI (local) | 8000 |
| FastAPI (E2E) | 8001 |
| Express (prod, `npm start`) | 3000 |

### Communication

REST/JSON only. **No GraphQL, gRPC, WebSocket, or message queue.**

- SPA path: browser → Express `/api/*` → FastAPI `/api/v1/athena/*` (proxied with `X-API-Key`)
- Auth: `X-API-Key` on FastAPI mutating verbs; Express injects key server-side
- Observability: Prometheus text at `/api/v1/athena/metrics` (auth-exempt)
- Locks: file-based in `artifacts/locks/`, served by Express

### Background jobs (APScheduler, in-process)

| Job | Interval | Work |
|---|---|---|
| `athena_scrape_jobs` | 4 hours | `run_all_scrapes()` across 14 sources |
| `athena_process_jobs` | 30 minutes | matching engine + ATS scorer |
| `athena_cleanup` | daily | `cleanup_old_jobs(days=90)` |

---

## 4. Known Discrepancies / Open Items

1. **Backend data empty** — `company/athena/` recreated empty; scrapers must run to populate.
2. **No deployment target** — runs locally via `npm run dev` (Express+FastAPI) or `npm start` (prod build).
3. **Frontend views still use mock data** — `src/App.tsx` loads from backend but falls back to mock; full wiring pending.
4. **n8n webhook URL** — `ATHENA_N8N_WEBHOOK_URL` not configured; ingress endpoint exists but untested.
5. **Docker/OCI removed** — `deploy/`, `docker-compose*.yml`, `.dockerignore` deleted; deployment TBD.


