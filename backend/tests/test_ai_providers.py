"""Tests for AI provider implementations (Fallback + Gemini)."""

from athena.api.ai_schemas import (
    ATSScoreRequest,
    DehumanizeRequest,
    TailorDocumentRequest,
    TailorResumeRequest,
)
from athena.ai.providers.fallback import FallbackProvider


def test_fallback_provider_is_instantiable():
    """FallbackProvider can be instantiated and has all required methods."""
    provider = FallbackProvider()
    assert provider is not None

    assert hasattr(provider, "score_ats")
    assert hasattr(provider, "tailor_resume")
    assert hasattr(provider, "tailor_document")
    assert hasattr(provider, "dehumanize")
    assert hasattr(provider, "is_available")
    assert provider.is_available is True


async def test_fallback_provider_has_valid_ats_score():
    """FallbackProvider.score_ats returns a valid ats_score in [0, 100]."""
    provider = FallbackProvider()
    response = await provider.score_ats(
        ATSScoreRequest(
            job_title="Software Engineer",
            company="AI Innovations Inc",
            description="Build scalable microservices using Python, FastAPI, and cloud technologies.",
            requirements=["Python", "FastAPI"],
            applicant_profile={
                "fullName": "Test User",
                "email": "test@example.com",
                "headline": "Senior Engineer",
                "summary": "Experienced professional",
            },
        )
    )
    assert 0 <= response.ats_score <= 100
    assert response.match_category in ("CRITICAL_MATCH", "FLAGGED_REVIEW", "STANDARD")


async def test_fallback_provider_tailor_resume():
    """FallbackProvider.tailor_resume returns a structured resume."""
    provider = FallbackProvider()
    response = await provider.tailor_resume(
        TailorResumeRequest(
            job={"title": "Senior Software Engineer", "company": "AI Innovations Inc"},
            applicant_profile={"fullName": "Test User"},
            column_layout="two-column",
            dehumanize=True,
        )
    )
    resume = response.tailored_resume
    assert resume.full_name == "Test User"
    assert resume.layout == "two-column"
    assert resume.contact is not None
    assert len(resume.experience) > 0
    assert len(resume.education) > 0
    assert len(resume.skills) > 0


async def test_fallback_provider_tailor_document():
    """FallbackProvider.tailor_document returns document dict for given doc_type."""
    provider = FallbackProvider()
    response = await provider.tailor_document(
        TailorDocumentRequest(
            doc_type="cover-letter",
            job={"title": "Senior Software Engineer", "company": "AI Innovations Inc"},
            applicant_profile={"fullName": "Test User"},
            column_layout="one-column",
            dehumanize=True,
        )
    )
    doc = response.document
    assert doc.title.startswith("Application for")
    assert doc.paragraphs
    assert doc.greeting
    assert doc.closing


async def test_fallback_provider_dehumanize():
    """FallbackProvider.dehumanize removes AI tropes from text."""
    provider = FallbackProvider()
    response = await provider.dehumanize(
        DehumanizeRequest(
            text="I spearheaded a testament to my ability to delve into complex systems.",
            context="Cover letter",
        )
    )
    assert response.humanized_text
    assert "spearhead" not in response.humanized_text.lower()
    assert "delve" not in response.humanized_text.lower()
    assert isinstance(response.flagged_words_removed, list)
    assert 0 <= response.confidence_score <= 1
