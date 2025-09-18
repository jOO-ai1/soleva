#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# DEPRECATED: This script is deprecated. Use ./deploy.sh instead.
# =============================================================================
# Soleva E-commerce Platform - Production Deployment Script with Fallback
# This script attempts deployment with Alpine images first, then falls back
# to Debian images if Alpine package repository issues occur.
# 
# WARNING: This script is deprecated and will be removed in future versions.
# Please use the new ./deploy.sh script for all deployments.
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

# Function to test Alpine build
test_alpine_build() {
    log_info "Testing Alpine-based build..."
    
    # Test backend build with timeout
    local build_output
    if build_output=$($COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" build --no-cache backend 2>&1); then
        log_success "Alpine backend build successful"
        return 0
    else
        # Check for specific Alpine repository errors
        if echo "$build_output" | grep -q "temporary error\|repository.*not.*found\|package.*not.*found\|apk.*failed\|fetch.*failed"; then
            log_warning "Alpine backend build failed - package repository issues detected"
            return 1
        else
            log_warning "Alpine backend build failed for other reasons"
            return 1
        fi
    fi
}

# Function to deploy with Alpine
deploy_alpine() {
    log_info "🚀 Starting deployment with Alpine images..."
    
    # Source the original deploy script
    if [ -f "$SCRIPT_DIR/deploy.sh" ]; then
        log_info "Using original deploy.sh with Alpine images"
        bash "$SCRIPT_DIR/deploy.sh"
    else
        log_error "Original deploy.sh not found"
        exit 1
    fi
}

# Function to deploy with Debian fallback
deploy_debian() {
    log_info "🔄 Falling back to Debian-based images..."
    
    # Create a temporary deploy script for Debian
    cat > "$SCRIPT_DIR/deploy-debian-temp.sh" << 'EOF'
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

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    if ! command -v docker-compose >/dev/null; then
        log_error "Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
    export COMPOSE_CMD="docker-compose"
else
    export COMPOSE_CMD="docker compose"
fi

# Main deployment function for Debian
main() {
    log_info "🚀 Starting Soleva production deployment with Debian images at $(date -Is)"
    
    # 1. Pre-flight checks
    log_info "📋 Running pre-flight checks..."
    check_prerequisites
    
    # 2. Environment validation
    log_info "🔍 Validating environment configuration..."
    validate_environment
    
    # 3. Create necessary directories
    log_info "📁 Creating necessary directories..."
    create_directories
    
    # 4. Pull and build images
    log_info "🔨 Building Docker images with Debian base..."
    build_images
    
    # 5. Start infrastructure services
    log_info "🗄️ Starting infrastructure services..."
    start_infrastructure
    
    # 6. Run database migrations
    log_info "📊 Running database migrations..."
    run_migrations
    
    # 7. Start application services
    log_info "🚀 Starting application services..."
    start_application_services
    
    # 8. Health checks and warm-up
    log_info "🏥 Performing health checks..."
    perform_health_checks
    
    # 9. SSL certificate management
    log_info "🔒 Managing SSL certificates..."
    manage_ssl_certificates
    
    # 10. Final validation
    log_info "✅ Performing final validation..."
    final_validation
    
    log_success "🎉 Deployment completed successfully with Debian images at $(date -Is)"
}

# Include all the functions from the original deploy.sh
# (This would be the same functions as in deploy.sh but using docker-compose.prod.debian.yml)
check_prerequisites() {
    log_info "Checking Docker installation..."
    command -v docker >/dev/null || { log_error "Docker is not installed"; exit 1; }
    
    log_info "Checking Docker Compose..."
    if ! docker compose version >/dev/null 2>&1; then
        if ! command -v docker-compose >/dev/null; then
            log_error "Neither 'docker compose' nor 'docker-compose' is available"; exit 1; 
        fi
        export COMPOSE_CMD="docker-compose"
    else
        export COMPOSE_CMD="docker compose"
    fi
    
    log_info "Checking disk space..."
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_error "Disk usage is above 90% (${disk_usage}%)"
        exit 1
    fi
    
    log_info "Checking Docker daemon..."
    docker info >/dev/null 2>&1 || { log_error "Docker daemon is not running"; exit 1; }
    
    log_success "All prerequisites checks passed"
}

validate_environment() {
    local env_file=".env.production"
    
    if [ ! -f "$env_file" ]; then
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        local script_env_file="$script_dir/.env.production"
        
        if [ -f "$script_env_file" ]; then
            env_file="$script_env_file"
            log_info "Found environment file at: $env_file"
        else
            log_error "Environment file $env_file not found"
            exit 1
        fi
    fi
    
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        export "$line"
    done < "$env_file"
    set +a
    
    local required_vars=(
        "NODE_ENV"
        "DOMAIN"
        "POSTGRES_USER" 
        "POSTGRES_PASSWORD"
        "POSTGRES_DB"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "VITE_API_URL"
        "ADMIN_EMAIL"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    log_success "Environment validation passed"
}

create_directories() {
    local dirs=(
        "docker/nginx/ssl"
        "docker/nginx/certbot-webroot"
        "backend/uploads"
        "backend/logs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done
    
    log_success "All directories created"
}

build_images() {
    log_info "Pulling base images..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" pull || true
    
    log_info "Building application images with Debian base..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Build attempt $attempt/$max_attempts..."
        
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" build --no-cache --parallel; then
            log_success "All images built successfully with Debian base"
            return 0
        else
            log_warning "Build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log_info "Waiting 30 seconds before retry..."
                sleep 30
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "All build attempts failed"
    exit 1
}

start_infrastructure() {
    log_info "Starting PostgreSQL and Redis..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" up -d postgres redis
    
    log_info "Waiting for infrastructure services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps postgres | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps redis | grep -q "healthy"; then
            log_success "Infrastructure services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for infrastructure services... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    log_error "Infrastructure services failed to become healthy"
    exit 1
}

run_migrations() {
    log_info "Running database migrations..."
    
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" run --rm backend npx prisma generate
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" run --rm backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

start_application_services() {
    log_info "Starting backend service..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" up -d backend
    
    log_info "Waiting for backend to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps backend | grep -q "healthy"; then
            log_success "Backend is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to become healthy"
        exit 1
    fi
    
    log_info "Starting frontend and admin services..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" up -d frontend admin
    
    log_info "Waiting for frontend and admin to be healthy..."
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps frontend | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps admin | grep -q "healthy"; then
            log_success "Frontend and admin are healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for frontend and admin... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Frontend or admin failed to become healthy"
        exit 1
    fi
    
    log_info "Starting Nginx reverse proxy..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" up -d nginx
    
    log_success "All application services started"
}

perform_health_checks() {
    log_info "Performing comprehensive health checks..."
    
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
    
    log_success "All health checks passed"
}

manage_ssl_certificates() {
    log_info "SSL certificate management skipped in fallback mode"
    log_warning "Please configure SSL certificates manually after deployment"
}

final_validation() {
    log_info "Performing final validation..."
    
    local services=("postgres" "redis" "backend" "frontend" "admin" "nginx")
    for service in "${services[@]}"; do
        if ! $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.debian.yml" ps "$service" | grep -q "Up"; then
            log_error "Service $service is not running"
            exit 1
        fi
    done
    
    log_success "Final validation completed"
}

# Run main function
main "$@"
EOF

    chmod +x "$SCRIPT_DIR/deploy-debian-temp.sh"
    
    # Run the Debian deployment
    bash "$SCRIPT_DIR/deploy-debian-temp.sh"
    
    # Clean up temporary script
    rm -f "$SCRIPT_DIR/deploy-debian-temp.sh"
}

# Main execution
main() {
    log_info "🚀 Starting Soleva deployment with automatic fallback at $(date -Is)"
    
    # First, try to test if Alpine builds work
    if test_alpine_build; then
        log_success "Alpine build test passed - proceeding with Alpine deployment"
        deploy_alpine
    else
        log_warning "Alpine build test failed - switching to Debian fallback"
        deploy_debian
    fi
    
    log_success "🎉 Deployment completed successfully at $(date -Is)"
}

# Run main function
main "$@"
