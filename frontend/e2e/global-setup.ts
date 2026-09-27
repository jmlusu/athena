import type { FullConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * E2E global setup.
 *
 * Contract with the rest of the suite:
 *  - Waits for BOTH services (API on 8001, web on 8530) before any test runs.
 *  - Seeds deterministic fixtures (profile + 5 jobs) with STABLE ids so page
 *    objects and specs can reference `job-high-score` etc.
 *  - Fails loudly: a seed problem must abort the run, never be swallowed.
 *
 * Why seeding writes the store files directly (instead of POSTing):
 *   `POST /jobs` ignores client-supplied ids (JobCreate has no `id`) and
 *   `PATCH /jobs/{id}` assigns raw strings without pydantic validation, so a
 *   `PATCH {"status": "scored"}` leaves a plain `str` in the store cache. That
 *   silently breaks enum comparisons server-side (`/stats/pipeline` counts,
 *   `?status=` filters, `/match` calls `job.match_tier.value`). Writing the
 *   JSONL files before the first data request means the API lazy-loads
 *   fully-validated objects with real enums - and `GET` below proves it did.
 */

const WEB_URL = process.env.E2E_BASE_URL || 'http://localhost:8530';
const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:8001';
const API_ROOT = `${API_URL}/api/v1/athena`;
const API_KEY = process.env.E2E_API_KEY || 'dev-admin-key';
const DATA_DIR =
  process.env.ATHENA_DATA_DIR || path.join(os.tmpdir(), 'athena-e2e-data');
const MANIFEST_PATH = path.join(os.tmpdir(), 'athena-e2e-manifest.json');

const PROFILE_ID = 'a11c0000-0000-4000-8000-000000000001';
const PROFILE_EMAIL = 'test.user@example.com';

// Stable fixture ids. Specs/page objects reference these literals.
const JOB_IDS: Record<string, string> = {
  'job-high-score': 'b22d0000-0000-4000-8000-000000000001',
  'job-medium-score': 'b22d0000-0000-4000-8000-000000000002',
  'job-low-score': 'b22d0000-0000-4000-8000-000000000003',
  'job-consultancy': 'b22d0000-0000-4000-8000-000000000004',
  'job-malawi-local': 'b22d0000-0000-4000-8000-000000000005',
};

const SEEDED_AT = '2026-09-27T00:00:00+00:00';

type SeedJob = {
  key: string;
  source: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string[];
  keywords: string[];
  salary_range?: { min: string; max: string; currency: string; period: string };
  ats_score: number;
  match_score: number;
  match_tier: string;
};

/**
 * Sources are chosen to exercise the scope taxonomy the app derives in
 * `src/lib/athena/mappers.ts`:
 *   malawi_jobs / malawi_work / jobs_malawi  -> lilongwe-local
 *   remote_ok / we_work_remotely / remote_co -> lilongwe-remote
 *   everything else                          -> international-remote
 */
const SEED_JOBS: SeedJob[] = [
  {
    key: 'job-high-score',
    source: 'linkedin',
    title: 'Senior Python Engineer',
    company: 'Nimbus Labs',
    location: 'Remote (US/EU)',
    job_type: 'full_time',
    description:
      'Build and scale Python services for a global logistics platform. ' +
      'Own services end to end: FastAPI, Postgres, event-driven pipelines.',
    requirements: ['Python', 'FastAPI', 'PostgreSQL', '5+ years experience'],
    keywords: ['python', 'fastapi', 'backend'],
    salary_range: { min: '120000', max: '160000', currency: 'USD', period: 'yearly' },
    ats_score: 95,
    match_score: 92,
    match_tier: 'excellent',
  },
  {
    key: 'job-medium-score',
    source: 'remote_ok',
    title: 'Full Stack Developer',
    company: 'Sunbird Health',
    location: 'Lilongwe, Malawi',
    job_type: 'full_time',
    description:
      'React + TypeScript frontend with Python APIs. ' +
      'Remote-first team serving clinics across Malawi.',
    requirements: ['TypeScript', 'React', 'Python'],
    keywords: ['typescript', 'react', 'python'],
    salary_range: { min: '45000', max: '70000', currency: 'USD', period: 'yearly' },
    ats_score: 78,
    match_score: 72,
    match_tier: 'good',
  },
  {
    key: 'job-low-score',
    source: 'glassdoor',
    title: 'DevOps Engineer',
    company: 'Orbit Logistics',
    location: 'Remote (Global)',
    job_type: 'contract',
    description:
      'Kubernetes, Terraform and CI/CD for a high-volume fulfilment stack. ' +
      'Shift-based on-call rotation.',
    requirements: ['Kubernetes', 'Terraform', 'AWS', 'On-call rotation'],
    keywords: ['kubernetes', 'terraform', 'devops'],
    salary_range: { min: '90000', max: '110000', currency: 'USD', period: 'yearly' },
    ats_score: 45,
    match_score: 38,
    match_tier: 'poor',
  },
  {
    key: 'job-consultancy',
    source: 'company_career',
    title: 'Senior Technical Consultant - Climate Finance',
    company: 'GreenGrid Energy',
    location: 'Lilongwe, Malawi (Hybrid)',
    job_type: 'consultancy',
    description:
      'Short-term consultancy advising climate finance programmes. ' +
      'Deliverables: technical due diligence and partner enablement.',
    requirements: ['Climate finance', 'Technical due diligence', 'Stakeholder facilitation'],
    keywords: ['consultancy', 'climate', 'finance'],
    salary_range: { min: '8000', max: '12000', currency: 'USD', period: 'monthly' },
    ats_score: 88,
    match_score: 85,
    match_tier: 'good',
  },
  {
    // Exercises the lilongwe-local scope with an on-site Lilongwe location.
    key: 'job-malawi-local',
    source: 'malawi_jobs',
    title: 'Backend Developer (On-site)',
    company: 'Kwetu Fintech',
    location: 'Lilongwe, Malawi',
    job_type: 'full_time',
    description:
      'On-site backend role building payment services in Python. ' +
      'Workspace: Area 47, Lilongwe.',
    requirements: ['Python', 'Django', 'REST APIs'],
    keywords: ['python', 'django', 'payments'],
    salary_range: { min: '350000000', max: '500000000', currency: 'MWK', period: 'yearly' },
    ats_score: 82,
    match_score: 76,
    match_tier: 'good',
  },
];

const SEED_PROFILE = {
  id: PROFILE_ID,
  email: PROFILE_EMAIL,
  full_name: 'Test User',
  phone: '+265 999 000 001',
  location: 'Lilongwe, Malawi',
  linkedin_url: 'https://www.linkedin.com/in/test-user',
  portfolio_url: 'https://test-user.example.com',
  github_url: 'https://github.com/test-user',
  headline: 'Senior Software Engineer',
  summary:
    'Backend-leaning full-stack engineer with 8 years shipping Python and ' +
    'TypeScript products. Comfortable owning services end to end.',
  skills: [
    { name: 'Python', level: 'expert', years_experience: 8 },
    { name: 'TypeScript', level: 'advanced', years_experience: 5 },
    { name: 'PostgreSQL', level: 'advanced', years_experience: 7 },
    { name: 'AWS', level: 'intermediate', years_experience: 4 },
  ],
  experience: [
    {
      id: 'c33e0000-0000-4000-8000-000000000001',
      title: 'Senior Software Engineer',
      company: 'Sunbird Health',
      location: 'Lilongwe, Malawi',
      start_date: '2022-01-04T00:00:00+00:00',
      current: true,
      description: 'Led the patient-records API migration to FastAPI.',
      achievements: ['Cut p95 latency by 60%', 'Led a team of 4'],
      skills_used: ['Python', 'FastAPI', 'PostgreSQL'],
    },
    {
      id: 'c33e0000-0000-4000-8000-000000000002',
      title: 'Software Engineer',
      company: 'Kwetu Fintech',
      location: 'Lilongwe, Malawi',
      start_date: '2018-06-01T00:00:00+00:00',
      end_date: '2021-12-17T00:00:00+00:00',
      description: 'Built payment reconciliation services in Django.',
      achievements: ['Reconciled 2M+ transactions/month'],
      skills_used: ['Python', 'Django', 'Celery'],
    },
  ],
  education: [
    {
      id: 'c33e0000-0000-4000-8000-000000000003',
      institution: 'University of Malawi',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      start_date: '2014-09-01T00:00:00+00:00',
      end_date: '2018-05-31T00:00:00+00:00',
    },
  ],
  certifications: ['AWS Certified Developer - Associate'],
  languages: ['English', 'Chichewa'],
  preferences: {
    keywords: ['python', 'backend', 'react'],
    excluded_keywords: ['unpaid', 'commission only'],
    locations: ['Lilongwe, Malawi', 'Remote'],
    job_types: ['full_time', 'contract'],
    remote_only: false,
  },
  documents: [],
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT,
};

function jobLine(job: SeedJob): string {
  const record = {
    id: JOB_IDS[job.key],
    source: job.source,
    source_job_id: job.key,
    title: job.title,
    company: job.company,
    location: job.location,
    job_type: job.job_type,
    description: job.description,
    requirements: job.requirements,
    responsibilities: [],
    keywords: job.keywords,
    salary_range: job.salary_range ?? null,
    application_url: `https://jobs.example.com/${job.key}`,
    benefits: [],
    ats_score: job.ats_score,
    match_score: job.match_score,
    match_tier: job.match_tier,
    status: 'scored',
    scraped_at: SEEDED_AT,
    updated_at: SEEDED_AT,
    metadata: { seeded_by: 'e2e-global-setup' },
  };
  return JSON.stringify(record);
}

async function waitFor(url: string, label: string, timeoutMs = 60000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'never responded';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) {
        console.log(`[e2e] ${label} ready: ${url} -> ${response.status}`);
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`[e2e] Timed out waiting for ${label} at ${url} (${lastError})`);
}

async function api(
  method: string,
  pathname: string,
  body?: unknown,
): Promise<{ status: number; text: string }> {
  const response = await fetch(`${API_ROOT}${pathname}`, {
    method,
    headers: {
      'X-API-Key': API_KEY,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, text };
}

async function expectOk(
  method: string,
  pathname: string,
  body?: unknown,
): Promise<any> {
  const { status, text } = await api(method, pathname, body);
  if (status < 200 || status >= 300) {
    throw new Error(
      `[e2e] ${method} ${pathname} failed with HTTP ${status}: ${text.slice(0, 500)}`,
    );
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`[e2e] ${method} ${pathname} returned non-JSON body: ${text.slice(0, 300)}`);
  }
}

function writeSeeds(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, 'user_profiles.jsonl'),
    `${JSON.stringify(SEED_PROFILE)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'jobs.jsonl'),
    SEED_JOBS.map(jobLine).join('\n') + '\n',
    'utf8',
  );
  console.log(
    `[e2e] wrote ${SEED_JOBS.length} jobs + 1 profile to isolated data dir ${DATA_DIR}`,
  );
}

async function verifySeeds(): Promise<void> {
  const jobs = await expectOk('GET', '/jobs?limit=100');
  const byKey = new Map<string, any>(
    (jobs.jobs ?? []).map((job: any) => [job.source_job_id, job]),
  );

  const problems: string[] = [];
  for (const seed of SEED_JOBS) {
    const found = byKey.get(seed.key);
    if (!found) {
      problems.push(`${seed.key}: missing from GET /jobs`);
      continue;
    }
    if (found.id !== JOB_IDS[seed.key]) {
      problems.push(`${seed.key}: id ${found.id} != ${JOB_IDS[seed.key]}`);
    }
    if (found.status !== 'scored') {
      problems.push(`${seed.key}: status "${found.status}" != "scored"`);
    }
    if (found.ats_score !== seed.ats_score) {
      problems.push(`${seed.key}: ats_score ${found.ats_score} != ${seed.ats_score}`);
    }
    if (found.match_score !== seed.match_score) {
      problems.push(
        `${seed.key}: match_score ${found.match_score} != ${seed.match_score}`,
      );
    }
  }

  const pipeline = await expectOk('GET', '/stats/pipeline');
  if (pipeline.total_jobs !== SEED_JOBS.length) {
    problems.push(
      `/stats/pipeline total_jobs ${pipeline.total_jobs} != ${SEED_JOBS.length}`,
    );
  }
  if (pipeline.scored !== SEED_JOBS.length) {
    problems.push(
      `/stats/pipeline scored ${pipeline.scored} != ${SEED_JOBS.length} ` +
        '(status may have landed as a plain string instead of an enum)',
    );
  }

  const profiles = await expectOk('GET', '/profiles');
  const profile = (profiles ?? []).find((p: any) => p.id === PROFILE_ID);
  if (!profile) {
    problems.push(`profile ${PROFILE_ID} (${PROFILE_EMAIL}) missing from GET /profiles`);
  } else if (profile.email !== PROFILE_EMAIL) {
    problems.push(`profile email "${profile.email}" != "${PROFILE_EMAIL}"`);
  }

  if (problems.length > 0) {
    throw new Error(
      '[e2e] Seed verification failed:\n  - ' +
        problems.join('\n  - ') +
        `\n  Data dir: ${DATA_DIR}` +
        '\n  Check that the API process was started with ATHENA_DATA_DIR=' +
        DATA_DIR,
    );
  }

  console.log(
    `[e2e] seed verified: ${SEED_JOBS.length} scored jobs, profile ${PROFILE_ID}`,
  );
}

function writeManifest(): void {
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        jobIds: Object.values(JOB_IDS),
        profileId: PROFILE_ID,
        dataDir: DATA_DIR,
        apiUrl: API_URL,
      },
      null,
      2,
    ),
    'utf8',
  );
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  // 1. Both services must be up (Playwright starts them first; this makes the
  //    requirement explicit and gives a readable error if either is down).
  await waitFor(`${API_URL}/health`, 'Athena API');
  await waitFor(WEB_URL, 'Athena web app');

  // 2. Seed BEFORE the first data request so the store's lazy load picks the
  //    files up (see file header).
  writeSeeds();

  // 3. Prove the API actually served the seeded data.
  await verifySeeds();

  // 4. Give teardown what it needs to clean up.
  writeManifest();
}
