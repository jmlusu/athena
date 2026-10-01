# ATHENA — Agent Behavior Rules

**Scope:** All AI agents (OpenCode, Codex, Cursor, human developers) working on the Athena codebase.

---

## 1. Core Principles

| Rule | Description |
|------|-------------|
| **Preserve Functionality** | Existing functionality is presumed valuable. Never delete merely because AI Studio has another version, structure differs, code looks older, or could be "more elegant." |
| **No Destructive Guessing** | Before deleting anything, determine: What does it do? Who uses it? Is it duplicated? What replaces it? Has replacement been tested? Could deletion break production? If uncertain: DO NOT DELETE — document uncertainty. |
| **Spec-Driven** | Work from `ATHENA_MASTER_SPEC.md`. If requirements are unclear, create a spec first (`spec-driven-development` skill). |
| **Incremental** | Deliver changes in small, verifiable steps (`incremental-implementation` skill). After each major phase: build → test → inspect → commit. |
| **Evidence Over Prose** | Claims of "it works" require verification: test output, build log, screenshot, measured numbers. |
| **Security First** | Never commit secrets. Use env vars. Follow `security-and-hardening` skill. |
| **Traceability** | Every decision documented in `MERGE_DECISIONS.md`. Every change traceable to a capability classification. |

---

## 2. Workflow Rules

### Starting a New Task
1. **Load relevant skills** — `using-agent-skills` to discover what applies
2. **Create/Update todo list** — `todowrite` for any multi-step work (≥3 steps)
3. **Read before write** — Never edit a file without reading it first
4. **Check conventions** — Match existing code style, frameworks, patterns

### Making Changes
1. **Small commits** — One logical change per commit
2. **No force-push** — Preserve Git history
3. **Branch per feature** — Use `new-feature` skill for isolated worktrees
4. **Validate locally** — Run project's actual package scripts (not invented commands)

### Code Style
- **No comments** unless explicitly requested
- **TypeScript strict mode** — `noEmit`, `isolatedModules`, `disallowUntypedDefs`
- **Python mypy strict** — `disallow_untyped_defs`, `warn_return_any`
- **Ruff format** — double quotes, 100-char lines, lf endings

---

## 3. Integration-Specific Rules

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
| Keep react-router | AI Studio's view-switch → real routes under `/athena/*` |
| Wire to real API | Replace `fetch("/api/...")` with `api.ts` client calls |
| Preserve brand | Cinzel/Lora/Plus Jakarta Sans, Navy/Red/Cyan/Orange tokens |
| Accessibility | `building-accessible-interfaces` skill for all new components |

### When Reconciling Data Models
| Rule | Enforcement |
|------|-------------|
| Explicit mapping | `PipelineStatus ↔ JobStatus` mapping table required |
| Adapter pattern | Don't mutate OpenCode models — create adapters |
| Single source of truth | Backend models canonical; frontend mirrors via `api.ts` types |

---

## 4. Quality Gates (Non-Negotiable)

Before any PR/merge:
- [ ] `pnpm install` succeeds (root + frontend)
- [ ] `uv sync` succeeds (backend)
- [ ] `pnpm run build` succeeds (frontend)
- [ ] `uv run python -m mypy backend/src` passes
- [ ] `uv run ruff check backend/src` passes
- [ ] `pnpm run lint` passes (frontend tsc --noEmit)
- [ ] `uv run pytest backend/tests` passes (or documented exceptions)
- [ ] `pnpm run test` passes (frontend vitest)
- [ ] No secrets in diff (`git diff --name-only | xargs grep -l "API_KEY\|SECRET\|PASSWORD" 2>/dev/null` returns empty)

---

## 5. Anti-Patterns (Forbidden)

| Anti-Pattern | Why | Alternative |
|--------------|-----|-------------|
| `// TODO: fix later` in production code | Never gets fixed | Create GitHub issue, link in commit |
| Deleting "old" code before new is tested | Breaks production | Strangler fig: new alongside old, switch after validation |
| Hard-coding `gemini-3.8-flash` in multiple files | Vendor lock-in | Single provider config, model name in env |
| Committing `.env` or `*.key` files | Security breach | `.env.example` only; real `.env` in `.gitignore` |
| Inventing new test commands | CI drift | Use `package.json` / `pyproject.toml` scripts exactly |

---

## 6. Escalation

When uncertain:
1. **Stop** — Do not proceed
2. **Inspect** — Read code, compare implementations
3. **Document** — Write uncertainty to `MERGE_DECISIONS.md` with `UNKNOWN` classification
4. **Ask** — Use `question` tool for human clarification

**Never guess.** Preservation > velocity.