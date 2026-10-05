from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field, HttpUrl

from athena.timeutils import UTCDateTime

from .enums import ApplicationStatus, JobSource, JobStatus, JobType, MatchTier


class SalaryRange(BaseModel):
    min: Decimal | None = None
    max: Decimal | None = None
    currency: str = "USD"
    period: str = "yearly"  # yearly, monthly, hourly


class Skill(BaseModel):
    name: str
    level: str | None = None  # beginner, intermediate, advanced, expert
    years_experience: float | None = None
    category: str | None = None  # technical, soft, language, etc.


class Experience(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    company: str
    location: str | None = None
    start_date: UTCDateTime
    end_date: UTCDateTime | None = None
    current: bool = False
    description: str
    achievements: list[str] = []
    skills_used: list[str] = []


class Education(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    institution: str
    degree: str
    field_of_study: str
    location: str | None = None
    start_date: UTCDateTime | None = None
    end_date: UTCDateTime | None = None
    gpa: float | None = None
    honors: list[str] = []


class Document(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    type: str  # resume, cover_letter, certification, portfolio, other
    file_path: str
    mime_type: str
    size_bytes: int
    uploaded_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
    parsed_content: dict[str, Any] | None = None


class JobPreferences(BaseModel):
    keywords: list[str] = []
    excluded_keywords: list[str] = []
    locations: list[str] = []  # e.g., ["Lilongwe, Malawi", "Remote"]
    job_types: list[JobType] = []
    min_salary: Decimal | None = None
    preferred_sources: list[JobSource] = []
    job_titles: list[str] = []
    remote_only: bool = False
    visa_sponsorship_required: bool = False

    # Categorical keyword structure. keywords_category is metadata only: a
    # label describing which category dominates this profile's keywords
    # ("executive", "functional", "core"). The scorer reads the three lists
    # below but never gates on the label — matching is a set union, so
    # filtering by category would only drop keywords.
    keywords_category: str = "core"  # "executive", "functional", "core"
    executive_keywords: list[str] = []  # Curated executive role keywords
    functional_keywords: list[str] = []  # Functional skill keywords
    core_skill_tags: list[str] = []  # Core skill tags


class Job(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    source: JobSource
    source_job_id: str | None = None  # Original ID from source
    title: str
    company: str
    location: str
    job_type: JobType
    description: str
    requirements: list[str] = []
    responsibilities: list[str] = []
    keywords: list[str] = []
    salary_range: SalaryRange | None = None
    posted_date: UTCDateTime | None = None
    expiry_date: UTCDateTime | None = None
    application_url: HttpUrl
    apply_email: EmailStr | None = None
    contact_person: str | None = None
    company_website: HttpUrl | None = None
    company_size: str | None = None
    company_industry: str | None = None
    benefits: list[str] = []
    ats_score: float | None = None
    match_score: float | None = None
    match_tier: MatchTier | None = None
    status: JobStatus = JobStatus.NEW
    auto_applied: bool = False
    auto_apply_documents: list[str] = []
    scraped_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = {}  # Source-specific extra data


class Application(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    user_profile_id: UUID
    resume_id: UUID
    cover_letter_id: UUID | None = None
    tailored_resume_path: str | None = None
    tailored_cover_letter_path: str | None = None
    ats_score: float
    match_score: float
    status: ApplicationStatus = ApplicationStatus.PENDING
    submitted_at: UTCDateTime | None = None
    confirmed_at: UTCDateTime | None = None
    receipt_data: dict[str, Any] = {}  # Confirmation number, reference ID, etc.
    follow_up_dates: list[UTCDateTime] = []
    notes: str = ""
    created_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))


class UserProfile(BaseModel):
    id: UUID = Field(default_factory=uuid4)
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
    documents: list[Document] = []
    resume_base: dict[str, Any] | None = None  # Parsed structured resume
    # Quote inputs for the Documents view. These live here because
    # UserProfileRequest already accepted them: without model fields the PUT
    # route validated them and then dropped them on write, and the response
    # schema could never return them, so edits never round-tripped.
    hourly_rate_usd: float | None = None
    expected_monthly_mwk: float | None = None
    legal_authorized_signer: str | None = None
    created_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))


class ScrapeJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    source: JobSource
    query: str
    location: str | None = None
    job_type: JobType | None = None
    max_results: int = 100
    status: str = "pending"  # pending, running, completed, failed
    jobs_found: int = 0
    jobs_new: int = 0
    jobs_updated: int = 0
    error: str | None = None
    started_at: UTCDateTime | None = None
    completed_at: UTCDateTime | None = None
    created_at: UTCDateTime = Field(default_factory=lambda: datetime.now(UTC))
