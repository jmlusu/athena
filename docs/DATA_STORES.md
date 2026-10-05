# Athena Data Stores and File Stores Architecture

This document provides diagrams and analysis of all databases and file stores in the Athena repository.

## 1. Data Root Resolution

The data root is resolved in `backend/src/athena/paths.py` with the following precedence:

| Priority | Source | Example |
|---|---|---|
| 1 | `ATHENA_DATA_DIR` env var | `C:\Users\jmlus\athena\company\athena` or `/app/data` (Docker) |
| 2 | `<repo>/company/athena` | Auto-resolved from repo root |
| 3 | `~/.athena/data` | Fallback |

---

## 2. All Stores Overview

| Store Type | Location | Purpose | Technology | Status |
|---|---|---|---|---|
| PostgreSQL | `DATABASE_URL` (prod config) | Production RDBMS | Relational DB | Configured only, not active |
| Redis | `REDIS_URL` (prod config) | Caching / rate limiting | Key-value | Configured only, not active |
| AthenaDB (JSONL) | `company/athena/*.jsonl` | Primary persistence | File-based JSONL + filelock | **Active** |
| Embeddings Cache | `company/athena/embeddings_cache/*.npy` | Vector cache | NumPy float32 files | **Active** |
| Lock files | `company/athena/locks/*.lock` | Agent coordination | `filelock` | **Active** |
| Instance lock | `company/athena/athena_instance.lock` | Single-writer guard | `filelock` (timeout=0) | **Active** |
| Documents | `company/athena/documents/{job_id}/*` | Generated DOCX/PDF | File system | **Active** |
| Approvals | `company/athena/approvals/{uuid}.json` | HITL gate requests | JSON files | **Active** |
| Node lock namespace | `<repo>/artifacts/locks/*.lock` | Express BFF locks | Read-check-write | **Active (disjoint)** |

---

## 3. Overall Data Architecture

```mermaid
graph TB
    subgraph CLIENTS["Clients"]
        SPA["React SPA<br/>src/"]
        EXP["Express BFF<br/>server.ts"]
    end

    subgraph API["FastAPI — backend/src/athena/api"]
        RT["routes.py · 31 endpoints"]
        MET["metrics/prometheus.py"]
    end

    subgraph DOMAIN["Domain"]
        SCHED["scheduler/jobs.py"]
        SCR["scrapers/"]
        MATCH["matching/engine.py"]
        DOCS["documents/generator.py"]
        AUTO["automation/submitter.py"]
    end

    subgraph DATA["Persistence — file-based, no SQL, no queue"]
        DB["AthenaDB facade<br/>store.py"]
        ST["AthenaStore generic<br/>cache + loaded latch + write_guard"]
        direction LR
        J[("jobs.jsonl<br/>233 Job records")]
        A[("applications.jsonl<br/>lazy create")]
        U[("user_profiles.jsonl<br/>1 UserProfile")]
        S[("scrape_jobs.jsonl<br/>218 ScrapeJob")]
        DOCD["documents/{job_id}/*.docx"]
        EMB["embeddings_cache/{sha256[:32]}.npy"]
        APV["approvals/{uuid}.json"]
        LCK["locks/*.lock + .owner"]
        INST["athena_instance.lock"]
    end

    subgraph CONFIGURED["Configured but inactive"]
        PG[("PostgreSQL<br/>DATABASE_URL")]
        REDIS[("Redis<br/>REDIS_URL")]
    end

    SPA --> EXP
    EXP -->|"REST + X-API-Key"| RT
    RT --> DB
    MET --> DB
    SCHED --> DB
    AUTO --> DB
    DB --> ST
    ST --> J & A & U & S
    ST -->|"Tier A FileLock"| J
    ST -->|"Tier B ttl=600s"| LCK
    INST -.->|"Tier D single writer"| DB
    DOCS --> DOCD
    MATCH --> EMB
    AUTO --> APV
    SCR --> BOARDS["14 job boards"]
    PG -.->|"future"| DB
    REDIS -.->|"future"| DB

    classDef data fill:#1E3A5F,stroke:#2563EB,color:#F9FAFB
    classDef lock fill:#450A0A,stroke:#E63946,color:#FEE2E2
    classDef inactive fill:#374151,stroke:#6B7280,color:#9CA3AF,stroke-dasharray: 5 5
    class J,A,U,S,DOCD,EMB,APV data
    class LCK,INST lock
    class PG,REDIS inactive
```

---

## 4. Store Catalogue (JSONL Stores)

| Store | Filename | Model | Primary Key | Natural/Dedupe Key | Artifact Lock | Per-entity Locks |
|---|---|---|---|---|---|---|
| Jobs | `jobs.jsonl` | `Job` | `id` (UUID) | `source_job_id` | `jobs.jsonl.lock` | `locks/_<uuid>.lock` |
| Applications | `applications.jsonl` | `Application` | `id` (UUID) | `id` | `applications.jsonl.lock` | `locks/_<uuid>.lock` |
| UserProfiles | `user_profiles.jsonl` | `UserProfile` | `id` (UUID) | `email` (logical) | `user_profiles.jsonl.lock` | `locks/_<uuid>.lock` |
| ScrapeJobs | `scrape_jobs.jsonl` | `ScrapeJob` | `id` (UUID) | `id` | `scrape_jobs.jsonl.lock` | `locks/_<uuid>.lock` |

**Note:** All four stores use the same generic `AthenaStore[T]` class. Entity type derivation (`__class__.__name__.replace("AthenaStore", "")`) returns empty string, so per-entity lock files are named `_<uuid>.lock` with no store prefix.

---

## 5. Entity Relationships

```mermaid
erDiagram
    USER_PROFILE ||--o{ APPLICATION : "user_profile_id"
    JOB ||--o{ APPLICATION : "job_id"
    USER_PROFILE ||--o{ DOCUMENT : "documents[] embedded"
    USER_PROFILE ||--o{ SKILL : "skills[]"
    USER_PROFILE ||--o{ EXPERIENCE : "experience[]"
    USER_PROFILE ||--o{ EDUCATION : "education[]"
    USER_PROFILE ||--o| JOB_PREFERENCES : "preferences"
    JOB ||--o| SALARY_RANGE : "salary_range"

    USER_PROFILE {
        UUID id PK
        str email UK "logical key"
        str full_name
        list skills
        list experience
        list education
        list documents "embedded, not a store"
        dict resume_base
        dt created_at
        dt updated_at
    }
    JOB {
        UUID id PK
        str source_job_id "natural key for upsert"
        str title
        str company
        str location
        float ats_score
        float match_score
        str status "JobStatus enum"
        bool auto_applied
        dt scraped_at
        dt updated_at
    }
    APPLICATION {
        UUID id PK
        UUID job_id FK
        UUID user_profile_id FK
        UUID resume_id FK
        float ats_score
        float match_score
        str status "ApplicationStatus enum"
        dict receipt_data
        dt submitted_at
        dt confirmed_at
    }
    SCRAPE_JOB {
        UUID id PK
        str source
        str query
        int max_results
        str status "pending|running|completed|failed"
        int jobs_found
        int jobs_new
        dt started_at
        dt completed_at
    }
    DOCUMENT {
        UUID id PK "embedded in UserProfile.documents[]"
        str name
        str type
        str file_path
        int size_bytes
        dt uploaded_at
    }
```

**Important:** There are **no foreign keys, no constraints, no joins, no cascades**. Referential integrity is enforced in application code. `cleanup_old_jobs` deletes jobs without touching applications.

---

## 6. File Structure Layout

```text
ATHENA_DATA_DIR (e.g. company/athena/)
│
├── athena_instance.lock              Tier D single-writer guard (held open)
├── athena_instance.lock.owner        pid breadcrumb
│
├── jobs.jsonl                        679,820 B  ·  233 x Job
├── applications.jsonl                lazy — created on first touch
├── user_profiles.jsonl               27,983 B   ·  1 x UserProfile
├── scrape_jobs.jsonl                 90,111 B   ·  218 x ScrapeJob
│   └── <name>.jsonl.lock             Tier A: FileLock guard per artifact
│
├── locks/                            LOCK_DIR (get_data_root()/"locks")
│   ├── _<uuid>.lock                  Tier B: per-entity artifact lock
│   ├── _<uuid>.lock.owner            agent_id + acquired_at + ttl
│   └── global_agent.lock             Tier C: with_global_lock (unused)
│
├── documents/{job_id}/
│   ├── {Company}-{Title}-resume.docx
│   └── {Company}-{Title}-cover_letter.docx
│
├── embeddings_cache/{sha256(text)[:32]}.npy   1,664 B = 384 x float32
└── approvals/{uuid}.json                      HITL gate request

DISJOINT NAMESPACES (not covered by the instance lock):
  <repo>/artifacts/locks/*.lock       Express server.ts + src/lockfile.ts
  backend/artifacts/locks/*.lock      orphans from tmp-data-dir test runs
```

---

## 7. Lock Tiers

```mermaid
graph TB
    subgraph L4["Tier D — Process Instance Lock"]
        D1["athena_instance.lock + .owner=pid<br/>timeout=0, held for FastAPI lifespan<br/>Bypass: ATHENA_ALLOW_MULTIPLE_INSTANCES"]
    end
    subgraph L1["Tier A — Artifact File Lock"]
        A1["FileLock('x.jsonl.lock')<br/>Holds: _load_all / _save_all<br/>Scope: 1 store file · blocking, no timeout"]
    end
    subgraph L2["Tier B — Per-Entity Agent Lock"]
        B1["locks/_&lt;uuid&gt;.lock + .owner sidecar<br/>Holds: add / update / delete (ttl=600s)<br/>Timeout 300s · Stale 1800s → force-unlink<br/>NOT held by add_many / update_many"]
    end
    subgraph L3["Tier C — Global Agent Lock"]
        C1["locks/global_agent.lock<br/>AthenaDB.with_global_lock(func)<br/>0 production call sites"]
    end
    subgraph L5["Tier E — Node-Side Lock (DISJOINT)"]
        E1["repo/artifacts/locks/*.lock<br/>server.ts /api/lock/* + src/lockfile.ts<br/>read-check-then-write, NOT atomic<br/>does not exclude Tier B"]
    end
    L4 --> L1 --> L2
    L3 -.->|"escape hatch (unused)"| L1
    L5 -.->|"no mutual exclusion"| L1

    classDef warn fill:#450A0A,stroke:#E63946,color:#FEE2E2
    class C1,E1 warn
```

| Tier | Name | Scope | Timeout | Purpose |
|---|---|---|---|---|
| A | Artifact file lock | Per JSONL file | Infinite (blocking) | `_load_all()`, `_save_all()` |
| B | Per-entity agent lock | Per UUID | 300s (stale 1800s) | `add()`, `update()`, `delete()` |
| C | Global agent lock | Global | 300s | `with_global_lock()` (unused) |
| D | Process instance lock | Process-wide | 0 (fail-fast) | FastAPI lifespan guard |
| E | Node-side lock | Disjoint (`artifacts/locks/`) | HTTP-based | Express BFF locks |

---

## 8. Read Path (Load-Once Cache)

```mermaid
sequenceDiagram
    autonumber
    participant C as Caller (routes/scheduler)
    participant DB as AthenaDB
    participant S as AthenaStore
    participant G as _write_guard (RLock)
    participant FL as FileLock x.jsonl.lock
    participant FS as x.jsonl

    C->>DB: get_jobs() / get_all()
    DB->>S: get_all()
    S->>G: acquire
    alt _loaded == True
        Note over S: cache hit — file never re-read
    else _loaded == False
        S->>S: ensure_dir (mkdir + touch)
        S->>FL: acquire (blocking)
        FL->>FS: read_text + splitlines
        loop per non-blank line
            S->>S: json.loads → deserialize → model(**)
            Note over S: corrupt line → log + SKIP
        end
        S->>S: cache = dict, _loaded = True
        S->>FL: release
    end
    S-->>DB: list of models
    DB->>DB: filter, sort_key_utc, slice
    DB-->>C: results
```

**Key invariant:** `_loaded` latches on first access and is never invalidated. Cross-process correctness relies on the Tier D instance lock.

---

## 9. Single-Record Write Path

```mermaid
sequenceDiagram
    autonumber
    participant C as Caller
    participant S as AthenaStore
    participant AL as ArtifactLock (lockfile.py)
    participant FL as FileLock x.jsonl.lock
    participant FS as x.jsonl + .tmp

    C->>S: add(obj)
    S->>AL: acquire(uuid, agent, ttl=600)
    alt timed out
        AL-->>S: None
        S-->>C: RuntimeError
    else acquired
        S->>FL: acquire
        S->>S: mutate cache (add/update/delete)
        S->>S: serialize all records
        S->>FS: write .tmp + flush + fsync
        S->>FS: os.replace(.tmp, x.jsonl) — atomic
        S->>FL: release
        S->>AL: release → unlink .owner → unlink .lock
        S-->>C: result
    end
```

---

## 10. Batch Write Path (Optimization)

```mermaid
graph LR
    A["scrapers search_all()"] --> B["index_jobs_by_source_id()<br/>O(N) once"]
    B --> C{"source_job_id in index?"}
    C -->|"yes"| D["to_update<br/>preserve id + scraped_at"]
    C -->|"no"| E["to_add"]
    D --> F["update_jobs → update_many()"]
    E --> G["add_jobs → add_many()"]
    F --> H["_write_guard held<br/>NO Tier-B lock"]
    G --> H
    H --> I["mutate cache N times"]
    I --> J["_save_all() — ONE full rewrite"]
    J --> K["FileLock + tmp + fsync + replace"]
    K --> L[("jobs.jsonl")]

    classDef key fill:#1E3A5F,stroke:#2563EB,color:#F9FAFB
    class J key
```

**Key difference:** `add_many()`/`update_many()` take **zero** Tier-B locks — they hold only `_write_guard` and perform a single full-file rewrite. Individual `add()`/`update()`/`delete()` each take a Tier-B lock and rewrite the whole file (O(N) per record).

---

## 11. Embeddings Cache

```mermaid
graph LR
    Q["text input"] --> HK["sha256(text)[:32]"]
    HK --> MEM{"memory cache<br/>_memory_cache"}
    MEM -->|"hit"| V1["np.ndarray 384-f32"]
    MEM -->|"miss"| DISK{"disk<br/>embeddings_cache/{key}.npy"}
    DISK -->|"hit"| V1
    DISK -->|"miss"| EN["SentenceTransformer<br/>all-MiniLM-L6-v2 encode()"]
    EN --> SAVE["np.save (no lock,<br/>no atomic rename)"]
    SAVE --> DISK
    EN --> V1

    classDef cache fill:#1E3A5F,stroke:#2563EB,color:#F9FAFB
    class MEM,DISK cache
```

| Aspect | Value |
|---|---|
| Path | `company/athena/embeddings_cache/` |
| Filename | `{sha256(text.encode()).hexdigest()[:32]}.npy` |
| Format | NumPy float32 (384-dim, `all-MiniLM-L6-v2`) |
| Size | ~1,664 bytes per file |
| Caching | In-memory dict + on-disk `.npy` (two levels) |
| Concurrency | No locks; silent failures on I/O |

---

## 12. JSONL Serialization Format

- **Format:** One compact JSON object per line, joined by `\n` (no trailing newline)
- **Serialization:** `UUID`/`Decimal`/`HttpUrl` → `str()`; `datetime` → UTC ISO 8601; `Enum` → `.value`
- **Deserialization:** keys ending `_at` → ISO datetime + UTC; keys == id or ending `_id` → `UUID(v)`
- **Persistence:** atomic write via `.tmp` + `os.fsync()` + `os.replace()`

---

## 13. Key Design Characteristics

- **Load-once cache:** `_loaded` latches on first access; file never re-read in process lifetime.
- **Full-artifact rewrite:** every single-record write rewrites the entire JSONL file.
- **Atomic writes:** temp file + `fsync()` + `os.replace()`.
- **UTC normalization:** all timestamps serialized as UTC-aware ISO 8601.
- **Corrupt lines skipped:** malformed lines are logged and skipped, not fatal.
- **Import-time lock dir:** `LOCK_DIR` set at `lockfile.py` import; differs from runtime `base_dir` in tests.
- **Two lock namespaces:** Python (`company/athena/locks/`) and Node (`artifacts/locks/`) are disjoint.
- **ScrapeJob status** is a plain `str` (`pending|running|completed|failed`), unlike the `JobStatus` enum.

---

*Generated from analysis of `store.py`, `lockfile.py`, `paths.py`, `models/`, `matching/embeddings.py`, `api/app.py`, `server.ts`.*
