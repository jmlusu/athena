import { test as base, Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentStudioPage } from '../pages/DocumentStudioPage';
import { FormFillerPage } from '../pages/FormFillerPage';
import { N8nIntegrationPage } from '../pages/N8nIntegrationPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { JobListPage } from '../pages/JobListPage';

type TestFixtures = {
  dashboardPage: DashboardPage;
  documentStudioPage: DocumentStudioPage;
  formFillerPage: FormFillerPage;
  n8nIntegrationPage: N8nIntegrationPage;
  receiptsPage: ReceiptsPage;
  jobListPage: JobListPage;
};

export const test = base.extend<TestFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  documentStudioPage: async ({ page }, use) => {
    await use(new DocumentStudioPage(page));
  },
  formFillerPage: async ({ page }, use) => {
    await use(new FormFillerPage(page));
  },
  n8nIntegrationPage: async ({ page }, use) => {
    await use(new N8nIntegrationPage(page));
  },
  receiptsPage: async ({ page }, use) => {
    await use(new ReceiptsPage(page));
  },
  jobListPage: async ({ page }, use) => {
    await use(new JobListPage(page));
  },
});

export { expect } from '@playwright/test';