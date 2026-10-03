"""Status mapping between AI Studio PipelineStatus and OpenCode JobStatus."""

from athena.models.enums import JobStatus

# AI Studio PipelineStatus -> OpenCode JobStatus
PIPELINE_TO_JOB_STATUS = {
    "discovered": JobStatus.NEW,
    "evaluated": JobStatus.SCORED,
    "tailored": JobStatus.SCORED,  # documents generated
    "awaiting_signoff": JobStatus.FLAGGED,
    "submitted": JobStatus.APPLIED,
    "interview": JobStatus.INTERVIEW,
    "offer": JobStatus.OFFER,
}

# OpenCode JobStatus -> AI Studio PipelineStatus (for reverse mapping)
JOB_TO_PIPELINE_STATUS = {
    JobStatus.NEW: "discovered",
    JobStatus.FETCHED: "discovered",
    JobStatus.MATCHED: "evaluated",
    JobStatus.SCORED: "evaluated",
    JobStatus.FLAGGED: "awaiting_signoff",
    JobStatus.APPLIED: "submitted",
    JobStatus.INTERVIEW: "interview",
    JobStatus.OFFER: "offer",
    JobStatus.REJECTED: "submitted",  # no direct equivalent
    JobStatus.ARCHIVED: "submitted",  # no direct equivalent
}


def pipeline_to_job_status(pipeline_status: str) -> JobStatus:
    """Convert AI Studio PipelineStatus to OpenCode JobStatus."""
    return PIPELINE_TO_JOB_STATUS.get(pipeline_status, JobStatus.NEW)


def job_to_pipeline_status(job_status: JobStatus) -> str:
    """Convert OpenCode JobStatus to AI Studio PipelineStatus."""
    return JOB_TO_PIPELINE_STATUS.get(job_status, "discovered")


# AI Studio OpportunityScope (for reference)
OPPORTUNITY_SCOPES = [
    "lilongwe-local",
    "lilongwe-remote",
    "international-remote",
]

# AI Studio OpportunityCategory
OPPORTUNITY_CATEGORIES = [
    "job",
    "consultancy",
]

# AI Studio OpportunityPlatform
OPPORTUNITY_PLATFORMS = [
    "LinkedIn",
    "Upwork",
    "ReliefWeb",
    "Corporate",
    "Devex",
    "MyJobo",
]
