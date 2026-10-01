import json
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from athena.api.app import create_app
from athena.models import Document, Job, JobSource, JobStatus, JobType, UserProfile
from athena.store import AthenaDB

HEADERS = {"X-API-Key": "dev-admin-key"}
OK = 200
NOT_FOUND = 404
UNPROCESSABLE = 422
EXPECTED_ATS_SCORE = 91.5
EXPECTED_MATCH_SCORE = 87.0


@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    db = AthenaDB(base_dir=tmp_path / "athena")
    monkeypatch.setattr("athena.api.routes.athena_db", db)
    return db


@pytest.fixture
def client():
    return TestClient(create_app())


@pytest.fixture
def resume_document():
    return Document(
        id=uuid4(),
        name="Test Resume.docx",
        type="resume",
        file_path="/documents/Test Resume.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size_bytes=1024,
    )


@pytest.fixture
def sample_job(temp_db):
    job = Job(
        id=uuid4(),
        source=JobSource.REMOTE_OK,
        title="Backend Python Developer",
        company="TechCo",
        location="Remote",
        job_type=JobType.FULL_TIME,
        description="Looking for Python and FastAPI expert with Docker experience.",
        requirements=["Python", "FastAPI"],
        keywords=["Python", "FastAPI", "Docker"],
        application_url="https://example.com/apply",
        status=JobStatus.SCORED,
        ats_score=EXPECTED_ATS_SCORE,
        match_score=EXPECTED_MATCH_SCORE,
    )
    temp_db.add_job(job)
    return job


@pytest.fixture
def sample_profile(temp_db, resume_document):
    profile = UserProfile(
        id=uuid4(),
        email="test@example.com",
        full_name="Test User",
        headline="Senior Python Engineer",
        summary="Experienced Python and FastAPI developer",
        skills=[{"name": "Python"}, {"name": "FastAPI"}, {"name": "Docker"}],
        documents=[resume_document],
    )
    temp_db.add_user_profile(profile)
    return profile


def test_apply_to_job(client, temp_db, sample_job, sample_profile, resume_document):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/apply",
        json={
            "user_profile_id": str(sample_profile.id),
            "resume_id": str(resume_document.id),
        },
        headers=HEADERS,
    )
    assert response.status_code == OK
    data = response.json()
    assert data["job_id"] == str(sample_job.id)
    assert data["user_profile_id"] == str(sample_profile.id)
    assert data["resume_id"] == str(resume_document.id)
    assert data["status"] == "pending"

    stored = temp_db.get_job(sample_job.id)
    assert stored is not None
    assert stored.status == JobStatus.APPLIED
    assert len(temp_db.get_applications(job_id=sample_job.id)) == 1


def test_apply_to_job_unknown_job(client, sample_profile, resume_document):
    response = client.post(
        f"/api/v1/athena/jobs/{uuid4()}/apply",
        json={
            "user_profile_id": str(sample_profile.id),
            "resume_id": str(resume_document.id),
        },
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Job not found"


def test_apply_to_job_unknown_profile(client, sample_job, resume_document):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/apply",
        json={"user_profile_id": str(uuid4()), "resume_id": str(resume_document.id)},
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Profile not found"


def test_apply_to_job_unknown_resume(client, sample_job, sample_profile):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/apply",
        json={"user_profile_id": str(sample_profile.id), "resume_id": str(uuid4())},
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Resume not found"


def test_create_application(client, sample_job, sample_profile, resume_document):
    response = client.post(
        "/api/v1/athena/applications",
        json={
            "job_id": str(sample_job.id),
            "user_profile_id": str(sample_profile.id),
            "resume_id": str(resume_document.id),
        },
        headers=HEADERS,
    )
    assert response.status_code == OK
    data = response.json()
    assert data["job_id"] == str(sample_job.id)
    assert data["ats_score"] == EXPECTED_ATS_SCORE
    assert data["match_score"] == EXPECTED_MATCH_SCORE


def test_create_application_unknown_job(client, sample_profile, resume_document):
    response = client.post(
        "/api/v1/athena/applications",
        json={
            "job_id": str(uuid4()),
            "user_profile_id": str(sample_profile.id),
            "resume_id": str(resume_document.id),
        },
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Job not found"


def test_apply_to_job_with_dict_documents(
    client,
    temp_db,
    sample_job,
    sample_profile,
    resume_document,
):
    profile = temp_db.get_user_profile(sample_profile.id)
    profile.documents = [json.loads(resume_document.model_dump_json())]
    temp_db.update_user_profile(profile)

    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/apply",
        json={
            "user_profile_id": str(sample_profile.id),
            "resume_id": str(resume_document.id),
        },
        headers=HEADERS,
    )
    assert response.status_code == OK


def test_update_profile_coerces_document_dicts(client, temp_db, sample_profile, resume_document):
    raw_doc = json.loads(resume_document.model_dump_json())
    response = client.patch(
        f"/api/v1/athena/profiles/{sample_profile.id}",
        json={"documents": [raw_doc]},
        headers=HEADERS,
    )
    assert response.status_code == OK

    stored = temp_db.get_user_profile(sample_profile.id)
    assert stored is not None
    assert len(stored.documents) == 1
    assert stored.documents[0].type == "resume"
    assert str(stored.documents[0].id) == str(resume_document.id)


def test_tailor_resume(client, tmp_path, sample_job, sample_profile):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/tailor-resume",
        json={"user_profile_id": str(sample_profile.id)},
        headers=HEADERS,
    )
    assert response.status_code == OK
    data = response.json()
    assert data["filename"].startswith("resume_Test_User")
    assert data["filename"].endswith(".docx")
    assert data["warnings"] == []

    saved = Path(data["path"])
    assert saved.is_file()
    assert saved.stat().st_size > 0
    assert saved.parent == tmp_path / "athena" / "documents" / str(sample_job.id)


def test_tailor_resume_invalid_output_format(client, sample_job, sample_profile):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/tailor-resume",
        json={"user_profile_id": str(sample_profile.id), "output_format": "txt"},
        headers=HEADERS,
    )
    assert response.status_code == UNPROCESSABLE


def test_tailor_resume_unknown_profile(client, sample_job):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/tailor-resume",
        json={"user_profile_id": str(uuid4())},
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Profile not found"


def test_generate_cover_letter(client, tmp_path, sample_job, sample_profile):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/cover-letter",
        json={"user_profile_id": str(sample_profile.id), "output_format": "docx"},
        headers=HEADERS,
    )
    assert response.status_code == OK
    data = response.json()
    assert data["filename"].startswith("cover_letter_Test_User_TechCo")
    assert data["filename"].endswith(".docx")
    assert data["warnings"] == []

    saved = Path(data["path"])
    assert saved.is_file()
    assert saved.stat().st_size > 0
    assert saved.parent == tmp_path / "athena" / "documents" / str(sample_job.id)


def test_generate_cover_letter_unknown_job(client, sample_profile):
    response = client.post(
        f"/api/v1/athena/jobs/{uuid4()}/cover-letter",
        json={"user_profile_id": str(sample_profile.id)},
        headers=HEADERS,
    )
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Job not found"


def test_flag_job(client, temp_db, sample_job):
    response = client.post(
        f"/api/v1/athena/jobs/{sample_job.id}/flag",
        json={"reason": "Low salary"},
        headers=HEADERS,
    )
    assert response.status_code == OK
    data = response.json()
    assert data["id"] == str(sample_job.id)
    assert data["status"] == "flagged"

    stored = temp_db.get_job(sample_job.id)
    assert stored is not None
    assert stored.status == JobStatus.FLAGGED
    assert stored.metadata["flag_reason"] == "Low salary"


def test_flag_job_empty_body(client, temp_db, sample_job):
    response = client.post(f"/api/v1/athena/jobs/{sample_job.id}/flag", headers=HEADERS)
    assert response.status_code == OK
    assert response.json()["status"] == "flagged"

    stored = temp_db.get_job(sample_job.id)
    assert stored is not None
    assert stored.status == JobStatus.FLAGGED


def test_flag_job_unknown_job(client, temp_db):
    missing_id = uuid4()
    assert temp_db.get_job(missing_id) is None

    response = client.post(f"/api/v1/athena/jobs/{missing_id}/flag", headers=HEADERS)
    assert response.status_code == NOT_FOUND
    assert response.json()["detail"] == "Job not found"
