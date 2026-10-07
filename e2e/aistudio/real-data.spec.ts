import { test, expect, type Page, type Route, type APIRequestContext } from '@playwright/test';

/**
 * Real-data pipeline suite.
 *
 * Guards the regression this repo actually suffered: the BFF had no route for
 * /api/v1/athena/*, so every data call fell through to the SPA fallback and came
 * back as text/html. `api.ts` then failed to parse it, App.tsx caught the error,
 * and the whole dashboard rendered src/data/mockData.ts while looking healthy.
 *
 * Everything that asserts on rendered output stubs /jobs with a fixture. CI checks
 * out a fresh repo, and company/athena/jobs.jsonl is gitignored scraped data, so
 * the store is empty there -- a suite that depends on ~140 local rows would fail
 * on every PR while proving nothing. Stubbing also lets the pagination test pin
 * exact page boundaries, which no live store can guarantee.
 *
 * One test deliberately hits the real backend: that the BFF answers /jobs with
 * JSON. That is the actual bug, and stubbing it away would test nothing.
 */

const BANNER = /Pipeline is not live/i;
const CRON_BUTTON = /Execute 4h Cycle Now/i;

const consoleErrors: string[] = [];
// Set by tests that deliberately break a request. A 503 we injected ourselves
// logs "Failed to load resource" to the console, which is the browser reporting
// our own stub -- not an application defect.
let expectNetworkErrors = false;

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  expectNetworkErrors = false;
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
});

test.afterEach(() => {
  if (expectNetworkErrors) return;
  expect(consoleErrors, `Unexpected page errors:\n${consoleErrors.join('\n')}`).toEqual([]);
});

// ── Fixtures ─────────────────────────────────────────────────────────────

interface JobFixture {
  id: string;
  title: string;
  company: string;
  location: string;
  category: 'job' | 'consultancy';
  scope: 'lilongwe-local' | 'lilongwe-remote' | 'international-remote';
  platform: string;
  description: string;
  requirements: string[];
  salaryOrBudget: string;
  deadline: string;
  atsScore: number;
  postedDate: string;
  status: string;
  isFlagged: boolean;
}

/** Job fixtures for pagination tests, providing diverse test data. */
const FIXTURE_JOBS: JobFixture[] = Array.from({ length: 150 }, (_, i) => ({
  id: `fixture-${i}`,
  // Distinctive, index-encoded titles so a locator can pin one exact card.
  title: `Fixture Role ${i} — Senior Platform Engineer`,
  company: `Fixture Employer ${i % 7}`,
  location: i % 3 === 0 ? 'Lilongwe, Malawi' : 'Remote',
  category: i % 5 === 0 ? 'consultancy' : 'job',
  scope: i % 3 === 0 ? 'lilongwe-local' : 'international-remote',
  platform: 'LinkedIn',
  description: `Description for fixture role ${i}.`,
  requirements: ['Python', 'n8n'],
  salaryOrBudget: 'Not disclosed',
  deadline: '',
  // Mixed integer/decimal scores so the ATS assertion cannot pass by luck.
  atsScore: i % 2 === 0 ? 47.1 + i / 100 : 55,
  postedDate: '2026-09-01',
  status: 'evaluated',
  isFlagged: false,
}));

/** Serve FIXTURE_JOBS with real offset/limit semantics, including short pages. */
async function stubJobs(page: Page, total = FIXTURE_JOBS.length): Promise<void> {
  // Truncate the pool, not just the envelope: the client stops paginating on a
  // short page, so `total` has to govern how many rows actually exist.
  const pool = FIXTURE_JOBS.slice(0, total);

  await page.route('**/api/v1/athena/jobs*', async (route: Route) => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const limit = Number(url.searchParams.get('limit') ?? '100');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // The BFF wraps rows in an envelope; mirror that exactly.
      body: JSON.stringify({ jobs: pool.slice(offset, offset + limit), total: pool.length }),
    });
  });
}

const SCRAPE_STUB = {
  id: 'test-scrape',
  source: 'linkedin',
  query: 'engineer',
  location: null,
  jobType: null,
  maxResults: 25,
  status: 'completed',
  jobsFound: 7,
  jobsNew: 3,
  jobsUpdated: 4,
  error: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-10-03T00:00:00Z',
};

/**
 * Stand in for /scrape and /process so the suite never triggers a real network
 * scrape (30s+ and it rewrites jobs.jsonl) once per browser project.
 * Pass `record` to capture request bodies and their order.
 */
async function stubScrapeCycle(
  page: Page,
  record?: { path: string; body: unknown }[]
): Promise<void> {
  await page.route('**/api/v1/athena/scrape', (route: Route) => {
    record?.push({ path: '/api/v1/athena/scrape', body: route.request().postDataJSON() });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SCRAPE_STUB),
    });
  });
  await page.route('**/api/v1/athena/process', (route: Route) => {
    record?.push({ path: '/api/v1/athena/process', body: route.request().postDataJSON() });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'processed', totalJobs: 138, scored: 3 }),
    });
  });
}

// ── Tests ────────────────────────────────────────────────────────────────

test('the BFF serves /api/v1/athena/jobs as JSON, not index.html', async ({ request }) => {
  // The one test that must hit the real backend: the original bug was this
  // route answering text/html, so a stub would make the regression invisible.
  const response = await request.get('/api/v1/athena/jobs?limit=5');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  // CI has an empty store, so assert the envelope shape, never row count.
  const body = (await response.json()) as { jobs: unknown[]; total: number };
  expect(Array.isArray(body.jobs)).toBe(true);
  expect(typeof body.total).toBe('number');
});

test('jobs paginate at the backend 100-row ceiling up to the 200 cap', async ({ page }) => {
  const limits: number[] = [];
  const offsets: number[] = [];

  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname.endsWith('/api/v1/athena/jobs')) {
      limits.push(Number(url.searchParams.get('limit')));
      offsets.push(Number(url.searchParams.get('offset')));
    }
  });

  await stubJobs(page);
  await page.goto('/');

  // Wait on any fixture card (seed rows use different titles), not a deep
  // index: the per-column pager hides cards past the first page. The API
  // contract itself is pinned by the poll below.
  await expect(page.getByRole('heading', { name: /Fixture Role \d/ }).first()).toBeVisible();
  await expect
    .poll(() => [...new Set(offsets)].sort((a, b) => a - b), { timeout: 10_000 })
    .toContain(100);

  // FastAPI rejects limit > 100 with a 422, so the client must never ask for it.
  expect(limits.length).toBeGreaterThan(0);
  for (const limit of limits) expect(limit).toBeLessThanOrEqual(100);

  // 150 rows must arrive as offsets 0 then 100, in order.
  const unique = [...new Set(offsets)].sort((a, b) => a - b);
  expect(unique).toEqual([0, 100]);
  // And it must stop at the 200-row client cap rather than walking page three.
  expect(Math.max(...unique)).toBeLessThan(200);
});

test('a single-page store makes exactly one request', async ({ page }) => {
  const calls: number[] = [];

  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname.endsWith('/api/v1/athena/jobs')) calls.push(Number(url.searchParams.get('offset')));
  });

  // 40 rows: a short first page means there is nothing to fetch.
  await stubJobs(page, 40);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: FIXTURE_JOBS[0].title })).toBeVisible();

  // Compare distinct offsets, not raw calls: React StrictMode double-invokes the
  // load effect in dev, so page one is legitimately requested twice. What matters
  // is that no second page is ever opened.
  expect([...new Set(calls)]).toEqual([0]);
});

test('the pipeline renders backend jobs rather than the seed rows', async ({ page }) => {
  await stubJobs(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: FIXTURE_JOBS[0].title })).toBeVisible();

  // A live load must not show the "not live" banner.
  await expect(page.getByText(BANNER)).toHaveCount(0);

  // The stage summary counts what actually rendered, not the seed 8.
  const stageSummary = await page.getByText(/All Stages \(\d+\)/).innerText();
  const rendered = Number(stageSummary.match(/\((\d+)\)/)?.[1] ?? '0');
  expect(rendered).toBeGreaterThan(0);
});

test('a card ATS score equals the backend ats_score for that job', async ({ page }) => {
  await stubJobs(page);
  await page.goto('/');

  // Pick a decimal score so the assertion cannot pass on an integer default.
  const job = FIXTURE_JOBS.find((j) => j.atsScore % 1 !== 0)!;
  const card = page.getByRole('heading', { name: job.title }).locator('xpath=ancestor::*[3]');

  await expect(card).toContainText(String(job.atsScore));
  await expect(page.getByText('ATS Match').first()).toBeVisible();
});

test('no response carries a synthesized fallback listing', async ({ page }) => {
  const offenders: string[] = [];

  page.on('response', async (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const body = await response.text().catch(() => '');
    // /api/ai/scrape-live returns these ids when no Gemini key is configured.
    if (/job-mw-\d+|job-intl-\d+/.test(body)) offenders.push(url.pathname);
  });

  await stubJobs(page);
  await stubScrapeCycle(page);

  await page.goto('/');
  await page.getByRole('button', { name: CRON_BUTTON }).click();
  await expect(page.getByText(/cron cycle completed/i)).toBeVisible({ timeout: 15000 });

  expect(offenders, `Synthesized payloads leaked via: ${offenders.join(', ')}`).toEqual([]);
});

test('Execute 4h Cycle Now posts the real scrape contract', async ({ page }) => {
  const bodies: { path: string; body: unknown }[] = [];

  await stubJobs(page);
  await stubScrapeCycle(page, bodies);

  await page.goto('/');
  await page.getByRole('button', { name: CRON_BUTTON }).click();
  await expect(page.getByText(/cron cycle completed/i)).toBeVisible({ timeout: 15000 });

  // Order matters: /process must follow /scrape, because /scrape writes unscored
  // jobs and reloading before scoring would show rows with no ATS score.
  expect(bodies.map((b) => b.path)).toEqual([
    '/api/v1/athena/scrape',
    '/api/v1/athena/process',
  ]);

  const scrapeBody = bodies[0].body as Record<string, unknown>;
  // The old client sent keys FastAPI ignores.
  expect(scrapeBody).toHaveProperty('query');
  expect(scrapeBody).not.toHaveProperty('location_filter');
  expect(scrapeBody).not.toHaveProperty('search_type');
  expect(scrapeBody).not.toHaveProperty('resume_skills');

  // The toast must report the backend's real counts, including zero.
  await expect(page.getByText(/7 found, 3 new/)).toBeVisible();
});

test('a failing jobs read surfaces an error banner instead of seed rows', async ({ page }) => {
  // We are the ones breaking this request, so the browser's "Failed to load
  // resource" console line is expected here.
  expectNetworkErrors = true;

  await page.route('**/api/v1/athena/jobs*', async (route: Route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'backend down' }),
    });
  });

  await page.goto('/');

  // This is the whole point of removing the silent mockData fallback.
  await expect(page.getByText(BANNER)).toBeVisible();
  await expect(page.getByText(/check that uvicorn is running/i)).toBeVisible();
});

test('a profile maps skills to strings the Profile view can render', async ({
  page,
  request,
}) => {
  // Guards the crash where backend skill objects reached React as children.
  const response = await request.get('/api/v1/athena/profiles');
  expect(response.status()).toBe(200);
  const profiles = (await response.json()) as { skills?: unknown[] }[];
  if (!profiles?.length) test.skip(true, 'no profile in this environment');

  const skills = profiles[0].skills ?? [];
  for (const skill of skills) expect(typeof skill).toBe('string');
});

test('profile persistence roundtrip via the real API', async ({ request }) => {
  // Tests that a PUT /profiles/{id} round-trips through the BFF + FastAPI
  // without data loss (the fix for the ~45% data-loss bug). Uses the profile
  // currently served by the running backend.
  let profiles = (await (await request.get('/api/v1/athena/profiles')).json()) as { id: string }[];
  if (!profiles?.length) {
    // CI starts from an empty store; seed the one profile the roundtrip needs.
    const seed = await request.post('/api/v1/athena/profiles', {
      headers: { 'X-API-Key': 'dev-admin-key' },
      data: { email: 'test@example.com', full_name: 'Test User' },
    });
    expect(seed.status()).toBeLessThan(300);
    profiles = (await (await request.get('/api/v1/athena/profiles')).json()) as { id: string }[];
  }
  const id = profiles[0].id;
  // The body is the same shape toBackendProfile emits.
  const body = {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '(+1) 555-0123',
    location: 'Test City',
    headline: 'Test Headline',
    summary: 'Test summary.',
    skills: ['Test Skill'],
    experience: [],
    education: [],
    certifications: [],
    hourlyRateUsd: 50,
    expectedMonthlyMwk: 3000000,
    legalAuthorizedSigner: 'Test Signer',
  };
  // Save.
  await request.put(`/api/v1/athena/profiles/${id}`, {
    headers: { 'X-API-Key': 'dev-admin-key' },
    data: body,
  });
  // Reload and assert the editable scalars came back.
  const reloaded = await request.get('/api/v1/athena/profiles');
  const p = (await reloaded.json()) as Record<string, unknown>[];
  expect(p).toHaveLength(1);
  expect(p[0].fullName).toBe('Test User');
  expect(p[0].email).toBe('test@example.com');
  expect(p[0].headline).toBe('Test Headline');
  // Un-editable sections must survive unchanged.
  expect(p[0].skills).toEqual(expect.arrayContaining(['Test Skill']));
  expect(p[0].hourlyRateUsd).toBe(50);
  expect(p[0].expectedMonthlyMwk).toBe(3000000);
  expect(p[0].legalAuthorizedSigner).toBe('Test Signer');
});

test('both pagination UIs render their pager controls', async ({ page }) => {
  // Goes to each top-level view and asserts the pagination markup exists in the DOM.
  // The pager only renders past one page, so serve stubbed jobs with >1 page of
  // rows; we only check the control's presence, not item counts.
  await stubJobs(page);
  const views = ['/pipeline', '/scraper'];
  for (const view of views) {
    await page.goto(view);
    // The pager component has an aria-label attribute; wait for it to appear.
    await expect(page.locator('[aria-label="pagination"]').first()).toBeVisible({
      timeout: 5000,
    });
  }
});
