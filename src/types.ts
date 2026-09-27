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
