import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve every path against this config file (not the CWD) so the suite runs
// from repo root or e2e/.
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
// e2e -> repo root (the `npm run dev` / server.ts root).
const REPO_ROOT = path.resolve(CONFIG_DIR, '..');

const BASE_URL = 'http://localhost:3000';

// The suite generates well over 100 requests/minute from a single IP (every test
// hits the backend over 127.0.0.1, and each app load paginates jobs in two
// calls). The backend's sliding-window limiter (app.py, default 100/60s) then
// answers 429 mid-suite, which surfaces as flaky unrelated failures.
//
// Raised only for the backend Playwright spawns below -- child processes inherit
// process.env, and load_dotenv() does not override existing variables, so this
// never touches a dev or production process. An explicit ATHENA_RATE_LIMIT from
// the caller still wins.
if (!process.env.ATHENA_RATE_LIMIT) {
  process.env.ATHENA_RATE_LIMIT = '5000';
}

export default defineConfig({
  // Isolated test dir: the main config's testDir (`e2e/tests`) never sees these.
  testDir: path.join(CONFIG_DIR, 'aistudio'),
  fullyParallel: true,
  // Playwright's default is cores/2, which is 8 here. Each worker launches a
  // browser that boots the SPA and renders the full job board (~140 cards) while
  // the BFF, Vite and FastAPI compete for the same box; at 7-8 concurrent
  // workers even `GET /api/health` misses the 30s timeout. Every browser passes
  // 18/18 at this width, so cap it rather than let the suite flake.
  workers: process.env.CI ? 2 : 4,
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
