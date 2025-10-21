#!/bin/bash

# Quick OALASS Update for Existing Deployment
# Simple script to update your existing OALASS deployment

set -e

VPS_IP="72.60.76.125"
APP_DIR="/root/oalass"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }

log "🔄 Updating OALASS deployment..."

# Copy updated files
log "📤 Copying updated files..."
scp -r docker/ root@$VPS_IP:$APP_DIR/
scp -r config/ root@$VPS_IP:$APP_DIR/
scp -r scripts/ root@$VPS_IP:$APP_DIR/
scp ecosystem.config.js root@$VPS_IP:$APP_DIR/
scp package*.json root@$VPS_IP:$APP_DIR/
scp next.config.js root@$VPS_IP:$APP_DIR/
scp tsconfig.json root@$VPS_IP:$APP_DIR/
scp -r src/ root@$VPS_IP:$APP_DIR/
scp -r prisma/ root@$VPS_IP:$APP_DIR/
scp -r public/ root@$VPS_IP:$APP_DIR/

# Update application
log "🚀 Updating application..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Build new images
docker-compose -f docker/docker-compose.yml build --no-cache

# Run migrations
docker-compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy

# Restart services
docker-compose -f docker/docker-compose.yml restart

# Wait for health check
sleep 30
curl -f http://localhost/api/health
EOF

log "✅ Update completed!"
echo "🌐 Your OALASS application has been updated!"
echo "🏥 Check health: ssh root@$VPS_IP 'curl -f http://localhost/api/health'"
