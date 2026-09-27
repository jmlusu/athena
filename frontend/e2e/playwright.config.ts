import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  testMatch: ['tests/**/*.spec.ts'],
  testIgnore: ['**/src/**', '../src/**', '**/lib/**', '**/node_modules/**', '**/dist/**'],
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8530',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add API key header for all requests
    extraHTTPHeaders: {
      'X-API-Key': process.env.E2E_API_KEY || 'dev-admin-key',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: process.env.CI 
      ? 'docker-compose up -d && sleep 15' 
      : 'concurrently "cd ../backend && uv run uvicorn athena.api.server:app --host 0.0.0.0 --port 8000" "vite --mode test"',
    url: 'http://localhost:8530',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      ATHENA_API_KEY: 'dev-admin-key',
      ATHENA_AI_PROVIDER: 'fallback',
      GEMINI_API_KEY: '',
      AISTUDIO_PREVIEW: 'false',
      VITE_ATHENA_API_BASE: '/api/v1/athena',
      VITE_ATHENA_API_KEY: 'dev-admin-key',
    },
  },
  globalSetup: path.resolve('./global-setup.ts'),
  globalTeardown: path.resolve('./global-teardown.ts'),
  expect: {
    timeout: 10000,
  },
  timeout: 60000,
});