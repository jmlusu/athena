#!/usr/bin/env sh
# Athena dual-environment preview launcher.
#
# Starts the FastAPI backend and the Vite dev server in AI Studio preview mode
# (AISTUDIO_PREVIEW=true), waits for the backend health check, then brings both
# down together on exit. Intended for AI Studio / cloud sandboxes.
#
# Ports (override when the host injects PORT or to dodge collisions):
#   BACKEND_PORT  (default 8000)
#   FRONTEND_PORT (default 1111)
#   HOST          (default 0.0.0.0)
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(dirname -- "$SCRIPT_DIR")

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-1111}"
HOST="${HOST:-0.0.0.0}"

export AISTUDIO_PREVIEW=true

pids=""
cleanup() {
  trap - INT TERM EXIT
  for pid in $pids; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup INT TERM EXIT

echo "Starting athena backend on ${HOST}:${BACKEND_PORT} (AISTUDIO_PREVIEW=true)..."
(
  cd "$ROOT_DIR/backend"
  if command -v uv >/dev/null 2>&1; then
    PORT="$BACKEND_PORT" HOST="$HOST" uv run python -m athena.api.server
  else
    PORT="$BACKEND_PORT" HOST="$HOST" python -m athena.api.server
  fi
) &
pids="$pids $!"

base="http://127.0.0.1:${BACKEND_PORT}"
i=0
until curl -fsS "$base/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 90 ]; then
    echo "backend at $base/health did not become healthy; aborting" >&2
    exit 1
  fi
  sleep 1
done
echo "Backend healthy at $base/health"

# Shape sanity check — the AI Studio preview environment can serve HTTP 200
# with a body that lacks the `jobs` key, which white-screens the /jobs route.
# Surface it up front so the next engineer sees it immediately instead of
# having to curl manually.
echo "Sanity-checking /api/v1/athena/jobs shape..."
jobs_body=$(curl -fsS "$base/api/v1/athena/jobs?limit=1" 2>/dev/null || echo "")
if echo "$jobs_body" | grep -q '"jobs"'; then
  echo "jobs endpoint shape OK (contains a 'jobs' key)"
else
  echo "WARNING: /api/v1/athena/jobs returned a body without a 'jobs' key." >&2
  echo "         The /jobs route will white-screen. Confirm the proxy target" >&2
  echo "         ($base) is serving Athena's backend, not another process." >&2
  echo "         Body: ${jobs_body}" >&2
fi

echo "Starting athena frontend on :${FRONTEND_PORT} (proxying /api/v1/athena -> ${base})..."
(
  cd "$ROOT_DIR/frontend"
  PORT="$FRONTEND_PORT" HOST="$HOST" ATHENA_BACKEND_URL="$base" pnpm dev
) &
pids="$pids $!"

echo "Preview ready: http://${HOST}:${FRONTEND_PORT}/"
wait