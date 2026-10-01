import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pipelineColumns: Locator;
  readonly cronCountdown: Locator;
  readonly automationControls: Locator;
  readonly scopeFilter: Locator;
  readonly scrapeButton: Locator;
  readonly processButton: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pipelineColumns = page.locator('[data-testid="pipeline-column"]');
    this.cronCountdown = page.locator('[data-testid="cron-countdown"]');
    this.automationControls = page.locator('[data-testid="automation-controls"]');
    this.scopeFilter = page.locator('[data-testid="scope-filter"]');
    this.scrapeButton = page.locator('[data-testid="trigger-scrape"]');
    this.processButton = page.locator('[data-testid="process-jobs"]');
    this.statsCards = page.locator('[data-testid="metric-card"]');
  }

  async goto() {
    // Router is unprefixed (src/App.tsx): /athena/* 404s into the wildcard
    // redirect, which only *looks* like it works by landing on /dashboard.
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPipelineLoad() {
    await this.pipelineColumns.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getJobCardsInColumn(status: string) {
    // Column headers render human labels ("4. Awaiting Sign-Off"), not raw status
    // keys — locate the column via its data-status attribute instead of text.
    const column = this.page.locator(`[data-testid="pipeline-column"][data-status="${status}"]`);
    return column.locator('[data-testid="job-card"]');
  }

  async clickJobCard(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"]`).click();
  }

  async clickTailorResume(jobId: string) {
    const jobCard = this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"]`);
    await jobCard.waitFor({ state: 'visible', timeout: 15000 });
    const btn = jobCard.locator('[data-testid="tailor-resume-btn"]');
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async clickFormFiller(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"] [data-testid="form-filler-btn"]`).click();
  }

  async triggerScrape() {
    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes('/scrape') && response.status() === 200
    );
    await this.scrapeButton.click();
    await responsePromise;
  }

  async processJobs() {
    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes('/process') && response.status() === 200
    );
    await this.processButton.click();
    await responsePromise;
  }

  async getCronCountdownText() {
    return this.cronCountdown.textContent();
  }

  async getAutomationThresholds() {
    const autoApply = await this.automationControls.locator('[data-testid="auto-apply-threshold"]').inputValue();
    const flagMin = await this.automationControls.locator('[data-testid="flag-threshold-min"]').inputValue();
    const flagMax = await this.automationControls.locator('[data-testid="flag-threshold-max"]').inputValue();
    return { autoApply, flagMin, flagMax };
  }

  async setAutomationThresholds(autoApply: string, flagMin: string, flagMax: string) {
    await this.automationControls.locator('[data-testid="auto-apply-threshold"]').fill(autoApply);
    await this.automationControls.locator('[data-testid="flag-threshold-min"]').fill(flagMin);
    await this.automationControls.locator('[data-testid="flag-threshold-max"]').fill(flagMax);
    await this.automationControls.locator('[data-testid="save-automation"]').click();
  }

  async toggleDehumanizer(enabled: boolean) {
    const toggle = this.automationControls.locator('[data-testid="dehumanize-toggle"]');
    const isChecked = await toggle.isChecked();
    if (isChecked !== enabled) {
      await toggle.click();
    }
  }

  async filterByScope(scope: 'lilongwe-local' | 'lilongwe-remote' | 'international-remote') {
    await this.scopeFilter.locator(`[data-testid="scope-${scope}"]`).click();
  }

  async getStatsCards() {
    const cards = await this.statsCards.all();
    const stats = {};
    for (const card of cards) {
      const label = await card.locator('[data-testid="metric-label"]').textContent();
      const value = await card.locator('[data-testid="metric-value"]').textContent();
      if (label) stats[label.trim()] = value?.trim() || '';
    }
    return stats;
  }
}