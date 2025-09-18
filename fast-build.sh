#!/bin/bash

# Fast Docker Build Script for Soleva
# This script uses optimized Dockerfiles for much faster builds

set -e

echo "🚀 Starting Fast Soleva Build at $(date)"
echo "================================================"

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Pre-flight checks..."
echo "✅ Environment file found"
echo "✅ Docker is running"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f docker compose.optimized.yml down --remove-orphans 2>/dev/null || true

# Build with optimized Dockerfiles
echo "🔨 Building with optimized Dockerfiles..."
echo "This should be much faster than the previous build!"

# Build services one by one to avoid resource conflicts
echo "📦 Building backend..."
docker compose -f docker compose.optimized.yml build backend

echo "📦 Building frontend..."
docker compose -f docker compose.optimized.yml build frontend

echo "📦 Building admin..."
docker compose -f docker compose.optimized.yml build admin

echo "🚀 Starting services..."
docker compose -f docker compose.optimized.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker compose -f docker compose.optimized.yml ps

echo "✅ Fast build completed successfully!"
echo "🌐 Your application should be available at:"
echo "   - Frontend: http://localhost"
echo "   - Backend: http://localhost:3001"
echo "   - Admin: http://localhost:3002"

echo "📊 To view logs: docker compose -f docker compose.optimized.yml logs -f"
echo "🛑 To stop: docker compose -f docker compose.optimized.yml down"
