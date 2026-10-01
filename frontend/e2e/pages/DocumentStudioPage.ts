import { Page, Locator, expect } from '@playwright/test';

export class DocumentStudioPage {
  readonly page: Page;
  readonly resumeTab: Locator;
  readonly coverLetterTab: Locator;
  readonly proposalTab: Locator;
  readonly layoutToggle: Locator;
  readonly dehumanizeToggle: Locator;
  readonly regenerateButton: Locator;
  readonly printButton: Locator;
  readonly copyMarkdownButton: Locator;
  readonly documentContent: Locator;
  readonly jobSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resumeTab = page.locator('[data-testid="tab-resume"]');
    this.coverLetterTab = page.locator('[data-testid="tab-cover-letter"]');
    this.proposalTab = page.locator('[data-testid="tab-proposal"]');
    this.layoutToggle = page.locator('[data-testid="layout-toggle"]');
    this.dehumanizeToggle = page.locator('[data-testid="dehumanize-toggle"]');
    this.regenerateButton = page.locator('[data-testid="regenerate-btn"]');
    this.printButton = page.locator('[data-testid="print-btn"]');
    this.copyMarkdownButton = page.locator('[data-testid="copy-markdown-btn"]');
    this.documentContent = page.locator('[data-testid="document-content"]');
    this.jobSelector = page.locator('[data-testid="job-selector"]');
  }

  async goto(jobId?: string) {
    const url = jobId ? `/documents/${jobId}` : '/documents';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    // Wait for loading spinner to disappear (jobId + isLoadingJob + !currentOpp)
    await this.page.locator('[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  async selectJob(jobId: string) {
    await this.jobSelector.selectOption(jobId);
    await this.page.waitForLoadState('networkidle');
  }

  async clickResumeTab() {
    await this.resumeTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickCoverLetterTab() {
    await this.coverLetterTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickProposalTab() {
    await this.proposalTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async setLayout(layout: 'one-column' | 'two-column') {
    const current = await this.layoutToggle.getAttribute('data-layout');
    if (current !== layout) {
      await this.layoutToggle.click();
      await this.page.waitForTimeout(500); // Animation
    }
  }

  async toggleDehumanize(enabled: boolean) {
    const isChecked = await this.dehumanizeToggle.isChecked();
    if (isChecked !== enabled) {
      // Register the waiter before the click — the response can resolve first.
      const responsePromise = this.page.waitForResponse(response =>
        response.url().includes('/tailor-resume') || response.url().includes('/tailor-document')
      );
      await this.dehumanizeToggle.click();
      await responsePromise;
    }
  }

  async regenerate() {
    const responsePromise = this.page.waitForResponse(response =>
      (response.url().includes('/tailor-resume') || response.url().includes('/tailor-document')) && response.status() === 200
    );
    await this.regenerateButton.click();
    await responsePromise;
  }

  async print() {
    // In headless, we can't actually print, but we can verify the print button works
    await this.printButton.click();
  }

  async copyMarkdown() {
    await this.copyMarkdownButton.click();
    // Verify clipboard content (limited in headless)
    const clipboardText = await this.page.evaluate(() => navigator.clipboard.readText());
    return clipboardText;
  }

  async getDocumentContent() {
    return this.documentContent.textContent();
  }

  async getDocumentHTML() {
    return this.documentContent.innerHTML();
  }

  async waitForGeneration() {
    await this.page.waitForResponse(response => 
      (response.url().includes('/tailor-resume') || response.url().includes('/tailor-document')) && response.status() === 200
    );
    // Response arrival ≠ React commit; settle so content assertions see updated state.
    await this.page.waitForLoadState('networkidle');
  }

  async isProposalTabVisible() {
    return this.proposalTab.isVisible();
  }
}