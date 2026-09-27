import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Generic, TypeVar
from uuid import UUID

from filelock import FileLock
from pydantic import BaseModel

from .models import (
    Application,
    ApplicationStatus,
    Job,
    JobSource,
    JobStatus,
    ScrapeJob,
    UserProfile,
)
from .timeutils import ensure_utc, sort_key_utc

T = TypeVar("T", bound=BaseModel)


class AthenaStore(Generic[T]):
    """File-based store for Athena data using JSONL format with file locking."""

    def __init__(self, base_dir: Path, filename: str, model_class: type[T], id_field: str = "id"):
        self.base_dir = base_dir
        self.filepath = base_dir / filename
        self.model_class = model_class
        self.id_field = id_field
        self._lock = FileLock(str(self.filepath) + ".lock")
        self._cache: dict[str, T] = {}
        self._loaded = False

    def _ensure_dir(self) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            self.filepath.write_text("")

    def _load_all(self) -> dict[str, T]:
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
        with self._lock:
            lines = []
            for obj in self._cache.values():
                data = obj.model_dump()
                # Convert UUID and datetime to strings
                data = self._serialize(data)
                lines.append(json.dumps(data))
            self.filepath.write_text("\n".join(lines))

    def _serialize(self, data: Any) -> Any:
        if isinstance(data, UUID):
            return str(data)
        if isinstance(data, datetime):
            # Persist aware UTC even if a naive value was assigned post-validation
            return ensure_utc(data).isoformat()
        if hasattr(data, "__str__") and type(data).__name__ == "HttpUrl":
            return str(data)
        if isinstance(data, dict):
            return {k: self._serialize(v) for k, v in data.items()}
        if isinstance(data, list):
            return [self._serialize(v) for v in data]
        if hasattr(data, "value"):  # Enum
            return data.value
        if isinstance(data, Decimal):
            return str(data)
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
        items = self._load_all()
        items[str(getattr(obj, self.id_field))] = obj
        self._save_all()
        return obj

    def update(self, obj: T) -> T:
        items = self._load_all()
        id_str = str(getattr(obj, self.id_field))
        if id_str in items:
            items[id_str] = obj
            self._save_all()
        return obj

    def delete(self, id: UUID) -> bool:
        items = self._load_all()
        id_str = str(id)
        if id_str in items:
            del items[id_str]
            self._save_all()
            return True
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
            from .paths import get_data_root

            base_dir = get_data_root()

        self.base_dir = base_dir

        # Initialize stores
        self.jobs = AthenaStore(base_dir, "jobs.jsonl", Job)
        self.applications = AthenaStore(base_dir, "applications.jsonl", Application)
        self.user_profiles = AthenaStore(base_dir, "user_profiles.jsonl", UserProfile)
        self.scrape_jobs = AthenaStore(base_dir, "scrape_jobs.jsonl", ScrapeJob)

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

    # Scrape job operations
    def add_scrape_job(self, scrape_job: ScrapeJob) -> ScrapeJob:
        return self.scrape_jobs.add(scrape_job)

    def get_scrape_job(self, job_id: UUID) -> ScrapeJob | None:
        return self.scrape_jobs.get(job_id)

    def get_recent_scrape_jobs(self, limit: int = 50) -> list[ScrapeJob]:
        jobs = self.scrape_jobs.get_all()
        jobs.sort(key=lambda j: sort_key_utc(j.created_at), reverse=True)
        return jobs[:limit]

    def update_scrape_job(self, scrape_job: ScrapeJob) -> ScrapeJob:
        return self.scrape_jobs.update(scrape_job)


# Global instance
athena_db = AthenaDB()
