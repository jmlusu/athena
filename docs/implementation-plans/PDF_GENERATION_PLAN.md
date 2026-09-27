# PDF Generation Implementation Plan (WeasyPrint / pdfplumber)

## Objective
Enable full PDF document generation for Athena (resumes, cover letters, proposals) by installing and configuring WeasyPrint for HTML→PDF conversion and pdfplumber for PDF parsing.

## Current State
- **DOCX generation**: ✅ Working via `python-docx` (`backend/src/athena/documents/generator.py`)
- **PDF generation**: ❌ `WeasyPrint` not installed (referenced in generator.py:905-928 but commented/guarded)
- **PDF parsing**: ❌ `pdfplumber` not installed (referenced in `parser.py`)

---

## Technical Implementation

### 1. Add Dependencies (backend/pyproject.toml)

```toml
dependencies = [
    ...
    "python-docx>=1.1.0",
    "weasyprint>=61.0",      # NEW: HTML→PDF conversion
    "pdfplumber>=0.11.0",    # NEW: PDF text/table extraction
    "filelock>=3.16.0",
    ...
]
```

**System dependencies required** (for Dockerfile):
```dockerfile
# WeasyPrint requires: pango, cairo, gdk-pixbuf, libffi
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

### 2. Update Document Generator (backend/src/athena/documents/generator.py)

**Current state** (lines 905-928): PDF generation is attempted but WeasyPrint import is guarded.

**Required changes**:
- Remove try/except guard around WeasyPrint import
- Ensure HTML→PDF conversion works for all document types
- Add proper CSS for print layouts (already exists in frontend for Document Studio)

```python
# generator.py - ensure this works:
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

font_config = FontConfiguration()

async def generate_pdf(html_content: str, base_url: str = "") -> bytes:
    """Convert HTML to PDF using WeasyPrint."""
    html = HTML(string=html_content, base_url=base_url)
    return html.write_pdf(font_config=font_config)
```

### 3. Update Document Parser (backend/src/athena/documents/parser.py)

**Current state**: pdfplumber import guarded.

**Required changes**:
- Enable pdfplumber for PDF text extraction
- Use for parsing uploaded resumes (ATS scoring input)

```python
# parser.py
import pdfplumber

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    return text
```

### 4. Frontend Print-Optimized CSS (Already Exists)

The AI Studio integration added print styles in `frontend/src/index.css`:
```css
@media print {
  .no-print { display: none !important; }
  @page { margin: 0.5in; }
  body { font-size: 11pt; }
  /* ... print-optimized rules for Document Studio */
}
```

**Verification**: Document Studio "Print" button uses `window.print()` — this will now generate proper PDFs via browser print dialog.

### 5. API Enhancement — PDF Output Option

**Current**: `output_format: "docx" | "html" | "both"` (added in merge)

**Enhance**: Ensure `"pdf"` option works via WeasyPrint backend.

```python
# In generator.py generate_resume / generate_cover_letter / generate_document
async def generate_resume(
    self, 
    profile: UserProfile, 
    job: Job, 
    output_format: str = "docx"  # "docx" | "html" | "pdf" | "both"
) -> DocumentOutput:
    # ... existing logic ...
    if output_format in ("pdf", "both"):
        html = self._render_resume_html(profile, job, layout)
        pdf_bytes = await generate_pdf(html)
        # Save .pdf alongside .docx
```

### 6. Dockerfile Updates (backend/Dockerfile)

```dockerfile
FROM python:3.12-slim

# Install system deps for WeasyPrint + Playwright
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    fonts-liberation \
    # Playwright deps
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers
RUN playwright install chromium --with-deps

WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen
COPY backend/src ./src
```

### 7. Verify Font Availability

WeasyPrint needs fonts for PDF rendering. Ensure:
- DejaVu Sans (default) — installed via `fonts-dejavu-core`
- Liberation fonts — installed via `fonts-liberation`
- Custom brand fonts (Cinzel, Lora, Plus Jakarta Sans) — these are web fonts loaded via Google Fonts in frontend; for backend PDF generation, we need local font files or accept DejaVu fallback

**Option A**: Download brand fonts to `backend/fonts/` and register with WeasyPrint
**Option B**: Use system fonts (DejaVu/Liberation) for backend PDF; rely on browser print for brand-faithful PDFs

**Recommendation**: Option B for now (simpler, browser print already uses brand fonts via CSS)

---

## Testing Strategy

### Unit Tests (backend/tests/test_athena_documents.py)
```python
import pytest
from athena.documents.generator import DocumentGenerator
from athena.models import UserProfile, Job

@pytest.mark.asyncio
async def test_generate_resume_pdf():
    profile = create_test_profile()
    job = create_test_job()
    gen = DocumentGenerator()
    output = await gen.generate_resume(profile, job, output_format="pdf")
    assert output.pdf_bytes is not None
    assert len(output.pdf_bytes) > 1000  # Sanity check

@pytest.mark.asyncio
async def test_generate_cover_letter_pdf():
    # ...

@pytest.mark.asyncio
async def test_generate_proposal_pdf():
    # ...
```

### Integration Test (E2E)
- Document Studio → Click "Print" → Verify PDF downloads/prints correctly
- API call `POST /api/v1/athena/ai/tailor-resume` with `output_format: "pdf"` returns PDF bytes

---

## Acceptance Criteria
- [ ] `weasyprint` and `pdfplumber` install without errors
- [ ] `uv sync` succeeds in backend
- [ ] `docker-compose build` succeeds
- [ ] `generate_resume(output_format="pdf")` returns valid PDF bytes
- [ ] `generate_cover_letter(output_format="pdf")` returns valid PDF bytes
- [ ] `generate_document(doc_type="proposal", output_format="pdf")` returns valid PDF
- [ ] PDF parsing via `pdfplumber` extracts text from generated PDFs
- [ ] Document Studio "Print" button produces brand-faithful PDF via browser
- [ ] Existing DOCX generation still works (no regression)

---

## Effort Estimate
| Task | Hours |
|------|-------|
| Add deps + update pyproject.toml | 0.5 |
| Update Dockerfile with system deps | 1 |
| Fix generator.py PDF path | 2 |
| Fix parser.py PDF parsing | 1 |
| Add unit tests | 2 |
| Docker build verification | 1 |
| E2E verification (manual + automated) | 2 |
| **Total** | **~9.5 hours** |

---

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| WeasyPrint font issues | Accept DejaVu fallback for backend; browser print uses brand fonts |
| Large PDF output size | WeasyPrint produces reasonable sizes; monitor |
| Docker image size increase | ~50MB for fonts + cairo/pango; acceptable |
| CI failures on pdfplumber | Pin versions; test in CI before merge |