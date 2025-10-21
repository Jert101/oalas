#!/bin/bash

# OALASS Deployment Script
# Zero-downtime deployment with rollback capability

set -e

# Configuration
APP_NAME="oalass"
DOCKER_COMPOSE_FILE="docker/docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"

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

# Create necessary directories
mkdir -p logs backups

log "Starting OALASS deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Backup current deployment
log "Creating backup of current deployment..."
if [ -f "$DOCKER_COMPOSE_FILE" ]; then
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup database
    log "Backing up database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/$BACKUP_NAME/database.sql" || warning "Database backup failed"
    
    # Backup application files
    log "Backing up application files..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app tar -czf - /app/uploads /app/logs > "$BACKUP_DIR/$BACKUP_NAME/app-files.tar.gz" || warning "Application files backup failed"
    
    log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
else
    warning "No existing deployment found. Skipping backup."
fi

# Pull latest changes
log "Pulling latest changes..."
git pull origin main || error "Failed to pull latest changes"

# Build new images
log "Building new Docker images..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache || error "Failed to build Docker images"

# Run database migrations
log "Running database migrations..."
docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app npx prisma migrate deploy || error "Database migration failed"

# Start services with zero-downtime deployment
log "Starting services with zero-downtime deployment..."

# Start new containers
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --scale app=0 --scale pm2=0 || error "Failed to start base services"

# Wait for database to be ready
log "Waiting for database to be ready..."
sleep 10

# Start application with PM2 clustering
log "Starting application with PM2 clustering..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d pm2 || error "Failed to start PM2 service"

# Wait for application to be healthy
log "Waiting for application to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Application failed to become healthy. Rolling back..."
        ./scripts/rollback.sh
        exit 1
    fi
    sleep 2
done

# Start Nginx
log "Starting Nginx reverse proxy..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d nginx || error "Failed to start Nginx"

# Final health check
log "Performing final health check..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log "✅ Deployment successful! Application is running and healthy."
else
    error "❌ Final health check failed. Rolling back..."
    ./scripts/rollback.sh
    exit 1
fi

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -f || warning "Failed to clean up old images"

log "🎉 Deployment completed successfully!"
log "Application is available at: http://localhost"
log "Health check: http://localhost/api/health"
