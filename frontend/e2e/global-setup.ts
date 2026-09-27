/**
 * Global setup for Playwright E2E tests
 * Starts backend and frontend services, seeds test data
 */

import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  const isCI = !!process.env.CI;
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8530';
  
  if (isCI) {
    // In CI, docker-compose should already be running via webServer
    console.log('CI environment detected - waiting for services...');
    await waitForServices(baseURL);
  } else {
    // Local development - start services
    console.log('Starting local services...');
    await startLocalServices();
    await waitForServices(baseURL);
  }
  
  // Seed test data via API
  await seedTestData(baseURL);
  
  // Create test auth state for reuse
  await createAuthState(baseURL);
  
  console.log('✅ Global setup complete');
}

async function startLocalServices() {
  console.log('Starting backend (FastAPI)...');
  // Backend starts via webServer command
  // We just need to ensure the environment is set
  process.env.ATHENA_API_KEY = 'dev-admin-key';
  process.env.ATHENA_AI_PROVIDER = 'fallback';
  process.env.GEMINI_API_KEY = '';
  process.env.AISTUDIO_PREVIEW = 'false';
}

async function waitForServices(baseURL: string, maxRetries = 30) {
  console.log(`Waiting for services at ${baseURL}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseURL.replace('8530', '8520')}/health`);
      if (response.ok) {
        console.log('Backend health check passed');
        break;
      }
    } catch {
      // Ignore
    }
    
    if (i === maxRetries - 1) {
      throw new Error('Services did not become healthy in time');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Also check frontend
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        console.log('Frontend health check passed');
        break;
      }
    } catch {
      // Ignore
    }
    
    if (i === maxRetries - 1) {
      throw new Error('Frontend did not become healthy in time');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function seedTestData(baseURL: string) {
  console.log('Seeding test data...');
  
  const apiBase = baseURL.replace('8530', '8520') + '/api/v1/athena';
  const headers = {
    'X-API-Key': 'dev-admin-key',
    'Content-Type': 'application/json',
  };
  
  // Create test profile
  try {
    await fetch(`${apiBase}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'test-profile-1',
        email: 'test@athena.local',
        full_name: 'Test User',
        skills: ['Python', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
        experience: [
          {
            id: 'exp-1',
            company: 'Tech Corp',
            title: 'Senior Software Engineer',
            start_date: '2022-01-01',
            end_date: null,
            description: 'Built scalable microservices using Python and TypeScript',
            technologies: ['Python', 'TypeScript', 'AWS', 'Docker'],
          },
        ],
        education: [
          {
            id: 'edu-1',
            institution: 'University of Technology',
            degree: 'Master of Science',
            field: 'Computer Science',
            start_date: '2017-09-01',
            end_date: '2019-05-01',
          },
        ],
        certifications: [
          { id: 'cert-1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023-03-15' },
        ],
        preferences: {
          autoCreateThreshold: 90,
          flagThresholdMin: 80,
          flagThresholdMax: 89,
          dehumanizeEnabled: true,
          n8nWebhookUrl: 'https://n8n.test.webhook',
          n8nActive: false,
        },
        documents: [
          {
            id: 'doc-1',
            name: 'Resume - Senior Engineer',
            type: 'resume',
            content: 'Test resume content',
            updated_at: '2026-01-15T10:00:00Z',
          },
        ],
      }),
    });
    console.log('Test profile created');
  } catch (e) {
    console.log('Test profile may already exist:', e);
  }
  
  // Create test jobs
  const testJobs = [
    {
      id: 'job-high-score',
      source: 'linkedin',
      source_job_id: 'linkedin-12345',
      title: 'Senior Python Engineer',
      company: 'AI Innovations Inc',
      location: 'Remote (US/EU)',
      job_type: 'full-time',
      description: 'We are looking for a Senior Python Engineer to build AI-powered applications. Requirements: 5+ years Python, experience with FastAPI, PostgreSQL, AWS, Docker, Kubernetes. Nice to have: TypeScript, React, ML/AI experience.',
      requirements: '5+ years Python, FastAPI, PostgreSQL, AWS, Docker, Kubernetes',
      salary_range: '$150,000 - $200,000',
      application_url: 'https://ai-innovations.com/careers/senior-python-engineer',
      ats_score: 95,
      match_score: 92,
      match_tier: 'excellent',
      status: 'scored',
      scraped_at: '2026-09-20T10:00:00Z',
    },
    {
      id: 'job-medium-score',
      source: 'indeed',
      source_job_id: 'indeed-67890',
      title: 'Full Stack Developer',
      company: 'Web Solutions Ltd',
      location: 'Lilongwe, Malawi',
      job_type: 'full-time',
      description: 'Full Stack Developer needed for Malawi-based projects. React, TypeScript, Node.js, PostgreSQL. Experience with Malawi regulatory environment a plus.',
      requirements: '3+ years React, TypeScript, Node.js, PostgreSQL',
      salary_range: 'MWK 2,500,000 - 4,000,000/month',
      application_url: 'https://websolutions.mw/careers/fullstack',
      ats_score: 78,
      match_score: 72,
      match_tier: 'good',
      status: 'scored',
      scraped_at: '2026-09-20T11:00:00Z',
    },
    {
      id: 'job-low-score',
      source: 'glassdoor',
      source_job_id: 'glassdoor-11111',
      title: 'DevOps Engineer',
      company: 'Cloud Systems Co',
      location: 'Remote (Global)',
      job_type: 'contract',
      description: 'DevOps Engineer for cloud infrastructure. Terraform, Kubernetes, AWS, CI/CD pipelines. 5+ years experience required.',
      requirements: '5+ years Terraform, Kubernetes, AWS, CI/CD',
      salary_range: '$100/hr - $150/hr',
      application_url: 'https://cloudsystems.co/jobs/devops',
      ats_score: 45,
      match_score: 38,
      match_tier: 'poor',
      status: 'scored',
      scraped_at: '2026-09-20T12:00:00Z',
    },
    {
      id: 'job-consultancy',
      source: 'devex',
      source_job_id: 'devex-22222',
      title: 'Senior Technical Consultant - Climate Finance',
      company: 'Global Development Partners',
      location: 'Lilongwe, Malawi (Hybrid)',
      job_type: 'consultancy',
      description: 'Consultancy for climate finance project in Malawi. Requires expertise in climate finance, World Bank/GCF procedures, stakeholder engagement. 10+ years experience.',
      requirements: '10+ years climate finance, World Bank procedures, stakeholder engagement',
      salary_range: '$200,000 - $300,000 total',
      application_url: 'https://globdevpartners.org/consultancies/climate-finance',
      ats_score: 88,
      match_score: 85,
      match_tier: 'good',
      status: 'scored',
      scraped_at: '2026-09-20T13:00:00Z',
    },
  ];
  
  for (const job of testJobs) {
    try {
      await fetch(`${apiBase}/jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(job),
      });
    } catch (e) {
      console.log(`Job ${job.id} may already exist:`, e);
    }
  }
  console.log('Test jobs created');
}

async function createAuthState(baseURL: string) {
  // Playwright can reuse auth state - but we use API key header instead
  // This is a placeholder for future auth state reuse
  console.log('Auth state: using X-API-Key header');
}

export default globalSetup;