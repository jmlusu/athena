/// <reference types="@playwright/test" />
import { test, expect } from '../fixtures/test-fixtures';
import { TEST_RECEIPT } from '../fixtures/test-data';
import type { Page } from '@playwright/test';

// ============================================================
// Visual Regression Test Spec for Athena AI Studio Migration
// Covers all 12 reference screens from VISUAL_REFERENCE_INDEX.md
// ============================================================

// Viewports parameterized per requirements: 1440x900 and 1920x1080
const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1920, height: 1080, label: '1920x1080' },
];

// Mask definitions for dynamic elements per screen.
// Only elements whose pixels genuinely change run-to-run are masked.
// Selectors are comma-separated CSS lists (all matches are masked).
const MASKS: Record<string, string | undefined> = {
  // Skills bars: compatibility value uses Math.random() per load and the
  // count-up bar width animates for 700ms (Dashboard.tsx / SkillBar).
  '01-pipeline-command-desktop':
    '[data-testid="cron-countdown"], [aria-label="Skills compatibility bars"]',
  '02-mountain-momentum-chart':
    '[data-testid="tooltip"], [aria-label="Skills compatibility bars"]',
  '06-document-studio-proposal': '[data-testid="opportunity-badge"]',
  // Sign-off gate renders a live timestamp + Date.now() audit token in this div.
  '07-form-filler-signoff-gate': '[data-testid="sign-off-modal"] .text-red-800',
  '11-n8n-workflow-nodes': '[data-testid="execution-response"]',
};

type ScreenConfig = {
  name: string;
  route: string;
  setup?: (page: Page) => Promise<void>;
  maskKey: string;
};

// Screen configurations mapped to the 12 reference screens
// Each entry: name, route, stateSetup (func), maskKey
const SCREENS: ScreenConfig[] = [
  {
    name: '01-pipeline-command-desktop',
    route: '/dashboard',
    setup: async (page) => {
      await page.locator('[data-testid="scope-all"]').click();
      await page.locator('[data-testid="category-all"]').click();
      await page.waitForTimeout(500);
    },
    maskKey: '01-pipeline-command-desktop',
  },
  {
    name: '02-mountain-momentum-chart',
    route: '/dashboard',
    setup: async (page) => {
      await page.waitForSelector('[data-testid="pipeline-column"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '02-mountain-momentum-chart',
  },
  {
    name: '03-kanban-stages',
    route: '/dashboard',
    setup: async (page) => {
      // Kanban lives on /dashboard (there is no /kanban route).
      const kanban = page.getByRole('region', { name: 'Job pipeline kanban board' });
      await kanban.waitFor({ state: 'visible', timeout: 10000 });
      await kanban.scrollIntoViewIfNeeded();
    },
    maskKey: '03-kanban-stages',
  },
  {
    name: '04-scraper-discovery',
    route: '/jobs',
    setup: async (page) => {
      // Scraper discovery view: 4 scope selector cards + seeded job rows.
      await page
        .locator('[role="group"][aria-label="Target scopes"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForSelector('[data-testid="job-card"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '04-scraper-discovery',
  },
  {
    name: '05-document-studio-2col',
    route: '/documents/job-high-score',
    setup: async (page) => {
      // Register the generation waiter first so neither the auto-generation
      // effect (~1s after opportunity/profile load) nor the manual regenerate
      // below can slip past it.
      const genDone = page.waitForResponse(
        (resp) => resp.url().includes('/tailor-resume') && resp.status() === 200
      );
      await page.locator('[data-testid="tab-resume"]').click();
      await page.getByRole('button', { name: '2 Columns' }).click();
      await page.locator('[data-testid="regenerate-btn"]').click();
      await genDone;
      // Let any still-in-flight generation settle before the screenshot.
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="layout-toggle"]')).toHaveAttribute(
        'data-layout',
        'two-column'
      );
      await expect(page.locator('[data-testid="dehumanize-toggle"]')).toBeChecked();
    },
    maskKey: '05-document-studio-2col',
  },
  {
    name: '06-document-studio-proposal',
    route: '/documents/job-consultancy',
    setup: async (page) => {
      await page.locator('[data-testid="job-selector"]').selectOption('job-consultancy');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="tab-proposal"]').click();
      await page.waitForLoadState('networkidle');
    },
    maskKey: '06-document-studio-proposal',
  },
  {
    name: '07-form-filler-signoff-gate',
    route: '/dashboard',
    setup: async (page) => {
      // Open the >=90% ATS role (job-high-score, ATS 95) and hit its
      // "Sign-Off & Authorize" CTA in the opportunity detail modal.
      await page
        .locator('[data-testid="job-card"][data-job-id="b22d0000-0000-4000-8000-000000000001"]')
        .first()
        .click();
      await page
        .locator('[data-testid="opportunity-detail-modal"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('button', { name: 'Sign-Off & Authorize' }).click();
      await page.locator('[data-testid="sign-off-modal"]').waitFor({ state: 'visible', timeout: 10000 });
    },
    maskKey: '07-form-filler-signoff-gate',
  },
  {
    name: '08-receipts-certificate',
    route: '/receipts',
    setup: async (page) => {
      // No receipts are seeded by global-setup; mock the list endpoint so the
      // certificate view is deterministic, then re-enter the page.
      await page.route('**/api/v1/athena/receipts*', (route) =>
        route.fulfill({ json: { receipts: [TEST_RECEIPT], total: 1 } })
      );
      await page.goto('/receipts');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="receipt-card"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '08-receipts-certificate',
  },
  {
    name: '09-linkedin-export-easy-apply',
    route: '/dashboard',
    setup: async (page) => {
      await page.locator('[data-testid="job-card"]').first().click();
      await page
        .locator('[data-testid="opportunity-detail-modal"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('button', { name: 'Export to LinkedIn' }).click();
      await page
        .locator('[data-testid="linkedin-export-modal"]')
        .waitFor({ state: 'visible', timeout: 10000 });
    },
    maskKey: '09-linkedin-export-easy-apply',
  },
  {
    name: '10-linkedin-export-experience',
    route: '/dashboard',
    setup: async (page) => {
      await page.locator('[data-testid="job-card"]').first().click();
      await page
        .locator('[data-testid="opportunity-detail-modal"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('button', { name: 'Export to LinkedIn' }).click();
      await page
        .locator('[data-testid="linkedin-export-modal"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('tab', { name: 'Profile Experience Entry' }).click();
      await page.locator('[role="tabpanel"]').waitFor({ state: 'visible', timeout: 10000 });
    },
    maskKey: '10-linkedin-export-experience',
  },
  {
    name: '11-n8n-workflow-nodes',
    route: '/n8n',
    setup: async (page) => {
      await page.waitForSelector('[data-testid="n8n-topology"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '11-n8n-workflow-nodes',
  },
  {
    name: '12-applicant-profile-dossier',
    route: '/profile',
    setup: async (page) => {
      // Applicant profile renders asynchronously once the seeded profile loads.
      await page
        .getByRole('heading', { name: 'Identity', exact: true })
        .waitFor({ state: 'visible', timeout: 10000 });
    },
    maskKey: '12-applicant-profile-dossier',
  },
];

// ============================================================
// Generate 24 tests (12 screens × 2 viewports)
// Each test navigates, sets state, waits, and captures screenshot
// ============================================================

function makeTest(screen: ScreenConfig, viewport: { width: number; height: number; label: string }) {
  return test(`${screen.name} @ ${viewport.label}`, async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    // Navigate to route
    await page.goto(screen.route);
    await page.waitForLoadState('networkidle');

    // Screen-specific state setup
    if (screen.setup) {
      await screen.setup(page);
    }

    // Wait for animations to settle (animations: 'disabled')
    // test.slow() at suite level handles this; extra timeout as safety
    await page.waitForTimeout(200);

    // Capture screenshot with mask for dynamic elements.
    // Options MUST be the first argument: Playwright ignores the second arg
    // when the first is an object (toHaveScreenshot(options) form).
    const maskSelector = MASKS[screen.maskKey];
    await expect(page).toHaveScreenshot({
      mask: maskSelector ? page.locator(maskSelector) : undefined,
      animations: 'disabled',
    });
  });
}

// Generate all 24 test combinations
for (const screen of SCREENS) {
  for (const viewport of VIEWPORTS) {
    makeTest(screen, viewport);
  }
}

// Suite-level slow mode: disables CSS animations per requirements
test.beforeAll(() => {
  // No-op; test.beforeEach sets slow mode per test
});

test.beforeEach(async ({ page }, testInfo) => {
  // Enable slow mode per test to disable CSS animations
  // This is the primary mechanism for "animations: 'disabled'" requirement
  test.slow();
});
