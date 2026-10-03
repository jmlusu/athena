import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve every path against this config file (not the CWD) so the suite runs
// from repo root or e2e/.
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
// e2e -> repo root (the `npm run dev` / server.ts root).
const REPO_ROOT = path.resolve(CONFIG_DIR, '..');

const BASE_URL = 'http://localhost:3000';

export default defineConfig({
  // Isolated test dir: the main config's testDir (`e2e/tests`) never sees these.
  testDir: path.join(CONFIG_DIR, 'aistudio'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Artifacts (traces/screenshots) stay in a suite-owned folder so they never
  // interleave with the main suite's test-results/ contents.
  outputDir: path.join(CONFIG_DIR, 'test-results/aistudio-artifacts'),
  testMatch: ['**/*.spec.ts'],
  reporter: [
    // Reporters are namespaced so this suite can never clobber the main
    // suite's html-report/ or results.json outputs.
    ['html', { outputFolder: path.join(CONFIG_DIR, 'test-results/aistudio-html-report') }],
    ['json', { outputFile: path.join(CONFIG_DIR, 'test-results/aistudio-results.json') }],
    ['line'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Screenshots are Chrome-only: skip visual regression suite on non-Chromium
      testIgnore: ['**/visual-regression.spec.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      // Screenshots are Chrome-only: skip visual regression suite on non-Chromium
      testIgnore: ['**/visual-regression.spec.ts'],
    },
  ],
  // Root AI Studio SPA: `npm run dev` -> tsx server.ts (Express BFF + Vite
  // middleware, PORT=3000). Starts fine without an AI key.
  webServer: [
    {
      // FastAPI backend (port 8000) — required for contract tests that proxy via Express BFF
      command: 'uv run uvicorn src.athena.api.app:app --host 0.0.0.0 --port 8000',
      cwd: path.resolve(REPO_ROOT, 'backend'),
      url: 'http://localhost:8000/health',
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      cwd: REPO_ROOT,
      url: `${BASE_URL}/api/health`,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
