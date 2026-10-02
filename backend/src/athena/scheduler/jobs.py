import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, UTC
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from ..ats import ats_scorer
from ..matching import matching_engine
from ..models import JobSource, JobStatus, JobType, ScrapeJob
from ..scrapers import scraper_registry
from ..store import athena_db

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
        )

        # Schedule matching/scoring every 30 minutes
        self.scheduler.add_job(
            self.process_new_jobs,
            trigger=IntervalTrigger(minutes=30),
            id="athena_process_jobs",
            name="Athena: Process and score new jobs",
            replace_existing=True,
        )

        # Schedule cleanup daily
        self.scheduler.add_job(
            self.cleanup_old_jobs,
            trigger=IntervalTrigger(days=1),
            id="athena_cleanup",
            name="Athena: Cleanup old jobs",
            replace_existing=True,
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

    async def run_all_scrapes(self) -> None:
        """Run scrape jobs for all default configurations."""
        logger.info("Starting scheduled scrape run")
        for config in self.default_configs:
            try:
                await self.run_scrape_config(config)
            except Exception as e:  # noqa: BLE001
                logger.error(f"Scrape config failed: {config.query} - {e}")

    async def run_scrape_config(self, config: ScrapeConfig) -> ScrapeJob:
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

            # Save jobs and count new/updated
            new_count = 0
            updated_count = 0
            for job in jobs:
                existing = None
                for j in athena_db.jobs.get_all():
                    if j.source_job_id and j.source_job_id == job.source_job_id:
                        existing = j
                        break

                if existing:
                    job.id = existing.id
                    job.scraped_at = existing.scraped_at
                    athena_db.update_job(job)
                    updated_count += 1
                else:
                    athena_db.add_job(job)
                    new_count += 1

            scrape_job.jobs_found = len(jobs)
            scrape_job.jobs_new = new_count
            scrape_job.jobs_updated = updated_count
            scrape_job.status = "completed"
            scrape_job.completed_at = datetime.now(UTC)

            logger.info(
                f"Scrape completed: {config.query} - {len(jobs)} jobs ({new_count} new, {updated_count} updated)"
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
        """Process new jobs: match, score, and queue for applications."""
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
                athena_db.update_job(job)
            return

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

                    # Update job status
                    if ats_breakdown.overall >= 90:
                        job.status = JobStatus.SCORED
                        # Auto-application queuing removed - scheduler is decoupled from MessageBus
                        if ats_scorer.should_auto_apply(ats_breakdown.overall):
                            logger.info(
                                "Job %s meets auto-apply threshold (ATS=%.1f) - "
                                "would queue for application if MessageBus were available",
                                job.id,
                                ats_breakdown.overall,
                            )
                    elif ats_breakdown.overall >= 80:
                        job.status = JobStatus.SCORED
                        # Review flagging removed - scheduler is decoupled from MessageBus
                        logger.info(
                            "Job %s flagged for review (ATS=%.1f) - "
                            "would queue for review if MessageBus were available",
                            job.id,
                            ats_breakdown.overall,
                        )
                    else:
                        job.status = JobStatus.FETCHED

                    athena_db.update_job(job)
                    logger.info(
                        f"Job {job.title} scored: ATS={ats_breakdown.overall}, Match={best_score}"
                    )

            except Exception as e:  # noqa: BLE001
                logger.error(f"Failed to process job {job.id}: {e}")
                job.status = JobStatus.FETCHED
                athena_db.update_job(job)

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
