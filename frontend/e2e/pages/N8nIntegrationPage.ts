import { Page, Locator, expect } from '@playwright/test';

export class N8nIntegrationPage {
  readonly page: Page;
  readonly topologyCanvas: Locator;
  readonly webhookUrlInput: Locator;
  readonly testPayloadButton: Locator;
  readonly payloadEditor: Locator;
  readonly executeButton: Locator;
  readonly executionResponse: Locator;
  readonly statusPill: Locator;
  readonly nodeLabels: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topologyCanvas = page.locator('[data-testid="n8n-topology"]');
    this.webhookUrlInput = page.locator('[data-testid="n8n-webhook-url"]');
    this.testPayloadButton = page.locator('[data-testid="test-payload-btn"]');
    this.payloadEditor = page.locator('[data-testid="payload-editor"]');
    this.executeButton = page.locator('[data-testid="execute-webhook-btn"]');
    this.executionResponse = page.locator('[data-testid="execution-response"]');
    this.statusPill = page.locator('[data-testid="n8n-status-pill"]');
    this.nodeLabels = page.locator('[data-testid="n8n-node-label"]');
  }

  async goto() {
    await this.page.goto('/n8n');
    await this.page.waitForLoadState('networkidle');
    await this.topologyCanvas.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getTopologyNodeCount() {
    return this.nodeLabels.count();
  }

  async getNodeLabels() {
    const labels = await this.nodeLabels.allTextContents();
    return labels.map(l => l.trim());
  }

  async setWebhookUrl(url: string) {
    await this.webhookUrlInput.fill(url);
  }

  async getWebhookUrl() {
    return this.webhookUrlInput.inputValue();
  }

  async clickTestPayload() {
    await this.testPayloadButton.click();
    await this.payloadEditor.waitFor({ state: 'visible', timeout: 5000 });
  }

  async setPayload(payload: object) {
    await this.payloadEditor.fill(JSON.stringify(payload, null, 2));
  }

  async executeWebhook() {
    // Register the waiter BEFORE clicking — route.fulfill resolves instantly,
    // so a click-then-wait sequence can miss the response (flaky race).
    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes('/n8n/dispatch') && response.status() === 200
    );
    await this.executeButton.click();
    await responsePromise;
  }

  async getExecutionResponse() {
    await this.executionResponse.waitFor({ state: 'visible', timeout: 10000 });
    return this.executionResponse.textContent();
  }

  async getStatus() {
    return this.statusPill.textContent();
  }

  async isActive() {
    const status = await this.getStatus();
    return status?.includes('Active') || status?.includes('Connected') || false;
  }
}