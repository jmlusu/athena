"""Profile writes must survive the SPA <-> FastAPI shape gap.

Two failures are pinned here:

1. The body ``toBackendProfile`` in athena-mapper.ts builds -- skills as
   ``{name}`` objects, experience under ``title``/``start_date``/``description``,
   education with ``field_of_study`` -- is the only shape ``UserProfileRequest``
   accepts. Before that mapper existed every PUT from the Profile form answered
   422 and nothing persisted.

2. ``hourly_rate_usd`` and the other two quote inputs were declared on
   ``UserProfileRequest`` but not on the ``UserProfile`` model, so they
   validated, were discarded on write, and could never be returned on read.

3. ``UserProfileRequest`` carries no ``documents``, ``resume_base`` or
   ``created_at`` because nothing in the UI edits them -- but PUT replaces the
   whole record, so those sections used to be dropped on write. One save took a
   real profile from 30,224 bytes to 16,508 and deleted all 18 of its
   documents. The route now carries them over from the record being replaced.
"""

from uuid import uuid4

from conftest import BASE, HEADERS

from athena.models.jobs import Document, UserProfile

OK = 200
UNPROCESSABLE = 422

# Byte-for-byte what athena-mapper.ts:toBackendProfile emits for a real
# ApplicantProfile. Change that mapper and this must change with it.
SPA_SHAPED_BODY = {
    "email": "jmlusu@gmail.com",
    "full_name": 'Jacob Raymond "Jack" Mlusu',
    "phone": "(+265) 0980016004",
    "location": "Lilongwe, Malawi / Remote",
    "headline": "Digital Transformation Executive",
    "summary": "Strategy and digital transformation executive.",
    "skills": [{"name": "AI Strategy"}, {"name": "Data Architecture"}],
    "experience": [
        {
            "title": "Founder / Digital Transformation Lead",
            "company": "Lightspeed Holdings Limited",
            "location": "Lilongwe, Malawi",
            "start_date": "2023-11-01T00:00:00Z",
            "end_date": None,
            "current": True,
            "description": "Founded an AI workflow venture. Building a data platform.",
            "achievements": [
                "Founded an AI workflow venture.",
                "Building a data platform.",
            ],
        },
    ],
    "education": [
        {
            "institution": "Howard University",
            "degree": "Master of Science, Chemical Engineering",
            "field_of_study": "",
            "start_date": None,
            "end_date": "2011-01-01T00:00:00Z",
        },
    ],
    "certifications": ["PMP"],
    "hourly_rate_usd": 95.0,
    "expected_monthly_mwk": 5200000.0,
    "legal_authorized_signer": "J. M. Mlusu",
}

QUOTE_FIELDS = ("hourly_rate_usd", "expected_monthly_mwk", "legal_authorized_signer")


def _put(client, profile_id, body=SPA_SHAPED_BODY):
    return client.put(f"{BASE}/profiles/{profile_id}", json=body, headers=HEADERS)


def test_put_accepts_the_body_the_bff_sends(client, temp_db):
    profile_id = uuid4()
    response = _put(client, profile_id)

    assert response.status_code == OK, response.text
    assert temp_db.get_user_profile(profile_id) is not None


def test_the_shape_the_spa_used_to_send_is_still_rejected(client, temp_db):
    """Guard on the fix: the old SPA shape must not start passing silently.

    If this ever succeeds, the contract moved and toBackendProfile needs
    revisiting rather than the test deleting.
    """
    profile_id = uuid4()
    legacy_spa_body = dict(
        SPA_SHAPED_BODY,
        skills=["AI Strategy", "Data Architecture"],
        experience=[
            {
                "role": "Founder / Digital Transformation Lead",
                "company": "Lightspeed Holdings Limited",
                "location": "Lilongwe, Malawi",
                "period": "Nov 2023 - Present",
                "bullets": ["Founded an AI workflow venture."],
            },
        ],
        education=[
            {"degree": "Master of Science", "institution": "Howard University", "year": "2011"},
        ],
    )

    response = _put(client, profile_id, legacy_spa_body)
    assert response.status_code == UNPROCESSABLE
    assert temp_db.get_user_profile(profile_id) is None


def test_quote_fields_are_stored_and_returned(client, temp_db):
    """They used to validate, then vanish -- so reload showed the defaults."""
    profile_id = uuid4()
    response = _put(client, profile_id)
    assert response.status_code == OK, response.text

    returned = response.json()
    for field in QUOTE_FIELDS:
        assert returned[field] == SPA_SHAPED_BODY[field], field

    stored = temp_db.get_user_profile(profile_id)
    assert stored is not None
    assert stored.hourly_rate_usd == 95.0
    assert stored.expected_monthly_mwk == 5200000.0
    assert stored.legal_authorized_signer == "J. M. Mlusu"


def test_reload_returns_what_the_form_sent(client, temp_db):  # noqa: ARG001
    """The acceptance for profile persistence: save, then read the same data back."""
    profile_id = uuid4()
    assert _put(client, profile_id).status_code == OK

    reloaded = client.get(f"{BASE}/profiles/{profile_id}", headers=HEADERS)
    assert reloaded.status_code == OK
    body = reloaded.json()

    assert body["full_name"] == SPA_SHAPED_BODY["full_name"]
    assert body["email"] == SPA_SHAPED_BODY["email"]
    assert body["headline"] == SPA_SHAPED_BODY["headline"]
    assert [skill["name"] for skill in body["skills"]] == ["AI Strategy", "Data Architecture"]
    assert body["experience"][0]["title"] == "Founder / Digital Transformation Lead"
    assert body["experience"][0]["achievements"] == [
        "Founded an AI workflow venture.",
        "Building a data platform.",
    ]
    assert body["education"][0]["institution"] == "Howard University"
    assert body["certifications"] == ["PMP"]
    assert body["hourly_rate_usd"] == 95.0


def test_a_profile_saved_without_the_quote_fields_still_saves(client, temp_db):  # noqa: ARG001
    """A body predating the new fields must not start failing on them."""
    profile_id = uuid4()
    legacy = {k: v for k, v in SPA_SHAPED_BODY.items() if k not in QUOTE_FIELDS}

    response = _put(client, profile_id, legacy)
    assert response.status_code == OK, response.text
    assert response.json()["hourly_rate_usd"] is None


def test_upsert_replaces_rather_than_appending(client, temp_db):  # noqa: ARG001
    """PUT is a full replace; a second save must not duplicate experience."""
    profile_id = uuid4()
    assert _put(client, profile_id).status_code == OK
    assert _put(client, profile_id).status_code == OK

    body = client.get(f"{BASE}/profiles/{profile_id}", headers=HEADERS).json()
    assert len(body["experience"]) == 1
    assert len(body["skills"]) == 2


def test_a_replace_cannot_delete_documents_resume_base_or_created_at(client, temp_db):
    """Sections the write schema omits must survive the replace.

    ``UserProfileRequest`` has no ``documents``, ``resume_base`` or
    ``created_at`` because no form edits them, so ``UserProfile(**dump)`` used
    to rebuild the record without them: the next save deleted every uploaded
    document and restamped the creation date.
    """
    profile_id = uuid4()
    seeded = UserProfile(
        id=profile_id,
        email=SPA_SHAPED_BODY["email"],
        full_name=SPA_SHAPED_BODY["full_name"],
        documents=[
            Document(
                name="Jack Mlusu resume.pdf",
                type="resume",
                file_path="profile/resumes/Jack Mlusu resume.pdf",
                mime_type="application/pdf",
                size_bytes=106573,
            ),
            Document(
                name="WFP Cover Letter.pdf",
                type="cover_letter",
                file_path="profile/resumes/WFP Cover Letter.pdf",
                mime_type="application/pdf",
                size_bytes=24000,
            ),
        ],
        resume_base={"parsed": True, "source": "parser"},
    )
    original_created_at = seeded.created_at
    temp_db.put_user_profile(seeded)

    response = _put(client, profile_id)
    assert response.status_code == OK, response.text

    stored = temp_db.get_user_profile(profile_id)
    assert stored is not None
    assert [doc.name for doc in stored.documents] == [
        "Jack Mlusu resume.pdf",
        "WFP Cover Letter.pdf",
    ]
    assert stored.resume_base == {"parsed": True, "source": "parser"}
    assert stored.created_at == original_created_at


def test_the_response_returns_what_the_replace_kept(client, temp_db):
    """The read side has to agree with the write side, or the loss is invisible."""
    profile_id = uuid4()
    seeded = UserProfile(
        id=profile_id,
        email=SPA_SHAPED_BODY["email"],
        full_name=SPA_SHAPED_BODY["full_name"],
        documents=[
            Document(
                name="resume.pdf",
                type="resume",
                file_path="profile/resumes/resume.pdf",
                mime_type="application/pdf",
                size_bytes=1,
            ),
        ],
        resume_base={"parsed": True},
    )
    temp_db.put_user_profile(seeded)

    assert _put(client, profile_id).status_code == OK

    body = client.get(f"{BASE}/profiles/{profile_id}", headers=HEADERS).json()
    assert [doc["name"] for doc in body["documents"]] == ["resume.pdf"]
