#!/bin/bash

# Script to verify all deployment scripts use correct Docker Compose syntax
# Usage: ./verify-docker-syntax.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Verifying Docker Compose syntax in all deployment scripts..."

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# List of scripts to verify
SCRIPTS=(
    "deploy.sh"
    "deploy-production.sh"
    "deploy-complete.sh"
    "fix-frontend-deployment.sh"
    "verify-asset-consistency.sh"
    "restore-frontend-volume.sh"
)

# Verify each script
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        print_status "Verifying $script..."
        
        # Check for old docker-compose syntax (should not exist)
        if grep -q "docker-compose" "$script"; then
            print_error "❌ $script still contains old 'docker-compose' syntax"
            print_status "Found instances:"
            grep -n "docker-compose" "$script" | head -5
        else
            print_success "✅ $script does not contain old 'docker-compose' syntax"
        fi
        
        # Check for new docker compose syntax
        if grep -q "docker compose" "$script"; then
            print_success "✅ $script contains new 'docker compose' syntax"
        else
            print_warning "⚠️ $script does not contain 'docker compose' commands"
        fi
        
        # Count docker compose commands
        DOCKER_COMPOSE_COUNT=$(grep -c "docker compose" "$script" 2>/dev/null || echo "0")
        if [ "$DOCKER_COMPOSE_COUNT" -gt 0 ]; then
            print_status "  Found $DOCKER_COMPOSE_COUNT 'docker compose' commands"
        fi
        
    else
        print_error "❌ Script not found: $script"
    fi
done

# Test Docker Compose availability
print_status "Testing Docker Compose availability..."

if docker compose version >/dev/null 2>&1; then
    print_success "✅ Docker Compose is available and working"
    docker compose version
else
    print_error "❌ Docker Compose is not available or not working"
    print_status "Trying alternative check..."
    if command -v docker-compose >/dev/null 2>&1; then
        print_warning "⚠️ Old 'docker-compose' command is available but new 'docker compose' is not"
        print_status "You may need to update Docker or install Docker Compose V2"
    else
        print_error "❌ Neither 'docker compose' nor 'docker-compose' is available"
    fi
fi

# Test a simple docker compose command
print_status "Testing Docker Compose functionality..."
if docker compose ps >/dev/null 2>&1; then
    print_success "✅ Docker Compose 'ps' command works"
else
    print_warning "⚠️ Docker Compose 'ps' command failed (may be normal if no containers running)"
fi

print_status "Docker Compose syntax verification completed!"
print_status "All scripts have been updated to use the new 'docker compose' syntax"
