# Wayfinder Map 4: E2E Test Completion (Playwright Tests)

## Current State
- **Status**: **0/56 executed** — test files exist but no E2E run has ever executed (re-verified 2026-09-28)
- **Configured but**: Requires running backend services (`docker-compose up -d`); `e2e.yml` never registered/run on default branch
- **Test Files**: 6 E2E Playwright test files (56 unique tests × 5 projects = 280 in `--list` probe)
- **Backend Tests**: 6 pytest files — **44 passed** (verified 2026-09-28)
- **Frontend Vitest**: 2 files — **23 tests pass** (vitest 23/23, verified 2026-09-28)
  - **CORRECTION (2026-09-28):** count is **23 tests pass**, not 26.

## Decision Tickets (Resolve One at a Time)

### Ticket A: Start E2E Test Suite with Docker Compose
- **Requirement**: Run `docker-compose up -d` to start all backend services
- **Current**: Tests configured but backend not running
- **Resolution**: Start Docker Compose environment; verify all services (API, database, n8n) are healthy
- **Dependencies**: Docker installed; docker-compose configured for athena project
- **Evidence**: `ci.yml` and `e2e.yml` both COMPLEMENT; pipelines aligned with local validation gates
  - **CORRECTION (2026-09-28):** **FALSE.** `e2e.yml` was **never registered/run** on the default branch; the CI **frontend job fails at install**; the **`Docker image build` job fails**. Fix in progress by P0-c (devops agent, `.github/`) — outcome not asserted here.

### Ticket B: Verify Functional Test Suite (32 tests)
- **Requirement**: Run the 32 functional E2E tests across 12 screens
- **Current**: Tests wait for backend services; need full stack running
- **Resolution**: Execute `pnpm test` or playwright test command; verify all 32 functional tests pass
- **Dependencies**: Ticket A (docker-compose running); API endpoints responding; database seeded
- **Evidence**: Test files in e2e/ directory; each test targets specific screens/API workflows

### Ticket C: Verify Visual Regression Test Suite (24 tests)
- **Requirement**: Run the 24 visual regression tests across 12 screens × 2 viewports (desktop + mobile)
- **Current**: Visual regression compares screenshots; needs stable baseline images
- **Resolution**: Execute visual regression tests; update baseline images if design changes are intentional; fix any unintentional regressions
- **Dependencies**: Ticket A (docker-compose); Ticket B (functional tests passing first)
- **Evidence**: Vitest/configuration for visual tests; Playwright screenshot comparison

### Ticket D: Full E2E Test Completion & CI Integration
- **Requirement**: Achieve 100% E2E test pass rate; integrate with CI pipeline
- **Current**: Some tests may fail due to timing, environment, or data issues
- **Resolution**: Debug and fix failing tests; establish stable test environment; add to CI pipeline (e2e.yml already configured)
- **Dependencies**: Tickets A-C complete; flaky test identification and resolution
- **Evidence**: CI pipeline e2e.yml runs playwright tests on every PR; need local reproducibility first
  - **CORRECTION (2026-09-28):** **FALSE.** `e2e.yml` has **never been registered/run** on the default branch, and no executed E2E run exists (280 skipped / 0 executed). Fix in progress by P0-c (devops agent, `.github/`) — outcome not asserted here.

## Path Forward
Resolve tickets in order: A → B → C → D. Critical path: Ticket A is prerequisite for all others. Start with Ticket A (docker-compose startup) as it's the foundational enabler for the entire E2E test suite.

**Destination**: All 56 E2E tests (32 functional + 24 visual regression) pass consistently locally; CI pipeline e2e.yml runs successfully on every PR; test suite is a verified gate before production deployments.

---
*Wayfinder Map generated for athena project. Resolve one ticket at a time until E2E test suite is fully passing.*