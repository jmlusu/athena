# ATHENA — Agent Behavior Rules

**Scope:** All AI agents (OpenCode, Codex, Cursor, human developers) working on the Athena codebase.

---

## 1. Core Principles

| Rule | Description |
|------|-------------|
| **Preserve Functionality** | Existing functionality is presumed valuable. Never delete merely because another version looks newer or "more elegant." |
| **No Destructive Guessing** | Before deleting: What does it do? Who uses it? Is it duplicated? What replaces it? Has replacement been tested? If uncertain: DO NOT DELETE — document uncertainty. |
| **Spec-Driven** | Work from `ATHENA_MASTER_SPEC.md`. If requirements are unclear, create a spec first (`spec-driven-development` skill). |
| **Incremental** | Deliver changes in small, verifiable steps. After each major phase: build → test → inspect → commit. |
| **Evidence Over Prose** | Claims of "it works" require verification: test output, build log, screenshot, measured numbers. |
| **Security First** | Never commit secrets. Use env vars. Follow `security-and-hardening` skill. |
| **Traceability** | Decisions recorded in `docs/integration/MERGE_DECISIONS.md` (historical: `docs/archive/integration/`) or the PR description. |

---

## 2. Where Things Live (Source of Truth)

Before touching code, answer "which file owns this?" from this map. Full detail: `ARCHITECTURE.md` + `repo-audit/ARCHITECTURE_MAP.md`.

| Concern | Canonical home |
|---|---|
| Architecture / data flow | `ARCHITECTURE.md` (root) |
| Product requirements | `ATHENA_MASTER_SPEC.md` |
| Backend (Python, FastAPI) | `backend/src/athena/` |
| Frontend (React SPA) | root `src/` |
| BFF / proxy | `server.ts` |
| Front↔back data mapping | `athena-mapper.ts` |
| Model/provider abstraction | `backend/src/athena/ai/providers/` |
| Persistence (JSONL + locks) | `backend/src/athena/store.py` |
| Environment variables | `.env.example` (root) — single canonical example |
| Python deps + tool config | `backend/pyproject.toml` |
| Node deps + scripts | `package.json` |
| CI | `.github/workflows/` |
| Python tests | `backend/tests/` |
| Node tests | `tests/server/` |
| E2E tests | `e2e/` |
| Agent permission levels (A0–A4) | `docs/agent-authority-matrix.md` |
| Historical records | `docs/archive/` — never treat as current guidance |

---

## 3. Search Before Build

Before creating any new component, service, utility, agent, script, config, API, model adapter, or doc:

1. **Search** the repository for an existing equivalent.
2. **Extend** existing code when possible instead of adding a parallel file.
3. **Place** new files in the canonical directory from the map above (§2).
4. **Follow** existing naming conventions.

## 4. No Duplicates by Default

Forbidden as a development pattern: `*_new`, `*_v2`, `*_final`, `*_latest`, `*_backup`, `*_old`, `*_temp`.

Instead:
- **Modify** the canonical implementation, or
- If replacement is genuinely required: create new → migrate references → validate → **delete old in the same controlled change.**

History belongs in Git, not in the working tree.

---

## 5. Workflow Rules

### Starting a New Task
1. **Read first** — `README.md`, `ARCHITECTURE.md`, this file
2. **Load relevant skills** — `using-agent-skills` to discover what applies
3. **Create/Update todo list** — for any multi-step work (≥3 steps)
4. **Never edit a file without reading it first**
5. **Check conventions** — match existing code style, frameworks, patterns

### Making Changes
1. **Small commits** — one logical change per commit
2. **No force-push** — preserve Git history
3. **Branch per feature** — isolated worktrees for parallel work
4. **Validate locally** — run the project's actual package scripts (never invent commands)

### Code Style
- **No comments** unless explicitly requested
- **TypeScript strict** — `npm run lint` = `tsc --noEmit`
- **Python mypy strict** — `disallow_untyped_defs`, `warn_return_any`
- **Ruff format** — double quotes, 100-char lines, lf endings

---

## 6. Before Deleting

1. CHECK references (imports, config, CI, docs)
2. CHECK dynamic imports / plugins / runtime discovery
3. CHECK build passes after removal
4. CHECK tests pass after removal
5. CHECK documentation doesn't break
6. If any check is uncertain → **stop and ask**

## 7. Integration-Specific Rules

### When Porting AI Studio Capabilities
| Rule | Enforcement |
|------|-------------|
| Port prompts verbatim | Copy prompt templates from `server.ts` into FastAPI router |
| Keep fallbacks | Every LLM endpoint must have deterministic fallback when no key |
| Server-side only | `GEMINI_API_KEY` never in frontend bundle |
| Add to abstraction | New provider behind `AthenaAIProvider` interface |
| Version prompts | Store in `backend/src/athena/ai/prompts/` with version tags |

### When Merging Frontend Views
| Rule | Enforcement |
|------|-------------|
| Wire to real API | Replace `fetch("/api/...")` with `api.ts` client calls |
| Preserve brand | Existing design tokens — no hard-coded hex values in new components |
| Accessibility | `building-accessible-interfaces` skill for all new components |

### When Reconciling Data Models
| Rule | Enforcement |
|------|-------------|
| Explicit mapping | `PipelineStatus ↔ JobStatus` mapping table required |
| Adapter pattern | Don't mutate backend models — create adapters (`athena-mapper.ts`) |
| Single source of truth | Backend models canonical; frontend mirrors via `api.ts` types |

---

## 8. Quality Gates (Non-Negotiable)

Before any PR/merge:

- [ ] `npm ci` succeeds
- [ ] `npm run lint` passes (tsc --noEmit)
- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes (node --test, tests/server/)
- [ ] `cd backend && uv sync --extra dev` succeeds
- [ ] `cd backend && uv run ruff check .` (80 pre-existing errors tolerated by CI — no NEW errors)
- [ ] `cd backend && uv run pytest -q` passes
- [ ] `npm run test:e2e` passes when services are running (else document)
- [ ] No secrets in diff (`git diff | Select-String "API_KEY|SECRET|PASSWORD"` on added lines)

---

## 9. Anti-Patterns (Forbidden)

| Anti-Pattern | Why | Alternative |
|--------------|-----|-------------|
| `// TODO: fix later` in production code | Never gets fixed | Create GitHub issue, link in commit |
| Deleting "old" code before new is tested | Breaks production | Strangler fig: new alongside old, switch after validation |
| Hard-coding model names in multiple files | Vendor lock-in | `ATHENA_AI_PROVIDER` env + factory |
| Committing `.env` or `*.key` files | Security breach | `.env.example` only; real `.env` in `.gitignore` |
| Inventing new test commands | CI drift | Use `package.json` / `pyproject.toml` scripts exactly |
| Loose `.md` files at repo root | Documentation sprawl | `docs/` (root reserved for repo-level files only) |
| Committing generated artifacts (`.npy`, `.jsonl`, `*.egg-info`) | Repo bloat | `.gitignore` covers them; regenerate locally |

---

## 10. Escalation

When uncertain:
1. **Stop** — do not proceed
2. **Inspect** — read code, compare implementations
3. **Document** — write uncertainty down (PR notes or `repo-audit/OPEN_QUESTIONS.md`)
4. **Ask** — use the `question` tool for human clarification

**Never guess.** Preservation > velocity.

For repository cleanup work specifically, also follow
`ATHENA PHASED APPROVAL & ROLLBACK PROTOCOL.md` (risk levels R0–R5, checkpoints, rollback rules).
