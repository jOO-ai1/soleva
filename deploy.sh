#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# Soleva E-commerce Platform - Production Deployment Script
# =============================================================================
# This script performs a complete, idempotent production deployment with:
# - Pre-flight checks (Docker, ports, disk space)
# - Environment validation
# - Zero-downtime container replacement
# - Database migrations
# - Health checks and warm-up
# - SSL certificate management
# - Automatic rollback on failure
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

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Attempting rollback..."
        rollback_deployment
    fi
    exit $exit_code
}

trap cleanup EXIT

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Get script directory if not already set
    if [ -z "$SCRIPT_DIR" ]; then
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    fi
    
    # Stop new containers
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" down --remove-orphans 2>/dev/null || true
    
    # Start previous containers if they exist
    if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" ps -q | grep -q .; then
        log_info "Starting previous deployment..."
        $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d 2>/dev/null || true
    fi
    
    log_warning "Rollback completed. Please check the logs and fix issues before retrying."
}

# Main deployment function
main() {
    log_info "🚀 Starting Soleva production deployment at $(date -Is)"
    
    # Set script directory for relative paths
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    log_info "Script directory: $SCRIPT_DIR"
    
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
    log_info "🔨 Building Docker images..."
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
    
    log_success "🎉 Deployment completed successfully at $(date -Is)"
    log_info "🌐 Frontend: https://${DOMAIN}"
    log_info "🔧 Admin Panel: https://admin.${DOMAIN}"
    log_info "📡 API: https://api.${DOMAIN}"
}

# Pre-flight checks
check_prerequisites() {
    log_info "Checking Docker installation..."
    command -v docker >/dev/null || { log_error "Docker is not installed"; exit 1; }
    
    log_info "Checking Docker Compose..."
    # Check for Docker Compose v2 first, then fallback to v1
    if ! docker compose version >/dev/null 2>&1; then
        if ! command -v docker-compose >/dev/null; then
            log_error "Neither 'docker compose' nor 'docker-compose' is available"; exit 1; 
        fi
        log_info "Using Docker Compose v1 (docker-compose)"
        export COMPOSE_CMD="docker-compose"
    else
        log_info "Using Docker Compose v2 (docker compose)"
        export COMPOSE_CMD="docker compose"
    fi
    
    log_info "Checking disk space..."
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_error "Disk usage is above 90% (${disk_usage}%)"
        exit 1
    fi
    
    log_info "Checking port availability..."
    for port in 80 443 3001; do
        if ss -tuln | grep -q ":$port "; then
            log_warning "Port $port is already in use"
        fi
    done
    
    log_info "Checking Docker daemon..."
    docker info >/dev/null 2>&1 || { log_error "Docker daemon is not running"; exit 1; }
    
    log_success "All prerequisites checks passed"
}

# Environment validation
validate_environment() {
    local env_file=".env.production"
    
    # Try to find the environment file in the script directory or current directory
    if [ ! -f "$env_file" ]; then
        # Get the directory where the script is located
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        local script_env_file="$script_dir/.env.production"
        
        if [ -f "$script_env_file" ]; then
            env_file="$script_env_file"
            log_info "Found environment file at: $env_file"
        else
            log_error "Environment file $env_file not found in current directory or script directory"
            log_error "Current directory: $(pwd)"
            log_error "Script directory: $script_dir"
            log_error "Please ensure .env.production exists in the same directory as deploy.sh"
            exit 1
        fi
    fi
    
    # Source environment variables safely
    set -a
    # Use a safer method to source the env file
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Export the variable
        export "$line"
    done < "$env_file"
    set +a
    
    # Required variables
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

# Create necessary directories
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

# Build Docker images
build_images() {
    log_info "Pulling base images..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" pull --ignore-build-fails || true
    
    log_info "Building application images..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" build --no-cache --parallel
    
    log_success "All images built successfully"
}

# Start infrastructure services
start_infrastructure() {
    log_info "Starting PostgreSQL and Redis..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" up -d postgres redis
    
    # Wait for infrastructure to be healthy
    log_info "Waiting for infrastructure services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps postgres | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps redis | grep -q "healthy"; then
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

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Generate Prisma client
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" run --rm backend npx prisma generate
    
    # Run migrations
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" run --rm backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

# Start application services
start_application_services() {
    log_info "Starting backend service..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" up -d backend
    
    # Wait for backend to be healthy
    log_info "Waiting for backend to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps backend | grep -q "healthy"; then
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
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" up -d frontend admin
    
    # Wait for frontend and admin to be healthy
    log_info "Waiting for frontend and admin to be healthy..."
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps frontend | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps admin | grep -q "healthy"; then
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
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" up -d nginx
    
    log_success "All application services started"
}

# Perform health checks
perform_health_checks() {
    log_info "Performing comprehensive health checks..."
    
    # Backend health check
    log_info "Checking backend health..."
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
    
    # Frontend health check
    log_info "Checking frontend health..."
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

# Manage SSL certificates
manage_ssl_certificates() {
    log_info "Checking SSL certificate status..."
    
    # Check if certificate exists
    if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        log_info "SSL certificate not found. Requesting new certificate..."
        
        # Install certbot if not present
        if ! command -v certbot >/dev/null; then
            log_info "Installing certbot..."
            if command -v apt-get >/dev/null; then
                sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
            elif command -v yum >/dev/null; then
                sudo yum install -y certbot python3-certbot-nginx
            else
                log_error "Cannot install certbot. Please install it manually."
                exit 1
            fi
        fi
        
        # Request certificate
        log_info "Requesting SSL certificate for ${DOMAIN} and www.${DOMAIN}..."
        sudo certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "${ADMIN_EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --non-interactive \
            -d "${DOMAIN}" \
            -d "www.${DOMAIN}" \
            -d "api.${DOMAIN}" \
            -d "admin.${DOMAIN}" || {
            log_warning "SSL certificate request failed. Continuing without SSL..."
            return 0
        }
        
        # Enable certbot auto-renewal
        log_info "Enabling certbot auto-renewal..."
        sudo systemctl enable --now certbot.timer
        
        # Test renewal
        log_info "Testing SSL certificate renewal..."
        sudo certbot renew --dry-run || log_warning "SSL renewal test failed"
        
        log_success "SSL certificate installed and configured"
    else
        log_info "SSL certificate exists. Checking expiration..."
        
        # Check certificate expiration
        local expiry_date=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days. Attempting renewal..."
            sudo certbot renew --quiet || log_warning "SSL renewal failed"
        else
            log_success "SSL certificate is valid for $days_until_expiry more days"
        fi
    fi
}

# Final validation
final_validation() {
    log_info "Performing final validation..."
    
    # Check if all services are running
    local services=("postgres" "redis" "backend" "frontend" "admin" "nginx")
    for service in "${services[@]}"; do
        if ! $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.prod.yml" ps "$service" | grep -q "Up"; then
            log_error "Service $service is not running"
            exit 1
        fi
    done
    
    # Test HTTPS endpoints
    log_info "Testing HTTPS endpoints..."
    
    # Test main site
    if curl -I "https://${DOMAIN}" 2>/dev/null | grep -E "200|301|302" >/dev/null; then
        log_success "Main site (https://${DOMAIN}) is responding"
    else
        log_warning "Main site HTTPS test failed"
    fi
    
    # Test admin panel
    if curl -I "https://admin.${DOMAIN}" 2>/dev/null | grep -E "200|301|302" >/dev/null; then
        log_success "Admin panel (https://admin.${DOMAIN}) is responding"
    else
        log_warning "Admin panel HTTPS test failed"
    fi
    
    # Test API
    if curl -I "https://api.${DOMAIN}/health" 2>/dev/null | grep -E "200|301|302" >/dev/null; then
        log_success "API (https://api.${DOMAIN}) is responding"
    else
        log_warning "API HTTPS test failed"
    fi
    
    log_success "Final validation completed"
}

# Run main function
main "$@"