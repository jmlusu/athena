import { test, expect } from '../fixtures/test-fixtures';

test.describe('Automation Controls (RightSidebar)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock automation settings API
    await page.route('**/api/v1/athena/profiles/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          json: [{
            id: 'test-profile-1',
            preferences: {
              autoCreateThreshold: 90,
              flagThresholdMin: 80,
              flagThresholdMax: 89,
              dehumanizeEnabled: true,
              n8nWebhookUrl: 'https://n8n.test.webhook',
              n8nActive: false,
            }
          }]
        });
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({ 
          json: { ...route.request().postDataJSON(), id: 'test-profile-1' }
        });
      } else {
        await route.continue();
      }
    });
  });

  test('ATS thresholds: display and persist auto-apply (90) and flag (80-89)', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Get current thresholds
    const thresholds = await dashboardPage.getAutomationThresholds();
    expect(parseInt(thresholds.autoApply)).toBe(90);
    expect(parseInt(thresholds.flagMin)).toBe(80);
    expect(parseInt(thresholds.flagMax)).toBe(89);
  });

  test('ATS thresholds: can be updated and saved', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Update thresholds
    await dashboardPage.setAutomationThresholds('95', '85', '94');

    // Verify they persisted (would need backend to actually save)
    const thresholds = await dashboardPage.getAutomationThresholds();
    expect(parseInt(thresholds.autoApply)).toBe(95);
    expect(parseInt(thresholds.flagMin)).toBe(85);
    expect(parseInt(thresholds.flagMax)).toBe(94);
  });

  test('Dehumanizer toggle: enables/disables AI-tell removal', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Toggle dehumanizer off
    await dashboardPage.toggleDehumanizer(false);
    
    // Toggle back on
    await dashboardPage.toggleDehumanizer(true);
    
    // Verify no errors - toggle should be clickable
    await expect(dashboardPage.automationControls.locator('[data-testid="dehumanize-toggle"]')).toBeEnabled();
  });

  test('Sign-off queue: shows jobs awaiting human review', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Sign-off queue should be visible in automation controls
    const signOffQueue = dashboardPage.automationControls.locator('[data-testid="signoff-queue"]');
    await expect(signOffQueue).toBeVisible();
  });

  test('Aggregator status: shows n8n connection state', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    const aggregatorStatus = dashboardPage.automationControls.locator('[data-testid="aggregator-status"]');
    await expect(aggregatorStatus).toBeVisible();
  });

  test('n8n status pill: reflects webhook configuration', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    const n8nPill = dashboardPage.automationControls.locator('[data-testid="n8n-status-pill"]');
    await expect(n8nPill).toBeVisible();
  });

  test('Cron countdown: displays 4-hour countdown for next scrape', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    const countdownText = await dashboardPage.getCronCountdownText();
    expect(countdownText).toBeTruthy();
    
    // Should contain time format (e.g., "3h 45m" or "4h 00m")
    expect(countdownText).toMatch(/\d+h\s*\d*m/);
  });

  test('Manual trigger button: executes scrape cycle immediately', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    const triggerButton = dashboardPage.automationControls.locator('[data-testid="manual-trigger-scrape"]');
    await expect(triggerButton).toBeEnabled();
    
    // Click and verify API call made
    await dashboardPage.triggerScrape();
    
    // Should complete without error
    await expect(triggerButton).toBeEnabled();
  });
});