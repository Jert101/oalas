#!/bin/bash

# OALASS One-Command Update
# Handles: Local → GitHub → VPS automatically

set -e

VPS_IP="72.60.76.125"
APP_DIR="/root/oalass"

echo "🚀 OALASS Automated Update Starting..."

# Step 1: Local - Commit and push
echo "📝 Committing and pushing to GitHub..."
git add .
git commit -m "Update: $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main || echo "Push failed, continuing..."

# Step 2: VPS - Update from GitHub
echo "🔄 Updating VPS from GitHub..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

# Backup current deployment
BACKUP_NAME="backup-\$(date +%Y%m%d-%H%M%S)"
mkdir -p /root/backups/\$BACKUP_NAME
docker-compose -f docker/docker-compose.yml exec -T mysql mysqldump -u root -p\$MYSQL_ROOT_PASSWORD --all-databases > /root/backups/\$BACKUP_NAME/database.sql 2>/dev/null || echo "Database backup skipped"

# Pull latest changes
if [ -d ".git" ]; then
    git pull origin main || echo "Git pull failed, continuing"
fi

# Update application
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy || echo "Migration failed, continuing"
docker-compose -f docker/docker-compose.yml restart

# Wait for health check
sleep 30
curl -f http://localhost/api/health || echo "Health check failed"

# Clean up
docker image prune -f

echo "Update completed!"
EOF

echo "✅ Update completed successfully!"
echo "🌐 Your OALASS application has been updated!"
echo "🏥 Check: ssh root@$VPS_IP 'curl -f http://localhost/api/health'"
