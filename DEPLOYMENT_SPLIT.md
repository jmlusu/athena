# Split Deployment Guide (Path B)

This guide covers deploying Athena with **separate frontend and backend** — frontend on a static host (Vercel, Netlify, Cloudflare Pages, or AI Studio) and backend on a Python-capable platform (Railway, Fly.io, Cloud Run, Render, VPS).

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│   Frontend      │ ─────────────► │    Backend      │
│  (Static Host)  │  /api/v1/athena│  (Python/FastAPI)│
└─────────────────┘                └─────────────────┘
        │                                 │
        │                                 ▼
        │                        ┌─────────────────┐
        │                        │   PostgreSQL    │
        │                        │   + pgvector    │
        │                        └─────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────┐                ┌─────────────────┐
│  User Browser   │                │   Redis         │
└─────────────────┘                └─────────────────┘
```

---

## 1. Backend Deployment

### Option A: Railway (Recommended - Easiest)
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and create project
railway login
railway init

# 3. Add PostgreSQL + Redis
railway add postgresql
railway add redis

# 4. Set environment variables (from backend/.env.production.example)
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
railway variables set ATHENA_API_KEY=$(openssl rand -hex 32)
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set GEMINI_API_KEY=your-gemini-key
railway variables set ALLOWED_ORIGINS=https://your-frontend.vercel.app

# 5. Deploy
railway up
```

### Option B: Fly.io
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Launch (creates fly.toml)
fly launch --name athena-backend --region iad

# 3. Add Postgres + Redis
fly postgres create --name athena-db
fly redis create --name athena-redis

# 4. Set secrets
fly secrets set ATHENA_API_KEY=$(openssl rand -hex 32)
fly secrets set SECRET_KEY=$(openssl rand -hex 32)
fly secrets set GEMINI_API_KEY=your-gemini-key
fly secrets set ALLOWED_ORIGINS=https://your-frontend.vercel.app

# 5. Deploy
fly deploy
```

### Option C: Google Cloud Run
```bash
# 1. Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/athena-backend --dockerfile=backend/Dockerfile .

# 2. Deploy with Cloud SQL + Memorystore
gcloud run deploy athena-backend \
  --image gcr.io/PROJECT_ID/athena-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...,REDIS_URL=redis://...,ATHENA_API_KEY=...,GEMINI_API_KEY=...,ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Option D: VPS (Docker Compose)
```bash
# On your VPS:
git clone https://github.com/jmlus/athena.git
cd athena

# Create .env files from examples
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# Edit with your values
nano backend/.env
nano frontend/.env.production

# Build and run
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 2. Frontend Deployment

### Option A: Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from frontend directory
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard:
# VITE_ATHENA_API_BASE = https://your-backend.railway.app/api/v1/athena
# VITE_ATHENA_API_KEY = same-as-backend-ATHENA_API_KEY

# 4. Redeploy
vercel --prod
```

### Option B: Netlify
```bash
# 1. Build locally first to verify
cd frontend
pnpm build

# 2. Deploy via Netlify CLI or drag-and-drop dist/ folder
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# 3. Set environment variables in Netlify dashboard
```

### Option C: Cloudflare Pages
```bash
# 1. Connect GitHub repo in Cloudflare Pages dashboard
# 2. Build settings:
#    - Build command: pnpm --filter athena-frontend run build
#    - Output directory: frontend/dist
#    - Root directory: frontend
# 3. Environment variables:
#    - VITE_ATHENA_API_BASE
#    - VITE_ATHENA_API_KEY
```

### Option D: AI Studio (Frontend Only)
```bash
# 1. Build frontend locally
cd frontend
VITE_ATHENA_API_BASE=https://your-backend.railway.app/api/v1/athena \
VITE_ATHENA_API_KEY=your-api-key \
pnpm build

# 2. Upload dist/ folder to AI Studio as static assets
#    OR push to GitHub and import in AI Studio
```

### Option E: Docker (Self-hosted)
```bash
# Build with backend URL baked in
docker build \
  --build-arg VITE_ATHENA_API_KEY=your-api-key \
  -t athena-frontend \
  -f frontend/Dockerfile .

# Run with backend URL
docker run -d \
  -p 80:80 \
  -e ATHENA_BACKEND_URL=https://your-backend.railway.app \
  -e AISTUDIO_PREVIEW=false \
  athena-frontend
```

---

## 3. Environment Variable Reference

### Backend (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL + pgvector connection | `postgresql://user:pass@host:5432/athena` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `ATHENA_API_KEY` | Shared secret for API auth | `openssl rand -hex 32` |
| `SECRET_KEY` | Session/JWT signing | `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Google Gemini API key | From Google AI Studio |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `https://app.athena.com` |

### Frontend (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ATHENA_API_BASE` | Full backend API base URL | `https://api.athena.com/api/v1/athena` |
| `VITE_ATHENA_API_KEY` | Must match backend `ATHENA_API_KEY` | Same as backend |

### Frontend Docker (Optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `ATHENA_BACKEND_URL` | Backend URL for nginx proxy | `http://backend:8000` |
| `AISTUDIO_PREVIEW` | Allow framing in AI Studio | `false` |

---

## 4. Verify Deployment

```bash
# 1. Backend health
curl https://your-backend.railway.app/api/v1/athena/health

# 2. Frontend loads
curl -I https://your-frontend.vercel.app

# 3. API call from frontend works
# Open browser dev tools, check Network tab for /api/v1/athena/* calls

# 4. Test authenticated endpoint
curl -H "X-API-Key: your-api-key" \
  https://your-backend.railway.app/api/v1/athena/jobs
```

---

## 5. Custom Domains (Optional)

### Backend
- Railway: Settings → Domains → Add custom domain
- Fly.io: `fly certs add api.athena.yourdomain.com`
- Cloud Run: `gcloud run domain-mappings create --service=athena-backend --domain=api.athena.yourdomain.com`

### Frontend
- Vercel: Project Settings → Domains
- Netlify: Site Settings → Domain Management
- Cloudflare Pages: Custom Domains tab

**Update `ALLOWED_ORIGINS`** in backend after adding frontend domain.

---

## 6. Database Migrations

```bash
# Run migrations after backend deploy
# Railway:
railway run uv run alembic upgrade head

# Fly.io:
fly ssh console -C "uv run alembic upgrade head"

# Cloud Run:
gcloud run jobs execute migrate --region=us-central1 --wait

# Docker Compose:
docker-compose -f docker-compose.prod.yml exec backend uv run alembic upgrade head
```

---

## 7. Monitoring & Logs

| Platform | Logs | Metrics |
|----------|------|---------|
| Railway | `railway logs` | Dashboard |
| Fly.io | `fly logs` | `fly dashboard` |
| Cloud Run | Cloud Logging | Cloud Monitoring |
| Docker Compose | `docker-compose logs -f` | Prometheus/Grafana (add yourself) |

---

## 8. Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL exactly (including protocol)
- Check browser console for specific blocked origin

### API Calls Fail (401/403)
- Verify `VITE_ATHENA_API_KEY` in frontend matches `ATHENA_API_KEY` in backend
- Check `X-API-Key` header is being sent (Network tab)

### WebSocket/Long-polling Issues
- Increase proxy timeouts in nginx (Cloudflare: add Page Rule for WebSocket)
- Railway/Fly.io/Cloud Run handle this automatically

### Database Connection Fails
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- Check firewall/security groups allow backend → database
- Run migrations: `uv run alembic upgrade head`

---

## 9. CI/CD (GitHub Actions Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml
      - run: pnpm --filter athena-frontend install --frozen-lockfile
      - run: pnpm --filter athena-frontend run build
        env:
          VITE_ATHENA_API_BASE: ${{ secrets.VITE_ATHENA_API_BASE }}
          VITE_ATHENA_API_KEY: ${{ secrets.VITE_ATHENA_API_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
        env:
          VITE_ATHENA_API_BASE: ${{ secrets.VITE_ATHENA_API_BASE }}
          VITE_ATHENA_API_KEY: ${{ secrets.VITE_ATHENA_API_KEY }}
```

---

## Summary

| Component | Platform Options | Key Config |
|-----------|-----------------|------------|
| **Backend** | Railway, Fly.io, Cloud Run, VPS | `DATABASE_URL`, `ATHENA_API_KEY`, `GEMINI_API_KEY` |
| **Frontend** | Vercel, Netlify, Cloudflare Pages, AI Studio | `VITE_ATHENA_API_BASE`, `VITE_ATHENA_API_KEY` |
| **Database** | Managed Postgres (Neon, Supabase, Cloud SQL) + pgvector | Enable pgvector extension |
| **Cache** | Redis (Upstash, Railway, Fly.io, Memorystore) | `REDIS_URL` |

**Frontend talks to backend via `VITE_ATHENA_API_BASE`** — that's the only coupling between the two deployments.