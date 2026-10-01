# Wayfinder Map 5: Configuration & Environment Standardization (Medium Priority)

## Current State
- **Status**: Not Started — environment variables not fully settled; `ATHENA_DATA_DIR` not standardized
- **Key Files**: `.env.example`, config files in `frontend/` and `backend/`
- **Reference**: `MIGRATION_PLAN.md` §5, environment standardization items

## Decision Tickets (Resolve One at a Time)

### Ticket A: Standardize ATHENA_DATA_DIR and Core Env Vars
- **Requirement**: Finalize `ATHENA_DATA_DIR` and all core environment variables
- **Current**: `.env.example` not comprehensive; vars scattered across `frontend/` and `backend/` configs
- **Resolution**: Create unified `.env.example` with all required variables and defaults; standardize references across codebase
- **Dependencies**: All environment files; config loading in both Python and TypeScript
- **Evidence**: Migration plan environment setup section; current `.env.example` gaps identified in gap analysis

### Ticket B: Scraper Source/Job Type/Location Config Standardization
- **Requirement**: Standardize scraper source, job_type, location configuration across all scrapers
- **Current**: Config may be inconsistent; each scraper might handle source/job_type/location differently
- **Resolution**: Define canonical config schema; update all scraper files to use standardized variables; add validation
- **Dependencies**: Ticket A (core env vars first); all scraper files (`scrapers/base.py`, `scrapers/remote.py`, `scrapers/lilongwe.py`, etc.)
- **Evidence**: Gap analysis SCR-02 config requirements; migration plan phase 5 configuration

### Ticket C: Validate All Config Load Paths
- **Requirement**: Verify all config load paths work in both development and production
- **Current**: May have path inconsistencies between `frontend/` and `backend/` config loading
- **Resolution**: Test config loading in both environments; fix any path resolution issues; add fallback defaults where needed
- **Dependencies**: Ticket A (env vars standardized); Ticket B (scraper configs standardized)
- **Evidence**: Runtime configuration; deployment configs; local development setup

### Ticket D: Documentation & Onboarding Update
- **Requirement**: Update project README and onboarding docs with current config state
- **Current**: May not reflect the standardized config state
- **Resolution**: Document the standardized `.env.example`; create onboarding section for new developers; update any config-related docs
- **Dependencies**: Tickets A-C complete; config state is stable and documented
- **Evidence**: `README.md`, `docs/` directory, developer onboarding flow

## Path Forward
Resolve tickets in order: A → B → C → D. Start with Ticket A (core env vars) as it's the prerequisite for all other configuration standardization — without standardized env vars, scraper configs and test configurations cannot be properly set up.

**Destination**: `.env.example` fully standardized with all core variables and defaults; all config load paths validated in dev and production; onboarding docs updated; new developers can get started with `uv sync --extra dev` + config setup in minimal time.

---
*Wayfinder Map generated for athena project. Resolve one ticket at a time until configuration is fully standardized.*