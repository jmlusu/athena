import re
from datetime import datetime
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from athena.models import Job, JobSource, JobType, SalaryRange
from athena.timeutils import ensure_utc

from .base import BaseScraper


class LinkedInScraper(BaseScraper):
    """Scraper for LinkedIn Jobs (uses public search, limited)."""

    def __init__(self):
        super().__init__(
            source=JobSource.LINKEDIN,
            base_url="https://www.linkedin.com",
            rate_limit=3.0,
            use_browser=True,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        search_query = quote_plus(query)
        location_param = quote_plus(location or "Remote")
        url = (
            f"{self.base_url}/jobs/search?keywords={search_query}&location={location_param}&f_WT=2"
        )

        try:
            html = await self.fetch_with_browser(url, wait_for=".job-search-card")
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".job-search-card, .base-card")

            for card in job_cards[:max_results]:
                job = await self.parse_job_listing(card)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape LinkedIn: {e}")

        return jobs

    async def parse_job_listing(self, element) -> Job | None:
        try:
            title_elem = element.select_one(".base-search-card__title, h3 a")
            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            job_url = title_elem.get("href", "")
            if job_url and not job_url.startswith("http"):
                job_url = urljoin(self.base_url, job_url)

            company_elem = element.select_one(".base-search-card__subtitle, h4 a")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            location_elem = element.select_one(".job-search-card__location, .job-location")
            location = location_elem.get_text(strip=True) if location_elem else "Remote"

            return self._create_job(
                title=title,
                company=company,
                location=location,
                job_type=JobType.FULL_TIME,
                description="",
                application_url=job_url,
                source_job_id=job_url,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse LinkedIn listing: {e}")
            return None

    async def get_job_details(self, job: Job) -> Job:
        if not job.application_url:
            return job
        try:
            html = await self.fetch_with_browser(
                str(job.application_url),
                wait_for=".description__text",
            )
            soup = BeautifulSoup(html, "html.parser")
            desc_elem = soup.select_one(".description__text, .show-more-less-html__markup")
            if desc_elem:
                job.description = desc_elem.get_text(strip=True)
                job.requirements = self._extract_requirements(job.description)
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to get LinkedIn job details: {e}")
        return job

    def _extract_requirements(self, description: str) -> list[str]:
        req_patterns = [
            r"(?:requirements?|qualifications?):\s*(.*?)(?:\n\n|\n[A-Z]|$)",
            r"(?:must have|required):\s*(.*?)(?:\n|$)",
        ]
        requirements = []
        for pattern in req_patterns:
            matches = re.findall(pattern, description, re.IGNORECASE | re.DOTALL)
            for match in matches:
                items = re.split(r"[;\nâ€¢\-]", match)
                requirements.extend([item.strip() for item in items if item.strip()])
        return requirements[:20]


class IndeedScraper(BaseScraper):
    """Scraper for Indeed Jobs."""

    def __init__(self):
        super().__init__(
            source=JobSource.INDEED,
            base_url="https://www.indeed.com",
            rate_limit=2.0,
            use_browser=True,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        search_query = quote_plus(query)
        location_param = quote_plus(location or "Remote")
        job_type_param = f"&jt={job_type.value}" if job_type else ""
        url = (
            f"{self.base_url}/jobs?q={search_query}&l={location_param}{job_type_param}&remotejob=1"
        )

        try:
            html = await self.fetch_with_browser(url, wait_for=".job_seen_beacon")
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".job_seen_beacon, .slider_item, .result")

            for card in job_cards[:max_results]:
                job = await self.parse_job_listing(card)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape Indeed: {e}")

        return jobs

    async def parse_job_listing(self, element) -> Job | None:
        try:
            title_elem = element.select_one("h2 a, .jobTitle a, [data-testid='job-title']")
            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            job_url = title_elem.get("href", "")
            if job_url and not job_url.startswith("http"):
                job_url = urljoin(self.base_url, job_url)

            company_elem = element.select_one(".companyName, [data-testid='company-name']")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            location_elem = element.select_one(".companyLocation, [data-testid='job-location']")
            location = location_elem.get_text(strip=True) if location_elem else "Remote"

            salary_elem = element.select_one(".salary-snippet, [data-testid='salary']")
            salary_text = salary_elem.get_text(strip=True) if salary_elem else ""

            return self._create_job(
                title=title,
                company=company,
                location=location,
                job_type=JobType.FULL_TIME,
                description=salary_text,
                application_url=job_url,
                source_job_id=job_url,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse Indeed listing: {e}")
            return None


class GlassdoorScraper(BaseScraper):
    """Scraper for Glassdoor Jobs."""

    def __init__(self):
        super().__init__(
            source=JobSource.GLASSDOOR,
            base_url="https://www.glassdoor.com",
            rate_limit=3.0,
            use_browser=True,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        search_query = quote_plus(query)
        location_param = quote_plus(location or "Remote")
        url = f"{self.base_url}/Job/jobs.htm?sc.keyword={search_query}&locT=C&locId=1&locKeyword={location_param}"

        try:
            html = await self.fetch_with_browser(url, wait_for=".react-job-listing")
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".react-job-listing, .jobListing")

            for card in job_cards[:max_results]:
                job = await self.parse_job_listing(card)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape Glassdoor: {e}")

        return jobs

    async def parse_job_listing(self, element) -> Job | None:
        try:
            title_elem = element.select_one(".jobTitle, .jobLink")
            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            job_url = title_elem.get("href", "")
            if job_url and not job_url.startswith("http"):
                job_url = urljoin(self.base_url, job_url)

            company_elem = element.select_one(".jobEmployerName, .employerName")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            location_elem = element.select_one(".jobLocation, .location")
            location = location_elem.get_text(strip=True) if location_elem else "Remote"

            return self._create_job(
                title=title,
                company=company,
                location=location,
                job_type=JobType.FULL_TIME,
                description="",
                application_url=job_url,
                source_job_id=job_url,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse Glassdoor listing: {e}")
            return None


class RemoteOKScraper(BaseScraper):
    """Scraper for RemoteOK (uses their public JSON API)."""

    def __init__(self):
        super().__init__(
            source=JobSource.REMOTE_OK,
            base_url="https://remoteok.com",
            rate_limit=2.0,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        try:
            data = await self.fetch_json(f"{self.base_url}/api")
            if not isinstance(data, list):
                return jobs

            terms = [t for t in query.lower().split() if t]
            for item in data:
                if len(jobs) >= max_results:
                    break
                if not isinstance(item, dict) or not item.get("position"):
                    continue

                haystack = " ".join(
                    [
                        str(item.get("position", "")),
                        str(item.get("company", "")),
                        " ".join(item.get("tags") or []),
                        str(item.get("description", ""))[:500],
                    ],
                ).lower()
                if terms and not any(t in haystack for t in terms):
                    continue

                job = self._job_from_api_item(item)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape RemoteOK: {e}")

        return jobs

    def _job_from_api_item(self, item: dict) -> Job | None:
        try:
            url = item.get("url") or item.get("apply_url") or item.get("original") or ""
            if not url:
                url = f"{self.base_url}/remote-jobs/{item.get('slug') or item.get('id')}"
            if not url.startswith("http"):
                url = urljoin(self.base_url, url)

            description = item.get("description") or ""
            # Strip HTML tags lightly for the description body
            description = re.sub(r"<[^>]+>", " ", description)
            description = re.sub(r"\s+", " ", description).strip()

            salary_min = item.get("salary_min")
            salary_max = item.get("salary_max")
            salary_range = None
            if salary_min or salary_max:
                salary_range = SalaryRange(
                    min=salary_min,
                    max=salary_max,
                    currency="USD",
                    period="yearly",
                )

            posted = None
            if item.get("date"):
                try:
                    posted = ensure_utc(
                        datetime.fromisoformat(str(item["date"])),
                    )
                except ValueError:
                    posted = None

            return self._create_job(
                title=str(item.get("position", "")).strip(),
                company=str(item.get("company", "Unknown")).strip() or "Unknown",
                location=str(item.get("location") or "Remote").strip() or "Remote",
                job_type=JobType.FULL_TIME,
                description=description,
                application_url=url,
                source_job_id=str(item.get("id") or url),
                keywords=[str(t) for t in (item.get("tags") or [])],
                salary_range=salary_range,
                posted_date=posted,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse RemoteOK API item: {e}")
            return None

    async def parse_job_listing(self, element) -> Job | None:
        # HTML path unused — API path is authoritative
        return None


class WeWorkRemotelyScraper(BaseScraper):
    """Scraper for We Work Remotely."""

    def __init__(self):
        super().__init__(
            source=JobSource.WE_WORK_REMOTELY,
            base_url="https://weworkremotely.com",
            rate_limit=2.0,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        search_query = quote_plus(query)
        url = f"{self.base_url}/remote-jobs/search?term={search_query}"

        try:
            html = await self.fetch_html(url)
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".jobs li, .job-listing")

            for card in job_cards[:max_results]:
                job = await self.parse_job_listing(card)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape We Work Remotely: {e}")

        return jobs

    async def parse_job_listing(self, element) -> Job | None:
        try:
            title_elem = element.select_one(".title, h2 a")
            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            job_url = title_elem.get("href", "")
            if job_url and not job_url.startswith("http"):
                job_url = urljoin(self.base_url, job_url)

            company_elem = element.select_one(".company, .company-name")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            location_elem = element.select_one(".region, .location")
            location = location_elem.get_text(strip=True) if location_elem else "Remote"

            return self._create_job(
                title=title,
                company=company,
                location=location,
                job_type=JobType.FULL_TIME,
                description="",
                application_url=job_url,
                source_job_id=job_url,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse We Work Remotely listing: {e}")
            return None


class RemoteCoScraper(BaseScraper):
    """Scraper for Remote.co."""

    def __init__(self):
        super().__init__(
            source=JobSource.REMOTE_CO,
            base_url="https://remote.co",
            rate_limit=2.0,
        )

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        job_type: JobType | None = None,
        max_results: int = 100,
    ) -> list[Job]:
        jobs = []
        search_query = quote_plus(query)
        url = f"{self.base_url}/remote-jobs/search/?search_keywords={search_query}"

        try:
            html = await self.fetch_html(url)
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".job-card, .job-listing, article.job")

            for card in job_cards[:max_results]:
                job = await self.parse_job_listing(card)
                if job:
                    jobs.append(job)

        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to scrape Remote.co: {e}")

        return jobs

    async def parse_job_listing(self, element) -> Job | None:
        try:
            title_elem = element.select_one("h2 a, .job-title a")
            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            job_url = urljoin(self.base_url, title_elem.get("href", ""))

            company_elem = element.select_one(".company, .company-name")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            location_elem = element.select_one(".location, .job-location")
            location = location_elem.get_text(strip=True) if location_elem else "Remote"

            return self._create_job(
                title=title,
                company=company,
                location=location,
                job_type=JobType.FULL_TIME,
                description="",
                application_url=job_url,
                source_job_id=job_url,
            )
        except Exception as e:  # noqa: BLE001
            self.logger.error(f"Failed to parse Remote.co listing: {e}")
            return None


def register_remote_scrapers(registry):
    """Register all remote job scrapers with the registry."""
    registry.register(LinkedInScraper())
    registry.register(IndeedScraper())
    registry.register(GlassdoorScraper())
    registry.register(RemoteOKScraper())
    registry.register(WeWorkRemotelyScraper())
    registry.register(RemoteCoScraper())
