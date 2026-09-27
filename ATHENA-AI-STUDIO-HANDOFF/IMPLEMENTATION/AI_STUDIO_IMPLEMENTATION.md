# Athena — AI Studio Prototype Implementation Reference

> **Category**: Engineering Implementation Reference  
> **Extraction Source**: `package.json`, `server.ts`, `vite.config.ts`, `tsconfig.json`, `src/**/*`  
> **Notice**: This document describes how the AI Studio prototype currently operates. **Do not blindly copy this scaffolding into OpenCode.** Adapt these concepts to OpenCode's production architecture.  

---

## 1. Prototype Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Single Node.js Process (Port 3000)           │
│                                                             │
│   ┌────────────────────────┐    ┌───────────────────────┐   │
│   │ Express HTTP Server    │    │ Vite Dev Middleware   │   │
│   │ (server.ts)            │    │ (vite.middlewares)    │   │
│   │                        │    │                       │   │
│   │ • /api/health          │    │ • React 19 SPA        │   │
│   │ • /api/ai/score-ats    │    │ • Tailwind CSS v4     │   │
│   │ • /api/ai/tailor-resume│    │ • Lucide Icons        │   │
│   │ • /api/ai/scrape-live  │    │ • Lucide Charts       │   │
│   │ • /api/submit-applic...│    │ • Modal Managers      │   │
│   └────────────────────────┘    └───────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Runtime**: Node.js 22 (ES Modules)
- **Frontend Stack**: React 19, TypeScript 5.8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React Icons
- **Backend Stack**: Express 4.21, `@google/genai` SDK for Gemini 3.8 Flash LLM server-side routes
- **Build / Packaging**: `npm run build` runs `vite build` followed by `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs`
- **Development Script**: `tsx server.ts` binds to `http://0.0.0.0:3000`

---

## 2. Server Routes Reference (`server.ts`)

| HTTP Method | Route | Description | Fallback Behavior |
|---|---|---|---|
| `GET` | `/api/health` | Service health check | Returns status ok and timestamp |
| `POST` | `/api/ai/score-ats` | Evaluates job listing against applicant profile using Gemini | Rule-based semantic overlap calculation if key is absent |
| `POST` | `/api/ai/tailor-resume` | Generates tailored 1-col or 2-col resume JSON | Curated executive resume template |
| `POST` | `/api/ai/tailor-document` | Tailors cover letter or consultancy proposal JSON | Structured multi-paragraph letter/proposal template |
| `POST` | `/api/ai/dehumanize` | Purges robotic AI filler words and returns humanized text | Regex keyword purge |
| `POST` | `/api/ai/scrape-live` | Live crawler synthesis across Lilongwe & Global feeds | 6-opportunity curated Malawi & Global database |
| `POST` | `/api/n8n/dispatch-webhook` | Simulates/dispatches n8n webhook payload | Execution receipt with node timings |
| `POST` | `/api/submit-application` | Validates human signature and produces SHA-256 confirmation receipt | Standard validated receipt response |

---

## 3. Environment Variables Reference

Defined in `.env.example`:
```env
AISTUDIO_PREVIEW=
ATHENA_API_KEY=
ATHENA_AUTH_MODE=
ATHENA_CORS_ORIGINS=
ATHENA_DATA_DIR=
ATHENA_DEFAULT_SCRAPE_LOCATION=
ATHENA_DEFAULT_SCRAPE_MAX=
ATHENA_DEFAULT_SCRAPE_QUERY=
ATHENA_RATE_LIMIT=
ATHENA_SCHEDULER_AUTOSTART=
GEMINI_API_KEY=
HOST=
VITE_ATHENA_API_BASE=
VITE_ATHENA_API_KEY=
```
