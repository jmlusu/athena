# Athena — Screen Inventory & Layout Specification

> **Category**: UI / UX Reference  
> **Extraction Source**: `src/App.tsx`, `src/components/views/*`, `src/components/modals/*`  
> **Total Core Views**: 7  
> **Total Modals / Overlays**: 3  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Master Screen & Modal Directory

| ID | Screen Name | View Identifier (`NavView`) | Route Equivalent | Primary Responsibility |
|---|---|---|---|---|
| **SCR-01** | **Pipeline & Command** | `pipeline` | `/` or `/pipeline` | Multi-stream mountain momentum chart, numerical metric cards, skills bar chart, 6-stage Kanban board |
| **SCR-02** | **Scraper & Discovery** | `scraper` | `/scraper` | Live aggregator crawler, 3 target scope pill selectors, platform filters, ATS match listings table |
| **SCR-03** | **Pristine Document Studio**| `documents` | `/documents` | 1-col vs 2-col resume preview, cover letter, consultancy proposal, dehumanizer toggle, PDF print export |
| **SCR-04** | **Online Forms & Sign-Off** | `form_filler` | `/forms` | Online portal fields auto-fill manifest, screening responses, human power-of-attorney sign-off gate |
| **SCR-05** | **Receipts & Follow-ups** | `receipts` | `/receipts` | Cryptographic SHA-256 submission certificates, 7-day follow-up outreach email draft, LinkedIn export |
| **SCR-06** | **n8n Workflow Nodes** | `n8n` | `/n8n` | 5-node visual pipeline topology, inbound webhook tester (`POST /api/webhooks/n8n`), payload inspector |
| **SCR-07** | **Applicant Skills & Profile**| `profile` | `/profile` | Candidate dossier, rates (USD / MWK), dynamic ATS skills keywords, uploaded background CV/portfolio files |
| **MOD-01** | **Opportunity Detail Modal**| *Modal Trigger* | N/A | Full job TOR, ATS score radial dial, dehumanized elevator pitch, TOR requirements grid, action triggers |
| **MOD-02** | **LinkedIn Export Modal** | *Modal Trigger* | N/A | Easy Apply cover note, screening responses, profile experience entry mapping, JSON & Markdown export |
| **MOD-03** | **Human Sign-Off Modal** | *Modal Trigger* | N/A | Dedicated interactive power-of-attorney sign-off dialog before form dispatch |

---

## 2. Detailed View Specifications

### Screen 01: Pipeline & Command (`pipeline`)
- **Layout**: 3-column chassis layout (Left Sidebar + Fluid Center + Right Sidebar).
- **Major Components**:
  1. `LayeredMountainChart`: Multi-layer mountain topography displaying momentum across Global Remote, Lilongwe Hub, and Consultancies over 4-hour intervals with hover telemetry tooltip.
  2. `MetricsAndBarChart`: 5 numerical metric cards (Discovered, ATS $\ge 90\%$, ATS 80-89 Flagged, Human Sign-Off, Submitted) + 5-bar Skills Compatibility chart + SVG Funnel line graph with data point markers.
  3. `PipelineView`: Search filter input, stage pills, and a 6-stage Kanban board (`1. Discovered`, `2. ATS Evaluated`, `3. Tailored / Ready`, `4. Awaiting Sign-Off`, `5. Submitted`, `6. Interview & Award`).
- **Primary Actions**: Click on cards to view details, inspect tailored documents, execute human sign-off, or view receipt proof.

---

### Screen 02: Scraper & Discovery (`scraper`)
- **Layout**: Search query input, keyword bar, platform tags (`All`, `LinkedIn`, `Upwork`, `ReliefWeb`, `Corporate`), 4 scope selector cards (`All 3 Scopes`, `Lilongwe Local`, `Lilongwe Remote`, `Intl Remote`).
- **Live Action**: "Run Live Semantic Scrape" button triggers crawler simulation/endpoint, updates listings, and displays emerald alert banner.
- **Listings Table**: Lists opportunities with category badges, platform tags, relative timestamp, organization, compensation, requirements badges, circular score gauge, and direct action triggers.

---

### Screen 03: Pristine Document Studio (`documents`)
- **Control Bar**: Target opportunity selector dropdown, 1-Column vs 2-Column layout toggle, Dehumanizer toggle button, Gemini re-generation trigger, Copy Markdown button, Print / PDF export button.
- **Document Tabs**:
  1. **Pristine Tailored Resume**: Contact banner, executive profile, 2-column or 1-column layout, competencies, certifications, selected engagements with bulleted deliverables.
  2. **Tailored Cover Letter**: Executive letterhead, date, recipient, subject line, greeting, 3 structured paragraphs, and sign-off.
  3. **Consultancy Proposal & Executive Summary**: Red-themed confidential advisory proposal with executive summary highlight box, 4 technical methodology sections, and signatory seal.
- **Print Optimization**: Includes `@media print` CSS removing all chrome for clean 100% white paper vector printing.

---

### Screen 04: Online Forms & Sign-Off (`form_filler`)
- **Form Structure**:
  1. Candidate identity & contact (auto-filled).
  2. Online screening text fields (2 prompt textareas formatted with dehumanized voice).
  3. Manifest of attached tailored documents.
  4. Mandatory Human Sign-Off section with red border, required authorization checkbox, and typed legal signature input.
- **Validation**: Cannot submit unless authorization checkbox is checked and typed signature is non-empty.

---

### Screen 05: Receipts & Follow-ups (`receipts`)
- **Structure**:
  - Left column: List of verified submission receipts with status badges (`SUBMITTED`), confirmation hashes, and timestamps.
  - Right column: Official certificate card featuring receipt ID, company, date, digital signature verification, SHA-256 audit token, and 7-day follow-up outreach generator with email draft and "Export to LinkedIn" button.

---

### Screen 06: n8n Workflow Nodes (`n8n`)
- **Visual Canvas**: Dark `#18181B` background showing 5 sequential workflow nodes (`1. Cron 4h`, `2. Scraper Node`, `3. Gemini ATS Evaluator`, `4. Switch Gate`, `5. Human Sign-Off Gate`).
- **Interactive Tester**: Left column JSON payload editor + "Fire n8n Webhook Trigger" button; right column live JSON response terminal.

---

### Screen 07: Applicant Skills & Profile (`profile`)
- **Structure**:
  - Left 2 columns: Identification & contact fields, compensation rates (Hourly USD / Monthly MWK), dynamic ATS skills keyword badge list with add/remove tags.
  - Right column: File upload dropzone with list of uploaded master resumes, case studies, past contracts, and digital power-of-attorney advisory.

---

## 3. Modal Specifications

### Modal 01: Opportunity Detail Modal (`OpportunityDetailModal`)
- **Trigger**: Clicking any job/consultancy card or "Details" button.
- **Header**: Category pill, platform badge, posted timestamp, job title, company, location, and compensation.
- **Body**: Circular ATS score gauge card, dehumanized elevator pitch callout, full terms of reference description, required qualifications grid.
- **Footer**: Close button, "Export to LinkedIn" button, "Inspect Tailored Documents" button, and "Authorize & Submit" button.

### Modal 02: LinkedIn Export Modal (`LinkedInExportModal`)
- **Trigger**: "Export to LinkedIn" button in `OpportunityDetailModal` or `ReceiptsView`.
- **Tabs**:
  1. **LinkedIn Easy Apply Draft**: Recommended headline, dehumanized candidate pitch, extracted ATS skills tags with comma/hashtag copy buttons, full formatted cover note preview.
  2. **Profile Experience Entry**: Form field mappings (Title, Company, Employment Type, Location Type) and formatted experience description box with copy buttons.
  3. **JSON / Developer Export**: Raw JSON payload with SHA-256 hash and screening answers.
- **Footer Actions**: Download `.md` markdown file, download `.json` file, "Open LinkedIn Jobs" external link, "Done" close button.
