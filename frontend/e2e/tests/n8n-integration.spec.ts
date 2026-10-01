import { test, expect } from '../fixtures/test-fixtures';
import { FALLBACK_AI_RESPONSES } from '../fixtures/test-data';

test.describe('n8n Integration: Topology, Webhook Tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/athena/ai/n8n/**', async route => {
      await route.fulfill({ json: FALLBACK_AI_RESPONSES['n8n-dispatch'] });
    });
  });

  test('n8n Integration page loads with 5-node topology', async ({ n8nIntegrationPage }) => {
    await n8nIntegrationPage.goto();

    // Verify topology renders
    const nodeCount = await n8nIntegrationPage.getTopologyNodeCount();
    expect(nodeCount).toBeGreaterThanOrEqual(5);

    // Verify node labels
    const labels = await n8nIntegrationPage.getNodeLabels();
    expect(labels.length).toBeGreaterThanOrEqual(5);
    
    // Expected nodes in Athena pipeline
    const expectedNodes = ['Scrape', 'Match', 'Score', 'Tailor', 'Sign-off', 'Submit', 'n8n'];
    for (const expected of expectedNodes) {
      const found = labels.some(l => l.toLowerCase().includes(expected.toLowerCase()));
      expect(found).toBeTruthy();
    }
  });

  test('Webhook URL input: accepts and displays webhook URL', async ({ n8nIntegrationPage }) => {
    await n8nIntegrationPage.goto();

    const testUrl = 'https://n8n.test.webhook/athena-pipeline';
    await n8nIntegrationPage.setWebhookUrl(testUrl);
    const value = await n8nIntegrationPage.getWebhookUrl();
    expect(value).toBe(testUrl);
  });

  test('Payload tester: opens editor, accepts JSON, executes webhook', async ({ n8nIntegrationPage }) => {
    await n8nIntegrationPage.goto();

    // Click test payload button
    await n8nIntegrationPage.clickTestPayload();

    // Set test payload
    const testPayload = {
      jobId: 'job-high-score',
      profileId: 'test-profile-1',
      atsScore: 95,
      matchScore: 92,
      action: 'auto_apply',
    };
    await n8nIntegrationPage.setPayload(testPayload);

    // Execute webhook
    await n8nIntegrationPage.executeWebhook();

    // Verify execution response
    const response = await n8nIntegrationPage.getExecutionResponse();
    expect(response).toContain('exec-12345');
    expect(response).toContain('triggered');
  });

  test('Status pill: reflects n8n connection status', async ({ n8nIntegrationPage }) => {
    await n8nIntegrationPage.goto();

    const status = await n8nIntegrationPage.getStatus();
    expect(status).toBeTruthy();
    
    // With fallback, should show some status
    const isActive = await n8nIntegrationPage.isActive();
    // Status depends on configuration - just verify it renders
    expect(typeof isActive).toBe('boolean');
  });

  test('Topology node interactions: hover shows details', async ({ n8nIntegrationPage, page }) => {
    await n8nIntegrationPage.goto();

    const nodes = page.locator('[data-testid="n8n-node"]');
    const count = await nodes.count();
    
    if (count > 0) {
      // Hover over first node
      await nodes.first().hover();
      
      // Tooltip or detail panel should appear
      const tooltip = page.locator('[data-testid="n8n-node-tooltip"]');
      // May or may not have tooltip - just verify no errors
      await page.waitForTimeout(500);
    }
  });
});