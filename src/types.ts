export type OpportunityScope = "lilongwe-local" | "lilongwe-remote" | "international-remote";
export type OpportunityCategory = "job" | "consultancy";
export type OpportunityPlatform = "LinkedIn" | "Upwork" | "ReliefWeb" | "Corporate" | "Devex" | "MyJobo";
export type PipelineStatus = 
  | "discovered"
  | "evaluated"
  | "tailored"
  | "awaiting_signoff"
  | "submitted"
  | "interview"
  | "offer";

export interface ApplicationReceipt {
  receiptId: string;
  confirmationHash: string;
  submittedAt: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  authorizedBy: string;
  authorizedAt: string;
  portalName: string;
  followUpDate: string;
  status: "SUBMITTED" | "ACKNOWLEDGED" | "INTERVIEW_INVITE" | "OFFER_EXTENDED";
  notes?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  category: OpportunityCategory;
  scope: OpportunityScope;
  platform: OpportunityPlatform;
  description: string;
  requirements: string[];
  salaryOrBudget: string;
  deadline: string;
  atsScore: number;
  postedDate: string;
  status: PipelineStatus;
  isFlagged: boolean;
  matchedSkills?: string[];
  missingSkills?: string[];
  dehumanizedPitch?: string;
  autoCreatedDocs?: {
    hasResume?: boolean;
    hasCoverLetter?: boolean;
    hasExecutiveSummary?: boolean;
    hasProposal?: boolean;
  };
  tailoredResume?: TailoredResume;
  tailoredCoverLetter?: TailoredDocument;
  tailoredProposal?: TailoredDocument;
  receipt?: ApplicationReceipt;
  formFields?: Record<string, string>;
}

export interface ApplicantProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    location: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  hourlyRateUsd: number;
  expectedMonthlyMwk: number;
  legalAuthorizedSigner: string;
}

export interface TailoredResume {
  fullName: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    location: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  layout: "one-column" | "two-column";
}

export interface TailoredDocument {
  docType: "cover-letter" | "executive-summary" | "consultancy-proposal";
  title: string;
  recipient: string;
  date: string;
  greeting?: string;
  executiveSummary?: string;
  paragraphs?: string[];
  sections?: {
    heading: string;
    body: string;
  }[];
  closing?: string;
  signature?: string;
  layout: "one-column" | "two-column";
  dehumanized: boolean;
}

export interface AutomationSettings {
  autoCreateThreshold: number; // >=90
  flagThresholdMin: number;    // 80
  flagThresholdMax: number;    // 89
  jobScheduleHours: number;    // 4
  consultancyScheduleHours: number; // 4
  autoCreateResumeCoverLetter: boolean;
  autoCreateProposalExecSummary: boolean;
  dehumanizeEnabled: boolean;
  n8nWebhookUrl: string;
  n8nActive: boolean;
  soundAlerts: boolean;
}

export interface CronScheduleState {
  lastJobRun: string;
  nextJobRun: string;
  jobSecondsRemaining: number;
  lastConsultancyRun: string;
  nextConsultancyRun: string;
  consultancySecondsRemaining: number;
  isSchedulerActive: boolean;
  totalAutomationsToday: number;
}

export interface PipelineStats {
  totalJobs: number;
  newJobs: number;
  evaluatedJobs: number;
  tailoredJobs: number;
  awaitingSignoffJobs: number;
  submittedJobs: number;
  interviewJobs: number;
  offerJobs: number;
  avgAtsScore: number;
  topSkills: { skill: string; count: number }[];
  funnel: { stage: string; count: number }[];
}

export interface ScrapeJobResponse {
  jobId: string;
  status: string;
  jobsFound: number;
  jobsNew: number;
}

export interface MatchJobsResponse {
  matches: number;
  details: { jobId: string; profileId: string; score: number }[];
}

export interface ATSScoreRequest {
  job: Record<string, unknown>;
  applicantProfile: Record<string, unknown>;
}

export interface ATSScoreResponse {
  score: number;
  breakdown: { category: string; score: number; weight: number }[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface TailorResumeRequest {
  job: Record<string, unknown>;
  applicantProfile: Record<string, unknown>;
  columnLayout: "one-column" | "two-column";
  dehumanize: boolean;
}

export interface TailorResumeResponse {
  tailoredResume: TailoredResume;
}

export interface TailorDocumentRequest {
  docType: "cover-letter" | "executive-summary" | "consultancy-proposal";
  job: Record<string, unknown>;
  applicantProfile: Record<string, unknown>;
  columnLayout: "one-column" | "two-column";
  dehumanize: boolean;
}

export interface TailorDocumentResponse {
  document: TailoredDocument;
}

export interface DehumanizeRequest {
  text: string;
  context?: string;
}

export interface DehumanizeResponse {
  humanizedText: string;
  flaggedWordsRemoved: string[];
  confidenceScore: number;
}

export interface ScrapeLiveRequest {
  locationFilter: "lilongwe-local" | "lilongwe-remote" | "international-remote" | "all";
  searchType: "jobs" | "consultancies" | "all";
  keywords?: string;
  resumeSkills: string[];
}

export interface ScrapeLiveResponse {
  listings: ScrapeLiveListing[];
  timestamp: string;
}

export interface ScrapeLiveListing {
  id: string;
  title: string;
  company: string;
  location: string;
  category: "job" | "consultancy";
  scope: "lilongwe-local" | "lilongwe-remote" | "international-remote";
  platform: "LinkedIn" | "Upwork" | "ReliefWeb" | "Corporate" | "Devex" | "MyJobo";
  description: string;
  requirements: string[];
  salaryOrBudget: string;
  deadline: string;
  atsScore: number;
  postedDate: string;
}

export interface SubmitApplicationRequest {
  applicationId: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  authorizationSignature: string;
  authorizedAt: string;
}

export interface SubmitApplicationResponse {
  status: "SUBMITTED";
  receiptId: string;
  confirmationHash: string;
  submittedAt: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  authorizedBy: string;
  authorizedAt: string;
  nextFollowUpDate: string;
}

export interface N8nDispatchRequest {
  eventType?: string;
  payload: Record<string, unknown>;
  webhookUrl?: string;
}

export interface N8nNodeProcessed {
  node: string;
  status: string;
  timeMs: number;
}

export interface N8nReceipt {
  itemsHandled: number;
  targetAction: string;
}

export interface N8nDispatchResponse {
  status: string;
  executionId: string;
  timestamp: string;
  webhookUrl: string;
  event: string;
  nodesProcessed: N8nNodeProcessed[];
  receipt: N8nReceipt;
}

export interface N8nIngressRequest {
  event: string;
  targetLocations: string[];
  categories: string[];
  minimumAtsAutoApply: number;
  applicantId?: string;
}

export interface N8nIngressResponse {
  status: "ACCEPTED" | "REJECTED";
  executionId: string;
  message: string;
  triggeredActions: string[];
}

export interface HealthResponse {
  status: string;
  backend: string;
  hasBackendKey: boolean;
  timestamp: string;
}

export interface BackendHealthResponse {
  backend: string;
  reachable: boolean;
  detail?: unknown;
  error?: string;
}

export interface ArtifactLockResponse {
  success: boolean;
  lockToken?: string;
  lockPath?: string;
  message?: string;
  error?: string;
}

export interface StaleLockResponse {
  success: boolean;
  released: number;
  error?: string;
}

export interface SchedulerStatus {
  running: boolean;
  nextRun?: string;
  lastRun?: string;
}
