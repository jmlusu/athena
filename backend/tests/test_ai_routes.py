"""Tests for AI router endpoints (8 endpoints)."""

from uuid import uuid4

import pytest
from conftest import HEADERS

from athena.models import Job, JobSource, JobStatus, JobType, UserProfile

BASE = "/api/v1/athena/ai"
OK = 200
UNAUTHORIZED = 401
BAD_REQUEST = 400
UNPROCESSABLE = 422


@pytest.fixture
def sample_job(temp_db):
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
    temp_db.add_job(job)
    return job


@pytest.fixture
def sample_profile(temp_db):
    profile = UserProfile(
        id=uuid4(),
        email="test@example.com",
        full_name="Test User",
        headline="Senior Python Engineer",
        summary="Experienced Python and FastAPI developer",
    )
    temp_db.add_user_profile(profile)
    return profile


@pytest.fixture
def fallback_provider(monkeypatch):
    """Force fallback provider for deterministic tests."""
    from athena.ai.providers.fallback import FallbackProvider

    fallback = FallbackProvider()
    # get_provider() resolves this module-global name at call time; Depends()
    # holds the original get_provider function, so patch the symbol it calls.
    monkeypatch.setattr("athena.api.ai_routes.get_ai_provider", lambda: fallback)
    return fallback


# --- GET /ai/health ---------------------------------------------------------


def test_ai_health_returns_provider_info(client, fallback_provider):
    response = client.get(f"{BASE}/health")

    assert response.status_code == OK
    data = response.json()
    assert data["status"] == "ok"
    assert data["provider"] == "fallback"
    assert data["has_api_key"] is False
    assert "timestamp" in data


# --- POST /ai/score-ats -----------------------------------------------------


def test_score_ats_happy_path(client, fallback_provider, sample_job, sample_profile):
    payload = {
        "job_title": sample_job.title,
        "company": sample_job.company,
        "description": sample_job.description,
        "requirements": sample_job.requirements,
        "applicant_profile": {
            "fullName": sample_profile.full_name,
            "email": sample_profile.email,
            "headline": sample_profile.headline,
            "summary": sample_profile.summary,
        },
        "item_type": "job",
    }

    response = client.post(f"{BASE}/score-ats", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert "ats_score" in data
    assert 0 <= data["ats_score"] <= 100
    assert data["match_category"] in ["CRITICAL_MATCH", "FLAGGED_REVIEW", "STANDARD"]
    assert isinstance(data["matched_skills"], list)
    assert isinstance(data["missing_skills"], list)
    assert isinstance(data["strengths"], list)
    assert isinstance(data["recommendation"], str)
    assert isinstance(data["dehumanized_pitch"], str)


def test_score_ats_requires_api_key(client, fallback_provider):
    payload = {
        "job_title": "Test Job",
        "company": "Test Co",
        "description": "Test description",
        "requirements": ["Python"],
        "applicant_profile": {"fullName": "Test User"},
    }

    response = client.post(f"{BASE}/score-ats", json=payload)

    assert response.status_code == UNAUTHORIZED


def test_score_ats_validates_required_fields(client, fallback_provider):
    payload = {
        "job_title": "Test Job",
        # missing company, description, etc.
    }

    response = client.post(f"{BASE}/score-ats", json=payload, headers=HEADERS)

    assert response.status_code == UNPROCESSABLE


# --- POST /ai/tailor-resume -------------------------------------------------


def test_tailor_resume_happy_path(client, fallback_provider, sample_job, sample_profile):
    payload = {
        "job": {
            "title": sample_job.title,
            "company": sample_job.company,
            "location": sample_job.location,
            "description": sample_job.description,
            "requirements": sample_job.requirements,
        },
        "applicant_profile": {
            "fullName": sample_profile.full_name,
            "email": sample_profile.email,
            "headline": sample_profile.headline,
            "summary": sample_profile.summary,
        },
        "column_layout": "two-column",
        "dehumanize": True,
    }

    response = client.post(f"{BASE}/tailor-resume", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert "tailored_resume" in data
    resume = data["tailored_resume"]
    assert resume["full_name"] == sample_profile.full_name
    assert resume["layout"] == "two-column"
    assert "contact" in resume
    assert "experience" in resume
    assert "education" in resume
    assert "skills" in resume


def test_tailor_resume_one_column_layout(client, fallback_provider, sample_job, sample_profile):
    payload = {
        "job": {"title": sample_job.title, "company": sample_job.company},
        "applicant_profile": {"fullName": sample_profile.full_name},
        "column_layout": "one-column",
        "dehumanize": False,
    }

    response = client.post(f"{BASE}/tailor-resume", json=payload, headers=HEADERS)

    assert response.status_code == OK
    assert response.json()["tailored_resume"]["layout"] == "one-column"


def test_tailor_resume_requires_api_key(client, fallback_provider):
    payload = {
        "job": {"title": "Test"},
        "applicant_profile": {"fullName": "Test"},
    }

    response = client.post(f"{BASE}/tailor-resume", json=payload)

    assert response.status_code == UNAUTHORIZED


# --- POST /ai/tailor-document -----------------------------------------------


def test_tailor_document_cover_letter(client, fallback_provider, sample_job, sample_profile):
    payload = {
        "doc_type": "cover-letter",
        "job": {"title": sample_job.title, "company": sample_job.company},
        "applicant_profile": {"fullName": sample_profile.full_name},
        "column_layout": "one-column",
        "dehumanize": True,
    }

    response = client.post(f"{BASE}/tailor-document", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert "document" in data
    doc = data["document"]
    assert doc["title"].startswith("Application for")
    assert "paragraphs" in doc
    assert "greeting" in doc
    assert "closing" in doc
    assert doc["layout"] == "one-column"


def test_tailor_document_consultancy_proposal(
    client,
    fallback_provider,
    sample_job,
    sample_profile,
):
    payload = {
        "doc_type": "consultancy-proposal",
        "job": {"title": sample_job.title, "company": sample_job.company},
        "applicant_profile": {"fullName": sample_profile.full_name},
        "column_layout": "two-column",
        "dehumanize": True,
    }

    response = client.post(f"{BASE}/tailor-document", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    doc = data["document"]
    assert "executive_summary" in doc
    assert "sections" in doc
    assert len(doc["sections"]) == 4


def test_tailor_document_executive_summary(client, fallback_provider, sample_job, sample_profile):
    payload = {
        "doc_type": "executive-summary",
        "job": {"title": sample_job.title, "company": sample_job.company},
        "applicant_profile": {"fullName": sample_profile.full_name},
    }

    response = client.post(f"{BASE}/tailor-document", json=payload, headers=HEADERS)

    assert response.status_code == OK
    doc = response.json()["document"]
    assert "executive_summary" in doc
    assert "sections" in doc


def test_tailor_document_requires_api_key(client, fallback_provider):
    payload = {"doc_type": "cover-letter", "job": {}, "applicant_profile": {}}
    response = client.post(f"{BASE}/tailor-document", json=payload)
    assert response.status_code == UNAUTHORIZED


def test_tailor_document_validates_doc_type(client, fallback_provider):
    payload = {
        "doc_type": "invalid-type",
        "job": {"title": "Test"},
        "applicant_profile": {"fullName": "Test"},
    }
    response = client.post(f"{BASE}/tailor-document", json=payload, headers=HEADERS)
    assert response.status_code == UNPROCESSABLE


# --- POST /ai/dehumanize ----------------------------------------------------


def test_dehumanize_happy_path(client, fallback_provider):
    payload = {
        "text": "I spearheaded an ecosystem that was a testament to my ability to delve into complex problems.",
        "context": "Cover letter",
    }

    response = client.post(f"{BASE}/dehumanize", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert "humanized_text" in data
    assert "flagged_words_removed" in data
    assert "confidence_score" in data
    assert 0 <= data["confidence_score"] <= 1
    # Should have replaced some AI tropes
    assert (
        "spearheaded" not in data["humanized_text"].lower()
        or "led" in data["humanized_text"].lower()
    )


def test_dehumanize_empty_text(client, fallback_provider):
    payload = {"text": "", "context": "Test"}
    response = client.post(f"{BASE}/dehumanize", json=payload, headers=HEADERS)
    assert response.status_code == OK
    data = response.json()
    assert data["humanized_text"] == ""
    assert data["flagged_words_removed"] == []


def test_dehumanize_requires_api_key(client, fallback_provider):
    payload = {"text": "Test text"}
    response = client.post(f"{BASE}/dehumanize", json=payload)
    assert response.status_code == UNAUTHORIZED


# --- POST /ai/scrape-live ---------------------------------------------------


def test_scrape_live_happy_path(client, fallback_provider):
    payload = {
        "location_filter": "all",
        "search_type": "all",
        "keywords": "Python, FastAPI",
        "resume_skills": ["Python", "FastAPI", "PostgreSQL"],
    }

    response = client.post(f"{BASE}/scrape-live", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert "listings" in data
    assert "timestamp" in data
    assert isinstance(data["listings"], list)
    assert len(data["listings"]) == 6  # Fallback returns 6 curated listings

    listing = data["listings"][0]
    assert "id" in listing
    assert "title" in listing
    assert "company" in listing
    assert "location" in listing
    assert "category" in listing
    assert "scope" in listing
    assert "platform" in listing
    assert "ats_score" in listing


def test_scrape_live_with_location_filter(client, fallback_provider):
    payload = {"location_filter": "lilongwe-local", "search_type": "jobs"}
    response = client.post(f"{BASE}/scrape-live", json=payload, headers=HEADERS)
    assert response.status_code == OK
    data = response.json()
    assert "listings" in data


def test_scrape_live_requires_api_key(client, fallback_provider):
    payload = {"location_filter": "all"}
    response = client.post(f"{BASE}/scrape-live", json=payload)
    assert response.status_code == UNAUTHORIZED


# --- POST /ai/n8n/dispatch --------------------------------------------------


def test_dispatch_n8n_happy_path(client, fallback_provider):
    payload = {
        "event_type": "JOB_MATCH_HIGH_ATS",
        "payload": {"job_ids": ["job-1", "job-2"]},
        "webhook_url": "https://custom.webhook.url",
    }

    response = client.post(f"{BASE}/n8n/dispatch", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert data["status"] == "DISPATCHED"
    assert "execution_id" in data
    assert "timestamp" in data
    assert data["webhook_url"] == "https://custom.webhook.url"
    assert data["event"] == "JOB_MATCH_HIGH_ATS"
    assert "nodes_processed" in data
    assert len(data["nodes_processed"]) == 4
    assert "receipt" in data
    assert data["receipt"]["items_handled"] == 2


def test_dispatch_n8n_defaults(client, fallback_provider):
    payload = {}
    response = client.post(f"{BASE}/n8n/dispatch", json=payload, headers=HEADERS)
    assert response.status_code == OK
    data = response.json()
    assert data["event"] == "JOB_MATCH_HIGH_ATS"
    assert "n8n.athena-ops.internal" in data["webhook_url"]
    assert data["receipt"]["items_handled"] == 1


def test_dispatch_n8n_requires_api_key(client, fallback_provider):
    payload = {"event_type": "TEST"}
    response = client.post(f"{BASE}/n8n/dispatch", json=payload)
    assert response.status_code == UNAUTHORIZED


# --- POST /ai/submit-application --------------------------------------------


def test_submit_application_happy_path(client, fallback_provider):
    payload = {
        "application_id": "app-123",
        "job_title": "Senior Engineer",
        "company": "TechCorp",
        "applicant_name": "Jane Doe",
        "authorization_signature": "Jane Doe",
        "authorized_at": "2026-09-28T10:00:00Z",
    }

    response = client.post(f"{BASE}/submit-application", json=payload, headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert data["status"] == "SUBMITTED"
    assert "receipt_id" in data
    assert data["receipt_id"].startswith("ATH-RCPT-")
    assert "confirmation_hash" in data
    assert data["confirmation_hash"].startswith("SHA256-")
    assert "submitted_at" in data
    assert data["job_title"] == "Senior Engineer"
    assert data["company"] == "TechCorp"
    assert data["applicant_name"] == "Jane Doe"
    assert data["authorized_by"] == "Jane Doe"
    assert "next_follow_up_date" in data


def test_submit_application_requires_signature(client, fallback_provider):
    payload = {
        "application_id": "app-123",
        "job_title": "Senior Engineer",
        "company": "TechCorp",
        "applicant_name": "Jane Doe",
        # missing authorization_signature
    }

    response = client.post(f"{BASE}/submit-application", json=payload, headers=HEADERS)

    assert response.status_code == BAD_REQUEST
    assert "authorization signature" in response.json()["detail"].lower()


def test_submit_application_requires_api_key(client, fallback_provider):
    payload = {
        "application_id": "app-123",
        "job_title": "Test",
        "company": "Test",
        "applicant_name": "Test",
        "authorization_signature": "Test",
    }
    response = client.post(f"{BASE}/submit-application", json=payload)
    assert response.status_code == UNAUTHORIZED


def test_submit_application_validates_required_fields(client, fallback_provider):
    payload = {"authorization_signature": "Test"}
    response = client.post(f"{BASE}/submit-application", json=payload, headers=HEADERS)
    assert response.status_code == UNPROCESSABLE
