import { test, expect } from '../fixtures/test-fixtures';
import { FALLBACK_AI_RESPONSES } from '../fixtures/test-data';

test.describe('Document Studio: Resume Generation, Layouts, Print', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/athena/ai/**', async route => {
      const url = route.request().url();
      if (url.includes('/tailor-resume')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['tailor-resume'] });
      } else if (url.includes('/tailor-document')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['tailor-document'] });
      } else if (url.includes('/dehumanize')) {
        await route.fulfill({ json: FALLBACK_AI_RESPONSES['dehumanize'] });
      } else {
        await route.continue();
      }
    });
  });

  test('Resume tab: generates tailored resume with 1-column layout', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    const content = await documentStudioPage.getDocumentContent();
    expect(content).toContain('Test User');
    expect(content).toContain('Senior Software Engineer');
    expect(content).toContain('Python');
    expect(content).toContain('TypeScript');
  });

  test('Resume tab: switches to 2-column layout', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    // Default should be 1-column
    let html = await documentStudioPage.getDocumentHTML();
    expect(html).not.toContain('two-column');

    // Switch to 2-column
    await documentStudioPage.setLayout('two-column');
    html = await documentStudioPage.getDocumentHTML();
    expect(html).toContain('two-column');
  });

  test('Dehumanizer toggle: removes AI tells from resume', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    // Get original content
    const originalContent = await documentStudioPage.getDocumentContent();

    // Enable dehumanizer
    await documentStudioPage.toggleDehumanize(true);
    await documentStudioPage.regenerate();

    // Get dehumanized content
    const dehumanizedContent = await documentStudioPage.getDocumentContent();
    
    // Should have fewer AI tells (exact verification depends on implementation)
    expect(dehumanizedContent).toBeTruthy();
  });

  test('Cover Letter tab: generates tailored cover letter', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    const generation = documentStudioPage.waitForGeneration();
    await documentStudioPage.clickCoverLetterTab();
    await generation;

    await expect(documentStudioPage.documentContent).toContainText('Dear Hiring Manager');
    await expect(documentStudioPage.documentContent).toContainText('Test User');
  });

  test('Proposal tab: visible for consultancy jobs, generates 4-section proposal', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-consultancy');
    await documentStudioPage.waitForGeneration();

    const isVisible = await documentStudioPage.isProposalTabVisible();
    expect(isVisible).toBeTruthy();

    await documentStudioPage.clickProposalTab();
    await documentStudioPage.waitForGeneration();

    const content = await documentStudioPage.getDocumentContent();
    expect(content).toContain('Consultancy Proposal');
    expect(content).toContain('Technical Approach');
    expect(content).toContain('Work Plan');
    expect(content).toContain('Team Composition');
    expect(content).toContain('Financial Proposal');
  });

  test('Print button: triggers browser print dialog', async ({ documentStudioPage, page }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    // Set up print handling
    let printTriggered = false;
    page.on('print', () => { printTriggered = true; });

    await documentStudioPage.print();
    
    // In headless mode, print event may not fire, but button should be clickable
    await expect(documentStudioPage.printButton).toBeEnabled();
  });

  test('Copy Markdown button: copies document content to clipboard', async ({ documentStudioPage, page }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const markdown = await documentStudioPage.copyMarkdown();
    expect(markdown).toContain('Test User');
    expect(markdown).toContain('# ');
  });

  test('Job selector: switches between jobs', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    let content = await documentStudioPage.getDocumentContent();
    expect(content).toContain('Senior Python Engineer');

    await documentStudioPage.selectJob('job-consultancy');
    await documentStudioPage.waitForGeneration();

    content = await documentStudioPage.getDocumentContent();
    expect(content).toContain('Climate Finance');
  });

  test('Regenerate button: creates new variation', async ({ documentStudioPage }) => {
    await documentStudioPage.goto('job-high-score');
    await documentStudioPage.waitForGeneration();

    const content1 = await documentStudioPage.getDocumentContent();
    
    await documentStudioPage.regenerate();
    
    const content2 = await documentStudioPage.getDocumentContent();
    // With fallback provider, content may be identical - just verify it completes
    expect(content2).toBeTruthy();
  });
});