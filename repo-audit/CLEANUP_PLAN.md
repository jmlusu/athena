# CLEANUP PLAN — Proposed Dispositions (APPROVAL REQUIRED BEFORE PHASE 4)

**Status:** PROPOSED — nothing deleted yet. Per §2, destruction begins only after sign-off.

Legend: **KEEP** · **CONSOLIDATE** · **REFACTOR** · **REPLACE** · **ARCHIVE** · **DELETE** · **INVESTIGATE**

---

## Wave 1 — Tracked generated artifacts (safe, mechanical)

| Action | Items |
|---|---|
| `git rm -r --cached` | `athena/company/athena/athena/embeddings_cache/` (6 `.npy`), `athena/company/athena/athena/*.jsonl` (3), `backend/src/athena.egg-info/` (5) |
| `.gitignore` += | `*.egg-info/`, `.benchmarks/`, `athena/company/` (belt & braces) |
| Local delete | `tmp_output.txt`, `backend_uvicorn.log` (untracked/ignored) |

Risk: none to runtime (all reproducible or runtime state kept on disk).

## Wave 2 — Duplicate implementations (largest clarity win)

| Action | Items | Disposition |
|---|---|---|
| DELETE | `athena/src/ai_company/**` (31 py) | DELETE — broken, superseded by `backend/src/athena/` |
| DELETE | `athena/tests/**` (4 py) | DELETE — duplicates `backend/tests/`, broken imports |
| DELETE | `athena/src/{components,pages,lib}/**` (45 tsx/ts) | DELETE — old frontend + old brand system |
| DELETE | `athena/` remaining dirs (`athena/company/...` data after Wave 1) | DELETE |
| DELETE | `scripts/cleanup_duplicates.ps1`, `scripts/cleanup_remaining.ps1` | DELETE — executed, hardcoded key |
| DELETE | `tasks/plan.md`, `tasks/todo.md` | DELETE — agent scratch |

→ Resolves: D1, D2, D3, D5; removes old brand palette `#070A40/#E63946/#00BFFF` (§23);
→ One Python backend, one frontend, one test suite per language.

## Wave 3 — Documentation consolidation (§10, §34)

| Action | Items |
|---|---|
| ARCHIVE → `docs/archive/` | `ATHENA-AI-STUDIO-HANDOFF/`, `athena-aistudio-opencode-handoff-package.md`, `docs/integration/{AI_STUDIO_INVENTORY,OPENCODE_INVENTORY,ATHENA_IMPLEMENTATION_COMPARISON,MERGE_DECISIONS,FINAL_INTEGRATION_REPORT}.md`, `docs/audits/CODEBASE_AUDIT_MASTER_SPEC.md`, `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md`, `docs/ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md` |
| DELETE (executed directives/plans) | `ATHENA_INVENTORY_DIRECTIVE.md`, `ATHENA_MERGE_DIRECTIVE.md`, `ATHENA_MERGE_CHECKLIST.md`, `ATHENA_VALIDATION_DIRECTIVE.md`, `UI_FIX_PLAN.md`, `WAYFINDER_MAP_3/4/5` |
| CONSOLIDATE (verify then move/delete) | `WAYFINDER_MAP_1` → merge into `docs/METRICS_REGISTRY_GUIDE.md`; `WAYFINDER_MAP_2` → `docs/specs/` if gap still open; `AUTONOMOUS_CONTROLS_...` → `docs/specs/right-pane-requirements.md` |
| INVESTIGATE | `ROADMAP_STEP2_ANALYSIS.md`, `dual_environment_compatibility_standard.md` (Q10) |
| KEEP root | `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `ATHENA_MASTER_SPEC.md`, `ATHENA_AGENT_RULES.md`→`AGENTS.md` |

## Wave 4 — Configuration & dependencies (§9, §21)

| Action | Items |
|---|---|
| REFACTOR | `backend/.env.production.example` → rewrite to real vars (or delete, Q7) |
| DELETE (unused deps) | npm `@google/genai`, `motion`, `autoprefixer` |
| REFACTOR | `backend/pyproject.toml` ruff `extend-exclude` dead paths |
| INVESTIGATE | `Caddyfile`, `backend/Dockerfile` (Q8) |

## Wave 5 — Naming & structure (§16–§18)

| Action | Items |
|---|---|
| MOVE | nothing structural beyond above; root becomes 15 repo files + 5 docs |
| REFACTOR | `ATHENA_AGENT_RULES.md` → `AGENTS.md` with §27/28/29 rules (Q12) |
| KEEP | `server.ts`, `athena-mapper.ts`, `index.html` at root (genuine repo-level entry points) |

## Wave 6 — Validation (§7, §25, §26)

```
npm run lint          (tsc --noEmit)
npm run build
npm run test:unit     (node --test tests/server)
cd backend && uv run ruff check .
cd backend && uv run pytest -q
npm run test:e2e      (if services running — else record as WARN)
git status            (verify only intended changes)
```
Then **create `npm run health`** orchestrating the above with PASS/WARN/FAIL (§26).

## Wave 7 — Documentation (§11, §27, §30, §37)

1. Update `README.md` — accurate repo map + doc index
2. Verify `ARCHITECTURE.md` — mark any PLANNED items (§11)
3. Create `AGENTS.md` — source-of-truth pointers + search-before-build / no-duplicate rules
4. Write `docs/REPOSITORY_HEALTH.md` — before/after + remaining debt (§37)
5. Archive or remove `repo-audit/` — keep a slim permanent record

---

## Expected Before → After (tracked files)

| Metric | Before | After (est.) |
|---|---|---|
| Tracked files | 239 | ~145 |
| Root loose `.md` | 20 | 6 |
| Duplicate backend copies | 2 | 1 |
| Frontend copies | 2 | 1 |
| Generated files in Git | 14 | 0 |
| Directives/executed plans in root | 13 | 0 |

**Estimated deletions: ~95 files · archived (moved): ~36 · all recoverable via Git.**

---

## Explicitly NOT doing

- No Git history rewrite (§31) — `git rm --cached` only
- No feature work (§39 Phase 0 freeze)
- No test deletions for being red — failures classified first (§24)
- No `.gitignore` use to hide source (§19)
- No new tooling beyond the health command (§25)
- No touching `profile/` PII (local, ignored)
