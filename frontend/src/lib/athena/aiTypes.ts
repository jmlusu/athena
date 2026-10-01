/** TypeScript types for AI Studio integration - mirror of backend ai_schemas.py */

// ATS Scoring
export interface ATSScoreRequest {
  job_title: string;
  company: string;
  description: string;
  requirements: string[];
  applicant_profile: Record<string, unknown>;
  item_type: 'job' | 'consultancy';
}

export interface ATSScoreResponse {
  ats_score: number;
  match_category: 'CRITICAL_MATCH' | 'FLAGGED_REVIEW' | 'STANDARD';
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendation: string;
  dehumanized_pitch: string;
}

// Resume Tailoring
export type ColumnLayout = 'one-column' | 'two-column';

export interface TailorResumeRequest {
  job: Record<string, unknown>;
  applicant_profile: Record<string, unknown>;
  column_layout: ColumnLayout;
  dehumanize: boolean;
}

export interface TailoredResumeContact {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

export interface TailoredResumeExperience {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface TailoredResumeEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface TailoredResume {
  full_name: string;
  title: string;
  contact: TailoredResumeContact;
  summary: string;
  skills: string[];
  experience: TailoredResumeExperience[];
  education: TailoredResumeEducation[];
  certifications: string[];
  layout: ColumnLayout;
}

export interface TailorResumeResponse {
  tailored_resume: TailoredResume;
}

// Document Tailoring (Cover Letter, Proposal, Executive Summary)
export type DocType = 'cover-letter' | 'executive-summary' | 'consultancy-proposal';

export interface TailorDocumentRequest {
  doc_type: DocType;
  job: Record<string, unknown>;
  applicant_profile: Record<string, unknown>;
  column_layout: ColumnLayout;
  dehumanize: boolean;
}

export interface TailoredDocumentSection {
  heading: string;
  body: string;
}

export interface TailoredDocument {
  title: string;
  recipient: string;
  date: string;
  greeting?: string;
  executive_summary?: string;
  paragraphs?: string[];
  sections?: TailoredDocumentSection[];
  closing?: string;
  signature?: string;
  layout: ColumnLayout;
  dehumanized: boolean;
}

export interface TailorDocumentResponse {
  document: TailoredDocument;
}

// Dehumanizer
export interface DehumanizeRequest {
  text: string;
  context?: string;
}

export interface DehumanizeResponse {
  humanized_text: string;
  flagged_words_removed: string[];
  confidence_score: number;
}

// Live Scraping
export type LocationFilter = 'lilongwe-local' | 'lilongwe-remote' | 'international-remote' | 'all';
export type SearchType = 'jobs' | 'consultancies' | 'all';
export type Platform = 'LinkedIn' | 'Upwork' | 'ReliefWeb' | 'Corporate' | 'Devex' | 'MyJobo';

export interface ScrapeLiveRequest {
  location_filter: LocationFilter;
  search_type: SearchType;
  keywords?: string;
  resume_skills: string[];
}

export interface ScrapeLiveListing {
  id: string;
  title: string;
  company: string;
  location: string;
  category: 'job' | 'consultancy';
  scope: LocationFilter;
  platform: Platform;
  description: string;
  requirements: string[];
  salary_or_budget: string;
  deadline: string;
  ats_score: number;
  posted_date: string;
}

export interface ScrapeLiveResponse {
  listings: ScrapeLiveListing[];
  timestamp: string;
}

// n8n Integration
export interface N8nDispatchRequest {
  event_type?: string;
  payload: Record<string, unknown>;
  webhook_url?: string;
}

export interface N8nNodeProcessed {
  node: string;
  status: string;
  time_ms: number;
}

export interface N8nReceipt {
  items_handled: number;
  target_action: string;
}

export interface N8nDispatchResponse {
  status: string;
  execution_id: string;
  timestamp: string;
  webhook_url: string;
  event: string;
  nodes_processed: N8nNodeProcessed[];
  receipt: N8nReceipt;
}

// Application Submission
export interface SubmitApplicationRequest {
  application_id: string;
  job_title: string;
  company: string;
  applicant_name: string;
  authorization_signature: string;
  authorized_at?: string;
}

export interface SubmitApplicationResponse {
  status: 'SUBMITTED';
  receipt_id: string;
  confirmation_hash: string;
  submitted_at: string;
  job_title: string;
  company: string;
  applicant_name: string;
  authorized_by: string;
  authorized_at: string;
  next_follow_up_date: string;
}

// AI Health
export interface AIHealthResponse {
  status: string;
  provider: string;
  has_api_key: boolean;
  timestamp: string;
}

// AI Studio Pipeline Status (for reference)
export type PipelineStatus =
  | 'discovered'
  | 'evaluated'
  | 'tailored'
  | 'awaiting_signoff'
  | 'submitted'
  | 'interview'
  | 'offer';

// AI Studio Opportunity Scope
export type OpportunityScope = 'lilongwe-local' | 'lilongwe-remote' | 'international-remote';

// AI Studio Opportunity Category
export type OpportunityCategory = 'job' | 'consultancy';

// AI Studio Application Receipt
export interface ApplicationReceipt {
  receipt_id: string;
  confirmation_hash: string;
  submitted_at: string;
  job_title: string;
  company: string;
  applicant_name: string;
  authorized_by: string;
  authorized_at: string;
  portal_name: string;
  follow_up_date: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'INTERVIEW_INVITE' | 'OFFER_EXTENDED';
  notes?: string;
}

// AI Studio Applicant Profile
export interface JobPreferences {
  keywords: string[];
  excluded_keywords: string[];
  locations: string[];
  job_types: string[];
  min_salary?: number;
  preferred_sources: string[];
  remote_only: boolean;
  visa_sponsorship_required: boolean;
}

export interface ApplicantProfile {
  full_name: string;
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
  hourly_rate_usd: number;
  expected_monthly_mwk: number;
  legal_authorized_signer: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  preferences: JobPreferences;
}