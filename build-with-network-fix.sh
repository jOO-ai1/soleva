#!/bin/bash

# Build Script with Network Connectivity Fixes
# This script builds the frontend with various network resilience strategies

set -e

echo "🚀 Building Frontend with Network Connectivity Fixes"
echo "===================================================="

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

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to clean up previous builds
cleanup_builds() {
    print_status "Cleaning up previous builds..."
    docker builder prune -f >/dev/null 2>&1 || true
    docker system prune -f >/dev/null 2>&1 || true
    print_success "Build cache cleaned"
}

# Function to test network connectivity
test_network() {
    print_status "Testing network connectivity..."
    
    # Test DNS resolution
    if ! nslookup registry.npmjs.org >/dev/null 2>&1; then
        print_warning "DNS resolution for registry.npmjs.org failed"
        return 1
    fi
    
    # Test HTTP connectivity
    if ! curl -s --connect-timeout 10 --max-time 30 https://registry.npmjs.org/ >/dev/null 2>&1; then
        print_warning "HTTP connectivity to registry.npmjs.org failed"
        return 1
    fi
    
    print_success "Network connectivity test passed"
    return 0
}

# Function to build with standard network
build_standard() {
    print_status "Building with standard network configuration..."
    if docker build -f Dockerfile.frontend --target build .; then
        print_success "Standard build completed successfully"
        return 0
    else
        print_error "Standard build failed"
        return 1
    fi
}

# Function to build with host network
build_host_network() {
    print_status "Building with host network (bypasses Docker networking)..."
    if docker build --network=host -f Dockerfile.frontend --target build .; then
        print_success "Host network build completed successfully"
        return 0
    else
        print_error "Host network build failed"
        return 1
    fi
}

# Function to build with custom DNS
build_custom_dns() {
    print_status "Building with custom DNS configuration..."
    if docker build --dns=8.8.8.8 --dns=8.8.4.4 --dns=1.1.1.1 -f Dockerfile.frontend --target build .; then
        print_success "Custom DNS build completed successfully"
        return 0
    else
        print_error "Custom DNS build failed"
        return 1
    fi
}

# Function to build with network-resilient Dockerfile
build_network_resilient() {
    print_status "Building with network-resilient Dockerfile..."
    if docker build -f Dockerfile.frontend.network-resilient --target build .; then
        print_success "Network-resilient build completed successfully"
        return 0
    else
        print_error "Network-resilient build failed"
        return 1
    fi
}

# Function to build with Debian-based image
build_debian() {
    print_status "Building with Debian-based Dockerfile..."
    if docker build -f Dockerfile.frontend.debian --target build .; then
        print_success "Debian-based build completed successfully"
        return 0
    else
        print_error "Debian-based build failed"
        return 1
    fi
}

# Function to provide troubleshooting tips
provide_troubleshooting() {
    echo
    print_warning "All build methods failed. Here are some troubleshooting steps:"
    echo
    echo "1. Check your internet connection:"
    echo "   - Test: curl -I https://registry.npmjs.org/"
    echo "   - Test: nslookup registry.npmjs.org"
    echo
    echo "2. Check Docker network configuration:"
    echo "   - Restart Docker: sudo systemctl restart docker"
    echo "   - Check Docker networks: docker network ls"
    echo
    echo "3. Try alternative npm registries:"
    echo "   - Edit .npmrc to use: registry=https://registry.npmmirror.com/"
    echo
    echo "4. Check firewall settings:"
    echo "   - Ensure ports 80, 443 are not blocked"
    echo "   - Check if corporate firewall is blocking npm registry"
    echo
    echo "5. Try building on a different network:"
    echo "   - Use mobile hotspot or different WiFi"
    echo
    echo "6. Use the network connectivity test script:"
    echo "   - Run: ./test-network-connectivity.sh"
    echo
}

# Main build function
main() {
    echo "Starting build process..."
    echo
    
    # Check prerequisites
    check_docker
    
    # Clean up previous builds
    cleanup_builds
    
    # Test network connectivity
    if test_network; then
        print_status "Network connectivity is good, trying standard build first..."
        if build_standard; then
            print_success "Build completed successfully with standard configuration!"
            exit 0
        fi
    fi
    
    print_warning "Standard build failed or network issues detected. Trying alternative methods..."
    echo
    
    # Try alternative build methods
    build_methods=(
        "build_host_network"
        "build_custom_dns"
        "build_network_resilient"
        "build_debian"
    )
    
    for method in "${build_methods[@]}"; do
        print_status "Trying $method..."
        if $method; then
            print_success "Build completed successfully with $method!"
            exit 0
        fi
        echo
    done
    
    # If all methods failed
    print_error "All build methods failed!"
    provide_troubleshooting
    exit 1
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --clean        Clean build cache before building"
        echo "  --test         Test network connectivity only"
        echo "  --standard     Use standard build method only"
        echo "  --host         Use host network build method only"
        echo "  --dns          Use custom DNS build method only"
        echo "  --resilient    Use network-resilient build method only"
        echo "  --debian       Use Debian-based build method only"
        echo
        exit 0
        ;;
    --clean)
        cleanup_builds
        ;;
    --test)
        test_network
        exit $?
        ;;
    --standard)
        check_docker
        build_standard
        exit $?
        ;;
    --host)
        check_docker
        build_host_network
        exit $?
        ;;
    --dns)
        check_docker
        build_custom_dns
        exit $?
        ;;
    --resilient)
        check_docker
        build_network_resilient
        exit $?
        ;;
    --debian)
        check_docker
        build_debian
        exit $?
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
