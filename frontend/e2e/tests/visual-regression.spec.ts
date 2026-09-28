/// <reference types="@playwright/test" />
import { test, expect } from '../fixtures/test-fixtures';
import { TEST_API_KEY } from '../fixtures/test-data';

// ============================================================
// Visual Regression Test Spec for Athena AI Studio Migration
// Covers all 12 reference screens from VISUAL_REFERENCE_INDEX.md
// ============================================================

// Viewports parameterized per requirements: 1440x900 and 1920x1080
const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1920, height: 1080, label: '1920x1080' },
];

// Mask definitions for dynamic elements per screen
const MASKS = {
  '01-pipeline-command-desktop': '[data-testid="cron-countdown"]',
  '02-mountain-momentum-chart': '[data-testid="tooltip"]',
  '03-kanban-stages': '[data-testid="badge-status"]',
  '04-scraper-discovery': '[data-testid="pill-selector"]',
  '05-document-studio-2col': '[data-testid="dehumanize-toggle"]',
  '06-document-studio-proposal': '[data-testid="opportunity-badge"]',
  '07-form-filler-signoff-gate': '[data-testid="signature-input"]',
  '08-receipts-certificate': '[data-testid="follow-up-date"]',
  '09-linkedin-export-easy-apply': '[data-testid="copy-feedback"]',
  '10-linkedin-export-experience': '[data-testid="json-download-metadata"]',
  '11-n8n-workflow-nodes': '[data-testid="execution-response"]',
  '12-applicant-profile-dossier': '[data-testid="ats-score"]',
};

// Screen configurations mapped to the 12 reference screens
// Each entry: name, route, stateSetup (func), maskKey
const SCREENS = [
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
    route: '/kanban',
    setup: async (page) => {
      await page.goto('/kanban');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="kanban-board"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '03-kanban-stages',
  },
  {
    name: '04-scraper-discovery',
    route: '/dashboard',
    setup: async (page) => {
      await page.locator('[data-testid="pill-scraper"]').click();
      await page.waitForTimeout(500);
    },
    maskKey: '04-scraper-discovery',
  },
  {
    name: '05-document-studio-2col',
    route: '/documents/job-high-score',
    setup: async (page) => {
      await page.locator('[data-testid="tab-resume"]').click();
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="layout-toggle"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-testid="dehumanize-toggle"]').click();
      await page.waitForResponse(
        resp => resp.url().includes('/tailor-resume') && resp.status() === 200
      );
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
    route: '/apply',
    setup: async (page) => {
      await page.goto('/apply');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="job-card"][data-ats-score="95"] [data-testid="sign-off-btn"]').click();
      await page.waitForSelector('[data-testid="sign-off-modal"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '07-form-filler-signoff-gate',
  },
  {
    name: '08-receipts-certificate',
    route: '/receipts',
    setup: async (page) => {
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
      await page.locator('[data-testid="export-linkedin"]').click();
      await page.waitForSelector('[data-testid="linkedin-modal"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '09-linkedin-export-easy-apply',
  },
  {
    name: '10-linkedin-export-experience',
    route: '/linkedin/profile',
    setup: async (page) => {
      await page.goto('/linkedin/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="experience-section"]', { state: 'visible', timeout: 10000 });
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
    route: '/applicants/test-profile-1',
    setup: async (page) => {
      await page.goto('/applicants/test-profile-1');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="dossier-view"]', { state: 'visible', timeout: 10000 });
    },
    maskKey: '12-applicant-profile-dossier',
  },
];

// ============================================================
// Generate 24 tests (12 screens × 2 viewports)
// Each test navigates, sets state, waits, and captures screenshot
// ============================================================

function makeTest(screen, viewport) {
  return test(`${screen.name} @ ${viewport.label}`, async () => {
    const page = await test.info().global.page;
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

    // Capture screenshot with mask for dynamic elements
    const maskSelector = MASKS[screen.maskKey];
    await expect(page).toHaveScreenshot(
      {},
      {
        mask: maskSelector ? page.locator(maskSelector) : undefined,
        animations: 'disabled',
      }
    );
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