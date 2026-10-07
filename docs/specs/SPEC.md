# Spec: Athena Platform

## Objective

Athena is an autonomous job-discovery, matching, and application platform for white-collar professionals operating in Lilongwe, Malawi and international remote markets. It combines multi-source job scraping (14 scrapers), semantic embedding matching, heuristic ATS scoring, generative AI document tailoring, "dehumanizer" AI-tell removal, mandatory human-in-the-loop sign-off, cryptographic receipt ledger, n8n workflow orchestration, and a background scheduler.

The frontend is a React SPA (Vite + TS + React 19) served by a Node BFF (via server.ts) that proxies to a FastAPI backend (Python 3.12+). The backend owns the canonical data models; the frontend mirrors types via `athena-mapper.ts` and `api.ts`.

**Success criteria:**
- New features follow the established architecture (frontend → backend → data layer)
- Status mapping between AI Studio PipelineStatus and OpenCode JobStatus is consistent across all layers
- No new runtime dependencies are added without review; existing tooling (ruff, mypy, tsc) remains clean

## Tech Stack

| Layer | Language/Framework | Key Dependencies |
|-------|-------------------|------------------|
| Frontend | TypeScript, React 19, Vite 8 | lucide-react, express, esbuild |
| BFF | TypeScript, Node ESM | dotenv, chokidar |
| Backend | Python 3.12+, FastAPI | fastapi, uvicorn, pydantic, apscheduler, google-genai, sentence-transformers, playwright, filelock |
| Mapping | TypeScript | custom athena-mapper.ts |
| Testing | Node `node --test`, pytest | @types/*, pytest-asyncio, ruff, mypy |

## Commands

| Action | Command |
|--------|---------|
| Build | `npm run build` |
| Dev | `npm run dev` |
| Lint | `npm run lint` |
| Test:unit (frontend) | `npm run test:unit` |
| Test:unit (backend) | `cd backend && uv run pytest -q` |
| Ruff check (backend) | `cd backend && uv run ruff check .` |
| Typecheck (backend mypy) | `cd backend && uv run mypy .` |
| E2E | `npm run test:e2e` |

## Project Structure

```
athena/
├── src/                           Frontend source code
│   ├── App.tsx                    Root component with routing & state
│   ├── main.tsx                   Entry point
│   ├── api.ts                     Fetch wrappers for all /api/* calls
│   ├── types.ts                   Shared TypeScript interfaces (mirrors backend)
│   ├── components/                React components (layout, views, modals, charts)
│   ├── data/                      Mock data & static utilities
│   ├── lib/                       Shared utilities (formatPeriod, toIsoDate, etc.)
│   └── index.css                  Global styles (Tailwind v4 + design tokens)
├── backend/                       Python backend
│   ├── src/athena/                Canonical Python source
│   │   ├── ai/                    Provider abstraction (Gemini server-side only)
│   │   ├── api/                   FastAPI routers (<=46 endpoints)
│   │   ├── ats/                   ATS scoring logic
│   │   ├── matching/              Semantic matching
│   │   ├── scrapers/              14 scrapers + Playwright fallback
│   │   ├── store.py               JSONL + filelock persistence
│   │   ├── models/                SQLModel/ORM models + enums.py
│   │   ├── scheduler/             APScheduler integration
│   │   └── automation/            n8n webhook dispatch
│   ├── pyproject.toml             Python deps + ruff/mypy config
│   └── tests/                     pytest tests (unit + integration)
├── tasks/                         Task lists and plans (created per feature)
│   ├── plan.md                    Implementation plan
│   └── todo.md                    Ordered task list
├── athena-mapper.ts               Status mapping TS ↔ Python types (STATUS_MAP)
├── server.ts                      BFF/Proxy (serves built SPA + proxies /api)
├── package.json                   Node deps + scripts
├── .env.example                   Single canonical env example
├── vite.config.ts                 Vite config + SSR
└── .github/                       CI workflows
```

## Code Style

### TypeScript (frontend + BFF)

- `npm run lint` = `tsc --noEmit` must pass with zero errors
- No `// TODO: fix later` comments in production code
- Imports ordered: external > internal > types
- Components: PascalCase, functional components with hooks, TypeScript strict mode
- Naming: camelCase variables/functions, PascalCase components, UPPER_SNAKE_CASE constants
- 100-char line limit (matches ruff config)
- Double quotes for strings
- LF line endings

**Example** (`src/api.ts`):

```ts
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: res.statusText }))) as { detail?: unknown };
    throw new Error(formatDetail(err.detail) || `HTTP ${res.status}`);
  }
  return res.json();
}
```

### Python (backend)

- `cd backend && uv run ruff check .` must pass with zero **new** errors (80 pre-existing tolerated by CI)
- `cd backend && uv run mypy .` must pass with `disallow_untyped_defs`, `strict_optional`, `warn_return_any`
- Line length: 100 chars (ruff config)
- Double quotes for strings
- LF line endings
- Type annotations on all public functions; `Optional[...]` where applicable

**Example** (`backend/src/athena/models/status_mapping.py`):

```py
def pipeline_to_job_status(pipeline_status: str) -> JobStatus:
    """Convert AI Studio PipelineStatus to OpenCode JobStatus."""
    return PIPELINE_TO_JOB_STATUS.get(pipeline_status, JobStatus.NEW)
```

## Testing Strategy

| Layer | Framework | Location | Coverage Target |
|-------|-----------|----------|-----------------|
| Backend unit/integration | pytest | `backend/tests/` | ≥80% |
| Frontend/BFF unit | `node --test` | `tests/server/*.test.ts` | ≥70% |
| E2E (critical flows) | Playwright | `e2e/` | Core flows (login, scrape, apply) |
| Lint/Format | ruff + tsc --noEmit | repo-wide | Clean (no new errors) |

**Test isolation:**
- Frontend tests use real API mocks via `api.ts`; never import mockData directly
- Backend tests use in-memory SQLite or test JSONL files; no external API keys required
- E2E tests require services running (or are skipped with `SKIP_E2E=1`)

**Verification:** All test suites must pass locally before commit. CI gates must pass.

## Boundaries

### Always do:
- Run `npm run test:unit` and `cd backend && uv run pytest -q` before commit
- Follow naming conventions: `*.test.ts` for frontend, `test_*.py` for backend
- Validate inputs at boundaries (API client, mapper, form inputs)
- Keep `athena-mapper.ts STATUS_MAP` in sync with `backend/src/athena/models/enums.py` JobStatus
- Use `ATHENA_API_KEY` env var; never hard-code keys

### Ask first:
- Database schema changes (changes via JSONL store or Python models)
- Adding new Python dependencies (check `pyproject.toml` + `uv sync --extra dev`)
- Adding new Node dependencies (check `package.json` + `npm install`)
- Changing CI config (`.github/workflows/`)

### Never do:
- Commit secrets (`.env`, `.key`, API keys in code)
- Edit `node_modules` or `.egg-info` directories
- Remove failing tests without approval
- Hard-code model names across multiple files (use `ATHENA_AI_PROVIDER` env + factory pattern)

## Success Criteria

This specification is complete when:

1. The `SPEC.md` file exists and covers all six core areas plus Boundaries and Success Criteria
2. The human has reviewed and approved the spec
3. All success criteria above are met
4. No open questions remain, or all open questions have documented resolutions

## Open Questions

- **Listings view consolidation:** Consolidate into pipeline view
- **"draft" status:** Yes, there is a need to add a "draft" status between evaluated and tailored in the PipelineStatus enum
- **deriveScope/deriveCategory:** Move to backend and served via API
- **mypy/ruff baseline strategy:** Same as current place. If no baseline exists, establish one with zero new errors tolerance.
