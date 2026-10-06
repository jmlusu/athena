# Legacy Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the legacy `backend/` + `frontend/` + Docker/deploy stacks so only the primary app (Express BFF `server.ts` + React SPA `src/` on :3000) remains, with CI, E2E, config, and docs repointed to it.

**Architecture:** Rescue the primary-app Playwright suite out of `frontend/` first, rewrite both CI workflows around the root npm app, then delete everything legacy, fix `server.ts`'s lock paths (currently resolving *outside* the repo) and its broken `require("fcntl")` calls, clean config, update docs, verify end-to-end.

**Tech Stack:** Node 22/24 + npm (root `package-lock.json`), TypeScript, Vite, esbuild, Playwright, GitHub Actions (SHA-pinned actions).

**Spec:** User decisions — no deployment target exists (aspirational), no Docker path to keep, `company/athena/` is discardable. Docs scope: README + ARCHITECTURE only.

## Global Constraints

- Root package manager is **npm**; legacy frontend used pnpm (dies with `frontend/`).
- Both modes run from repo root: `npm run dev` / `npm run build && npm run start` (prod needs `NODE_ENV=production` to serve `dist/` statically — `server.ts:1073`).
- Never `git add -A` blindly: uncommitted fixes in `src/`, plus junk (`server.err`, `*.log`, loose PNGs/directives) must not be swept in.
- Keep: `scripts/setup-git-hooks.sh`, `ATHENA-AI-STUDIO-HANDOFF/`, historical report docs.
- Commit messages follow repo's conventional style (`chore:`, `fix:`, `docs:`, `test:`).

## Review Focus

1. **Windows file locks** — uvicorn :8000 / vite :8530 hold dirs open → deletion fails.
2. **Uncommitted fix loss** — `src/App.tsx`, `PipelineView.tsx`, `LeftSidebar.tsx`, `ARCHITECTURE.md`, `e2e.yml` carry uncommitted changes.
3. **Rescued E2E path assumptions** — config computes `REPO_ROOT` as `../..` (frontend/e2e layout).
4. **Lint must cover moved suite** — tsconfig has no `include`, so `e2e/` is auto-included.
5. **Lock endpoints already broken** — `require("fcntl")` isn't installed (acquire → 500 today) and `require("fs")` is illegal in the ESM bundle.
6. **Prod boot** — `npm start` serves `process.cwd()/dist` only under `NODE_ENV=production`.

---

### Task 0: Stop legacy processes; commit current fixes

**Files:** none created; git only.

- [ ] Step 1: Kill legacy listeners on :8000 and :8530 (leaves :3000 dev server running):

```powershell
Get-NetTCPConnection -LocalPort 8000,8530 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

- [ ] Step 2: Verify — 8000 → `False`, 8530 → `False`, 3000 → `True`.
- [ ] Step 3: Commit the pending fixes explicitly (never `-A`):

```powershell
git add src/App.tsx src/components/views/PipelineView.tsx src/components/layout/LeftSidebar.tsx ARCHITECTURE.md .github/workflows/e2e.yml
git commit -m "feat: metric-card filtering and detail-modal navigation split"
```

---

### Task 1: Rescue primary-app E2E suite to repo root

**Files:**
- Move (untracked → plain `Move-Item`): `frontend/e2e/playwright.aistudio.config.ts` → `e2e/playwright.config.ts`; `frontend/e2e/aistudio/` → `e2e/aistudio/`
- Modify: `package.json` (script + devDep), `package-lock.json` (via npm), `e2e/playwright.config.ts` (paths)

**Interfaces:**
- Produces: npm script `test:e2e` → runs Playwright with `e2e/playwright.config.ts` (webServer auto-starts `npm run dev`, waits on `/api/health`); suite = 8 tests (health + 7 views).

- [ ] Step 1: Move the files:

```powershell
New-Item -ItemType Directory -Path e2e | Out-Null
Move-Item frontend\e2e\playwright.aistudio.config.ts e2e\playwright.config.ts
Move-Item frontend\e2e\aistudio e2e\aistudio
```

- [ ] Step 2: Fix root resolution in `e2e/playwright.config.ts`
  - Line 8-9: comment → `// e2e -> repo root (the npm run dev / server.ts root).` and `const REPO_ROOT = path.resolve(CONFIG_DIR, '..');`
  - Leave `testDir: path.join(CONFIG_DIR, 'aistudio')` and the `CONFIG_DIR`-relative output/reporter paths (now `e2e/test-results/...`, covered by root `.gitignore` `test-results/`).
- [ ] Step 3: Update the spec's stale header comment in `e2e/aistudio/aistudio-smoke.spec.ts` (legacy `frontend/` reference).
- [ ] Step 4: Add runner + dependency:

```powershell
npm install --save-dev @playwright/test
npx playwright install chromium
```

Add to `package.json` scripts: `"test:e2e": "playwright test --config e2e/playwright.config.ts"`.
- [ ] Step 5: `npm run lint` → PASS (proves Playwright types resolve under root tsconfig).
- [ ] Step 6: `npm run test:e2e` → 8 passed. Fix any stale marker heading from `src/components/views/<Name>View.tsx`.
- [ ] Step 7: Commit `test: rescue primary-app Playwright smoke suite from frontend/`.

---

### Task 2: Rewrite CI/E2E workflows; delete deploy workflow

**Files:** Modify `.github/workflows/ci.yml`, `.github/workflows/e2e.yml`; Delete `.github/workflows/deploy.yml`

- [ ] Step 1: Replace `ci.yml` entirely:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  quality:
    name: Lint & build (primary app)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

- [ ] Step 2: Replace `e2e.yml` entirely:

```yaml
name: E2E Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true
jobs:
  e2e:
    name: Playwright smoke (primary app)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: e2e/test-results/aistudio-html-report/
          retention-days: 7
```

- [ ] Step 3: `Remove-Item .github\workflows\deploy.yml`
- [ ] Step 4: Commit `ci: repoint CI and E2E to the primary app; drop aspirational deploy`.

---

### Task 3: Remove the Docker path

**Files:** Delete `docker-compose.yml`, `docker-compose.staging.yml`, `docker-compose.prod.yml`, `.dockerignore`; Modify `.gitignore`

- [ ] Step 1: Remove the 4 root files.
- [ ] Step 2: `.gitignore` — delete the `# Docker` / `.docker/` block.
- [ ] Step 3: Commit `chore: drop unused Docker path`.

---

### Task 4: Remove deploy leftovers, legacy scripts, legacy Dependabot + env

**Files:** Delete `deploy/`, `seed_staging.py`, `scripts/dev-preview.sh`, `.env.staging`; Modify `.github/dependabot.yml`, `.env.example`

- [ ] Step 1: `Remove-Item -Recurse deploy, seed_staging.py, scripts\dev-preview.sh, .env.staging` (`scripts/setup-git-hooks.sh` stays).
- [ ] Step 2: Dependabot — delete the `pip` block; keep `github-actions` + `npm`.
- [ ] Step 3: `.env.example` — primary app reads only `GEMINI_API_KEY`, `NODE_ENV` (`server.ts`) and `DISABLE_HMR` (`vite.config.ts`); nothing in `src/` uses env vars. Replace contents with:

```
# Gemini API key (server-side only; server.ts)
GEMINI_API_KEY=

# development (Vite middleware) | production (serves dist/ statically)
NODE_ENV=development

# Set to true to disable Vite HMR (vite.config.ts)
DISABLE_HMR=
```

- [ ] Step 4: Commit `chore: remove deploy path, legacy scripts, and legacy env config`.

---

### Task 5: Delete `backend/`, `frontend/`, demo data

**Files:** Delete `backend/`, `frontend/`, `company/`, `server.err`

- [ ] Step 1: Re-verify nothing holds the dirs (8000/8530 have no listeners).
- [ ] Step 2: `git rm -r --quiet backend frontend`.
- [ ] Step 3: `Remove-Item -Recurse -Force backend, frontend` (untracked leftovers: `.venv`, `node_modules`, `dist`).
- [ ] Step 4: `Remove-Item -Recurse -Force company, server.err -ErrorAction SilentlyContinue`.
- [ ] Step 5: Verify `Test-Path backend` / `Test-Path frontend` → `False`; `git status --short` shows only `D` entries for those dirs.
- [ ] Step 6: Commit `chore: remove legacy backend/, frontend/, and demo data`.

---

### Task 6: Repoint lock paths into the repo; make lock endpoints ESM-safe

**Files:** Modify `server.ts`

**Context:** 5 lock paths use `path.join(__dirname, "..", "backend", "src", "athena", "artifacts", "locks", …)` — under `tsx` (`__dirname` = repo root) they resolve **outside the repo**; under `npm start` (`__dirname` = `dist/`) they point at `backend/` (soon deleted). `require("fcntl")` (not installed) at lines 114/152/204/241 makes acquire endpoints 500 today; `require("fs")` fails in the ESM bundle.

**Interfaces:**
- Produces: `const LOCKS_DIR: string` — repo-relative `artifacts/locks`, valid in both dev and built modes.

- [ ] Step 1: Add after `server.ts:10`:

```ts
// Lock files stay in the repo: dist/ when built, repo root under tsx dev.
const REPO_ROOT = path.basename(__dirname) === "dist" ? path.dirname(__dirname) : __dirname;
const LOCKS_DIR = path.join(REPO_ROOT, "artifacts", "locks");
```

- [ ] Step 2: Add `import fs from "node:fs";`; replace all `require("fs").` with `fs.`.
- [ ] Step 3: Replace all 5 lock-path joins with `LOCKS_DIR` (2× entity lock, 2× `global_agent.lock`, 1× `lockDir`).
- [ ] Step 4: Remove the 4 `fcntl` calls and the now-dead `openSync`/`fd` lines; keep `writeFileSync`/`unlinkSync`.
- [ ] Step 5: `npm run lint` → PASS.
- [ ] Step 6: Runtime verify: POST `/api/lock/artifact` → 200 with `lockToken`; `Test-Path artifacts\locks\job_42.lock` → `True` (inside repo); release → 200 and file gone.
- [ ] Step 7: Commit `fix: keep lock files inside the repo and drop non-existent fcntl dependency`.

---

### Task 7: Config cleanup (`.gitignore`, `tsconfig.json`, `.npmrc`)

**Files:** Modify `.gitignore`, `tsconfig.json`, `.npmrc`

- [ ] Step 1: `.gitignore` — remove `backend/*`, `frontend/*`, `company/athena/`, `.docker/` lines; in `# Data` add `artifacts/`; add `.superpowers/` (this plan's ledger dir).
- [ ] Step 2: `tsconfig.json` — `"exclude": ["node_modules", "dist"]`.
- [ ] Step 3: `.npmrc` — remove pnpm-only keys `node-linker`, `strict-peer-dependencies`, `auto-install-peers`; delete the file if empty.
- [ ] Step 4: Commit `chore: drop legacy entries from gitignore, tsconfig, and npmrc`.

---

### Task 8: Docs — README + ARCHITECTURE

**Files:** Modify `README.md`, `ARCHITECTURE.md` (line refs are pre-edit)

- [ ] Step 1: `README.md`
  - Repo tree: remove `backend/`, `frontend/`, `Dockerfile`, `docker-compose.yml` entries.
  - Legacy run block → `npm ci` · `npm run dev` (http://localhost:3000) · `npm run build && NODE_ENV=production npm start` · `npm run test:e2e`.
  - Docker section → delete.
  - URLs → single `http://localhost:3000`.
  - Env table → keep only `GEMINI_API_KEY`, `NODE_ENV`, `DISABLE_HMR`; delete every `Legacy:` row.
  - Tests section → `npm run lint` + `npm run test:e2e`.
  - Deployment section → one line: no deployment target configured; run `npm run start` on a host.
- [ ] Step 2: `ARCHITECTURE.md`
  - Source-of-truth note: drop `docker-compose*.yml`, `backend/`, `frontend/`.
  - Mermaid: delete the Lane B subgraph and the Docker Compose node.
  - Tech table: delete rows for `frontend/src/App.tsx` and `backend/...`.
  - Port table: keep :3000 only.
  - Known issues: replace "Two parallel implementations…" with the fact that the legacy stack was removed.
- [ ] Step 3: Commit `docs: reflect single-app architecture after legacy retirement`.

---

### Task 9: Final verification (clean-room)

- [ ] Step 1: Stop :3000, then `npm ci` → PASS (validates lockfile + `.npmrc`).
- [ ] Step 2: `npm run lint` → PASS; `npm run build` → PASS; `dist\server.mjs` and `dist\index.html` exist.
- [ ] Step 3: Prod smoke — `$env:NODE_ENV="production"`; `Start-Process node -ArgumentList "dist/server.mjs" -WindowStyle Hidden`; `/api/health` → `ok`; `/` → 200; then kill the :3000 listener.
- [ ] Step 4: `npm run test:e2e` → 8 passed (Playwright cold-starts the dev server).
- [ ] Step 5: Reference sweep — no `backend/|frontend/|docker-compose|pnpm` hits in README.md, ARCHITECTURE.md, server.ts, package.json, .env.example, .github\workflows\*.yml.
- [ ] Step 6: Restart dev detached for the user; health check → `ok`.
- [ ] Step 7: `git status --short` → clean except intentionally-untracked local files.
