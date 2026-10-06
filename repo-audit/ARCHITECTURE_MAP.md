# ARCHITECTURE MAP — Current State (refreshed Phase 1)

**Canonical architecture document:** `/ARCHITECTURE.md` (root) — CURRENT, accurate, v2.4.0 (drift rows listed below are doc-fix items, not competing sources).
**Baseline:** `d674075`.

---

## Source of Truth (verified against tree)

| Concern | Canonical | Evidence / notes |
|---|---|---|
| Overall architecture | `ARCHITECTURE.md` (root) | Self-declares source of truth; v2.4.0 |
| Product spec | `ATHENA_MASTER_SPEC.md` | Named spec of record — **but STALE: see DOCUMENTATION_AUDIT A11–A17 (R3 to update)** |
| Backend (Python) | `backend/src/athena/` | 48 src files; CI runs here; no forks remain (stale `athena/` deleted in `568cead`) |
| Frontend (React) | root `src/` | 23 files; brand orange `#F97316` |
| BFF | `server.ts` | Express proxy + SPA host; imports `athena-mapper.ts:7` |
| Data mapping | `athena-mapper.ts` | Consumers: `server.ts:7`, `tests/server/mapper.test.ts:22` |
| API contract | `backend/src/athena/api/{routes,ai_routes,schemas}.py` | **46 endpoints total** (36 CRUD + 9 AI + metrics + health) — docs saying "31" are stale (A5) |
| Model/provider config | `ai/providers/{base,factory,gemini,fallback}.py` | ABC + factory; impls = gemini + rule-based fallback; OmniRoute PLANNED only |
| Persistence | `backend/src/athena/store.py` (JSONL + filelock) | **No SQL/Redis/queue exists** (DATA_STORES A26 fixed accordingly) |
| Agent behavior rules | `AGENTS.md` | Renamed from `ATHENA_AGENT_RULES.md` in `be31414` |
| Cleanup governance | `ATHENA PHASED APPROVAL & ROLLBACK PROTOCOL.md` | R0–R5; pinned at root by `AGENTS.md:167` + `health.mjs:45` |
| Env config (canonical) | `.env.example` (root) | Incomplete: missing `ATHENA_AI_PROVIDER` etc. (C1) |
| Env config (backend prod) | `backend/.env.production.example` | **Rewritten to reality** (states "NO PostgreSQL/Redis/SMTP"); no longer the obsolete DATABASE_URL doc |
| CI | `.github/workflows/{ci,e2e}.yml` + `dependabot.yml` | 3 jobs: quality, backend-quality, health |
| Tests (Python) | `backend/tests/` (**14** files) | pytest testpaths=`["tests"]`; 102 pass + 8 GTK-gated skip |
| Tests (Node) | `tests/server/mapper.test.ts` (1 file, 58 tests) | `npm run test:unit` |
| Tests (E2E) | `e2e/` (config + 2 specs, 66 cases × 3 browsers) | 57/66 pass, 3 pre-existing failures |
| Audit record | `repo-audit/` (11 files) | This phase regenerated 7 deliverables; archive copy in `docs/archive/repo-audit/` |

---

## Actual Data / Control Flow (verified)

```
Browser (React SPA, src/)
   │  REST /api/* (relative — src/api.ts:41)
   ▼
Express BFF (server.ts, :3000, binds 0.0.0.0) ── injects X-API-Key server-side only
   │  proxy /ai/* + /api/v1/athena/* + /api/lock/* + /api/submit-application
   ▼
FastAPI (backend/src/athena/api/app.py, :8000)
   │  CORS → rate-limit → X-API-Key (MUTATIONS ONLY, app.py:344) → security headers
   ├── api/routes.py (36 CRUD) · api/ai_routes.py (9 AI + HITL gate) · metrics/prometheus.py
   ▼
Domain modules: scrapers/ 14 sources · matching/ MiniLM · ats/ 40-35-15-10
   documents/ generator+parser (humanizer.py = DEAD, see DUPLICATES D3)
   automation/ Playwright (UNREACHABLE, see DEAD_CODE DC5) · scheduler/ 4h/30m/1d
   adapters/ (ORPHAN, DEAD_CODE DC4) · ai/providers/ gemini⇄fallback
   ▼
Data: JSONL + filelock → company/athena/*.jsonl (gitignored)
      embeddings cache → company/athena/embeddings_cache/*.npy
      agent locks → artifacts/locks/*.lock · profile/ (gitignored, PII)
```

External: Google Gemini · HuggingFace sentence-transformers · n8n webhook (literal in `fallback.py:447`, C3) · 14 job boards.
No GraphQL/gRPC/WebSocket/queue/SQL/Redis.

**Accuracy exceptions found this phase** (docs claim live, code says otherwise):
1. `documents/humanizer.py` — zero callers; live dehumanize path = AI provider (A6/D3).
2. `automation/` — 1,827 LOC never imported; submitter explicitly "no actual submission" (A7/DC5).
3. `adapters/ai_studio.py` — zero importers (A8/DC4).
4. Locks: two namespaces (Python `company/athena/locks/`, Node `artifacts/locks/`) — root ARCHITECTURE:61 blurs them (A29).

---

## Competing docs verdicts (updated)

| Document | Verdict |
|---|---|
| `ARCHITECTURE.md` (root) | **CANONICAL** — fix A5–A9 rows |
| `ATHENA_MASTER_SPEC.md` | KEEP as spec, **UPDATE stale sections (R3)** |
| `docs/DATA_STORES.md` | KEEP + fix A26/A27/A28 |
| `docs/archive/PRS_TRACEABILITY_MATRIX.md` | **ARCHIVED 2026-10-07** (mapped deleted `frontend/` tree) |
| `docs/agent-authority-matrix.md` | ORPHAN — cross-link/merge into PROTOCOL (D14, R2) |
| `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md`, `ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md`, `docs/audits/*` | Already in `docs/archive/` — no action |
| `repo-audit/DIRECTIVE_SOURCE.md` | Historical directive record; superseded in practice by the PROTOCOL |

## Directive sections 12–14 (unchanged finding)

§12 (90-agent model), §13 (AI Company Builder — separate repo `light-speed-holdings`), §14 (Lightspeed Memory/FTS5) — **zero occurrences here**; persistence is JSONL+filelock. §23 old brand palette lives nowhere in live code. §33 OmniRoute = PLANNED (factory comment now only a docstring in `base.py:27` — the old "factory.py:27 comment" claim is stale). Marked N/A; recorded in OPEN_QUESTIONS Q1.
