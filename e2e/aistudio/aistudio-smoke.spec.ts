import { test, expect, type Page } from '@playwright/test';

/**
 * AI Studio (root SPA) smoke suite.
 *
 * Target: the root `src/App.tsx` view-switcher SPA served by `server.ts`
 * (Express BFF + Vite middleware) on http://localhost:3000 — the only app in
 * this repo (the legacy `frontend/` React app was removed on 2026-10-02).
 *
 * There is no router: navigation is a `currentView` state switch in App.tsx.
 * Stable signals already present in the app (no test hooks added anywhere):
 *   - sidebar buttons: data-testid="nav-<view id>"  (LeftSidebar.tsx)
 *   - sticky-header breadcrumb span: `currentView.replace("_", " ")`
 *   - one view-specific heading per view (see VIEWS below)
 */

type ViewSpec = {
  /** App view id — also the `nav-<id>` data-testid suffix. */
  id: string;
  /** Unique view-specific heading rendered only while this view is active. */
  marker: string;
};

const VIEWS: ViewSpec[] = [
  { id: 'pipeline', marker: '1. Discovered' },
  { id: 'scraper', marker: 'Athena Live Scraper & Semantic Aggregator' },
  { id: 'documents', marker: 'Upscale White-Collar Document Studio' },
  { id: 'form_filler', marker: 'Online Application Form Assistant' },
  { id: 'receipts', marker: 'Application Receipts & Follow-Up Ledger' },
  { id: 'n8n', marker: 'n8n Workflow Automation Engine' },
  { id: 'profile', marker: 'Applicant Dossier & Document Knowledge Base' },
];

/** View id -> expected breadcrumb label ("form_filler" -> "form filler"). */
const labelFor = (id: string) => id.replace('_', ' ');

/**
 * Sticky header breadcrumb: the per-view span is the only
 * `.font-semibold.capitalize` element inside <main><header>.
 */
const breadcrumb = (page: Page) =>
  page.locator('main header span.font-semibold.capitalize');

/**
 * Console-error guard — every test in this suite must leave the page clean.
 *
 * Whitelist policy: add an entry ONLY with a comment proving the message is
 * environment/dev noise (never an application defect). Real console errors
 * from the app are findings and must be reported, not silenced.
 */
const CONSOLE_ERRORS: string[] = [];
const CONSOLE_WHITELIST: RegExp[] = [
  // Intentionally empty: the first full run of this suite produced no console
  // errors at all (verified across two consecutive green runs), so there is
  // nothing proven-noisy to whitelist yet.
];

test.beforeEach(async ({ page }) => {
  CONSOLE_ERRORS.length = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') CONSOLE_ERRORS.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    CONSOLE_ERRORS.push(`pageerror: ${err.message}`);
  });
});

test.afterEach(() => {
  const unexpected = CONSOLE_ERRORS.filter((text) =>
    CONSOLE_WHITELIST.every((pattern) => !pattern.test(text)),
  );
  expect(unexpected, `Unexpected page errors:\n${unexpected.join('\n')}`).toEqual([]);
});

test('health: GET /api/health returns status ok', async ({ request, page }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as {
    status: string;
    hasApiKey: boolean;
    timestamp: string;
  };
  expect(body.status).toBe('ok');

  // Smoke: the SPA boots straight into its default "pipeline" view (no router,
  // no navigation) and the kanban stage headings render.
  await page.goto('/');
  await expect(breadcrumb(page)).toHaveText(labelFor('pipeline'), { ignoreCase: true });
  await expect(page.getByRole('heading', { name: '1. Discovered' })).toBeVisible();
});

test('contract: POST /api/ai/score-ats proxies to backend (proxy path works)', async ({ request }) => {
  const response = await request.post('/api/ai/score-ats', {
    data: { job_id: 'test-job', applicant_id: 'test-applicant' },
  });
  // Proxy should not return 502/504 (proxy errors); any other status = path works
  expect([502, 504]).not.toContain(response.status());
  const body = await response.json();
  expect(body).toBeTruthy();
});

test('contract: POST /api/ai/tailor-resume proxies to backend (proxy path works)', async ({ request }) => {
  const response = await request.post('/api/ai/tailor-resume', {
    data: { job_id: 'test-job', applicant_id: 'test-applicant' },
  });
  expect([502, 504]).not.toContain(response.status());
  const body = await response.json();
  expect(body).toBeTruthy();
});

test('contract: POST /api/submit-application proxies to backend (proxy path works)', async ({ request }) => {
  const response = await request.post('/api/submit-application', {
    data: { job_id: 'test-job', applicant_id: 'test-applicant' },
  });
  expect([502, 504]).not.toContain(response.status());
  const body = await response.json();
  expect(body).toBeTruthy();
});

for (const view of VIEWS) {
  test(`view ${view.id}: breadcrumb label and view marker render`, async ({ page }) => {
    await page.goto('/');

    // The pipeline view is the app default: assert it is already on screen
    // before any navigation happens.
    if (view.id === 'pipeline') {
      await expect(breadcrumb(page)).toHaveText(labelFor('pipeline'), { ignoreCase: true });
      await expect(page.getByRole('heading', { name: view.marker })).toBeVisible();
    }

    await page.locator(`[data-testid="nav-${view.id}"]`).click();

    // Header breadcrumb reflects the selected view.
    await expect(breadcrumb(page)).toHaveText(labelFor(view.id), { ignoreCase: true });
    // View-specific marker (role/heading based) is visible.
    await expect(page.getByRole('heading', { name: view.marker })).toBeVisible();
    // The clicked nav button is the active one.
    await expect(page.locator(`[data-testid="nav-${view.id}"]`)).toHaveClass(/bg-\[#F97316\]/);
  });
}
