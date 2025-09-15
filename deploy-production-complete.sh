#!/bin/bash

# ====== Soleva E-commerce Platform - Complete Production Deployment ======
# This script deploys the complete production environment with all services
# Updated: $(date)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

log "Starting Soleva E-commerce Platform Production Deployment..."

# Check if env.production exists
if [ ! -f "env.production" ]; then
    error "env.production file not found. Please ensure the production environment file exists."
    exit 1
fi

# Load environment variables
log "Loading production environment variables..."
export $(grep -v '^#' env.production | xargs)

# Validate critical environment variables
log "Validating critical environment variables..."

required_vars=(
    "NODE_ENV"
    "DOMAIN"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
    "SMTP_USER"
    "SMTP_PASS"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
        exit 1
    fi
done

success "Environment variables validated"

# Check for placeholder values that need to be replaced
log "Checking for placeholder values..."

placeholder_vars=(
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "SENTRY_DSN"
    "FACEBOOK_PIXEL_ID"
    "UPTIME_WEBHOOK_URL"
    "SLACK_WEBHOOK_URL"
)

for var in "${placeholder_vars[@]}"; do
    if [[ "${!var}" == *"YOUR_"* ]] || [[ "${!var}" == *"your-"* ]]; then
        warning "Placeholder value detected for $var. Please update with actual values before production use."
    fi
done

# Stop existing containers
log "Stopping existing containers..."
$DOCKER_COMPOSE down --remove-orphans || true

# Remove old images to force rebuild
log "Removing old images..."
$DOCKER_COMPOSE down --rmi all --volumes --remove-orphans || true

# Create necessary directories
log "Creating necessary directories..."
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/certbot-webroot
mkdir -p backend/uploads
mkdir -p backend/logs

# Set proper permissions
log "Setting proper permissions..."
chmod 755 docker/nginx/ssl
chmod 755 docker/nginx/certbot-webroot
chmod 755 backend/uploads
chmod 755 backend/logs

# Build and start services
log "Building and starting all services..."
$DOCKER_COMPOSE --env-file env.production up --build -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Check service health
log "Checking service health..."

services=("postgres" "redis" "backend" "frontend" "admin" "nginx")
for service in "${services[@]}"; do
    if $DOCKER_COMPOSE ps | grep -q "$service.*Up"; then
        success "$service is running"
    else
        error "$service is not running properly"
        $DOCKER_COMPOSE logs $service
        exit 1
    fi
done

# Run database migrations
log "Running database migrations..."
$DOCKER_COMPOSE exec backend npx prisma migrate deploy || {
    error "Database migration failed"
    $DOCKER_COMPOSE logs backend
    exit 1
}

# Seed database if needed
log "Seeding database..."
$DOCKER_COMPOSE exec backend npx prisma db seed || {
    warning "Database seeding failed or not configured"
}

# Test API endpoints
log "Testing API endpoints..."
sleep 10

# Test backend health
if curl -f -s http://localhost:3001/health > /dev/null; then
    success "Backend API is responding"
else
    error "Backend API is not responding"
    $DOCKER_COMPOSE logs backend
    exit 1
fi

# Test frontend
if curl -f -s http://localhost:80 > /dev/null; then
    success "Frontend is responding"
else
    error "Frontend is not responding"
    $DOCKER_COMPOSE logs frontend
    exit 1
fi

# Test admin panel
if curl -f -s http://localhost:3002 > /dev/null; then
    success "Admin panel is responding"
else
    error "Admin panel is not responding"
    $DOCKER_COMPOSE logs admin
    exit 1
fi

# Display deployment summary
log "Deployment completed successfully!"
echo ""
echo "=========================================="
echo "  SOLEVA E-COMMERCE PLATFORM DEPLOYED"
echo "=========================================="
echo ""
echo "🌐 Frontend:     http://localhost:80"
echo "🔧 Admin Panel:  http://localhost:3002"
echo "⚡ Backend API:  http://localhost:3001"
echo "🗄️  Database:    PostgreSQL on port 5432"
echo "📦 Redis:        Redis on port 6379"
echo ""
echo "📧 Admin Email:  $ADMIN_EMAIL"
echo "🔑 Admin Pass:   $ADMIN_PASSWORD"
echo ""
echo "📊 Analytics:    GA4 ID: $GA4_MEASUREMENT_ID"
echo "🏷️  GTM:         Container: $GTM_CONTAINER_ID"
echo ""
echo "🔒 Security Features:"
echo "   ✅ JWT Authentication"
echo "   ✅ Redis Password Protection"
echo "   ✅ Database Password Protection"
echo "   ✅ Rate Limiting"
echo "   ✅ CORS Configuration"
echo ""
echo "🚀 Features Enabled:"
echo "   ✅ Chat Widget: $ENABLE_CHAT_WIDGET"
echo "   ✅ Social Login: $ENABLE_SOCIAL_LOGIN"
echo "   ✅ Analytics: $ENABLE_ANALYTICS"
echo "   ✅ Payment Proofs: $ENABLE_PAYMENT_PROOFS"
echo "   ✅ Adaptive Mode: $ENABLE_ADAPTIVE_MODE"
echo ""
echo "💳 Payment Methods:"
echo "   ✅ Cash on Delivery: $ENABLE_COD"
echo "   ✅ Bank Wallet: $ENABLE_BANK_WALLET"
echo "   ✅ Digital Wallet: $ENABLE_DIGITAL_WALLET"
echo "   💰 Free Shipping Threshold: $FREE_SHIPPING_THRESHOLD EGP"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure SSL certificates for production domains"
echo "   2. Set up monitoring and alerting"
echo "   3. Configure backup schedules"
echo "   4. Update DNS records to point to your server"
echo "   5. Test all functionality thoroughly"
echo ""
echo "📚 Useful Commands:"
echo "   View logs:     $DOCKER_COMPOSE logs -f [service]"
echo "   Stop services: $DOCKER_COMPOSE down"
echo "   Restart:       $DOCKER_COMPOSE restart [service]"
echo "   Update:        $DOCKER_COMPOSE pull && $DOCKER_COMPOSE up -d"
echo ""
echo "=========================================="

success "Soleva E-commerce Platform is now running in production mode!"
