# Athena — Backend Integration & API Requirements

> **Category**: Backend / Services Integration Reference  
> **Audience**: OpenCode Backend & Data Engineering Teams  
> **Status**: APPROVED & LOCKED  

---

## 1. REST / RPC API Contracts

### A. Live Scraper & Feed Ingress
- **Endpoint**: `POST /api/ai/scrape-live`
- **Request Body**:
  ```json
  {
    "locationFilter": "all" | "lilongwe-local" | "lilongwe-remote" | "international-remote",
    "searchType": "all" | "job" | "consultancy",
    "keywords": "string",
    "resumeSkills": ["string"]
  }
  ```
- **Response Expected**:
  ```json
  {
    "listings": [
      {
        "id": "string",
        "title": "string",
        "company": "string",
        "location": "string",
        "category": "job" | "consultancy",
        "scope": "lilongwe-local" | "lilongwe-remote" | "international-remote",
        "platform": "LinkedIn" | "Upwork" | "ReliefWeb" | "Corporate",
        "description": "string",
        "requirements": ["string"],
        "salaryOrBudget": "string",
        "deadline": "string",
        "atsScore": 94,
        "postedDate": "1 hour ago"
      }
    ],
    "timestamp": "ISO-8601"
  }
  ```

---

### B. ATS Semantic Compatibility Scorer
- **Endpoint**: `POST /api/ai/score-ats`
- **Request Body**:
  ```json
  {
    "jobTitle": "string",
    "company": "string",
    "description": "string",
    "requirements": ["string"],
    "applicantProfile": {},
    "itemType": "job" | "consultancy"
  }
  ```
- **Response Expected**:
  ```json
  {
    "atsScore": 92,
    "matchCategory": "CRITICAL_MATCH" | "FLAGGED_REVIEW" | "STANDARD",
    "matchedSkills": ["string"],
    "missingSkills": ["string"],
    "strengths": ["string"],
    "recommendation": "string",
    "dehumanizedPitch": "string"
  }
  ```

---

### C. Pristine Document & Proposal Tailoring
- **Endpoints**:
  - `POST /api/ai/tailor-resume`
  - `POST /api/ai/tailor-document`
- **Request Parameters**:
  ```json
  {
    "docType": "cover-letter" | "consultancy-proposal" | "executive-summary",
    "job": {},
    "applicantProfile": {},
    "columnLayout": "one-column" | "two-column",
    "dehumanize": true
  }
  ```
- **Requirements**: Must strip generic AI clichés (*"delve"*, *"spearheaded an ecosystem"*, *"testament to"*, *"in today's fast-paced world"*) and return structured JSON suitable for vector print rendering.

---

### D. Application Submission & Verification Receipt
- **Endpoint**: `POST /api/submit-application`
- **Request Body**:
  ```json
  {
    "applicationId": "string",
    "jobTitle": "string",
    "company": "string",
    "applicantName": "string",
    "authorizationSignature": "string (Legal name)",
    "authorizedAt": "ISO-8601"
  }
  ```
- **Response Expected**:
  ```json
  {
    "status": "SUBMITTED",
    "receiptId": "ATH-RCPT-XXXXXX",
    "confirmationHash": "SHA256-...",
    "submittedAt": "ISO-8601",
    "jobTitle": "string",
    "company": "string",
    "applicantName": "string",
    "authorizedBy": "string",
    "authorizedAt": "ISO-8601",
    "nextFollowUpDate": "YYYY-MM-DD"
  }
  ```

---

### E. n8n Inbound Webhook Receiver
- **Endpoint**: `POST /api/webhooks/n8n`
- **Payload**: Standard n8n JSON trigger event (e.g. `cron.4hour_tick`).
- **Response**: HTTP 200 with execution trace and node processing timings.
