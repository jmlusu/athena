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

# Install Python dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY backend/src ./src

# Create data directory
RUN mkdir -p /app/company/athena

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "athena.api.app:app", "--host", "0.0.0.0", "--port", "8000"]