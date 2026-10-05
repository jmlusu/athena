# Spec: Real Data Pipeline (Scrape Button → Live Jobs → Real ATS Scores)

Status: **Implemented — verified 2026-10-03** (spec written pre-implementation; two of
its assumptions were wrong and are corrected inline, see Level 3 and Q3)
Author: agent
Date: 2026-10-03
Supersedes: nothing
Related: README.md "Project Status" (both ⏳ items this closes), ARCHITECTURE.md

---

## Problem

`README.md` claims "API client + frontend data loading wired". It is not. Three breaks in series:

1. **The BFF does not proxy `/api/v1/athena/*`.** `server.ts` registers `/api/health`,
   `/api/backend-health`, `/api/lock/*`, `/api/ai/*`, `/api/submit-application`,
   `/api/n8n/dispatch-webhook`, `/api/webhooks/n8n` — and nothing else. Every
   `api.listJobs()` / `listProfiles()` / `triggerScrape()` / `scoreJob()` call falls
   through to the SPA catch-all and receives `Content-Type: text/html`.
2. **`api.ts` cannot parse that.** `request()` calls `res.json()` on HTML at `api.ts:50`,
   which throws. `App.tsx:93` catches it, logs `Failed to load backend data, using mock`,
   and the entire UI renders `src/data/mockData.ts`. The Pipeline kanban shows 8 fake rows
   while 138 real jobs sit in `company/athena/jobs.jsonl`.
3. **Both scrape buttons bypass `api.triggerScrape` entirely** and hand-roll
   `fetch("/api/ai/scrape-live")` (`App.tsx:111`, `ScraperDiscoveryView.tsx:61`). That route
   lands on `provider.synthesize_listings()` (`backend/src/athena/api/ai_routes.py:116`),
   which with no Gemini key loaded returns a hardcoded fallback list — ids
   `job-mw-101`, `job-mw-102`, `job-intl-103`, with invented `atsScore` values of 94, 91, 93.

Net effect: the UI never displays real data, and the scrape button reports success while
scraping nothing.

---

## Objective

Make the frontend display real backend data end to end, and make the scrape triggers run
the real scraper.

**User story.** As the operator, when I click "Execute 4h Cycle Now", I want real jobs from
real job boards to appear in my pipeline with their real ATS and semantic-fit scores, so I
can trust what the dashboard tells me.

**Acceptance criteria** (see Success Criteria for the testable form):

- Pipeline renders jobs read from `company/athena/jobs.jsonl` via the API, not `mockData.ts`.
- Both scrape triggers POST to `/api/v1/athena/scrape` and surface the backend's real
  `jobs_found` / `jobs_new` counts.
- `ats_score` and `match_score` reach the gauges, the ATS filters, and the right sidebar.
- New jobs appear in the kanban without a page reload.
- A backend outage produces a visible error state, not a silent fall back to fake data.

**Explicitly out of scope.** ATS band recalibration (≥90 auto-generate, 80-89 flagged) stays
as-is; real scores currently top out at 57.5 so those filters will legitimately return zero
rows until better-matched jobs are scraped. Scorer weights, the `mockData.ts` file itself,
the n8n path, and the sign-off/receipt flow are untouched.

---

## Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Frontend | React + TypeScript + Vite | 19 / 7.0 / 8.3 |
| Styling | Tailwind CSS | 4.3 |
| BFF | Express + tsx | 4.21 |
| Backend | FastAPI + Pydantic + APScheduler | Python 3.12 |
| Storage | JSONL + file locks (no DB) | — |
| E2E | Playwright | 1.63 |

No new npm or pip dependencies. BFF unit tests use the Node built-in `node:test` runner.

---

## Commands

```powershell
# Backend (port 8000)
cd backend
uv run uvicorn athena.api.app:app --host 127.0.0.1 --port 8000

# Frontend + BFF (port 3000)
npm run dev

# Type-check (the only existing frontend gate)
npm run lint

# Build client + server bundle
npm run build

# BFF unit tests (new)
npm run test:unit

# E2E
npm run test:e2e

# Backend tests — must not regress from 88 passing
cd backend
uv run pytest -q
uv run ruff check .
```

---

## Project Structure

```
server.ts                     → Express BFF. Gains the /api/v1/athena/* proxy + Job→Opportunity mapper.
src/
  api.ts                      → API client. Fixes triggerScrape contract + jobs limit cap.
  types.ts                    → OpportunityPlatform widened; ATS band constants.
  App.tsx                     → runCronCycle switches to api.triggerScrape; real data-load error state.
  components/
    views/ScraperDiscoveryView.tsx → handleExecuteLiveScrape switches to api.triggerScrape.
    views/PipelineView.tsx    → unchanged (contract satisfied by the mapper).
tests/
  server/                     → NEW. node:test unit tests for the mapper + proxy.
e2e/                          → Playwright specs. Gains a real-data pipeline spec.
docs/specs/                   → This document.
tasks/                        → plan.md + todo.md (Phase 2 / 3 output).
```

Unchanged: `backend/src/athena/**`, `backend/tests/**`.

---

## Design

### D1. BFF proxies `/api/v1/athena/*`

Add a method-aware proxy ahead of the SPA catch-all:

| BFF route | Backend route | Transform |
|---|---|---|
| `ALL /api/v1/athena/jobs` | `/api/v1/athena/jobs…` | jobs array → `Opportunity[]` |
| `ALL /api/v1/athena/profiles` | `/api/v1/athena/profiles…` | profile → `ApplicantProfile` |
| `POST /api/v1/athena/scrape` | `/api/v1/athena/scrape` | none (`ScrapeJob` passes through) |
| `POST /api/v1/athena/process` | `/api/v1/athena/process` | none |
| `GET /api/v1/athena/score/:j/:p` | same | ATS response → `ATSScoreResponse` |
| `GET /api/v1/athena/stats*` | same | pass through |

The proxy must: inject `X-API-Key`; forward query strings verbatim; apply the existing
`camelCaseKeys` on the way out; keep the existing `BACKEND_TIMEOUT_MS` abort behaviour and
its 502/504 error bodies. A generic `app.use("/api/v1/athena", …)` handler is preferred over
enumerating each path — the backend already owns validation, and duplicating its route table
in the BFF is how the current drift happened.

**Registration order matters.** The handler must be registered before the static/SPA
fallback or it will never be reached.

`GET /jobs?limit=…` is capped at 100 by the backend's Pydantic validator; exceeding it returns
422. The client must respect the cap rather than have the BFF silently clamp, so a bad limit
surfaces during development instead of quietly returning partial data.

### D2. `Job` → `Opportunity` mapping (BFF-owned)

Two distinct scales exist and must not be conflated:

- **`ats_score`** — ATS fit index, 0-100. Drives `Opportunity.atsScore` and the UI bands.
- **`match_score`** — semantic fit, 0-100. Drives `match_tier` via `MatchTier`
  (`excellent` ≥90, `good` 80-89, `fair` 70-79, `poor` <70). The current data is 96 poor /
  42 fair, consistent with match scores of 55.3-78.1.

Field mapping:

| `Opportunity` | Source | Fallback |
|---|---|---|
| `id` | `id` | — |
| `title` | `title` | `"Untitled role"` |
| `company` | `company` | `"Unknown employer"` |
| `location` | `location` | `"Not specified"` |
| `category` | `job_type === "consultancy"` | `"job"` |
| `scope` | derived from `location` (D3) | `"international-remote"` |
| `platform` | `source` via `SOURCE_PLATFORM` (D3) | `"Corporate"` |
| `description` | `description` | `""` |
| `requirements` | `requirements` | `[]` |
| `salaryOrBudget` | `salary_range` | `"Not disclosed"` |
| `deadline` | `expiry_date` | `""` |
| `atsScore` | `ats_score` | `0` |
| `postedDate` | `posted_date` | `scraped_at` |
| `status` | `STATUS_MAP` (D3) | `"discovered"` |
| `isFlagged` | `atsScore >= 80 && atsScore < 90` | `false` |
| `matchedSkills` / `missingSkills` | not carried by `Job` | left `undefined` |

`Job.application_url`, `keywords`, `benefits`, `company_website` have no `Opportunity` field.
`application_url` is preserved on the wire but not surfaced; a later spec may add it.

### D3. Enum mapping tables

**`JobSource` → `OpportunityPlatform`.** `OpportunityPlatform` is currently
`LinkedIn | Upwork | ReliefWeb | Corporate | Devex | MyJobo`, but `JobSource` has 16 members
and the live data contains `remote_ok` and `freelancer`, which are not in the union. The union
is widened to cover every `JobSource` member; `JobSource` is the authority.

| `JobSource` | `OpportunityPlatform` |
|---|---|
| `linkedin` | `LinkedIn` |
| `indeed` | `Indeed` |
| `glassdoor` | `Glassdoor` |
| `upwork` | `Upwork` |
| `toptal` | `Toptal` |
| `freelancer` | `Freelancer` |
| `guru` | `Guru` |
| `people_per_hour` | `PeoplePerHour` |
| `remote_ok` | `RemoteOK` |
| `we_work_remotely` | `WeWorkRemotely` |
| `remote_co` | `Remote.co` |
| `malawi_jobs` | `MyJobo` |
| `malawi_work` | `MalawiWork` |
| `jobs_malawi` | `JobsMalawi` |
| `company_career` | `Corporate` |
| `other` | `Other` |
| *(unrecognised)* | `Corporate` |

`ReliefWeb` and `Devex` stay in the union because `mockData.ts` still emits them, but neither
is a `JobSource` member — `reliefweb` is named in `README.md` yet absent from the Python enum.
Treated as `other` until the backend adds them.

**`JobStatus` → `PipelineStatus`.** The backend has 10 states, the frontend 7.

| `JobStatus` | `PipelineStatus` |
|---|---|
| `new` | `discovered` |
| `fetched`, `matched` | `evaluated` |
| `scored` | `tailored` |
| `flagged` | `awaiting_signoff` |
| `applied` | `submitted` |
| `interview` | `interview` |
| `offer` | `offer` |
| `rejected`, `archived` | `evaluated` — see Open Questions Q1 |

### D4. Frontend triggers call the real endpoint

`api.triggerScrape` is corrected to the backend's actual contract:

```
query           string    search text (from the view's keyword box)
location        string?   scope filter
job_type        string?   category filter
max_results     integer   default 100
sources         string[]? source allowlist
user_profile_id string?   profile to score against
```

It currently sends `location_filter`, `search_type`, `keywords`, `resume_skills`, which the
backend ignores.

Both call sites stop hand-rolling `fetch` and use `api.*`:

- `App.tsx runCronCycle` — maps `type` (`job` | `consultancy` | `all`) to `job_type`, then
  `api.triggerScrape` → `api.processJobs` → reload jobs → toast the real counts.
- `ScraperDiscoveryView.handleExecuteLiveScrape` — same chain, seeded from `activeScope`,
  `activeCategory`, `searchKeywords`.

The scrape-then-process-then-reload chain exists because `/scrape` writes unscored jobs: it
returns a `ScrapeJob` record, and scoring only happens via `POST /process`. Without the
`process` step, new jobs land with `ats_score = null`.

The `listings`/`data.listings` branch, the `scraped-${Date.now()}-${i}` synthetic ids, and the
`"Scraper completed query using local live index"` catch-all message are deleted. New jobs
arrive through the normal data reload, so no synthetic ids are needed.

### D5. Client pages to a 200-job cap

The backend's `/jobs` validator caps `limit` at 100 (`422`, `le: 100`). 138 real jobs exist,
so a single page hides 38. The dashboard should show 200 opportunities without widening the
backend's public API, so the **client** pages:

- `api.listJobs` requests `limit=100` per page and follows `offset` until it has 200 rows or
  the backend returns a short page.
- A module-level constant `JOB_PAGE_LIMIT = 100` and `JOB_LOAD_CAP = 200` hold the numbers.
- The two page requests run concurrently via `Promise.all` — `total` from page 1 decides
  whether page 2 is needed, so the common case (≤100 jobs) stays at one request.

The backend validator is deliberately **not** relaxed. `limit ≤ 100` is the backend's
contract; a client that needs more rows should page, not renegotiate. If pagination proves
noisy in practice, raising the validator is a separate, explicit decision.

### D6. Real data-load failures are visible

`App.tsx:93`'s silent `console.warn` + mock fallback is what hid this bug. Replaced with
state: on failure the app renders a persistent error banner naming the failing call and the
backend URL, and keeps whatever data it already had. `mockData.ts` stays as the initial
value for `opportunities` so first paint is not empty, but it is no longer a silent fallback
for a failed fetch.

---

## Code Style

Match `server.ts`: 2-space indent, double quotes, semicolons, `const` over `let`, explicit
return types on exported functions, and comments that explain *why* rather than restate the
code. No default exports in `server.ts` (CommonJS-ish module, single instance).

```ts
// FastAPI's Job is snake_case and thin; the SPA's Opportunity is camelCase and
// presentation-ready. The BFF owns the widening so no view has to know both shapes.
const SOURCE_PLATFORM: Record<string, OpportunityPlatform> = {
  linkedin: "LinkedIn",
  upwork: "Upwork",
  malawi_jobs: "MyJobo",
  malawi_work: "MyJobo",
  jobs_malawi: "MyJobo",
  indeed: "Devex",
  glassdoor: "Devex",
  company_career: "Corporate",
};

const STATUS_MAP: Record<string, PipelineStatus> = {
  new: "discovered",
  fetched: "evaluated",
  matched: "evaluated",
  scored: "tailored",
  flagged: "awaiting_signoff",
  applied: "submitted",
  interview: "interview",
  offer: "offer",
};

// Lilongwe-local only when the location names Lilongwe; a Lilongwe role that is
// remote is lilongwe-remote; anything else is international-remote.
function deriveScope(location: string): OpportunityScope {
  const text = location.toLowerCase();
  if (!text.includes("lilongwe")) return "international-remote";
  return text.includes("remote") ? "lilongwe-remote" : "lilongwe-local";
}

export function toOpportunity(job: Record<string, unknown>): Opportunity {
  const location = str(job.location) || "Not specified";
  const atsScore = num(job.ats_score);
  return {
    id: str(job.id),
    title: str(job.title) || "Untitled role",
    company: str(job.company) || "Unknown employer",
    location,
    category: job.job_type === "consultancy" ? "consultancy" : "job",
    scope: deriveScope(location),
    platform: SOURCE_PLATFORM[str(job.source)] ?? "Corporate",
    description: str(job.description),
    requirements: strArray(job.requirements),
    salaryOrBudget: str(job.salary_range) || "Not disclosed",
    deadline: str(job.expiry_date),
    atsScore,
    postedDate: str(job.posted_date) || str(job.scraped_at),
    status: STATUS_MAP[str(job.status)] ?? "discovered",
    isFlagged: atsScore >= 80 && atsScore < 90,
  };
}
```

`str`, `num`, `strArray` are tiny local coercers. They exist because the JSONL store is
hand-editable and has produced `null` in optional fields before; a mapper that assumes
well-formed input reintroduces the crash it is meant to prevent.

---

## Testing Strategy

**Level 1 — BFF unit tests** (`tests/server/*.test.ts`, `node:test`, new
`npm run test:unit`). Highest value here, because the mapper is where silent data corruption
lives.

- `toOpportunity` maps every field; falls back correctly on `null`/missing/`""`.
- `deriveScope` for `Lilongwe`, `Lilongwe (100% Remote)`, `Remote`, `""`.
- `SOURCE_PLATFORM` covers all 16 `JobSource` members; unknown source → `Corporate`.
- `STATUS_MAP` covers all 10 `JobStatus` members.
- Pagination: 138 stored jobs yields exactly 2 requests (100 + 38) and 138 assembled rows;
  40 stored jobs yields 1 request. Asserts `limit` never exceeds 100 in any request.
- Serializer never emits `undefined` into a required field.
- Regression: a fixture shaped like the real `job-mw-101` fallback payload is rejected by
  the mapper's contract (proves the fake path cannot silently reappear).

**Level 2 — E2E** (`e2e/`, Playwright). Extend the existing config.

- Pipeline renders ≥100 cards and no console error.
- Clicking "Execute 4h Cycle Now" issues `POST /api/v1/athena/scrape`; assert the request
  body contains `query` and not `location_filter`.
- `atsScore` on a card equals the backend's `ats_score` for that job id.
- Backend down → error banner, no mock fallback.

**Level 3 — Backend** (`uv run pytest -q`). No backend source changes, so this is a
regression gate only: must stay at 88 passing.

> **Correction (found during implementation).** This spec originally also required
> `uv run ruff check .` to stay clean. It is not clean: the baseline is **237
> pre-existing errors** across `automation/submitter`, `ai/providers/fallback`,
> `documents/humanizer`, `api/app`, `api/ai_routes`, and others. Every ruff step in
> `.github/workflows/ci.yml` is `continue-on-error: true`, so CI has never treated
> this as blocking. No backend file was touched by this work, so the count is
> unchanged by it. Reducing it is separate work, deliberately not smuggled in here.

**Level 4 — Manual.** The 8-view click-through in `README.md` order, plus
`GET /api/v1/athena/stats/scraping` before/after to confirm `total_jobs_scraped` moved.

**Coverage expectation.** New code: 100% branch coverage on `tests/server/`. No global
coverage gate is introduced — the repo has no coverage tooling and adding a dependency needs
sign-off.

---

## Boundaries

**Always**
- Run `npm run lint`, `npm run test:unit`, and `npm run build` before calling any task done.
- Keep `uv run pytest -q` at its current pass count.
- Register the `/api/v1/athena/*` handler before the SPA catch-all.
- Coerce at the mapper boundary rather than assuming well-formed input.
- Keep `mockData.ts` as first-paint seed only, never as a silent error fallback.

**Ask first**
- Any new npm or pip dependency.
- Changing `Job`, `JobSource`, `JobStatus`, `MatchTier`, or the `/scrape` contract in Python.
- Changing ATS band thresholds (≥90 / 80-89) or scorer weights.
- Touching `camelCaseKeys` / `snakeCaseKeys` behaviour for existing `/api/ai/*` routes.
- Deleting `mockData.ts` or `provider.synthesize_listings()`.
- Broadening `AUTH_MODE` or CORS configuration.

**Never**
- Commit `.env`, `ATHENA_API_KEY`, `GEMINI_API_KEY`, or any receipt/signature material.
- Edit `backend/.venv/` or `node_modules/`.
- Delete or skip a failing test to make a gate green.
- Weaken `AUTH_MODE=api_key` to make the browser work — the BFF injects the key, the browser
  never needs it.
- Relax the backend's `limit ≤ 100` validator to accommodate a client bug.

---

## Success Criteria

Specific and testable:

1. `GET /api/v1/athena/jobs` through the BFF returns `Content-Type: application/json`, and
   the client assembles **200** opportunities from `limit=100` pages (falling back to fewer
   when the store holds fewer). With the current 138-job store the result is exactly 138.
2. With the backend stopped, the Pipeline view shows a visible error banner. It does **not**
   silently render `mockData.ts`. (Verified by killing uvicorn and screenshotting.)
3. Clicking "Execute 4h Cycle Now" sends exactly one `POST /api/v1/athena/scrape` whose body
   has `query` and no `location_filter`, followed by one `POST /api/v1/athena/process`.
4. The toast after a scrape reports the backend's real `jobs_found` / `jobs_new`. A scrape
   that finds 0 jobs says 0 — it does not report the canned 3 listings.
5. `atsScore` rendered on any pipeline card equals the backend's `ats_score` for that job id.
6. No request for `job-mw-101`, `job-mw-102`, or `job-intl-103` appears in the Network tab
   during any view.
7. Zero console errors across all 8 views.
8. `npm run lint`, `npm run test:unit`, `npm run build` all exit 0.
9. `uv run pytest -q` still reports 88 passed. (`ruff check` is no longer a criterion
   here — see the Level 3 correction; it has 237 pre-existing errors and is
   `continue-on-error` in CI.)
10. The ATS ≥90 and 80-89 filters still return zero rows against current data — unchanged
    behaviour, confirmed deliberately so the threshold decision stays visible.

---

## Open Questions

**Q1 — `rejected` has no frontend state. RESOLVED → map to `evaluated`.** All 138 real jobs
carry `status: "rejected"`, and `JobStatus` also offers `archived`; `PipelineStatus` has
neither. **Decision:** map both to `evaluated` in D3 so this spec ships, and raise a
**follow-up spec** for the rejection logic (Q2). Known cosmetic cost: rejected roles render
as `evaluated` cards until that spec lands.

**Q2 — Why is everything `rejected`? DEFERRED to a follow-up spec.** `POST /process`
returned `{"status":"processed","total_jobs":138,"scored":0}`. Nothing scored, yet all 138
are `rejected`. Suspicion: the process step marks jobs it does not score as rejected. Not
diagnosing this here — it is a backend behaviour question, and guessing would bake a
workaround into the mapper. Tracked as its own spec after this one.

**Q3 — Gemini key not loaded. NOT BLOCKING, still open.** `/api/backend-health` reports
`provider: "fallback", hasApiKey: false` even though `.env` sets `GEMINI_API_KEY`; the
running uvicorn process was started without the env loaded. Real scraping needs no LLM, so
this spec proceeds. Document generation stays in fallback mode until it is fixed.

**Q4 — `limit ≤ 100` and pagination. RESOLVED → client pages to 200.** See D5.

---

## Appendix A — pre-implementation evidence (2026-10-03, before any change)

The state this spec was written against.

| Check | Result |
|---|---|
| `GET :3000/api/v1/athena/jobs?limit=5` | `Content-Type: text/html`, returns `index.html` |
| `GET :8000/api/v1/athena/jobs?limit=200` | 422 `less_than_equal`, `le: 100` |
| `GET :8000/api/v1/athena/jobs?limit=100` | 200, `jobs[]` with `ats_score`, `match_score`, snake_case |
| `POST :8000/api/v1/athena/scrape` (remote_ok, max 8) | 200 completed, `jobs_found: 8`, `jobs_updated: 8` |
| `POST :8000/api/v1/athena/process` | 200 `{"total_jobs":138,"scored":0}` |
| `POST :3000/api/ai/scrape-live` | 200, `job-mw-101` `atsScore:94` — **synthesized, not scraped** |
| Job score coverage (300 jobs, 139 returned) | 138/138 have `ats_score`; range 25.4-57.5, avg 35.0 |
| `match_score` | range 55.3-78.1, avg 66.4; tiers 96 poor / 42 fair |
| `/stats/scraping` | 20 completed scrapes, `total_jobs_scraped: 780` |
| `/scheduler/status` | `running: true`, 3 jobs scheduled |
| `jobs.jsonl` | 138 lines, 0 corrupt |

## Appendix B — post-implementation verification (2026-10-03)

### Gates

| Gate | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | exit 0 |
| `npm run test:unit` | **41 passed**, 0 failed |
| `npm run build` | exit 0 (`dist/assets/index-*.js` 393.53 kB, gzip 107.64 kB) |
| `npm run test:e2e` | **60 passed** (20 tests × chromium/firefox/webkit), stable over 2 runs |
| `cd backend && uv run pytest -q` | 88 passed, 10 warnings |
| `cd backend && uv run ruff check .` | 237 pre-existing errors, unchanged; `continue-on-error` in CI |

### The original bug, before and after

| Check | Before | After |
|---|---|---|
| `GET :3000/api/v1/athena/jobs?limit=5` content type | `text/html` | `application/json` |
| Pipeline stage summary | `All Stages (8)` (mock seed) | `All Stages (138+)` (real store) |
| Job reads from the browser | `limit=200` → 422, or HTML parse failure | `limit=100&offset=0`, then `offset=100` |
| `GET :3000/api/v1/athena/jobs/<unknown-id>` | fabricated `Untitled role` | FastAPI's 422 passed through verbatim |

### Real scrape + score, through the same BFF the buttons call

| Call | Result |
|---|---|
| `POST :8000/api/v1/athena/scrape` `{query: "data engineer", location: "Remote", max_results: 3, sources: ["remote_ok"]}` | `completed`, `jobs_found: 3`, `jobs_new: 0`, `jobs_updated: 3`, no error |
| `POST :3000/api/v1/athena/scrape` (same body, no API key from the client) | `completed`, camelCased `jobsFound: 3`, `jobsNew: 0`, `jobsUpdated: 3`, `source: remote_ok` |
| `POST :3000/api/v1/athena/process` | `processed`, `totalJobs: 165` |
| Card ATS score vs API | `AI Engineer Data APIs` → `47.1`, equal to the backend's `ats_score` |

### Regression found and fixed during QA

Wiring the profile read to real data exposed a crash the mock had masked:
`api.listProfiles()` cast the raw response to `ApplicantProfile`, but backend
`skills` is a list of objects where the SPA expects `string[]`, so React threw
*"Objects are not valid as a React child (found: object with keys {name, level,
yearsExperience, category})"* and took down the Profile, Documents, Form Filler and
n8n views. Fixed by mapping profiles through `toApplicantProfile` /
`toApplicantProfileList` (plus `PROFILE_DETAIL_PATH` in `server.ts`), covered by 12
unit tests. Verified live: 43 skills, all `String`.

### Two environment problems found, both config-only

1. **E2E tripped the backend rate limiter.** `app.py` enforces 100 requests per
   60 s per IP on *all* endpoints, and every Playwright request arrives from
   127.0.0.1. The 3-browser matrix generates well over 100/min, so tests failed
   with 429s in ways that looked like app bugs (even `GET /api/health`).
   `e2e/playwright.config.ts` now raises `ATHENA_RATE_LIMIT` for the backend
   Playwright spawns; `load_dotenv()` does not override an inherited variable, so
   dev and production processes are untouched.
2. **Worker starvation.** Playwright defaulted to 7-8 concurrent browsers on a
   box also running Vite, the BFF and FastAPI; the 30 s timeout expired even on
   trivial assertions. Every browser passes 18/18 at `--workers=2`. The config now
   pins `workers: CI ? 2 : 4`.

### Deliberately not done

- The ATS ≥90 / 80-89 bands are untouched, so those filters still return zero rows
  against current data. That was the decision, not an oversight.
- The 237 pre-existing ruff errors are untouched.
- Q2 (why every job is `rejected`) stays deferred to a follow-up spec.
- The manual 8-view click-through is not complete; those views are covered by the
  e2e suite, which asserts zero console/page errors on each.