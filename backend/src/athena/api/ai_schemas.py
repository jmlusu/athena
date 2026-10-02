"""Pydantic schemas for AI endpoints."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from athena.timeutils import UTCDateTime


class ATSScoreRequest(BaseModel):
    """Request for AI-powered ATS scoring."""

    job_title: str
    company: str
    description: str
    requirements: list[str] = []
    applicant_profile: dict[str, Any] = {}
    item_type: Literal["job", "consultancy"] = "job"


class ATSScoreResponse(BaseModel):
    """Response from AI-powered ATS scoring."""

    ats_score: int = Field(ge=0, le=100)
    match_category: Literal["CRITICAL_MATCH", "FLAGGED_REVIEW", "STANDARD"]
    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    recommendation: str
    dehumanized_pitch: str


class TailorResumeRequest(BaseModel):
    """Request for resume tailoring."""

    job: dict[str, Any]
    applicant_profile: dict[str, Any]
    column_layout: Literal["one-column", "two-column"] = "two-column"
    dehumanize: bool = True


class TailoredResumeContact(BaseModel):
    email: str
    phone: str
    location: str
    linkedin: str


class TailoredResumeExperience(BaseModel):
    role: str
    company: str
    period: str
    location: str
    bullets: list[str]


class TailoredResumeEducation(BaseModel):
    degree: str
    institution: str
    year: str


class TailoredResume(BaseModel):
    full_name: str
    title: str
    contact: TailoredResumeContact
    summary: str
    skills: list[str]
    experience: list[TailoredResumeExperience]
    education: list[TailoredResumeEducation]
    certifications: list[str]
    layout: Literal["one-column", "two-column"]


class TailorResumeResponse(BaseModel):
    tailored_resume: TailoredResume


class TailorDocumentRequest(BaseModel):
    """Request for document tailoring (cover letter, proposal, executive summary)."""

    doc_type: Literal["cover-letter", "executive-summary", "consultancy-proposal"]
    job: dict[str, Any]
    applicant_profile: dict[str, Any]
    column_layout: Literal["one-column", "two-column"] = "one-column"
    dehumanize: bool = True


class TailoredDocumentSection(BaseModel):
    heading: str
    body: str


class TailoredDocument(BaseModel):
    title: str
    recipient: str
    date: str
    greeting: str | None = None
    executive_summary: str | None = None
    paragraphs: list[str] | None = None
    sections: list[TailoredDocumentSection] | None = None
    closing: str | None = None
    signature: str | None = None
    layout: Literal["one-column", "two-column"] = "one-column"
    dehumanized: bool = True


class TailorDocumentResponse(BaseModel):
    document: TailoredDocument


class DehumanizeRequest(BaseModel):
    """Request for text dehumanization."""

    text: str
    context: str | None = "Job application / Cover letter"


class DehumanizeResponse(BaseModel):
    humanized_text: str
    flagged_words_removed: list[str]
    confidence_score: float = Field(ge=0, le=1)


class ScrapeLiveRequest(BaseModel):
    """Request for live job scraping via AI synthesis."""

    location_filter: Literal["lilongwe-local", "lilongwe-remote", "international-remote", "all"] = (
        "all"
    )
    search_type: Literal["jobs", "consultancies", "all"] = "all"
    keywords: str | None = None
    resume_skills: list[str] = []


class ScrapeLiveListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    category: Literal["job", "consultancy"]
    scope: Literal["lilongwe-local", "lilongwe-remote", "international-remote"]
    platform: Literal["LinkedIn", "Upwork", "ReliefWeb", "Corporate", "Devex", "MyJobo"]
    description: str
    requirements: list[str]
    salary_or_budget: str
    deadline: str
    ats_score: int = Field(ge=0, le=100)
    posted_date: str


class ScrapeLiveResponse(BaseModel):
    listings: list[ScrapeLiveListing]
    timestamp: UTCDateTime


class N8nDispatchRequest(BaseModel):
    """Request to dispatch n8n webhook."""

    event_type: str | None = "JOB_MATCH_HIGH_ATS"
    payload: dict[str, Any] = {}
    webhook_url: str | None = None


class N8nNodeProcessed(BaseModel):
    node: str
    status: str
    time_ms: int


class N8nReceipt(BaseModel):
    items_handled: int
    target_action: str


class N8nDispatchResponse(BaseModel):
    status: str
    execution_id: str
    timestamp: UTCDateTime
    webhook_url: str
    event: str
    nodes_processed: list[N8nNodeProcessed]
    receipt: N8nReceipt


class N8nIngressRequest(BaseModel):
    """Inbound webhook from n8n or external orchestration to trigger Athena actions."""

    event: str
    target_locations: list[str] = []
    categories: list[str] = []
    minimum_ats_auto_apply: int = 90
    applicant_id: str | None = None


class N8nIngressResponse(BaseModel):
    status: Literal["ACCEPTED", "REJECTED"]
    execution_id: str
    message: str
    triggered_actions: list[str] = []


class SubmitApplicationRequest(BaseModel):
    """Request for application submission with human authorization."""

    application_id: str
    job_title: str
    company: str
    applicant_name: str
    # Optional here so the route's explicit 400 (with a clear message) fires
    # instead of Pydantic's generic 422 validation error.
    authorization_signature: str | None = None
    authorized_at: UTCDateTime | None = None


class SubmitApplicationResponse(BaseModel):
    status: Literal["SUBMITTED"]
    receipt_id: str
    confirmation_hash: str
    submitted_at: UTCDateTime
    job_title: str
    company: str
    applicant_name: str
    authorized_by: str
    authorized_at: UTCDateTime
    next_follow_up_date: str


class AIHealthResponse(BaseModel):
    """Health check for AI provider."""

    status: str
    provider: str
    has_api_key: bool
    timestamp: UTCDateTime
