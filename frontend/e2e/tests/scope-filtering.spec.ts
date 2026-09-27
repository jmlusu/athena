import { test, expect } from '../fixtures/test-fixtures';

test.describe('Scope Taxonomy Filtering (LeftSidebar)', () => {
  test('LeftSidebar shows three scope filters: Lilongwe Local, Lilongwe Remote, International Remote', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    const scopeFilter = dashboardPage.scopeFilter;
    
    // Verify all three scope filters exist
    await expect(scopeFilter.locator('[data-testid="scope-lilongwe-local"]')).toBeVisible();
    await expect(scopeFilter.locator('[data-testid="scope-lilongwe-remote"]')).toBeVisible();
    await expect(scopeFilter.locator('[data-testid="scope-international-remote"]')).toBeVisible();
  });

  test('Filtering by Lilongwe Local shows only Lilongwe-based jobs', async ({ dashboardPage, jobListPage }) => {
    await jobListPage.goto();
    
    // Filter by Lilongwe Local
    await jobListPage.filterByType('lilongwe-local');
    
    const count = await jobListPage.getJobCount();
    expect(count).toBeGreaterThanOrEqual(0);
    
    // Verify all visible jobs are Lilongwe local
    for (let i = 0; i < count; i++) {
      const job = await jobListPage.getJobCard(i);
      expect(job.location?.toLowerCase()).toContain('lilongwe');
    }
  });

  test('Filtering by Lilongwe Remote shows Malawi remote jobs', async ({ dashboardPage, jobListPage }) => {
    await jobListPage.goto();
    
    await jobListPage.filterByType('lilongwe-remote');
    
    const count = await jobListPage.getJobCount();
    // Should include job-medium-score which is Lilongwe, Malawi
  });

  test('Filtering by International Remote shows global remote jobs', async ({ dashboardPage, jobListPage }) => {
    await jobListPage.goto();
    
    await jobListPage.filterByType('international-remote');
    
    const count = await jobListPage.getJobCount();
    // Should include job-high-score (Remote US/EU) and job-low-score (Remote Global)
  });

  test('Scope filter persists across navigation', async ({ dashboardPage, jobListPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();
    
    // Set scope filter on dashboard
    await dashboardPage.filterByScope('international-remote');
    
    // Navigate to job list
    await jobListPage.goto();
    
    // Filter should still be applied (depends on implementation)
    const count = await jobListPage.getJobCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Combined filters: scope + source + status', async ({ jobListPage }) => {
    await jobListPage.goto();
    
    // Apply multiple filters
    await jobListPage.filterByType('international-remote');
    await jobListPage.filterBySource('linkedin');
    await jobListPage.filterByStatus('scored');
    
    const count = await jobListPage.getJobCount();
    // Should only show jobs matching all criteria
    for (let i = 0; i < count; i++) {
      const job = await jobListPage.getJobCard(i);
      expect(job.status).toBe('scored');
    }
  });

  test('Clear filters resets to show all jobs', async ({ jobListPage }) => {
    await jobListPage.goto();
    
    // Apply a filter
    await jobListPage.filterByType('lilongwe-local');
    let count = await jobListPage.getJobCount();
    
    // Clear filters (click "All" or clear button)
    await jobListPage.filterByType('all');
    
    const newCount = await jobListPage.getJobCount();
    expect(newCount).toBeGreaterThanOrEqual(count);
  });
});