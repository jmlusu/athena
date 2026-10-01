@echo off
set ATHENA_DATA_DIR=%1
set ATHENA_SCHEDULER_AUTOSTART=false
set ATHENA_RATE_LIMIT=1000000
set ATHENA_API_KEY=%2
set ATHENA_AUTH_MODE=api_key
set ATHENA_AI_PROVIDER=fallback
set GEMINI_API_KEY=
set AISTUDIO_PREVIEW=false
set ATHENA_TEST_MODE=true
.venv\Scripts\python.exe -m uvicorn athena.api.app:app --host 127.0.0.1 --port %3
