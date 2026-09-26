from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl

from ..models import (
    ApplicationStatus,
    Document,
    Education,
    Experience,
    JobPreferences,
    JobSource,
    JobStatus,
    JobType,
    MatchTier,
    SalaryRange,
    Skill,
)


# Request/Response schemas
class JobCreate(BaseModel):
    source: JobSource
    source_job_id: str | None = None
    title: str
    company: str
    location: str
    job_type: JobType
    description: str
    requirements: list[str] = []
    responsibilities: list[str] = []
    keywords: list[str] = []
    salary_range: SalaryRange | None = None
    posted_date: datetime | None = None
    expiry_date: datetime | None = None
    application_url: HttpUrl
    apply_email: EmailStr | None = None
    contact_person: str | None = None
    company_website: HttpUrl | None = None
    company_size: str | None = None
    company_industry: str | None = None
    benefits: list[str] = []


class JobResponse(BaseModel):
    id: UUID
    source: JobSource
    source_job_id: str | None
    title: str
    company: str
    location: str
    job_type: JobType
    description: str
    requirements: list[str]
    responsibilities: list[str]
    keywords: list[str]
    salary_range: SalaryRange | None
    posted_date: datetime | None
    expiry_date: datetime | None
    application_url: HttpUrl
    apply_email: EmailStr | None
    contact_person: str | None
    company_website: HttpUrl | None
    company_size: str | None
    company_industry: str | None
    benefits: list[str]
    ats_score: float | None
    match_score: float | None
    match_tier: MatchTier | None
    status: JobStatus
    scraped_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    limit: int
    offset: int


class JobFilter(BaseModel):
    status: JobStatus | None = None
    source: JobSource | None = None
    job_type: JobType | None = None
    location: str | None = None
    min_ats_score: float | None = None
    max_ats_score: float | None = None
    min_match_score: float | None = None
    max_match_score: float | None = None
    search: str | None = None
    limit: int = 50
    offset: int = 0


class UserProfileCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    location: str | None = None
    linkedin_url: HttpUrl | None = None
    portfolio_url: HttpUrl | None = None
    github_url: HttpUrl | None = None
    headline: str = ""
    summary: str = ""
    skills: list[Skill] = []
    experience: list[Experience] = []
    education: list[Education] = []
    certifications: list[str] = []
    languages: list[str] = []
    preferences: JobPreferences = Field(default_factory=JobPreferences)


class UserProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: str | None
    location: str | None
    linkedin_url: HttpUrl | None
    portfolio_url: HttpUrl | None
    github_url: HttpUrl | None
    headline: str
    summary: str
    skills: list[Skill]
    experience: list[Experience]
    education: list[Education]
    certifications: list[str]
    languages: list[str]
    preferences: JobPreferences
    documents: list[Document]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    job_id: UUID
    user_profile_id: UUID
    resume_id: UUID
    cover_letter_id: UUID | None = None


class ApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    user_profile_id: UUID
    resume_id: UUID
    cover_letter_id: UUID | None
    tailored_resume_path: str | None
    tailored_cover_letter_path: str | None
    ats_score: float
    match_score: float
    status: ApplicationStatus
    submitted_at: datetime | None
    confirmed_at: datetime | None
    receipt_data: dict[str, Any]
    follow_up_dates: list[datetime]
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    applications: list[ApplicationResponse]
    total: int


class ScrapeJobRequest(BaseModel):
    query: str
    location: str | None = None
    job_type: JobType | None = None
    max_results: int = 100
    sources: list[JobSource] | None = None
    user_profile_id: UUID | None = None


class ScrapeJobResponse(BaseModel):
    id: UUID
    source: JobSource
    query: str
    location: str | None
    job_type: JobType | None
    max_results: int
    status: str
    jobs_found: int
    jobs_new: int
    jobs_updated: int
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class ATSScoreResponse(BaseModel):
    job_id: UUID
    profile_id: UUID
    keyword_match: float
    semantic_similarity: float
    experience_relevance: float
    education_match: float
    overall: float
    details: dict[str, Any]
    tier: str
    should_auto_apply: bool
    should_flag_for_review: bool


class MatchJobsRequest(BaseModel):
    profile_id: UUID
    job_ids: list[UUID] | None = None
    top_k: int | None = None
    min_score: float = 0


class MatchJobsResponse(BaseModel):
    matches: list[dict[str, Any]]
    total: int


class PipelineStatsResponse(BaseModel):
    total_jobs: int
    new: int
    fetched: int
    matched: int
    scored: int
    applied: int
    interview: int
    offer: int
    rejected: int
    by_source: dict[str, int]
    by_type: dict[str, int]
    avg_ats_score: float
    avg_match_score: float


class ScrapeStatsResponse(BaseModel):
    recent_scrapes: list[ScrapeJobResponse]
    total_jobs_scraped: int
    total_new_jobs: int
    last_scrape_at: datetime | None


class ApplyRequest(BaseModel):
    user_profile_id: UUID
    resume_id: UUID
    cover_letter_id: UUID | None = None


class TailorResumeRequest(BaseModel):
    user_profile_id: UUID
    output_format: Literal["docx", "pdf", "both"] = "docx"


class CoverLetterRequest(BaseModel):
    user_profile_id: UUID
    output_format: Literal["docx", "pdf", "both"] = "docx"


class FlagJobRequest(BaseModel):
    reason: str | None = None


class DocumentGenerateResponse(BaseModel):
    filename: str
    path: str | None
    warnings: list[str]
