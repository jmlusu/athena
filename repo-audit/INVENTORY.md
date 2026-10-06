# INVENTORY — Current Tree (Phase 1, read-only)

**Baseline:** `cleanup/baseline` = `d674075` (main, clean tree, 14 ahead of origin/main)
**Method:** `git ls-files`, `git status --porcelain --ignored`, `git check-ignore -v`, `git log`, `git ls-tree -r -l`
**Note:** Supersedes archived `docs/archive/repo-audit/INVENTORY.md` (historical).

---

## 1. Tracked files: 185

| Area | Files | Area | Files |
|---|---:|---|---:|
| `backend/` | 68 (48 src + 14 tests + 6 root) | `scripts/` | 7 |
| `docs/` | 56 (36 in `docs/archive/`) | `.github/` | 3 |
| `src/` | 23 | `e2e/` | 3 |
| root (no dir) | 18 | `repo-audit/` | 4 |
| `tasks/` | 2 | `tests/` | 1 |

By extension: `.md` 68 · `.py` 63 · `.tsx` 17 · `.ts` 12 · `.json` 6 · `.yml` 3 · docx 2 · misc 10.
Largest at HEAD: `backend/uv.lock` (586 KB), `package-lock.json` (106 KB), `documents/generator.py` (49 KB). **No file > 600 KB — no bloat at HEAD.**

## 2. Working tree: clean

`git status --porcelain -uall` = 0 lines. Everything present-but-untracked is **ignored**:

- **Junk (regenerable, candidate for Phase 2 local sanitation):** root `backend.err`, `backend.log`, `backend_uvicorn.log`, `frontend.err`, `frontend.log`, `build_out.txt`, `test_unit_out.txt`; `backend/{fix_output,pytest_out,remaining,ruff_output}.txt`
- **Generated:** `dist/`, `node_modules/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `__pycache__/` ×20, `athena.egg-info/`, `.benchmarks/` (empty), `e2e/test-results/`, `backend/.venv/`
- **Real data (never commit):** `.env` (secrets), `profile/` (15.0 MB PII), `company/athena/` (3.1 MB JSONL + embeddings), `artifacts/locks/`
- **Tool state:** `.superpowers/`

## 3. Directory purposes

| Dir | Purpose | Tracked | Ignored? |
|---|---|---:|---|
| `backend/` | FastAPI service + pytest | 68 | partially (venv/caches/logs yes) |
| `src/` | React SPA | 23 | — |
| `docs/` | Current docs + `archive/` (36) | 56 | — |
| `scripts/` | health, profile builders, fixtures | 7 | — |
| `tests/` | node --test (1 file) | 1 | — |
| `e2e/` | Playwright (config + 2 specs) | 3 | test-results ignored |
| `tasks/` | agent scratch (plan/todo) | 2 | — |
| `company/` | runtime data root | 0 | **partial** — only `company/athena/` (gap, see CONFIGURATION_AUDIT C9) |
| `profile/` | uploaded PII documents | 0 | yes |
| `artifacts/` | runtime locks | 0 | yes |
| `.benchmarks/`, `.superpowers/`, `dist/` | caches/tool state/build | 0 | yes |
| `.github/` | CI + dependabot | 3 | — |
| `repo-audit/` | audit record (this) | 4→11 | — |

## 4. Git audit

- Branches: `main` (14 ahead of origin/main, 0 behind), `chore/legacy-retirement` (merged, 0/38), `release/2026-10-03` (merged). **No unmerged local work.**
- Tags: `cleanup/baseline` (annotated, → d674075, created Phase 0), `cleanup/c0-baseline` (→ 2854e41, prior audit).
- Remote clutter: ~40 stale `origin/dependabot/*` branches + merged `origin/integration/*` — deletion candidates (R1, remote-side).
- History junk: `.log` never tracked; `*.err`/`*_out.txt`/`*.npy`/`egg-info`/`*.jsonl` added once (`aff4a37`, `d539649`, `237fec0`, `2854e41`) and all removed by `6ea0ea3`/`568cead`/`d674075`. **`.env` never committed (0 commits ever).**
- PII in history (pushed): `.media/` PDFs 5.3 MB (names+degrees), `profile/*.md` 53 KB, `athena/company/.../user_profiles.jsonl` — added `579c7e7`/`2854e41`, removed `1fe30bf`/`6ea0ea3`. See SECURITY_AUDIT S7–S9.
- 14 unpushed commits on `main` (2854e41 → d674075).

## 5. Root loose files (tracked, 18)

| Class | Files |
|---|---|
| Build/runtime entry points (KEEP) | `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.npmrc` (0 bytes), `server.ts`, `athena-mapper.ts` |
| Repo plumbing (KEEP) | `.gitignore`, `.gitattributes`, `.env.example`, `Caddyfile` (orphan — see DEAD_CODE DC3c) |
| Governance docs (KEEP) | `README.md`, `ARCHITECTURE.md`, `AGENTS.md`, `ATHENA_MASTER_SPEC.md`, `CHANGELOG.md`, `ATHENA PHASED APPROVAL & ROLLBACK PROTOCOL.md` |
| Junk on disk only (ignored) | 7 files — Phase 2 local deletion candidates |

## 6. repo-audit/ deliverable status

Present before this phase: ARCHITECTURE_MAP, CLEANUP_PLAN, DIRECTIVE_SOURCE, OPEN_QUESTIONS.
Written in this phase: INVENTORY, DEPENDENCY_MAP, DUPLICATES, DEAD_CODE, CONFIGURATION_AUDIT, DOCUMENTATION_AUDIT, SECURITY_AUDIT (7/7 regenerated as CURRENT; archived copies in `docs/archive/repo-audit/` remain historical).

## Flags

1. `company/` partially ignored (C9) · 2. no backup story for `profile/`/`company/` · 3. PII history on remote · 4. 14 unpushed commits · 5. stale remote branches · 6. protocol doc has spaces in name, pinned at root by `health.mjs:45` and `AGENTS.md:167`.
