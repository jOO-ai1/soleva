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

# Test Docker build for each service with retry logic
test_docker_build() {
    log_info "🧪 Testing Docker builds with Alpine repository and npm fixes..."
    
    # Test backend build with retry and extended timeout
    log_info "Testing backend Docker build with aggressive npm fixes..."
    local max_attempts=2
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Backend build attempt $attempt/$max_attempts (this may take 15-20 minutes)..."
        if timeout 1800 docker build -f backend/Dockerfile --target production backend/ -t test-backend:latest; then
            log_success "Backend build successful"
            break
        else
            log_warning "Backend build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log_info "Waiting 60 seconds before retry..."
                sleep 60
            else
                log_error "Backend build failed after $max_attempts attempts"
                return 1
            fi
        fi
        attempt=$((attempt + 1))
    done
    
    # Test frontend build with retry and extended timeout
    log_info "Testing frontend Docker build with aggressive npm fixes..."
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Frontend build attempt $attempt/$max_attempts (this may take 10-15 minutes)..."
        if timeout 1200 docker build -f Dockerfile.frontend --target production . -t test-frontend:latest; then
            log_success "Frontend build successful"
            break
        else
            log_warning "Frontend build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log_info "Waiting 60 seconds before retry..."
                sleep 60
            else
                log_error "Frontend build failed after $max_attempts attempts"
                return 1
            fi
        fi
        attempt=$((attempt + 1))
    done
    
    # Test admin build with retry and extended timeout
    log_info "Testing admin Docker build with aggressive npm fixes..."
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Admin build attempt $attempt/$max_attempts (this may take 10-15 minutes)..."
        if timeout 1200 docker build -f admin/Dockerfile --target production admin/ -t test-admin:latest; then
            log_success "Admin build successful"
            break
        else
            log_warning "Admin build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log_info "Waiting 60 seconds before retry..."
                sleep 60
            else
                log_error "Admin build failed after $max_attempts attempts"
                return 1
            fi
        fi
        attempt=$((attempt + 1))
    done
    
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
