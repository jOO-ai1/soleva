#!/bin/bash

# Test Docker Compose File Detection
# Usage: ./test-docker-compose-detection.sh

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

# Source Docker Compose utilities
source "$(dirname "$0")/docker-compose-utils.sh"

print_status "Testing Docker Compose file detection..."

# Test main Docker Compose file detection
print_status "Testing main Docker Compose file detection..."
if compose_file=$(detect_docker_compose_file "."); then
    print_success "✅ Main Docker Compose file detected: $compose_file"
else
    print_error "❌ No main Docker Compose file found"
fi

# Test production Docker Compose file detection
print_status "Testing production Docker Compose file detection..."
if prod_compose_file=$(detect_docker_compose_prod_file "."); then
    print_success "✅ Production Docker Compose file detected: $prod_compose_file"
else
    print_warning "⚠️ No production Docker Compose file found"
fi

# Test Docker Compose command generation
print_status "Testing Docker Compose command generation..."
if [ -n "$compose_file" ]; then
    compose_cmd=$(get_docker_compose_cmd "$compose_file" ".")
    print_success "✅ Main Docker Compose command: $compose_cmd"
else
    print_error "❌ Cannot generate main Docker Compose command"
fi

if [ -n "$prod_compose_file" ]; then
    prod_compose_cmd=$(get_docker_compose_cmd "$prod_compose_file" ".")
    print_success "✅ Production Docker Compose command: $prod_compose_cmd"
else
    print_warning "⚠️ Cannot generate production Docker Compose command"
fi

# Test file validation
print_status "Testing Docker Compose file validation..."
if validate_docker_compose_files "."; then
    print_success "✅ Docker Compose file validation passed"
else
    print_error "❌ Docker Compose file validation failed"
fi

# Test actual Docker Compose commands
print_status "Testing actual Docker Compose commands..."
if [ -n "$compose_file" ]; then
    print_status "Testing 'ps' command..."
    if $compose_cmd ps >/dev/null 2>&1; then
        print_success "✅ Docker Compose 'ps' command works"
    else
        print_warning "⚠️ Docker Compose 'ps' command failed (may be normal if no containers running)"
    fi
    
    print_status "Testing 'version' command..."
    if $compose_cmd version >/dev/null 2>&1; then
        print_success "✅ Docker Compose 'version' command works"
        $compose_cmd version
    else
        print_error "❌ Docker Compose 'version' command failed"
    fi
fi

print_status "Docker Compose file detection test completed!"
