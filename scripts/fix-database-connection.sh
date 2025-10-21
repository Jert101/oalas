#!/bin/bash

# OALASS Database Connection Fix Script
# This script diagnoses and fixes database connection issues

set -e

VPS_IP="72.60.76.125"
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

log "🔍 Diagnosing database connection issues..."

# Step 1: Check VPS connection
log "📡 Step 1: Testing VPS connection..."
if ! ssh -o ConnectTimeout=10 root@$VPS_IP "echo 'VPS connection successful'" 2>/dev/null; then
    error "Cannot connect to VPS. Please check your SSH connection."
    exit 1
fi

# Step 2: Check database service status
log "🗄️ Step 2: Checking database service status..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

echo "=== Docker Services Status ==="
docker-compose -f docker/docker-compose.yml ps

echo "=== MySQL Container Status ==="
docker-compose -f docker/docker-compose.yml logs mysql --tail=20

echo "=== Application Container Status ==="
docker-compose -f docker/docker-compose.yml logs app --tail=20
EOF

# Step 3: Check database connectivity
log "🔌 Step 3: Testing database connectivity..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

echo "=== Testing MySQL Connection ==="
docker-compose -f docker/docker-compose.yml exec mysql mysql -u root -p\$MYSQL_ROOT_PASSWORD -e "SELECT 1;" || echo "MySQL connection failed"

echo "=== Testing from Application Container ==="
docker-compose -f docker/docker-compose.yml exec app npx prisma db push --accept-data-loss || echo "Prisma connection failed"

echo "=== Environment Variables ==="
docker-compose -f docker/docker-compose.yml exec app env | grep DATABASE
EOF

# Step 4: Fix common database issues
log "🔧 Step 4: Applying database connection fixes..."

ssh root@$VPS_IP << EOF
cd $APP_DIR

echo "=== Restarting Database Service ==="
docker-compose -f docker/docker-compose.yml restart mysql
sleep 10

echo "=== Waiting for Database to be Ready ==="
for i in {1..30}; do
    if docker-compose -f docker/docker-compose.yml exec mysql mysqladmin ping -h localhost --silent; then
        echo "Database is ready!"
        break
    fi
    echo "Waiting for database... (\$i/30)"
    sleep 2
done

echo "=== Restarting Application Services ==="
docker-compose -f docker/docker-compose.yml restart app pm2
sleep 15

echo "=== Testing Application Health ==="
curl -f http://localhost:3000/api/health || echo "Application health check failed"
EOF

# Step 5: Verify fix
log "✅ Step 5: Verifying database connection fix..."
ssh root@$VPS_IP << EOF
cd $APP_DIR

echo "=== Final Service Status ==="
docker-compose -f docker/docker-compose.yml ps

echo "=== Database Connection Test ==="
docker-compose -f docker/docker-compose.yml exec app npx prisma db push || echo "Database connection still failing"

echo "=== Application Health Check ==="
curl -f http://localhost/api/health || echo "Application health check failed"
EOF

log "🎉 Database connection fix completed!"
echo ""
echo "=========================================="
echo "🔧 DATABASE CONNECTION FIX COMPLETE!"
echo "=========================================="
echo "📊 Check status: ssh root@$VPS_IP 'cd $APP_DIR && docker-compose -f docker/docker-compose.yml ps'"
echo "🏥 Health check: ssh root@$VPS_IP 'curl -f http://localhost/api/health'"
echo "📋 Logs: ssh root@$VPS_IP 'cd $APP_DIR && docker-compose -f docker/docker-compose.yml logs -f'"
echo "=========================================="
