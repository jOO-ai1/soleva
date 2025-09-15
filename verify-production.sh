#!/bin/bash

# Soleva E-commerce Platform - Production Verification Script
# This script verifies that all services are ready for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔍 Verifying Soleva E-commerce Platform Production Readiness..."
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    exit 1
fi
print_success "Environment file found ✓"

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running"
    exit 1
fi
print_success "Docker is running ✓"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_success "Docker Compose is available ✓"

# Check if all required files exist
required_files=(
    "docker-compose.yml"
    "Dockerfile.frontend"
    "backend/Dockerfile"
    "admin/Dockerfile"
    "docker/nginx/nginx.conf"
    "docker/nginx/conf.d/solevaeg.conf"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file $file not found"
        exit 1
    fi
done
print_success "All required files present ✓"

# Check if .gitignore is properly configured
if grep -q "node_modules" .gitignore && grep -q "dist" .gitignore && grep -q ".env" .gitignore; then
    print_success ".gitignore properly configured ✓"
else
    print_warning ".gitignore may need updates"
fi

# Check if admin credentials are set
if grep -q "ADMIN_EMAIL" .env.production && grep -q "ADMIN_PASSWORD" .env.production; then
    print_success "Admin credentials configured ✓"
else
    print_error "Admin credentials not found in .env.production"
    exit 1
fi

# Check if database configuration is set
if grep -q "DATABASE_URL" .env.production && grep -q "POSTGRES_PASSWORD" .env.production; then
    print_success "Database configuration found ✓"
else
    print_error "Database configuration incomplete"
    exit 1
fi

# Check if JWT secrets are configured
if grep -q "JWT_SECRET" .env.production && grep -q "JWT_REFRESH_SECRET" .env.production; then
    print_success "JWT configuration found ✓"
else
    print_error "JWT secrets not configured"
    exit 1
fi

# Check if domain is configured
if grep -q "DOMAIN=" .env.production; then
    DOMAIN=$(grep "DOMAIN=" .env.production | cut -d'=' -f2)
    print_success "Domain configured: $DOMAIN ✓"
else
    print_error "Domain not configured"
    exit 1
fi

# Check if all services can be built
print_status "Testing Docker builds..."

if docker-compose config &> /dev/null; then
    print_success "Docker Compose configuration valid ✓"
else
    print_error "Docker Compose configuration invalid"
    exit 1
fi

# Check if backend can be built
if docker build -f backend/Dockerfile backend/ &> /dev/null; then
    print_success "Backend Docker build test passed ✓"
else
    print_error "Backend Docker build failed"
    exit 1
fi

# Check if admin can be built
if docker build -f admin/Dockerfile admin/ &> /dev/null; then
    print_success "Admin Docker build test passed ✓"
else
    print_error "Admin Docker build failed"
    exit 1
fi

# Check if frontend can be built
if docker build -f Dockerfile.frontend . &> /dev/null; then
    print_success "Frontend Docker build test passed ✓"
else
    print_error "Frontend Docker build failed"
    exit 1
fi

# Check if nginx configuration is valid
if docker run --rm -v $(pwd)/docker/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t &> /dev/null; then
    print_success "Nginx configuration valid ✓"
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Check if admin panel has proper API configuration
if grep -q "REACT_APP_API_URL" admin/src/services/api.ts; then
    print_success "Admin API configuration found ✓"
else
    print_warning "Admin API configuration may need review"
fi

# Check if backend has proper admin routes
if grep -q "admin/login" backend/src/routes/auth.ts; then
    print_success "Admin authentication routes found ✓"
else
    print_error "Admin authentication routes not found"
    exit 1
fi

# Check if database schema is present
if [ -f "backend/prisma/schema.prisma" ]; then
    print_success "Database schema found ✓"
else
    print_error "Database schema not found"
    exit 1
fi

# Check if seed data is present
if [ -f "backend/prisma/seed.ts" ]; then
    print_success "Database seed file found ✓"
else
    print_error "Database seed file not found"
    exit 1
fi

echo ""
echo "🎉 Production Readiness Verification Complete!"
echo ""
echo "📋 Summary:"
echo "==========="
print_success "All critical components verified ✓"
print_success "Docker builds tested successfully ✓"
print_success "Configuration files validated ✓"
print_success "Admin panel setup confirmed ✓"
echo ""
echo "🚀 Your Soleva E-commerce platform is ready for production deployment!"
echo ""
echo "Next steps:"
echo "1. Run: ./deploy-production.sh"
echo "2. Access admin panel at: https://admin.$DOMAIN"
echo "3. Login with admin credentials from .env.production"
echo "4. Change default admin password immediately"
echo ""
print_success "Ready to deploy! 🚀"
