# DEPENDENCY MAP

## Node (`package.json`) — 11 deps + 10 devDeps

### Runtime dependencies

| Package | Classification | Evidence |
|---|---|---|
| `react`, `react-dom` | USED | 56 refs in `src/` |
| `express` | USED | 19 refs in `server.ts` |
| `lucide-react` | USED | 14 refs |
| `chokidar` | USED | 3 refs (profile document watcher) |
| `dotenv` | USED | 3 refs (`server.ts`) |
| `vite` | USED | build (also listed as dep — acceptable for middleware use; consider devDep) |
| `@tailwindcss/vite`, `@vitejs/plugin-react` | USED | `vite.config.ts` plugins |
| `@google/genai` | **UNUSED** | 0 imports in .ts/.tsx (backend uses Python `google-genai`) → REMOVE |
| `motion` | **UNUSED** | 0 imports → REMOVE |
| `tailwindcss` (in devDeps) | USED | `index.css` `@import "tailwindcss"` |

### Dev dependencies

| Package | Classification | Evidence |
|---|---|---|
| `typescript`, `tsx`, `esbuild` | USED | lint / dev runner / prod bundle |
| `@types/*` (express, node, react, react-dom) | USED | type-check |
| `@playwright/test` | USED | e2e |
| `autoprefixer` | **UNUSED** | 0 refs; Tailwind 4 handles prefixes → REMOVE |
| `tailwindcss` | USED | see above |

**Action:** remove `@google/genai`, `motion`, `autoprefixer` → verify `npm run lint`,
`npm run build`, `npm run test:unit` still pass (Phase 7 gate).

---

## Python (`backend/pyproject.toml`) — 19 deps + 6 devDeps

| Package | Class | Notes |
|---|---|---|
| `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings` | USED | core API |
| `python-multipart` | USED | file uploads |
| `apscheduler` | USED | background jobs |
| `httpx` | USED | scraper HTTP client |
| `google-genai` | USED | AI provider (Gemini) |
| `beautifulsoup4`, `lxml` | USED | HTML parsing |
| `python-docx` | USED | DOCX generation |
| `weasyprint` | USED | PDF generation |
| `pdfplumber` | USED | PDF parsing |
| `filelock` | USED | store.py locking |
| `python-dotenv` | USED | env loading |
| `structlog` | USED | logging |
| `email-validator` | USED | pydantic email fields |
| `numpy` | USED | embeddings cache |
| `sentence-transformers` | USED | MiniLM-L6-v2 |
| `playwright` | USED | browser automation + scraper fallback |
| dev: `pytest`, `pytest-asyncio`, `pytest-cov`, `ruff`, `mypy`, `types-requests` | USED | CI runs ruff + pytest |

No unused Python deps found. `uv.lock` present and consistent (589 KB).
Heavy deps (`sentence-transformers`, `playwright`, `weasyprint`) are all functionally required.

---

## Duplicated libraries across stacks (evaluated, acceptable)

| Capability | Node | Python | Verdict |
|---|---|---|---|
| Gemini API | ~~`@google/genai`~~ (unused) | `google-genai` | Python-only after cleanup ✓ |
| HTTP client | (express/proxy) | `httpx` | Different layers ✓ |
| Type checking | `typescript` | `mypy` | Different languages ✓ |

---

## Docker / deploy dependencies

- `backend/Dockerfile` exists (921 B) but ARCHITECTURE.md §4.5 states compose/OCI deploy
  **removed**; no CI job builds images → INVESTIGATE: keep Dockerfile as future path or delete.
