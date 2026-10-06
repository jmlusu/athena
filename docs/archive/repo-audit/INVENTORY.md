# INVENTORY — Athena Repository Baseline

**Date:** 2026-10-06
**Branch:** `main` @ `2854e41`
**Status:** PHASE 1 COMPLETE — no files deleted

---

## Headline Numbers

| Metric | Value |
|---|---|
| Git-tracked files | **239** |
| Working-tree files (excl. .git/node_modules) | 32,424 |
| Working-tree size | 1,053 MB |
| Files actually in Git | 239 (~2 MB) |
| Untracked files (visible) | 2 (`tmp_output.txt`, directive .md) |
| Root-level `.md` files | 20 |
| Top-level directories | 18 |

**The repository in Git is small. The working tree is large because of local
generated artifacts (correctly ignored):**

| Directory | Files | Status |
|---|---|---|
| `backend/.venv/` | 30,813 | ignored (correct) |
| `company/athena/embeddings_cache/` | ~712 `.npy` | ignored (correct) |
| `artifacts/` | 377 | ignored (correct) |
| `node_modules/` | large | ignored (correct) |
| `dist/` | 5 | ignored (correct) |
| `e2e/test-results/` | ~50 | ignored (correct) |
| `profile/` | 71 | ignored — **contains PII** (correct) |
| `backend/.ruff_cache/`, `.pytest_cache/`, `.benchmarks/` | ~40 | ignored (correct) |

---

## Tracked Files by Area

| Area | Tracked files | Purpose |
|---|---|---|
| `backend/` | 71 | FastAPI backend — **canonical Python** |
| `athena/` | 58 | **Stale fork** (Python + old frontend) — see DUPLICATES.md |
| root | 31 | configs + 20 loose `.md` files |
| `ATHENA-AI-STUDIO-HANDOFF/` | 22 | Historical handoff package |
| `src/` | 22 | React SPA — **canonical frontend** |
| `docs/` | 18 | Documentation |
| `scripts/` | 8 | Operational scripts |
| `.github/` | 3 | CI workflows + dependabot |
| `e2e/` | 3 | Playwright config + 2 specs |
| `tasks/` | 2 | Agent task scratch files |
| `tests/` | 1 | `mapper.test.ts` (Node unit tests) |

---

## Root Directory Contents (all tracked unless noted)

### Repository-level (KEEP)
`.env.example` `.gitattributes` `.gitignore` `.npmrc` `ARCHITECTURE.md`
`CHANGELOG.md` `README.md` `package.json` `package-lock.json` `tsconfig.json`
`vite.config.ts` `server.ts` `athena-mapper.ts` `index.html` `Caddyfile`

### Loose directive / planning docs (classification in DOCUMENTATION_AUDIT.md)
`ATHENA_AGENT_RULES.md` `ATHENA_INVENTORY_DIRECTIVE.md` `ATHENA_MASTER_SPEC.md`
`ATHENA_MERGE_CHECKLIST.md` `ATHENA_MERGE_DIRECTIVE.md` `ATHENA_VALIDATION_DIRECTIVE.md`
`AUTONOMOUS_CONTROLS_RIGHT_PANE_REQUIREMENTS.md` `ROADMAP_STEP2_ANALYSIS.md`
`UI_FIX_PLAN.md` `WAYFINDER_MAP_1..5_*.md` (5 files)
`athena-aistudio-opencode-handoff-package.md` `dual_environment_compatibility_standard.md`

### Untracked local
`ATHENA REPOSITORY SANITIZATION & STREAMLINING DIRECTIVE.md` (this directive)
`tmp_output.txt` (10 KB temp dump)
`backend_uvicorn.log` (0 bytes, ignored via `*.log`)

---

## Tracked-But-Should-Not-Be (generated artifacts in Git)

These violate §6/§19 — reproducible artifacts tracked:

```
athena/company/athena/athena/embeddings_cache/*.npy   (6 files)
athena/company/athena/athena/jobs.jsonl
athena/company/athena/athena/scrape_jobs.jsonl
athena/company/athena/athena/user_profiles.jsonl
backend/src/athena.egg-info/{PKG-INFO,SOURCES.txt,dependency_links.txt,requires.txt,top_level.txt}
```

**Reason:** `.gitignore` has `company/athena/` and `*.db` but not the nested
`athena/company/athena/` path prefix, and no `*.egg-info/` rule.

---

## File-Type Profile (tracked code)

- Python: `backend/src/athena/**` (47 files) + `backend/tests/**` (16) + `athena/**` (31, stale)
- TypeScript: `src/**` (22) + `server.ts` + `athena-mapper.ts` + `tests/` (1) + `e2e/` (3)
- Config: `package.json`, `pyproject.toml`, `uv.lock`, `tsconfig.json`, `vite.config.ts`
- CI: `.github/workflows/{ci,e2e}.yml`, `dependabot.yml`
