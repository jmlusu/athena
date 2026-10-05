# Plan: Real Data Pipeline

Implements [`docs/specs/real-data-pipeline.md`](../docs/specs/real-data-pipeline.md).

**Baselines at plan time (must not regress):**
- `npm run lint` → exit 0
- `cd backend && uv run pytest -q` → 88 passed
- `cd backend && uv run ruff check .` → clean

---

## Components and dependency graph

```
T1  src/types.ts                 widen OpportunityPlatform to cover all 15 JobSource members
     │
T2  athena-mapper.ts (NEW)       SOURCE_PLATFORM, STATUS_MAP, deriveScope, coercers, toOpportunity
     │                           needs T1's union
     ├── T3  tests/server/mapper.test.ts        (node:test, no deps on T4+)
     │
T4  server.ts                    generic /api/v1/athena/* proxy; applies toOpportunity
     │                           needs T2
     │
T5  src/api.ts                   triggerScrape contract fix; listJobs pagination to 200
     │                           needs T4
     ├── T6  src/App.tsx         runCronCycle real chain; data-load error banner
     └── T7  ScraperDiscoveryView.tsx   handleExecuteLiveScrape real chain
              needs T5
              │
T8  e2e/real-data.spec.ts        Playwright; needs T4-T7 running
T9  package.json                 test:unit script; needed by T3
```

**Hard ordering:** T1 → T2 → T4 → T5 → {T6, T7} → T8.
**T3 and T9 are independent** and can land any time after T2.

---

## Implementation order

Vertical slices, each ending in a runnable state:

**Slice A — real jobs render (T1, T2, T4).**
Types, mapper, proxy. After this the Pipeline renders real jobs from the BFF, because
`App.tsx`'s existing `api.listJobs()` call starts working with no frontend edit at all.
This is the highest-value slice and it needs no change to any view.

**Slice B — real scrapes (T9, T5, T6, T7).**
Client contract, then both triggers. After this the buttons scrape for real and the results
reach the kanban.

**Slice C — prove it (T3, T8).**
Unit tests for the mapper, e2e for the pipeline. Written after A and B so the assertions
match what the code actually does.

### Slice A detail

`athena-mapper.ts` lives at the repo root beside `server.ts` rather than inside `server.ts`,
for one reason: `node:test` must import the mapper **without booting Express**. If the mapper
were inline in `server.ts`, importing it would call `app.listen()` and hang the test runner.
Imports use explicit `.ts` extensions (`allowImportingTsExtensions` is already on in
tsconfig, and Node 24's type stripping does not rewrite specifiers).

Registration order in `server.ts` is load-bearing: the `/api/v1/athena` handler must be
registered **before** the Vite/static/SPA fallback, or the SPA HTML wins and the bug
reappears in its original form. Task T4's acceptance includes a grep-style assertion that
the proxy line number is lower than the fallback's.

### Slice B detail

The scrape chain is three sequential calls — `triggerScrape` → `processJobs` → reload jobs.
Sequential, not `Promise.all`: `process` must not start before the jobs are written, and the
reload must not start before scoring finishes or the user sees unscored rows.

`api.triggerScrape`'s body changes from `location_filter` / `search_type` / `keywords` /
`resume_skills` to `query` / `location` / `job_type` / `max_results` / `sources`. The old keys
are removed, not aliased — the backend ignores them, so keeping them would imply support that
does not exist.

Pagination (D5): page 1 at `limit=100&offset=0` returns `total`; if `total > 100`, page 2
runs at `offset=100`; stop at 200 rows or a short page. The two calls are concurrent once
`total` is known.

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Proxy registered after the SPA fallback | Silent HTML again, bug returns in disguise | T4 asserts handler order explicitly; e2e asserts `Content-Type: application/json` |
| Mapper drops a field the views need | Blank gauges, `undefined%`, silent layout damage | T2 covers every `Opportunity` field; T3 asserts no `undefined` in required fields |
| `JobSource` gains a member later | Unknown source silently becomes `Corporate` | T3 asserts all 15 known members; the fallback is deliberate, not accidental |
| Scrape exceeds `BACKEND_TIMEOUT_MS` | Button reports 504 on a legitimate slow scrape | Real scrapes took 3-30s at `max_results` 8-100, well under the 180s default. If a 100-result scrape times out, that is a separate finding, not a reason to raise the timeout here |
| Frontend starts depending on BFF-transformed shapes | Views break if the proxy is bypassed | Transform is BFF-only by design (spec D2); no view imports the mapper |
| Scrape re-runs during manual testing and mutates `jobs.jsonl` | Test data drifts between runs | Pre-existing behaviour of the app; T8 asserts request shape, not row counts |
| Node type stripping rejects non-erasable syntax | `test:unit` fails to run | Erasable-only TS in `tests/` and `athena-mapper.ts`: no `enum`, no `namespace`, no parameter properties, `import type` for type-only imports |

**Sequential, not parallel:** T1-T2-T4-T5 are strictly ordered — each consumes the previous
contract. T6 and T7 are independent of each other and can be done in either order or in
parallel by two agents; they touch different files and share no state.

---

## Verification checkpoints

**After Slice A** — real data visible, nothing else changed:
```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/v1/athena/jobs?limit=100 | % { $_.jobs.Count }   # 100
npm run lint
```
Browser: Pipeline shows real job titles from the JSONL store, no mock-only entries, zero
console errors.

**After Slice B** — real scraping:
```powershell
$key=(Get-Content .env|Select-String '^ATHENA_API_KEY=').ToString().Split('=',2)[1].Trim()
$before=(Invoke-RestMethod http://127.0.0.1:8000/api/v1/athena/stats/scraping).total_jobs_scraped
# click "Execute 4h Cycle Now" in the browser
$after=(Invoke-RestMethod http://127.0.0.1:8000/api/v1/athena/stats/scraping).total_jobs_scraped
$after -gt $before
```
Network tab shows `POST /api/v1/athena/scrape` then `POST /api/v1/athena/process`. No
`job-mw-101` anywhere.

**After Slice C:**
```powershell
npm run test:unit
npm run test:e2e
npm run lint
npm run build
cd backend; uv run pytest -q    # still 88 passed
```

**Negative check (proves D6):** stop uvicorn, reload the page, confirm a visible error
banner. A mock-rendered Pipeline here means D6 is not done.

---

## Out of scope

Follow-up specs, not this plan: the `rejected`-for-everything process bug (spec Q2), Gemini
key loading (Q3), ATS band recalibration, `application_url` surfacing, n8n wiring, sign-off
and receipt flow.