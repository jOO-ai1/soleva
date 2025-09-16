#!/bin/bash

# Network Connectivity Test Script for Docker Build Issues
# This script helps diagnose and fix network connectivity problems

set -e

echo "🔍 Testing Network Connectivity for Docker Build..."
echo "=================================================="

# Function to test DNS resolution
test_dns() {
    echo "📡 Testing DNS Resolution..."
    local domains=("registry.npmjs.org" "registry.npmmirror.com" "google.com" "cloudflare.com")
    
    for domain in "${domains[@]}"; do
        echo -n "  Testing $domain: "
        if nslookup "$domain" >/dev/null 2>&1; then
            echo "✅ OK"
        else
            echo "❌ FAILED"
        fi
    done
    echo
}

# Function to test HTTP connectivity
test_http() {
    echo "🌐 Testing HTTP Connectivity..."
    local urls=(
        "https://registry.npmjs.org/"
        "https://registry.npmmirror.com/"
        "https://www.google.com/"
        "https://www.cloudflare.com/"
    )
    
    for url in "${urls[@]}"; do
        echo -n "  Testing $url: "
        if curl -s --connect-timeout 10 --max-time 30 "$url" >/dev/null 2>&1; then
            echo "✅ OK"
        else
            echo "❌ FAILED"
        fi
    done
    echo
}

# Function to test npm registry connectivity
test_npm_registry() {
    echo "📦 Testing NPM Registry Connectivity..."
    
    # Test primary registry
    echo -n "  Testing registry.npmjs.org: "
    if curl -s --connect-timeout 10 --max-time 30 "https://registry.npmjs.org/vite" >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    
    # Test fallback registry
    echo -n "  Testing registry.npmmirror.com: "
    if curl -s --connect-timeout 10 --max-time 30 "https://registry.npmmirror.com/vite" >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    echo
}

# Function to test Docker network connectivity
test_docker_network() {
    echo "🐳 Testing Docker Network Connectivity..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running or not accessible"
        return 1
    fi
    
    # Test DNS resolution inside a container
    echo -n "  Testing DNS resolution in container: "
    if docker run --rm alpine:latest nslookup registry.npmjs.org >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    
    # Test HTTP connectivity inside a container
    echo -n "  Testing HTTP connectivity in container: "
    if docker run --rm alpine:latest wget -q --timeout=10 --tries=1 https://registry.npmjs.org/ -O /dev/null >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    echo
}

# Function to provide network fixes
provide_fixes() {
    echo "🔧 Network Connectivity Fixes:"
    echo "=============================="
    echo
    echo "1. DNS Configuration:"
    echo "   - Add these DNS servers to your system:"
    echo "     - 8.8.8.8 (Google DNS)"
    echo "     - 8.8.4.4 (Google DNS)"
    echo "     - 1.1.1.1 (Cloudflare DNS)"
    echo "     - 1.0.0.1 (Cloudflare DNS)"
    echo
    echo "2. Docker Network Configuration:"
    echo "   - Use the updated Dockerfile.frontend with network resilience"
    echo "   - The Dockerfile now includes:"
    echo "     - Multiple DNS servers"
    echo "     - Registry fallbacks"
    echo "     - Retry logic for npm installs"
    echo "     - Alternative npm registries"
    echo
    echo "3. Alternative NPM Registries:"
    echo "   - Primary: https://registry.npmjs.org/"
    echo "   - Fallback: https://registry.npmmirror.com/"
    echo "   - Chinese mirror: https://registry.npm.taobao.org/"
    echo
    echo "4. Build with Network Resilience:"
    echo "   docker build -f Dockerfile.frontend --target build ."
    echo
    echo "5. If issues persist, try building with different network settings:"
    echo "   docker build --network=host -f Dockerfile.frontend --target build ."
    echo
}

# Function to test the actual Docker build
test_docker_build() {
    echo "🏗️  Testing Docker Build with Network Resilience..."
    echo "=================================================="
    
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        return 1
    fi
    
    echo "Building frontend with network-resilient configuration..."
    if docker build -f Dockerfile.frontend --target build .; then
        echo "✅ Docker build successful!"
    else
        echo "❌ Docker build failed. Check the output above for details."
        echo
        echo "Try these additional fixes:"
        echo "1. Restart Docker daemon: sudo systemctl restart docker"
        echo "2. Clear Docker build cache: docker builder prune -a"
        echo "3. Use host network: docker build --network=host -f Dockerfile.frontend --target build ."
        return 1
    fi
}

# Main execution
main() {
    echo "Starting network connectivity tests..."
    echo
    
    # Run all tests
    test_dns
    test_http
    test_npm_registry
    test_docker_network
    
    # Provide fixes
    provide_fixes
    
    # Ask if user wants to test Docker build
    echo "Would you like to test the Docker build now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        test_docker_build
    else
        echo "Skipping Docker build test."
    fi
    
    echo
    echo "🎉 Network connectivity test completed!"
    echo "If you're still experiencing issues, try the fixes listed above."
}

# Run main function
main "$@"
