#!/bin/bash

# Soleva E-commerce Platform - Production Deployment Script
# This script deploys the entire platform (frontend, backend, admin panel) to production

set -e  # Exit on any error

echo "🚀 Starting Soleva E-commerce Platform Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found. Please create it from env.production template."
    exit 1
fi

print_status "Environment file found ✓"

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=(
    "NODE_ENV"
    "DOMAIN"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env.production"
        exit 1
    fi
done

print_status "Environment variables validated ✓"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to force rebuild
print_status "Removing old images..."
docker-compose down --rmi all --volumes --remove-orphans || true

# Build and start services
print_status "Building and starting services..."
docker-compose --env-file .env.production up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check database
if docker-compose exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
    print_success "Database is ready ✓"
else
    print_error "Database is not ready"
    exit 1
fi

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend API is ready ✓"
else
    print_error "Backend API is not ready"
    exit 1
fi

# Check frontend
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    print_success "Frontend is ready ✓"
else
    print_error "Frontend is not ready"
    exit 1
fi

# Check admin panel
if curl -f http://localhost:3002 > /dev/null 2>&1; then
    print_success "Admin panel is ready ✓"
else
    print_error "Admin panel is not ready"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T backend npx prisma migrate deploy

# Seed the database
print_status "Seeding database..."
docker-compose exec -T backend npx prisma db seed

print_success "Database seeded successfully ✓"

# Test admin login
print_status "Testing admin login..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_success "Admin login test passed ✓"
else
    print_warning "Admin login test failed. Please check credentials."
    echo "Response: $ADMIN_LOGIN_RESPONSE"
fi

# Display deployment summary
echo ""
echo "🎉 Production Deployment Completed Successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "====================="
echo "🌐 Frontend URL: https://$DOMAIN"
echo "🔧 Backend API: https://api.$DOMAIN"
echo "👨‍💼 Admin Panel: https://admin.$DOMAIN"
echo ""
echo "🔐 Admin Panel Access:"
echo "====================="
echo "URL: https://admin.$DOMAIN"
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo ""
echo "📊 Service Status:"
echo "================="
echo "Database: ✅ Running"
echo "Backend API: ✅ Running"
echo "Frontend: ✅ Running"
echo "Admin Panel: ✅ Running"
echo "Nginx: ✅ Running"
echo ""
echo "🔧 Useful Commands:"
echo "==================="
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo "Restart services: docker-compose restart"
echo "Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️  Important Security Notes:"
echo "============================="
echo "1. Change the default admin password immediately"
echo "2. Ensure SSL certificates are properly configured"
echo "3. Set up proper firewall rules"
echo "4. Configure regular backups"
echo "5. Monitor logs for any issues"
echo ""
print_success "Deployment completed! Your Soleva E-commerce platform is now live! 🚀"
