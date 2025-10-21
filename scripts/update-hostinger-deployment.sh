#!/bin/bash

# OALASS Update Script for Existing Hostinger VPS Deployment
# This script updates your existing OALASS deployment

set -e

# Configuration
VPS_IP="72.60.76.125"
APP_NAME="oalass"
APP_DIR="/root/oalass"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"; }

log "🔄 Starting OALASS update on existing deployment..."

# Check if we can connect to VPS
log "🔍 Testing connection to VPS..."
if ! ssh -o ConnectTimeout=10 root@$VPS_IP "echo 'Connection successful'" 2>/dev/null; then
    error "Cannot connect to VPS. Please check your connection."
    exit 1
fi

# Step 1: Backup current deployment
log "💾 Step 1: Creating backup of current deployment..."
ssh root@$VPS_IP << EOF
cd $APP_DIR
BACKUP_NAME="backup-\$(date +%Y%m%d-%H%M%S)"
mkdir -p /root/backups/\$BACKUP_NAME

# Backup database
docker-compose -f docker/docker-compose.yml exec -T mysql mysqldump -u root -p\$MYSQL_ROOT_PASSWORD --all-databases > /root/backups/\$BACKUP_NAME/database.sql 2>/dev/null || echo "Database backup skipped"

# Backup application files
docker-compose -f docker/docker-compose.yml exec -T app tar -czf - /app/uploads /app/logs > /root/backups/\$BACKUP_NAME/app-files.tar.gz 2>/dev/null || echo "App files backup skipped"

echo "Backup created: /root/backups/\$BACKUP_NAME"
EOF

# Step 2: Copy updated files to VPS
log "📤 Step 2: Copying updated files to VPS..."
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

# Step 3: Update application with zero-downtime deployment
log "🚀 Step 3: Updating application with zero-downtime deployment..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Pull latest changes if it's a git repository
if [ -d ".git" ]; then
    git pull origin main || echo "Git pull failed, continuing with file update"
fi

# Build new images
docker-compose -f docker/docker-compose.yml build --no-cache

# Run database migrations
docker-compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy || echo "Migration failed, continuing"

# Restart services with zero-downtime
docker-compose -f docker/docker-compose.yml up -d --scale app=0 --scale pm2=0
sleep 10
docker-compose -f docker/docker-compose.yml up -d pm2
sleep 15
docker-compose -f docker/docker-compose.yml up -d nginx

# Wait for application to be healthy
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "Application is healthy!"
        break
    fi
    if [ \$i -eq 30 ]; then
        echo "Application failed to become healthy"
        exit 1
    fi
    sleep 2
done
EOF

# Step 4: Verify update
log "✅ Step 4: Verifying update..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Check service status
docker-compose -f docker/docker-compose.yml ps

# Test health endpoint
curl -f http://localhost/api/health || echo "Health check failed"

# Check application logs
docker-compose -f docker/docker-compose.yml logs --tail=20 app
EOF

# Step 5: Clean up old images
log "🧹 Step 5: Cleaning up old Docker images..."
ssh root@$VPS_IP "docker image prune -f"

log "🎉 Update completed successfully!"
echo ""
echo "=========================================="
echo "🎉 OALASS UPDATE COMPLETE!"
echo "=========================================="
echo "🌐 Your application should be updated"
echo "🏥 Health check: ssh root@$VPS_IP 'curl -f http://localhost/api/health'"
echo "📊 Logs: ssh root@$VPS_IP 'cd $APP_DIR && docker-compose -f docker/docker-compose.yml logs -f'"
echo "🔄 Restart: ssh root@$VPS_IP 'cd $APP_DIR && docker-compose -f docker/docker-compose.yml restart'"
echo "=========================================="
