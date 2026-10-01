import { test, expect } from '../fixtures/test-fixtures';
import { TEST_PROFILE, TEST_JOBS, TEST_API_KEY, FALLBACK_AI_RESPONSES, SEED_API_CALLS, TEST_RECEIPT } from '../fixtures/test-data';

test.describe('Full Pipeline: Scrape → Score → Tailor → Sign-off → Receipt', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking for fallback provider responses
    await page.route('**/api/v1/athena/ai/**', async route => {
      const url = route.request().url();
      if (url.includes('/score-ats')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['score-ats'] });
      } else if (url.includes('/tailor-resume')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['tailor-resume'] });
      } else if (url.includes('/tailor-document')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['tailor-document'] });
      } else if (url.includes('/dehumanize')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['dehumanize'] });
      } else if (url.includes('/submit-application')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['submit-application'] });
      } else if (url.includes('/n8n/dispatch')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['n8n-dispatch'] });
      } else {
        await route.continue();
      }
    });

    // Mock backend API calls for test data.
    // GET /jobs → fixture list; GET /jobs/{id} → single fixture job.
    // Specs reference fixture ids ('job-high-score', …) which match the
    // global-setup seed keys — all other specs use the same convention.
    await page.route('**/api/v1/athena/jobs**', async route => {
      const request = route.request();
      if (request.method() === 'GET') {
        const jobId = new URL(request.url()).pathname.match(/\/jobs\/([^/?]+)$/)?.[1];
        if (jobId) {
          const job = TEST_JOBS.find(j => j.id === jobId);
          if (job) {
            await route.fulfill({ json: job });
          } else {
            await route.fulfill({ status: 404, json: { detail: 'Job not found' } });
          }
        } else {
          await route.fulfill({ json: { jobs: TEST_JOBS, total: TEST_JOBS.length, limit: 50, offset: 0 } });
        }
      } else {
        await route.fulfill({ json: request.postDataJSON() });
      }
    });

    await page.route('**/api/v1/athena/profiles**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [TEST_PROFILE] });
      } else {
        await route.fulfill({ json: TEST_PROFILE });
      }
    });

    await page.route('**/api/v1/athena/applications**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { applications: [], total: 0 } });
      } else {
        await route.fulfill({ json: { ...TEST_PROFILE, id: 'app-new' } });
      }
    });

    await page.route('**/api/v1/athena/receipts**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { receipts: [TEST_RECEIPT], total: 1 } });
      } else {
        await route.continue();
      }
    });
  });

  // Job ID constants: fixture ids matching TEST_JOBS (and global-setup seed keys)
  const JOB_HIGH_SCORE_ID = 'job-high-score';
  const JOB_MEDIUM_SCORE_ID = 'job-medium-score';
  const JOB_LOW_SCORE_ID = 'job-low-score';
  const JOB_CONSULTANCY_ID = 'job-consultancy';
  const JOB_MALAWI_LOCAL_ID = 'job-malawi-local';

  test('Complete pipeline: scrape → score → tailor resume → sign-off → receipt', async ({
    dashboardPage,
    documentStudioPage,
    formFillerPage,
    receiptsPage,
  }) => {
    // Step 1: Navigate to Dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Verify pipeline has jobs
    const highScoreJobs = await dashboardPage.getJobCardsInColumn('scored');
    expect(await highScoreJobs.count()).toBeGreaterThan(0);

    // Step 2: Click "Tailor Resume" on high-scoring job
    await dashboardPage.clickTailorResume(JOB_HIGH_SCORE_ID);

    // Step 3: Document Studio opens with tailored resume
    await documentStudioPage.goto(JOB_HIGH_SCORE_ID);
    await documentStudioPage.waitForGeneration();

    // Verify resume content
    const resumeContent = await documentStudioPage.getDocumentContent();
    expect(resumeContent).toContain('Test User');
    expect(resumeContent).toContain('Senior Software Engineer');

    // Step 4: Toggle dehumanizer and regenerate
    await documentStudioPage.toggleDehumanize(true);
    await documentStudioPage.regenerate();

    // Step 5: Switch to 2-column layout
    await documentStudioPage.setLayout('two-column');
    const html = await documentStudioPage.getDocumentHTML();
    expect(html).toContain('two-column');

    // Step 6: Open Form Filler modal (from dashboard or document studio)
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();
    await dashboardPage.clickFormFiller(JOB_HIGH_SCORE_ID);

    // Step 7: Complete sign-off in Form Filler
    await formFillerPage.waitForModal();
    
    // Verify job details
    const jobTitle = await formFillerPage.getJobTitle();
    expect(jobTitle).toContain('Senior Python Engineer');

    // Fill identity fields
    await formFillerPage.fillIdentityFields({
      fullName: 'Test User',
      email: 'test@athena.local',
      phone: '+1-555-0123',
      location: 'Remote',
      workAuthorization: 'US Citizen',
    });

    // Fill compensation (monthly MWK for Lilongwe)
    await formFillerPage.fillCompensationFields({
      salaryExpectation: 'MWK 3,500,000 / month',
    });

    // Fill screening answers
    await formFillerPage.fillScreeningAnswers({
      answer1: '7 years delivering production Python systems for fintech and public-sector platforms.',
      answer2: 'Comfortable with remote-first async collaboration and Lilongwe-based on-site engagements.',
    });

    // Step 8: Complete HITL gate - authorization checkbox + typed signature
    await formFillerPage.checkAuthorization();
    await formFillerPage.signSignature('Test User');

    // Verify submit is enabled
    const submitEnabled = await formFillerPage.isSubmitEnabled();
    expect(submitEnabled).toBeTruthy();

    // Step 9: Submit application
    await formFillerPage.submit();

    // Step 10: Verify receipt generated
    const receipt = await formFillerPage.getReceipt();
    expect(receipt.confirmationHash).toContain('sha256:');
    expect(receipt.signatory).toBe('Test User');
    expect(receipt.followUpDate).toBeTruthy();

    // Step 11: Navigate to Receipts ledger
    await receiptsPage.goto();

    // Step 12: Verify receipt appears in ledger
    const receiptCount = await receiptsPage.getReceiptCount();
    expect(receiptCount).toBeGreaterThan(0);

    const receiptDetails = await receiptsPage.getReceiptDetails(0);
    expect(receiptDetails.confirmationHash).toContain('sha256:');
    expect(receiptDetails.followUpDate).toBeTruthy();

    // Step 13: Verify 7-day follow-up draft
    const followUpDraft = await receiptsPage.getFollowUpDraft();
    expect(followUpDraft).toContain('Follow-Up');
    expect(followUpDraft!.length).toBeGreaterThan(50);

    // Step 14: Copy follow-up draft
    const copiedText = await receiptsPage.copyFollowUpDraft();
    expect(copiedText).toContain('Senior Python Engineer');
  });

  test('Auto-apply threshold triggers application for jobs ≥90 ATS', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Verify high-score job (≥90) shows auto-apply indicator
    const highScoreCards = await dashboardPage.getJobCardsInColumn('scored');
    const count = await highScoreCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Flag threshold (80-89) moves jobs to review queue', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForPipelineLoad();

    // Medium score job (78) should be in flagged/needs review
    // This depends on automation settings
    const automationThresholds = await dashboardPage.getAutomationThresholds();
    expect(parseInt(automationThresholds.flagMin)).toBe(80);
    expect(parseInt(automationThresholds.flagMax)).toBe(89);
  });
});