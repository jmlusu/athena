"""Tests for the receipts, profile-document, and combined-stats endpoints."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from conftest import BASE, HEADERS

from athena.models import (
    Application,
    Document,
    Job,
    JobSource,
    JobStatus,
    JobType,
    ScrapeJob,
    UserProfile,
)

OK = 200
NOT_FOUND = 404
UNAUTHORIZED = 401
UNPROCESSABLE = 422
RECEIPT_COUNT = 2
DOC_COUNT = 2
SCRAPED_JOBS = 12
NEW_JOBS = 3


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
        requirements=["Python", "FastAPI"],
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
        email="docs@example.com",
        full_name="Test User",
        headline="Senior Python Engineer",
        summary="Experienced Python and FastAPI developer",
    )
    temp_db.add_user_profile(profile)
    return profile


def make_application(profile_id, receipt_id=None, submitted_at=None, job_id=None):
    """Build an Application, optionally carrying receipt data."""
    receipt_data = {}
    if receipt_id:
        receipt_data = {
            "receipt_id": receipt_id,
            "confirmation_hash": f"SHA256-{receipt_id}",
            "authorized_by": "Jack Mlusu",
            "authorized_at": datetime(2026, 9, 20, 10, 31, tzinfo=UTC),
            "portal_name": "Greenhouse",
            "follow_up_date": "2026-09-27",
            "status": "SUBMITTED",
            "notes": "portal confirmation",
        }
    kwargs = {}
    if submitted_at is not None:
        kwargs["submitted_at"] = submitted_at
    return Application(
        job_id=job_id or uuid4(),
        user_profile_id=profile_id,
        resume_id=uuid4(),
        ats_score=88.0,
        match_score=76.0,
        receipt_data=receipt_data,
        **kwargs,
    )


def make_document(**overrides):
    payload = {
        "id": str(uuid4()),
        "name": "Cover Letter.pdf",
        "type": "cover_letter",
        "file_path": "/documents/Cover Letter.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 2048,
        "uploaded_at": datetime.now(UTC).isoformat(),
    }
    payload.update(overrides)
    return payload


# --- GET /receipts ---------------------------------------------------------


def test_list_receipts_returns_only_receipt_apps(client, temp_db, sample_job, sample_profile):
    temp_db.add_application(
        make_application(
            sample_profile.id,
            "ATH-RCPT-TEST01",
            datetime(2026, 9, 20, 10, 30, tzinfo=UTC),
            sample_job.id,
        ),
    )
    temp_db.add_application(make_application(sample_profile.id))  # no receipt data

    response = client.get(f"{BASE}/receipts", headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert data["total"] == 1
    assert len(data["receipts"]) == 1
    receipt = data["receipts"][0]
    assert receipt["receipt_id"] == "ATH-RCPT-TEST01"
    assert receipt["confirmation_hash"] == "SHA256-ATH-RCPT-TEST01"
    assert receipt["job_title"] == sample_job.title
    assert receipt["company"] == sample_job.company
    assert receipt["applicant_name"] == sample_profile.full_name
    assert receipt["authorized_by"] == "Jack Mlusu"
    assert receipt["portal_name"] == "Greenhouse"
    assert receipt["follow_up_date"] == "2026-09-27"
    assert receipt["status"] == "SUBMITTED"
    assert receipt["notes"] == "portal confirmation"
    assert receipt["submitted_at"].endswith(("Z", "+00:00"))
    assert receipt["authorized_at"].endswith(("Z", "+00:00"))


def test_list_receipts_sorted_desc_and_paginated(client, temp_db, sample_profile):
    temp_db.add_application(
        make_application(
            sample_profile.id,
            "ATH-RCPT-OLD",
            datetime(2026, 9, 1, 9, 0, tzinfo=UTC),
        ),
    )
    temp_db.add_application(
        make_application(
            sample_profile.id,
            "ATH-RCPT-NEW",
            datetime(2026, 9, 22, 15, 0, tzinfo=UTC),
        ),
    )

    response = client.get(f"{BASE}/receipts", headers=HEADERS)
    assert response.status_code == OK
    data = response.json()
    assert data["total"] == RECEIPT_COUNT
    ids = [r["receipt_id"] for r in data["receipts"]]
    assert ids == ["ATH-RCPT-NEW", "ATH-RCPT-OLD"]

    page = client.get(f"{BASE}/receipts", params={"limit": 1, "offset": 1}, headers=HEADERS)
    assert page.status_code == OK
    page_data = page.json()
    assert page_data["total"] == RECEIPT_COUNT
    assert [r["receipt_id"] for r in page_data["receipts"]] == ["ATH-RCPT-OLD"]

    beyond = client.get(f"{BASE}/receipts", params={"limit": 1, "offset": 5}, headers=HEADERS)
    assert beyond.status_code == OK
    assert beyond.json()["receipts"] == []
    assert beyond.json()["total"] == RECEIPT_COUNT


def test_list_receipts_filters_by_profile(client, temp_db, sample_profile):
    temp_db.add_application(
        make_application(
            sample_profile.id,
            "ATH-RCPT-MINE",
            datetime(2026, 9, 20, 10, 30, tzinfo=UTC),
        ),
    )
    other = UserProfile(id=uuid4(), email="other@example.com", full_name="Other User")
    temp_db.add_user_profile(other)
    temp_db.add_application(
        make_application(other.id, "ATH-RCPT-OTHER", datetime(2026, 9, 21, 10, 30, tzinfo=UTC)),
    )

    response = client.get(
        f"{BASE}/receipts",
        params={"user_profile_id": str(sample_profile.id)},
        headers=HEADERS,
    )

    assert response.status_code == OK
    data = response.json()
    assert data["total"] == 1
    assert data["receipts"][0]["receipt_id"] == "ATH-RCPT-MINE"
    assert temp_db.get_user_profile(other.id) is not None


def test_list_receipts_empty(client, temp_db):
    assert temp_db.get_applications(None, None, None) == []

    response = client.get(f"{BASE}/receipts", headers=HEADERS)

    assert response.status_code == OK
    assert response.json() == {"receipts": [], "total": 0}


def test_list_receipts_rejects_oversized_limit(client, temp_db):
    response = client.get(f"{BASE}/receipts", params={"limit": 101}, headers=HEADERS)

    assert response.status_code == UNPROCESSABLE
    assert temp_db.get_applications(None, None, None) == []


def test_get_receipt_found(client, temp_db, sample_job, sample_profile):
    temp_db.add_application(
        make_application(
            sample_profile.id,
            "ATH-RCPT-ONE",
            datetime(2026, 9, 20, 10, 30, tzinfo=UTC),
            sample_job.id,
        ),
    )

    response = client.get(f"{BASE}/receipts/ATH-RCPT-ONE", headers=HEADERS)

    assert response.status_code == OK
    data = response.json()
    assert data["receipt_id"] == "ATH-RCPT-ONE"
    assert data["confirmation_hash"] == "SHA256-ATH-RCPT-ONE"
    assert data["job_title"] == sample_job.title
    assert data["applicant_name"] == sample_profile.full_name
    assert data["submitted_at"].endswith(("Z", "+00:00"))
    assert data["follow_up_date"] == "2026-09-27"


def test_get_receipt_not_found(client, temp_db):
    response = client.get(f"{BASE}/receipts/ATH-RCPT-MISSING", headers=HEADERS)

    assert response.status_code == NOT_FOUND
    assert temp_db.get_applications(None, None, None) == []


# --- GET /profiles/{id}/documents -----------------------------------------


def test_list_profile_documents(client, temp_db):
    first = Document(
        id=uuid4(),
        name="Resume.docx",
        type="resume",
        file_path="/documents/Resume.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size_bytes=1024,
    )
    second = Document(
        id=uuid4(),
        name="Cover.pdf",
        type="cover_letter",
        file_path="/documents/Cover.pdf",
        mime_type="application/pdf",
        size_bytes=2048,
    )
    profile = UserProfile(
        id=uuid4(),
        email="list@example.com",
        full_name="Doc User",
        documents=[first, second],
    )
    temp_db.add_user_profile(profile)

    response = client.get(f"{BASE}/profiles/{profile.id}/documents", headers=HEADERS)

    assert response.status_code == OK
    docs = response.json()
    assert len(docs) == DOC_COUNT
    assert {d["id"] for d in docs} == {str(first.id), str(second.id)}
    for doc in docs:
        assert doc["uploaded_at"].endswith(("Z", "+00:00"))


def test_list_profile_documents_empty(client, sample_profile):
    response = client.get(f"{BASE}/profiles/{sample_profile.id}/documents", headers=HEADERS)

    assert response.status_code == OK
    assert response.json() == []
    assert sample_profile.documents == []


def test_list_profile_documents_profile_not_found(client, temp_db):
    missing_id = uuid4()

    response = client.get(f"{BASE}/profiles/{missing_id}/documents", headers=HEADERS)

    assert response.status_code == NOT_FOUND
    assert temp_db.user_profiles.get_all() == []


# --- POST /profiles/{id}/documents ----------------------------------------


def test_upload_profile_document(client, temp_db, sample_profile):
    payload = make_document()

    response = client.post(
        f"{BASE}/profiles/{sample_profile.id}/documents",
        json=payload,
        headers=HEADERS,
    )

    assert response.status_code == OK
    data = response.json()
    assert data["id"] == payload["id"]
    assert data["name"] == payload["name"]
    assert data["uploaded_at"].endswith(("Z", "+00:00"))

    stored = temp_db.get_user_profile(sample_profile.id)
    assert stored is not None
    assert len(stored.documents) == 1
    stored_doc = stored.documents[0]
    stored_id = stored_doc["id"] if isinstance(stored_doc, dict) else stored_doc.id
    assert str(stored_id) == payload["id"]


def test_upload_profile_document_coerces_naive_timestamp(client, sample_profile):
    payload = make_document(uploaded_at="2026-01-15T12:00:00")

    response = client.post(
        f"{BASE}/profiles/{sample_profile.id}/documents",
        json=payload,
        headers=HEADERS,
    )

    assert response.status_code == OK
    uploaded_at = response.json()["uploaded_at"]
    assert uploaded_at.startswith("2026-01-15T12:00:00")
    assert uploaded_at.endswith(("Z", "+00:00"))


def test_upload_profile_document_requires_api_key(client, temp_db, sample_profile):
    response = client.post(
        f"{BASE}/profiles/{sample_profile.id}/documents",
        json=make_document(),
    )

    assert response.status_code == UNAUTHORIZED
    stored = temp_db.get_user_profile(sample_profile.id)
    assert stored is not None
    assert stored.documents == []


def test_upload_profile_document_profile_not_found(client, temp_db):
    response = client.post(
        f"{BASE}/profiles/{uuid4()}/documents",
        json=make_document(),
        headers=HEADERS,
    )

    assert response.status_code == NOT_FOUND
    assert temp_db.user_profiles.get_all() == []


def test_upload_profile_document_invalid_payload(client, temp_db, sample_profile):
    payload = make_document()
    del payload["size_bytes"]

    response = client.post(
        f"{BASE}/profiles/{sample_profile.id}/documents",
        json=payload,
        headers=HEADERS,
    )

    assert response.status_code == UNPROCESSABLE
    assert temp_db.get_user_profile(sample_profile.id).documents == []


# --- DELETE /profiles/{id}/documents/{document_id} -------------------------


def test_delete_profile_document(client, temp_db):
    doc = Document(
        id=uuid4(),
        name="Old.pdf",
        type="other",
        file_path="/documents/Old.pdf",
        mime_type="application/pdf",
        size_bytes=10,
    )
    profile = UserProfile(
        id=uuid4(),
        email="delete@example.com",
        full_name="Del User",
        documents=[doc],
    )
    temp_db.add_user_profile(profile)

    response = client.delete(
        f"{BASE}/profiles/{profile.id}/documents/{doc.id}",
        headers=HEADERS,
    )

    assert response.status_code == OK
    assert response.json() == {"success": True}
    stored = temp_db.get_user_profile(profile.id)
    assert stored is not None
    assert stored.documents == []


def test_delete_profile_document_not_found(client, temp_db):
    profile = UserProfile(id=uuid4(), email="none@example.com", full_name="No Doc User")
    temp_db.add_user_profile(profile)

    response = client.delete(
        f"{BASE}/profiles/{profile.id}/documents/{uuid4()}",
        headers=HEADERS,
    )

    assert response.status_code == NOT_FOUND
    stored = temp_db.get_user_profile(profile.id)
    assert stored is not None
    assert stored.documents == []


def test_delete_profile_document_profile_not_found(client, temp_db):
    response = client.delete(
        f"{BASE}/profiles/{uuid4()}/documents/{uuid4()}",
        headers=HEADERS,
    )

    assert response.status_code == NOT_FOUND
    assert temp_db.user_profiles.get_all() == []


def test_delete_profile_document_requires_api_key(client, temp_db):
    doc = Document(
        id=uuid4(),
        name="Keep.pdf",
        type="other",
        file_path="/documents/Keep.pdf",
        mime_type="application/pdf",
        size_bytes=10,
    )
    profile = UserProfile(
        id=uuid4(),
        email="keep@example.com",
        full_name="Keep User",
        documents=[doc],
    )
    temp_db.add_user_profile(profile)

    response = client.delete(f"{BASE}/profiles/{profile.id}/documents/{doc.id}")

    assert response.status_code == UNAUTHORIZED
    stored = temp_db.get_user_profile(profile.id)
    assert stored is not None
    assert len(stored.documents) == 1


# --- GET /stats ------------------------------------------------------------


def test_get_stats(client, temp_db, sample_job):
    temp_db.add_scrape_job(
        ScrapeJob(
            id=uuid4(),
            source=JobSource.REMOTE_OK,
            query="python",
            status="completed",
            jobs_found=SCRAPED_JOBS,
            jobs_new=NEW_JOBS,
            started_at=datetime(2026, 9, 20, 8, 0, tzinfo=UTC),
            completed_at=datetime(2026, 9, 20, 8, 5, tzinfo=UTC),
        ),
    )

    response = client.get(f"{BASE}/stats")

    assert response.status_code == OK
    data = response.json()
    assert set(data) == {"pipeline", "scraping"}
    pipeline = data["pipeline"]
    assert pipeline["total_jobs"] == 1
    assert pipeline["scored"] == 1
    assert pipeline["new"] == 0
    assert pipeline["avg_ats_score"] == sample_job.ats_score
    scraping = data["scraping"]
    assert scraping["total_jobs_scraped"] == SCRAPED_JOBS
    assert scraping["total_new_jobs"] == NEW_JOBS
    assert len(scraping["recent_scrapes"]) == 1
    assert scraping["last_scrape_at"].endswith(("Z", "+00:00"))


def test_get_stats_empty(client, temp_db):
    response = client.get(f"{BASE}/stats")

    assert response.status_code == OK
    data = response.json()
    assert data["pipeline"]["total_jobs"] == 0
    assert data["scraping"]["recent_scrapes"] == []
    assert data["scraping"]["total_jobs_scraped"] == 0
    assert data["scraping"]["last_scrape_at"] is None
    assert temp_db.jobs.get_all() == []
