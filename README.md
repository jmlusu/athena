# Athena Job-Scraping Platform

Standalone job scraping, matching, and application platform extracted from LightSpeed Holdings.

## Architecture

```
athena/
├── backend/          # Python FastAPI backend
│   ├── src/athena/   # Main package (renamed from ai_company.athena)
│   ├── tests/        # Unit tests
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/         # React + Vite + Tailwind 4 frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Development

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
- Frontend: http://localhost:8530
- Backend API: http://localhost:8520
- API Docs: http://localhost:8520/docs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ATHENA_API_KEY` | API key for authentication | `dev-admin-key` |
| `ATHENA_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:8530,http://127.0.0.1:8530` |
| `ATHENA_AUTH_MODE` | `api_key` (fail-closed) or `open` (localhost only) | `api_key` |
| `ATHENA_RATE_LIMIT` | Requests per minute per IP | `100` |
| `ATHENA_DATA_DIR` | Data directory for JSONL stores | `./company/athena` |
| `ATHENA_HITL_EXTERNAL` | Use external HITL gate (requires ai_company) | `false` |
| `ATHENA_LLM_PROVIDER` | External LLM provider for humanization | (empty) |
| `ATHENA_SCHEDULER_AUTOSTART` | Start scheduler on boot | `true` |
| `ATHENA_DEFAULT_SCRAPE_QUERY` | Default scheduled scrape query | `software engineer` |
| `ATHENA_DEFAULT_SCRAPE_MAX` | Max results per scheduled scrape | `50` |
| `VITE_ATHENA_API_BASE` | Frontend API base path | `/api/v1/athena` |
| `VITE_ATHENA_API_KEY` | API key baked into frontend build (must match `ATHENA_API_KEY`) | `dev-admin-key` |

## Features

- **Job Scraping**: Multi-source job scraping (LinkedIn, RemoteOK, WeWorkRemotely, etc.)
- **Semantic Matching**: Embedding-based job-profile matching
- **ATS Scoring**: Resume-to-job ATS compatibility scoring
- **Application Automation**: Browser-based application submission with HITL approval
- **Document Generation**: Professional resume/cover letter generation with python-docx
- **AI Humanization**: Optional LLM-powered content humanization (with template fallback)
- **Scheduler**: Background scraping and processing jobs

## Security

- CORS restricted to configured origins (never `*`)
- API key authentication (fail-closed by default)
- Rate limiting (configurable, default 100 req/min)
- Security headers on all responses (CSP, HSTS, etc.)
- Loopback-only restriction for `open` auth mode

## Testing

```bash
# Backend tests
cd backend
uv run pytest

# Frontend tests
cd frontend
pnpm test
```

## Deployment

The platform is designed to run as two Docker containers (backend + frontend) behind a reverse proxy. Configure `ATHENA_API_KEY` and `ATHENA_CORS_ORIGINS` for production.

### Oracle Cloud / VPS (always-on)

```bash
# On the instance, after cloning this repo:
bash deploy/oci-deploy.sh
```

The script installs Docker if needed, generates a `.env` with a random `ATHENA_API_KEY`, builds images (backend includes Playwright Chromium), starts the stack, and waits for health.

- Dashboard: `http://<instance-ip>:8530`
- API: `http://<instance-ip>:8520`
- Scheduler auto-starts (`ATHENA_SCHEDULER_AUTOSTART=true`) and scrapes every 4 hours

Open TCP 80/443 (or 8520/8530) in the OCI security list. Put TLS (Caddy/nginx) in front before public exposure. Never commit the generated `.env`.

## History

This repository was created via `git filter-repo` from the LightSpeed Holdings monorepo, preserving full commit history for the Athena module.