"""Tests for AI adapter layers (request/response model conversion)."""

from athena.api.ai_schemas import (
    ATSScoreRequest,
    DehumanizeRequest,
    SubmitApplicationRequest,
    TailorDocumentRequest,
    TailorResumeRequest,
)


def test_score_ats_payload_roundtrip():
    """ATSScoreRequest can be constructed and serialized."""
    payload = ATSScoreRequest(
        job_title="Software Engineer",
        company="TestCo",
        description="Build scalable services.",
        requirements=["Python", "FastAPI"],
        applicant_profile={"fullName": "Test User", "email": "test@example.com"},
        item_type="job",
    )
    data = payload.model_dump()
    assert data["job_title"] == "Software Engineer"


def test_tailor_resume_payload_roundtrip():
    """TailorResumeRequest supports both column layouts and dehumanize flag."""
    payload = TailorResumeRequest(
        job={"title": "Senior Engineer", "company": "TestCo"},
        applicant_profile={"fullName": "Test User"},
        column_layout="one-column",
        dehumanize=False,
    )
    data = payload.model_dump()
    assert data["column_layout"] == "one-column"
    assert data["dehumanize"] is False


def test_tailor_document_payload_roundtrip():
    """TailorDocumentRequest validates doc_type and layout options."""
    payload = TailorDocumentRequest(
        doc_type="cover-letter",
        job={"title": "Test", "company": "TestCo"},
        applicant_profile={"fullName": "Test User"},
        column_layout="two-column",
        dehumanize=True,
    )
    data = payload.model_dump()
    assert data["doc_type"] == "cover-letter"


def test_dehumanize_payload_roundtrip():
    """DehumanizeRequest accepts text and context."""
    payload = DehumanizeRequest(
        text="I spearheaded a complex project.",
        context="Cover letter",
    )
    data = payload.model_dump()
    assert data["text"] == "I spearheaded a complex project."


def test_submit_application_payload_roundtrip():
    """SubmitApplicationRequest requires all fields."""
    payload = SubmitApplicationRequest(
        application_id="app-001",
        job_title="Engineer",
        company="TestCorp",
        applicant_name="Jane Doe",
        authorization_signature="Jane Doe",
        authorized_at="2026-09-28T10:00:00Z",
    )
    data = payload.model_dump()
    assert data["application_id"] == "app-001"
