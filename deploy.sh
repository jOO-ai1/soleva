#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# Soleva E-commerce Platform - Full Clean Production Deployment Script
# =============================================================================
# This script performs a complete clean deployment from scratch:
# - Stops and removes all existing services, containers, images, and volumes
# - Clears all caches and installed packages
# - Validates environment configuration
# - Reinstalls dependencies and builds all services
# - Deploys with fresh Docker images
# - Performs comprehensive health checks
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

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

# Set script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

# Global variables
LOG_FILE="deployment-$(date +%Y%m%d_%H%M%S).log"
SPACE_FREED=0
SERVICES_STARTED=0
HEALTH_CHECKS_PASSED=0

# Function to log all output
log_output() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get Docker Compose command
get_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command_exists docker-compose; then
        echo "docker-compose"
    else
        log_error "Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
}

# =============================================================================
# STEP 1: STOP & REMOVE EXISTING SERVICES
# =============================================================================
stop_and_remove_services() {
    log_header "STEP 1: STOPPING & REMOVING EXISTING SERVICES"
    
    local COMPOSE_CMD=$(get_compose_cmd)
    
    log_step "Stopping all running containers..."
    $COMPOSE_CMD -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.staging.yml down --remove-orphans 2>/dev/null || true
    
    log_step "Removing all project-related containers..."
    docker ps -a --filter "name=solevaeg" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
    
    log_step "Removing all project-related images..."
    docker images --filter "reference=*solevaeg*" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi -f 2>/dev/null || true
    
    log_step "Removing all project-related volumes..."
    docker volume ls --filter "name=solevaeg" --format "{{.Name}}" | xargs -r docker volume rm -f 2>/dev/null || true
    
    log_step "Removing all project-related networks..."
    docker network ls --filter "name=solevaeg" --format "{{.Name}}" | xargs -r docker network rm 2>/dev/null || true
    
    log_step "Running Docker system prune to free all unused space..."
    local space_before=$(df -h / | awk 'NR==2 {print $4}')
    docker system prune -af --volumes
    local space_after=$(df -h / | awk 'NR==2 {print $4}')
    
    log_success "Docker cleanup completed"
    log_info "Space before: $space_before"
    log_info "Space after: $space_after"
    
    log_output "STEP 1: Services stopped and removed successfully"
}

# =============================================================================
# STEP 2: CLEAR PROJECT CACHES & INSTALLED PACKAGES
# =============================================================================
clear_caches_and_packages() {
    log_header "STEP 2: CLEARING PROJECT CACHES & INSTALLED PACKAGES"
    
    log_step "Removing node_modules directories..."
    find "$PROJECT_ROOT" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log_step "Removing build artifacts..."
    find "$PROJECT_ROOT" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name ".vite" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log_step "Removing lock files for fresh installs..."
    find "$PROJECT_ROOT" -name "package-lock.json" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "yarn.lock" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "pnpm-lock.yaml" -type f -delete 2>/dev/null || true
    
    log_step "Removing temporary files..."
    find "$PROJECT_ROOT" -name "*.tmp" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.log" -type f -delete 2>/dev/null || true
    
    log_success "All caches and packages cleared"
    log_output "STEP 2: Caches and packages cleared successfully"
}

# =============================================================================
# STEP 3: VALIDATE ENVIRONMENT
# =============================================================================
validate_environment() {
    log_header "STEP 3: VALIDATING ENVIRONMENT CONFIGURATION"
    
    local env_file=".env.production"
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file $env_file not found"
        exit 1
    fi
    
    log_step "Loading environment variables..."
    set -a
    source "$env_file"
    set +a
    
    log_step "Validating required environment variables..."
    local required_vars=(
        "NODE_ENV"
        "DOMAIN"
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "VITE_API_URL"
        "ADMIN_EMAIL"
        "SMTP_HOST"
        "SMTP_USER"
        "SMTP_PASS"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}" | sed 's/^/  - /'
        exit 1
    fi
    
    log_step "Validating database connection string..."
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
        log_error "Invalid DATABASE_URL format"
        exit 1
    fi
    
    log_step "Validating Redis connection string..."
    if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
        log_error "Invalid REDIS_URL format"
        exit 1
    fi
    
    log_success "Environment validation passed"
    log_output "STEP 3: Environment validation completed successfully"
}

# =============================================================================
# STEP 4: REINSTALL & BUILD
# =============================================================================
reinstall_and_build() {
    log_header "STEP 4: REINSTALLING DEPENDENCIES & BUILDING SERVICES"
    
    # Backend
    log_step "Installing backend dependencies..."
    cd "$PROJECT_ROOT/backend"
    if [ -f "package-lock.json" ]; then
        npm ci --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi
    log_success "Backend dependencies installed"
    
    log_step "Generating Prisma client..."
    npx prisma generate
    log_success "Prisma client generated"
    
    log_step "Building backend (TypeScript compilation)..."
    npm run build
    log_success "Backend built successfully"
    
    # Frontend
    log_step "Installing frontend dependencies..."
    cd "$PROJECT_ROOT"
    if [ -f "package-lock.json" ]; then
        npm ci --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi
    log_success "Frontend dependencies installed"
    
    log_step "Building frontend for production..."
    npm run build
    log_success "Frontend built successfully"
    
    # Admin
    log_step "Installing admin dependencies..."
    cd "$PROJECT_ROOT/admin"
    if [ -f "package-lock.json" ]; then
        npm ci --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi
    log_success "Admin dependencies installed"
    
    log_step "Building admin for production..."
    npm run build
    log_success "Admin built successfully"
    
    # Return to project root
    cd "$PROJECT_ROOT"
    
    log_success "All services built successfully"
    log_output "STEP 4: Dependencies installed and services built successfully"
}

# =============================================================================
# STEP 5: REBUILD DOCKER IMAGES
# =============================================================================
rebuild_docker_images() {
    log_header "STEP 5: REBUILDING DOCKER IMAGES"
    
    local COMPOSE_CMD=$(get_compose_cmd)
    
    log_step "Building all service images with --no-cache..."
    $COMPOSE_CMD -f docker-compose.prod.yml build --no-cache --parallel
    
    log_success "All Docker images rebuilt successfully"
    log_output "STEP 5: Docker images rebuilt successfully"
}

# =============================================================================
# STEP 6: DEPLOY SERVICES
# =============================================================================
deploy_services() {
    log_header "STEP 6: DEPLOYING SERVICES"
    
    local COMPOSE_CMD=$(get_compose_cmd)
    
    log_step "Starting infrastructure services..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d postgres redis
    
    log_step "Waiting for infrastructure services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f docker-compose.prod.yml ps postgres | grep -q "healthy" && \
           $COMPOSE_CMD -f docker-compose.prod.yml ps redis | grep -q "healthy"; then
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
    
    log_step "Running database migrations..."
    $COMPOSE_CMD -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    log_success "Database migrations completed"
    
    log_step "Starting backend service..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d backend
    
    log_step "Waiting for backend to be healthy..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f docker-compose.prod.yml ps backend | grep -q "healthy"; then
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
    
    log_step "Starting frontend and admin services..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d frontend admin
    
    log_step "Waiting for frontend and admin to be healthy..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f docker-compose.prod.yml ps frontend | grep -q "healthy" && \
           $COMPOSE_CMD -f docker-compose.prod.yml ps admin | grep -q "healthy"; then
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
    
    log_step "Starting Nginx reverse proxy..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d nginx
    
    log_success "All services deployed successfully"
    SERVICES_STARTED=1
    log_output "STEP 6: Services deployed successfully"
}

# =============================================================================
# STEP 7: HEALTH CHECKS
# =============================================================================
perform_health_checks() {
    log_header "STEP 7: PERFORMING COMPREHENSIVE HEALTH CHECKS"
    
    local max_attempts=30
    local attempt=0
    local checks_passed=0
    local total_checks=5
    
    # Backend API Health Check
    log_step "Testing backend API health..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost:3001/health" >/dev/null 2>&1; then
            log_success "✅ Backend API health check passed"
            checks_passed=$((checks_passed + 1))
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Backend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "❌ Backend API health check failed"
    fi
    
    # Frontend Health Check
    log_step "Testing frontend accessibility..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost" >/dev/null 2>&1; then
            log_success "✅ Frontend health check passed"
            checks_passed=$((checks_passed + 1))
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Frontend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "❌ Frontend health check failed"
    fi
    
    # Admin Panel Health Check
    log_step "Testing admin panel accessibility..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost:3002" >/dev/null 2>&1; then
            log_success "✅ Admin panel health check passed"
            checks_passed=$((checks_passed + 1))
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Admin health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "❌ Admin panel health check failed"
    fi
    
    # Static Assets Health Check
    log_step "Testing static assets accessibility..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost/assets/" >/dev/null 2>&1; then
            log_success "✅ Static assets health check passed"
            checks_passed=$((checks_passed + 1))
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Static assets health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_warning "⚠️ Static assets health check failed"
    else
        checks_passed=$((checks_passed + 1))
    fi
    
    # Database Connectivity Check
    log_step "Testing database connectivity..."
    local COMPOSE_CMD=$(get_compose_cmd)
    if $COMPOSE_CMD -f docker-compose.prod.yml exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        log_success "✅ Database connectivity check passed"
        checks_passed=$((checks_passed + 1))
    else
        log_error "❌ Database connectivity check failed"
    fi
    
    HEALTH_CHECKS_PASSED=$checks_passed
    log_info "Health checks completed: $checks_passed/$total_checks passed"
    log_output "STEP 7: Health checks completed - $checks_passed/$total_checks passed"
}

# =============================================================================
# STEP 8: POST-DEPLOY
# =============================================================================
post_deploy() {
    log_header "STEP 8: POST-DEPLOYMENT TASKS"
    
    local COMPOSE_CMD=$(get_compose_cmd)
    
    log_step "Reloading Nginx configuration..."
    $COMPOSE_CMD -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || true
    
    log_step "Clearing Nginx cache..."
    $COMPOSE_CMD -f docker-compose.prod.yml exec nginx find /var/cache/nginx -type f -delete 2>/dev/null || true
    
    log_success "Post-deployment tasks completed"
    log_output "STEP 8: Post-deployment tasks completed successfully"
}

# =============================================================================
# STEP 9: DEPLOYMENT SUMMARY
# =============================================================================
deployment_summary() {
    log_header "DEPLOYMENT SUMMARY"
    
    local COMPOSE_CMD=$(get_compose_cmd)
    
    log_info "📊 Deployment Statistics:"
    log_info "• Space freed: Caches and temporary files cleaned"
    log_info "• Services started: $SERVICES_STARTED"
    log_info "• Health checks passed: $HEALTH_CHECKS_PASSED/5"
    
    echo ""
    log_info "🌐 Service URLs:"
    log_info "• Frontend: http://localhost/"
    log_info "• Backend API: http://localhost:3001/"
    log_info "• Admin Panel: http://localhost:3002/"
    log_info "• Health Check: http://localhost/health"
    
    echo ""
    log_info "📦 Container Status:"
    $COMPOSE_CMD -f docker-compose.prod.yml ps
    
    echo ""
    log_info "📝 Log File: $LOG_FILE"
    
    if [ $HEALTH_CHECKS_PASSED -eq 5 ]; then
        log_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
        log_success "All services are healthy and the site is live!"
    else
        log_warning "⚠️ DEPLOYMENT COMPLETED WITH ISSUES"
        log_warning "Some health checks failed. Please review the logs."
    fi
    
    log_output "DEPLOYMENT SUMMARY: Completed with $HEALTH_CHECKS_PASSED/5 health checks passed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    log_header "SOLEVA E-COMMERCE PLATFORM - FULL CLEAN DEPLOYMENT"
    log_info "Starting deployment at $(date)"
    log_info "Log file: $LOG_FILE"
    
    # Execute all deployment steps
    stop_and_remove_services
    clear_caches_and_packages
    validate_environment
    reinstall_and_build
    rebuild_docker_images
    deploy_services
    perform_health_checks
    post_deploy
    deployment_summary
    
    log_info "Deployment completed at $(date)"
}

# Run main function
main "$@"
