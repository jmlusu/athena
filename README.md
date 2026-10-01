<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Athena Autonomous Job & Consultancy Engine

**Run and deploy your AI Studio app**

This contains everything you need to run the Athena Autonomous Job & Consultancy Pipeline locally.

View your app in AI Studio: https://ai.studio/apps/a1fd22b1-579b-428f-aade-5f940703b0be

---

## Architecture

```
athena/
├── backend/              # Python FastAPI backend (legacy/reference)
│   ├── src/athena/       # Main package (renamed from ai_company.athena)
│   ├── tests/            # Unit tests
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/             # React + Vite + Tailwind 4 frontend (legacy/reference)
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── src/                  # **Primary: React 19 SPA + Vite + Tailwind 4 (spec-compliant)**
│   ├── components/       # Charts, Layout, Modals, Views
│   ├── data/             # Mock data & types
│   └── ...
├── server.ts             # **Primary: Express.js BFF + Gemini AI SDK**
├── docs/                 # FDS/TDS specifications
├── docker-compose.yml
└── .env.example
```

---

## Quick Start (Primary Implementation)

### Development

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set the GEMINI_API_KEY in .env (copy from .env.example)
cp .env.example .env
# Edit .env with your Gemini API key

# 3. Run the full-stack app (Express + Vite dev server)
npm run dev
```

The app will be available at http://localhost:3000

### Build & Production

```bash
# Type-check
npm run lint

# Build client + server
npm run build

# Start production server
npm start
```

---

## Legacy Python Implementation (Reference)

The `backend/` and `frontend/` directories contain the original Python/FastAPI + React implementation for reference.

```bash
# Backend
cd backend
cp ../.env.example .env  # Edit as needed
uv sync --extra dev
uv run uvicorn athena.api.app:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
pnpm install
pnpm dev
```

#### AI Studio / Cloud Preview

When running in AI Studio or a cloud sandbox:

```bash
# From repo root
pnpm dev:preview
# or
bash scripts/dev-preview.sh
```

### Docker

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:
- Frontend (Primary): http://localhost:3000
- Frontend (Legacy): http://localhost:8530
- Backend API (Legacy): http://localhost:8520
- API Docs (Legacy): http://localhost:8520/docs

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | **Primary: Gemini AI API key** | Required |
| `GEMINI_MODEL` | **Primary: Gemini model to use** | (auto) |
| `APP_URL` | **Primary: App URL for self-referential links** | http://localhost:3000 |
| `PORT` | **Primary: Express server port** | 3000 |
| `NODE_ENV` | **Primary: Node environment** | development |
| `ATHENA_API_KEY` | Legacy: API key for Python backend auth | `dev-admin-key` |
| `ATHENA_CORS_ORIGINS` | Legacy: Comma-separated allowed origins | `http://localhost:8530,http://127.0.0.1:8530` |
| `ATHENA_AUTH_MODE` | Legacy: `api_key` or `open` | `api_key` |
| `ATHENA_RATE_LIMIT` | Legacy: Requests per minute per IP | `100` |
| `ATHENA_DATA_DIR` | Legacy: Data directory for JSONL stores | `./company/athena` |
| `ATHENA_HITL_EXTERNAL` | Legacy: Use external HITL gate | `false` |
| `ATHENA_LLM_PROVIDER` | Legacy: External LLM provider for humanization | (empty) |
| `ATHENA_SCHEDULER_AUTOSTART` | Legacy: Start scheduler on boot | `true` |
| `ATHENA_DEFAULT_SCRAPE_QUERY` | Legacy: Default scheduled scrape query | `software engineer` |
| `ATHENA_DEFAULT_SCRAPE_MAX` | Legacy: Max results per scheduled scrape | `50` |
| `ATHENA_HOST` | Legacy: Python backend host | `0.0.0.0` |
| `ATHENA_PORT` | Legacy: Python backend port | `8000` |
| `ATHENA_HSTS_MAX_AGE` | Legacy: HSTS max-age in seconds | `31536000` |
| `ATHENA_AGENT_ID` | Legacy: Agent identifier for tracking | (empty) |
| `ATHENA_BACKEND_URL` | Legacy: Backend URL for frontend proxy | `http://localhost:8000` |
| `VITE_ATHENA_API_BASE` | Legacy: Frontend API base path | `/api/v1/athena` |
| `VITE_ATHENA_API_KEY` | Legacy: API key baked into frontend build | `dev-admin-key` |
| `HOST` | Host binding for dev server | (empty) |

## Primary Implementation Features (Spec-Compliant)

- **Multi-Scope Job Aggregation**: Lilongwe Local, Lilongwe Remote, International Remote
- **Semantic ATS Scoring**: Gemini-powered 0-100 scoring with tier thresholds (≥90 auto-ready, 80-89 flagged)
- **Pristine Document Studio**: 1-Column/2-Column resume, cover letter, consultancy proposals with Dehumanizer engine
- **Human-in-the-Loop Gate**: Mandatory digital power-of-attorney sign-off before submission
- **Cryptographic Receipts**: SHA-256 audit hashes with 7-day follow-up calendar
- **n8n Webhook Integration**: Visual 5-node topology with test trigger console
- **Layered Mountain Chart**: Stylized SVG area chart for opportunity momentum
- **Circular Gauge**: ATS score radial dial with color-coded tiers
- **Offline-Capable**: Deterministic fallbacks when GEMINI_API_KEY not configured

---

## Legacy Implementation Features

- **Job Scraping**: Multi-source job scraping (LinkedIn, RemoteOK, WeWorkRemotely, etc.)
- **Semantic Matching**: Embedding-based job-profile matching
- **ATS Scoring**: Resume-to-job ATS compatibility scoring
- **Application Automation**: Browser-based application submission with HITL approval
- **Document Generation**: Professional resume/cover letter generation with python-docx
- **AI Humanization**: Optional LLM-powered content humanization (with template fallback)
- **Scheduler**: Background scraping and processing jobs

---

## Security

- **Primary**: API key never exposed client-side; all Gemini calls server-side via Express BFF
- **Legacy**: CORS restricted to configured origins (never `*`)
- **Legacy**: API key authentication (fail-closed by default)
- **Legacy**: Rate limiting (configurable, default 100 req/min)
- **Legacy**: Security headers on all responses (CSP, HSTS, etc.)
- **Legacy**: Loopback-only restriction for `open` auth mode

---

## Testing

```bash
# Primary: TypeScript type-check
npm run lint

# Legacy Backend tests
cd backend
uv run pytest

# Legacy Frontend tests
cd frontend
pnpm test
```

---

## Deployment

### Primary (Express + React SPA)
The primary implementation builds to `dist/` with a single Node.js server (`dist/server.cjs`).

### Legacy (Docker - Oracle Cloud / VPS)
```bash
# On the instance, after cloning this repo:
bash deploy/oci-deploy.sh
```
The script installs Docker if needed, generates a `.env` with a random `ATHENA_API_KEY`, builds images (backend includes Playwright Chromium), starts the stack, and waits for health.

---

## History

This repository was created via `git filter-repo` from the LightSpeed Holdings monorepo, preserving full commit history for the Athena module.

The primary implementation (Express + React SPA) was built to match the **ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md** (FDS/TDS v2.4.0) with brand compliance per **ATHENA_ARCHITECTURE_AND_BRANDING.md**.