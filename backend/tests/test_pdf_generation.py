"""PDF generation tests (requires WeasyPrint + GTK/Pango).

Run with: pytest -m weasyprint
Skipped by default on Windows without GTK.
"""

import pytest

# Try to import weasyprint to determine if tests can run
try:
    from weasyprint import CSS, HTML  # noqa: F401 — availability probe

    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False


pytestmark = [
    pytest.mark.weasyprint,
    pytest.mark.skipif(
        not WEASYPRINT_AVAILABLE,
        reason="WeasyPrint/GTK not available; install GTK runtime to run PDF tests",
    ),
]


class TestPDFGeneration:
    """Tests for DOCX → PDF conversion via WeasyPrint."""

    def test_weasyprint_import_works(self):
        """Verify WeasyPrint imports without OSError."""
        from weasyprint import CSS, HTML

        assert CSS is not None
        assert HTML is not None

    def test_css_creation(self):
        """CSS object can be created from string."""
        from weasyprint import CSS

        css = CSS(string="@page { size: A4; margin: 1in; }")
        assert css is not None

    def test_html_creation(self):
        """HTML object can be created from string."""
        from weasyprint import HTML

        html = HTML(string="<html><body><p>Test</p></body></html>")
        assert html is not None

    def test_simple_pdf_generation(self):
        """End-to-end: HTML + CSS → PDF bytes."""
        import io

        from weasyprint import CSS, HTML

        html = HTML(string="<html><body><h1>Hello</h1><p>World</p></body></html>")
        css = CSS(string="@page { size: A4; margin: 1in; }")
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[css])
        pdf_bytes = pdf_buffer.getvalue()

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 100  # non-trivial PDF
        assert pdf_bytes[:4] == b"%PDF"  # PDF magic bytes


class TestDocumentGeneratorPDF:
    """Integration tests for DocumentGenerator PDF output."""

    @pytest.fixture
    def sample_profile(self):
        from athena.models import UserProfile

        return UserProfile(
            full_name="Test User",
            email="test@example.com",
            headline="Software Engineer",
            summary="Test summary",
            skills=[{"name": "Python"}, {"name": "FastAPI"}],
            experience=[
                {
                    "title": "Senior Engineer",
                    "company": "TestCo",
                    "start_date": "2020-01-01T00:00:00Z",
                    "end_date": None,
                    "description": "Built things",
                    "achievements": ["Did X", "Did Y"],
                    "current": True,
                }
            ],
            education=[
                {
                    "institution": "University",
                    "degree": "BS CS",
                    "field_of_study": "Computer Science",
                    "end_date": "2020-06-01T00:00:00Z",
                }
            ],
        )

    @pytest.fixture
    def sample_job(self):
        from uuid import uuid4

        from athena.models import Job, JobSource, JobType

        return Job(
            id=uuid4(),
            source=JobSource.REMOTE_OK,
            title="Backend Developer",
            company="TechCorp",
            location="Remote",
            job_type=JobType.FULL_TIME,
            description="Python role",
            requirements=["Python", "FastAPI"],
        )

    async def test_generate_resume_pdf(self, sample_profile):
        """generate_resume with output_format='pdf' returns PDF bytes."""
        from athena.documents import DocumentGenerator

        gen = DocumentGenerator()
        try:
            output = await gen.generate_resume(sample_profile, output_format="pdf")
            assert output.pdf_bytes is not None
            assert len(output.pdf_bytes) > 100
            assert output.pdf_bytes[:4] == b"%PDF"
            assert output.filename.endswith(".pdf")
        finally:
            await gen.close()

    async def test_generate_cover_letter_pdf(self, sample_profile, sample_job):
        """generate_cover_letter with output_format='pdf' returns PDF bytes."""
        from athena.documents import DocumentGenerator

        gen = DocumentGenerator()
        try:
            output = await gen.generate_cover_letter(
                sample_profile, sample_job, output_format="pdf"
            )
            assert output.pdf_bytes is not None
            assert len(output.pdf_bytes) > 100
            assert output.pdf_bytes[:4] == b"%PDF"
            assert output.filename.endswith(".pdf")
        finally:
            await gen.close()

    async def test_generate_both_pdf(self, sample_profile, sample_job):
        """generate_both with output_format='pdf' returns both as PDF."""
        from athena.documents import DocumentGenerator

        gen = DocumentGenerator()
        try:
            resume, cover = await gen.generate_both(sample_profile, sample_job, output_format="pdf")
            assert resume.pdf_bytes is not None
            assert cover.pdf_bytes is not None
            assert resume.pdf_bytes[:4] == b"%PDF"
            assert cover.pdf_bytes[:4] == b"%PDF"
        finally:
            await gen.close()

    async def test_generate_both_formats(self, sample_profile, sample_job):
        """generate_both with output_format='both' returns docx + pdf."""
        from athena.documents import DocumentGenerator

        gen = DocumentGenerator()
        try:
            resume, cover = await gen.generate_both(
                sample_profile, sample_job, output_format="both"
            )
            assert resume.docx_bytes is not None
            assert resume.pdf_bytes is not None
            assert cover.docx_bytes is not None
            assert cover.pdf_bytes is not None
            assert resume.filename.endswith(".pdf")
            assert cover.filename.endswith(".pdf")
        finally:
            await gen.close()
