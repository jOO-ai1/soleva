#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# Soleva E-commerce Platform - Simple Deployment Script
# =============================================================================
# This script provides a simple deployment without complex DNS configuration
# =============================================================================

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

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    if ! command -v docker-compose >/dev/null; then
        log_error "Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
    log_info "Using Docker Compose v1 (docker-compose)"
    export COMPOSE_CMD="docker-compose"
else
    log_info "Using Docker Compose v2 (docker compose)"
    export COMPOSE_CMD="docker compose"
fi

# Network connectivity test function
test_network_connectivity() {
    log_info "🔍 Testing network connectivity..."
    
    local test_urls=(
        "http://registry.npmjs.org"
        "http://github.com"
    )
    
    local failed_urls=()
    
    for url in "${test_urls[@]}"; do
        if curl -s --connect-timeout 10 --max-time 30 "$url" >/dev/null 2>&1; then
            log_success "✓ $url is reachable"
        else
            log_warning "✗ $url is not reachable"
            failed_urls+=("$url")
        fi
    done
    
    if [ ${#failed_urls[@]} -gt 0 ]; then
        log_warning "Network connectivity issues detected for: ${failed_urls[*]}"
        return 1
    else
        log_success "All network connectivity tests passed"
        return 0
    fi
}

# Simple build function
build_simple() {
    log_info "🔨 Building Docker images..."
    
    # Set Docker build arguments for better network handling
    if docker buildx version >/dev/null 2>&1; then
        export DOCKER_BUILDKIT=1
        export BUILDKIT_PROGRESS=plain
        export COMPOSE_DOCKER_CLI_BUILD=1
        log_info "Using BuildKit for Docker builds"
    else
        export DOCKER_BUILDKIT=0
        log_info "Using legacy Docker builder (buildx not available)"
    fi
    
    # Build with retry logic
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Build attempt $attempt/$max_attempts..."
        
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" build --parallel; then
            log_success "All images built successfully"
            return 0
        else
            log_warning "Build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                local wait_time=$((attempt * 30))
                log_info "Waiting $wait_time seconds before retry..."
                sleep $wait_time
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "All build attempts failed"
    return 1
}

# Main deployment function
main() {
    log_info "🚀 Starting Soleva simple deployment at $(date -Is)"
    
    # 1. Test network connectivity
    if ! test_network_connectivity; then
        log_warning "Network connectivity issues detected, but proceeding"
    fi
    
    # 2. Build images
    if ! build_simple; then
        log_error "Failed to build images"
        exit 1
    fi
    
    # 3. Deploy using the standard configuration
    log_info "🚀 Starting deployment..."
    
    # Start infrastructure services
    log_info "🗄️ Starting infrastructure services..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d postgres redis
    
    # Wait for infrastructure
    log_info "⏳ Waiting for infrastructure services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" ps postgres | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" ps redis | grep -q "healthy"; then
            log_success "Infrastructure services are healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for infrastructure services... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Infrastructure services failed to become healthy"
        exit 1
    fi
    
    # Run migrations
    log_info "📊 Running database migrations..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" run --rm backend npx prisma generate
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" run --rm backend npx prisma migrate deploy
    
    # Start application services
    log_info "🚀 Starting application services..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d
    
    # Health checks
    log_info "🏥 Performing health checks..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost:3001/health" >/dev/null 2>&1; then
            log_success "Backend health check passed"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Backend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost" >/dev/null 2>&1; then
            log_success "Frontend health check passed"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Frontend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "🎉 Deployment completed successfully at $(date -Is)"
    log_info "🔗 Application is available at: http://localhost"
    log_info "🔗 Admin panel is available at: http://localhost/admin"
    log_info "🔗 API is available at: http://localhost:3001"
}

# Run main function
main "$@"
