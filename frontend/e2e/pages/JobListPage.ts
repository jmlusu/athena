import { Page, Locator, expect } from '@playwright/test';

export class JobListPage {
  readonly page: Page;
  readonly jobCards: Locator;
  readonly searchInput: Locator;
  readonly filterPanel: Locator;
  readonly pagination: Locator;
  readonly viewToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jobCards = page.locator('[data-testid="job-card"]');
    this.searchInput = page.locator('[data-testid="job-search"]');
    this.filterPanel = page.locator('[data-testid="filter-panel"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    this.viewToggle = page.locator('[data-testid="view-toggle"]');
  }

  async goto() {
    await this.page.goto('/athena/jobs');
    await this.page.waitForLoadState('networkidle');
    await this.jobCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getJobCount() {
    return this.jobCards.count();
  }

  async getJobCard(index: number) {
    const card = this.jobCards.nth(index);
    return {
      id: await card.getAttribute('data-job-id'),
      title: await card.locator('[data-testid="job-title"]').textContent(),
      company: await card.locator('[data-testid="job-company"]').textContent(),
      location: await card.locator('[data-testid="job-location"]').textContent(),
      atsScore: await card.locator('[data-testid="job-ats-score"]').textContent(),
      matchScore: await card.locator('[data-testid="job-match-score"]').textContent(),
      status: await card.locator('[data-testid="job-status"]').textContent(),
    };
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
  }

  async filterByStatus(status: string) {
    await this.filterPanel.locator(`[data-testid="filter-status-${status}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterBySource(source: string) {
    await this.filterPanel.locator(`[data-testid="filter-source-${source}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByType(type: string) {
    await this.filterPanel.locator(`[data-testid="filter-type-${type}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickJobCard(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"]`).click();
  }

  async clickApply(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"] [data-testid="apply-btn"]`).click();
  }

  async clickTailorResume(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"] [data-testid="tailor-resume-btn"]`).click();
  }

  async clickCoverLetter(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"] [data-testid="cover-letter-btn"]`).click();
  }

  async clickFlag(jobId: string) {
    await this.page.locator(`[data-testid="job-card"][data-job-id="${jobId}"] [data-testid="flag-btn"]`).click();
  }

  async goToPage(pageNum: number) {
    await this.pagination.locator(`[data-testid="page-${pageNum}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }
}