# ATHENA — Inventory Directive

**Purpose:** Standard methodology for forensic inventory of both Athena implementations.

**Applies To:** OpenCode canonical repository + AI Studio export.

---

## 1. Inventory Categories (Mandatory)

Every inventory MUST cover all 17 categories with file:line evidence:

| # | Category | What to Document |
|---|----------|------------------|
| 1 | **Architecture** | Process layout, entry points, inter-process communication, ports, reverse proxy |
| 2 | **Frameworks & Runtimes** | Language versions, framework versions, package managers, build tools |
| 3 | **Dependencies** | Full dep tree (prod + dev), versions, rationale for each major dep |
| 4 | **Routes** | ALL HTTP endpoints (method, path, handler file:line, purpose) + ALL frontend routes (path, component, file:line) |
| 5 | **Components** | React components / Python modules — hierarchy, props, purpose |
| 6 | **APIs** | Frontend client functions (name, method, path, request/response types) |
| 7 | **Services** | Backend service modules (ats, matching, scrapers, documents, automation, scheduler, store) |
| 8 | **Database / Persistence** | Storage technology, schema, files, indexes, sample records |
| 9 | **Authentication / Authorization** | Auth scheme, middleware, exempt paths, rate limits, headers, roles |
| 10 | **AI Providers** | LLM SDKs, embedding models, env vars, provider abstraction, fallbacks |
| 11 | **Agents / Orchestration** | Schedulers, job queues, agent loops, cron, workflow engines |
| 12 | **Prompts** | All prompt templates (file:line), versioning, parameterization |
| 13 | **Tools** | CLI scripts, dev tools, build scripts, deployment scripts |
| 14 | **Configuration** | Every env var read (grep `os.getenv`, `process.env`, `BaseSettings`), `.env.example`, config files |
| 15 | **Deployment** | Dockerfiles, compose, k8s/OCI, CI workflows, health checks, rollback |
| 16 | **Testing** | Test files, coverage, runners, commands, what each test validates |
| 17 | **External Services** | Third-party APIs, scraping targets, hosting platforms, CDNs |

---

## 2. Evidence Standards

| Requirement | Standard |
|-------------|----------|
| **File:line citations** | Every claim references `path/to/file.ext:line` or `path/to/file.ext:start-end` |
| **No prose-only claims** | "It has X" → "X at `file:line`" |
| **Quantitative** | Count files, lines, endpoints, tests, dependencies |
| **Cross-references** | Link to related items (e.g., "route X calls service Y at `service.py:42`") |
| **Defects noted** | Broken imports, dead code, mismatches, TODOs marked explicitly |

---

## 3. Output Format

Each inventory produces a single markdown file:

```
docs/integration/OPENCODE_INVENTORY.md
docs/integration/AI_STUDIO_INVENTORY.md
```

Structure:
```markdown
# [Side] — Forensic Inventory
## 1. Architecture
## 2. Frameworks & Runtimes
## 3. Dependencies
## 4. Routes
## 5. Components
## 6. APIs
## 7. Services
## 8. Database / Persistence
## 9. Authentication / Authorization
## 10. AI Providers
## 11. Agents / Orchestration
## 12. Prompts
## 13. Tools
## 14. Configuration
## 15. Deployment
## 16. Testing
## 17. External Services
## Cross-references
```

---

## 4. Comparison Document

After both inventories complete, produce:

```
docs/integration/IMPLEMENTATION_COMPARISON.md
```

With:
- Capability Ownership Matrix (table)
- Features unique to each side
- Files implementing same functionality differently
- Known defects (both sides)
- Non-destructive merge guidance

---

## 5. Tooling

| Task | Tool |
|------|------|
| File discovery | `glob` (`**/*.py`, `**/*.tsx`, etc.) |
| Content search | `grep` (regex, with `include` filter) |
| File reading | `read` (with offset/limit for large files) |
| Directory tree | `bash` `ls -laR` / `tree` |
| Git status | `bash` `git status`, `git diff`, `git log` |

**No modification** during inventory phase. Read-only analysis only.

---

## 6. AI Studio Inventory Source

AI Studio export location: `C:\Users\jmlus\Downloads\athena-ai-studio-integration`

**Note:** Not a git repo. No `node_modules`. Static analysis only.