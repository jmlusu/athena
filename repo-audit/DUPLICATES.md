# DUPLICATES — Competing Implementations

**Rule applied:** one responsibility / one home. Each entry names the canonical survivor.

---

## D1. Python backend — TWO copies (CRITICAL)

| Fork | Path | Tracked | Status |
|---|---|---|---|
| **A (stale)** | `athena/src/ai_company/athena/athena/` (31 files) | yes | imports `ai_company.*` modules that **do not exist in this repo** |
| **B (canonical)** | `backend/src/athena/` (47 files) | yes | superset; CI runs `uv run pytest` here |

**Evidence B is canonical:**
- B contains A's entire module set **plus** `ai/providers/`, `adapters/`, `metrics/`,
  `lockfile.py`, `paths.py`, `timeutils.py`, `models/status_mapping.py`, `api/app.py`,
  `api/ai_routes.py`, `api/server.py`
- `store.py` diff: A → B = 286 insertions / 84 deletions (B is strictly ahead)
- A has broken imports: `ai_company.paths`, `ai_company.orchestrator.message_bus`,
  `ai_company.llm.client`, `ai_company.model_router`, `ai_company.dashboard.app`
- A's tests (`athena/tests/unit/*`) import `ai_company.dashboard.app` → cannot run
- CI (`ci.yml`) only exercises `backend/`
- ARCHITECTURE.md declares `backend/` the source of truth

**Disposition:** `athena/src/ai_company/` → **DELETE** (subsumed by B, cannot execute).
`athena/tests/unit/` → **DELETE** (duplicate of `backend/tests/test_athena_*.py`, broken imports).

---

## D2. Frontend — TWO copies (CRITICAL)

| Fork | Path | Tracked | Status |
|---|---|---|---|
| **A (stale)** | `athena/src/{components/athena,pages/athena,lib/athena}` (45 files) | yes | old brand palette `#070A40/#E63946/#00BFFF`; not referenced by vite/tsconfig |
| **B (canonical)** | root `src/` (22 files) | yes | referenced by `vite.config.ts`, `tsconfig.json`, ARCHITECTURE.md; brand `#F97316` |

**Evidence B is canonical:** build entry (`index.html` → `src/main.tsx`), CI `npm run lint && npm run build`
only compiles root `src/`. A also embeds the duplicate Python components? No — A's frontend is
pure TSX, all four brand colors of the *old* design system.

**Disposition:** `athena/src/components/`, `athena/src/pages/`, `athena/src/lib/` → **DELETE**.

---

## D3. Tests — duplicates

| Stale | Canonical twin |
|---|---|
| `athena/tests/unit/test_athena_api.py` | `backend/tests/test_athena_api.py` |
| `athena/tests/unit/test_athena_matching.py` | `backend/tests/test_athena_matching.py` |
| `athena/tests/unit/test_athena_scorer.py` | `backend/tests/test_athena_scorer.py` |
| `athena/tests/unit/test_athena_store.py` | `backend/tests/test_athena_store.py` |

**Disposition:** delete `athena/tests/` entirely with the fork.

---

## D4. Handoff packages — overlapping historical sets (3 sets)

| Set | Path | Content |
|---|---|---|
| 1 | `ATHENA-AI-STUDIO-HANDOFF/` (22 md) | Design/implementation/migration handoff |
| 2 | `athena-aistudio-opencode-handoff-package.md` (root, 20 KB) | Same handoff, single-file form |
| 3 | `docs/integration/*` (6 md) | Integration decisions, inventories, final report |

Integration is **complete and merged** (`FINAL_INTEGRATION_REPORT.md`, branch
`integration/athena-ai-studio` merged). Sets 1–3 are historical records of a finished migration.

**Disposition:** CONSOLIDATE → `docs/archive/` (see CLEANUP_PLAN). Note:
`docs/specs/legacy-cleanup.md` lists `ATHENA-AI-STUDIO-HANDOFF/` under "Never [delete]" —
handled as ARCHIVE (move), not delete. Confirm in OPEN_QUESTIONS.

---

## D5. One-off cleanup scripts (duplicates of each other + hardcoded key)

- `scripts/cleanup_duplicates.ps1` — deletes 6 hardcoded profile IDs via API
- `scripts/cleanup_remaining.ps1` — deletes 2 more, same pattern
- Both embed `"X-API-Key"="dev-admin-key"` literal
- One-off data-fix scripts, already applied (commit `5dc3972` "data-dir cleanup helpers")

**Disposition:** **DELETE** both (obsolete, hardcoded credential pattern).

---

## D6. Lint/test config paths (misleading, not duplicated)

`backend/pyproject.toml` ruff `extend-exclude` contains `backend/tests/test_athena_api.py`
and `tests/` — but paths are resolved **relative to `backend/`**, so both patterns match
nothing as written. Effect: exclusion intent not honored.

**Disposition:** REFACTOR (fix paths in Phase 6).

---

## Not duplicates (verified, keep both)

- `athena-mapper.ts` (root) vs `backend/src/athena/adapters/ai_studio.py` — different layers
  (TS front↔back mapping vs Python backend adapter); both live.
- `docs/DATA_STORES.md` vs `ARCHITECTURE.md` — reference vs diagram; complementary.
