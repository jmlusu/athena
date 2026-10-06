# Phase 1: Proxy Verb Fix
- [x] Fix proxy verb passthrough in server.ts (3 lines)
  - Acceptance: PATCH/PUT/DELETE reach backend via /api/v1/athena/*
  - Verify: npm run lint && npm run build
  - Files: server.ts

# Phase 2: Profile Persistence
- [x] Add id to ApplicantProfile type
  - Acceptance: TypeScript compiles; id flows from backend to UI
  - Verify: npm run lint
  - Files: src/types.ts
- [x] Add api.updateProfile endpoint
  - Acceptance: PUT /v1/athena/profiles/{id} called with profile data
  - Verify: npm run lint
  - Files: src/api.ts
- [x] Load profile id in App.tsx and pass to view
  - Acceptance: ApplicantProfileView receives profile with id
  - Verify: npm run lint
  - Files: src/App.tsx
- [x] Call updateProfile on save in ApplicantProfileView
  - Acceptance: Save triggers API call; success/error toast shown
  - Verify: npm run lint; manual test save + reload
  - Files: src/components/views/ApplicantProfileView.tsx

# Phase 3: Display Pagination
- [x] Create Pagination component
  - Acceptance: Reusable; page size selector (10/25/50/100 default 25); Prev/Next; showing label
  - Verify: npm run lint; visual check
  - Files: src/components/ui/Pagination.tsx (NEW)
- [x] Integrate pagination into ScraperDiscoveryView
  - Acceptance: List paginated client-side; resets page on filter change
  - Verify: Manual test filter → paginate → page size
  - Files: src/components/views/ScraperDiscoveryView.tsx
- [x] Add pagination to PipelineView columns
  - Acceptance: Each column shows paginated items (25/page); "Show more" or pager
  - Verify: Manual test with 50+ items per column
  - Files: src/components/views/PipelineView.tsx

# Phase 4: Profile Document Repository
- [x] Create profile/ folder structure + .gitignore entry
  - Acceptance: profile/resumes, certifications, credentials, supporting exist; gitignored
  - Verify: git status shows ignored
  - Files: profile/, .gitignore
- [x] Add chokidar watcher + API endpoint in server.ts
  - Acceptance: GET /api/profile-documents returns metadata; auto-refresh on file changes
  - Verify: Manual test drop file → appears in API
  - Files: server.ts
- [x] Add listProfileDocuments to src/api.ts
  - Acceptance: TypeScript compiles; returns ProfileDocument[]
  - Verify: npm run lint
  - Files: src/api.ts
- [x] Add ProfileDocument type to src/types.ts
  - Acceptance: TypeScript compiles
  - Verify: npm run lint
  - Files: src/types.ts
- [x] Add document picker to DocumentStudioView.tsx
  - Acceptance: Picker modal shows documents; can attach to generated output
  - Verify: Manual test
  - Files: src/components/views/DocumentStudioView.tsx

# Phase 5: Dev/Prod Parity & E2E
- [x] Verify .env.example completeness
  - Acceptance: All required vars documented; no missing vars in prod
  - Verify: npm run build && npm start with .env
  - Files: .env.example
- [x] Extend E2E tests for profile persistence + pagination + document repo
  - Acceptance: real-data.spec.ts covers profile save/reload, both pagination UIs
  - Verify: npm run test:e2e (with backend running); ad-hoc Playwright smoke 19/19 against real FastAPI+BFF
  - Files: e2e/aistudio/real-data.spec.ts
  - Note: two new tests added; full suite requires backend + frontend running
  - Note: covered ad-hoc by a Playwright smoke run (19/19) against real FastAPI +
    BFF, not yet committed to the repo's spec file

# Phase 6: Lossless Profile Save
- [x] Map SPA -> UserProfileRequest in toBackendProfile
  - Acceptance: skills as list[Skill]; experience uses title/start_date/description;
    education supplies field_of_study. FastAPI answers 200, not 422.
  - Verify: npm run test:unit; backend tests/test_profile_roundtrip.py
  - Files: athena-mapper.ts
- [x] Add the three quote fields to the UserProfile model
  - Acceptance: hourly_rate_usd / expected_monthly_mwk / legal_authorized_signer
    validate, persist and read back.
  - Verify: backend tests/test_profile_roundtrip.py
  - Files: backend/src/athena/models/jobs.py, backend/src/athena/api/schemas.py
- [x] Merge the form's edits into the stored profile instead of replacing it
  - Acceptance: PUT folds toBackendProfile's output into what GET returned, so
    sections with no editor survive. Measured: a live profile went from
    30,224 bytes to 16,508 on one save (18 documents, 2 languages, 231 search
    keywords, 5 skills_used lists, both field_of_study values and all 43 skill
    categories gone); after the merge the round-trip is byte-stable apart from
    updated_at and the three quote fields.
  - Verify: npm run test:unit (mergeProfilePatch suite)
  - Files: athena-mapper.ts, server.ts
- [x] Carry server-owned sections across the replace in upsert_profile
  - Acceptance: documents, resume_base and created_at survive a PUT even though
    UserProfileRequest never declares them (nothing in the UI edits them).
  - Verify: backend tests/test_profile_roundtrip.py (2 new tests)
  - Files: backend/src/athena/api/routes.py
- [x] Surface save state and errors in ApplicantProfileView
  - Acceptance: button disabled + "Saving..." while in flight; errors stay until
    the next attempt; success banner does not blank a later save; live regions
    announce both outcomes; re-seeds when the profile id changes.
  - Verify: npm run lint; smoke run
  - Files: src/components/views/ApplicantProfileView.tsx
- [x] Render FastAPI validation details in api.ts
  - Acceptance: a 422 reads as its detail (string, [{loc,msg}] list or object)
    rather than "HTTP 422".
  - Verify: npm run test:unit
  - Files: src/api.ts