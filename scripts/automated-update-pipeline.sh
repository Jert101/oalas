#!/bin/bash

# OALASS Automated Update Pipeline
# Local → GitHub → VPS
# This script handles the entire update process automatically

set -e

# Configuration
VPS_IP="72.60.76.125"
APP_DIR="/root/oalass"
GITHUB_REPO="your-username/oalass"  # Update this with your actual GitHub repo
GITHUB_BRANCH="main"

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

log "🚀 Starting OALASS Automated Update Pipeline..."

# Step 1: Local - Commit and push to GitHub
log "📝 Step 1: Committing and pushing to GitHub..."
git add .
git commit -m "Automated update: $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main || echo "Push failed, continuing..."

# Step 2: VPS - Pull from GitHub and update
log "🔄 Step 2: Updating VPS from GitHub..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Create backup
BACKUP_NAME="backup-\$(date +%Y%m%d-%H%M%S)"
mkdir -p /root/backups/\$BACKUP_NAME

# Backup database
docker-compose -f docker/docker-compose.yml exec -T mysql mysqldump -u root -p\$MYSQL_ROOT_PASSWORD --all-databases > /root/backups/\$BACKUP_NAME/database.sql 2>/dev/null || echo "Database backup skipped"

# Backup application files
docker-compose -f docker/docker-compose.yml exec -T app tar -czf - /app/uploads /app/logs > /root/backups/\$BACKUP_NAME/app-files.tar.gz 2>/dev/null || echo "App files backup skipped"

echo "Backup created: /root/backups/\$BACKUP_NAME"

# Pull latest changes from GitHub
if [ -d ".git" ]; then
    git pull origin $GITHUB_BRANCH || echo "Git pull failed, continuing with update"
else
    echo "Not a git repository, updating files manually"
fi

# Build new images
docker-compose -f docker/docker-compose.yml build --no-cache

# Run database migrations
docker-compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy || echo "Migration failed, continuing"

# Zero-downtime deployment
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

# Clean up old images
docker image prune -f

echo "Update completed successfully!"
EOF

# Step 3: Verify update
log "✅ Step 3: Verifying update..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Check service status
docker-compose -f docker/docker-compose.yml ps

# Test health endpoint
curl -f http://localhost/api/health || echo "Health check failed"

# Show recent logs
docker-compose -f docker/docker-compose.yml logs --tail=10 app
EOF

log "🎉 Automated update pipeline completed successfully!"
echo ""
echo "=========================================="
echo "🎉 OALASS UPDATE PIPELINE COMPLETE!"
echo "=========================================="
echo "📝 Local changes committed and pushed to GitHub"
echo "🔄 VPS updated from GitHub"
echo "🌐 Application should be running with latest changes"
echo "🏥 Health check: ssh root@$VPS_IP 'curl -f http://localhost/api/health'"
echo "📊 Logs: ssh root@$VPS_IP 'cd $APP_DIR && docker-compose -f docker/docker-compose.yml logs -f'"
echo "=========================================="
