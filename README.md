<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Athena Autonomous Job & Consultancy Engine

**Autonomous job scraping, semantic matching, document generation, and application dispatch with mandatory human sign-off.**

---

## Architecture

```
athena/
├── backend/                 # FastAPI backend (AI, scraping, matching, documents)
│   ├── src/athena/          # Domain modules (scrapers, ATS, matching, docs, AI)
│   ├── tests/               # Unit tests (102 passing)
│   ├── pyproject.toml       # Python deps + ruff/mypy config
│   └── uv.lock
├── src/                     # Primary: React 19 SPA + Vite 8 + Tailwind 4
│   ├── api.ts               # API client for backend endpoints
│   ├── components/          # Charts, Layout, Modals, Views
│   ├── data/                # Mock data (fallback)
│   ├── types.ts             # Shared TypeScript types
│   └── ...
├── server.ts                # Express BFF: proxies AI/data to FastAPI, serves SPA
├── athena-mapper.ts         # Front↔back data model mapping (adapters)
├── tests/server/            # Node unit tests (58 passing, node --test)
├── e2e/                     # Playwright E2E (aistudio smoke suite)
├── docs/                    # Guides, specs, implementation plans (archive/ = historical)
├── repo-audit/              # Cleanup audit artifacts (inventory, plan, decisions)
├── .github/workflows/       # CI (ruff, pytest, lint, build)
├── .env.example             # Environment template (canonical)
├── AGENTS.md                # Rules for AI agents working this repo
├── ARCHITECTURE.md          # System architecture diagram
└── ATHENA_MASTER_SPEC.md    # Product requirements
```

---

## Documentation Index

| Need | Read |
|---|---|
| How the system works | `ARCHITECTURE.md` |
| What the product must do | `ATHENA_MASTER_SPEC.md` |
| Rules for AI/human contributors | `AGENTS.md` |
| Feature deep-dives | `docs/` (guides, specs, plans) |
| Historical decisions / handoffs | `docs/archive/` (never current guidance) |
| Repo cleanup audit trail | `repo-audit/` (inventory, plan, open questions) |

---

## Quick Start

### Prerequisites

- Node.js 24+
- Python 3.12+
- uv (Python package manager: `pip install uv`)
- Gemini API key

### Development (Full Stack)

```bash
# 1. Install Node deps
npm install

# 2. Install Python deps
cd backend && uv sync --extra dev && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env: add GEMINI_API_KEY and ATHENA_API_KEY

# 4. Start FastAPI backend (port 8000)
cd backend && uv run uvicorn athena.api.app:app --host 127.0.0.1 --port 8000 &

# 5. Start Express + Vite dev server (port 3000)
npm run dev
```

**App runs at http://localhost:3000**

### Production Build

```bash
npm run lint      # TypeScript type-check
npm run build     # Build client + server bundle
npm start         # Runs dist/server.mjs (serves dist/ statically)
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (FastAI backend) | Yes |
| `ATHENA_API_KEY` | Shared secret for FastAPI auth (Express injects) | Yes |
| `ATHENA_CORS_ORIGINS` | Comma-separated allowed origins | No (defaults to localhost) |
| `ATHENA_AUTH_MODE` | `api_key` or `open` | No (default: `api_key`) |
| `ATHENA_DATA_DIR` | Data directory for JSONL stores | No (default: `./company/athena`) |
| `NODE_ENV` | `development` or `production` | No |
| `DISABLE_HMR` | Disable Vite HMR | No |
| `VITE_ATHENA_API_BASE` | Base path for API calls | No (default: `/api/v1/athena`) |

---

## Key Features

- **14 job board scrapers** (LinkedIn, Upwork, ReliefWeb, Lilongwe, etc.)
- **Semantic matching** with all-MiniLM-L6-v2 (384-dim embeddings)
- **ATS scoring** (40/35/15/10 weights) with rule-based fallback
- **Document generation** (resume, cover letter, consultancy proposal) with AI + dehumanizer
- **Mandatory human sign-off** (digital power-of-attorney, SHA-256 receipts)
- **n8n webhook ingress/egress** for workflow automation
- **File-based JSONL storage** with file locks (no database required)
- **4-hour cron scheduler** (scrape → process → match → dispatch)

---

## Testing

```bash
# Backend tests (102 passing)
cd backend && uv run pytest -q

# Backend lint
cd backend && uv run ruff check .

# Frontend type-check
npm run lint

# Node unit tests (58 passing)
npm run test:unit

# E2E tests (Playwright; requires backend + frontend running)
npm run test:e2e
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- **quality** — Node lint + build
- **backend-quality** — Python ruff + pytest

---

## Project Status

- ✅ FastAPI backend (102/102 tests pass)
- ✅ Express BFF proxies all AI/data routes to FastAPI
- ✅ n8n webhook ingress added
- ✅ API client + frontend data loading wired
- ✅ Repository cleanup completed (see `repo-audit/CLEANUP_PLAN.md`, health: `docs/REPOSITORY_HEALTH.md`)
- ⏳ Backend data population (run scrapers to populate `company/athena/`)
- ⏳ Full frontend wiring to real data (currently falls back to mock)
- ⏳ Deployment target (Docker/systemd TBD)