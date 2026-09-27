import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Resolve every path against this config file (not the CWD) so `pnpm test:e2e`
// works from repo root, frontend/, or frontend/e2e/.
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(CONFIG_DIR, '..');
const BACKEND_DIR = path.resolve(CONFIG_DIR, '../../backend');

// Port scheme deliberately avoids shared staging services (8000 = staging API,
// 8421 = staging dashboard). E2E runs on its own pair: 8001 API + 8530 web.
const API_PORT = Number(process.env.E2E_API_PORT || 8001);
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 8530);
const API_URL = process.env.E2E_API_URL || `http://127.0.0.1:${API_PORT}`;
const WEB_URL = process.env.E2E_BASE_URL || `http://localhost:${WEB_PORT}`;
const API_KEY = process.env.E2E_API_KEY || 'dev-admin-key';

// Isolated data root: seeds never touch <repo>/company/athena (staging data).
const DATA_DIR = process.env.ATHENA_DATA_DIR || path.join(os.tmpdir(), 'athena-e2e-data');

// globalSetup/globalTeardown run in-process with this config: publish the
// resolved values so setup/teardown use exactly the same endpoints.
process.env.E2E_API_URL = API_URL;
process.env.E2E_BASE_URL = WEB_URL;
process.env.E2E_API_KEY = API_KEY;
process.env.ATHENA_DATA_DIR = DATA_DIR;

export default defineConfig({
  testDir: path.join(CONFIG_DIR, 'tests'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/src/**', '**/lib/**', '**/node_modules/**', '**/dist/**'],
  reporter: [
    ['html', { outputFolder: path.join(CONFIG_DIR, 'test-results/html-report') }],
    ['json', { outputFile: path.join(CONFIG_DIR, 'test-results/results.json') }],
    ['junit', { outputFile: path.join(CONFIG_DIR, 'test-results/results.xml') }],
  ],
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'X-API-Key': API_KEY,
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
  webServer: [
    {
      // Real module path: athena.api.app:app (athena.api.server:app does not exist).
      command: `uv run uvicorn athena.api.app:app --host 127.0.0.1 --port ${API_PORT}`,
      cwd: BACKEND_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        ATHENA_DATA_DIR: DATA_DIR,
        // No background scraping during tests (keeps runs hermetic and fast).
        ATHENA_SCHEDULER_AUTOSTART: 'false',
        // Default limiter is 100 req/min/IP - far too low for a parallel suite.
        ATHENA_RATE_LIMIT: '1000000',
        ATHENA_API_KEY: API_KEY,
        ATHENA_AUTH_MODE: 'api_key',
        ATHENA_AI_PROVIDER: 'fallback',
        GEMINI_API_KEY: '',
        AISTUDIO_PREVIEW: 'false',
      },
    },
    {
      command: `npx vite --mode test --port ${WEB_PORT} --strictPort`,
      cwd: FRONTEND_DIR,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        PORT: String(WEB_PORT),
        ATHENA_BACKEND_URL: API_URL,
        VITE_ATHENA_API_BASE: '/api/v1/athena',
        VITE_ATHENA_API_KEY: API_KEY,
      },
    },
  ],
  // Paths are config-relative: `playwright test` no longer depends on CWD.
  globalSetup: path.join(CONFIG_DIR, 'global-setup.ts'),
  globalTeardown: path.join(CONFIG_DIR, 'global-teardown.ts'),
  expect: {
    timeout: 10000,
  },
  timeout: 60000,
});
