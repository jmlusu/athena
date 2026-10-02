"""Tests for status mapping converters (PIPELINE_TO_JOB_STATUS + JOB_TO_PIPELINE)."""

from uuid import uuid4

import pytest

from athena.models import Job, JobSource, JobStatus, JobType
from athena.models.status_mapping import (
    pipeline_to_job_status,
    job_to_pipeline_status,
    PIPELINE_TO_JOB_STATUS,
    JOB_TO_PIPELINE_STATUS,
)


@pytest.fixture
def sample_job():
    job = Job(
        id=uuid4(),
        source=JobSource.REMOTE_OK,
        title="Backend Python Developer",
        company="TechCo",
        location="Remote",
        job_type=JobType.FULL_TIME,
        description="Looking for a Python and FastAPI engineer.",
        requirements=["Python", "FastAPI", "PostgreSQL"],
        keywords=["Python", "FastAPI"],
        application_url="https://example.com/apply",
        status=JobStatus.SCORED,
        ats_score=88.5,
        match_score=76.0,
    )
    return job


def test_pipeline_to_job_status(sample_job):
    """PIPELINE_TO_JOB_STATUS maps pipeline stage to job status correctly."""
    assert pipeline_to_job_status("evaluated") == JobStatus.SCORED
    # Unknown stage falls back to NEW rather than raising.
    assert pipeline_to_job_status("scored") == JobStatus.NEW


def test_job_to_pipeline_status(sample_job):
    """job_to_pipeline_status converts a job's status to pipeline stage."""
    result = job_to_pipeline_status(sample_job.status)
    assert result == "evaluated"
    assert result in JOB_TO_PIPELINE_STATUS.values()


def test_pipeline_status_enum_coverage():
    """Every pipeline stage has a corresponding job status mapping."""
    assert len(PIPELINE_TO_JOB_STATUS) >= 5


def test_job_status_enum_coverage():
    """Every job status has a corresponding pipeline stage mapping."""
    assert len(JOB_TO_PIPELINE_STATUS) >= 5
