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

# Default: rebuild both app containers (mysql/phpmyadmin never need rebuild)
SERVICES="${*:-backend frontend}"

log "Starting deploy for: $SERVICES"
echo "-------------------------------------------"

log "Building images..."
docker compose build $SERVICES

log "Restarting containers..."
docker compose up -d $SERVICES

log "Waiting for containers to come up..."
sleep 4

echo "-------------------------------------------"
log "Container status:"
docker compose ps $SERVICES

echo "-------------------------------------------"
log "Recent logs:"
docker compose logs --tail=30 $SERVICES

echo "-------------------------------------------"
log "Deploy complete."
