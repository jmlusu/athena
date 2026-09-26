"""Dynamic server configuration for dual-environment compatibility."""

import os

import uvicorn

from athena.api.app import create_app


def start_server(app=None):
    """Start server with environment-aware host and port configuration."""
    if app is None:
        app = create_app()

    is_cloud_preview = (
        os.environ.get("AISTUDIO_PREVIEW") == "true"
        or os.environ.get("NODE_ENV") == "development_cloud"
    )

    port = int(os.environ.get("PORT", os.environ.get("ATHENA_PORT", "8000")))
    host = os.environ.get("HOST", os.environ.get("ATHENA_HOST"))

    if host is None:
        host = "0.0.0.0" if is_cloud_preview else "127.0.0.1"

    return uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_server()
