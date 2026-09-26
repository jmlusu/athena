# Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock* ./

# Install Python dependencies (without the project; sources are copied next so
# edits under backend/src do not re-download dependencies)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Install Playwright Chromium (+ system deps) for browser-based scrapers
RUN --mount=type=cache,target=/root/.cache/uv \
    /app/.venv/bin/playwright install --with-deps chromium

# Copy application code (required for the editable `athena` install declared with src layout)
COPY backend/src ./src

# Install the application into the environment
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Create data directory
RUN mkdir -p /app/company/athena

# Expose port
EXPOSE 8000

# Run the application with environment-aware configuration
CMD ["uv", "run", "uvicorn", "athena.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
