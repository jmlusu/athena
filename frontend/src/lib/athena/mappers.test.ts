import { describe, expect, it } from 'vitest';

import type { Education, Experience, Job, UserProfile } from './types';
import {
  jobToOpportunity,
  userProfileToApplicantProfile,
  userProfileToAthenaApplicantProfile,
} from './mappers';

const PREFERENCES: UserProfile['preferences'] = {
  keywords: ['frontend'],
  excluded_keywords: [],
  locations: ['Lilongwe'],
  job_types: ['full_time'],
  min_salary: 60000,
  preferred_sources: ['linkedin'],
  remote_only: true,
  visa_sponsorship_required: false,
};

const makeExperience = (overrides: Partial<Experience> = {}): Experience => ({
  id: 'exp-1',
  title: 'Senior Software Engineer',
  company: 'Acme Ltd',
  location: 'Lilongwe',
  start_date: '2021-01',
  end_date: '2023-06',
  current: false,
  description: 'Built the ingestion pipeline',
  achievements: ['Cut latency by 40%'],
  skills_used: ['TypeScript'],
  ...overrides,
});

const makeEducation = (overrides: Partial<Education> = {}): Education => ({
  id: 'edu-1',
  institution: 'University of Malawi',
  degree: 'BSc Computer Science',
  field_of_study: 'Computer Science',
  start_date: '2015',
  end_date: '2019',
  honors: [],
  ...overrides,
});

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'profile-1',
  email: 'ada@example.com',
  full_name: 'Ada Lovelace',
  phone: '+265 991 234 567',
  location: 'Lilongwe, Malawi',
  linkedin_url: 'https://linkedin.com/in/ada',
  headline: 'Senior Software Engineer',
  summary: 'Engineer focused on job pipelines.',
  skills: [{ name: 'TypeScript' }, { name: 'Python' }],
  experience: [makeExperience()],
  education: [makeEducation()],
  certifications: ['AWS Solutions Architect'],
  languages: ['English'],
  preferences: PREFERENCES,
  documents: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  source: 'linkedin',
  title: 'Frontend Engineer',
  company: 'Acme Ltd',
  location: 'Remote',
  job_type: 'full_time',
  description: 'Build UI',
  requirements: ['React'],
  responsibilities: [],
  keywords: ['react'],
  application_url: 'https://example.com/job',
  benefits: [],
  status: 'new',
  scraped_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
  metadata: {},
  ...overrides,
});

describe('userProfileToAthenaApplicantProfile', () => {
  it('maps the full source profile into the camelCase DocumentStudio shape', () => {
    expect(userProfileToAthenaApplicantProfile(makeProfile())).toEqual({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+265 991 234 567',
      location: 'Lilongwe, Malawi',
      headline: 'Senior Software Engineer',
      summary: 'Engineer focused on job pipelines.',
      skills: ['TypeScript', 'Python'],
      experience: [
        {
          role: 'Senior Software Engineer',
          company: 'Acme Ltd',
          period: '2021-01 - 2023-06',
          location: 'Lilongwe',
          bullets: ['Built the ingestion pipeline', 'Cut latency by 40%'],
        },
      ],
      education: [
        { degree: 'BSc Computer Science', institution: 'University of Malawi', year: '2019' },
      ],
      certifications: ['AWS Solutions Architect'],
      hourlyRateUsd: 29,
      expectedMonthlyMwk: 0,
      legalAuthorizedSigner: 'Ada Lovelace',
      linkedinUrl: 'https://linkedin.com/in/ada',
    });
  });

  it('derives hourlyRateUsd as Math.round(min_salary / 2080)', () => {
    const result = userProfileToAthenaApplicantProfile(makeProfile());
    expect(result.hourlyRateUsd).toBe(Math.round(60000 / 2080));
  });

  it('keeps hourlyRateUsd safe when min_salary is missing or zero', () => {
    const missing = userProfileToAthenaApplicantProfile(
      makeProfile({ preferences: { ...PREFERENCES, min_salary: undefined } }),
    );
    const zero = userProfileToAthenaApplicantProfile(
      makeProfile({ preferences: { ...PREFERENCES, min_salary: 0 } }),
    );
    expect(missing.hourlyRateUsd).toBe(0);
    expect(zero.hourlyRateUsd).toBe(0);
  });

  it('leaves linkedinUrl undefined when the profile has none', () => {
    const result = userProfileToAthenaApplicantProfile(
      makeProfile({ linkedin_url: undefined }),
    );
    expect(result.linkedinUrl).toBeUndefined();
  });
});

describe('userProfileToApplicantProfile', () => {
  it('maps the source profile into the snake_case AI Studio shape', () => {
    expect(userProfileToApplicantProfile(makeProfile())).toEqual({
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+265 991 234 567',
      location: 'Lilongwe, Malawi',
      headline: 'Senior Software Engineer',
      summary: 'Engineer focused on job pipelines.',
      skills: ['TypeScript', 'Python'],
      experience: [
        {
          role: 'Senior Software Engineer',
          company: 'Acme Ltd',
          period: '2021-01 - 2023-06',
          location: 'Lilongwe',
          bullets: ['Built the ingestion pipeline', 'Cut latency by 40%'],
        },
      ],
      education: [
        { degree: 'BSc Computer Science', institution: 'University of Malawi', year: '2019' },
      ],
      certifications: ['AWS Solutions Architect'],
      hourly_rate_usd: 29,
      expected_monthly_mwk: 0,
      legal_authorized_signer: 'Ada Lovelace',
      linkedin_url: 'https://linkedin.com/in/ada',
      preferences: PREFERENCES,
    });
  });
});

describe('cross-shape consistency (names-were-blank regression)', () => {
  it('both mappers derive identical name, email, and rate from the same profile', () => {
    const source = makeProfile();
    const athena = userProfileToAthenaApplicantProfile(source);
    const aiStudio = userProfileToApplicantProfile(source);

    expect(athena.fullName).toBe(source.full_name);
    expect(aiStudio.full_name).toBe(source.full_name);
    expect(athena.fullName).toBe(aiStudio.full_name);
    expect(athena.email).toBe(aiStudio.email);
    expect(athena.hourlyRateUsd).toBe(aiStudio.hourly_rate_usd);
  });
});

describe('jobToOpportunity', () => {
  it('carries source_job_id from the job, falling back to the internal id', () => {
    expect(jobToOpportunity(makeJob({ source_job_id: 'li-999' })).source_job_id).toBe('li-999');
    expect(jobToOpportunity(makeJob()).source_job_id).toBe('job-1');
  });

  it('maps core job fields onto the Opportunity shape', () => {
    const opportunity = jobToOpportunity(makeJob());
    expect(opportunity.title).toBe('Frontend Engineer');
    expect(opportunity.company).toBe('Acme Ltd');
    expect(opportunity.platform).toBe('LinkedIn');
    expect(opportunity.status).toBe('discovered');
    expect(opportunity.category).toBe('job');
    expect(opportunity.scope).toBe('international-remote');
  });
});
