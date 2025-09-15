#!/bin/bash

# Soleva E-commerce Platform - Production Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: staging | production (default: production)

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="solevaeg"
DOMAIN="solevaeg.com"
ADMIN_EMAIL="admin@solevaeg.com"
VPS_IP="213.130.147.41"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
fi

log "Starting deployment for environment: $ENVIRONMENT"

# Create necessary directories
log "Creating directory structure..."
sudo mkdir -p /opt/$PROJECT_NAME/{data,logs,backups,ssl}
sudo mkdir -p /opt/$PROJECT_NAME/data/{postgres,redis,uploads}
sudo chown -R $USER:$USER /opt/$PROJECT_NAME

# Copy environment file
log "Setting up environment configuration..."
if [ ! -f ".env.$ENVIRONMENT" ]; then
    error "Environment file .env.$ENVIRONMENT not found!"
fi

cp .env.$ENVIRONMENT .env

# Validate environment variables
log "Validating environment configuration..."
source .env

required_vars=(
    "POSTGRES_DB"
    "POSTGRES_USER" 
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

# Build and start services
log "Building Docker images..."
docker-compose build --no-cache

log "Starting services..."
docker-compose up -d

# Wait for database to be ready
log "Waiting for database to be ready..."
max_attempts=30
attempt=1

while ! docker-compose exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; do
    if [ $attempt -eq $max_attempts ]; then
        error "Database failed to start after $max_attempts attempts"
    fi
    echo "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

log "Database is ready!"

# Run database migrations
log "Running database migrations..."
docker-compose exec -T backend npm run migrate

# Seed database with initial data
log "Seeding database with initial data..."
docker-compose exec -T backend npm run seed

# Generate SSL certificates if in production
if [ "$ENVIRONMENT" = "production" ]; then
    log "Setting up SSL certificates..."
    
    # Create initial certificates
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $ADMIN_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d api.$DOMAIN \
        -d admin.$DOMAIN
    
    # Set up auto-renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/$PROJECT_NAME/renew-ssl.sh") | crontab -
fi

# Health check
log "Performing health checks..."
sleep 10

# Check frontend
if curl -f http://localhost:5173/health > /dev/null 2>&1; then
    log "✓ Frontend is healthy"
else
    warning "Frontend health check failed"
fi

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log "✓ Backend is healthy"
else
    warning "Backend health check failed"
fi

# Check database
if docker-compose exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
    log "✓ Database is healthy"
else
    warning "Database health check failed"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    log "✓ Redis is healthy"
else
    warning "Redis health check failed"
fi

# Setup monitoring and alerts
log "Setting up monitoring..."
./scripts/setup-monitoring.sh

# Setup backup system
log "Setting up backup system..."
./scripts/setup-backups.sh

# Display deployment summary
log "Deployment completed successfully!"
echo ""
echo "🎉 Soleva E-commerce Platform is now live!"
echo ""
echo "📱 Frontend: http://$DOMAIN"
echo "🔧 Admin Panel: http://admin.$DOMAIN"
echo "🚀 API: http://api.$DOMAIN"
echo "📚 API Docs: http://api.$DOMAIN/docs"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: [Check your environment file]"
echo ""
echo "📊 Monitoring:"
echo "   Logs: docker-compose logs -f"
echo "   Status: docker-compose ps"
echo ""
echo "🛡️ Security:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   SSL: ✓ Enabled with Let's Encrypt"
    echo "   Auto-renewal: ✓ Configured"
else
    echo "   SSL: ⚠️ Not configured (staging environment)"
fi
echo ""
echo "💾 Backups:"
echo "   Location: /opt/$PROJECT_NAME/backups"
echo "   Schedule: Daily at 2 AM UTC"
echo ""

# Final security reminders
warning "Security Reminders:"
echo "1. Change default admin password immediately"
echo "2. Review and update environment variables"
echo "3. Configure firewall rules"
echo "4. Set up monitoring alerts"
echo "5. Test backup and restore procedures"
echo ""

log "Deployment script completed. Please review the output above."
