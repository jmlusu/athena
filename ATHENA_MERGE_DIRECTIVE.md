# ATHENA — Merge Directive

**Authority:** This directive governs the integration of the AI Studio Athena implementation into the canonical OpenCode repository.

**Canonical Repository:** `github.com/jmlus/athena` (OpenCode) — **System of Record**  
**Source to Integrate:** `C:\Users\jmlus\Downloads\athena-ai-studio-integration` (AI Studio export) — **Capability Donor**

---

## 1. Governance Model

| Role | Responsibility |
|------|----------------|
| **Lead Architect** (this agent) | Owns merge plan, decisions, final integration report |
| **OpenCode Repo** | System of record — all merges target `main` via `integration/athena-ai-studio` branch |
| **AI Studio Export** | Read-only source — never modified, only referenced |

**Decision Log:** `docs/integration/MERGE_DECISIONS.md` — every capability classified, every decision traceable.

---

## 2. Classification Taxonomy

Every major capability from either implementation receives exactly one classification:

| Classification | Meaning | Action |
|----------------|---------|--------|
| `KEEP_EXISTING` | OpenCode version is complete, tested, production-ready; AI Studio has no equivalent or inferior | Retain OpenCode; ignore AI Studio |
| `KEEP_AI_STUDIO` | AI Studio version is complete, unique, high-value; OpenCode has no equivalent or broken | Port AI Studio into OpenCode architecture |
| `MERGE` | Both have partial/complementary implementations | Fuse best parts; create unified implementation |
| `REFACTOR` | Both have implementations but both need improvement | Redesign from scratch per spec |
| `DEPRECATE` | Capability exists but is obsolete, broken, or superseded | Remove after documenting rationale |
| `UNKNOWN` | Insufficient information to classify | Document uncertainty; defer decision |

---

## 3. Integration Branch Protocol

```bash
# Create once, preserve main
git checkout main
git pull origin main
git checkout -b integration/athena-ai-studio
# All integration work happens here
# No force-push, no history rewrite
# PR created against main when Definition of Done met
```

---

## 4. Integration Sequence (Phased)

| Phase | Focus | Validation Gate |
|-------|-------|-----------------|
| 1 | Configuration & Environment | `.env.example` complete, no secret leaks |
| 2 | Dependencies | `pnpm install` + `uv sync` clean |
| 3 | Types & Schemas | Shared Pydantic/TS types, no `any` |
| 4 | Core Architecture | FastAPI router structure, provider abstraction |
| 5 | UI Components | Brand tokens, accessibility, react-router routes |
| 6 | Frontend Routes | All AI Studio views mapped to `/athena/*` |
| 7 | Backend Services | Store, scheduler, scrapers untouched |
| 8 | API Endpoints | New `/api/v1/athena/ai/*` router added |
| 9 | AI Providers | Gemini router + fallbacks + abstraction layer |
| 10 | Agents/Orchestration | Scheduler + n8n + sign-off gate wired |
| 11 | Data Models | Adapters for `Opportunity ↔ Job`, `PipelineStatus ↔ JobStatus` |
| 12 | Authentication | `X-API-Key` on new mutating endpoints |
| 13 | External Integrations | n8n webhook, future provider hooks |
| 14 | Tests | Backend + frontend tests for new code |
| 15 | Deployment | Docker, compose, CI updated |

**After EACH phase:** `build` → `test` → `inspect` → `commit`

---

## 5. Preservation Rules (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| OpenCode scraper engine (14 scrapers) stays | `KEEP_EXISTING` — AI Studio has zero real scrapers |
| OpenCode persistence (JSONL + filelock) stays | `KEEP_EXISTING` — AI Studio has zero persistence |
| OpenCode ATS scorer (heuristic) stays | `KEEP_EXISTING` — actually wired end-to-end |
| OpenCode security stack stays | `KEEP_EXISTING` — AI Studio has no auth |
| OpenCode scheduler (APScheduler) stays | `KEEP_EXISTING` — AI Studio is client-side simulation |
| OpenCode test suite stays | `KEEP_EXISTING` — AI Studio has zero tests |
| OpenCode CI/CD stays | `KEEP_EXISTING` — AI Studio has zero CI |
| OpenCode DOCX generation stays | `KEEP_EXISTING` — AI Studio is HTML/print only |

---

## 6. Integration Targets (AI Studio → OpenCode)

| AI Studio Capability | Target Location | Classification |
|---------------------|-----------------|----------------|
| Gemini ATS scoring endpoint | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/score-ats` | `KEEP_AI_STUDIO` (unique, no OpenCode equivalent) |
| Resume tailoring (1/2-col, HTML) | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/tailor-resume` + `documents/generator.py` enhancement | `MERGE` (OpenCode has DOCX, AI Studio has format quality) |
| Cover letter / proposal / exec summary | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/tailor-document` | `KEEP_AI_STUDIO` (OpenCode has cover-letter only) |
| Dehumanizer endpoint | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/dehumanize` + `documents/humanizer.py` | `MERGE` (OpenCode has broken LLM path) |
| Live scraper synthesis | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/scrape-live` | `DEPRECATE` (OpenCode has real scrapers) |
| n8n webhook dispatcher | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/n8n/dispatch` | `KEEP_AI_STUDIO` (OpenCode has zero n8n) |
| Application submission + receipt | `backend/src/athena/api/ai_routes.py` → `/api/v1/athena/ai/submit-application` | `MERGE` (OpenCode has browser submitter, AI Studio has contract) |
| Document Studio view | `frontend/src/pages/athena/DocumentStudio.tsx` (new route) | `KEEP_AI_STUDIO` (superior UX, print-optimized) |
| Receipts & Follow-up Ledger | `frontend/src/pages/athena/Receipts.tsx` (new route) | `KEEP_AI_STUDIO` (OpenCode has empty fields only) |
| Form Filler + Sign-Off modal | `frontend/src/components/athena/FormFillerModal.tsx` | `KEEP_AI_STUDIO` (only working gate) |
| n8n Integration view | `frontend/src/pages/athena/N8nIntegration.tsx` (new route) | `KEEP_AI_STUDIO` (OpenCode has zero n8n) |
| Left/Right Sidebar brand | `frontend/src/components/athena/AthenaLayout.tsx` enhancement | `MERGE` (brand tokens + automation controls) |
| Scope taxonomy (Lilongwe/Remote) | `backend/src/athena/models/enums.py` + frontend filters | `KEEP_AI_STUDIO` (domain-specific, not in OpenCode) |
| 4h Cron countdown UI | `frontend/src/components/athena/CronCountdown.tsx` | `KEEP_AI_STUDIO` (OpenCode has scheduler but no countdown UI) |
| Brand tokens (Cinzel/Lora, Navy/Red/Cyan/Orange) | `frontend/src/index.css` + Tailwind config | `KEEP_AI_STUDIO` (OpenCode has utility theme only) |

---

## 7. Data Model Reconciliation

### PipelineStatus (AI Studio) → JobStatus (OpenCode) Mapping

| AI Studio `PipelineStatus` | OpenCode `JobStatus` | Notes |
|---------------------------|---------------------|-------|
| `discovered` | `NEW`, `FETCHED` | Initial scrape results |
| `evaluated` | `MATCHED`, `SCORED` | After matching/scoring |
| `tailored` | (no direct equivalent) | Documents generated |
| `awaiting_signoff` | `FLAGGED` | Human review queue |
| `submitted` | `APPLIED` | After sign-off |
| `interview` | `INTERVIEW` | Direct mapping |
| `offer` | `OFFER` | Direct mapping |

**Required:** Explicit mapping table in code (`backend/src/athena/models/status_mapping.py`) before any data merge.

---

## 8. AI Provider Abstraction Requirement

All new AI endpoints MUST use the provider abstraction:

```python
# backend/src/athena/ai/providers/base.py
class AthenaAIProvider(ABC):
    @abstractmethod
    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse: ...
    @abstractmethod
    async def tailor_resume(self, request: TailorResumeRequest) -> TailoredResume: ...
    @abstractmethod
    async def tailor_document(self, request: TailorDocumentRequest) -> TailoredDocument: ...
    @abstractmethod
    async def dehumanize(self, request: DehumanizeRequest) -> DehumanizeResponse: ...
    @abstractmethod
    async def synthesize_listings(self, request: ScrapeLiveRequest) -> ListingsResponse: ...

# backend/src/athena/ai/providers/gemini.py
class GeminiProvider(AthenaAIProvider): ...

# backend/src/athena/ai/providers/fallback.py
class FallbackProvider(AthenaAIProvider): ...  # deterministic, no key needed
```

**Factory:** `get_ai_provider()` reads `ATHENA_AI_PROVIDER` env (`gemini`, `omniroute`, `local`, `fallback`).

---

## 9. Secrets Management

| Secret | Location | Rule |
|--------|----------|------|
| `GEMINI_API_KEY` | Backend `.env` only | Never in frontend bundle, never in repo |
| `ATHENA_API_KEY` | Backend `.env` + Frontend `VITE_ATHENA_API_KEY` (build-time) | Frontend key is public-facing dev key only |
| n8n webhook URL | Backend `.env` + Frontend settings | Not a secret, but configurable |
| All others | `.env` / `.env.example` | Document every var |

---

## 10. Rollback Protocol

If integration breaks `main`:
1. `git revert` the merge commit on `main`
2. Fix on `integration/athena-ai-studio`
3. Re-validate all gates
4. Re-merge

**Never force-push `main`. Never rewrite history.**