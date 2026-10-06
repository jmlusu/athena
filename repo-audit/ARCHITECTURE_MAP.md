# ARCHITECTURE MAP — Current State

**Canonical architecture document:** `/ARCHITECTURE.md` (root) — CURRENT, accurate, v2.4.0.

---

## Source of Truth (established, not assumed)

| Concern | Canonical | Evidence |
|---|---|---|
| Overall architecture | `ARCHITECTURE.md` (root) | Self-declares "Source of truth: `backend/`, root `server.ts`/`src/`, `.github/workflows/`"; matches package.json v2.4.0 |
| Product spec | `ATHENA_MASTER_SPEC.md` | Named as spec of record by `ATHENA_AGENT_RULES.md` §1 |
| Backend (Python) | `backend/src/athena/` | Superset of all forks; has `ai/`, `adapters/`, `metrics/`, `lockfile.py`, `paths.py`; CI runs here |
| Frontend (React) | root `src/` | Referenced by `vite.config.ts`, `tsconfig.json`, ARCHITECTURE.md; brand = orange `#F97316` |
| BFF | `server.ts` | Express proxy + SPA host; imports `athena-mapper.ts` |
| Data mapping | `athena-mapper.ts` | Imported by `server.ts:7` and `tests/server/mapper.test.ts:22` |
| API contract | `backend/src/athena/api/{routes,ai_routes,schemas}.py` | 31 CRUD + AI endpoints |
| Model/provider config | `backend/src/athena/ai/providers/{base,factory,gemini,fallback}.py` | `AthenaAIProvider` ABC + factory |
| Memory / persistence | `backend/src/athena/store.py` (JSONL + filelock) | ARCHITECTURE.md §1 DATA layer; **no SQL database exists** |
| Agent behavior rules | `ATHENA_AGENT_RULES.md` | Existing equivalent of AGENTS.md |
| Env config (canonical) | `.env.example` (root) | Matches README + actual code paths |
| Env config (obsolete) | `backend/.env.production.example` | Describes DATABASE_URL/REDIS_URL/SMTP — **not implemented** |
| CI | `.github/workflows/ci.yml` | quality + backend-quality jobs |
| Tests (Python) | `backend/tests/` (16 files) | pytest testpaths=`["tests"]` from backend/ |
| Tests (Node) | `tests/server/mapper.test.ts` | `npm run test:unit` |
| Tests (E2E) | `e2e/` | `npm run test:e2e` |
| Brand (frontend) | `src/index.css` + Tailwind classes | `.font-brand`; orange gradient tokens |

---

## Actual Data / Control Flow

```
Browser (React SPA, src/)
   │  REST /api/*
   ▼
Express BFF (server.ts, :3000)  ── injects X-API-Key, no secrets client-side
   │  proxy /ai/* + /api/v1/athena/*
   ▼
FastAPI (backend/src/athena/api/app.py, :8000)
   │  middleware: CORS → rate-limit → X-API-Key → security headers
   ├── api/routes.py     (31 CRUD endpoints)
   ├── api/ai_routes.py  (AI endpoints + HITL submit gate)
   ├── metrics/prometheus.py (auth-exempt)
   ▼
Domain modules (backend/src/athena/)
   scrapers/ 14 sources · matching/ MiniLM-L6-v2 · ats/ 40-35-15-10
   documents/ docx+PDF+humanizer · automation/ Playwright + HITL gate
   ai/providers/ gemini⇄fallback · scheduler/ APScheduler 4h/30m/1d
   ▼
Data: JSONL + filelock (store.py) → company/athena/*.jsonl
      embeddings cache → company/athena/embeddings_cache/*.npy
      agent locks → artifacts/locks/*.lock
      applicant dossier → profile/  (gitignored, PII)
```

External: Google Gemini · HuggingFace sentence-transformers · n8n webhooks · 14 job boards.
No GraphQL/gRPC/WebSocket/queue. No SQL. No Redis.

---

## Competing Architecture Documents (must be reconciled)

| Document | Verdict | Reason |
|---|---|---|
| `ARCHITECTURE.md` (root) | **CANONICAL** | Current, code-accurate, v2.4.0 |
| `ATHENA_MASTER_SPEC.md` | KEEP (spec) | Product requirements, named spec of record |
| `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md` | ARCHIVE candidate | Predates current build; overlaps ARCHITECTURE.md |
| `docs/ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md` | ARCHIVE candidate | Target-implementation guide; superseded by code + ARCHITECTURE.md |
| `docs/audits/CODEBASE_AUDIT_MASTER_SPEC.md` | ARCHIVE candidate | Dated 2026-09-26 integration audit; historical |
| `docs/DATA_STORES.md` | KEEP (likely) | Data-layer reference — verify currency in Phase 4 |

---

## Note on Directive Sections 12–14 (not present in this repo)

| Directive concept | Reality in this repository |
|---|---|
| §12 "90/89 agents, 144/152/127" | **Zero occurrences** outside the directive file itself |
| §13 "AI Company Builder" | Separate repository: `C:\Users\jmlus\light-speed-holdings` (per `ROADMAP_STEP2_ANALYSIS.md:219`) |
| §14 "Lightspeed Memory (memory.db, FTS5, hash chain)" | **Does not exist here.** Persistence is JSONL + filelock (`store.py`). "Lightspeed" in this repo = company name only |
| §23 brand `#070A40/#E63946/#00BFFF` | Found **only in the stale `athena/` fork**; live frontend uses orange `#F97316/#EA580C` |
| §33 OmniRoute/local GGUF | OmniRoute is **PLANNED** (commented out in `factory.py:27`); implemented providers = gemini + rule-based fallback |

→ Sections 12, 13, 14 are marked N/A for this repository. Recorded in OPEN_QUESTIONS.md.
