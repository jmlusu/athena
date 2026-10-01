# Athena PRS → Code Traceability Matrix (v1.1)

| Field | Value |
|---|---|
| **Source Specification** | Athena Platform Requirements Specification (PRS) v2.4.0 — APPROVED & MANDATORY |
| **Classification** | Autonomous AI Job and Consultation Services Search, ATS Evaluation, Document Tailoring & Application Dispatching Platform |
| **Codebase** | `C:\Users\jmlus\athena` — branch `feat/athena-ai-studio-migration` (head `b814f9e`) |
| **Matrix Scope** | Full PRS requirement set mapped to code locations, with status and verification evidence |
| **Last Updated** | Session of 2026-10-01 — open-requirement closure pass (FR-N8N-002, FR-DOC-007, FR-CRN-001/002, NFR-SEC-003, NFR-PERF-001) |

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
| FR-SRC-001 | Multi-Platform Aggregation (LinkedIn, Upwork, ReliefWeb, Devex, Corporate portals, Ntchito.com, jobsearchmalawi.com, careersmw.com, careeradmw.com, International Development & Humanitarian Portals, developmentaid.org, unjobs.org, UNDP/UNICEF/WFP/FAO/UNFPA, Indeed, Glassdoor, Freelance/Remote/On-Demand Networks, Financial Institutions, International NGOs — CHAI, Last Mile Health, Partners In Health, World Vision, CARE, Save the Children, Statutory Bodies, Commissions) | `server.ts` → `POST /api/ai/scrape-live` (`server.ts:837`); `frontend/src/lib/athena/api.ts` (`scrapeLive`, `scrapeHistory`); `frontend/src/pages/athena/N8nIntegration.tsx` | 🟡 | Endpoint + client wired; source list coverage not audited against FR-SRC-001 enumeration |
| FR-SRC-002 | 3-Scope Ingress Classification (`lilongwe-local` \| `lilongwe-remote` \| `international-remote`) | `server.ts` (`locationFilter` in `/api/ai/scrape-live`, comment at `server.ts:804`); `frontend/src/components/athena/AthenaLayout.tsx` (TARGET SCOPES selector) | 🟡 | Scope selector visible in UI screenshot; classification logic not exercised |
| FR-SRC-003 | Category Segmentation (`job` \| `consultancy`) | `frontend/src/pages/athena/JobList.tsx:680` (`getJobTypeLabel(job.job_type)` → uppercase badge); `JobDetail.tsx` | 🟡 | DEF-001 **resolved** — unguarded `job.category.toUpperCase()` no longer present (API shape now `job_type` + label helper). Exercised by passing `full-pipeline` / `scope-filtering` E2E; badge visuals not individually asserted |
| FR-SRC-004 | De-duplication & Idempotency | `backend/src/athena/store.py` (96-line change, uncommitted) | 🟠 | Backend store work in progress; not verified |
| FR-CRN-001 | Autonomous 4-hour Cron Cycle (14,400 s) | `src/App.tsx:74-105` (`runCronCycle` → `POST /api/ai/scrape-live`); `src/App.tsx:125-146` interval effect (14,400 s, `cronRefreshRef` latest-closure guard) | ✅ | **Fixed this session.** Countdown interval + expiry now issues a real backend call (`{locationFilter:"all", searchType, resumeSkills}`), with in-flight ref de-dupe (no hot loop on failure), loading state, and success/failure toast carrying the discovered-listing count |
| FR-CRN-002 | Manual Cycle Override (“Execute 4h Cycle Now”) | `src/components/layout/LeftSidebar.tsx:266-274` (`data-testid` Execute button, `disabled={cronFiring}`, `Running…` + spinner); `src/App.tsx:148-157` `handleTriggerCronNow` | ✅ | **Fixed this session.** Button POSTs `searchType:"all"` to `POST /api/ai/scrape-live`, resets both 14,400 s counters, and disables while in flight |

---

## B. Functional Requirements — FR-ATS (Semantic ATS Scoring)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-ATS-001 | Score 0–100 vs active profile | `server.ts:321` → `POST /api/ai/score-ats` (timing + `X-Scoring-Ms` at `server.ts:322-337`); `frontend/src/lib/athena/api.ts` (`scoreATS`, `scoreJob`); `MiniATSGauge` in `JobCard.tsx:84` | 🟡 | Endpoint + deterministic Gemini-503 fallback exercised live this session (see NFR-PERF-001); gauge renders only when score data present |
| FR-ATS-002 | Tier routing: Critical ≥90 (auto-tailor), Flagged 80–89 (orange badge + review queue), Standard <80 (gap analysis only) | `JobCard.tsx:24-25,211` (`atsTier` → `badge-critical`/`badge-flagged`/`badge-muted`); `JobList.tsx` tier badges | 🟡 | Tier computation + badges implemented; **auto-tailor trigger for Critical not located** |
| FR-ATS-003 | Factor analysis: matched skills, gap skills, strengths, recommendation, 2-sentence dehumanized pitch | `server.ts` `/api/ai/score-ats` response contract; `frontend/src/lib/athena/api.ts` `AIATSScoreResponse` | 🟡 | Response shape confirmed from a live 200 (fallback branch returns all factor fields); live-model output still unverified |

---

## C. Functional Requirements — FR-DOC (Pristine Document Studio)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-DOC-001 | Bespoke resume tailoring (ATS ≥90) | `server.ts` → `POST /api/ai/tailor-resume` (`server.ts:430`); `JobDetail.tsx:425-430` (Tailor Resume → `handleAction('tailor')`); `JobCard.tsx:163-166` + `:274-277` (`data-testid="tailor-resume-btn"`) | ✅ | Buttons **were** present (matrix previously recorded "not located") — confirmed in both full and compact cards and in JobDetail; success feedback path wired (`setActionFeedback`) |
| FR-DOC-002 | 1-Column vs 2-Column dynamic layout toggle | `frontend/src/pages/athena/DocumentStudio.tsx` (layout state) | 🟡 | DEF-004 parse errors **resolved** — `tsc --noEmit` exit 0; toggle component present and E2E-green. Layout-switch latency not measured (NFR-PERF-002 still open) |
| FR-DOC-003 | Tailored cover letters (letterhead, 3 paragraphs, sign-off) | `server.ts` → `POST /api/ai/tailor-document` (`server.ts:613`); `api.ts` `tailorDocument`; `DocumentEditor.tsx` render | 🟡 | Endpoint + render path exercised via `document-studio` E2E (all pass); 3-paragraph structure not asserted |
| FR-DOC-004 | 4-section consultancy proposal (Context / Approach+WBS / Deliverables+Acceptance / Milestone rates USD/MWK) | `server.ts` → `POST /api/ai/tailor-document` (doc type) | 🟡 | Doc-type parameter exists; `document-studio` E2E proposal path passes; 4-section structure not verified |
| FR-DOC-005 | Dehumanizer Engine + UI toggle | `frontend/src/pages/athena/DocumentStudio.tsx:534-551` (`data-testid="dehumanize-toggle"`); `src/components/views/DocumentStudioView.tsx:277-288`; `server.ts:768-834` | ✅ | UI toggle **found in both trees** (matrix previously recorded "not located") and driven by `automation-controls` E2E. Server-side parse defect **fixed this session** — `server.ts:815-819` now reads `parsed.humanizedText` (prompt contract) with `parsed.text` fallback, and honours model-supplied `flaggedWordsRemoved` |
| FR-DOC-006 | Vector print / PDF export (`@media print`) | `frontend/src/index.css` (print rules); `DocumentStudio.tsx` `no-print` classes | 🟡 | CSS present; browser print simulation not run this session |
| FR-DOC-007 | One-click Markdown export | `frontend/src/pages/athena/DocumentStudio.tsx:583` + `:457` (`buildMarkdown`, `download-markdown-btn`); `frontend/src/pages/athena/DocumentEditor.tsx:338`; `frontend/src/lib/athena/utils.ts:24` (`downloadMarkdown`); `src/components/views/DocumentStudioView.tsx:172-215,312-314` | ✅ | **Built this session in both trees.** Blob → objectURL → `<a download>` → revoke. `data-testid="download-markdown-btn"`; kebab-cased opportunity-title filename with `athena-document.md` fallback; disabled on empty content. `document-studio` E2E green |

---

## D. Functional Requirements — FR-SIG (Form Filler & Human Sign-Off Gate)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-SIG-001 | Automated form field mapping (contact, Lilongwe residency, work authorization, comp, screening prompts) | `frontend/src/pages/athena/FormFillerModal.tsx` (inputs lines 195–278) | 🟡 | Field inputs implemented |
| FR-SIG-002 | Never submit without interactive human sign-off | `FormFillerModal.tsx`, `SignOffModal.tsx` | 🟡 | Gate logic present in modals |
| FR-SIG-003 | Power-of-Attorney: authorization checkbox + typed legal name | `SignOffModal.tsx:116-126` (typed signature input, `Audit Token: SHA256-SIGN-…`), authorization checkbox | 🟡 | Signature input + audit token visible in code |
| FR-SIG-004 | Validation lockout — submit disabled until checkbox + signature | `SignOffModal.tsx` disable logic | 🟠 | Not exercised this session (no interactive test run) |
| FR-SIG-00X (visual) | Sign-off surfaces readable on dark chrome | `RouteError.tsx:36` Retry button → `bg-signoff-red text-white`; `Settings.tsx:110` input → `text-white placeholder:text-white/50` | ✅ | **Verified prior session** — Retry computed style `rgb(255,255,255)` on `rgb(220,38,38)` |

---

## E. Functional Requirements — FR-RCP (Receipts & Follow-Up)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-RCP-001 | SHA-256 audit certificate (ID, hash, ISO-8601, names, org, status) | `server.ts` → `POST /api/submit-application`; `ApplicationReceipt` contract in `api.ts` | 🟠 | Endpoint + contract exist, but `confirmationHash` is **base64, not a SHA-256 digest** (see DEF-009). Generation not exercised; E2E `08-receipts-certificate` fails on missing fixtures |
| FR-RCP-002 | 7-day follow-up tracker + one-click email draft | `frontend/src/pages/athena/` receipts route (App.tsx `ReceiptsRoute`) | 🟠 | Route exists; follow-up compute/draft not verified |
| FR-RCP-003 | Dedicated Receipts view | `App.tsx:268-269` (`receipts`, `receipts/:id`) | 🟡 | Route registered; `Receipts.tsx` now null-guards `res.receipts ?? []` |

---

## F. Functional Requirements — FR-LNK (LinkedIn Integration)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-LNK-001 | “Export to LinkedIn” from OpportunityDetailModal & ReceiptsView | `frontend/src/pages/athena/LinkedInExportModal.tsx` (commit `ab844d2` “feat: add LinkedIn export functionality”) | 🟠 | Modal implemented; **not verified from ReceiptsView**; E2E `09-export-linkedin` fails — selector never existed at HEAD |
| FR-LNK-002 | Easy Apply draft: headline, dehumanized pitch, skills, cover note | `LinkedInExportModal.tsx:249-293` (inputs + payload editor) | 🟡 | Formatting inputs present |
| FR-LNK-003 | Profile Experience section mapping | `LinkedInExportModal.tsx` | 🟠 | Fields present; mapping not tested |
| FR-LNK-004 | `.json` + `.md` downloads | `LinkedInExportModal.tsx` | 🟠 | Download generation not exercised this session |
| FR-LNK-005 | External LinkedIn Jobs linkout | `LinkedInExportModal.tsx` | 🟠 | Not exercised |

---

## G. Functional Requirements — FR-N8N (Workflow Automation)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-N8N-001 | 5-node topology display (Cron → Scraper → Gemini ATS → Score Switch → Sign-Off) | `frontend/src/pages/athena/N8nIntegration.tsx` (topology UI) | 🟡 | Page renders; topology visuals present; `n8n-integration` E2E 5/5 pass |
| FR-N8N-002 | Inbound webhook `POST /api/webhooks/n8n` | `server.ts:1014-1041` (route) + `server.ts:17-25` (JSON-parse 400 middleware); caller `src/components/views/N8nIntegrationView.tsx:44` | ✅ | **Route added this session and runtime-verified.** `200 {received:true, executionId:"n8n-exec-…", workflow, event, timestamp}`; `400` JSON on `{}`/array/scalar/no-body and on malformed JSON; `[n8n] inbound webhook received …` log line. Known gap: `frontend/…/N8nIntegration.tsx` still calls `${API_BASE}/ai/n8n/dispatch` (DEF-011) |
| FR-N8N-003 | Interactive webhook dispatch tester (edit JSON, send, inspect receipt) | `N8nIntegration.tsx:167-199` (`payload-editor`, `execute-webhook-btn`, `execution-response`) | ✅ (visual) | Execution `<pre>` verified white text on dark: `rgb(255,255,255)` on `rgb(24,24,27)`; E2E 5/5 |

---

## H. Functional Requirements — FR-PRF (Applicant Profile & ATS Keywords)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| FR-PRF-001 | Dossier: name, headline, email, phone +265, location, hourly USD, monthly MWK, legal signer | `frontend/src/pages/athena/ApplicantProfile.tsx` (inputs 116–662); `api.ts` `ApplicantProfile` contract | 🟡 | DEF-003 **resolved** — `/profile` no longer uses `useLoaderData`; `ApplicantProfileWrapper` (`frontend/src/App.tsx:250-290`) loads via `listProfiles()` with explicit `null`/error states, plus `errorElement`. Boundary normalizer `normalizeProfile` (`ApplicantProfile.tsx:57`) applied at all 3 prop entry points. Route not re-clicked this session |
| FR-PRF-002 | Dynamic ATS keywords registry (add/remove tags) | `ApplicantProfile.tsx` skills/keyword inputs | 🟡 | Present; previously blocked by DEF-003, now reachable |
| FR-PRF-003 | Master document knowledge base (CVs, degrees, certs) | `ApplicantProfile.tsx` education/cert inputs | 🟡 | Present; previously blocked by DEF-003, now reachable |

---

## I. Technical Requirements (TR)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| TR-RUN-001 | Node.js 22 LTS, ESM (`"type": "module"`) | `package.json` (`"type": "module"` confirmed) | ✅ | Confirmed this session |
| TR-RUN-002 | Bind `0.0.0.0:3000` | `server.ts` (Express + Vite middleware); frontend dev on `:1111` | ✅ | Server answering; frontend `:1111` verified rendering |
| TR-RUN-003 | Single full-stack process (server.ts mounts Vite in dev, serves `dist/` in prod) | `server.ts:748-758` | ✅ | `npm run build` green this session |
| TR-RUN-004 | Build: `vite build` + `esbuild server.ts` → `dist/server.cjs` | `package.json` build script | 🟠 | Build green, **but `npm start` (`node dist/server.cjs`) crashes at boot** — `fileURLToPath(import.meta.url)` is empty in CJS output (DEF-005 escalated). Only `npx tsx server.ts` boots |
| TR-FED-001 | React 19 + TypeScript strict (`tsc --noEmit`) | `frontend/package.json`, `frontend/tsconfig` | ✅ | **Exit 0 in both trees this session** (root `src/` + `frontend/`). DEF-004 resolved |
| TR-FED-002 | Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss"`) | `frontend/src/index.css`, `frontend/vite.config.ts` | 🟡 | In use (theme `@theme` block confirmed) |
| TR-FED-003 | Tactile skeuomorphic theme (matte `#1E2024`/`#141619`, amber `#FFA928`, orange `#F97316`/`#EA580C`, red `#DC2626`, paper `#FFF`/`#F4F5F7`, `.raised/.sunken/.glow-amber/.tactile`) | `frontend/src/index.css` (`@theme` tokens, `.sunken` :302, `.toast` :653) | ✅ | Verified via computed styles: `.sunken` = `rgb(18,20,26)`; signoff-red = `rgb(220,38,38)`; white text = `rgb(255,255,255)` |
| TR-FED-004 | Typography: Cinzel / Lora / Plus Jakarta Sans / mono | `frontend/src/index.css` (`font-brand`, `font-display`, `font-heading`, `font-body`) | 🟡 | Present |
| TR-FED-005 | lucide-react icons | `JobCard.tsx`, `RouteError.tsx` etc. imports | 🟡 | In use |
| TR-API-* | 9 REST endpoints (`/api/health`, `/score-ats`, `/tailor-resume`, `/tailor-document`, `/dehumanize`, `/scrape-live`, `/n8n/dispatch-webhook`, `/webhooks/n8n`, `/submit-application`) | `server.ts:42,321,430,613,768,837,989,1014,1046` | ✅ | **9/9 located and live-probed this session.** Caveat: no route enforces auth (DEF-008) |
| TR-AI-001 | `@google/genai` v2.4.0+ only | `package.json` → `"@google/genai": "^2.4.0"` | ✅ | Confirmed this session |
| TR-AI-002 | Models `gemini-3.8-flash` / `gemini-2.5-flash` | `server.ts` model constants | 🟠 | `gemini-3.8-flash` used at `server.ts:393,401,423,545,712,811,875`. **`gemini-2.5-flash` does not appear anywhere in `server.ts`** — alternate model alias unimplemented |
| TR-AI-003 | All LLM calls server-side only | `server.ts` (no client Gemini calls found in `frontend/src`) | ✅ | Client API layer proxies through BFF |
| TR-AI-004 | Deterministic fallback when `GEMINI_API_KEY` absent | `server.ts` catch blocks (fallback: AI endpoints return deterministic data on Gemini 503; destructuring moved outside try) | ✅ | **Runtime-confirmed live this session** — Gemini returned 503 on both attempts and `score-ats` still returned 200 with full factor payload |

---

## J. Non-Functional Requirements (NFR)

| Req ID | Requirement | Code Location(s) | Status | Verification / Notes |
|---|---|---|---|---|
| NFR-PERF-001 | ATS scoring < 2.5 s | `server.ts:321-337` (`performance.now()` + `X-Scoring-Ms` + `[metrics] score-ats duration=…`) | 🔴 | **Measured this session and the target is NOT met:** `X-Scoring-Ms: 3267` and `X-Scoring-Ms: 4893` on the Gemini-503 fallback path — 1.3×–2.0× the 2 500 ms budget. Instrumentation now makes this visible (was ⬜ "not measured"). See DEF-010 |
| NFR-PERF-002 | Layout switch < 50 ms (no network) | `DocumentStudio.tsx` state toggle | 🟠 | TS errors cleared (FR-DOC-002); latency still not measured |
| NFR-PERF-003 | Client bundle < 500 KB gzipped | root `dist/assets/index-SpnFTHUB.js` = **388.92 kB raw / 106.05 kB gzip**; `frontend/dist/assets/index-B7Tx5dVH.js` = **911.19 kB raw / 259.31 kB gzip** | ✅ | Both under 500 kB gzipped. Frontend raw size trips Rollup's 500 kB **raw** chunk warning (informational) |
| NFR-REL-001 | Zero crash resilience — no blank screens | `RouteError.tsx` `errorElement` on every route (`App.tsx:259-273`); fallback data in `server.ts` | ✅ (mechanism) | Error page verified rendering; DEF-001/002/003 root causes now resolved (see §L) |
| NFR-REL-002 | Ephemeral recovery without migrations | `backend/src/athena/store.py` (WIP, uncommitted) | 🟠 | In progress |
| NFR-SEC-001 | Zero secret leakage; `.env.example` documented | `.env.example` (audit ⬜) | 🟡 | Not audited this session. Related: no `/api/*` route validates a key (DEF-008) |
| NFR-SEC-002 | Tamper-evident receipts (SHA-256 of ID+signer+timestamp) | `server.ts` `/api/submit-application`; `SignOffModal.tsx:125` `SHA256-SIGN-{…}` | 🟠 | Label says SHA-256 but the value is **base64, not a hash** (DEF-009) |
| NFR-SEC-003 | XSS sanitization of inputs/job descriptions | `frontend/src/pages/athena/DocumentEditor.tsx:8` (`escapeHtml`) applied at `:221-228`, sink `:459` | ✅ | **Audited and fixed this session.** Single `dangerouslySetInnerHTML` sink found; all 8 `renderPreview()` interpolations now HTML-escaped (`& < > " '`), no new dependency (no DOMPurify). Sweep of `frontend/src` for `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`/`document.write` returned no other sink. Root `src/` has zero sinks. Residual (reported, not fixed): unvalidated `href`/`src` from API data — see DEF-012 |
| NFR-UX-001 | `prefers-reduced-motion` honored | `frontend/src/index.css` | 🟡 | Present; not re-tested |
| NFR-UX-002 | Visible focus rings `ring-2 ring-[#F97316]` | Button/input classes (`focus:ring-brand-orange`) | 🟡 | In use across forms |
| NFR-UX-003 | Print fidelity (white bg, black ink, no chrome) | `index.css @media print`, `no-print` classes | 🟡 | Not print-tested this session |

---

## K. Data Contracts

| Entity | Contract Location | Status | Notes |
|---|---|---|---|
| `Opportunity` (id, title, company, location, category, scope, platform, description, requirements, salaryOrBudget, deadline, atsScore, postedDate, status, isFlagged?, dehumanizedPitch?, autoCreatedDocs?, tailoredResume/CoverLetter/Proposal?, receipt?) | `frontend/src/lib/athena/types.ts` (Job/JobCardProps) | 🟡 | Field parity with PRS `Opportunity` not diffed; `job.category` null-safety defect (DEF-001) **resolved** |
| `ApplicationReceipt` (receiptId, confirmationHash, submittedAt, jobTitle, company, applicantName, authorizedBy, authorizedAt, portalName, followUpDate, status, notes?) | `api.ts` receipt endpoints/types | 🟡 | Contract exists; `confirmationHash` semantics wrong (DEF-009) |
| `ApplicantProfile` (id, fullName, headline, email, phone, location, hourlyRateUsd, expectedMonthlyMwk, legalAuthorizedSigner, skills, experience, education, certifications) | `ApplicantProfile.tsx` + `api.ts` profile types | 🟡 | Inputs present; route crash (DEF-003) resolved; boundary normalizer added |

---

## L. Defect Register (known, reproducible)

| ID | Defect | Location | Impact | Linked Requirements |
|---|---|---|---|---|
| DEF-001 | `job.category.toUpperCase()` on undefined → route crash | ~~`JobList.tsx` (~:598)~~ | **RESOLVED** — field replaced by `job.job_type` + `getJobTypeLabel()`; `/jobs`, `/applications` no longer crash on missing category | FR-SRC-003, NFR-REL-001 |
| DEF-002 | `.slice()` on undefined → route crash | `JobDetail.tsx` render path | **RESOLVED this session** — `requirements/responsibilities/benefits ?? []` guards added at `JobDetail.tsx`, `JobList.tsx`, `OpportunityDetailModal.tsx` | FR-ATS-002, NFR-REL-001 |
| DEF-003 | `useLoaderData()` undefined → destructure crash | `/profile` loader in `App.tsx` | **RESOLVED** — replaced by `ApplicantProfileWrapper` state + error handling (`frontend/src/App.tsx:250-290`) | FR-PRF-001/002/003 |
| DEF-004 | JSX parse errors `')' expected` | `DocumentStudio.tsx:307-310, 756` | **RESOLVED** — `tsc --noEmit` exit 0 in both trees | TR-FED-001, FR-DOC-002 |
| DEF-005 | `import.meta` empty in CJS build output → **`npm start` crashes at boot** | `server.ts:9` (esbuild `--format=cjs`) | **ESCALATED 🔴** — `node dist/server.cjs` → `TypeError: "path" … Received undefined at fileURLToPath (dist/server.cjs:33)`. Production start path is unusable; only `npx tsx server.ts` boots | TR-RUN-004 |
| DEF-006 | Undefined legacy `ls-*` color utilities generate no CSS | Was 15+ components; **fixed prior session** | Dark-on-dark invisible text | TR-FED-003, NFR-REL-001 ✅ |
| DEF-007 | Dehumanize AI-success path returned empty output | `server.ts:815` (`parsed.text` vs prompt's `humanizedText`) | **RESOLVED this session** — reads `parsed.humanizedText` with `parsed.text` fallback; `flaggedWordsRemoved` now taken from the model response | FR-DOC-005 |
| DEF-008 | **No `/api/*` route enforces authentication** | `server.ts` (all 9 routes) | The frontend sends `X-API-Key: dev-admin-key` but the server never validates it; `GET /api/health` also exposes a key-presence oracle | NFR-SEC-001, TR-API-* |
| DEF-009 | `confirmationHash` labelled `SHA256-…` is base64, not a digest | `server.ts` `/api/submit-application` | Receipts are not tamper-evident as specified | FR-RCP-001, NFR-SEC-002 |
| DEF-010 | ATS scoring exceeds its 2.5 s budget | `server.ts` `/api/ai/score-ats` | Measured **3 267 ms** and **4 893 ms** on the Gemini-503 fallback path | NFR-PERF-001 |
| DEF-011 | n8n caller/doc drift | `frontend/src/pages/athena/N8nIntegration.tsx` → `${API_BASE}/ai/n8n/dispatch`; docs §7.1 receipt shape `status:"SUCCESS"` | The `frontend/` tree and the documented contract do not use the newly added `POST /api/webhooks/n8n`; only `src/components/views/N8nIntegrationView.tsx:44` does | FR-N8N-002 |
| DEF-012 | Unvalidated `href`/`src` from API data (`javascript:` injection vector) | `JobDetail.tsx:183,291,315`; `ApplicantProfile.tsx:204,219,234`; `JobList.tsx:909`; `JobCard.tsx:179` | Reported during the XSS audit, **not fixed** (out of the XSS-escaping change) | NFR-SEC-003 |
| DEF-013 | Playwright visual baselines drifted / never existed | `frontend/e2e/tests/visual-regression.spec.ts` | 11/12 fail: 1 true drift (new `download-markdown-btn`), 7 specs targeting selectors absent at HEAD, 1 pointer-interception, 1 empty-fixture, 1 unmasked Recharts tooltip | E2E gate |
| DEF-014 | Backend AI test files do not collect **and are not formatted** | `backend/tests/test_ai_{adapters,providers,routes,status_mapping}.py` (all **untracked**) | Blocks **both** backend CI gates. (a) `pytest` → 1 collection error + 13 failed + 2 errors: `test_ai_adapters.py:7` imports `ScoreATSPayload`, which exists in neither the working tree nor HEAD of `ai_schemas.py`. (b) `ruff format --check .` → 3 files would be reformatted (`test_ai_adapters.py:76`, `test_ai_providers.py:37`, `test_ai_status_mapping.py:54`). Not caused by this session — `backend/` untouched | Backend gates |

---

## M. Change Log — This Session (traceability of applied fixes)

| File:Line | Change | Serves |
|---|---|---|
| `server.ts:17-25` | JSON body-parser error middleware → malformed webhook bodies return JSON `400` instead of HTML | FR-N8N-002 |
| `server.ts:1014-1041` | **New** `POST /api/webhooks/n8n` inbound route: object-shape validation, `n8n-exec-…` id, `200 {received, executionId, workflow, event, timestamp}`, `[n8n]` log line | FR-N8N-002, TR-API-* ✅ |
| `server.ts:322-337,351-363,405,408,417,429` | `performance.now()` timing + `X-Scoring-Ms` header + one `[metrics] score-ats duration=…` line on all three `score-ats` response paths (no-key, AI success, fallback) | NFR-PERF-001 (now measured → DEF-010) |
| `server.ts:815-819,829` | Dehumanize: `parsed.text` → `parsed.humanizedText \|\| parsed.text`; `flaggedWordsRemoved` read from model response instead of hardcoded | FR-DOC-005 (DEF-007) |
| `src/App.tsx:65-66,74-105` | **New** `cronFiring` state + `cronInFlightRef` + `runCronCycle(type)` → `POST /api/ai/scrape-live` with `{locationFilter:"all", searchType, resumeSkills}`; error/toast handling | FR-CRN-001 |
| `src/App.tsx:107-117,125-146,148-157,216` | `triggerCronRefresh` delegates to `runCronCycle`; `cronRefreshRef` latest-closure guard for the `[]`-interval; `handleTriggerCronNow` de-duped + counter reset; `cronFiring` threaded to sidebar | FR-CRN-001/002 |
| `src/components/layout/LeftSidebar.tsx:37,49,266-274` | `cronFiring` prop; Execute button `disabled` + `Running…` + spinner | FR-CRN-002 ✅ |
| `src/components/views/DocumentStudioView.tsx:172-215,312-314` | Extracted `buildMarkdown()` / `buildMarkdownFilename()`; `handleDownloadMarkdown` (Blob → objectURL → `<a download>` → revoke); **Download .md** button `data-testid="download-markdown-btn"`, disabled when empty | FR-DOC-007 ✅ |
| `frontend/src/lib/athena/utils.ts:24` | **New** shared `downloadMarkdown(content, filename)` helper | FR-DOC-007 |
| `frontend/src/pages/athena/DocumentEditor.tsx:8,221-228,338` | **New** `escapeHtml()` applied to all 8 `renderPreview()` interpolations; Markdown download button in header actions | NFR-SEC-003, FR-DOC-007 ✅ |
| `frontend/src/pages/athena/DocumentStudio.tsx:457,583` (+ guards at 493, edit/preview maps) | `buildMarkdown()` extracted from `handleCopyMarkdown`; Download .md button; `o.category` and skills/experience/bullets/paragraphs/sections null-guards | FR-DOC-007, DEF-001-class |
| `frontend/src/pages/athena/JobDetail.tsx`, `JobList.tsx`, `OpportunityDetailModal.tsx`, `Receipts.tsx` | `?? []` guards on API-sourced arrays | DEF-002 ✅ |
| `frontend/src/pages/athena/ApplicantProfile.tsx:57` | Boundary `normalizeProfile()` applied at `useState` init, `useEffect`, and `handleCancel` — covers skills/experience/education/certifications + full `JobPreferences` | DEF-003-class, FR-PRF-* |
| `src/App.tsx:197` | `listProfiles().catch(() => [])` | DEF-003-class |
| `src/components/views/DocumentStudioView.tsx:238,247,391,424,472,482,502,509,527` | `currentOpp?.id`, `(o.category \|\| "other")`, `contact?.`, `skills?/experience?/bullets?.map` | DEF-001-class |
| `src/components/views/ScraperDiscoveryView.tsx:303,311,313`, `OpportunityDetailModal.tsx:148`, `LinkedInExportModal.tsx:55-66,72,90`, `ApplicantProfileView.tsx:243` | `?.` / hoisted `|| []` guards on API-sourced arrays | DEF-001/002-class |

---

## N. Quality Gate Results (this session — 2026-10-01)

| Gate | Command | Result |
|---|---|---|
| Root type check | `npx tsc --noEmit` (repo root) | ✅ **PASS** (exit 0) |
| Root production build | `npm run build` (repo root) | ✅ **PASS** — 1675 modules; CSS 69.70 kB (gzip 12.37), JS **388.92 kB (gzip 106.05)**, `dist/server.cjs` 42.7 kB. 1 pre-existing warning: `import.meta` empty in CJS (DEF-005) |
| Frontend type check (= `pnpm lint`) | `npx tsc --noEmit` (`frontend/`) | ✅ **PASS** (exit 0) |
| Frontend unit tests (= `pnpm test`) | `npx vitest run` (`frontend/`) | ✅ **PASS** — 4 files, **49/49** |
| Frontend production build (= `pnpm build`) | `pnpm build` (`frontend/`) | ✅ **PASS** — 2530 modules; JS 911.19 kB raw / **259.31 kB gzip** (< 500). Informational raw chunk-size warning |
| Backend format gate (CI) | `uv run ruff format --check .` | ❌ **BLOCKED** — 3 files would be reformatted, 55 already formatted. All 3 are **untracked** user-WIP test files: `tests/test_ai_adapters.py:76`, `tests/test_ai_providers.py:37`, `tests/test_ai_status_mapping.py:54`. `backend/` untouched by this session |
| Backend lint (advisory CI job) | `uv run ruff check src` | ⚠️ 565 pre-existing findings (advisory `lint-debt` job, not a merge gate); untouched this session |
| Backend tests (tracked suite) | `uv run pytest -q --ignore=tests/test_ai_{adapters,providers,routes,status_mapping}.py` | ✅ **PASS** — 49 passed |
| Backend tests (full) | `uv run pytest -q` | ❌ **BLOCKED** — 1 collection error + 13 failed + 2 errors, all inside 4 **untracked** WIP test files (DEF-014). Not caused by this session's changes (`backend/` untouched) |
| E2E | `npx playwright test --config=e2e/playwright.config.ts --project=chromium` | 🟠 **33 passed / 11 failed** — `automation-controls`, `document-studio`, `n8n-integration`, `full-pipeline`, `scope-filtering` **all pass**; all 11 failures are in `visual-regression.spec.ts` (DEF-013): 1 stale baseline from the new Download button, 10 pre-existing (missing selectors / pointer interception / empty fixtures / unmasked tooltip). Snapshots **not** regenerated |
| ATS latency probe | `X-Scoring-Ms` header on `/api/ai/score-ats` | ❌ **3267 ms, 4893 ms** vs 2500 ms target (DEF-010) |

---

## O. Prioritized Outstanding Work (backlog)

| Priority | Item | Unblocks |
|---|---|---|
| P0 | DEF-005 — make `npm start` boot (emit `dist/server.cjs` as ESM, or stop using `import.meta.url`) | TR-RUN-004; production deploy |
| P0 | DEF-010 — ATS scoring over budget (3.3–4.9 s vs 2.5 s); cache/embed precompute, or drop the second Gemini round-trip on the fallback path | NFR-PERF-001 |
| P0 | DEF-008 — enforce auth on all 9 `/api/*` routes (the frontend already sends `X-API-Key`) | NFR-SEC-001, TR-API-* |
| P0 | DEF-009 — compute a real SHA-256 for `confirmationHash` | FR-RCP-001, NFR-SEC-002 |
| P1 | DEF-014 — land or drop the 4 untracked backend AI test files (fix `ScoreATSPayload` import + `ruff format` the 3 unformatted) | Backend `pytest` + `ruff format` gates green |
| P1 | DEF-013 — regenerate visual baselines + add the 7 missing selectors (or delete dead specs); mask the Recharts tooltip | E2E gate green |
| P1 | DEF-011 — point `frontend/…/N8nIntegration.tsx` and docs §7.1 at `POST /api/webhooks/n8n` | FR-N8N-002 single contract |
| P1 | TR-AI-002 — implement the `gemini-2.5-flash` alias (currently only `gemini-3.8-flash`) | Spec conformance |
| P1 | FR-ATS-002 — auto-tailor trigger for Critical tier | Sourcing → tailoring automation |
| P2 | DEF-012 — validate `href`/`src` schemes (`http:`/`https:`/`mailto:` only) | NFR-SEC-003 residual |
| P2 | NFR-PERF-002 — measure layout switch latency | FR-DOC-002 |
| P2 | FR-SIG-004, FR-LNK-001/004, FR-RCP-002 — interactive + E2E coverage | Sign-off, LinkedIn, receipts |
| P3 | Audit: TR-AI model aliases, NFR-SEC-001 `.env.example`, source list vs FR-SRC-001 enumeration, FR-DOC-006/004 print + section assertions | Spec conformance |
