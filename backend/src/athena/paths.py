"""Path utilities for Athena - replaces ai_company.paths.get_project_root."""

import os
from pathlib import Path


def get_data_root() -> Path:
    """
    Get the Athena data root directory.

    Priority:
    1. ATHENA_DATA_DIR environment variable
    2. <repo>/company/athena (relative to this file's grandparent)
    3. ~/.athena/data (fallback)
    """
    # 1. Explicit env override
    if env_dir := os.getenv("ATHENA_DATA_DIR"):
        return Path(env_dir).expanduser().resolve()

    # 2. Relative to repo (backend/ -> repo root)
    repo_root = Path(__file__).resolve().parents[3]  # backend/src/athena/paths.py -> repo
    candidate = repo_root / "company" / "athena"
    if candidate.exists() or repo_root.exists():
        return candidate

    # 3. User home fallback
    return Path.home() / ".athena" / "data"


def get_project_root() -> Path:
    """Get the Athena project root (repo root)."""
    return Path(__file__).resolve().parents[3]
