# Plan: Core Gaps Fix

## Phase 1: Proxy Verb Fix (unblocks all writes)
- **Files**: `server.ts` (lines 332, 348, 458)
- **Change**: Pass `req.method` verbatim; send body for POST/PATCH/PUT
- **Verify**: `npm run lint && npm run build`

## Phase 2: Profile Persistence
- **Files**: 
  1. `src/types.ts` — add `id: string` to `ApplicantProfile`
  2. `src/api.ts` — add `updateProfile(id, profile)` calling `PUT /v1/athena/profiles/{id}`
  3. `src/App.tsx` — load profile `id` from backend, pass to view
  4. `src/components/views/ApplicantProfileView.tsx` — call `api.updateProfile` on save, toast result
- **Verify**: E2E test — save profile, reload, data persists

## Phase 3: Display Pagination (both views)
- **Files**:
  1. `src/components/ui/Pagination.tsx` (NEW) — page size selector (10/25/50/100), Prev/Next, "Showing X–Y of Z", default 25
  2. `src/components/views/ScraperDiscoveryView.tsx` — integrate pagination (client-side slice)
  3. `src/components/views/PipelineView.tsx` — add pagination per column (or "Show more" expander)
- **Verify**: Manual — filter → paginate → change page size → reset on filter change

## Phase 4: Profile Document Repository
- **Files**: 
  - `profile/` (create with subdirs, add to `.gitignore`)
  - `server.ts` — add chokidar watcher, static serve, `GET /api/profile-documents` endpoint
  - `src/api.ts` — add `listProfileDocuments()`
  - `src/types.ts` — add `ProfileDocument` interface
  - `src/components/views/DocumentStudioView.tsx` — add document picker modal
- **Verify**: Drop file in `profile/resumes/` → appears in Document Studio picker without restart

## Phase 5: Dev/Prod Parity & E2E
- **Check**: `.env.example` has all vars (`GEMINI_API_KEY`, `ATHENA_API_KEY`, `ATHENA_BACKEND_URL`, `ATHENA_CORS_ORIGINS`, `NODE_ENV`, `DISABLE_HMR`)
- **E2E**: Extend `e2e/aistudio/real-data.spec.ts` with:
  - Profile save → reload → data intact
  - ScraperDiscovery pagination UI works
  - PipelineView pagination UI works
- **Verify**: `npm run build && npm start` works with production env