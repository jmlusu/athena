#!/usr/bin/env bash
# Athena production deploy (Docker Compose + Caddy)
# Usage: bash deploy/deploy.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-$PWD}"
ENV_FILE="$REPO_DIR/.env"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Athena production deploy starting in $REPO_DIR"

# 1. Verify .env
if [[ ! -f "$ENV_FILE" ]]; then
  echo "!! Missing .env — copy .env.example and fill in GEMINI_API_KEY, ATHENA_API_KEY"
  exit 1
fi

# 2. Build images
echo "==> Building images..."
$COMPOSE build

# 3. Start stack
echo "==> Starting stack..."
$COMPOSE up -d

# 4. Wait for backend health
echo "==> Waiting for backend health..."
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "==> Backend healthy"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "!! Backend did not become healthy in 60s"
    $COMPOSE logs --tail=50 backend
    exit 1
  fi
done

# 5. Verify frontend
echo "==> Verifying frontend..."
if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
  echo "==> Frontend reachable"
else
  echo "!! Frontend not reachable"
  $COMPOSE logs --tail=20 frontend
  exit 1
fi

echo "==> Deploy complete."
echo "   App: https://yourdomain.com"
echo "   API: https://api.yourdomain.com"