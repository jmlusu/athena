import { Page, Locator, expect } from '@playwright/test';

export class FormFillerPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly jobTitle: Locator;
  readonly company: Locator;
  readonly identityFields: Locator;
  readonly compensationFields: Locator;
  readonly screeningAnswers: Locator;
  readonly authorizationCheckbox: Locator;
  readonly signatureInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="form-filler-modal"]');
    this.jobTitle = page.locator('[data-testid="form-filler-job-title"]');
    this.company = page.locator('[data-testid="form-filler-company"]');
    this.identityFields = page.locator('[data-testid="identity-section"]');
    this.compensationFields = page.locator('[data-testid="compensation-section"]');
    this.screeningAnswers = page.locator('[data-testid="screening-section"]');
    this.authorizationCheckbox = page.locator('[data-testid="authorization-checkbox"]');
    this.signatureInput = page.locator('[data-testid="signature-input"]');
    this.submitButton = page.locator('[data-testid="submit-application-btn"]');
    this.cancelButton = page.locator('[data-testid="cancel-btn"]');
    this.closeButton = page.locator('[data-testid="close-modal-btn"]');
  }

  async waitForModal() {
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
  }

  async isModalVisible() {
    return this.modal.isVisible();
  }

  async getJobTitle() {
    return this.jobTitle.textContent();
  }

  async getCompany() {
    return this.company.textContent();
  }

  async fillIdentityFields(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    workAuthorization?: string;
  }) {
    if (data.fullName) await this.identityFields.locator('[data-testid="full-name"]').fill(data.fullName);
    if (data.email) await this.identityFields.locator('[data-testid="email"]').fill(data.email);
    if (data.phone) await this.identityFields.locator('[data-testid="phone"]').fill(data.phone);
    if (data.location) await this.identityFields.locator('[data-testid="location"]').fill(data.location);
    if (data.workAuthorization) await this.identityFields.locator('[data-testid="work-authorization"]').fill(data.workAuthorization);
  }

  async fillCompensationFields(data: {
    salaryExpectation?: string;
  }) {
    if (data.salaryExpectation) await this.modal.locator('[data-testid="salary-expectation"]').fill(data.salaryExpectation);
  }

  async fillScreeningAnswers(answers: { answer1?: string; answer2?: string }) {
    if (answers.answer1) await this.screeningAnswers.locator('[data-testid="screening-answer-1"]').fill(answers.answer1);
    if (answers.answer2) await this.screeningAnswers.locator('[data-testid="screening-answer-2"]').fill(answers.answer2);
  }

  async checkAuthorization() {
    const isChecked = await this.authorizationCheckbox.isChecked();
    if (!isChecked) {
      await this.authorizationCheckbox.click();
    }
  }

  async signSignature(signature: string) {
    await this.signatureInput.fill(signature);
  }

  async submit() {
    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes('/submit-application') && response.status() === 200
    );
    await this.submitButton.click();
    await responsePromise;
  }

  async cancel() {
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async close() {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async getReceipt() {
    // After successful submission, receipt should be displayed
    const receipt = this.page.locator('[data-testid="application-receipt"]');
    await receipt.waitFor({ state: 'visible', timeout: 10000 });
    return {
      confirmationHash: await receipt.locator('[data-testid="confirmation-hash"]').textContent(),
      submittedAt: await receipt.locator('[data-testid="submitted-at"]').textContent(),
      signatory: await receipt.locator('[data-testid="signatory"]').textContent(),
      followUpDate: await receipt.locator('[data-testid="follow-up-date"]').textContent(),
    };
  }

  async isSubmitEnabled() {
    return this.submitButton.isEnabled();
  }
}