# E2E Playwright Tests Implementation Plan

> **Status: SUPERSEDED / ARCHIVED (2026-10-03)** — This plan described the legacy `frontend/` Playwright suite (56 tests × 5 browsers) which was deleted with the `frontend/` directory on 2026-10-02. The current E2E gate is the root `e2e/aistudio/` smoke suite (8 tests × 3 engines = 24 tests + 4 contract tests = 33 total) running on chromium/firefox/webkit. See `WAYFINDER_MAP_4_E2E_Tests.md` for current state.

## Objective
Add Playwright E2E tests for critical Athena user flows to ensure end-to-end correctness after AI Studio integration.

## Critical Flows to Test (Priority Order)

### 1. Scrape → Score → Tailor → Sign-off → Receipt (Full Pipeline)
- **Entry**: Dashboard → Trigger Scrape
- **Wait**: 4h scheduler job completes (or manual trigger)
- **Verify**: Jobs appear in pipeline with ATS/match scores
- **Action**: Click "Tailor Resume" on high-scoring job (≥90)
- **Verify**: Document Studio opens with tailored resume
- **Action**: Enable dehumanizer, regenerate
- **Action**: Open Form Filler modal, complete sign-off (checkbox + typed signature)
- **Verify**: Receipt generated with confirmation hash
- **Verify**: Receipt appears in Receipts ledger with 7-day follow-up draft

### 2. Document Studio — Resume Generation (1-col / 2-col)
- Navigate to `/athena/documents/:jobId`
- Switch between 1-column and 2-column layouts
- Toggle dehumanizer on/off
- Click "Print" → verify print-optimized CSS renders
- Click "Copy Markdown" → verify clipboard content

### 3. n8n Integration
- Navigate to `/athena/n8n`
- Verify 5-node topology renders
- Edit payload, click "Test Webhook"
- Verify execution response displays

### 4. Automation Controls (RightSidebar)
- Verify ATS thresholds (auto-apply ≥90, flag 80-89) persist
- Toggle dehumanizer enabled/disabled
- Verify sign-off queue shows FLAGGED jobs
- Verify n8n status pill reflects webhook URL config

### 5. Scope Taxonomy Filtering (LeftSidebar)
- Filter by Lilongwe Local / Lilongwe Remote / International Remote
- Verify job list updates correctly

---

## Technical Implementation

### Dependencies to Add (frontend/package.json)
```json
{
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "playwright": "^1.50.0"
  }
}
```

### Project Structure
```
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts          # Test users, jobs, profiles
│   ├── pages/
│   │   ├── DashboardPage.ts      # Page object for dashboard
│   │   ├── DocumentStudioPage.ts # Page object for document studio
│   │   ├── FormFillerPage.ts     # Page object for form filler modal
│   │   ├── N8nIntegrationPage.ts # Page object for n8n view
│   │   ├── ReceiptsPage.ts       # Page object for receipts ledger
│   │   └── JobListPage.ts        # Page object for job list/pipeline
│   ├── tests/
│   │   ├── full-pipeline.spec.ts         # Scrape→Score→Tailor→Sign-off→Receipt
│   │   ├── document-studio.spec.ts       # Resume generation, layouts, print
│   │   ├── n8n-integration.spec.ts       # n8n topology, webhook test
│   │   ├── automation-controls.spec.ts   # RightSidebar controls
│   │   └── scope-filtering.spec.ts       # LeftSidebar scope filters
│   ├── playwright.config.ts
│   └── global-setup.ts          # Start backend/frontend, seed data
├── package.json
```

### Playwright Config (frontend/e2e/playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8530',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm run dev:test',
    url: 'http://localhost:8530',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});
```

### Global Setup (frontend/e2e/global-setup.ts)
- Start backend via docker-compose (or direct uv run)
- Start frontend via vite dev server
- Seed test data via API (create test profile, trigger scrape with known results)
- Wait for health checks

### Test Data Strategy
- Use `ATHENA_AI_PROVIDER=fallback` for deterministic AI responses
- Create test profile with known skills/experience
- Use mock scrape data or controlled scrape against test endpoints

---

## Package.json Scripts to Add
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "dev:test": "concurrently \"uv run uvicorn athena.api.server:app --host 0.0.0.0 --port 8000\" \"vite\""
  }
}
```

---

## CI Integration (.github/workflows/e2e.yml)
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: cd frontend && pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: docker-compose up -d backend
      - run: sleep 10 && curl -f http://localhost:8520/health
      - run: cd frontend && pnpm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/e2e/test-results/
```

---

## Acceptance Criteria
- [ ] All 5 critical flows have at least 1 passing test
- [ ] Tests run in CI on every PR
- [ ] Tests use fallback provider (no external API keys needed)
- [ ] Tests complete in < 5 minutes
- [ ] Page objects follow DRY principle
- [ ] Test data is isolated per test run

---

## Effort Estimate
| Task | Hours |
|------|-------|
| Setup Playwright + config | 2 |
| Page objects (5 pages) | 4 |
| Test fixtures & global setup | 3 |
| 5 test files (1 per flow) | 8 |
| CI integration | 2 |
| Debugging & flakiness reduction | 4 |
| **Total** | **~23 hours** |