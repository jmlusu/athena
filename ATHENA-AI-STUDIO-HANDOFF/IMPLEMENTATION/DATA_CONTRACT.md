# Athena — Data Contract & Schema Specification

> **Category**: Data Entities & Type Contracts  
> **Extraction Source**: `src/types.ts`  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Core Enumerations

```typescript
export type OpportunityScope =
  | "lilongwe-local"        // Physical on-site / Capital Hill / City Centre
  | "lilongwe-remote"       // Malawi resident 100% remote
  | "international-remote"; // Global remote contract

export type OpportunityCategory =
  | "job"                   // Permanent / Full-time position
  | "consultancy";          // Deliverable-based milestone mandate

export type PipelineStatus =
  | "discovered"            // Newly crawled & queued
  | "evaluated"             // Scored by ATS Semantic Engine
  | "tailored"              // Tailored documents generated (>=90%)
  | "awaiting_signoff"      // Pending applicant power-of-attorney sign-off
  | "submitted"             // Dispatched with SHA-256 confirmation receipt
  | "interview";            // Callback / Oral interview / Award phase
```

---

## 2. Entity Schemas

### A. `Opportunity`
```typescript
export interface Opportunity {
  id: string;                                // e.g. "job-mw-101"
  title: string;                             // e.g. "Senior Digital Systems Specialist"
  company: string;                           // e.g. "USAID Malawi / Global Health"
  location: string;                          // e.g. "Lilongwe, Malawi (City Centre)"
  category: OpportunityCategory;             // "job" | "consultancy"
  scope: OpportunityScope;                   // "lilongwe-local" | "lilongwe-remote" | "international-remote"
  platform: "LinkedIn" | "Upwork" | "ReliefWeb" | "Devex" | "Corporate";
  description: string;                       // Full Terms of Reference text
  requirements: string[];                    // Array of 4-8 required skills/criteria
  salaryOrBudget: string;                    // e.g. "$38,000 - $48,000 USD / yr" or "MWK 3.2M / mo"
  deadline: string;                          // ISO date or relative
  atsScore: number;                          // 0 - 100
  postedDate: string;                        // e.g. "1 hour ago"
  status: PipelineStatus;
  isFlagged?: boolean;                       // true if ATS 80-89%
  dehumanizedPitch?: string;                 // Clean non-AI 2-sentence value pitch
  autoCreatedDocs?: {
    hasResume: boolean;
    hasCoverLetter?: boolean;
    hasProposal?: boolean;
    hasExecutiveSummary?: boolean;
  };
  tailoredResume?: TailoredResume;
  tailoredCoverLetter?: TailoredDocument;
  tailoredProposal?: TailoredDocument;
  receipt?: ApplicationReceipt;
}
```

### B. `TailoredResume`
```typescript
export interface TailoredResume {
  fullName: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
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
```

### C. `ApplicationReceipt`
```typescript
export interface ApplicationReceipt {
  receiptId: string;                         // e.g. "ATH-RCPT-849201"
  confirmationHash: string;                  // SHA-256 verification hash
  submittedAt: string;                       // ISO 8601 string
  jobTitle: string;
  company: string;
  applicantName: string;
  authorizedBy: string;                      // Typed digital signature name
  authorizedAt: string;
  portalName: string;                        // Platform portal name
  followUpDate: string;                      // 7 days after submission
  status: "SUBMITTED";
  notes?: string;
}
```

### D. `ApplicantProfile`
```typescript
export interface ApplicantProfile {
  id: string;
  fullName: string;                          // e.g. "Chifuniro Phiri"
  headline: string;
  email: string;
  phone: string;
  location: string;                          // e.g. "Area 10, Lilongwe, Malawi"
  hourlyRateUsd: number;                     // e.g. 65
  expectedMonthlyMwk: number;                // e.g. 3500000
  legalAuthorizedSigner: string;             // Legal signatory name
  skills: string[];
  experience: any[];
  education: any[];
  certifications: string[];
}
```
