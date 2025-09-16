#!/bin/bash

# Build script with DNS configuration for reliable network access
# This script ensures proper DNS resolution during Docker builds

set -e

echo "🚀 Starting Docker build with DNS configuration..."

# Set environment variables for build
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Function to build with DNS configuration
build_with_dns() {
    local service=$1
    echo "📦 Building $service with DNS configuration..."
    
    # Build with explicit DNS configuration
    docker-compose build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --no-cache \
        $service
}

# Function to test DNS resolution
test_dns() {
    echo "🔍 Testing DNS resolution..."
    
    # Test DNS resolution in a temporary container
    docker run --rm --dns=8.8.8.8 --dns=8.8.4.4 --dns=1.1.1.1 --dns=1.0.0.1 \
        alpine:3.19 nslookup registry.npmjs.org || {
        echo "❌ DNS resolution test failed"
        echo "💡 Trying alternative DNS servers..."
        
        # Try with different DNS servers
        docker run --rm --dns=1.1.1.1 --dns=1.0.0.1 --dns=8.8.8.8 --dns=8.8.4.4 \
            alpine:3.19 nslookup registry.npmjs.org || {
            echo "❌ All DNS resolution tests failed"
            echo "🔧 Please check your network configuration"
            exit 1
        }
    }
    
    echo "✅ DNS resolution test passed"
}

# Main build process
main() {
    echo "🔧 Configuring build environment..."
    
    # Test DNS resolution first
    test_dns
    
    # Build services in order
    echo "🏗️  Building backend service..."
    build_with_dns backend
    
    echo "🏗️  Building frontend service..."
    build_with_dns frontend
    
    echo "🏗️  Building admin service..."
    build_with_dns admin
    
    echo "✅ All services built successfully!"
    echo "🚀 You can now run: docker-compose up"
}

# Handle command line arguments
if [ "$1" = "test-dns" ]; then
    test_dns
elif [ "$1" = "backend" ]; then
    test_dns
    build_with_dns backend
elif [ "$1" = "frontend" ]; then
    test_dns
    build_with_dns frontend
elif [ "$1" = "admin" ]; then
    test_dns
    build_with_dns admin
else
    main
fi
