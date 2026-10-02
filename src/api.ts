import type {
  Opportunity,
  ApplicantProfile,
  ApplicationReceipt,
  PipelineStatus,
  OpportunityScope,
  OpportunityCategory,
  OpportunityPlatform,
  TailoredResume,
  TailoredDocument,
  AutomationSettings,
  CronScheduleState,
  PipelineStats,
  ScrapeJobResponse,
  MatchJobsResponse,
  ATSScoreRequest,
  ATSScoreResponse,
  TailorResumeRequest,
  TailorResumeResponse,
  TailorDocumentRequest,
  TailorDocumentResponse,
  DehumanizeRequest,
  DehumanizeResponse,
  ScrapeLiveRequest,
  ScrapeLiveResponse,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
  N8nDispatchRequest,
  N8nDispatchResponse,
  N8nIngressRequest,
  N8nIngressResponse,
  HealthResponse,
  BackendHealthResponse,
  ArtifactLockResponse,
  StaleLockResponse,
  SchedulerStatus,
} from "./types";

const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Jobs
  listJobs: (params?: { scope?: string; category?: string; limit?: number }) =>
    request<{ jobs: Opportunity[]; total: number }>(
      `/v1/athena/jobs${params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""}`
    ),
  getJob: (id: string) => request<Opportunity>(`/v1/athena/jobs/${id}`),
  createJob: (job: Partial<Opportunity>) => request<Opportunity>("/v1/athena/jobs", { method: "POST", body: JSON.stringify(job) }),

  // Profiles
  listProfiles: () => request<ApplicantProfile[]>("/v1/athena/profiles"),
  getProfile: (id: string) => request<ApplicantProfile>(`/v1/athena/profiles/${id}`),
  createProfile: (profile: Partial<ApplicantProfile>) => request<ApplicantProfile>("/v1/athena/profiles", { method: "POST", body: JSON.stringify(profile) }),

  // Applications
  listApplications: () => request<ApplicationReceipt[]>("/v1/athena/applications"),
  getApplication: (id: string) => request<ApplicationReceipt>(`/v1/athena/applications/${id}`),
  createApplication: (app: Record<string, unknown>) => request<ApplicationReceipt>("/v1/athena/applications", { method: "POST", body: JSON.stringify(app) }),

  // Receipts
  listReceipts: () => request<ApplicationReceipt[]>("/v1/athena/receipts"),
  getReceipt: (id: string) => request<ApplicationReceipt>(`/v1/athena/receipts/${id}`),

  // Stats
  getStats: () => request<Record<string, unknown>>("/v1/athena/stats"),
  getPipelineStats: () => request<PipelineStats>("/v1/athena/stats/pipeline"),

  // Actions
  triggerScrape: (body: { location_filter?: string; search_type?: string; keywords?: string; resume_skills?: string[] }) =>
    request<ScrapeJobResponse>("/v1/athena/scrape", { method: "POST", body: JSON.stringify(body) }),
  processJobs: () => request<unknown>("/v1/athena/process", { method: "POST" }),
  matchJobs: (body: Record<string, unknown>) => request<MatchJobsResponse>("/v1/athena/match", { method: "POST", body: JSON.stringify(body) }),
  scoreJob: (jobId: string, profileId: string) => request<ATSScoreResponse>(`/v1/athena/score/${jobId}/${profileId}`),

  // Scheduler
  startScheduler: () => request<unknown>("/v1/athena/scheduler/start", { method: "POST" }),
  stopScheduler: () => request<unknown>("/v1/athena/scheduler/stop", { method: "POST" }),
  schedulerStatus: () => request<SchedulerStatus>("/v1/athena/scheduler/status"),

  // AI (proxied through Express)
  scoreAts: (body: ATSScoreRequest) => request<ATSScoreResponse>("/ai/score-ats", { method: "POST", body: JSON.stringify(body) }),
  tailorResume: (body: TailorResumeRequest) => request<TailorResumeResponse>("/ai/tailor-resume", { method: "POST", body: JSON.stringify(body) }),
  tailorDocument: (body: TailorDocumentRequest) => request<TailorDocumentResponse>("/ai/tailor-document", { method: "POST", body: JSON.stringify(body) }),
  dehumanize: (body: DehumanizeRequest) => request<DehumanizeResponse>("/ai/dehumanize", { method: "POST", body: JSON.stringify(body) }),
  scrapeLive: (body: ScrapeLiveRequest) => request<ScrapeLiveResponse>("/ai/scrape-live", { method: "POST", body: JSON.stringify(body) }),
  submitApplication: (body: SubmitApplicationRequest) => request<SubmitApplicationResponse>("/submit-application", { method: "POST", body: JSON.stringify(body) }),
  dispatchN8n: (body: N8nDispatchRequest) => request<N8nDispatchResponse>("/n8n/dispatch-webhook", { method: "POST", body: JSON.stringify(body) }),
  n8nIngress: (body: N8nIngressRequest) => request<N8nIngressResponse>("/webhooks/n8n", { method: "POST", body: JSON.stringify(body) }),

  // Health
  health: () => request<HealthResponse>("/health"),
  backendHealth: () => request<BackendHealthResponse>("/backend-health"),

  // Locks
  acquireArtifactLock: (entity: string, entityId: string, agentId: string, ttl: number) =>
    request<ArtifactLockResponse>(`/lock/artifact?entity=${entity}&id=${entityId}`, { method: "POST", body: JSON.stringify({ agentId, ttl }) }),
  releaseArtifactLock: (entity: string, entityId: string, lockToken: string, agentId: string) =>
    request<ArtifactLockResponse>(`/lock/artifact/release?entity=${entity}&id=${entityId}`, { method: "POST", body: JSON.stringify({ lockToken, agentId }) }),
  acquireGlobalLock: (agentId: string) => request<ArtifactLockResponse>("/lock/global", { method: "POST", body: JSON.stringify({ agentId }) }),
  releaseGlobalLock: (lockToken: string, agentId: string) => request<ArtifactLockResponse>("/lock/global/release", { method: "POST", body: JSON.stringify({ lockToken, agentId }) }),
  scanStaleLocks: (agentId: string) => request<StaleLockResponse>("/lock/stale", { method: "POST", body: JSON.stringify({ agentId }) }),
};

export type {
  Opportunity,
  ApplicantProfile,
  ApplicationReceipt,
  PipelineStatus,
  OpportunityScope,
  OpportunityCategory,
  OpportunityPlatform,
  TailoredResume,
  TailoredDocument,
  AutomationSettings,
  CronScheduleState,
  PipelineStats,
  ScrapeJobResponse,
  MatchJobsResponse,
  ATSScoreRequest,
  ATSScoreResponse,
  TailorResumeRequest,
  TailorResumeResponse,
  TailorDocumentRequest,
  TailorDocumentResponse,
  DehumanizeRequest,
  DehumanizeResponse,
  ScrapeLiveRequest,
  ScrapeLiveResponse,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
  N8nDispatchRequest,
  N8nDispatchResponse,
  N8nIngressRequest,
  N8nIngressResponse,
  HealthResponse,
  BackendHealthResponse,
  ArtifactLockResponse,
  StaleLockResponse,
  SchedulerStatus,
};