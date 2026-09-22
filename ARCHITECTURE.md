# Athena Architecture Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#070A40', 'secondaryColor': '#E63946', 'tertiaryColor': '#00BFFF', 'fontFamily': 'Arial' }}}%%

graph TD
    style AthenaBG fill:#070A40,stroke:#E63946,stroke-width:2px

    %% === Frontend ===
    subgraph FRONTEND[Frontend \n \nReact + Vite + Tailwind CSS]
        direction TB
        FG[Vite Dev Server\n(port 8530)]
        FG2[Preview Server\n(port 8530)]
        FG3[Static Assets\n/public/]
    end

    %% === Backend ===
    subgraph BACKEND[Backend \n \nFastAPI + Python]
        direction TB
        BG[API Gateway\n(port 8520)]
        BG2[API Routes\n/athena/*]
        BG3[Security Middleware\nCORS, Rate Limit, Auth]
        BG4[Lifespan\nData Init]
    end

    %% === Internal Modules ===
    subgraph MODULES[Backend Modules]
        direction TB
        SC[Scraper Registry\n13+ Job Sources]
        ME[Matching Engine\nSentence-Transformers]
        AT[ATS Scorer\nResume-Job Scoring]
        DG[Document Generator\npython-docx + WeasyPrint]
        SCED[Athena Scheduler\nAPScheduler]
        ST[Store\nIn-Memory DB]
    end

    %% === Data Stores ===
    subgraph DATA[Data Stores]
        direction TB
        JD[JSONL Files\ncompany/athena/]
        UC[User Profiles]\nUUIDs + Skills]
        JOBS[Jobs Registry\nUUIDs + Matching]
        APPLS[Applications]\nSubmission Tracker]
    end

    %% === External Services ===
    subgraph EXT[External Services]
        direction TB
        LB[LinkedIn Indeed Glassdoor]
        RW[RemoteOK WeWorkRemotely]
        UP[Upwork Toptal Freelancer]
        CO[Remote.co PeoplePerHour]
        ML[Malawi Jobs Boards]
    end

    %% === Connections ===
    
    %% Frontend <-> Backend
    FG -->|HTTP/REST| BG
    BG2 -->|Route Dispatch| BG
    BG -->|API Calls| FG
    
    %% Backend Modules
    BG -->|Register/Query| SC
    BG -->|Match/Score| ME
    BG -->|Generate Docs| DG
    BG -->|Schedule Jobs| SCED
    BG -->|Store/Retrieve| ST
    
    SC -->|Scrape Data| LB
    SC -->|Scrape Data| RW
    SC -->|Scrape Data| UP
    SC -->|Scrape Data| CO
    SC -->|Scrape Data| ML
    
    ME -->|Compute Similarity| ST
    AT -->|Score Resumes| ST
    DG -->|Generate .docx/.pdf| ST
    SCED -->|Trigger Processing| BG
    
    %% Data Flow
    ST -->|Persist| JD
    ST -->|Persist| UC
    ST -->|Persist| JOBS
    ST -->|Persist| APPLS
    
    %% Scheduler Flow
    SCED -->|run_all_scrapes| SC
    SCED -->|process_new_jobs| ME
    SCED -->|cleanup_old_jobs| JOBS
    
    %% Style adjustments
    classDef frontend fill:#111827,color:#F9FAFB,stroke:#374151,stroke-width:1px
    classDef backend fill:#111827,color:#F9FAFB,stroke:#374151,stroke-width:1px
    classDef module fill:#1F2937,color:#F9FAFB,stroke:#4B5563,stroke-width:1px
    classDef data fill:#1E3A5F,color:#F9FAFB,stroke:#2563EB,stroke-width:1px
    classDef external fill:#1E3A5F,color:#F9FAFB,stroke:#2563EB,stroke-width:1px
    
    class FG,FG2,FG3 frontend
    class BG,BG2,BG3,BG4 backend
    class SC,ME,AT,DG,SCED,ST module
    class JD,UC,JOBS,APPLS data
    class LB,RW,UP,CO,ML external
```

## Architecture Overview

### Layers

1. **Presentation Layer** (Frontend)
   - React + Vite + Tailwind CSS 4
   - Vite dev server (port 8530)
   - API consumption via `/api/v1/athena/*`

2. **Application Layer** (Backend - FastAPI)
   - API Gateway with security middleware
   - Route dispatching
   - Lifespan initialization

3. **Domain Layer** (Backend Modules)
   - **Scrapers**: 13+ sources (LinkedIn, Indeed, Glassdoor, RemoteOK, WeWorkRemotely, Upwork, Toptal, Freelancer, Guru, PeoplePerHour, plus Malawi-specific boards)
   - **Matching Engine**: Sentence-transformers semantic similarity + keyword fallback
   - **ATS Scorer**: Keyword match, semantic similarity, experience relevance, education match
   - **Document Generator**: python-docx + WeasyPrint for .docx/PDF generation
   - **Scheduler**: APScheduler with 4h scrape intervals, 30m matching, daily cleanup

4. **Data Layer**
   - In-memory store (athena_db)
   - JSONL data files (company/athena/)
   - User profiles, jobs, applications tracking

5. **External Integration**
   - Job boards (LinkedIn, Indeed, Glassdoor, etc.)
   - Malawi job portals
   - Optional LLM provider for AI humanization

### Data Flow

1. **Job Discovery**: Frontend triggers scrape → Scheduler → Scraper Registry → Job Boards → JSONL storage
2. **Matching**: New jobs → Matching Engine + User Profiles → Match scores + ATS scores → Job status updated
3. **Application**: High-scoring jobs → Document Generator → Resume/Cover Letter → Application submission (with HITL approval)
4. **Scheduler**: Background processing of scrape jobs, matching, and cleanup on intervals