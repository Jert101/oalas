#!/bin/bash

# Quick Database Connection Check
# This script quickly checks your database connection

VPS_IP="72.60.76.125"
APP_DIR="/root/oalass"

echo "🔍 Checking database connection..."

ssh root@$VPS_IP << EOF
cd $APP_DIR

echo "=== Service Status ==="
docker-compose -f docker/docker-compose.yml ps

echo "=== MySQL Logs ==="
docker-compose -f docker/docker-compose.yml logs mysql --tail=10

echo "=== App Logs ==="
docker-compose -f docker/docker-compose.yml logs app --tail=10

echo "=== Database Test ==="
docker-compose -f docker/docker-compose.yml exec mysql mysql -u root -p\$MYSQL_ROOT_PASSWORD -e "SELECT 1;" || echo "❌ Database connection failed"

echo "=== Health Check ==="
curl -f http://localhost/api/health || echo "❌ Application health check failed"
EOF

echo "✅ Database check completed!"
