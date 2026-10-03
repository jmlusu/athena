"""Adapter for converting between AI Studio Opportunity and OpenCode Job models."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from athena.models.enums import JobSource, JobStatus, JobType
from athena.models.jobs import Job, SalaryRange
from athena.models.status_mapping import pipeline_to_job_status
from athena.timeutils import ensure_utc


def opportunity_to_job(opp: dict[str, Any], profile_id: UUID | None = None) -> Job:
    """Convert AI Studio Opportunity dict to OpenCode Job model."""
    # Map scope to location and job_type
    scope = opp.get("scope", "international-remote")
    opp.get("category", "job")

    if scope == "lilongwe-local":
        location = opp.get("location", "Lilongwe, Malawi")
        job_type = JobType.FULL_TIME
    elif scope == "lilongwe-remote":
        location = opp.get("location", "Lilongwe, Malawi (Remote)")
        job_type = JobType.REMOTE
    else:  # international-remote
        location = opp.get("location", "Global Remote")
        job_type = JobType.REMOTE

    # Map platform to JobSource
    platform = opp.get("platform", "LinkedIn")
    source_map = {
        "LinkedIn": JobSource.LINKEDIN,
        "Indeed": JobSource.INDEED,
        "Glassdoor": JobSource.GLASSDOOR,
        "RemoteOK": JobSource.REMOTEOK,
        "WeWorkRemotely": JobSource.WEWORKREMOTELY,
        "Remote.co": JobSource.REMOTECO,
        "Upwork": JobSource.UPWORK,
        "Devex": JobSource.DEVEX,
        "ReliefWeb": JobSource.RELIEFWEB,
        "Corporate": JobSource.CORPORATE,
        "MyJobo": JobSource.MYJOBO,
    }
    source = source_map.get(platform, JobSource.LINKEDIN)

    # Parse salary/budget
    salary_range = None
    salary_str = opp.get("salaryOrBudget", "")
    if salary_str:
        salary_range = _parse_salary_range(salary_str)

    # Parse posted date
    posted_at = datetime.now(UTC)
    posted_str = opp.get("postedDate", "")
    if posted_str:
        posted_at = _parse_posted_date(posted_str)

    return Job(
        id=uuid4(),
        source=source,
        source_job_id=opp.get("id", str(uuid4())),
        title=opp.get("title", "Untitled Position"),
        company=opp.get("company", "Unknown Company"),
        location=location,
        job_type=job_type,
        description=opp.get("description", ""),
        requirements=opp.get("requirements", []),
        responsibilities=[],
        keywords=opp.get("matchedSkills", []) + opp.get("missingSkills", []),
        salary_range=salary_range,
        posted_date=posted_at,
        expiry_date=_parse_deadline(opp.get("deadline", "")),
        application_url=opp.get("applicationUrl", "https://example.com/apply"),
        apply_email=None,
        contact_person=None,
        company_website=None,
        company_size=None,
        company_industry=None,
        benefits=[],
        ats_score=opp.get("atsScore"),
        match_score=None,
        match_tier=None,
        status=pipeline_to_job_status(opp.get("status", "discovered")),
        scraped_at=datetime.now(UTC),
        metadata={
            "ai_studio_original": True,
            "original_scope": scope,
            "original_platform": platform,
            "dehumanized_pitch": opp.get("dehumanizedPitch"),
            "is_flagged": opp.get("isFlagged", False),
        },
    )



def job_to_opportunity(job: Job, profile_data: dict | None = None) -> dict[str, Any]:
    """Convert OpenCode Job model to AI Studio Opportunity dict."""
    # Determine scope from location and job_type
    scope = "international-remote"
    if "lilongwe" in job.location.lower():
        scope = "lilongwe-local" if job.job_type != JobType.REMOTE else "lilongwe-remote"
    elif job.job_type == JobType.REMOTE:
        scope = "lilongwe-remote" if "malawi" in job.location.lower() else "international-remote"

    # Determine platform from source
    source_to_platform = {
        JobSource.LINKEDIN: "LinkedIn",
        JobSource.INDEED: "Indeed",
        JobSource.GLASSDOOR: "Glassdoor",
        JobSource.REMOTEOK: "RemoteOK",
        JobSource.WEWORKREMOTELY: "WeWorkRemotely",
        JobSource.REMOTECO: "Remote.co",
        JobSource.UPWORK: "Upwork",
        JobSource.DEVEX: "Devex",
        JobSource.RELIEFWEB: "ReliefWeb",
        JobSource.CORPORATE: "Corporate",
        JobSource.MYJOBO: "MyJobo",
    }
    platform = source_to_platform.get(job.source, "LinkedIn")

    # Map status
    from athena.models.status_mapping import job_to_pipeline_status

    pipeline_status = job_to_pipeline_status(job.status)

    opp = {
        "id": str(job.id),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "category": "consultancy" if "consult" in job.title.lower() else "job",
        "scope": scope,
        "platform": platform,
        "description": job.description,
        "requirements": job.requirements,
        "salaryOrBudget": _format_salary_range(job.salary_range),
        "deadline": job.expiry_date.isoformat() if job.expiry_date else "",
        "atsScore": job.ats_score or 0,
        "postedDate": job.scraped_at.strftime("%Y-%m-%d") if job.scraped_at else "",
        "status": pipeline_status,
        "isFlagged": job.status == JobStatus.FLAGGED,
        "matchedSkills": job.metadata.get("matchedSkills", []) if job.metadata else [],
        "missingSkills": job.metadata.get("missingSkills", []) if job.metadata else [],
        "dehumanizedPitch": job.metadata.get("dehumanized_pitch") if job.metadata else None,
        "autoCreatedDocs": {
            "hasResume": bool(job.metadata.get("tailored_resume_path")) if job.metadata else False,
            "hasCoverLetter": bool(job.metadata.get("tailored_cover_letter_path"))
            if job.metadata
            else False,
            "hasExecutiveSummary": False,
            "hasProposal": False,
        },
    }

    # Add tailored documents if present in metadata
    if job.metadata:
        if job.metadata.get("tailored_resume"):
            opp["tailoredResume"] = job.metadata["tailored_resume"]
        if job.metadata.get("tailored_cover_letter"):
            opp["tailoredCoverLetter"] = job.metadata["tailored_cover_letter"]
        if job.metadata.get("tailored_proposal"):
            opp["tailoredProposal"] = job.metadata["tailored_proposal"]
        if job.metadata.get("receipt_data"):
            opp["receipt"] = job.metadata["receipt_data"]

    return opp


def _parse_salary_range(salary_str: str) -> SalaryRange | None:
    """Parse salary string into SalaryRange."""
    # Simple parser for common formats
    import re

    # Match patterns like "$38,000 - $48,000 USD / yr" or "MWK 3,200,000 - 4,500,000 / month"
    numbers = re.findall(r"[\d,]+", salary_str.replace(",", ""))
    if len(numbers) >= 2:
        try:
            min_val = int(numbers[0])
            max_val = int(numbers[1])
            currency = "USD" if "$" in salary_str else "MWK"
            period = "/yr" if "/yr" in salary_str or "/year" in salary_str else "/month"
            return SalaryRange(
                min_amount=min_val,
                max_amount=max_val,
                currency=currency,
                period=period,
            )
        except ValueError:
            pass
    return None


def _format_salary_range(salary: SalaryRange | None) -> str:
    """Format SalaryRange back to string."""
    if not salary:
        return ""
    period_str = salary.period.replace("/", "").upper()
    return f"{salary.currency} {salary.min_amount:,} - {salary.max_amount:,} / {period_str}"


def _parse_posted_date(posted_str: str) -> datetime:
    """Parse posted date string like '1 hour ago', '3 hours ago', '1 day ago'."""
    import re

    now = datetime.now(UTC)
    posted_lower = posted_str.lower()

    if "just now" in posted_lower or posted_lower.strip() == "now":
        return now

    # Match "X hours ago", "X days ago"
    match = re.search(r"(\d+)\s+(hour|day|week|month)s?\s+ago", posted_lower)
    if match:
        value = int(match.group(1))
        unit = match.group(2)
        if unit == "hour":
            return now - timedelta(hours=value)
        if unit == "day":
            return now - timedelta(days=value)
        if unit == "week":
            return now - timedelta(weeks=value)
        if unit == "month":
            # Approximation: a month is treated as 30 days.
            return now - timedelta(days=30 * value)

    return now


def _parse_deadline(deadline_str: str) -> datetime | None:
    """Parse deadline string like '2026-10-15'."""
    if not deadline_str:
        return None
    try:
        return ensure_utc(datetime.fromisoformat(deadline_str))
    except ValueError:
        return None
