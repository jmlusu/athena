from datetime import UTC, datetime
from uuid import uuid4

import pytest

from athena.ats.scorer import ATSScorer
from athena.models import (
    Experience,
    Job,
    JobPreferences,
    JobSource,
    JobStatus,
    JobType,
    Skill,
    UserProfile,
)


@pytest.fixture
def sample_profile():
    return UserProfile(
        id=uuid4(),
        email="test@example.com",
        full_name="Test User",
        headline="Python Engineer",
        summary="Experienced Python developer",
        skills=[Skill(name="Python"), Skill(name="SQL")],
    )


@pytest.fixture
def sample_job():
    return Job(
        id=uuid4(),
        source=JobSource.REMOTE_OK,
        title="Python Developer",
        company="TechCo",
        location="Remote",
        job_type=JobType.FULL_TIME,
        description="Looking for Python and SQL skills.",
        requirements=["Python", "SQL"],
        keywords=["Python", "SQL"],
        application_url="https://example.com/apply",
        status=JobStatus.NEW,
    )


def test_ats_scorer(sample_profile, sample_job):
    scorer = ATSScorer()
    breakdown = scorer.score_resume_against_job(sample_profile, sample_job)
    assert breakdown.overall >= 0.0
    assert breakdown.overall <= 100.0
    assert 0.0 <= breakdown.keyword_match <= 100.0
    assert 0.0 <= breakdown.semantic_similarity <= 100.0

    tier = scorer.get_score_tier(breakdown.overall)
    assert tier in ["excellent", "good", "fair", "poor"]

    should_apply = scorer.should_auto_apply(breakdown.overall)
    assert isinstance(should_apply, bool)


def test_job_preferences_categorical_defaults():
    """Item 3: model defaults — category is always assigned, lists start empty."""
    prefs = JobPreferences()
    assert prefs.keywords_category == "core"
    assert prefs.executive_keywords == []
    assert prefs.functional_keywords == []
    assert prefs.core_skill_tags == []
    assert prefs.job_titles == []
    assert prefs.keywords == []


def _profile_with_prefs(**pref_kwargs) -> UserProfile:
    return UserProfile(
        id=uuid4(),
        email="prefs@example.com",
        full_name="Prefs User",
        preferences=JobPreferences(**pref_kwargs),
    )


def test_categorical_keywords_are_extracted():
    """Item 3: exec/functional/core lists all reach the keyword set."""
    profile = _profile_with_prefs(
        keywords_category="executive",
        executive_keywords=["Chief Technology Officer (CTO)"],
        functional_keywords=["Digital Transformation"],
        core_skill_tags=["Power BI"],
    )
    keywords = ATSScorer()._extract_profile_keywords(profile)
    assert "chief technology officer (cto)" in keywords
    assert "digital transformation" in keywords
    assert "power bi" in keywords


def test_job_titles_are_extracted():
    """Item 6: preferences.job_titles reaches the keyword set."""
    profile = _profile_with_prefs(job_titles=["Chief Data Officer", "Director"])
    keywords = ATSScorer()._extract_profile_keywords(profile)
    assert "chief data officer" in keywords
    assert "director" in keywords


def test_achievements_tokenize_into_keywords():
    """Item 6: achievement text contributes tokens, not whole sentences."""
    profile = UserProfile(
        id=uuid4(),
        email="ach@example.com",
        full_name="Achiever",
        experience=[
            Experience(
                title="CTO",
                company="Acme",
                start_date=datetime(2020, 1, 1, tzinfo=UTC),
                description="Built systems",
                achievements=["Led cloud migration to AWS"],
            ),
        ],
    )
    keywords = ATSScorer()._extract_profile_keywords(profile)
    assert "aws" in keywords  # token extracted — fails pre-tokenization
    assert "led cloud migration to aws" not in keywords  # no raw sentence


def test_empty_achievements_and_preferences_are_safe():
    """Items 3 & 6: empty lists never crash and add no spurious terms."""
    profile = UserProfile(
        id=uuid4(),
        email="empty@example.com",
        full_name="Empty",
        experience=[
            Experience(
                title="Analyst",
                company="Acme",
                start_date=datetime(2021, 6, 1, tzinfo=UTC),
                description="",
                achievements=[],
            ),
        ],
        preferences=JobPreferences(),
    )
    keywords = ATSScorer()._extract_profile_keywords(profile)
    assert isinstance(keywords, set)
    assert "analyst" in keywords  # title still extracted


def test_flat_keywords_still_contribute():
    """Item 3: the flat keywords list is never removed or bypassed."""
    profile = _profile_with_prefs(
        keywords=["Head of Information Systems"],
        executive_keywords=["Chief Innovation Officer"],
    )
    keywords = ATSScorer()._extract_profile_keywords(profile)
    assert "head of information systems" in keywords
    assert "chief innovation officer" in keywords
