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
  ScrapeRequestBody,
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
  ProfileDocument,
} from "./types";

const API_BASE = "/api";

// FastAPI's /jobs validator rejects limit > 100 with a 422, so the client pages
// rather than asking for more than the backend will give. JOB_LOAD_CAP is the most
// the dashboard will hold; relax the backend validator before raising it.
const JOB_PAGE_LIMIT = 100;
const JOB_LOAD_CAP = 200;

// FastAPI returns `detail` as a plain string for one-off errors (404, 401) but
// as a list of {loc, msg} records for 422s. Stringifying that list directly
// yields "[object Object],[object Object]" in the error banner -- the exact
// shape a rejected profile save used to show -- so both are rendered by hand.
function formatDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as { loc?: unknown; msg?: unknown };
          const loc = Array.isArray(record.loc) ? record.loc.join(".") : "";
          const msg = typeof record.msg === "string" ? record.msg : "";
          return loc && msg ? `${loc}: ${msg}` : msg || loc;
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join("; ");
  }

  if (detail && typeof detail === "object") {
    const parts = Object.entries(detail as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .filter((part) => !part.endsWith(": undefined"));
    if (parts.length > 0) return parts.join("; ");
  }

  return "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: res.statusText }))) as { detail?: unknown };
    throw new Error(formatDetail(err.detail) || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Jobs. Pages at the backend's own 100-row ceiling up to JOB_LOAD_CAP, so a
  // 138-job store arrives whole without ever requesting limit > 100.
  listJobs: async (params?: { scope?: string; category?: string }) => {
    const collected: Opportunity[] = [];
    let total = 0;

    for (let offset = 0; collected.length < JOB_LOAD_CAP; offset += JOB_PAGE_LIMIT) {
      const query = new URLSearchParams({
        limit: String(JOB_PAGE_LIMIT),
        offset: String(offset),
        ...(params?.scope ? { scope: params.scope } : {}),
        ...(params?.category ? { category: params.category } : {}),
      });
      const page = await request<{ jobs: Opportunity[]; total: number }>(
        `/v1/athena/jobs?${query.toString()}`
      );
      const jobs = page.jobs ?? [];
      total = page.total ?? 0;
      collected.push(...jobs);
      // A short page means the store is exhausted; so does total <= offset + jobs.
      if (jobs.length < JOB_PAGE_LIMIT) break;
    }

    return { jobs: collected.slice(0, JOB_LOAD_CAP), total };
  },

  getJob: (id: string) => request<Opportunity>(`/v1/athena/jobs/${id}`),
  createJob: (job: Partial<Opportunity>) => request<Opportunity>("/v1/athena/jobs", { method: "POST", body: JSON.stringify(job) }),

  // Profiles
  listProfiles: () => request<ApplicantProfile[]>("/v1/athena/profiles"),
  getProfile: (id: string) => request<ApplicantProfile>(`/v1/athena/profiles/${id}`),
  createProfile: (profile: Partial<ApplicantProfile>) => request<ApplicantProfile>("/v1/athena/profiles", { method: "POST", body: JSON.stringify(profile) }),
  updateProfile: (id: string, profile: Partial<ApplicantProfile>) => request<ApplicantProfile>(`/v1/athena/profiles/${id}`, { method: "PUT", body: JSON.stringify(profile) }),

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
  // The real scraper. Writes unscored jobs and returns a ScrapeJob record -- it
  // does not return jobs, so callers must POST /process afterwards to score them
  // and then reload. See api.processJobs.
  triggerScrape: (body: ScrapeRequestBody) =>
    request<ScrapeJobResponse>("/v1/athena/scrape", { method: "POST", body: JSON.stringify(body) }),
  processJobs: () => request<{ status: string; totalJobs: number; scored: number }>("/v1/athena/process", { method: "POST", body: "{}" }),
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

  // Profile Documents
  listProfileDocuments: () => request<ProfileDocument[]>("/profile-documents"),
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
  ScrapeRequestBody,
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