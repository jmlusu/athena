#!/usr/bin/env python3
"""
Wrapper script to set environment variables and run uvicorn.
Bypasses Windows shell environment variable inheritance issues.
"""

import os
import subprocess
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 4:
        print("Usage: run_backend_test.py <DATA_DIR> <API_KEY> <PORT>")
        sys.exit(1)

    data_dir, api_key, port = sys.argv[1], sys.argv[2], sys.argv[3]

    # Set env vars BEFORE importing uvicorn/app
    os.environ["ATHENA_DATA_DIR"] = data_dir
    os.environ["ATHENA_SCHEDULER_AUTOSTART"] = "false"
    os.environ["ATHENA_RATE_LIMIT"] = "1000000"
    os.environ["ATHENA_API_KEY"] = api_key
    os.environ["ATHENA_AUTH_MODE"] = "api_key"
    os.environ["ATHENA_AI_PROVIDER"] = "fallback"
    os.environ["GEMINI_API_KEY"] = ""
    os.environ["AISTUDIO_PREVIEW"] = "false"
    os.environ["ATHENA_TEST_MODE"] = "true"

    # Debug: print env var to verify
    print(f"ATHENA_DATA_DIR set to: {os.environ.get('ATHENA_DATA_DIR')}")
    sys.stdout.flush()

    # Use venv python to ensure Python 3.12+ for PEP 695 syntax.
    # Windows venvs live in Scripts/, POSIX venvs in bin/.
    venv_dir = Path(__file__).resolve().parent / ".venv"
    if os.name == "nt":
        venv_python = venv_dir / "Scripts" / "python.exe"
    else:
        venv_python = venv_dir / "bin" / "python"
    if not venv_python.exists():
        # No venv (e.g. uv-managed interpreter already active) - use ourselves.
        venv_python = sys.executable

    # Run uvicorn using subprocess with venv python
    subprocess.run(
        [venv_python, "-m", "uvicorn", "athena.api.app:app", "--host", "127.0.0.1", "--port", port],
        check=True,
    )


if __name__ == "__main__":
    main()
