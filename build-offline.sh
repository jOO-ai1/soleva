#!/bin/bash

# Offline build script that uses pre-downloaded dependencies
# This script builds services without requiring network access during build

set -e

echo "🏗️  Starting offline build process..."

# Function to build service offline
build_offline() {
    local service=$1
    local offline_dir="offline-build/$service"
    
    if [ ! -d "$offline_dir" ]; then
        echo "❌ Offline build context not found for $service"
        echo "💡 Run ./prepare-offline-build.sh first"
        exit 1
    fi
    
    echo "📦 Building $service from offline context..."
    
    cd "$offline_dir"
    
    # Build with offline dependencies
    docker build \
        --network=host \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --no-cache \
        -t "solevaeg-$service" \
        .
    
    cd - > /dev/null
    
    echo "✅ $service built successfully from offline context"
}

# Function to build all services offline
build_all_offline() {
    echo "🔧 Building all services from offline contexts..."
    
    # Build services in order
    build_offline "backend"
    build_offline "frontend"
    build_offline "admin"
    
    echo "✅ All services built successfully from offline contexts!"
    echo "🚀 You can now run: docker-compose up"
}

# Function to check offline contexts
check_offline_contexts() {
    echo "🔍 Checking offline build contexts..."
    
    local missing_contexts=()
    
    if [ ! -d "offline-build/backend" ]; then
        missing_contexts+=("backend")
    fi
    
    if [ ! -d "offline-build/frontend" ]; then
        missing_contexts+=("frontend")
    fi
    
    if [ ! -d "offline-build/admin" ]; then
        missing_contexts+=("admin")
    fi
    
    if [ ${#missing_contexts[@]} -eq 0 ]; then
        echo "✅ All offline build contexts are available"
        return 0
    else
        echo "❌ Missing offline build contexts: ${missing_contexts[*]}"
        echo "💡 Run: ./prepare-offline-build.sh"
        return 1
    fi
}

# Main build process
main() {
    # Check if offline contexts exist
    if ! check_offline_contexts; then
        exit 1
    fi
    
    # Build all services
    build_all_offline
}

# Handle command line arguments
if [ "$1" = "check" ]; then
    check_offline_contexts
elif [ "$1" = "backend" ]; then
    build_offline "backend"
elif [ "$1" = "frontend" ]; then
    build_offline "frontend"
elif [ "$1" = "admin" ]; then
    build_offline "admin"
else
    main
fi
