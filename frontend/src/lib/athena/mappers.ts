// Mappers between core Job/UserProfile models and the AI Studio
// Opportunity/ApplicantProfile shapes used by the migrated modals.

import type {
  ApplicantProfile,
  Education,
  Experience,
  Job,
  JobSource,
  JobStatus,
  Opportunity,
  OpportunityPlatform,
  OpportunityScope,
  PipelineStatus,
  UserProfile,
} from './types';
import type { ApplicantProfile as AIApplicantProfile } from './aiTypes';
import { formatSalary, formatDate } from './api';

// JobSource -> OpportunityPlatform (OpportunityPlatform is a closed union;
// boards without a dedicated platform surface as Corporate, freelance
// marketplaces group under Upwork).
const SOURCE_TO_PLATFORM: Record<JobSource, OpportunityPlatform> = {
  linkedin: 'LinkedIn',
  indeed: 'Corporate',
  glassdoor: 'Corporate',
  company_career: 'Corporate',
  malawi_jobs: 'MyJobo',
  malawi_work: 'MyJobo',
  jobs_malawi: 'MyJobo',
  upwork: 'Upwork',
  toptal: 'Upwork',
  freelancer: 'Upwork',
  guru: 'Upwork',
  people_per_hour: 'Upwork',
  remote_ok: 'Corporate',
  we_work_remotely: 'Corporate',
  remote_co: 'Corporate',
  other: 'Corporate',
};

const MALAWI_SOURCES: JobSource[] = ['malawi_jobs', 'malawi_work', 'jobs_malawi'];
const REMOTE_BOARD_SOURCES: JobSource[] = ['remote_ok', 'we_work_remotely', 'remote_co'];

// JobStatus -> PipelineStatus
const STATUS_TO_PIPELINE: Record<JobStatus, PipelineStatus> = {
  new: 'discovered',
  fetched: 'discovered',
  matched: 'evaluated',
  scored: 'evaluated',
  flagged: 'evaluated',
  applied: 'submitted',
  interview: 'interview',
  offer: 'offer',
  rejected: 'evaluated',
  archived: 'evaluated',
};

function sourceToScope(source: JobSource): OpportunityScope {
  if (MALAWI_SOURCES.includes(source)) return 'lilongwe-local';
  if (REMOTE_BOARD_SOURCES.includes(source)) return 'lilongwe-remote';
  return 'international-remote';
}

/** Map a backend Job to the AI Studio Opportunity shape (modals/Kanban). */
export function jobToOpportunity(job: Job): Opportunity & { source_job_id: string } {
  return {
    id: job.id,
    source_job_id: job.source_job_id ?? job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    category: job.job_type === 'consultancy' ? 'consultancy' : 'job',
    scope: job.scope ?? sourceToScope(job.source),
    platform: SOURCE_TO_PLATFORM[job.source],
    description: job.description,
    requirements: job.requirements,
    salaryOrBudget: formatSalary(job.salary_range),
    deadline: job.expiry_date ? formatDate(job.expiry_date) : '',
    atsScore: job.ats_score ?? 0,
    postedDate: formatDate(job.posted_date ?? job.scraped_at),
    status: STATUS_TO_PIPELINE[job.status],
    isFlagged: job.status === 'flagged',
    matchedSkills: job.keywords.length > 0 ? job.keywords : undefined,
    match_tier: job.match_tier,
  };
}

function experienceToEntry(exp: Experience): AIApplicantProfile['experience'][number] {
  const start = exp.start_date;
  const end = exp.current ? 'Present' : exp.end_date ?? '';
  return {
    role: exp.title,
    company: exp.company,
    period: end ? `${start} - ${end}` : start,
    location: exp.location ?? '',
    bullets: exp.description ? [exp.description, ...exp.achievements] : exp.achievements,
  };
}

function educationToEntry(edu: Education): AIApplicantProfile['education'][number] {
  return {
    degree: edu.degree,
    institution: edu.institution,
    year: edu.end_date ?? edu.start_date ?? '',
  };
}

/**
 * Map a backend UserProfile to the AI Studio ApplicantProfile.
 *
 * The backend profile API has no rate/signature fields, so rates are derived
 * from preferences.min_salary (annual USD) and the signer defaults to the
 * applicant's full name.
 */
export function userProfileToApplicantProfile(profile: UserProfile): AIApplicantProfile {
  const annualUsd = profile.preferences.min_salary;
  return {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    headline: profile.headline,
    summary: profile.summary,
    skills: profile.skills.map((s) => s.name),
    experience: profile.experience.map(experienceToEntry),
    education: profile.education.map(educationToEntry),
    certifications: profile.certifications,
    hourly_rate_usd: annualUsd ? Math.round(annualUsd / 2080) : 0,
    expected_monthly_mwk: 0,
    legal_authorized_signer: profile.full_name,
    linkedin_url: profile.linkedin_url,
    portfolio_url: profile.portfolio_url,
    github_url: profile.github_url,
    preferences: profile.preferences,
  };
}

/** Map a backend UserProfile to the camelCase Athena ApplicantProfile used by DocumentStudio. */
export function userProfileToAthenaApplicantProfile(profile: UserProfile): ApplicantProfile {
  const annualUsd = profile.preferences.min_salary;
  return {
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    headline: profile.headline,
    summary: profile.summary,
    skills: profile.skills.map((s) => s.name),
    experience: profile.experience.map(experienceToEntry),
    education: profile.education.map(educationToEntry),
    certifications: profile.certifications,
    hourlyRateUsd: annualUsd ? Math.round(annualUsd / 2080) : 0,
    expectedMonthlyMwk: 0,
    legalAuthorizedSigner: profile.full_name,
    linkedinUrl: profile.linkedin_url,
  };
}
