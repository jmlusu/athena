# Athena PRS → Code Traceability Matrix (v1.0)

| Field | Value |
|---|---|
| **Source Specification** | Athena Platform Requirements Specification (PRS) v2.4.0 — APPROVED & MANDATORY |
| **Classification** | Autonomous AI Job and Consultation Services Search, ATS Evaluation, Document Tailoring & Application Dispatching Platform |
| **Codebase** | `C:\Users\jmlus\athena` — branch `feat/athena-ai-studio-migration` (head `b814f9e`) |
| **Matrix Scope** | Full PRS requirement set mapped to code locations, with status and verification evidence |
| **Last Updated** | Session of 2026-09-28 |

## Status Legend

| Status | Meaning |
|---|---|
| ✅ **Verified** | Working and confirmed this session (Playwright screenshot, computed-style check, lint, or build) |
| 🟡 **Implemented (unverified)** | Code exists in the mapped location; not exercised/confirmed this session |
| 🟠 **Partial** | Endpoint/component exists but a required piece (UI wiring, fallback, config) is missing |
| 🔴 **Known Defect** | Broken — runtime error, TS error, or crash blocks the requirement |
| ⬜ **Pending** | Not found in codebase / not yet built |

---

## A. Functional Requirements — FR-SRC / FR-CRN (Sourcing, Ingress & Scheduler)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-SRC-001 | Multi-Platform Aggregation (LinkedIn, Upwork, ReliefWeb, Devex, Corporate portals, Ntchito.com, jobsearchmalawi.com, careersmw.com, careeradmw.com, International Development & Humanitarian Portals, developmentaid.org, unjobs.org, UNDP/UNICEF/WFP/FAO/UNFPA, Indeed, Glassdoor, Freelance/Remote/On-Demand Networks, Financial Institutions, International NGOs — CHAI, Last Mile Health, Partners In Health, World Vision, CARE, Save the Children, Statutory Bodies, Commissions) | `server.ts` → `POST /api/ai/scrape-live`; `frontend/src/lib/athena/api.ts` (`scrapeLive`, `scrapeHistory`); `frontend/src/pages/athena/N8nIntegration.tsx` | 🟡 | Endpoint + client wired; source list coverage not audited against FR-SRC-001 enumeration |
| FR-SRC-002 | 3-Scope Ingress Classification (`lilongwe-local` \| `lilongwe-remote` \| `international-remote`) | `server.ts` (`locationFilter` in `/api/ai/scrape-live`, comment at `server.ts:804`); `frontend/src/components/athena/AthenaLayout.tsx` (TARGET SCOPES selector) | 🟡 | Scope selector visible in UI screenshot; classification logic not exercised |
| FR-SRC-003 | Category Segmentation (`job` \| `consultancy`) | `frontend/src/pages/athena/JobList.tsx` (`isConsultancy`, `badge-consultancy`/`badge-job`); `JobDetail.tsx` | 🔴 | Segment badges exist, but `JobList` crashes: `job.category.toUpperCase()` on undefined (documented pre-existing defect) |
| FR-SRC-004 | De-duplication & Idempotency | `backend/src/athena/store.py` (96-line change, uncommitted) | 🟠 | Backend store work in progress; not verified |
| FR-CRN-001 | Autonomous 4-hour Cron Cycle (14,400 s) | PRS RTM claims `App.tsx (setInterval)` + LeftSidebar countdown | ⬜ | Not located in code this session — **audit required** |
| FR-CRN-002 | Manual Cycle Override (“Execute 4h Cycle Now”) | Not found | ⬜ | Pending |

---

## B. Functional Requirements — FR-ATS (Semantic ATS Scoring)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-ATS-001 | Score 0–100 vs active profile | `server.ts` → `POST /api/ai/score-ats`; `frontend/src/lib/athena/api.ts` (`scoreATS`, `scoreJob`); `MiniATSGauge` component in `JobCard.tsx:84` | 🟠 | Endpoint exists (server fallback added for Gemini 503); gauge only renders when score data present |
| FR-ATS-002 | Tier routing: Critical ≥90 (auto-tailor), Flagged 80–89 (orange badge + review queue), Standard <80 (gap analysis only) | `JobCard.tsx:24-25,211` (`atsTier` → `badge-critical`/`badge-flagged`/`badge-muted`); `JobList.tsx` tier badges | 🟡 | Tier computation + badges implemented; **auto-tailor trigger for Critical not located** |
| FR-ATS-003 | Factor analysis: matched skills, gap skills, strengths, recommendation, 2-sentence dehumanized pitch | `server.ts` `/api/ai/score-ats` response contract; `frontend/src/lib/athena/api.ts` `AIATSScoreResponse` | 🟠 | Response shape exists; output fields not verified against live response |

---

## C. Functional Requirements — FR-DOC (Pristine Document Studio)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-DOC-001 | Bespoke resume tailoring (ATS ≥90) | `server.ts` → `POST /api/ai/tailor-resume`; `api.ts` `tailorResume` | 🟡 | Endpoint + client exist; no UI button located in JobDetail |
| FR-DOC-002 | 1-Column vs 2-Column dynamic layout toggle | `frontend/src/pages/athena/DocumentStudio.tsx` | 🔴 | Toggle component present but file has **5 pre-existing TS1005/TS1128 parse errors** (lines 307–310, 756) |
| FR-DOC-003 | Tailored cover letters (letterhead, 3 paragraphs, sign-off) | `server.ts` → `POST /api/ai/tailor-document`; `api.ts` `tailorDocument` | 🟠 | Endpoint exists; `DocumentEditor.tsx` renders output (hotkey label fixed to `text-white` this session) |
| FR-DOC-004 | 4-section consultancy proposal (Context / Approach+WBS / Deliverables+Acceptance / Milestone rates USD/MWK) | `server.ts` → `POST /api/ai/tailor-document` (doc type) | 🟠 | Doc-type parameter exists; 4-section structure not verified |
| FR-DOC-005 | Dehumanizer Engine + UI toggle | `server.ts` → `POST /api/ai/dehumanize` (**TS out-of-scope `text` bug fixed this session**, fallback rule-based now uses `parsed.text`); UI toggle ⬜ | 🟠 | Server fixed & compiles; **UI on/off toggle with instant feedback not located** |
| FR-DOC-006 | Vector print / PDF export (`@media print`) | `frontend/src/index.css` (print rules); `DocumentStudio.tsx` `no-print` classes | 🟡 | CSS present; browser print simulation not run this session |
| FR-DOC-007 | One-click Markdown export | Not located | ⬜ | Pending |

---

## D. Functional Requirements — FR-SIG (Form Filler & Human Sign-Off Gate)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-SIG-001 | Automated form field mapping (contact, Lilongwe residency, work authorization, comp, screening prompts) | `frontend/src/pages/athena/FormFillerModal.tsx` (inputs lines 195–278) | 🟡 | Field inputs implemented |
| FR-SIG-002 | Never submit without interactive human sign-off | `FormFillerModal.tsx`, `SignOffModal.tsx` | 🟡 | Gate logic present in modals |
| FR-SIG-003 | Power-of-Attorney: authorization checkbox + typed legal name | `SignOffModal.tsx:116-126` (typed signature input, `Audit Token: SHA256-SIGN-…`), authorization checkbox | 🟡 | Signature input + audit token visible in code |
| FR-SIG-004 | Validation lockout — submit disabled until checkbox + signature | `SignOffModal.tsx` disable logic | 🟠 | Not exercised this session (no interactive test run) |
| FR-SIG-00X (visual) | Sign-off surfaces readable on dark chrome | `RouteError.tsx:36` Retry button → `bg-signoff-red text-white`; `Settings.tsx:110` input → `text-white placeholder:text-white/50` | ✅ | **Verified this session** — Retry computed style `rgb(255,255,255)` on `rgb(220,38,38)` |

---

## E. Functional Requirements — FR-RCP (Receipts & Follow-Up)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-RCP-001 | SHA-256 audit certificate (ID, hash, ISO-8601, names, org, status) | `server.ts` → `POST /api/submit-application`; `ApplicationReceipt` contract in `api.ts` | 🟡 | Endpoint + contract exist; generation not exercised |
| FR-RCP-002 | 7-day follow-up tracker + one-click email draft | `frontend/src/pages/athena/` receipts route (App.tsx `ReceiptsRoute`) | 🟠 | Route exists; follow-up compute/draft not verified |
| FR-RCP-003 | Dedicated Receipts view | `App.tsx:268-269` (`receipts`, `receipts/:id`) | 🟡 | Route registered |

---

## F. Functional Requirements — FR-LNK (LinkedIn Integration)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-LNK-001 | “Export to LinkedIn” from OpportunityDetailModal & ReceiptsView | `frontend/src/pages/athena/LinkedInExportModal.tsx` (commit `ab844d2` “feat: add LinkedIn export functionality”) | 🟠 | Modal implemented; **not verified from ReceiptsView** |
| FR-LNK-002 | Easy Apply draft: headline, dehumanized pitch, skills, cover note | `LinkedInExportModal.tsx:249-293` (inputs + payload editor) | 🟡 | Formatting inputs present |
| FR-LNK-003 | Profile Experience section mapping | `LinkedInExportModal.tsx` | 🟠 | Fields present; mapping not tested |
| FR-LNK-004 | `.json` + `.md` downloads | `LinkedInExportModal.tsx` | 🟠 | Download generation not exercised this session |
| FR-LNK-005 | External LinkedIn Jobs linkout | `LinkedInExportModal.tsx` | 🟠 | Not exercised |

---

## G. Functional Requirements — FR-N8N (Workflow Automation)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-N8N-001 | 5-node topology display (Cron → Scraper → Gemini ATS → Score Switch → Sign-Off) | `frontend/src/pages/athena/N8nIntegration.tsx` (topology UI) | 🟡 | Page renders; topology visuals present |
| FR-N8N-002 | Inbound webhook `POST /api/webhooks/n8n` | `server.ts` (`N8nIntegration.tsx:21` points to `localhost:3000/api/webhooks/n8n`) | 🟠 | Client URL confirmed; **server route not re-verified this session** |
| FR-N8N-003 | Interactive webhook dispatch tester (edit JSON, send, inspect receipt) | `N8nIntegration.tsx:167-199` (`payload-editor`, `execute-webhook-btn`, `execution-response`) | ✅ (visual) | Execution `<pre>` **verified white text** on dark: `rgb(255,255,255)` on `rgb(24,24,27)` |

---

## H. Functional Requirements — FR-PRF (Applicant Profile & ATS Keywords)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-PRF-001 | Dossier: name, headline, email, phone +265, location, hourly USD, monthly MWK, legal signer | `frontend/src/pages/athena/ApplicantProfile.tsx` (inputs 116–662); `api.ts` `ApplicantProfile` contract | 🔴 | Inputs implemented (white bg + dark text verified readable), **but `/profile` route crashes**: loader returns undefined → `useLoaderData` destructure error (RouteError now shows it in white) |
| FR-PRF-002 | Dynamic ATS keywords registry (add/remove tags) | `ApplicantProfile.tsx` skills/keyword inputs | 🟡 | Present, unverified (route crashes) |
| FR-PRF-003 | Master document knowledge base (CVs, degrees, certs) | `ApplicantProfile.tsx` education/cert inputs | 🟡 | Present, unverified |

---

## I. Technical Requirements (TR)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| TR-RUN-001 | Node.js 22 LTS, ESM (`"type": "module"`) | `package.json` | 🟡 | Not re-verified this session |
| TR-RUN-002 | Bind `0.0.0.0:3000` | `server.ts` (Express + Vite middleware); frontend dev on `:1111` | ✅ | Server answering; frontend `:1111` **verified rendering** after Vite restart |
| TR-RUN-003 | Single full-stack process (server.ts mounts Vite in dev, serves `dist/` in prod) | `server.ts:748-758` | ✅ | **`npm run build` succeeded this session** → `dist/index.html`, `dist/assets/*`, `dist/server.cjs` (40.9 kb) |
| TR-RUN-004 | Build: `vite build` + `esbuild server.ts` → `dist/server.cjs` | `package.json` build script | ✅ | Verified; 1 warning: `import.meta` empty in CJS output (server.ts:9) — non-blocking |
| TR-FED-001 | React 19 + TypeScript strict (`tsc --noEmit`) | `frontend/package.json`, `frontend/tsconfig` | 🔴 | **5 pre-existing errors in `DocumentStudio.tsx` (307–310, 756)**; all other files 0 errors (35→0 remediation in `b814f9e`, plus server.ts dehumanize fix this session) |
| TR-FED-002 | Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss"`) | `frontend/src/index.css`, `frontend/vite.config.ts` | 🟡 | In use (theme `@theme` block confirmed) |
| TR-FED-003 | Tactile skeuomorphic theme (matte `#1E2024`/`#141619`, amber `#FFA928`, orange `#F97316`/`#EA580C`, red `#DC2626`, paper `#FFF`/`#F4F5F7`, `.raised/.sunken/.glow-amber/.tactile`) | `frontend/src/index.css` (`@theme` tokens, `.sunken` :302, `.toast` :653) | ✅ | **Verified via computed styles**: `.sunken` = `rgb(18,20,26)`; signoff-red = `rgb(220,38,38)`; white text = `rgb(255,255,255)` |
| TR-FED-004 | Typography: Cinzel / Lora / Plus Jakarta Sans / mono | `frontend/src/index.css` (`font-brand`, `font-display`, `font-heading`, `font-body`) | 🟡 | Present |
| TR-FED-005 | lucide-react icons | `JobCard.tsx`, `RouteError.tsx` etc. imports | 🟡 | In use |
| TR-API-* | 9 REST endpoints (`/api/health`, `/score-ats`, `/tailor-resume`, `/tailor-document`, `/dehumanize`, `/scrape-live`, `/n8n/dispatch-webhook`, `/webhooks/n8n`, `/submit-application`) | `server.ts:32,41,131,314,469,534,690,714` | 🟡 | 8/9 located; `/api/webhooks/n8n` inbound route ⬜ audit |
| TR-AI-001 | `@google/genai` v2.4.0+ only | `package.json` deps | 🟡 | Verify dep present |
| TR-AI-002 | Models `gemini-3.8-flash` / `gemini-2.5-flash` | `server.ts` model constants | 🟡 | Not re-verified |
| TR-AI-003 | All LLM calls server-side only | `server.ts` (no client Gemini calls found in `frontend/src`) | 🟡 | Client API layer proxies through BFF |
| TR-AI-004 | Deterministic fallback when `GEMINI_API_KEY` absent | `server.ts` catch blocks (fallback added this session: AI endpoints return deterministic data on Gemini 503; destructuring moved outside try) | ✅ | Build green with fallback code; runtime fallback exercised earlier in session |

---

## J. Non-Functional Requirements (NFR)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| NFR-PERF-001 | ATS scoring < 2.5 s | `server.ts` `/api/ai/score-ats` | ⬜ | Not measured |
| NFR-PERF-002 | Layout switch < 50 ms (no network) | `DocumentStudio.tsx` state toggle | 🟠 | Blocked by TS parse errors (FR-DOC-002) |
| NFR-PERF-003 | Client bundle < 500 KB gzipped | `dist/assets/index-*.js` = **387.01 kB raw / 105.40 kB gzip** | ✅ | **Verified in build output this session** |
| NFR-REL-001 | Zero crash resilience — no blank screens | `RouteError.tsx` `errorElement` on every route (`App.tsx:259-273`); fallback data in `server.ts` | ✅ (mechanism) | **Error page verified rendering** with white readable message; root causes of `/jobs`, `/jobs/:id`, `/profile` crashes still open (see §L) |
| NFR-REL-002 | Ephemeral recovery without migrations | `backend/src/athena/store.py` (WIP, uncommitted) | 🟠 | In progress |
| NFR-SEC-001 | Zero secret leakage; `.env.example` documented | `.env.example` (audit ⬜) | 🟡 | Not audited this session |
| NFR-SEC-002 | Tamper-evident receipts (SHA-256 of ID+signer+timestamp) | `server.ts` `/api/submit-application`; `SignOffModal.tsx:125` `SHA256-SIGN-{…}` | 🟡 | Pattern present |
| NFR-SEC-003 | XSS sanitization of inputs/job descriptions | Audit pending | ⬜ | Not audited |
| NFR-UX-001 | `prefers-reduced-motion` honored | `frontend/src/index.css` | 🟡 | Present (per PRS RTM); not re-tested |
| NFR-UX-002 | Visible focus rings `ring-2 ring-[#F97316]` | Button/input classes (`focus:ring-brand-orange`) | 🟡 | In use across forms |
| NFR-UX-003 | Print fidelity (white bg, black ink, no chrome) | `index.css @media print`, `no-print` classes | 🟡 | Not print-tested this session |

---

## K. Data Contracts

| Entity | Contract Location | Status | Notes |
|---|---|---|---|
| `Opportunity` (id, title, company, location, category, scope, platform, description, requirements, salaryOrBudget, deadline, atsScore, postedDate, status, isFlagged?, dehumanizedPitch?, autoCreatedDocs?, tailoredResume/CoverLetter/Proposal?, receipt?) | `frontend/src/lib/athena/types.ts` (Job/JobCardProps) | 🟠 | Field parity with PRS `Opportunity` not diffed; `job.category` null-safety defect (FR-SRC-003) |
| `ApplicationReceipt` (receiptId, confirmationHash, submittedAt, jobTitle, company, applicantName, authorizedBy, authorizedAt, portalName, followUpDate, status, notes?) | `api.ts` receipt endpoints/types | 🟡 | Contract exists |
| `ApplicantProfile` (id, fullName, headline, email, phone, location, hourlyRateUsd, expectedMonthlyMwk, legalAuthorizedSigner, skills, experience, education, certifications) | `ApplicantProfile.tsx` + `api.ts` profile types | 🟠 | Inputs present; route crash blocks access (FR-PRF-001) |

---

## L. Defect Register (known, reproducible)

| ID | Defect | Location | Impact | Linked Requirements |
|---|---|---|---|---|
| DEF-001 | `job.category.toUpperCase()` on undefined → route crash | `JobList.tsx` (~:598) | `/jobs`, `/applications` crash | FR-SRC-003, NFR-REL-001 |
| DEF-002 | `.slice()` on undefined → route crash | `JobDetail.tsx` (render path) | `/jobs/:id` shows RouteError | FR-ATS-002 (tier badges unreachable) |
| DEF-003 | `useLoaderData()` undefined → destructure crash | `/profile` loader in `App.tsx` | `/profile` unusable | FR-PRF-001/002/003 |
| DEF-004 | JSX parse errors `')' expected` | `DocumentStudio.tsx:307-310, 756` | Block `tsc --noEmit` green | TR-FED-001, FR-DOC-002 |
| DEF-005 | `import.meta` empty in CJS build output | `server.ts:9` (esbuild warning) | Non-blocking; risks `__filename` at runtime | TR-RUN-004 |
| DEF-006 | Undefined legacy `ls-*` color utilities generate no CSS | Was 15+ components; **fixed this session** | Dark-on-dark invisible text | TR-FED-003, NFR-REL-001 ✅ |

---

## M. Change Log — This Session (traceability of applied fixes)

| File:Line | Change | Serves |
|---|---|---|
| `RouteError.tsx:14` | icon `text-ls-red` → `text-signoff-red` | TR-FED-003 (defined token) |
| `RouteError.tsx:25` | error `<pre>` `text-ls-grey-dark` → `text-white` | NFR-REL-001, FR-RCP-001 readability ✅ verified `rgb(255,255,255)` |
| `RouteError.tsx:36` | Retry `bg-ls-red` (undefined) → `bg-signoff-red text-white hover:bg-signoff-red-hover` | FR-SIG visual ✅ verified white on `rgb(220,38,38)` |
| `Toast.tsx:113` | message `text-text-primary` → `text-white` | NFR-REL-001 |
| `Toast.tsx:131` | dismiss `text-text-secondary hover:text-ink` → `text-white/70 hover:text-white` | NFR-UX-002 readability |
| `N8nIntegration.tsx:196` | output `<pre>` `text-text` → `text-white` | FR-N8N-003 ✅ verified white on `rgb(24,24,27)` |
| `JobDetail.tsx:207,210,213,216,283` | meta + benefit chips `text-ls-grey-dark` → `text-white` | FR-ATS-002 (tier/meta display) |
| `JobCard.tsx:72` | source chip `text-text-secondary` → `text-white` | FR-SRC display ✅ verified 10/10 chips white on `rgb(18,20,26)` |
| `JobCard.tsx:201` | compact avatar `text-ink` → `text-white` | FR-SRC display |
| `AreaChart.tsx:50,204` | empty states `text-ls-grey-light-text` → `text-white` | NFR-REL-001 |
| `SkillTags.tsx:59` | empty state → `text-white` | NFR-REL-001 |
| `Dashboard.tsx:307` | empty state `text-text-secondary` → `text-white` | NFR-REL-001 |
| `Settings.tsx:110` | input `text-ls-navy` → `text-white`, placeholder → `text-white/50`, focus ring → `brand-orange` | FR-PRF inputs ✅ verified white on `rgb(18,20,26)` |
| `DocumentEditor.tsx:338` | hotkey cap → `text-white` | FR-DOC-003 readability |
| `server.ts:785-796` | dehumanize catch: out-of-scope `text` → `parsed.text` / `humanText` (3 TS errors → 0) | FR-DOC-005, TR-FED-001 ✅ lint clean for file |

---

## N. Quality Gate Results (this session)

| Gate | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ PASS — `dist/index.html` 1.52 kB, CSS 69.37 kB (gzip 12.33), JS 387.01 kB (gzip **105.40 < 500**), `dist/server.cjs` 40.9 kB |
| Type check | `npm run lint -- --noEmit` | 🟠 5 errors — **all in `DocumentStudio.tsx` (pre-existing DEF-004)**; 0 errors in all other files incl. `server.ts` |
| Dev server boot | Vite on `:1111` + Express on `:3000` | ✅ PASS — app renders (`/dashboard` body text confirmed), no page errors |
| Visual text-visibility | Playwright computed-style checks | ✅ PASS — 7/7 targets white-on-dark (error `<pre>`, Retry, Settings input, N8n output, JobCard chips ×10, toast demo, route errors on `/profile` + `/jobs/:id`) |

---

## O. Prioritized Outstanding Work (backlog)

| Priority | Item | Unblocks |
|---|---|---|
| P0 | Fix DEF-004 `DocumentStudio.tsx` parse errors | TR-FED-001 green lint; FR-DOC-002 |
| P0 | Fix DEF-001/002/003 null-data crashes | FR-SRC-003, FR-ATS-002, FR-PRF-* (3 dead routes) |
| P1 | Dehumanizer UI toggle (FR-DOC-005) | PRS mandatory gate |
| P1 | “Execute 4h Cycle Now” UI + cron audit (FR-CRN-001/002) | Sourcing automation |
| P1 | Resume/cover-letter “Tailor” buttons on JobDetail (FR-DOC-001/003) | Auto-tailor Critical tier |
| P2 | Auto-apply rule engine (score ≥ threshold + tier) + human sign-off wiring | FR-ATS-002 routing |
| P2 | Verify `/api/webhooks/n8n` inbound route + dispatch tester E2E (FR-N8N-002/003) | n8n topology |
| P2 | LinkedIn export E2E incl. `.json`/`.md` downloads from ReceiptsView (FR-LNK-001/004) | LinkedIn integration |
| P3 | Audit: FR-CRN-001 setInterval, TR-AI model aliases, NFR-SEC-001 `.env.example`, source list vs FR-SRC-001 enumeration | Spec conformance |
