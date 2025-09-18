#!/bin/bash

# Script to prepare offline build by pre-downloading dependencies
# This helps when network connectivity is unreliable during builds

set -e

echo "📦 Preparing offline build environment..."

# Function to download dependencies for a service
download_dependencies() {
    local service=$1
    local context=$2
    
    echo "📥 Downloading dependencies for $service..."
    
    if [ -f "$context/package.json" ]; then
        cd "$context"
        
        # Create a temporary container to download dependencies and generate Prisma client
        docker run --rm \
            --network=host \
            -v "$(pwd):/app" \
            -w /app \
            node:20-alpine3.19 \
            sh -c "
                npm config set fetch-retry-mintimeout 10000 && \
                npm config set fetch-retry-maxtimeout 60000 && \
                npm config set fetch-retries 5 && \
                npm config set fetch-retry-factor 2 && \
                npm config set fetch-timeout 120000 && \
                npm config set registry https://registry.npmjs.org/ && \
                npm config set prefer-online true && \
                npm config set audit false && \
                npm config set fund false && \
                npm config set maxsockets 15 && \
                npm ci --include=dev --no-audit --no-fund && \
                (if [ -f prisma/schema.prisma ]; then npx prisma generate; fi)
            "
        
        cd - > /dev/null
        echo "✅ Dependencies downloaded for $service"
    else
        echo "⚠️  No package.json found in $context"
    fi
}

# Function to create offline build context
create_offline_context() {
    local service=$1
    local context=$2
    local dockerfile=$3
    
    echo "📁 Creating offline build context for $service..."
    
    # Create offline build directory
    local offline_dir="offline-build/$service"
    mkdir -p "$offline_dir"
    
    # Copy source files
    cp -r "$context"/* "$offline_dir/" 2>/dev/null || true
    
    # Copy Dockerfile
    cp "$dockerfile" "$offline_dir/"
    
    # Download dependencies into the offline context
    download_dependencies "$service" "$offline_dir"
    
    echo "✅ Offline build context created for $service"
}

# Main preparation process
main() {
    echo "🔧 Preparing offline build contexts..."
    
    # Create offline build directories
    mkdir -p offline-build
    
    # Prepare each service
    create_offline_context "backend" "./backend" "./backend/Dockerfile"
    create_offline_context "frontend" "." "./Dockerfile.frontend"
    create_offline_context "admin" "./admin" "./admin/Dockerfile"
    
    echo "✅ Offline build preparation complete!"
    echo "📁 Offline build contexts created in: offline-build/"
    echo "🚀 You can now build with: ./build-offline.sh"
}

# Handle command line arguments
if [ "$1" = "backend" ]; then
    create_offline_context "backend" "./backend" "./backend/Dockerfile"
elif [ "$1" = "frontend" ]; then
    create_offline_context "frontend" "." "./Dockerfile.frontend"
elif [ "$1" = "admin" ]; then
    create_offline_context "admin" "./admin" "./admin/Dockerfile"
else
    main
fi
