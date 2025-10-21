#!/bin/bash

# OALASS Rollback Script
# Emergency rollback to previous deployment

set -e

# Configuration
APP_NAME="oalass"
DOCKER_COMPOSE_FILE="docker/docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/rollback.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log "Starting OALASS rollback..."

# Find latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    error "No backup found. Cannot rollback."
    exit 1
fi

log "Rolling back to backup: $LATEST_BACKUP"

# Stop current services
log "Stopping current services..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down || warning "Failed to stop some services"

# Restore database
log "Restoring database from backup..."
if [ -f "$BACKUP_DIR/$LATEST_BACKUP/database.sql" ]; then
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d mysql
    sleep 10
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$BACKUP_DIR/$LATEST_BACKUP/database.sql" || error "Failed to restore database"
else
    warning "No database backup found. Skipping database restore."
fi

# Restore application files
log "Restoring application files..."
if [ -f "$BACKUP_DIR/$LATEST_BACKUP/app-files.tar.gz" ]; then
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app tar -xzf - -C / < "$BACKUP_DIR/$LATEST_BACKUP/app-files.tar.gz" || warning "Failed to restore application files"
else
    warning "No application files backup found. Skipping files restore."
fi

# Start services
log "Starting services..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || error "Failed to start services"

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 15

# Health check
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log "✅ Rollback successful! Application is running and healthy."
else
    error "❌ Rollback failed. Application is not healthy."
    exit 1
fi

log "🎉 Rollback completed successfully!"
log "Application is available at: http://localhost"
log "Health check: http://localhost/api/health"
