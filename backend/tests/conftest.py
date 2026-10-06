"""Pytest configuration and shared fixtures for backend tests."""


import pytest


class MockDocumentOutput:
    """Mock DocumentOutput with expected filename format."""

    def __init__(self, docx_bytes=b"mock", filename="doc.docx", pdf_bytes=None, warnings=None):
        self.docx_bytes = docx_bytes
        self.pdf_bytes = pdf_bytes
        self.filename = filename
        self.warnings = warnings or []


class MockDocumentGenerator:
    """Mock DocumentGenerator with awaitable methods that generate proper filenames."""

    def __init__(self):
        pass

    async def generate_resume(self, profile, job=None, output_format="docx"):
        name = getattr(profile, "full_name", getattr(profile, "fullName", "Test User")).replace(" ", "_")
        return MockDocumentOutput(docx_bytes=b"mock-resume", filename=f"resume_{name}.docx")

    async def generate_cover_letter(self, profile, job, output_format="docx"):
        name = getattr(profile, "full_name", getattr(profile, "fullName", "Test User")).replace(" ", "_")
        company = getattr(job, "company", "Company").replace(" ", "_")
        return MockDocumentOutput(docx_bytes=b"mock-cover", filename=f"cover_letter_{name}_{company}.docx")

    async def generate_both(self, profile, job=None, output_format="docx"):
        resume = await self.generate_resume(profile, job, output_format)
        cover = await self.generate_cover_letter(profile, job, output_format) if job else None
        return resume, cover

    async def close(self):
        pass


@pytest.fixture(autouse=True)
def mock_document_generator(monkeypatch):
    """Replace DocumentGenerator with a mock that doesn't need WeasyPrint/GTK."""
    mock_class = lambda: MockDocumentGenerator()

    # Patch at all import locations
    monkeypatch.setattr("athena.documents.DocumentGenerator", mock_class)
    monkeypatch.setattr("athena.scheduler.jobs.DocumentGenerator", mock_class)
    monkeypatch.setattr("athena.api.routes.DocumentGenerator", mock_class)


@pytest.fixture
def mock_weasyprint_import(monkeypatch):
    """Mock weasyprint import to simulate missing dependency."""
    monkeypatch.setitem(__import__("sys").modules, "weasyprint", None)
