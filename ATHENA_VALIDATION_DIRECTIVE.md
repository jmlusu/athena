# ATHENA — Validation Directive

**Purpose:** Non-negotiable validation gates that must pass at each integration phase and before final merge.

---

## 1. Phase Gates (Each Phase)

After completing each integration phase (per `ATHENA_MERGE_DIRECTIVE.md` sequence):

```bash
# Backend
cd backend && uv sync && uv run python -m mypy src && uv run ruff check src && uv run pytest tests -v

# Frontend
cd frontend && pnpm install && pnpm run build && pnpm run lint && pnpm run test

# Root
pnpm install && pnpm run build
```

**All must pass.** No exceptions without documented rationale in `MERGE_DECISIONS.md`.

---

## 2. Pre-Merge Validation (Definition of Done)

Before PR against `main`, ALL must pass:

### Build & Type Safety
- [ ] `pnpm install` (root) — no errors
- [ ] `cd backend && uv sync` — no conflicts
- [ ] `cd frontend && pnpm install` — no errors
- [ ] `pnpm run build` (root) — frontend builds
- [ ] `uv run python -m mypy backend/src` — clean (exit 0)
- [ ] `uv run ruff check backend/src` — clean (exit 0)
- [ ] `cd frontend && pnpm run lint` — `tsc --noEmit` clean

### Tests
- [ ] `uv run pytest backend/tests -v` — all pass (or documented exceptions)
- [ ] `cd frontend && pnpm run test` — all vitest pass
- [ ] No test regressions vs baseline

### Security
- [ ] No secrets in diff: `git diff --name-only | xargs grep -l "API_KEY\|SECRET\|PASSWORD\|PRIVATE_KEY" 2>/dev/null` returns empty
- [ ] `.env.example` updated with all required vars
- [ ] No `.env`, `*.key`, `*.pem` in tracked files

### Functionality (Manual Verification)
- [ ] Application starts: `docker-compose up -d` → backend health `/health` → frontend loads
- [ ] Navigation: All routes accessible (`/athena/jobs`, `/athena/dashboard`, `/athena/documents`, `/athena/receipts`, `/athena/n8n`, `/athena/profile`, `/athena/settings`)
- [ ] Authentication: `X-API-Key` required on mutating endpoints, rejected on invalid
- [ ] Database: Jobs list loads, CRUD works, scrape triggers, process runs
- [ ] AI: `/api/v1/athena/ai/score-ats` returns fallback without key, works with key
- [ ] Agents: Scheduler starts/stops, cron jobs visible
- [ ] Document generation: Resume (DOCX), Cover letter, Proposal (new)
- [ ] Sign-off gate: Checkbox + typed signature required, receipt generated
- [ ] Receipts: Certificate displays, follow-up draft generates
- [ ] n8n: Webhook tester responds, topology renders
- [ ] Error handling: 404, 400, 401, 500 responses correct

### Documentation
- [ ] `MERGE_DECISIONS.md` complete (all capabilities classified)
- [ ] `FINAL_INTEGRATION_REPORT.md` drafted
- [ ] `.env.example` current
- [ ] `README.md` updated if architecture changed

---

## 3. Commands Reference

| Check | Command | Expected |
|-------|---------|----------|
| Backend deps | `cd backend && uv sync` | Exit 0 |
| Backend typecheck | `cd backend && uv run python -m mypy src` | Exit 0 |
| Backend lint | `cd backend && uv run ruff check src` | Exit 0 |
| Backend tests | `cd backend && uv run pytest tests -v` | Exit 0, all passed |
| Frontend deps | `cd frontend && pnpm install` | Exit 0 |
| Frontend build | `cd frontend && pnpm run build` | Exit 0, `dist/` created |
| Frontend typecheck | `cd frontend && pnpm run lint` | Exit 0 (`tsc --noEmit`) |
| Frontend tests | `cd frontend && pnpm run test` | Exit 0, all passed |
| Root build | `pnpm run build` | Exit 0 |
| Secret scan | `git diff --name-only | xargs grep -l "SECRET\|PASSWORD\|PRIVATE_KEY" 2>/dev/null` | No output |

---

## 4. CI Pipeline Alignment

The `.github/workflows/ci.yml` defines the authoritative gates. Local validation MUST match CI:

```yaml
# ci.yml jobs (reference)
- ruff format check
- ruff lint
- mypy typecheck
- pytest (backend)
- frontend build
- frontend lint (tsc)
- frontend test (vitest)
- docker build (backend + frontend)
```

**If CI fails, merge is blocked.** Fix locally first.

---

## 5. Exception Process

If a gate cannot pass due to pre-existing issue (not introduced by integration):

1. Document in `MERGE_DECISIONS.md` under "Known Issues / Exceptions"
2. Reference pre-existing issue/commit
3. File follow-up GitHub issue
4. Get explicit human approval before proceeding

**No silent exceptions.** Every deviation is visible and traceable.