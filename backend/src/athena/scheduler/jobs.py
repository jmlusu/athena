import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from athena.ats import ats_scorer
from athena.documents import DocumentGenerator
from athena.matching import matching_engine
from athena.models import Job, JobSource, JobStatus, JobType, ScrapeJob
from athena.scrapers import scraper_registry
from athena.store import athena_db

logger = logging.getLogger(__name__)


@dataclass
class ScrapeConfig:
    """Configuration for a scrape job."""

    query: str
    location: str | None = None
    job_type: JobType | None = None
    max_results: int = 100
    sources: list[JobSource] | None = None
    user_profile_id: UUID | None = None  # For matching/scoring


class AthenaScheduler:
    """Scheduler for Athena scraping and processing jobs."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._running = False
        self.default_configs: list[ScrapeConfig] = []
        # Single-flight guards. The scheduled cron entry and an explicit
        # POST /scrape both reach these coroutines, and APScheduler only prevents
        # overlap per job id, so concurrent runs would otherwise write the jobs
        # artifact at the same time.
        self._scrape_lock = asyncio.Lock()
        self._process_lock = asyncio.Lock()

    def add_default_config(self, config: ScrapeConfig) -> None:
        """Add a default scrape configuration."""
        self.default_configs.append(config)

    def start(self) -> None:
        """Start the scheduler."""
        if self._running:
            return

        # Schedule scrape jobs every 4 hours
        self.scheduler.add_job(
            self.run_all_scrapes,
            trigger=IntervalTrigger(hours=4),
            id="athena_scrape_jobs",
            name="Athena: Scrape all job sources",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        # Schedule matching/scoring every 30 minutes
        self.scheduler.add_job(
            self.process_new_jobs,
            trigger=IntervalTrigger(minutes=30),
            id="athena_process_jobs",
            name="Athena: Process and score new jobs",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        # Schedule cleanup daily
        self.scheduler.add_job(
            self.cleanup_old_jobs,
            trigger=IntervalTrigger(days=1),
            id="athena_cleanup",
            name="Athena: Cleanup old jobs",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        self.scheduler.start()
        self._running = True
        logger.info("Athena scheduler started")

    def stop(self) -> None:
        """Stop the scheduler."""
        if not self._running:
            return
        self.scheduler.shutdown()
        self._running = False
        logger.info("Athena scheduler stopped")

    @property
    def scrape_in_progress(self) -> bool:
        return self._scrape_lock.locked()

    @property
    def process_in_progress(self) -> bool:
        return self._process_lock.locked()

    async def run_all_scrapes(self) -> None:
        """Run scrape jobs for all default configurations."""
        logger.info("Starting scheduled scrape run")
        for config in self.default_configs:
            try:
                await self.run_scrape_config(config)
            except Exception as e:  # noqa: BLE001
                logger.error(f"Scrape config failed: {config.query} - {e}")

    async def run_scrape_config(self, config: ScrapeConfig) -> ScrapeJob:
        """Run a single scrape configuration.

        Serialised against every other scrape entry point via ``_scrape_lock`` so
        two runs never persist the jobs artifact simultaneously.
        """
        async with self._scrape_lock:
            return await self._run_scrape_config_locked(config)

    async def _run_scrape_config_locked(self, config: ScrapeConfig) -> ScrapeJob:
        """Run a single scrape configuration."""
        scrape_job = ScrapeJob(
            source=config.sources[0] if config.sources else JobSource.LINKEDIN,
            query=config.query,
            location=config.location,
            job_type=config.job_type,
            max_results=config.max_results,
            status="running",
            started_at=datetime.now(UTC),
        )
        athena_db.add_scrape_job(scrape_job)

        try:
            sources = config.sources or None
            jobs = await scraper_registry.search_all(
                query=config.query,
                location=config.location,
                job_type=config.job_type,
                max_results=config.max_results,
                sources=sources,
            )

            # Save jobs and count new/updated.
            # Dedupe via a source_job_id index (O(N+M)) instead of rescanning every
            # stored job per scraped job, and persist once rather than rewriting the
            # whole artifact on each add/update.
            existing_by_source_id = athena_db.index_jobs_by_source_id()
            to_add: list[Job] = []
            to_update: list[Job] = []

            for job in jobs:
                existing = (
                    existing_by_source_id.get(job.source_job_id) if job.source_job_id else None
                )
                if existing:
                    job.id = existing.id
                    job.scraped_at = existing.scraped_at
                    to_update.append(job)
                    # Keep the index current so duplicate source ids inside one
                    # scrape response collapse onto the same stored record.
                    existing_by_source_id[job.source_job_id] = job
                else:
                    to_add.append(job)
                    if job.source_job_id:
                        existing_by_source_id[job.source_job_id] = job

            new_count = len(to_add)
            updated_count = len(to_update)
            if to_update:
                athena_db.update_jobs(to_update)
            if to_add:
                athena_db.add_jobs(to_add)

            scrape_job.jobs_found = len(jobs)
            scrape_job.jobs_new = new_count
            scrape_job.jobs_updated = updated_count
            scrape_job.status = "completed"
            scrape_job.completed_at = datetime.now(UTC)

            logger.info(
                f"Scrape completed: {config.query} - {len(jobs)} jobs ({new_count} new, {updated_count} updated)",
            )

        except Exception as e:  # noqa: BLE001
            scrape_job.status = "failed"
            scrape_job.error = str(e)
            scrape_job.completed_at = datetime.now(UTC)
            logger.error(f"Scrape failed: {config.query} - {e}")

        athena_db.update_scrape_job(scrape_job)

        # Trigger processing of new jobs
        if scrape_job.jobs_new > 0:
            await self.process_new_jobs()

        return scrape_job

    async def process_new_jobs(self) -> None:
        """Process new jobs: match, score, and queue for applications.

        Serialised via ``_process_lock``: this is reachable both from the
        30-minute cron entry and from the tail of a scrape run, and both would
        otherwise score and rewrite the same jobs concurrently.
        """
        async with self._process_lock:
            await self._process_new_jobs_locked()

    async def _process_new_jobs_locked(self) -> None:
        logger.info("Processing new jobs for matching and scoring")

        # Get unscored jobs
        new_jobs = athena_db.jobs.filter(status=JobStatus.NEW)
        fetched_jobs = athena_db.jobs.filter(status=JobStatus.FETCHED)
        all_new = new_jobs + fetched_jobs

        if not all_new:
            logger.info("No new jobs to process")
            return

        # Get active user profiles
        profiles = athena_db.user_profiles.get_all()
        if not profiles:
            logger.warning("No user profiles found for matching")
            # Just mark as fetched
            for job in all_new:
                job.status = JobStatus.FETCHED
            athena_db.update_jobs(all_new)
            return

        # Score every job in memory, then persist once. Calling update_job per job
        # rewrote the entire jobs artifact each time.
        dirty: list[Job] = []
        for job in all_new:
            try:
                # For each profile, compute match and ATS score
                best_match = None
                best_score = 0.0

                for profile in profiles:
                    match_score = matching_engine.compute_match_score(profile, job)
                    if match_score > best_score:
                        best_score = match_score
                        best_match = profile

                if best_match:
                    job.match_score = best_score
                    job.match_tier = matching_engine._get_match_tier(best_score)

                    # Compute ATS score
                    ats_breakdown = ats_scorer.score_resume_against_job(best_match, job)
                    job.ats_score = ats_breakdown.overall

                    # Retention / automation bands.
                    #   >= 90 : auto-apply + tailored resume and cover letter
                    #   80-89 : flag for human review
                    #   70-79 : retain
                    #   <  70 : drop from the retained set
                    overall = ats_breakdown.overall

                    if overall >= 90:
                        job.status = JobStatus.APPLIED
                        await self._auto_apply(best_match, job)
                    elif overall >= 80:
                        job.status = JobStatus.FLAGGED
                        logger.info(
                            "Job %s flagged for review (ATS=%.1f): %s",
                            job.id,
                            overall,
                            job.title,
                        )
                    elif overall >= 70:
                        job.status = JobStatus.SCORED
                    else:
                        job.status = JobStatus.REJECTED

                    dirty.append(job)
                    logger.info(
                        f"Job {job.title} scored: ATS={ats_breakdown.overall}, Match={best_score}",
                    )

            except Exception as e:  # noqa: BLE001
                logger.error(f"Failed to process job {job.id}: {e}")
                job.status = JobStatus.FETCHED
                dirty.append(job)

        if dirty:
            athena_db.update_jobs(dirty)

    async def _auto_apply(self, profile, job) -> None:
        """Generate tailored resume + cover letter for a >=90 job.

        Persists both documents to the per-job output directory and attaches
        them to the job so downstream consumers can pick them up. Application
        submission itself stays out of scope: there is no MessageBus wired up,
        so this prepares the artefacts and records the intent rather than
        pretending an application was sent.
        """
        slug = f"{job.company[:40]}-{job.title[:60]}".replace("/", "-").replace(" ", "_")
        out_dir = athena_db.base_dir / "documents" / str(job.id)
        out_dir.mkdir(parents=True, exist_ok=True)

        generator = DocumentGenerator()
        try:
            resume, cover = await generator.generate_both(profile, job)
        except Exception as exc:  # noqa: BLE001
            logger.error("Auto-apply document generation failed for job %s: %s", job.id, exc)
            return

        written = []
        for label, doc in (("resume", resume), ("cover_letter", cover)):
            if doc is None or not doc.docx_bytes:
                continue
            path = out_dir / f"{slug}-{label}.docx"
            path.write_bytes(doc.docx_bytes)
            written.append(path.name)

        job.auto_applied = True
        job.auto_apply_documents = written
        logger.info(
            "Auto-applied %s at %s: wrote %s",
            job.title,
            job.company,
            ", ".join(written) or "no documents",
        )

    async def cleanup_old_jobs(self, days: int = 90) -> None:
        """Clean up old jobs beyond retention period."""
        cutoff = datetime.now(UTC) - timedelta(days=days)

        all_jobs = athena_db.jobs.get_all()
        deleted = 0
        for job in all_jobs:
            if job.scraped_at < cutoff and job.status in [JobStatus.ARCHIVED, JobStatus.REJECTED]:
                athena_db.jobs.delete(job.id)
                deleted += 1

        logger.info(f"Cleaned up {deleted} old jobs")


# Global scheduler instance
athena_scheduler = AthenaScheduler()
