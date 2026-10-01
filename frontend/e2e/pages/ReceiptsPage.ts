import { Page, Locator, expect } from '@playwright/test';

export class ReceiptsPage {
  readonly page: Page;
  readonly receiptCards: Locator;
  readonly emptyState: Locator;
  readonly followUpDraft: Locator;
  readonly copyFollowUpButton: Locator;
  readonly generateFollowUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.receiptCards = page.locator('[data-testid="receipt-card"]');
    this.emptyState = page.locator('[data-testid="receipts-empty"]');
    this.followUpDraft = page.locator('[data-testid="follow-up-draft"]');
    this.copyFollowUpButton = page.locator('[data-testid="copy-follow-up-btn"]');
    this.generateFollowUpButton = page.locator('[data-testid="followup-generate-btn"]');
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
      jobTitle: await card.getAttribute('data-receipt-job-title'),
      company: await card.getAttribute('data-receipt-company'),
      confirmationHash: await card.getAttribute('data-receipt-hash'),
      submittedAt: await card.getAttribute('data-receipt-submitted'),
      signatory: await card.getAttribute('data-receipt-signatory'),
      followUpDate: await card.getAttribute('data-receipt-followup'),
      status: await card.getAttribute('data-receipt-status'),
    };
  }

  async clickReceipt(index: number) {
    await this.receiptCards.nth(index).click();
  }

  async getFollowUpDraft() {
    await this.generateFollowUpButton.click();
    await this.followUpDraft.waitFor({ state: 'visible', timeout: 5000 });
    return this.followUpDraft.textContent();
  }

  async copyFollowUpDraft(): Promise<string> {
    await this.copyFollowUpButton.click();
    let copied = '';
    await expect
      .poll(
        async () => {
          copied = await this.page.evaluate(() => navigator.clipboard.readText());
          return copied;
        },
        { timeout: 3000, message: 'clipboard should contain the copied follow-up draft' }
      )
      .not.toBe('');
    return copied;
  }

  async isEmpty() {
    return this.emptyState.isVisible();
  }
}
