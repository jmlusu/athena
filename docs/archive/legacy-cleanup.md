# Spec: Legacy Artifact Cleanup

## Objective
Remove all legacy artifacts identified in the repository audit to reduce noise, eliminate confusion, and align the codebase with the current architecture (React SPA + Express BFF + FastAPI backend). The legacy `frontend/` and old `backend/` were deleted in commit 64f8de0, but their artifacts, logs, docs, and duplicate assets remain.

## Tech Stack
- Repository: Git (Windows PowerShell)
- No code changes — file deletions and `.gitignore` updates only

## Commands
```
# Verify current state
git status

# Delete legacy directories
Remove-Item -Recurse -Force profile, deploy, .media, backend/artifacts, backend/company, tasks, artifacts/e2e-crossbrowser-20261002, artifacts/e2e-proof-20261001-163757, artifacts/e2e-proof-20261001-164037, artifacts/walkthrough

# Delete legacy root files
Remove-Item -Force docker-compose.yml, docker-compose.prod.yml, Dockerfile.frontend, .dockerignore, test-server.js, metadata.json
Remove-Item -Force backend.log, backend-legacy.log, api_run.log, server.log, walkthrough_backend.log, walkthrough_dev.log, frontend-legacy.log, ci-main.log, ci14.log
Remove-Item -Force MIGRATION_PLAN.md, MIGRATION_BASELINE.md, MIGRATION_GAP_ANALYSIS.md, FINAL_MIGRATION_REPORT.md, FINAL_VISUAL_PARITY_REPORT.md, DEPLOYMENT_SPLIT.md, STAGING_DEPLOYMENT_SUMMARY.md, QA_AUDIT_REPORT.md, TOOL_EXECUTION_ISSUES_REPORT.md
Remove-Item -Force "app_architecture_diagram.jpg", "Athena Architecture Diagram.png", "Athena System Architecture Blueprint.png", "Job Automation Pipeline Flowchart.png"
Remove-Item -Force athena-opencode-migration-directive.md, athena-opencode-migration-directive.txt

# Update .gitignore (remove legacy refs, add new ignores)
# Then verify
git status
git diff .gitignore
```

## Project Structure
```
Root deletions:
- profile/, deploy/, .media/, tasks/
- backend/artifacts/, backend/company/
- artifacts/e2e-crossbrowser-20261002/, artifacts/e2e-proof-20261001-*, artifacts/walkthrough/
- 28 root files (logs, docs, diagrams, scripts)
- .gitignore updates
```

## Code Style
N/A — cleanup only

## Testing Strategy
- Verify `git status` shows only expected deletions
- Verify `npm run lint` passes (TypeScript)
- Verify `npm run build` succeeds
- Verify `npm run test:e2e` passes (if backend running)

## Boundaries
- **Always:** Verify CI passes before/after; keep `company/athena/` (live data); keep `artifacts/locks/` (agent coordination)
- **Ask first:** Deleting any file not explicitly listed in audit as LEGACY
- **Never:** Delete `backend/`, `src/`, `server.ts`, `athena-mapper.ts`, `e2e/`, `docs/`, `.github/`, `ATHENA-AI-STUDIO-HANDOFF/`, `company/athena/`, `artifacts/locks/`

## Success Criteria
- [ ] All 28 LEGACY root files deleted
- [ ] All 4 LEGACY directories deleted (+ subdirs)
- [ ] Old artifacts subdirs deleted
- [ ] `.gitignore` updated (legacy refs removed, `.opencode/`, `.superpowers/`, `AppData/` added)
- [ ] `git status` shows only these deletions
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

## Open Questions
- Should `WAYFINDER_MAP_*.md`, `UI_FIX_PLAN.md`, `ROADMAP_STEP2_ANALYSIS.md`, `AUTONOMOUS_CONTROLS_RIGHT_PANE_REQUIREMENTS.md`, `dual_environment_compatibility_standard.md` be kept or archived? (Marked AMBIGUOUS in audit)
- Should `Caddyfile` be kept for future Docker/prod use?
- Should `tasks/` be kept as a directory for future task files?