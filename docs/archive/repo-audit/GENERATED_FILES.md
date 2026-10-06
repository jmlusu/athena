# GENERATED / MACHINE-GENERATED FILES

## Correctly ignored (local only — no action beyond gitignore gaps)

| Artifact | Location | Reproducible | Verdict |
|---|---|---|---|
| Python venv | `backend/.venv/` (30,813 files) | yes (`uv sync`) | ignored ✓ |
| `__pycache__`, `*.pyc` | everywhere | yes | ignored ✓ |
| `node_modules/` | root | yes (`npm ci`) | ignored ✓ |
| `dist/` (5 files) | root | yes (`npm run build`) | ignored ✓ |
| Embeddings cache | `company/athena/embeddings_cache/*.npy` (~712) | yes (regenerated) | ignored via `company/athena/` ✓ |
| Playwright output | `e2e/test-results/` (screenshots, html-report, json) | yes | ignored ✓ |
| Test caches | `.pytest_cache/`, `backend/.pytest_cache/`, `backend/.ruff_cache/`, `.benchmarks/` | yes | mostly ignored ✓ (`.benchmarks/` **not in .gitignore** — add) |
| Logs | `backend_uvicorn.log` (0 B) | n/a | ignored via `*.log` ✓ |
| Locks | `artifacts/locks/*.lock`, `company/athena/locks/` | runtime state | ignored ✓ (keep on disk) |
| Runtime JSONL | `company/athena/*.jsonl` | runtime data | ignored ✓ (keep on disk) |

## INCORRECTLY TRACKED (must be `git rm --cached`)

| Artifact | Path | Why |
|---|---|---|
| Embeddings cache (6 `.npy`) | `athena/company/athena/athena/embeddings_cache/` | Nested path escapes `company/athena/` rule; reproducible |
| Runtime JSONL (3) | `athena/company/athena/athena/{jobs,scrape_jobs,user_profiles}.jsonl` | Live data in Git; also stale fork's data dir |
| setuptools build output | `backend/src/athena.egg-info/` (5) | Regenerated on install |

**.gitignore gaps to fix:** `*.egg-info/`, `.benchmarks/`, and either
`athena/company/` or (after deleting the stale fork) the issue disappears entirely.

## Agent / tool artifacts

| Artifact | Status |
|---|---|
| `.superpowers/`, `.opencode/`, `AppData/` | ignored ✓ |
| `tasks/plan.md`, `tasks/todo.md` | **tracked** agent scratch → DELETE (git history keeps) |
| `tmp_output.txt` | untracked temp → DELETE |
| `repo-audit/` (this directory) | temporary working material per §4 → shrink to permanent record or remove at end |
| `artifacts/` (377 files: e2e-proof, walkthrough dirs) | ignored ✓ — local evidence dumps, fine |
