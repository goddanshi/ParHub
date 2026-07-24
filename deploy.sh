#!/bin/bash
set -euo pipefail

# Usage:
#   ./deploy.sh           — rebuild & restart backend + frontend
#   ./deploy.sh backend   — only backend
#   ./deploy.sh frontend  — only frontend

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
 
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err()  { echo -e "${RED}[deploy]${NC} $*" >&2; exit 1; }

cd "$(dirname "$(realpath "$0")")"

# Support both docker compose (v2) and docker-compose (v1)
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  err "Neither 'docker compose' nor 'docker-compose' found. Install Docker Compose."
fi

# Default: rebuild both app containers (mysql/phpmyadmin never need rebuild)
SERVICES="${*:-backend frontend}"

log "Using: $DC"
log "Starting deploy for: $SERVICES"
echo "-------------------------------------------"

log "Building images..."
$DC build --no-cache $SERVICES

log "Restarting containers..."
$DC up -d $SERVICES

log "Waiting for containers to come up..."
sleep 4

echo "-------------------------------------------"
log "Container status:"
$DC ps $SERVICES

echo "-------------------------------------------"
log "Recent logs:"
$DC logs --tail=30 $SERVICES

echo "-------------------------------------------"
log "Deploy complete."
