# Athena — AI Provider Integration Documentation

**Date:** 2026-09-28  
**Version:** 1.0  
**Status:** Production-ready (provider abstraction complete, factory + fallback + Gemini implemented)

---

## 1. Architecture Overview

Athena uses a **provider abstraction pattern** to decouple AI-powered features from specific LLM vendors. The abstraction enables:
- Zero-configuration fallback (deterministic, no API key required)
- Hot-swappable providers via environment variable
- Consistent interface across all AI-powered endpoints
- Testability via mocked providers

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Endpoints (FastAPI)                  │
│  /ai/score-ats  /ai/tailor-resume  /ai/tailor-document ...  │
└─────────────────────────────┬───────────────────────────────┘
                              │ Depends(get_provider)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Provider Factory                         │
│  get_ai_provider() → AthenaAIProvider instance              │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  Gemini    │  │  Fallback  │  │  Future:   │
       │  Provider  │  │  Provider  │  │  OmniRoute │
       └────────────┘  └────────────┘  └────────────┘
```

---

## 2. Provider Interface (`AthenaAIProvider`)

**File:** `backend/src/athena/ai/providers/base.py`

All providers implement this abstract base class:

```python
class AthenaAIProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:              # "gemini" | "fallback" | "omniroute" ...
    
    @property
    @abstractmethod
    def is_available(self) -> bool:     # True if configured & ready
    
    @abstractmethod
    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse:
    
    @abstractmethod
    async def tailor_resume(self, request: TailorResumeRequest) -> TailorResumeResponse:
    
    @abstractmethod
    async def tailor_document(self, request: TailorDocumentRequest) -> TailorDocumentResponse:
    
    @abstractmethod
    async def dehumanize(self, request: DehumanizeRequest) -> DehumanizeResponse:
    
    @abstractmethod
    async def synthesize_listings(self, request: ScrapeLiveRequest) -> ScrapeLiveResponse:
    
    @abstractmethod
    async def dispatch_n8n(self, request: N8nDispatchRequest) -> N8nDispatchResponse:
    
    @abstractmethod
    async def submit_application(self, request: SubmitApplicationRequest) -> SubmitApplicationResponse:
    
    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
```

**Request/Response Schemas:** Defined in `backend/src/athena/api/ai_schemas.py`

---

## 3. Provider Implementations

### 3.1 FallbackProvider (Default — Zero Config)

**File:** `backend/src/athena/ai/providers/fallback.py`  
**Availability:** Always (`is_available = True`)  
**API Key Required:** No

Deterministic rule-based implementations for all 8 methods:

| Method | Implementation Strategy |
|--------|------------------------|
| `score_ats` | Keyword overlap ratio → base_score 68–97; match_category thresholds (≥90 CRITICAL, 80–89 FLAGGED, <80 STANDARD) |
| `tailor_resume` | Template with profile data; dehumanize flag controls summary tone |
| `tailor_document` | 3 document types (cover-letter, executive-summary, consultancy-proposal); template-based |
| `dehumanize` | Regex replacement of 6 AI tropes (delve→examine, spearhead→led, etc.) |
| `synthesize_listings` | 6 curated Lilongwe/Remote listings with realistic ATS scores |
| `dispatch_n8n` | Stub returning execution receipt with 4 simulated nodes |
| `submit_application` | Generates `ATH-RCPT-XXXXXX` + SHA-256 confirmation hash |
| `health_check` | Returns `{status: "ok", provider: "fallback", has_api_key: false}` |

**Use Case:** Development, CI, environments without API keys, graceful degradation.

---

### 3.2 GeminiProvider (Production — LLM-Powered)

**File:** `backend/src/athena/ai/providers/gemini.py`  
**Availability:** `is_available = bool(GEMINI_API_KEY)`  
**API Key Required:** Yes (`GEMINI_API_KEY` env var)  
**Model:** `gemini-3.8-flash` (configurable via `GEMINI_MODEL`)

**SDK:** `@google/genai` (v1.0.0+) — native async client

**Key Behaviors:**
- **Auto-fallback:** Every method wraps LLM call in try/except; on any exception → logs error → delegates to internal `FallbackProvider` instance
- **Structured Output:** Uses `response_mime_type="application/json"` + Pydantic schema validation
- **Prompt Engineering:** Ported verbatim from AI Studio `server.ts` with version headers
- **Temperature Tuning:** Per-method (0.3 for scoring, 0.4 for generation, 0.5 for synthesis)

**Method-Specific Details:**

| Method | Prompt Strategy | Temperature | Fallback Trigger |
|--------|----------------|-------------|------------------|
| `score_ats` | ATS algorithmic evaluator + executive hiring partner | 0.3 | No key, API error, JSON parse fail |
| `tailor_resume` | Executive resume writer; dehumanize instruction injected | 0.4 | Same |
| `tailor_document` | Executive career strategist; doc-type specific templates | 0.4 | Same |
| `dehumanize` | World-class editor removing AI tells | 0.3 | Same |
| `synthesize_listings` | Realistic job generation with platform diversity | 0.5 | Same |
| `dispatch_n8n` | Delegates to fallback (stub) | N/A | Always |
| `submit_application` | Delegates to fallback (receipt gen) | N/A | Always |
| `health_check` | Returns model + key presence | N/A | N/A |

---

## 4. Factory & Configuration

**File:** `backend/src/athena/ai/providers/factory.py`

### 4.1 `get_ai_provider(provider_name: Optional[str] = None) → AthenaAIProvider`

Primary entry point used by FastAPI dependency injection.

```python
def get_ai_provider(provider_name: Optional[str] = None) -> AthenaAIProvider:
    name = (provider_name or os.environ.get("ATHENA_AI_PROVIDER", "fallback")).lower()
    
    if name == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY")
        model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
        return GeminiProvider(api_key=api_key, model=model)
    
    # Future providers:
    # elif name == "omniroute": return OmniRouteProvider(...)
    # elif name == "local": return LocalProvider(...)
    
    return FallbackProvider()  # Default
```

### 4.2 `create_provider(provider_type: str, api_key: Optional[str] = None, model: Optional[str] = None, **kwargs) → AthenaAIProvider`

Explicit constructor for testing and programmatic use.

```python
def create_provider(
    provider_type: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    **kwargs,
) -> AthenaAIProvider:
    if provider_type == "gemini":
        return GeminiProvider(api_key=api_key, model=model or "gemini-3.8-flash")
    elif provider_type == "fallback":
        return FallbackProvider()
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")
```

### 4.3 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ATHENA_AI_PROVIDER` | No | `fallback` | Provider selector: `gemini` \| `fallback` |
| `GEMINI_API_KEY` | For Gemini | — | Server-side only; never exposed to frontend |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Model override |

**Security Note:** `GEMINI_API_KEY` is read only in backend process. Frontend never receives it. Docker Compose injects via `${GEMINI_API_KEY:-}`.

---

## 5. FastAPI Integration

**File:** `backend/src/athena/api/ai_routes.py`

### 5.1 Dependency Injection

```python
async def get_provider() -> AthenaAIProvider:
    """Dependency to get configured AI provider."""
    return get_ai_provider()
```

Used in all 8 endpoints:

```python
@router.post("/score-ats", response_model=ATSScoreResponse)
async def score_ats(
    request: ATSScoreRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> ATSScoreResponse:
    try:
        return await provider.score_ats(request)
    except Exception as e:
        raise HTTPException(500, f"ATS scoring failed: {str(e)}")
```

### 5.2 Endpoint Registry (in `app.py`)

```python
from athena.api.ai_routes import router as ai_router

app.include_router(ai_router, prefix="/api/v1/athena")
```

**Resulting Paths:** `/api/v1/athena/ai/*`

---

## 6. Adding a New Provider

### 6.1 Implementation Checklist

1. **Create provider file:** `backend/src/athena/ai/providers/<name>.py`
2. **Inherit `AthenaAIProvider`** and implement all 9 abstract methods
3. **Add auto-fallback pattern** (wrap LLM calls, delegate to `FallbackProvider` on error)
4. **Add health_check** returning provider name, availability, config
5. **Register in factory:** Add `elif` branch in `get_ai_provider()`
6. **Add environment variables** to `.env.example` and `docker-compose.yml`
7. **Write tests** in `backend/tests/test_ai_providers.py`
8. **Update this documentation**

### 6.2 Example: OmniRoute Provider Skeleton

```python
# backend/src/athena/ai/providers/omniroute.py
from athena.ai.providers.base import AthenaAIProvider
from athena.ai.providers.fallback import FallbackProvider
from athena.api.ai_schemas import *


class OmniRouteProvider(AthenaAIProvider):
    def __init__(self, api_key: str, base_url: str = "https://api.omniroute.ai"):
        self._api_key = api_key
        self._base_url = base_url
        self._fallback = FallbackProvider()

    @property
    def name(self) -> str:
        return "omniroute"

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse:
        try:
            # HTTP call to OmniRoute API
            return await self._call_omniroute("/score-ats", request.model_dump())
        except Exception:
            return await self._fallback.score_ats(request)

    # ... implement remaining 7 methods with same pattern

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "ok" if self.is_available else "degraded",
            "provider": self.name,
        }
```

### 6.3 Factory Registration

```python
# In factory.py
def get_ai_provider(provider_name: Optional[str] = None) -> AthenaAIProvider:
    name = (provider_name or os.environ.get("ATHENA_AI_PROVIDER", "fallback")).lower()

    if name == "gemini":
        ...
    elif name == "omniroute":  # NEW
        api_key = os.environ.get("OMNIROUTE_API_KEY")
        base_url = os.environ.get("OMNIROUTE_BASE_URL")
        return OmniRouteProvider(api_key=api_key, base_url=base_url)
    # ...
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Required per Phase 14)

**File:** `backend/tests/test_ai_providers.py`

| Test Target | Approach |
|-------------|----------|
| `FallbackProvider` | Direct instantiation; test all 8 methods with known inputs → assert deterministic outputs |
| `GeminiProvider` | Mock `genai.Client`; test success path + fallback trigger on exception |
| `get_ai_provider()` | Test env var selection; test explicit override; test unknown provider → fallback |
| `create_provider()` | Test both types; test ValueError on unknown |

### 7.2 Integration Tests

**File:** `backend/tests/test_ai_routes.py`

- Test all 8 endpoints via `TestClient`
- Verify `X-API-Key` auth on mutating endpoints
- Verify fallback behavior when `ATHENA_AI_PROVIDER=fallback`
- Verify response schemas match `ai_schemas.py`

### 7.3 Test Fixtures

```python
# conftest.py or test file
@pytest.fixture
def fallback_provider():
    return FallbackProvider()


@pytest.fixture
def mock_gemini_provider(monkeypatch):
    # Mock genai.Client to return controlled responses
    pass


@pytest.fixture
def client():
    return TestClient(create_app())
```

---

## 8. Operational Guidelines

### 8.1 Provider Selection by Environment

| Environment | Recommended Provider | Rationale |
|-------------|---------------------|-----------|
| Local Dev | `fallback` | Zero config; deterministic for UI dev |
| CI/CD | `fallback` | No secrets needed; fast; reliable |
| Staging | `gemini` | Real LLM validation; requires `GEMINI_API_KEY` secret |
| Production | `gemini` | Full AI quality; requires `GEMINI_API_KEY` secret |

### 8.2 Monitoring & Health Checks

- **Endpoint:** `GET /api/v1/athena/ai/health`
- **Response:** `{status, provider, has_api_key, model?, timestamp}`
- **Alerting:** If `status != "ok"` or `has_api_key == false` in prod → alert

### 8.3 Fallback Behavior Contract

| Scenario | Behavior |
|----------|----------|
| No `GEMINI_API_KEY` set | Factory returns `FallbackProvider` automatically |
| `GEMINI_API_KEY` invalid | `GeminiProvider.is_available = False` → factory falls back |
| LLM API error (timeout, 5xx, quota) | Method catches exception → logs → delegates to fallback |
| JSON parse failure | Method catches exception → logs → delegates to fallback |
| Rate limit | Same as API error → fallback |

**Guarantee:** All 8 methods **always return a valid response** (never 500 to caller due to provider failure).

---

## 9. Migration & Compatibility

### 9.1 AI Studio → OpenCode Mapping

| AI Studio (`server.ts`) | OpenCode (`ai_routes.py`) | Notes |
|------------------------|---------------------------|-------|
| `POST /api/ai/score-ats` | `POST /api/v1/athena/ai/score-ats` | Path prefix added |
| `POST /api/ai/tailor-resume` | `POST /api/v1/athena/ai/tailor-resume` | Path prefix added |
| `POST /api/ai/tailor-document` | `POST /api/v1/athena/ai/tailor-document` | Path prefix added |
| `POST /api/ai/dehumanize` | `POST /api/v1/athena/ai/dehumanize` | Path prefix added |
| `POST /api/ai/scrape-live` | `POST /api/v1/athena/ai/scrape-live` | Deprecated; kept for parity |
| `POST /api/n8n/dispatch-webhook` | `POST /api/v1/athena/ai/n8n/dispatch` | Renamed + prefixed |
| `POST /api/submit-application` | `POST /api/v1/athena/ai/submit-application` | Path prefix added |

### 9.2 Prompt Preservation

All Gemini prompts ported **verbatim** from AI Studio `server.ts` with only:
- String interpolation updates for Python f-strings
- Addition of `version_headers` comment for traceability
- Temperature values preserved exactly

---

## 10. Troubleshooting

| Symptom | Diagnosis | Resolution |
|---------|-----------|------------|
| All endpoints return fallback responses | `GEMINI_API_KEY` not set or invalid | Set valid key in env; restart backend |
| `health_check` shows `has_api_key: false` | Key not loaded in process | Check `.env` / Docker Compose env injection |
| `score_ats` returns `STANDARD` for perfect match | Fallback keyword logic is substring-based | Expected for fallback; use Gemini for semantic scoring |
| `tailor_resume` ignores `dehumanize=False` | Fallback always uses dehumanized summary | Expected for fallback; use Gemini for conditional |
| 500 error from AI endpoint | Uncaught exception in provider | Check backend logs; all methods should catch + fallback |

---

## 11. Future Provider Roadmap

| Provider | Status | Blockers |
|----------|--------|----------|
| **OmniRoute** | Planned | API access; pricing |
| **OpenAI (GPT-4o)** | Planned | Cost; latency |
| **Local (Ollama/Llama.cpp)** | Planned | Hardware; model management |
| **Anthropic (Claude)** | Planned | Cost; API access |

Each follows the same integration pattern documented in §6.

---

**Document Owner:** QA Lead / Backend Team  
**Review Cycle:** Per provider addition or major version change  
**Cross-References:** `backend/src/athena/ai/providers/`, `backend/src/athena/api/ai_routes.py`, `backend/tests/test_ai_providers.py`, `backend/tests/test_ai_routes.py`