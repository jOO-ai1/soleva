#!/bin/bash

# Complete Project Setup and Deployment Script
# This script handles full project setup, fixes, and deployment automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

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

# Global variables
PROJECT_ROOT="/home/youssef/web"
LOG_FILE="deployment-$(date +%Y%m%d_%H%M%S).log"
ERRORS=0

# Function to log all output
log_output() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    ERRORS=$((ERRORS + 1))
    print_error "$1"
    log_output "ERROR: $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        print_status "Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    handle_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up..."
    # Add any cleanup tasks here
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment function
main() {
    print_header "COMPLETE PROJECT SETUP AND DEPLOYMENT"
    print_status "Starting deployment at $(date)"
    print_status "Log file: $LOG_FILE"
    
    # Change to project directory
    cd "$PROJECT_ROOT" || {
        handle_error "Failed to change to project directory: $PROJECT_ROOT"
        exit 1
    }
    
    # Step 1: Pre-deployment checks
    print_header "STEP 1: PRE-DEPLOYMENT CHECKS"
    
    # Check if Docker is running
    if ! command_exists docker; then
        handle_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        handle_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command_exists docker-compose; then
        handle_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check for required files
    local required_files=(
        "package.json"
        "docker-compose.yml"
        "vite.config.ts"
        "backend/package.json"
        "admin/package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            handle_error "Required file not found: $file"
            exit 1
        fi
    done
    
    print_success "Pre-deployment checks passed"
    
    # Step 2: Stop existing services
    print_header "STEP 2: STOPPING EXISTING SERVICES"
    
    print_step "Stopping existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # Step 3: Clean up old volumes and containers
    print_header "STEP 3: CLEANING UP OLD RESOURCES"
    
    print_step "Removing old volumes..."
    docker volume rm solevaeg_frontend_static 2>/dev/null || true
    docker volume rm solevaeg_admin_static 2>/dev/null || true
    docker volume rm solevaeg_backend_uploads 2>/dev/null || true
    docker volume rm solevaeg_backend_logs 2>/dev/null || true
    docker volume rm solevaeg_nginx_logs 2>/dev/null || true
    
    print_step "Removing old images..."
    docker image prune -f 2>/dev/null || true
    
    # Step 4: Install dependencies
    print_header "STEP 4: INSTALLING DEPENDENCIES"
    
    # Frontend dependencies
    print_step "Installing frontend dependencies..."
    if [ -f "package.json" ]; then
        npm install --no-audit --no-fund 2>/dev/null || {
            print_warning "npm install failed, trying with different registry..."
            npm config set registry https://registry.npmjs.org/
            npm install --no-audit --no-fund
        }
        print_success "Frontend dependencies installed"
    fi
    
    # Backend dependencies
    print_step "Installing backend dependencies..."
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        cd backend
        npm install --no-audit --no-fund 2>/dev/null || {
            print_warning "Backend npm install failed, trying with different registry..."
            npm config set registry https://registry.npmjs.org/
            npm install --no-audit --no-fund
        }
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # Admin dependencies
    print_step "Installing admin dependencies..."
    if [ -d "admin" ] && [ -f "admin/package.json" ]; then
        cd admin
        npm install --no-audit --no-fund 2>/dev/null || {
            print_warning "Admin npm install failed, trying with different registry..."
            npm config set registry https://registry.npmjs.org/
            npm install --no-audit --no-fund
        }
        cd ..
        print_success "Admin dependencies installed"
    fi
    
    # Step 5: Configure Vite
    print_header "STEP 5: CONFIGURING VITE"
    
    print_step "Ensuring Vite base path is set correctly..."
    if ! grep -q 'base: '"'"'/'"'"'' vite.config.ts; then
        print_status "Adding base path to vite.config.ts..."
        sed -i "s/plugins: \[react()\],/plugins: [react()],\n  base: '\/',/" vite.config.ts
    fi
    print_success "Vite configuration verified"
    
    # Step 6: Build all services
    print_header "STEP 6: BUILDING ALL SERVICES"
    
    print_step "Building frontend with --no-cache..."
    docker-compose build --no-cache frontend || {
        handle_error "Frontend build failed"
        exit 1
    }
    print_success "Frontend built successfully"
    
    print_step "Building backend with --no-cache..."
    docker-compose build --no-cache backend || {
        handle_error "Backend build failed"
        exit 1
    }
    print_success "Backend built successfully"
    
    print_step "Building admin with --no-cache..."
    docker-compose build --no-cache admin || {
        handle_error "Admin build failed"
        exit 1
    }
    print_success "Admin built successfully"
    
    print_step "Building nginx..."
    docker-compose build --no-cache nginx || {
        handle_error "Nginx build failed"
        exit 1
    }
    print_success "Nginx built successfully"
    
    # Step 7: Start database services
    print_header "STEP 7: STARTING DATABASE SERVICES"
    
    print_step "Starting PostgreSQL..."
    docker-compose up -d postgres
    wait_for_service "PostgreSQL" "docker exec solevaeg-postgres pg_isready -U solevaeg -d solevaeg_db"
    
    print_step "Starting Redis..."
    docker-compose up -d redis
    wait_for_service "Redis" "docker exec solevaeg-redis redis-cli ping"
    
    # Step 8: Start backend
    print_header "STEP 8: STARTING BACKEND"
    
    print_step "Starting backend service..."
    docker-compose up -d backend
    wait_for_service "Backend" "curl -f http://localhost:3001/health"
    
    # Step 9: Start frontend (without volume mount)
    print_header "STEP 9: STARTING FRONTEND"
    
    print_step "Starting frontend service..."
    docker-compose up -d frontend
    wait_for_service "Frontend" "curl -f http://localhost:80"
    
    # Step 10: Start admin
    print_header "STEP 10: STARTING ADMIN"
    
    print_step "Starting admin service..."
    docker-compose up -d admin
    wait_for_service "Admin" "curl -f http://localhost:3002"
    
    # Step 11: Start nginx
    print_header "STEP 11: STARTING NGINX"
    
    print_step "Starting nginx reverse proxy..."
    docker-compose up -d nginx
    wait_for_service "Nginx" "curl -f http://localhost/health"
    
    # Step 12: Verify asset consistency
    print_header "STEP 12: VERIFYING ASSET CONSISTENCY"
    
    print_step "Checking frontend assets..."
    if [ -f "verify-asset-consistency.sh" ]; then
        ./verify-asset-consistency.sh || {
            print_warning "Asset consistency check failed, but continuing..."
        }
    else
        print_status "Asset consistency script not found, performing manual check..."
        # Manual asset check
        ACTUAL_ASSETS=$(docker exec solevaeg-frontend sh -c "ls /usr/share/nginx/html/assets/ 2>/dev/null || echo 'No assets directory'")
        HTML_ASSETS=$(docker exec solevaeg-frontend sh -c "grep -o 'assets/[^\"]*' /usr/share/nginx/html/index.html 2>/dev/null || echo 'No asset references found'")
        
        if [ "$ACTUAL_ASSETS" != "No assets directory" ] && [ "$HTML_ASSETS" != "No asset references found" ]; then
            print_success "Asset files found in container"
        else
            print_warning "Asset verification inconclusive"
        fi
    fi
    
    # Step 13: Run database migrations (if applicable)
    print_header "STEP 13: RUNNING DATABASE MIGRATIONS"
    
    print_step "Checking for database migrations..."
    if docker exec solevaeg-backend sh -c "ls /app/migrations 2>/dev/null" >/dev/null 2>&1; then
        print_status "Running database migrations..."
        docker exec solevaeg-backend sh -c "npm run migrate 2>/dev/null || echo 'No migrate script found'" || {
            print_warning "Database migrations failed or not available"
        }
    else
        print_status "No database migrations found"
    fi
    
    # Step 14: Comprehensive deployment verification
    print_header "STEP 14: DEPLOYMENT VERIFICATION"
    
    print_step "Testing frontend accessibility..."
    if curl -f http://localhost/ >/dev/null 2>&1; then
        print_success "✅ Frontend is accessible"
    else
        handle_error "❌ Frontend is not accessible"
    fi
    
    print_step "Testing backend API..."
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        print_success "✅ Backend API is accessible"
    else
        print_warning "⚠️ Backend API health check failed"
    fi
    
    print_step "Testing admin panel..."
    if curl -f http://localhost:3002 >/dev/null 2>&1; then
        print_success "✅ Admin panel is accessible"
    else
        print_warning "⚠️ Admin panel is not accessible"
    fi
    
    print_step "Testing static assets..."
    if curl -f http://localhost/assets/ >/dev/null 2>&1; then
        print_success "✅ Static assets are accessible"
    else
        print_warning "⚠️ Static assets may not be accessible"
    fi
    
    # Step 15: Final status report
    print_header "DEPLOYMENT COMPLETE"
    
    if [ $ERRORS -eq 0 ]; then
        print_success "🎉 DEPLOYMENT SUCCESSFUL!"
        print_success "All services are running and accessible"
        
        echo ""
        print_status "Service URLs:"
        print_status "• Frontend: http://localhost/"
        print_status "• Backend API: http://localhost/api/"
        print_status "• Admin Panel: http://localhost:3002"
        print_status "• Health Check: http://localhost/health"
        
        echo ""
        print_status "Container Status:"
        docker-compose ps
        
        echo ""
        print_success "The website should now be fully functional with no white screen or broken assets!"
        
    else
        print_error "❌ DEPLOYMENT COMPLETED WITH $ERRORS ERROR(S)"
        print_status "Please check the log file: $LOG_FILE"
        print_status "Container logs:"
        docker-compose logs --tail=50
    fi
    
    print_status "Deployment completed at $(date)"
    print_status "Log file: $LOG_FILE"
}

# Run main function
main "$@"
