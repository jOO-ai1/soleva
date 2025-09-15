#!/bin/bash

# Production Deployment Script for Soleva E-commerce Platform

set -e

echo "🚀 Starting Production Deployment..."

# Load environment variables safely
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
else
    echo "❌ .env file not found!"
    exit 1
fi

# Validate critical environment variables
required_vars=("NODE_ENV" "DOMAIN" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ Environment variables loaded and validated"

# Ensure we're using production environment
export NODE_ENV=production

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Clean up old images and volumes (optional - uncomment if needed)
# echo "Removing old images..."
# docker-compose down --rmi all --volumes --remove-orphans

# Build and start services with production configuration
echo "Building and starting services in production mode..."
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Check service health
echo "Checking service health..."
docker-compose ps

# Test connectivity
echo "Testing service connectivity..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is responding"
else
    echo "⚠️  Nginx health check failed"
fi

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "⚠️  Backend API health check failed"
fi

echo ""
echo "✅ Production deployment completed!"
echo "🌐 Frontend: https://${DOMAIN:-solevaeg.com}"
echo "🔧 Admin Panel: https://admin.${DOMAIN:-solevaeg.com}"
echo "📡 API: https://api.${DOMAIN:-solevaeg.com}"
echo ""
echo "📋 Next steps:"
echo "  1. Configure SSL certificates if not already done"
echo "  2. Update DNS records to point to this server"
echo "  3. Test all functionality"
echo "  4. Set up monitoring and backups"
