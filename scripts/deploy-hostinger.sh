#!/bin/bash

# OALASS Hostinger VPS Deployment Script
# Optimized for Hostinger VPS environment

set -e

# Configuration
APP_NAME="oalass"
DOMAIN="your-domain.com"
VPS_IP="your-vps-ip"
DOCKER_COMPOSE_FILE="docker/docker-compose.yml"
BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/oalass-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p logs backups /var/log

log "🚀 Starting OALASS deployment on Hostinger VPS..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (use sudo)"
    exit 1
fi

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

# Check Hostinger VPS specific requirements
info "🔍 Checking Hostinger VPS requirements..."

# Check if domain is configured
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    warning "Domain $DOMAIN is not resolving. Please configure DNS in Hostinger control panel."
fi

# Check if SSL certificate exists
if [ ! -f "docker/nginx/ssl/cert.pem" ] || [ ! -f "docker/nginx/ssl/key.pem" ]; then
    warning "SSL certificates not found. Please run:"
    echo "  certbot certonly --standalone -d $DOMAIN"
    echo "  cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/cert.pem"
    echo "  cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/key.pem"
fi

# Check environment configuration
if [ ! -f "config/production.env" ]; then
    error "Production environment file not found. Please create config/production.env"
    exit 1
fi

# Backup current deployment
log "📦 Creating backup of current deployment..."
if [ -f "$DOCKER_COMPOSE_FILE" ]; then
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup database
    log "💾 Backing up database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/$BACKUP_NAME/database.sql" 2>/dev/null || warning "Database backup failed"
    
    # Backup application files
    log "📁 Backing up application files..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app tar -czf - /app/uploads /app/logs > "$BACKUP_DIR/$BACKUP_NAME/app-files.tar.gz" 2>/dev/null || warning "Application files backup failed"
    
    log "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME"
else
    warning "No existing deployment found. Skipping backup."
fi

# Pull latest changes
log "📥 Pulling latest changes..."
git pull origin main || error "Failed to pull latest changes"

# Build new images
log "🔨 Building new Docker images..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache || error "Failed to build Docker images"

# Run database migrations
log "🗄️ Running database migrations..."
docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app npx prisma migrate deploy || error "Database migration failed"

# Start services with zero-downtime deployment
log "🚀 Starting services with zero-downtime deployment..."

# Start base services first
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d mysql nginx || error "Failed to start base services"

# Wait for database to be ready
log "⏳ Waiting for database to be ready..."
sleep 15

# Start application with PM2 clustering
log "🔄 Starting application with PM2 clustering..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d pm2 || error "Failed to start PM2 service"

# Wait for application to be healthy
log "🏥 Waiting for application to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        error "❌ Application failed to become healthy. Rolling back..."
        ./scripts/rollback.sh
        exit 1
    fi
    sleep 2
done

# Final health check
log "🔍 Performing final health check..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log "✅ Deployment successful! Application is running and healthy."
else
    error "❌ Final health check failed. Rolling back..."
    ./scripts/rollback.sh
    exit 1
fi

# Clean up old images
log "🧹 Cleaning up old Docker images..."
docker image prune -f || warning "Failed to clean up old images"

# Set up monitoring
log "📊 Setting up monitoring..."
cat > /root/monitor-oalass.sh << 'EOF'
#!/bin/bash
DOMAIN="your-domain.com"
LOG_FILE="/var/log/oalass-monitor.log"

# Check application health
if ! curl -f https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo "$(date): Application health check failed" >> $LOG_FILE
    cd /root/oalass
    docker-compose -f docker/docker-compose.yml restart app
fi
EOF

chmod +x /root/monitor-oalass.sh

# Schedule monitoring
echo "*/5 * * * * /root/monitor-oalass.sh" | crontab - 2>/dev/null || warning "Failed to schedule monitoring"

log "🎉 Deployment completed successfully!"
log "🌐 Application is available at: https://$DOMAIN"
log "🏥 Health check: https://$DOMAIN/api/health"
log "📊 Monitoring: Check /var/log/oalass-monitor.log"

# Display useful information
echo ""
echo "=========================================="
echo "🎉 OALASS DEPLOYMENT COMPLETE!"
echo "=========================================="
echo "🌐 URL: https://$DOMAIN"
echo "🏥 Health: https://$DOMAIN/api/health"
echo "📊 Logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "🔄 Restart: docker-compose -f docker/docker-compose.yml restart"
echo "📁 Backup: $BACKUP_DIR"
echo "=========================================="
