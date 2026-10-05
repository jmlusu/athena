import json
import os
import threading
from collections.abc import Callable, Iterable
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

from filelock import FileLock
from pydantic import BaseModel

from .lockfile import (
    acquire_artifact_lock_context,
    acquire_global_lock_context,
    scan_for_stale_locks,
)
from .models import (
    Application,
    ApplicationStatus,
    Job,
    JobSource,
    JobStatus,
    JobType,
    ScrapeJob,
    UserProfile,
)
from .paths import get_data_root
from .timeutils import ensure_utc, sort_key_utc


class AthenaStore[T: BaseModel]:
    """File-based store for Athena data using JSONL format with file locking.

    Integrates per-artifact locks for agent coordination, preventing
    concurrent modifications to the same artifact by different agents.
    """

    def __init__(self, base_dir: Path, filename: str, model_class: type[T], id_field: str = "id"):
        self.base_dir = base_dir
        self.filepath = base_dir / filename
        self.model_class = model_class
        self.id_field = id_field
        self._lock = FileLock(str(self.filepath) + ".lock")
        self._cache: dict[str, T] = {}
        self._loaded = False
        self._agent_id = os.getenv("ATHENA_AGENT_ID", "unknown")
        # Guards cache mutation + persist so two tasks/threads in this process
        # cannot interleave a read-modify-write of the same artifact.
        self._write_guard = threading.RLock()

    @property
    def count(self) -> int:
        return len(self._load_all())

    def _ensure_dir(self) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            self.filepath.write_text("")

    def _load_all(self) -> dict[str, T]:
        with self._write_guard:
            if self._loaded:
                return self._cache

            self._ensure_dir()
            with self._lock:
                items = {}
                if self.filepath.exists():
                    for line in self.filepath.read_text().splitlines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                # Explicitly revive persisted JSON timestamps/UUIDs
                                # before model validation (naive timestamps are
                                # normalized to aware UTC by _deserialize and again
                                # by the models' UTCDateTime fields).
                                obj = self.model_class(**self._deserialize(data))
                                items[str(getattr(obj, self.id_field))] = obj
                            except Exception as e:  # noqa: BLE001
                                print(f"Error loading {self.model_class.__name__}: {e}")
                self._cache = items
                self._loaded = True
                return items

    def _save_all(self) -> None:
        self._ensure_dir()
        lines = []
        for obj in self._cache.values():
            data = obj.model_dump()
            # Convert UUID and datetime to strings
            data = self._serialize(data)
            lines.append(json.dumps(data))
        payload = "\n".join(lines)
        with self._lock:
            # Write to a sibling temp file then atomically replace, so a crash or
            # concurrent writer can never leave a truncated/zero-filled artifact.
            tmp = self.filepath.with_name(self.filepath.name + ".tmp")
            with tmp.open("w", encoding="utf-8") as handle:
                handle.write(payload)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp, self.filepath)

    def _serialize(self, data: Any) -> Any:
        # UUID/Decimal/HttpUrl all serialize via str(); grouped here to keep
        # the return count within PLR0911's limit.
        if isinstance(data, UUID | Decimal) or (
            hasattr(data, "__str__") and type(data).__name__ == "HttpUrl"
        ):
            return str(data)
        if isinstance(data, datetime):
            # Persist aware UTC even if a naive value was assigned post-validation
            return ensure_utc(data).isoformat()
        if isinstance(data, dict):
            return {k: self._serialize(v) for k, v in data.items()}
        if isinstance(data, list):
            return [self._serialize(v) for v in data]
        if hasattr(data, "value"):  # Enum
            return data.value
        return data

    def _deserialize(self, data: dict[str, Any]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for k, v in data.items():
            if k.endswith("_at") or k in (
                "start_date",
                "end_date",
                "posted_date",
                "expiry_date",
                "created_at",
                "updated_at",
                "submitted_at",
                "confirmed_at",
                "scraped_at",
            ):
                if isinstance(v, str):
                    try:
                        result[k] = ensure_utc(datetime.fromisoformat(v))
                    except ValueError:
                        result[k] = v
                else:
                    result[k] = v
            elif k == self.id_field or k.endswith("_id"):
                if isinstance(v, str):
                    try:
                        result[k] = UUID(v)
                    except ValueError:
                        result[k] = v
                else:
                    result[k] = v
            elif isinstance(v, dict):
                result[k] = self._deserialize(v)
            elif isinstance(v, list):
                result[k] = [
                    self._deserialize(item) if isinstance(item, dict) else item for item in v
                ]
            else:
                result[k] = v
        return result

    def get(self, id: UUID) -> T | None:
        items = self._load_all()
        return items.get(str(id))

    def get_all(self) -> list[T]:
        return list(self._load_all().values())

    def add(self, obj: T) -> T:
        entity_type = self.__class__.__name__.replace("AthenaStore", "").lower()
        entity_id = str(getattr(obj, self.id_field))
        lock = acquire_artifact_lock_context(
            entity_type,
            entity_id,
            self._agent_id,
            ttl=600,
        )
        if lock is None:
            raise RuntimeError(  # noqa: TRY003
                f"Could not acquire lock on {entity_type}/{entity_id}",
            )
        try:
            items = self._load_all()
            items[str(getattr(obj, self.id_field))] = obj
            self._save_all()
        finally:
            lock.release()
        return obj

    def update(self, obj: T) -> T:
        entity_type = self.__class__.__name__.replace("AthenaStore", "").lower()
        entity_id = str(getattr(obj, self.id_field))
        lock = acquire_artifact_lock_context(
            entity_type,
            entity_id,
            self._agent_id,
            ttl=600,
        )
        if lock is None:
            raise RuntimeError(  # noqa: TRY003
                f"Could not acquire lock on {entity_type}/{entity_id}",
            )
        try:
            items = self._load_all()
            id_str = str(getattr(obj, self.id_field))
            if id_str in items:
                items[id_str] = obj
                self._save_all()
        finally:
            lock.release()
        return obj

    def add_many(self, objs: Iterable[T]) -> list[T]:
        """Insert many objects, persisting the artifact exactly once."""
        batch = list(objs)
        if not batch:
            return []
        with self._write_guard:
            items = self._load_all()
            for obj in batch:
                items[str(getattr(obj, self.id_field))] = obj
            self._save_all()
        return batch

    def update_many(self, objs: Iterable[T]) -> int:
        """Update many objects, persisting the artifact exactly once.

        Returns the number of objects that were present and updated.
        """
        batch = list(objs)
        if not batch:
            return 0
        with self._write_guard:
            items = self._load_all()
            updated = 0
            for obj in batch:
                id_str = str(getattr(obj, self.id_field))
                if id_str in items:
                    items[id_str] = obj
                    updated += 1
            if updated:
                self._save_all()
        return updated

    def delete(self, id: UUID) -> bool:
        entity_type = self.__class__.__name__.replace("AthenaStore", "").lower()
        # We need the ID as a string to generate the lock ID
        id_str = str(id)
        lock = acquire_artifact_lock_context(
            entity_type,
            id_str,
            self._agent_id,
            ttl=600,
        )
        if lock is None:
            raise RuntimeError(f"Could not acquire lock on {entity_type}/{id_str}")  # noqa: TRY003
        try:
            items = self._load_all()
            id_str = str(id)
            if id_str in items:
                del items[id_str]
                self._save_all()
                return True
        finally:
            lock.release()
        return False

    def filter(self, **kwargs: Any) -> list[T]:
        items = self._load_all()
        results = []
        for obj in items.values():
            match = True
            for key, value in kwargs.items():
                if not hasattr(obj, key) or getattr(obj, key) != value:
                    match = False
                    break
            if match:
                results.append(obj)
        return results


class AthenaDB:
    """Main database interface for Athena."""

    def __init__(self, base_dir: Path | None = None):
        if base_dir is None:
            base_dir = get_data_root()

        self.base_dir = base_dir
        self._agent_id = os.getenv("ATHENA_AGENT_ID", "unknown")

        # Initialize stores
        self.jobs = AthenaStore(base_dir, "jobs.jsonl", Job)
        self.applications = AthenaStore(base_dir, "applications.jsonl", Application)
        self.user_profiles = AthenaStore(base_dir, "user_profiles.jsonl", UserProfile)
        self.scrape_jobs = AthenaStore(base_dir, "scrape_jobs.jsonl", ScrapeJob)

    # Stale lock management
    def scan_for_stale_locks(self) -> int:
        """Scan for and release stale locks.

        Returns the number of locks released.
        """
        return scan_for_stale_locks(self._agent_id)

    # Global agent lock
    def with_global_lock(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Execute a function while holding the global agent lock.

        This serializes all operations, ensuring only one agent
        modifies data at a time when needed.
        """
        lock = acquire_global_lock_context(self._agent_id)
        if lock is None:
            raise RuntimeError("Could not acquire global agent lock")  # noqa: TRY003
        try:
            return func(*args, **kwargs)
        finally:
            lock.release()

    # Job operations
    def add_job(self, job: Job) -> Job:
        return self.jobs.add(job)

    def get_job(self, job_id: UUID) -> Job | None:
        return self.jobs.get(job_id)

    def get_jobs(
        self,
        status: JobStatus | None = None,
        source: JobSource | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Job]:
        jobs = self.jobs.get_all()
        if status:
            jobs = [j for j in jobs if j.status == status]
        if source:
            jobs = [j for j in jobs if j.source == source]
        # Sort by scraped_at desc (tolerates any legacy naive timestamps)
        jobs.sort(key=lambda j: sort_key_utc(j.scraped_at), reverse=True)
        return jobs[offset : offset + limit]

    def update_job(self, job: Job) -> Job:
        job.updated_at = datetime.now(UTC)
        return self.jobs.update(job)

    def upsert_job(self, job: Job) -> Job:
        """Insert or update job by source_job_id."""
        existing = None
        for j in self.jobs.get_all():
            if j.source_job_id and j.source_job_id == job.source_job_id:
                existing = j
                break
        if existing:
            job.id = existing.id
            job.scraped_at = existing.scraped_at
            return self.update_job(job)
        return self.add_job(job)

    # Application operations
    def add_application(self, app: Application) -> Application:
        return self.applications.add(app)

    def get_application(self, app_id: UUID) -> Application | None:
        return self.applications.get(app_id)

    def get_applications(
        self,
        user_profile_id: UUID | None = None,
        job_id: UUID | None = None,
        status: ApplicationStatus | None = None,
    ) -> list[Application]:
        apps = self.applications.get_all()
        if user_profile_id:
            apps = [a for a in apps if a.user_profile_id == user_profile_id]
        if job_id:
            apps = [a for a in apps if a.job_id == job_id]
        if status:
            apps = [a for a in apps if a.status == status]
        apps.sort(key=lambda a: sort_key_utc(a.created_at), reverse=True)
        return apps

    def update_application(self, app: Application) -> Application:
        app.updated_at = datetime.now(UTC)
        return self.applications.update(app)

    # User profile operations
    def add_user_profile(self, profile: UserProfile) -> UserProfile:
        return self.user_profiles.add(profile)

    def get_user_profile(self, profile_id: UUID) -> UserProfile | None:
        return self.user_profiles.get(profile_id)

    def get_user_profile_by_email(self, email: str) -> UserProfile | None:
        for profile in self.user_profiles.get_all():
            if profile.email == email:
                return profile
        return None

    def update_user_profile(self, profile: UserProfile) -> UserProfile:
        profile.updated_at = datetime.now(UTC)
        return self.user_profiles.update(profile)

    def put_user_profile(self, profile: UserProfile) -> UserProfile:
        """Create or replace a user profile (upsert by ID) in a single atomic write.

        Avoids the previous delete-then-add window, where a crash between the two
        calls left the profile missing entirely.
        """
        return self.user_profiles.add(profile)

    def delete_user_profile(self, profile_id: UUID) -> bool:
        return self.user_profiles.delete(profile_id)

    # Scrape job operations
    def add_scrape_job(self, scrape_job: ScrapeJob) -> ScrapeJob:
        return self.scrape_jobs.add(scrape_job)

    def index_jobs_by_source_id(self) -> dict[str, Job]:
        """Map ``source_job_id`` -> Job for O(1) dedupe during scrape ingest.

        Jobs without a ``source_job_id`` are skipped; they cannot be matched
        against an incoming scrape reliably.
        """
        index: dict[str, Job] = {}
        for job in self.jobs.get_all():
            if job.source_job_id:
                index[job.source_job_id] = job
        return index

    def add_jobs(self, jobs: Iterable[Job]) -> list[Job]:
        """Insert many jobs with a single artifact write."""
        return self.jobs.add_many(jobs)

    def update_jobs(self, jobs: Iterable[Job]) -> int:
        """Update many jobs with a single artifact write."""
        return self.jobs.update_many(jobs)

    def get_scrape_job(self, job_id: UUID) -> ScrapeJob | None:
        return self.scrape_jobs.get(job_id)

    def get_recent_scrape_jobs(self, limit: int = 50) -> list[ScrapeJob]:
        jobs = self.scrape_jobs.get_all()
        jobs.sort(key=lambda j: sort_key_utc(j.created_at), reverse=True)
        return jobs[:limit]

    def update_scrape_job(self, scrape_job: ScrapeJob) -> ScrapeJob:
        return self.scrape_jobs.update(scrape_job)

    # Pipeline statistics
    def get_pipeline_stats_dict(self) -> dict[str, Any]:
        """Get pipeline statistics as a dict for internal use."""
        jobs = self.jobs.get_all()

        by_status: dict[str, int] = {}
        for status in JobStatus:
            by_status[status.value] = len([j for j in jobs if j.status == status])

        by_source: dict[str, int] = {}
        for source in JobSource:
            count = len([j for j in jobs if j.source == source])
            if count > 0:
                by_source[source.value] = count

        by_type: dict[str, int] = {}
        for jtype in JobType:
            count = len([j for j in jobs if j.job_type == jtype])
            if count > 0:
                by_type[jtype.value] = count

        ats_scores = [j.ats_score for j in jobs if j.ats_score is not None]
        match_scores = [j.match_score for j in jobs if j.match_score is not None]

        return {
            "total_jobs": len(jobs),
            "new": by_status.get(JobStatus.NEW.value, 0),
            "fetched": by_status.get(JobStatus.FETCHED.value, 0),
            "matched": by_status.get(JobStatus.MATCHED.value, 0),
            "scored": by_status.get(JobStatus.SCORED.value, 0),
            "applied": by_status.get(JobStatus.APPLIED.value, 0),
            "interview": by_status.get(JobStatus.INTERVIEW.value, 0),
            "offer": by_status.get(JobStatus.OFFER.value, 0),
            "rejected": by_status.get(JobStatus.REJECTED.value, 0),
            "by_source": by_source,
            "by_type": by_type,
            "avg_ats_score": sum(ats_scores) / len(ats_scores) if ats_scores else 0,
            "avg_match_score": sum(match_scores) / len(match_scores) if match_scores else 0,
        }


# Global instance
athena_db = AthenaDB()
