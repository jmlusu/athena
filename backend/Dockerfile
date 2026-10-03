# backend/Dockerfile — FastAPI with uv + Playwright Chromium
FROM python:3.12-slim AS base

# System deps for Playwright + weasyprint
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

# Install Python deps
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --extra dev

# Copy source
COPY src/ ./src/

# Install Playwright Chromium (cached in layer)
RUN uv run playwright install --with-deps chromium

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "athena.api.app:app", "--host", "0.0.0.0", "--port", "8000"]