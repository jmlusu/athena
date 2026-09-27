import { Page, Locator, expect } from '@playwright/test';

export class ReceiptsPage {
  readonly page: Page;
  readonly receiptCards: Locator;
  readonly emptyState: Locator;
  readonly followUpDraft: Locator;
  readonly copyFollowUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.receiptCards = page.locator('[data-testid="receipt-card"]');
    this.emptyState = page.locator('[data-testid="receipts-empty"]');
    this.followUpDraft = page.locator('[data-testid="follow-up-draft"]');
    this.copyFollowUpButton = page.locator('[data-testid="copy-follow-up-btn"]');
  }

  async goto() {
    await this.page.goto('/receipts');
    await this.page.waitForLoadState('networkidle');
  }

  async getReceiptCount() {
    return this.receiptCards.count();
  }

  async getReceiptDetails(index: number) {
    const card = this.receiptCards.nth(index);
    return {
      jobTitle: await card.locator('[data-testid="receipt-job-title"]').textContent(),
      company: await card.locator('[data-testid="receipt-company"]').textContent(),
      confirmationHash: await card.locator('[data-testid="receipt-hash"]').textContent(),
      submittedAt: await card.locator('[data-testid="receipt-submitted"]').textContent(),
      signatory: await card.locator('[data-testid="receipt-signatory"]').textContent(),
      followUpDate: await card.locator('[data-testid="receipt-followup"]').textContent(),
      status: await card.locator('[data-testid="receipt-status"]').textContent(),
    };
  }

  async clickReceipt(index: number) {
    await this.receiptCards.nth(index).click();
  }

  async getFollowUpDraft() {
    await this.followUpDraft.waitFor({ state: 'visible', timeout: 5000 });
    return this.followUpDraft.textContent();
  }

  async copyFollowUpDraft() {
    await this.copyFollowUpButton.click();
    return this.page.evaluate(() => navigator.clipboard.readText());
  }

  async isEmpty() {
    return this.emptyState.isVisible();
  }
}