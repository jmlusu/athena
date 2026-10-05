import asyncio
import logging
import os
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Any, cast

import httpx
from pydantic import HttpUrl

try:
    from playwright.async_api import Browser as PlaywrightBrowser
    from playwright.async_api import async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:  # pragma: no cover - playwright is an optional e2e dependency
    PLAYWRIGHT_AVAILABLE = False
    # Only referenced behind the PLAYWRIGHT_AVAILABLE guard, so Any placeholders
    # keep the module importable and mypy happy when the e2e extra is not installed.
    PlaywrightBrowser = Any  # noqa: F811
    async_playwright = Any  # noqa: F811

from athena.models import Job, JobSource, JobType

logger = logging.getLogger(__name__)

# Configurable concurrency for concurrent scraping.
# Defaults to 1 (strictly sequential) for steady-state safety. Bulk backfills can
# raise it for a single run, e.g. ATHENA_MAX_CONCURRENT_SCRAPERS=8, because store
# writes are atomic and guarded rather than truncate-and-rewrite.
MAX_CONCURRENT_SCRAPERS = max(1, int(os.getenv("ATHENA_MAX_CONCURRENT_SCRAPERS", "1")))
scraper_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCRAPERS)

# Hard ceiling on how long one source may occupy a worker. Without this a single
# unreachable board burns the full navigation timeout on every query.
SCRAPE_SOURCE_TIMEOUT = float(os.getenv("ATHENA_SCRAPE_SOURCE_TIMEOUT", "20"))

# A source that fails this many times inside one run is skipped for the remainder
# of that run instead of paying its timeout again for every query.
SOURCE_FAILURE_THRESHOLD = max(1, int(os.getenv("ATHENA_SOURCE_FAILURE_THRESHOLD", "2")))

# Sources known to sit behind auth/anti-bot walls. Kept enabled by default (so a
# working session is noticed) but given a short budget via SHORT_TIMEOUT_SOURCES.
SHORT_TIMEOUT_SOURCES = {
    JobSource.LINKEDIN,
    JobSource.INDEED,
    JobSource.GLASSDOOR,
}
SHORT_TIMEOUT_SECONDS = float(os.getenv("ATHENA_SHORT_SOURCE_TIMEOUT", "8"))


def source_timeout_for(source: JobSource) -> float:
    """Per-source wall-clock budget for a single scrape attempt."""
    if source in SHORT_TIMEOUT_SOURCES:
        return SHORT_TIMEOUT_SECONDS
    return SCRAPE_SOURCE_TIMEOUT


class BaseScraper(ABC):
    """Abstract base class for job scrapers."""

    def __init__(
        self,
        source: JobSource,
        base_url: str,
        headers: dict[str, str] | None = None,
        rate_limit: float = 1.0,  # seconds between requests
        use_browser: bool = False,
    ) -> None:
        self.source = source
        self.base_url = base_url
        self.headers = headers or {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        self.rate_limit = rate_limit
        self.use_browser = use_browser
        self._client: httpx.AsyncClient | None = None
        self._browser: PlaywrightBrowser | None = None
        self._last_request_time = 0.0
        self.logger = logger

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.headers,
                timeout=source_timeout_for(self.source),
                follow_redirects=True,
            )
        return self._client

    async def _get_browser(self) -> PlaywrightBrowser:
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Athena browser fetching requires the optional 'playwright' package")
        if self._browser is None or not self._browser.is_connected():
            playwright = await async_playwright().start()
            self._browser = await playwright.chromium.launch(headless=True)
        return self._browser

    async def _rate_limit_wait(self) -> None:
        import time

        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit:
            await asyncio.sleep(self.rate_limit - elapsed)
        self._last_request_time = time.time()

    async def fetch_html(self, url: str) -> str:
        """Fetch HTML content from URL."""
        await self._rate_limit_wait()
        client = await self._get_client()
        response = await client.get(url)
        response.raise_for_status()
        return response.text

    async def fetch_json(self, url: str) -> dict[str, Any]:
        """Fetch JSON content from URL."""
        await self._rate_limit_wait()
        client = await self._get_client()
        response = await client.get(url)
        response.raise_for_status()
        return cast(dict[str, Any], response.json())

    async def fetch_with_browser(self, url: str, wait_for: str | None = None) -> str:
        """Fetch page using Playwright browser."""
        browser = await self._get_browser()
        budget = source_timeout_for(self.source)
        page = await browser.new_page()
        try:
            # domcontentloaded rather than networkidle: pages with polling or
            # long-lived connections never reach network idle and would otherwise
            # burn the whole budget on every query. The selector wait below still
            # guards against reading before listings render.
            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=budget * 1000,
            )
            if wait_for:
                await page.wait_for_selector(wait_for, timeout=min(10_000, budget * 1000))
            content = await page.content()
            return cast(str, content)
        finally:
            await page.close()

    @abstractmethod
    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        """Search for jobs matching criteria."""
        pass

    @abstractmethod
    async def parse_job_listing(self, element_or_html: Any) -> Job | None:
        """Parse a single job listing from HTML element or page."""
        pass

    async def get_job_details(self, job: Job) -> Job:
        """Fetch detailed job information from job URL."""
        return job

    async def close(self) -> None:
        """Clean up resources."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        if self._browser and self._browser.is_connected():
            await self._browser.close()

    def _create_job(
        self,
        title: str,
        company: str,
        location: str,
        job_type: JobType,
        description: str,
        application_url: str,
        **kwargs: Any,
    ) -> Job:
        """Helper to create a Job with common fields."""
        return Job(
            source=self.source,
            title=title,
            company=company,
            location=location,
            job_type=job_type,
            description=description,
            application_url=HttpUrl(application_url),
            **kwargs,
        )


class ScraperRegistry:
    """Registry for managing all scrapers."""

    def __init__(self) -> None:
        self._scrapers: dict[JobSource, BaseScraper] = {}

    def register(self, scraper: BaseScraper) -> None:
        self._scrapers[scraper.source] = scraper

    def get(self, source: JobSource) -> BaseScraper | None:
        return self._scrapers.get(source)

    def get_all(self) -> list[BaseScraper]:
        return list(self._scrapers.values())

    async def search_all(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
        sources: list[JobSource] | None = None,
    ) -> list[Job]:
        """Search across all registered scrapers with controlled concurrency.

        Applies a per-source time budget and an in-run circuit breaker so a board
        that is down is skipped after a couple of failures instead of paying its
        timeout once per query.
        """
        scrapers: list[BaseScraper] = list(self._scrapers.values())
        if sources:
            scrapers = [s for s in scrapers if s.source in sources]

        failures: dict[JobSource, int] = defaultdict(int)
        skipped: list[JobSource] = []

        async def scrape_with_semaphore(scraper: BaseScraper) -> list[Job]:
            async with scraper_semaphore:
                if failures[scraper.source] >= SOURCE_FAILURE_THRESHOLD:
                    skipped.append(scraper.source)
                    return []
                try:
                    jobs = await asyncio.wait_for(
                        scraper.search_jobs(query, location, job_type, max_results),
                        timeout=source_timeout_for(scraper.source),
                    )
                except Exception as e:  # noqa: BLE001
                    failures[scraper.source] += 1
                    logger.warning(
                        "Scraper %s failed (%d/%d): %s",
                        scraper.source,
                        failures[scraper.source],
                        SOURCE_FAILURE_THRESHOLD,
                        e,
                    )
                    return []
                else:
                    if jobs:
                        failures[scraper.source] = 0
                    logger.info("Scraper %s found %d jobs", scraper.source, len(jobs))
                    return jobs

        tasks = [scrape_with_semaphore(s) for s in scrapers]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_jobs: list[Job] = []
        for result in results:
            if isinstance(result, list):
                all_jobs.extend(result)
            elif isinstance(result, BaseException):
                logger.error("Scraper task raised exception: %s", result)

        if skipped:
            logger.warning(
                "Skipped %d source(s) after repeated failures: %s",
                len(skipped),
                ", ".join(sorted({s.value for s in skipped})),
            )
        return all_jobs

    async def close_all(self) -> None:
        for scraper in self._scrapers.values():
            await scraper.close()


# Global registry instance
scraper_registry = ScraperRegistry()
