#!/usr/bin/env bash
set -Eeuo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test Docker build for each service
test_docker_build() {
    log_info "🧪 Testing Docker builds with Alpine repository fixes..."
    
    # Test backend build
    log_info "Testing backend Docker build..."
    if docker build -f backend/Dockerfile --target production backend/ -t test-backend:latest; then
        log_success "Backend build successful"
    else
        log_error "Backend build failed"
        return 1
    fi
    
    # Test frontend build
    log_info "Testing frontend Docker build..."
    if docker build -f Dockerfile.frontend --target production . -t test-frontend:latest; then
        log_success "Frontend build successful"
    else
        log_error "Frontend build failed"
        return 1
    fi
    
    # Test admin build
    log_info "Testing admin Docker build..."
    if docker build -f admin/Dockerfile --target production admin/ -t test-admin:latest; then
        log_success "Admin build successful"
    else
        log_error "Admin build failed"
        return 1
    fi
    
    log_success "🎉 All Docker builds completed successfully!"
    
    # Clean up test images
    log_info "Cleaning up test images..."
    docker rmi test-backend:latest test-frontend:latest test-admin:latest 2>/dev/null || true
    
    return 0
}

# Main execution
main() {
    log_info "Starting Docker build test at $(date -Is)"
    
    if test_docker_build; then
        log_success "✅ Docker build test passed! You can now run ./deploy.sh"
    else
        log_error "❌ Docker build test failed. Please check the errors above."
        exit 1
    fi
}

main "$@"
