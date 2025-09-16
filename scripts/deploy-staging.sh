#!/bin/bash

# Soleva E-commerce Platform - Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh

set -e  # Exit on any error

# Configuration
ENVIRONMENT="staging"
PROJECT_NAME="solevaeg-staging"
STAGING_PORT="8080"

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

# Check if Docker Compose is installed (v2)
if ! docker compose version >/dev/null 2>&1; then
    if ! command -v $COMPOSE_CMD >/dev/null; then
        error "Neither 'docker compose' nor '$COMPOSE_CMD' is available. Please install Docker Compose first."
    fi
    log "Using Docker Compose v1 ($COMPOSE_CMD)"
    COMPOSE_CMD="$COMPOSE_CMD"
else
    log "Using Docker Compose v2 (docker compose)"
    COMPOSE_CMD="docker compose"
fi

log "Starting staging deployment..."

# Create staging environment file if it doesn't exist
if [ ! -f ".env.staging" ]; then
    log "Creating staging environment file..."
    cp env.staging .env.staging
    warning "Please update .env.staging with your staging configuration"
fi

# Load staging environment
source .env.staging

# Stop any existing staging containers
log "Stopping existing staging containers..."
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml down --remove-orphans || true

# Pull latest images and build
log "Building staging images..."
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml build --no-cache

# Start staging services
log "Starting staging services..."
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml up -d

# Wait for database to be ready
log "Waiting for database to be ready..."
max_attempts=30
attempt=1

while ! $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T postgres pg_isready -U solevaeg_staging -d solevaeg_staging > /dev/null 2>&1; do
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
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T backend npm run migrate

# Seed database with staging data
log "Seeding database with staging data..."
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T backend npm run seed:staging

# Health check
log "Performing health checks..."
sleep 10

# Check frontend
if curl -f http://localhost:${STAGING_PORT} > /dev/null 2>&1; then
    log "✓ Frontend is healthy"
else
    warning "Frontend health check failed"
fi

# Check backend
if curl -f http://localhost:${STAGING_PORT}/api/health > /dev/null 2>&1; then
    log "✓ Backend is healthy"
else
    warning "Backend health check failed"
fi

# Check admin
if curl -f http://localhost:${STAGING_PORT}/admin > /dev/null 2>&1; then
    log "✓ Admin panel is healthy"
else
    warning "Admin panel health check failed"
fi

# Check database
if $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T postgres pg_isready -U solevaeg_staging -d solevaeg_staging > /dev/null 2>&1; then
    log "✓ Database is healthy"
else
    warning "Database health check failed"
fi

# Check Redis
if $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T redis redis-cli -a staging_redis_123 ping > /dev/null 2>&1; then
    log "✓ Redis is healthy"
else
    warning "Redis health check failed"
fi

# Create staging test data
log "Creating staging test data..."
$COMPOSE_CMD -f $COMPOSE_CMD.staging.yml exec -T backend npm run create-test-data

# Display staging summary
log "Staging deployment completed successfully!"
echo ""
echo "🎉 Soleva Staging Environment is now live!"
echo ""
echo "📱 Staging URLs:"
echo "   Frontend: http://localhost:${STAGING_PORT}"
echo "   Admin Panel: http://localhost:${STAGING_PORT}/admin"
echo "   API: http://localhost:${STAGING_PORT}/api"
echo "   API Docs: http://localhost:${STAGING_PORT}/api/docs"
echo ""
echo "🔐 Staging Admin Credentials:"
echo "   Email: ${ADMIN_EMAIL}"
echo "   Password: ${ADMIN_PASSWORD}"
echo ""
echo "📊 Monitoring:"
echo "   Logs: $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml logs -f"
echo "   Status: $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml ps"
echo ""
echo "🧪 Test Data:"
echo "   - 50 sample products across all collections"
echo "   - 20 test customers with various profiles"
echo "   - 100 sample orders with different statuses"
echo "   - Complete Egyptian shipping data"
echo "   - Test payment proofs and return requests"
echo ""
echo "🔄 Management Commands:"
echo "   Stop: $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml down"
echo "   Restart: $COMPOSE_CMD -f $COMPOSE_CMD.staging.yml restart"
echo "   Reset: ./scripts/reset-staging.sh"
echo ""

# Test key functionality
log "Running staging functionality tests..."

# Test API endpoints
test_endpoints=(
    "http://localhost:${STAGING_PORT}/api/health"
    "http://localhost:${STAGING_PORT}/api/v1/products"
    "http://localhost:${STAGING_PORT}/api/v1/shipping/governorates"
    "http://localhost:${STAGING_PORT}/api/v1/collections"
)

for endpoint in "${test_endpoints[@]}"; do
    if curl -f "$endpoint" > /dev/null 2>&1; then
        log "✓ $endpoint is responding"
    else
        warning "✗ $endpoint is not responding"
    fi
done

# Final reminders
warning "Staging Environment Notes:"
echo "1. This is a staging environment - data will be reset periodically"
echo "2. Payment processing is in test mode"
echo "3. Emails are sent to staging addresses only"
echo "4. File uploads are stored locally (not S3)"
echo "5. Analytics and monitoring are disabled by default"
echo ""

log "Staging deployment script completed. Environment is ready for UAT!"
