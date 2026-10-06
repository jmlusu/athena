# SECURITY AUDIT

**Method:** pattern scan of all 239 tracked files + manual review of env/config + inspection of scripts.

---

## Findings

### 1. No live credentials in Git — PASS

| Check | Result |
|---|---|
| `api_key/secret/token/password = <16+ chars>` in tracked files | 1 hit → `docs/ATHENA_FUNCTIONAL_AND_TECHNICAL_SPECIFICATION.md:470` = `"YOUR_GEMINI_API_KEY"` **placeholder, not a secret** |
| `.env.example` | placeholders only ✓ |
| `.env` | **untracked + gitignored** ✓ (contains real `ATHENA_API_KEY`, `GEMINI_API_KEY` locally) |
| Private keys / JWT secrets / cloud creds | none found |
| Hardcoded URLs with embedded credentials | none found |

### 2. Hardcoded dev credential — LOW

- `scripts/cleanup_duplicates.ps1` / `cleanup_remaining.ps1` embed
  `X-API-Key = "dev-admin-key"` (the documented dev default).
- Not a real secret, but normalizes committing credentials.
- **Action:** DELETE both obsolete scripts.

### 3. PII in working tree — correctly ignored, but confirm intent

`profile/` (71 files) contains real personal documents: resumes, certificates,
passport-style PDFs, employment records for a named individual.

- Ignored by `.gitignore` (`profile/`) ✓ — **verify never committed in history**
  (directive §20 requires history check → see Open Questions; run
  `git log --all --diff-filter=A -- "profile/*"` before Phase 5 sign-off).
- Runtime `user_profiles.jsonl` **was** committed under `athena/company/...` (see GENERATED_FILES)
  → must be untracked; assess whether content includes personal data (job applications).

### 4. Security posture of the app — documented, no action in this cleanup

- FastAPI: CORS allowlist, rate limit 100/min/IP, `X-API-Key` on mutating verbs,
  CSP/HSTS/X-Frame-Options/Referrer-Policy (ARCHITECTURE.md §1, MW node)
- Express BFF: no auth middleware **by design** (holds key server-side, proxies)
- HITL gate: `/ai/submit-application` rejects without `authorization_signature`
- `.github/workflows`: `permissions: contents: read` ✓

### 5. Dependency exposure

- `@google/genai` unused in Node → attack surface + bloat; remove (see DEPENDENCY_MAP)
- All deps pinned via lockfiles ✓; Dependabot active ✓

### 6. `.gitignore` review (§19)

- Does **not** hide source directories ✓ (no `src/`, `backend/src/` ignores)
- Known gap flagged by directive: `src/ai_company/orchestrator/` — **not applicable**,
  no such path exists here (directive written partly for a different repo)
- Gaps: `*.egg-info/`, `.benchmarks/` → add
- `backend/.env.production.example` tracked while `.env.*` patterns ignore
  `.env.local/.staging/.production` only — no conflict, but the file is obsolete config (§9)

---

## Required rotation assessment

No credential was ever exposed in the working tree's tracked files → **no rotation required**
based on current-tree scan. History-wide scan (`git log -p` over all refs) not yet run —
recorded as OPEN_QUESTION (§20 mandates it if any secret was ever committed).
