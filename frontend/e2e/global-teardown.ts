import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * E2E global teardown - inverse of global-setup.ts.
 *
 * Only removes what setup created (the seeded jobs, via the API so the live
 * process stays consistent) and drops the manifest. Never touches staging
 * data: seeds live in the isolated ATHENA_DATA_DIR written by the config.
 * Also cleans up local test-results and test-output to prevent storage bloat.
 */

const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:8001';
const API_ROOT = `${API_URL}/api/v1/athena`;
const API_KEY = process.env.E2E_API_KEY || 'dev-admin-key';
const MANIFEST_PATH = path.join(os.tmpdir(), 'athena-e2e-manifest.json');
const TEST_RESULTS_DIR = path.join(os.tmpdir(), 'athena-e2e-test-results');

type Manifest = {
  jobIds?: string[];
  profileId?: string;
};

async function del(pathname: string): Promise<number> {
  try {
    const response = await fetch(`${API_ROOT}${pathname}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': API_KEY },
    });
    return response.status;
  } catch {
    // Server already gone - nothing left to clean.
    return 0;
  }
}

export default async function globalTeardown(): Promise<void> {
  let manifest: Manifest = {};
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  } catch {
    console.log('[e2e] teardown: no manifest found, nothing seeded - skipping');
    return;
  }

  let removed = 0;
  for (const jobId of manifest.jobIds ?? []) {
    const status = await del(`/jobs/${jobId}`);
    if (status === 200 || status === 404) {
      removed += 1;
    } else {
      console.warn(`[e2e] teardown: DELETE /jobs/${jobId} -> HTTP ${status}`);
    }
  }

  // There is no DELETE /profiles endpoint (routes only expose POST/GET/PATCH),
  // so the seeded profile is intentionally left in place; the next setup
  // overwrites user_profiles.jsonl anyway.
  if (manifest.profileId) {
    const status = await del(`/profiles/${manifest.profileId}`);
    if (status !== 0 && status !== 405 && status !== 404) {
      console.warn(
        `[e2e] teardown: unexpected DELETE /profiles/${manifest.profileId} -> HTTP ${status}`,
      );
    }
  }

  // Clean up local test results to prevent storage bloat
  if (fs.existsSync(TEST_RESULTS_DIR)) {
    fs.rmSync(TEST_RESULTS_DIR, { recursive: true, force: true });
    console.log('[e2e] teardown: removed test-results directory');
  }

  fs.rmSync(MANIFEST_PATH, { force: true });
  console.log(`[e2e] teardown: removed ${removed}/${manifest.jobIds?.length ?? 0} seeded jobs`);
}
