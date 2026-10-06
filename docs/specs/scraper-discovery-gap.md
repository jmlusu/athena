# Wayfinder Map 2: Scraper/Discovery Gap Analysis (SCR-02)

## Current State
- **Status**: Not Started — gap analysis was truncated; 17 inventory categories vs current implementation status
- **Key Files**: `backend/src/athena/scrapers/base.py`, `backend/src/athena/scrapers/remote.py`, `backend/src/athena/scrapers/lilongwe.py`
- **Reference**: `MIGRATION_GAP_ANALYSIS.md` SCR-02 section

## Decision Tickets (Resolve One at a Time)

### Ticket A: Complete Scraper Inventory (17 Categories)
- **Requirement**: Register all 17 job scraper inventory categories from gap analysis
- **Current**: Implementation truncated; only some scrapers registered (LinkedIn, Indeed, Glassdoor, etc.)
- **Missing**: Specific categories listed in gap analysis SCR-02 that are not yet coded
- **Resolution**: Identify the 17 categories from gap analysis; implement missing scraper registrations in `scrapers/__init__.py` and individual scraper files
- **Evidence**: Gap analysis documented 17 inventory categories; compare against `scrapers/base.py` and `scrapers/remote.py` current registrations

### Ticket B: Scraper Source/Job Type/Location Config
- **Requirement**: Standardize environment variables for scraper source, job_type, location configs
- **Problem**: `ATHENA_DATA_DIR` not standardized; env vars not fully settled
- **Resolution**: Finalize `.env.example` with all required variables; standardize config across all scraper files
- **Dependencies**: Environment configuration, data directory paths, scraper source identification
- **Evidence**: Migration plan §5 and gap analysis config requirements

### Ticket C: Lilongwe Market Integration
- **Requirement**: Complete Lilongwe, Malawi market-specific scraper customization
- **Current**: `scrapers/lilongwe.py` exists but may have incomplete implementation
- **Resolution**: Verify lilongwe.py has all required methods; add any missing market-specific logic; test with live job boards in Malawi
- **Evidence**: Project focuses on Lilongwe + international remote markets; human-in-the-loop sign-off gate for Malawian market

### Ticket D: Discovery Pipeline Full Implementation
- **Requirement**: Complete heuristic ATS scoring + generative AI document tailoring pipeline
- **Components**: ATS scorer, document tailoring, cryptographic receipt ledger with 7-day follow-up automation
- **Dependencies**: Scraper output → matching engine → ATS scoring → document tailoring → receipt ledger
- **Resolution**: Ensure each pipeline stage is fully implemented and tested; verify n8n workflow orchestration
- **Evidence**: Full project architecture includes all these stages; each has supporting code but needs integration verification

## Path Forward
Resolve tickets in order: A → B → C → D. Start with Ticket A (complete the 17-category inventory) as it's the foundational step — without all scrapers registered, downstream pipeline stages cannot function correctly.

**Destination**: All 17 job scraper inventory categories registered and operational; standardized environment configuration; Lilongwe market integration complete; full discovery pipeline (scraper → match → ATS score → tail → receipt) working end-to-end.

---
*Wayfinder Map generated for athena project. Resolve one ticket at a time until the scraper/discovery system is fully implemented.*