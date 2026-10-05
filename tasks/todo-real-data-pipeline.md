# Tasks: Real Data Pipeline

Implements [`docs/specs/real-data-pipeline.md`](../docs/specs/real-data-pipeline.md) via
[`tasks/plan.md`](./plan.md).

Run order: T1 → T2 → T4 → T5 → T6 → T7 → T8, with T3 and T9 anywhere after T2.

Corrections found during implementation (the task text below was written before
the work and got two things wrong — see the notes at the bottom):

- **T9 lives at `e2e/aistudio/real-data.spec.ts`, not `e2e/real-data.spec.ts`.**
  `e2e/playwright.config.ts` sets `testDir` to `e2e/aistudio`, so a file at the
  e2e root is never collected.
- **The ruff baseline is not clean, and CI does not gate on it.**
  `uv run ruff check .` reports 237 pre-existing errors in
  `automation/submitter`, `ai/providers/fallback`, `documents/humanizer`, and
  others. Every ruff step in `.github/workflows/ci.yml` is
  `continue-on-error: true`. No backend file was touched by this work, so the
  count is unchanged by it.

---

- [x] **T1: Widen `OpportunityPlatform` to cover every `JobSource` member**
  - Acceptance: the union in `src/types.ts` includes all 16 `JobSource` values
    (`linkedin`, `indeed`, `glassdoor`, `company_career`, `malawi_jobs`, `malawi_work`,
    `jobs_malawi`, `upwork`, `toptal`, `freelancer`, `guru`, `people_per_hour`,
    `remote_ok`, `we_work_remotely`, `remote_co`, `other`) with no widening deferred to
    `string`. No other type changes.
  - Verify: `npm run lint` exits 0.
  - Files: `src/types.ts`

- [x] **T2: Create the `Job` → `Opportunity` mapper as its own module**
  - Acceptance: new `athena-mapper.ts` at repo root exports `toOpportunity`,
    `deriveScope`, `SOURCE_PLATFORM`, `STATUS_MAP`. Maps every `Opportunity` field per spec
    D2; coerces `null`/missing/`""` via `str`/`num`/`strArray` rather than assuming
    well-formed input. `rejected` and `archived` map to `evaluated`. Uses only erasable TS
    syntax and explicit `.ts` import extensions.
  - Verify: `npm run lint` exits 0; `node -e "import('./athena-mapper.ts').then(m => console.log(Object.keys(m)))"`
    lists the exports without booting Express.
  - Files: `athena-mapper.ts`, `src/types.ts` (type-only import)

- [x] **T3: Add the `test:unit` script**
  - Acceptance: `npm run test:unit` runs the Node built-in test runner over `tests/server/`.
    No new dependency.
  - Note: the script is `node --test "tests/server/*.test.ts"`. A bare
    `tests/server/` path makes Node try to *import the directory* and fail.
  - Files: `package.json`

- [x] **T4: Unit-test the mapper**
  - Acceptance: `tests/server/mapper.test.ts` covers — full-field mapping; fallbacks on
    `null`/missing/empty-string; `deriveScope` for `Lilongwe`, `Lilongwe (100% Remote)`,
    `Remote`, `""`; all 16 `JobSource` members plus an unknown source → `Corporate`; all 10
    `JobStatus` members; no `undefined` in any required field; and a regression case proving
    the `job-mw-101` fallback payload shape is not accepted as real input.
  - Extended beyond the original list: profile mapping (`toApplicantProfile` and
    helpers), added after wiring real profiles crashed React. See "Regression found
    during QA" below.
  - Verify: `npm run test:unit` exits 0 → **41 passed, 0 failed**.
  - Files: `tests/server/mapper.test.ts`

- [x] **T5: Proxy `/api/v1/athena/*` from the BFF**
  - Acceptance: a method-aware handler forwards `/api/v1/athena/*` to the FastAPI backend,
    injecting `X-API-Key`, passing query strings verbatim, applying the existing
    `camelCaseKeys` on the response, and mapping job payloads through `toOpportunity`.
    Registered **before** the Vite/static/SPA fallback. Keeps the existing
    `BACKEND_TIMEOUT_MS` abort and its 502/504 bodies.
  - Also maps `/profiles` (see QA regression below).
  - Verify:
    ```powershell
    (Invoke-WebRequest http://127.0.0.1:3000/api/v1/athena/jobs?limit=5 -UseBasicParsing).Headers['Content-Type']   # application/json
    ```
    returns JSON, not `text/html`. An unknown job id returns FastAPI's 422 verbatim
    rather than a fabricated `Untitled role`.
  - Files: `server.ts`, `athena-mapper.ts`

- [x] **T6: Fix the API client — scrape contract and job pagination**
  - Acceptance: `api.triggerScrape` sends `query` / `location` / `job_type` /
    `max_results` / `sources` / `user_profile_id`; the old `location_filter` /
    `search_type` / `keywords` / `resume_skills` keys are removed, not aliased.
    `api.listJobs` pages at `limit=100` (`JOB_PAGE_LIMIT`) up to a 200-row cap
    (`JOB_LOAD_CAP`) and returns the assembled array; a store with ≤100 jobs issues exactly
    one request. No request ever exceeds `limit=100`.
  - Verify: `npm run lint` exits 0; observed `limit=100&offset=0` then
    `limit=100&offset=100` against the live store.
  - Files: `src/api.ts`, `src/types.ts`

- [x] **T7: Make "Execute 4h Cycle Now" scrape for real**
  - Acceptance: `runCronCycle` in `App.tsx` calls `api.triggerScrape` → `api.processJobs` →
    reload jobs, sequentially. The toast reports the backend's real `jobs_found` /
    `jobs_new`, including 0. The raw `fetch("/api/ai/scrape-live")` call is gone.
    The silent `console.warn` + mock fallback at the data-load site is replaced by visible
    error state naming the failing call and the backend URL; `mockData.ts` remains only as
    the first-paint seed.
  - Verify: `POST /api/v1/athena/scrape` then `POST /api/v1/athena/process` observed
    through the BFF with the exact contract the button sends; a live
    `remote_ok` scrape returned `completed, found 3, new 0, updated 3`.
  - Files: `src/App.tsx`

- [x] **T8: Make the Scraper view's scrape trigger real**
  - Acceptance: `handleExecuteLiveScrape` in `ScraperDiscoveryView.tsx` uses the same
    `triggerScrape` → `processJobs` → reload chain, seeded from `activeScope`,
    `activeCategory`, and `searchKeywords`. The `data.listings` branch, the
    `scraped-${Date.now()}-${i}` synthetic ids, and the `"Scraper completed query using
    local live index"` catch-all message are deleted. New jobs arrive via the normal reload.
  - Files: `src/components/views/ScraperDiscoveryView.tsx`, `src/App.tsx`

- [x] **T9: E2E spec for the real-data pipeline**
  - File: **`e2e/aistudio/real-data.spec.ts`** (see the correction at the top).
  - Acceptance, as delivered: the BFF answers `/api/v1/athena/jobs` with JSON rather than
    `index.html`; jobs paginate as offsets 0 then 100 and never request an offset past the
    200 cap; a ≤100-row store opens no second page; the Pipeline renders the fixture count
    with no "not live" banner; a card's `atsScore` equals the API value; no response carries
    `job-mw-*` / `job-intl-*`; "Execute 4h Cycle Now" issues `POST /api/v1/athena/scrape`
    with `query` present and `location_filter` absent followed by one
    `POST /api/v1/athena/process`; a 503 on the jobs read shows the error banner.
  - **Why the output assertions use a fixture, not the live store:** CI checks out a
    fresh repo, and `company/athena/jobs.jsonl` is gitignored scraped data, so the store
    is empty there. Only the two contract tests that must exercise the real backend
    (JSON-not-HTML, profile skills) hit it, and both tolerate an empty store.
  - Verify: `npm run test:e2e` → **60 passed** (20 tests × chromium/firefox/webkit),
    stable across two consecutive runs.
  - Files: `e2e/aistudio/real-data.spec.ts`, `e2e/playwright.config.ts`

---

## Regression found during QA (not in the original plan)

Switching the profile read from mock to real data exposed a crash the mock had
been hiding: `api.listProfiles()` cast the raw backend response to
`ApplicantProfile`, but backend `skills` is `[{name, level, years_experience,
category}]` where the SPA expects `string[]`. React threw *"Objects are not valid
as a React child"* and took down the Profile, Documents, Form Filler and n8n
views. Fixed by mapping profiles (`toApplicantProfile`,
`toApplicantProfileList`, `PROFILE_DETAIL_PATH` in `server.ts`) with 12 unit
tests. This is the same class of bug as the jobs mapper, so profiles are mapped
rather than cast.

## Definition of done

- [x] All tasks above checked
- [x] `npm run lint` exit 0
- [x] `npm run test:unit` exit 0 → 41 passed
- [x] `npm run test:e2e` exit 0 → 60 passed
- [x] `npm run build` exit 0
- [x] `cd backend && uv run pytest -q` → 88 passed
- [~] `cd backend && uv run ruff check .` → **237 pre-existing errors, unchanged by
  this work**; every ruff CI step is `continue-on-error: true`. Left alone as
  out of scope. Cleaning it up is a separate piece of work.
- [x] Spec's success criteria verified
- [x] Spec's Appendix updated with post-change evidence
- [ ] Manual 8-view click-through — Profile/Documents/Form Filler/n8n verified via
  the e2e suite rather than by hand; the full manual pass is still outstanding.