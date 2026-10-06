# Athena — AI Studio Implementation Forensic Inventory

**Subject:** `C:\Users\jmlus\Downloads\athena-ai-studio-integration`
**Canonical repository:** <https://github.com/jmlus/athena> (`C:\Users\jmlus\athena`)
**Method:** read-only static analysis. No files in either project were modified.
**Inventory date:** 2026-09-26

---

## 1. Complete Directory Tree

29 files total. Not a git repository (no `.git`). No `node_modules`, no `dist`.

```
athena-ai-studio-integration/
├── .env.example                      # 9 lines  — GEMINI_API_KEY, APP_URL
├── .gitignore                        # 8 lines  — ignores .env*, dist/, node_modules/
├── bun.lock                          # 0 bytes  — empty placeholder lockfile
├── index.html                        # 1.4 KB  — SPA shell, Google Fonts, OG meta
├── metadata.json                     # 346 B   — AI Studio app manifest
├── package.json                      # 992 B   — scripts + deps (see §3)
├── README.md                         # 542 B   — stock AI Studio readme + app URL
├── server.ts                         # 27.3 KB / 644 lines — Express BFF + Gemini + static host
├── tsconfig.json                     # 538 B   — ES2022, bundler resolution, noEmit
├── vite.config.ts                    # 708 B   — react + tailwind plugins, `@` alias, HMR guard
├── docs/
│   └── ATHENA_ARCHITECTURE_AND_BRANDING.md   # 6.6 KB — design/brand/functional spec (v2.4.0)
└── src/
    ├── App.tsx                       # 14.3 KB — root component, view switch, cron timers, state
    ├── index.css                     # 1.1 KB  — Tailwind v4 import, fonts, print stylesheet
    ├── main.tsx                      # 231 B   — React 19 createRoot bootstrap
    ├── types.ts                      # 3.7 KB  — all domain types (see §17)
    ├── data/
    │   └── mockData.ts               # 22.0 KB — seed profile, 8+ opportunities, settings, cron state
    └── components/
        ├── charts/
        │   ├── CircularGauge.tsx             # 3.2 KB — radial ATS dial
        │   ├── LayeredMountainChart.tsx      # 12.6 KB — stylized SVG mountain area chart
        │   └── MetricsAndBarChart.tsx        # 10.2 KB — KPI cards + compatibility bar chart
        ├── layout/
        │   ├── LeftSidebar.tsx               # 11.2 KB — nav, scope/category filters, 4h cron widget
        │   └── RightSidebar.tsx              # 11.5 KB — automation rules, sign-off queue, aggregator status
        ├── modals/
        │   └── OpportunityDetailModal.tsx    # 7.6 KB — opportunity detail + ATS pitch
        └── views/
            ├── ApplicantProfileView.tsx      # 13.4 KB — editable applicant dossier
            ├── DocumentStudioView.tsx        # 29.5 KB — resume/cover-letter/proposal generator UI
            ├── FormFillerView.tsx            # 16.9 KB — form auto-fill + human sign-off gate (modal)
            ├── N8nIntegrationView.tsx        # 9.4 KB  — n8n webhook tester + node topology
            ├── PipelineView.tsx              # 14.3 KB — 7-stage kanban pipeline
            ├── ReceiptsView.tsx              # 12.7 KB — receipts ledger + 7-day follow-up draft
            └── ScraperDiscoveryView.tsx      # 15.5 KB — live scrape trigger + filtered discovery
```

---

## 2. Framework and Runtime

| Aspect | Value |
|---|---|
| UI framework | React `^19.0.1` + React DOM `^19.0.1`, TypeScript `^7.0.2` |
| Build/dev tool | Vite `^8.3.0` with `@vitejs/plugin-react` `^6.1.1` |
| Styling | Tailwind CSS `^4.3.3` via `@tailwindcss/vite` (CSS-first `@import "tailwindcss"`), `autoprefixer` present |
| Icons | `lucide-react` `^0.546.0` |
| Animation | `motion` `^12.23.24` declared in `package.json` but **never imported** anywhere in `src/` |
| Backend | Express `^4.21.2` in a single `server.ts`, run under `tsx` (dev) or an esbuild CJS bundle (prod) |
| AI SDK | `@google/genai` `^2.4.0` |
| Module system | ESM (`"type": "module"`); `tsconfig.json` `module: ESNext`, `moduleResolution: bundler` |
| Port | Hard-coded `const PORT = 3000` (`server.ts:13`) bound to `0.0.0.0` (`server.ts:636`) |
| Package manager signal | `bun.lock` present but **empty (0 bytes)**; README instructs `npm install` |
| Type-checking | `npm run lint` → `tsc --noEmit` (only quality gate; no ESLint/Prettier) |

Architecture pattern: **single-process Backend-For-Frontend (BFF)**. In development `server.ts` mounts Vite in `middlewareMode` (`server.ts:620-627`); in production it serves `dist/` with an SPA catch-all (`server.ts:629-634`). The Gemini key therefore never reaches the browser.

---

## 3. package.json Dependencies

`package.json` — name `react-example`, version `0.0.0`, private, ESM.

**Scripts**

| Script | Command |
|---|---|
| `dev` | `tsx server.ts` |
| `build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| `start` | `node dist/server.cjs` |
| `clean` | `rm -rf dist server.js` |
| `lint` | `tsc --noEmit` |

**dependencies**

| Package | Range | Role |
|---|---|---|
| `@google/genai` | ^2.4.0 | Gemini client (server-side only) |
| `@tailwindcss/vite` | ^4.3.3 | Tailwind build plugin |
| `@vitejs/plugin-react` | ^6.1.1 | React fast refresh/build |
| `lucide-react` | ^0.546.0 | Icon set |
| `react` / `react-dom` | ^19.0.1 | UI runtime |
| `vite` | ^8.3.0 | Bundler/dev server |
| `express` | ^4.21.2 | BFF HTTP server |
| `dotenv` | ^17.2.3 | `.env` loading (`server.ts:7`) |
| `motion` | ^12.23.24 | **unused** (no imports in `src/`) |

**devDependencies**: `@types/node` ^22.14.0, `@types/react` ^19.3.0, `@types/react-dom` ^19.3.0, `@types/express` ^4.17.21, `autoprefixer` ^10.4.21, `esbuild` ^0.25.0, `tailwindcss` ^4.3.3, `tsx` ^4.21.0, `typescript` ^7.0.2.

Note: build tooling (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`) sits in **dependencies**, not devDependencies — a deliberate AI Studio convention so `npm install --production` still builds.

---

## 4. Application Entry Points

1. **Client:** `index.html:18` → `<script type="module" src="/src/main.tsx">` → `src/main.tsx:6-10` renders `<StrictMode><App/></StrictMode>` into `#root`.
2. **Client root component:** `src/App.tsx:50` `export default function App()`.
3. **Server:** `server.ts:641-644` — `start()` is invoked at module load; boots Express with either Vite middleware or static hosting and listens on `:3000`.
4. **Production entry:** `dist/server.cjs` (esbuild CJS bundle of `server.ts`).

---

## 5. Routes / Pages

**There is no URL router.** No `react-router` (or any router) dependency exists. Navigation is a `useState<NavView>` switch in `src/App.tsx:52`, rendered by the `{currentView === ... && <View/>}` chain at `App.tsx:238-318`.

`NavView` union defined at `src/components/layout/LeftSidebar.tsx:20-27`:

| View id | Label (nav badge) | Component rendered | Notes |
|---|---|---|---|
| `pipeline` | Pipeline & Command | `PipelineView` | + `LayeredMountainChart`, `MetricsAndBarChart` |
| `scraper` | Scraper & Discovery (Live) | `ScraperDiscoveryView` | + charts; calls `/api/ai/scrape-live` |
| `documents` | Pristine Document Studio (1/2 Col) | `DocumentStudioView` | calls `/api/ai/tailor-resume`, `/api/ai/tailor-document` |
| `form_filler` | Online Forms & Sign-Off (Auth) | inline placeholder card (`App.tsx:283-305`) that opens the `FormFillerView` modal | modal also opened from right sidebar / pipeline |
| `receipts` | Receipts & Follow-ups | `ReceiptsView` | |
| `n8n` | n8n Workflow Nodes (Plus) | `N8nIntegrationView` | calls `/api/webhooks/n8n` (see §7 mismatch) |
| `profile` | Applicant Skills & Profile | `ApplicantProfileView` | |

**Overlays:** `OpportunityDetailModal` (`App.tsx:333-343`) and `FormFillerView` full-screen sign-off modal (`App.tsx:346-353`).

Charts are shown only for `pipeline` and `scraper` (`App.tsx:216-235`).

---

## 6. Components

### Layout
- `LeftSidebar` — brand header, scope filters (All / Lilongwe Local / Lilongwe Remote Hub / International Remote), category toggle (All/Jobs/Consultancies), 7-item module nav, **4-Hour Cron Crawlers widget** with two countdown bars and "Execute 4h Cycle Now" (`LeftSidebar.tsx:215-275`).
- `RightSidebar` — "Autonomous Controls": ATS ≥ 90 auto-generate toggle, ATS 80–89 auto-flag (read-only/on), Dehumanizer toggle; **Human Sign-Off Gate queue** listing `awaiting_signoff` opportunities; aggregator ingress status (LinkedIn/Upwork/ReliefWeb/Devex "SYNCED"); n8n pipeline hook pill; `ATHENA v2.4` footer (`RightSidebar.tsx`).

### Charts
- `CircularGauge` — radial ATS score dial (used by `PipelineView`, `ScraperDiscoveryView`).
- `LayeredMountainChart` — hand-built SVG layered mountain area chart with scope selection (`LayeredMountainChart.tsx`).
- `MetricsAndBarChart` — KPI cards (Critical Matches / Flagged / Awaiting Sign-Off / Submitted) plus a horizontal compatibility bar chart with a "n8n & Workflow Automation" row (`MetricsAndBarChart.tsx:23`).

### Views
- `PipelineView` — 7-stage board over `PipelineStatus`, per-stage color map, search box, per-card actions (details / tailor documents / sign-off / receipt), `CircularGauge` per card.
- `ScraperDiscoveryView` — scope/category/platform filters, keyword box, "Execute Live Scrape" → `POST /api/ai/scrape-live`, merge of new listings with derived status (`status = atsScore >= 90 ? "tailored" : "evaluated"`, `ScraperDiscoveryView.tsx:75-81`).
- `DocumentStudioView` — tabs `resume | cover_letter | proposal`, one-column/two-column layout switch, Dehumanizer active toggle, "Regenerate" (Gemini), `window.print()`, copy-as-markdown; renders print-optimized resume/proposal papers.
- `FormFillerView` — auto-filled identity/compensation/screening fields, document manifest, **mandatory authorization checkbox + typed legal signature**, `POST /api/submit-application`, local fallback receipt on failure (`FormFillerView.tsx:115-132`).
- `ReceiptsView` — receipt list + certificate panel (receipt id, timestamp/portal, signatory, confirmation hash), 7-day follow-up box with generated/copyable follow-up email draft.
- `N8nIntegrationView` — editable webhook URL + JSON payload tester, 5-node visual topology (Cron → Scraper → Gemini ATS → Switch gate → Human gate), execution response panel.
- `ApplicantProfileView` — editable dossier: identity, Lilongwe hub address, hourly USD rate, monthly MWK expectation, skill keywords, "Uploaded Background Documents" list (display-only).

### Modals
- `OpportunityDetailModal` — full opportunity detail, matched/missing skills, "Dehumanized Organic Candidate Pitch", actions into Document Studio / Sign-Off.

---

## 7. API Endpoints

All implemented in `server.ts`. Base: same origin, port 3000, `express.json({ limit: "15mb" })` (`server.ts:15`).

### Server-defined

| Method | Path | Handler | Behavior |
|---|---|---|---|
| GET | `/api/health` | `server.ts:32` | `{status, hasApiKey, timestamp}` |
| POST | `/api/ai/score-ats` | `server.ts:41` | Gemini ATS scoring → `{atsScore, matchCategory, matchedSkills, missingSkills, strengths, recommendation, dehumanizedPitch}`; deterministic fallback when no key (`server.ts:46-65`) |
| POST | `/api/ai/tailor-resume` | `server.ts:114` | Gemini resume tailoring → `{tailoredResume}`; full canned fallback (`server.ts:119-179`) |
| POST | `/api/ai/tailor-document` | `server.ts:245` | Gemini cover-letter / executive-summary / consultancy-proposal → `{document}`; canned fallbacks per docType |
| POST | `/api/ai/dehumanize` | `server.ts:360` | Gemini "AI-tell purge" → `{humanizedText, flaggedWordsRemoved, confidenceScore}`; regex fallback (`server.ts:365-376`) |
| POST | `/api/ai/scrape-live` | `server.ts:415` | Gemini-synthesized listings → `{listings, timestamp}`; falls back to 6 hard-coded listings (`server.ts:470-563`) |
| POST | `/api/n8n/dispatch-webhook` | `server.ts:571` | Simulated n8n execution receipt (`executionId`, `nodesProcessed[]`, `receipt`) — **never called by the UI** |
| POST | `/api/submit-application` | `server.ts:595` | Requires `authorizationSignature` else 400; returns `{status:"SUBMITTED", receiptId, confirmationHash, nextFollowUpDate, ...}` |

### Client-called (`fetch` sites in `src/`)

| Call site | Method | Path |
|---|---|---|
| `DocumentStudioView.tsx:125` | POST | `/api/ai/tailor-resume` |
| `DocumentStudioView.tsx:141` | POST | `/api/ai/tailor-document` |
| `ScraperDiscoveryView.tsx:61` | POST | `/api/ai/scrape-live` |
| `FormFillerView.tsx:81` | POST | `/api/submit-application` |
| `N8nIntegrationView.tsx:44` | POST | `/api/webhooks/n8n` |

### ⚠ Contract defects (verified by source inspection)

1. **Route mismatch:** the UI posts to `/api/webhooks/n8n` (`N8nIntegrationView.tsx:17,44,166`), but the server only defines `/api/n8n/dispatch-webhook` (`server.ts:571`). The request falls through to the Vite/SPA catch-all and returns HTML → `res.json()` throws; the view then surfaces `{"error": ...}`.
2. **Dead endpoints:** `/api/ai/score-ats`, `/api/ai/dehumanize`, `/api/health`, `/api/n8n/dispatch-webhook` have no frontend caller. ATS scores displayed in the UI come from mock data or from `scrape-live` synthesized values, never from the scoring endpoint.
3. **Spec drift:** `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md:78` documents an inbound n8n endpoint at `/api/webhooks/n8n` — the spec matches the client, the server does not.

---

## 8. AI / LLM Integrations

- **SDK:** `@google/genai` (`GoogleGenAI`) constructed lazily in `getGeminiClient()` (`server.ts:18-29`) from `process.env.GEMINI_API_KEY`, with `httpOptions.headers["User-Agent"] = "aistudio-build"`. Returns `null` when the key is absent → every endpoint degrades to a deterministic/canned response.
- **Model:** `"gemini-3.8-flash"` hard-coded in all four generation calls (`server.ts:98, 229, 344, 399, 453`).
- **Output mode:** `config: { responseMimeType: "application/json" }` then `JSON.parse(response.text || "{}")` — no schema validation, no retry, no streaming.
- **Prompt inventory (all inline template literals in `server.ts`):**
  - ATS evaluator prompt with tiering rules ≥90 / 80–89 / <80 and a strict JSON schema (`server.ts:67-95`).
  - Executive resume-writer prompt incl. "CRITICAL DEHUMANIZING INSTRUCTION" block listing banned words (`server.ts:182-226`).
  - Career-strategist/ghostwriter prompt for cover-letter/consultancy-proposal/executive-summary with banned-trope rules (`server.ts:307-341`).
  - "World-class editor … Dehumanizing" prompt returning `{humanizedText, flaggedWordsRemoved, confidenceScore}` (`server.ts:379-396`).
  - Listing-synthesis prompt requesting 4 realistic listings across named platforms with a fixed field list (`server.ts:425-450`).
- **Client-side AI:** none. All LLM traffic is server-side; `src/` contains no AI SDK imports.
- **Embeddings/vector search:** none.
- `Type` is imported from `@google/genai` (`server.ts:5`) but never used — schemas are expressed as prompt text only.

---

## 9. Agent / Orchestration Architecture

There is **no backend agent runtime and no real job scheduler**. Orchestration is UI-side simulation plus thresholds:

1. **4-hour cron simulation** — a 1-second `setInterval` in `App.tsx:72-96` decrements `jobSecondsRemaining` / `consultancySecondsRemaining` from 14400; at zero it resets and fires a toast via `triggerCronRefresh()` (`App.tsx:98-101`). State lives in `CronScheduleState` (seed `mockData.ts:508`). "Execute 4h Cycle Now" only resets counters (`App.tsx:103-112`) — **no network call**.
2. **Autonomous rule thresholds** (`AutomationSettings`, `types.ts:131-143`): `autoCreateThreshold: 90`, `flagThresholdMin: 80`, `flagThresholdMax: 89`, `autoCreateResumeCoverLetter`, `autoCreateProposalExecSummary`, `dehumanizeEnabled`, `n8nWebhookUrl`, `n8nActive`, `soundAlerts`. Enforced only through derived UI state (e.g. `ScraperDiscoveryView.tsx:78-80`).
3. **Pipeline state machine** — `PipelineStatus = discovered | evaluated | tailored | awaiting_signoff | submitted | interview | offer` (`types.ts:4-11`), advanced by user actions in `App.tsx:115-119`.
4. **Human-in-the-loop sign-off gate** — `FormFillerView` blocks submission until the authorization checkbox and typed signature are present (`FormFillerView.tsx:66-75`), and the server re-checks `authorizationSignature` (`server.ts:598-600`). This is the only enforced governance gate.
5. **n8n orchestration (simulated)** — visual 5-node topology + payload tester in `N8nIntegrationView`; server-side dispatcher is a stub that fabricates `nodesProcessed` timings (`server.ts:575-591`). No n8n library, no outbound webhook calls.
6. **No** Playwright/browser automation, no APScheduler/cron on the server, no message bus, no agent loop.

---

## 10. Database / Storage Implementation

**None.** Zero persistence:

- No SQL/NoSQL client, no ORM, no filesystem writes, no `localStorage`/`sessionStorage` (grep-verified across `src/` and `server.ts`).
- All domain data originates from `src/data/mockData.ts`: `initialApplicantProfile` (:3), `initialOpportunities` (:76), `defaultSettings` (:494), `initialCronState` (:508).
- Runtime state is React `useState` in `App.tsx` (opportunities, profile, settings, cron, receipts attached to opportunities). **All state resets on page reload.**
- Generated documents exist only in component state; export is via clipboard/copy and `window.print()` (PDF through the browser print dialog, `index.css:35-54`).
- The only server-side memory is `process.env` and the per-request Gemini responses.

---

## 11. Authentication / Authorization

- **No user authentication**: no login, session, JWT, cookie, OAuth, roles, or API-key requirement on any endpoint. Every route is anonymously reachable.
- **Human authorization gate (the project's only authorization control):**
  - Client: checkbox + typed legal signature required before submit (`FormFillerView.tsx:66-75, 306-347`), with a displayed audit token `SHA256-SIGN-…`.
  - Server: rejects submissions without `authorizationSignature` with HTTP 400 (`server.ts:598-600`).
  - Result: receipt carries `authorizedBy` / `authorizedAt`.
- **Key handling:** `GEMINI_API_KEY` is read only in `server.ts` — never exposed to the client bundle (server-side key pattern declared as `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` in `metadata.json:5`).
- **CSP/security headers:** none set by Express; `X-Frame-Options`/CSP are whatever the AI Studio host injects.
- PII note: mock profile contains a full name, phone, email and address (fictional persona "Chifuniro Phiri") used as the default signature.

---

## 12. Environment Variables

From `.env.example` (documented) and code inspection:

| Variable | Read at | Purpose | Documented |
|---|---|---|---|
| `GEMINI_API_KEY` | `server.ts:19` | Gemini auth; absence triggers all fallbacks | ✅ `.env.example:4` |
| `APP_URL` | not read by any source file | "URL where this applet is hosted" (AI Studio-injected) | ✅ `.env.example:9` |
| `DISABLE_HMR` | `vite.config.ts:17,19` | Disables Vite HMR + file watching during agent edits | ❌ (comment only) |
| `NODE_ENV` | `server.ts:621` | `production` → static `dist/`; else Vite middleware | ❌ |

Loading: `dotenv.config()` at `server.ts:7` (reads `.env` from CWD); `.gitignore` excludes `.env*` except `.env.example`. AI Studio injects `GEMINI_API_KEY` from its Secrets panel at runtime (per `.env.example:1-3`). No `.env.local` exists in this copy.

---

## 13. External Services

| Service | Integration status |
|---|---|
| **Google Gemini API** (`generativelanguage` via `@google/genai`) | **Real** — sole live integration |
| Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) | **Real** — Cinzel, Plus Jakarta Sans, Lora loaded in `index.html:12-14` |
| **AI Studio hosting** (Cloud Run) | **Real** — app URL in `README.md:9`; env injection per `.env.example` |
| LinkedIn, Upwork, ReliefWeb, Devex, MyJobo, corporate portals | **Simulated** — named in prompts, mock data and UI badges; no HTTP calls, no scrapers |
| n8n | **Simulated** — UI tester + stub dispatcher; default URL `https://n8n.athena-ops.internal/...` (`server.ts:579`) and `https://n8n.athena-core.internal/...` (`mockData.ts:503`) are non-routable placeholders |
| Email / WhatsApp notification | **Simulated** — node label only (`server.ts:585`) |
| Payment/rate benchmarking ($450–650/day) | Hard-coded copy, no integration |

---

## 14. Build System

- **Dev:** `npm run dev` → `tsx server.ts` → Express + Vite middleware (`server.ts:620-627`), HMR unless `DISABLE_HMR=true` (`vite.config.ts:14-20`).
- **Build:** `npm run build` → (a) `vite build` → `dist/` static assets; (b) `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.
- **Run:** `npm start` → `node dist/server.cjs` with `NODE_ENV` unset ⇒ note that `server.ts:621` checks `process.env.NODE_ENV !== "production"`, so `npm start` as written still takes the dev branch unless `NODE_ENV=production` is exported.
- **Type-check:** `npm run lint` → `tsc --noEmit` (no ESLint).
- **Clean:** `npm run clean`.
- Path alias `@/* → ./*` in both `tsconfig.json:19-23` and `vite.config.ts:10-12`.
- `tsconfig`: `target ES2022`, `jsx: react-jsx`, `isolatedModules`, `allowImportingTsExtensions`, `noEmit`, `skipLibCheck`.
- No test runner, no bundler analysis, no code splitting/CI checks.

---

## 15. Deployment Configuration

- **Host:** Google AI Studio app export. `metadata.json` declares name/description and `majorCapabilities: ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`; `requestFramePermissions: []`.
- **Live app:** <https://ai.studio/apps/a1fd22b1-579b-428f-aade-5f940703b0be> (`README.md:9`).
- **Runtime model:** AI Studio builds and runs the Node app, injecting `GEMINI_API_KEY` and `APP_URL`; single container, single port 3000.
- **Absent:** no `Dockerfile`, no `docker-compose.yml`, no CI (`.github/`), no nginx, no process manager, no health-based deploy gate, no deployment scripts, no lockfile integrity (empty `bun.lock`).

---

## 16. Tests

**None.** No `*.test.*` / `*.spec.*` files, no test runner dependency (no vitest/jest), no `test` script in `package.json`, no CI to execute tests. The only verification available is `tsc --noEmit`.

---

## 17. Type Definitions / Interfaces

All in `src/types.ts` (single file, no `enum` keywords — string-literal unions):

| Name | Kind | Notes |
|---|---|---|
| `OpportunityScope` | union | `lilongwe-local \| lilongwe-remote \| international-remote` (`types.ts:1`) |
| `OpportunityCategory` | union | `job \| consultancy` (:2) |
| `OpportunityPlatform` | union | LinkedIn, Upwork, ReliefWeb, Corporate, Devex, MyJobo (:3) |
| `PipelineStatus` | union | 7 stages: `discovered → offer` (:4-11) |
| `ApplicationReceipt` | interface | receiptId, confirmationHash, submittedAt, portalName, followUpDate, status union (:13-26) |
| `Opportunity` | interface | listing + `atsScore`, `isFlagged`, matched/missing skills, `dehumanizedPitch`, `autoCreatedDocs`, tailored docs, `receipt`, `formFields` (:28-58) |
| `ApplicantProfile` | interface | identity, skills, experience, education, certifications, `hourlyRateUsd`, `expectedMonthlyMwk`, `legalAuthorizedSigner` (:60-84) |
| `TailoredResume` | interface | resume JSON contract incl. `layout: "one-column" \| "two-column"` (:86-111) |
| `TailoredDocument` | interface | cover-letter/executive-summary/consultancy-proposal contract (:113-129) |
| `AutomationSettings` | interface | thresholds, schedule hours, auto-create flags, dehumanizer, n8n fields (:131-143) |
| `CronScheduleState` | interface | countdowns, last/next run, active flag, `totalAutomationsToday` (:145-154) |

Additional local types: `NavView` (`LeftSidebar.tsx:20-27`), prop interfaces per component. Server responses are **untyped** — `server.ts` returns raw JSON with no shared schema; the client uses `any` (`DocumentStudioView.tsx:135,152`, `ScraperDiscoveryView.tsx:72`).

---

## 18. Important Configuration Files

| File | Purpose |
|---|---|
| `package.json` | scripts + dependency manifest (name still `react-example`) |
| `tsconfig.json` | ES2022/bundler/noEmit, `@/*` paths, `types: ["vite/client"]` |
| `vite.config.ts` | react + tailwind plugins, `@` alias, `DISABLE_HMR` guard with "Do not modify" comment |
| `index.html` | SPA shell, SEO/OG tags, Google Fonts preconnect + Cinzel/Plus Jakarta Sans/Lora |
| `metadata.json` | AI Studio app manifest (name, description, server-side Gemini capability) |
| `.env.example` | `GEMINI_API_KEY`, `APP_URL` with AI Studio injection notes |
| `.gitignore` | `node_modules/ build/ dist/ coverage/ *.log .env*` (keeps `.env.example`) |
| `bun.lock` | empty placeholder (0 bytes) |
| `README.md` | stock AI Studio "Run and deploy your AI app" instructions |
| `docs/ATHENA_ARCHITECTURE_AND_BRANDING.md` | 90-line brand + functional spec: color tokens (Navy `#070A40`, Red `#E63946`, Cyan `#00BFFF`, Orange `#F97316`), typography, ATS tiers, human sign-off doctrine, n8n endpoint, "Version 2.4.0 (2026)" |

---

## 19. Assets

- **No local static assets**: no `public/` directory, no images, no favicon (browser default), no SVG/JSON data files.
- **Remote assets:** Google Fonts stylesheet (`index.html:14`) and the AI Studio share banner image in `README.md:3`.
- **Generated at runtime:** resume/proposal documents rendered as HTML for print (`index.css` print block: `.resume-paper`, `.proposal-paper`, `.no-print`); all charts are inline SVG/CSS (no chart library).
- **Mock corpus:** `src/data/mockData.ts` acts as the seed asset — applicant dossier, 8+ curated opportunities (USAID Malawi, AfriPay, UNDP Malawi, Upwork Enterprise n8n consultancy, SunEnergy…), settings and cron seeds.
- **Fonts in code:** `font-brand` = Cinzel, `font-serif-heading` = Lora, body = Plus Jakarta Sans (`index.css:3-17`).

---

## Cross-references

- Capability-by-capability comparison with the canonical repository: [`ATHENA_IMPLEMENTATION_COMPARISON.md`](./ATHENA_IMPLEMENTATION_COMPARISON.md).
