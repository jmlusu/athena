/**
 * Global teardown for Playwright E2E tests
 * Cleans up test data, stops services
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');
  
  const isCI = !!process.env.CI;
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8530';
  
  // Clean up test data
  await cleanupTestData(baseURL);
  
  if (!isCI) {
    // Stop local services
    await stopLocalServices();
  }
  
  console.log('✅ Global teardown complete');
}

async function cleanupTestData(baseURL: string) {
  console.log('Cleaning up test data...');
  
  const apiBase = baseURL.replace('8530', '8520') + '/api/v1/athena';
  const headers = {
    'X-API-Key': 'dev-admin-key',
    'Content-Type': 'application/json',
  };
  
  // Delete test jobs
  const testJobIds = ['job-high-score', 'job-medium-score', 'job-low-score', 'job-consultancy'];
  for (const jobId of testJobIds) {
    try {
      await fetch(`${apiBase}/jobs/${jobId}`, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      // Ignore
    }
  }
  
  // Delete test profile
  try {
    await fetch(`${apiBase}/profiles/test-profile-1`, {
      method: 'DELETE',
      headers,
    });
  } catch (e) {
    // Ignore
  }
  
  console.log('Test data cleaned up');
}

async function stopLocalServices() {
  console.log('Stopping local services...');
  // Services stopped via webServer teardown
  // Nothing additional needed here
}

export default globalTeardown;