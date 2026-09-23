#!/usr/bin/env bash
# Athena OCI/VPS deploy (Oracle Cloud Free Tier / any Ubuntu VPS)
# Run ON the instance after: git clone <repo> && cd athena
# Usage: bash deploy/oci-deploy.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-$PWD}"
ENV_FILE="$REPO_DIR/.env"
COMPOSE="docker compose"

echo "==> Athena OCI deploy starting in $REPO_DIR"

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

# 2. .env with a real API key (never commit it)
if [[ ! -f "$ENV_FILE" ]]; then
  GEN_KEY="$(openssl rand -hex 24)"
  cat > "$ENV_FILE" <<EOF
ATHENA_API_KEY=$GEN_KEY
ATHENA_CORS_ORIGINS=http://localhost:8530,http://127.0.0.1:8530
ATHENA_AUTH_MODE=api_key
ATHENA_RATE_LIMIT=100
ATHENA_DATA_DIR=./company/athena
ATHENA_SCHEDULER_AUTOSTART=true
ATHENA_DEFAULT_SCRAPE_QUERY=software engineer
ATHENA_DEFAULT_SCRAPE_MAX=50
VITE_ATHENA_API_BASE=/api/v1/athena
EOF
  echo "==> Generated $ENV_FILE (ATHENA_API_KEY set)"
else
  echo "==> Found existing .env — leaving unchanged"
fi

# Export for compose
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# 3. Build + start (includes Playwright Chromium in backend image)
echo "==> Building images (first run downloads Chromium ~150 MB)..."
$COMPOSE build

echo "==> Starting stack..."
$COMPOSE up -d

# 4. Wait for health
echo "==> Waiting for backend health..."
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8520/health >/dev/null 2>&1; then
    echo "==> Backend healthy"
    break
  fi
  sleep 2
  if [[ "$i" -eq 60 ]]; then
    echo "!! Backend did not become healthy in 120s" >&2
    $COMPOSE logs --tail=50 backend
    exit 1
  fi
done

# 5. Firewall reminder (OCI: open in security list + local ufw)
echo "==> Done. Local ports: backend 8520, frontend 8530"
echo "    OCI checklist:"
echo "    - Open TCP 80/443 (and 8520/8530 if not using a reverse proxy) in the instance security list"
echo "    - Optional: sudo ufw allow 80,443 && sudo ufw enable"
echo "    - Put Caddy/nginx TLS in front before exposing publicly"
echo "    - Dashboard: http://<instance-ip>:8530"
