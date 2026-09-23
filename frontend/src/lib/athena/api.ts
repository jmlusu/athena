import type {
  Job,
  JobListResponse,
  JobFilter,
  UserProfile,
  Application,
  ApplicationListResponse,
  ATSScoreResponse,
  PipelineStatsResponse,
  ScrapeJob,
  MatchJobsResponse,
  JobSource,
  JobType,
  JobStatus,
  MatchTier,
} from './types';

const API_BASE = import.meta.env.VITE_ATHENA_API_BASE || '/api/v1/athena';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Job endpoints
export async function listJobs(filters: JobFilter = {}): Promise<JobListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return fetchJson<JobListResponse>(`${API_BASE}/jobs?${params.toString()}`);
}

export async function getJob(jobId: string): Promise<Job> {
  return fetchJson<Job>(`${API_BASE}/jobs/${jobId}`);
}

export async function createJob(job: Omit<Job, 'id' | 'scraped_at' | 'updated_at' | 'ats_score' | 'match_score' | 'match_tier' | 'status'>): Promise<Job> {
  return fetchJson<Job>(`${API_BASE}/jobs`, {
    method: 'POST',
    body: JSON.stringify(job),
  });
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
  return fetchJson<Job>(`${API_BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
}

// User Profile endpoints
export async function listProfiles(): Promise<UserProfile[]> {
  return fetchJson<UserProfile[]>(`${API_BASE}/profiles`);
}

export async function getProfile(profileId: string): Promise<UserProfile> {
  return fetchJson<UserProfile>(`${API_BASE}/profiles/${profileId}`);
}

export async function getProfileByEmail(email: string): Promise<UserProfile> {
  return fetchJson<UserProfile>(`${API_BASE}/profiles/email/${encodeURIComponent(email)}`);
}

export async function createProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
  return fetchJson<UserProfile>(`${API_BASE}/profiles`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function updateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  return fetchJson<UserProfile>(`${API_BASE}/profiles/${profileId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Application endpoints
export async function listApplications(filters?: {
  user_profile_id?: string;
  job_id?: string;
  status?: string;
}): Promise<ApplicationListResponse> {
  const params = new URLSearchParams();
  if (filters?.user_profile_id) params.append('user_profile_id', filters.user_profile_id);
  if (filters?.job_id) params.append('job_id', filters.job_id);
  if (filters?.status) params.append('status', filters.status);
  return fetchJson<ApplicationListResponse>(`${API_BASE}/applications?${params.toString()}`);
}

export async function getApplication(appId: string): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications/${appId}`);
}

export async function createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications`, {
    method: 'POST',
    body: JSON.stringify(application),
  });
}

export async function updateApplication(appId: string, updates: Partial<Application>): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications/${appId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Matching & Scoring endpoints
export async function matchJobs(request: {
  profile_id: string;
  job_ids?: string[];
  top_k?: number;
  min_score?: number;
}): Promise<MatchJobsResponse> {
  return fetchJson<MatchJobsResponse>(`${API_BASE}/match`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getATSScore(jobId: string, profileId: string): Promise<ATSScoreResponse> {
  return fetchJson<ATSScoreResponse>(`${API_BASE}/score/${jobId}/${profileId}`);
}

// Scraping endpoints
export async function triggerScrape(request: {
  query: string;
  location?: string;
  job_type?: JobType;
  max_results?: number;
  sources?: JobSource[];
  user_profile_id?: string;
}): Promise<ScrapeJob> {
  return fetchJson<ScrapeJob>(`${API_BASE}/scrape`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getScrapeHistory(limit = 50): Promise<ScrapeJob[]> {
  return fetchJson<ScrapeJob[]>(`${API_BASE}/scrape/history?limit=${limit}`);
}

// Statistics endpoints
export async function getPipelineStats(): Promise<PipelineStatsResponse> {
  return fetchJson<PipelineStatsResponse>(`${API_BASE}/stats/pipeline`);
}

export async function getScrapingStats(): Promise<{
  recent_scrapes: ScrapeJob[];
  total_jobs_scraped: number;
  total_new_jobs: number;
  last_scrape_at?: string;
}> {
  return fetchJson(`${API_BASE}/stats/scraping`);
}

// Scheduler control
export async function startScheduler(): Promise<{ status: string; running: boolean }> {
  return fetchJson(`${API_BASE}/scheduler/start`, { method: 'POST' });
}

export async function stopScheduler(): Promise<{ status: string; running: boolean }> {
  return fetchJson(`${API_BASE}/scheduler/stop`, { method: 'POST' });
}

export async function getSchedulerStatus(): Promise<{ running: boolean; jobs: Array<{ id: string; name: string; next_run?: string }> }> {
  return fetchJson(`${API_BASE}/scheduler/status`);
}

// Helper functions for UI — dark skeuomorphic chips: bg-{hue}-500/15 text-{hue}-300 border-{hue}-500/30
export function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    new: 'bg-ls-red/15 text-ls-red border-ls-red/40',
    fetched: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    matched: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    scored: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    applied: 'bg-ls-red/15 text-ls-red border-ls-red/40',
    interview: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    offer: 'bg-green-500/15 text-green-300 border-green-500/30',
    rejected: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    archived: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return colors[status] || colors.new;
}

export function getMatchTierColor(tier: MatchTier | undefined): string {
  const colors: Record<MatchTier, string> = {
    excellent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    good: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    fair: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    poor: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return tier ? colors[tier] : 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}

export function getMatchTierLabel(tier: MatchTier | undefined): string {
  const labels: Record<MatchTier, string> = {
    excellent: 'Excellent Match',
    good: 'Good Match',
    fair: 'Fair Match',
    poor: 'Poor Match',
  };
  return tier ? labels[tier] : 'Unscored';
}

export function formatSalary(range?: { min?: number; max?: number; currency: string; period: string }): string {
  if (!range) return 'Not specified';
  const { min, max, currency = 'USD', period = 'yearly' } = range;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)} / ${period}`;
  if (min) return `From ${fmt(min)} / ${period}`;
  if (max) return `Up to ${fmt(max)} / ${period}`;
  return 'Not specified';
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function getJobTypeLabel(type: JobType): string {
  const labels: Record<JobType, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    consultancy: 'Consultancy',
    freelance: 'Freelance',
    internship: 'Internship',
    temporary: 'Temporary',
  };
  return labels[type] || type;
}

export function getJobSourceLabel(source: JobSource): string {
  const labels: Record<JobSource, string> = {
    linkedin: 'LinkedIn',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
    company_career: 'Company Career',
    malawi_jobs: 'Malawi Jobs',
    malawi_work: 'Malawi Work',
    jobs_malawi: 'Jobs Malawi',
    upwork: 'Upwork',
    toptal: 'Toptal',
    freelancer: 'Freelancer',
    guru: 'Guru',
    people_per_hour: 'PeoplePerHour',
    remote_ok: 'Remote OK',
    we_work_remotely: 'We Work Remotely',
    remote_co: 'Remote.co',
    other: 'Other',
  };
  return labels[source] || source;
}
