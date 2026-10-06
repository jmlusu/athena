# Athena — Navigation & Routing Specification

> **Category**: Navigation & UX Routing  
> **Extraction Source**: `src/App.tsx`, `src/components/layout/LeftSidebar.tsx`  
> **Status**: COMPLETE & VERIFIED  

---

## 1. System Navigation Hierarchy

```text
ATHENA APPLICATION SHELL
│
├── [Left Sidebar] Scope Filter: All | Lilongwe Local | Lilongwe Remote | Intl Remote
├── [Left Sidebar] Category Filter: All | Jobs | Consultancies
│
├── MODULE 1: Pipeline & Command (`pipeline`)
│   ├── Top Filter Bar (Search + Stage Filter Pills)
│   ├── Mountain Dynamics Visualization
│   ├── Metric Counters & Skills Bar Charts
│   └── 6-Stage Kanban Flow
│
├── MODULE 2: Scraper & Discovery (`scraper`)
│   ├── Live Semantic Crawler Trigger
│   ├── Keyword & Platform Filters
│   └── Sourced Opportunities Table
│
├── MODULE 3: Pristine Document Studio (`documents`)
│   ├── Target Opportunity Selector
│   ├── Layout Toggle (1-Column vs 2-Column)
│   ├── Dehumanizer Toggle (Active vs Off)
│   ├── Tabs: Resume | Cover Letter | Consultancy Proposal
│   └── Actions: Copy Markdown | Print / PDF
│
├── MODULE 4: Online Forms & Sign-Off (`form_filler`)
│   ├── Online Application Auto-Fill Fields
│   ├── Screening Question Responses
│   └── Human Sign-Off & Typed Signature Gate
│
├── MODULE 5: Receipts & Follow-ups (`receipts`)
│   ├── Submitted Applications List
│   ├── SHA-256 Verified Receipt Certificate
│   ├── Automated 7-Day Follow-Up Email Generator
│   └── LinkedIn Export Trigger
│
├── MODULE 6: n8n Workflow Nodes (`n8n`)
│   ├── 5-Node Workflow Visualizer
│   ├── Inbound Webhook Payload Tester
│   └── Execution Response Console
│
└── MODULE 7: Applicant Skills & Profile (`profile`)
    ├── Identification & Lilongwe Station
    ├── Rates (USD / MWK)
    ├── Dynamic ATS Keywords Manager
    └── Master Document Knowledge Base Uploads
```

---

## 2. Navigation State Model

Navigation state in Athena is managed through:
- `currentView`: Active module ID (`"pipeline" | "scraper" | "documents" | "form_filler" | "receipts" | "n8n" | "profile"`)
- `selectedScope`: Target scope filter (`"all" | "lilongwe-local" | "lilongwe-remote" | "international-remote"`)
- `selectedCategory`: Category filter (`"all" | "job" | "consultancy"`)
- `selectedOpportunity`: Currently inspected or document-targeted opportunity object
- `signOffOpportunity`: Active opportunity in the human authorization modal

---

## 3. Breadcrumb & Top Bar Behavior

The top application bar is sticky (`sticky top-0 z-30 bg-white/90 backdrop-blur-md`) and displays dynamic breadcrumbs:
- **Brand**: `ATHENA`
- **Chevron**: `>`
- **Active Module**: `Pipeline`, `Scraper`, `Documents`, `Receipts`, etc.
- **Chevron**: `>`
- **Scope Pill**: `Scope: Lilongwe & Global` or `Scope: lilongwe-local`
- **Right Status**: `Lilongwe Gateway: Active` pulsing indicator + Quick Trigger button.
