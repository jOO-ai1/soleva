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

# Test only backend build with aggressive fixes
test_backend_build() {
    log_info "🧪 Testing backend Docker build with aggressive npm fixes..."
    log_info "This test will take 15-20 minutes due to npm retry strategies..."
    
    local max_attempts=1
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Backend build attempt $attempt/$max_attempts..."
        log_info "Starting build at $(date -Is)"
        
        if timeout 1800 docker build -f backend/Dockerfile --target production backend/ -t test-backend:latest; then
            log_success "Backend build successful at $(date -Is)"
            break
        else
            log_error "Backend build failed at $(date -Is)"
            return 1
        fi
        attempt=$((attempt + 1))
    done
    
    log_success "🎉 Backend Docker build completed successfully!"
    
    # Clean up test image
    log_info "Cleaning up test image..."
    docker rmi test-backend:latest 2>/dev/null || true
    
    return 0
}

# Main execution
main() {
    log_info "Starting backend-only Docker build test at $(date -Is)"
    
    if test_backend_build; then
        log_success "✅ Backend build test passed! The aggressive npm fixes are working."
        log_info "You can now run the full test with: ./test-docker-build.sh"
        log_info "Or proceed directly to deployment with: ./deploy.sh"
    else
        log_error "❌ Backend build test failed. The npm issues persist."
        log_info "Consider checking network connectivity or trying at a different time."
        exit 1
    fi
}

main "$@"
