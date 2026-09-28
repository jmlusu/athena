// Single source of truth for Athena automation defaults and neutral
// applicant fallback data shared across Dashboard, AthenaLayout and
// AutomationControls.

import type { AutomationSettings } from './types';
import type { ApplicantProfile } from './aiTypes';

/** Canonical automation settings defaults (4h cycle, canonical n8n webhook). */
export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  autoCreateThreshold: 90,
  flagThresholdMin: 80,
  flagThresholdMax: 89,
  jobScheduleHours: 4,
  consultancyScheduleHours: 4,
  autoCreateResumeCoverLetter: true,
  autoCreateProposalExecSummary: true,
  dehumanizeEnabled: true,
  n8nWebhookUrl: 'https://n8n.athena-ops.internal/webhook/athena-pipeline-trigger',
  n8nActive: false,
  soundAlerts: false,
};

/**
 * Neutral applicant profile used when no user profile exists yet.
 * Deliberately empty: never invents a name, contact details, rates or
 * a signature — forms prompt the applicant to fill those in.
 */
export const FALLBACK_APPLICANT_PROFILE: ApplicantProfile = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  hourly_rate_usd: 0,
  expected_monthly_mwk: 0,
  legal_authorized_signer: '',
  preferences: {
    keywords: [],
    excluded_keywords: [],
    locations: [],
    job_types: [],
    preferred_sources: [],
    remote_only: false,
    visa_sponsorship_required: false,
  },
};
