#!/bin/bash

# Frontend Deployment Fix Script
# This script fixes the white screen issue by rebuilding the frontend without cache
# and verifying asset consistency

set -e

# Source Docker Compose utilities
source "$(dirname "$0")/docker-compose-utils.sh"

echo "🔧 Frontend Deployment Fix Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Change to project directory
cd /root/soleva || {
    print_error "Failed to change to project directory: /root/soleva"
    exit 1
}

# Detect Docker Compose file
compose_file=$(detect_docker_compose_file ".")
if [ -z "$compose_file" ]; then
    print_error "No Docker Compose file found in current directory"
    print_error "Please run this script from the project root directory"
    exit 1
fi
print_success "Using Docker Compose file: $compose_file"

# Step 1: Stop existing containers
print_status "Stopping existing containers..."
$(get_docker_compose_cmd "$compose_file" ".") down frontend nginx 2>/dev/null || true

# Step 2: Remove old frontend volume to clear cached files
print_status "Removing old frontend volume to clear cached files..."
docker volume rm solevaeg_frontend_static 2>/dev/null || print_warning "Volume didn't exist or couldn't be removed"

# Step 3: Rebuild frontend with --no-cache
print_status "Rebuilding frontend container with --no-cache..."
$(get_docker_compose_cmd "$compose_file" ".") build --no-cache frontend

# Step 4: Start the frontend container
print_status "Starting frontend container..."
$(get_docker_compose_cmd "$compose_file" ".") up -d frontend

# Step 5: Wait for container to be ready
print_status "Waiting for frontend container to be ready..."
sleep 10

# Step 6: Verify asset consistency
print_status "Verifying asset consistency in container..."

# Check if container is running
if ! docker ps | grep -q "solevaeg-frontend"; then
    print_error "Frontend container is not running!"
    exit 1
fi

# Get the actual asset files in the container
print_status "Checking actual asset files in container..."
docker exec solevaeg-frontend sh -c "ls -la /usr/share/nginx/html/assets/ 2>/dev/null || echo 'No assets directory found'"

# Get the HTML file to check references
print_status "Checking HTML file for asset references..."
docker exec solevaeg-frontend sh -c "grep -o 'assets/[^\"]*' /usr/share/nginx/html/index.html 2>/dev/null || echo 'No asset references found in HTML'"

# Step 7: Test the frontend
print_status "Testing frontend accessibility..."
if docker exec solevaeg-frontend curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "Frontend is accessible!"
else
    print_error "Frontend is not accessible!"
fi

# Step 8: Start nginx if not running
print_status "Starting nginx reverse proxy..."
$(get_docker_compose_cmd "$compose_file" ".") up -d nginx

# Step 9: Final verification
print_status "Performing final verification..."
sleep 5

if curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "✅ Frontend deployment fix completed successfully!"
    print_success "The frontend should now be accessible without white screen issues."
    echo ""
    print_status "You can now:"
    print_status "1. Test the frontend at http://localhost/"
    print_status "2. Check browser console for any remaining errors"
    print_status "3. If everything works, restore the volume mount in $(get_docker_compose_cmd "$compose_file" ".").yml"
else
    print_error "❌ Frontend is still not accessible. Please check the logs:"
    print_status "Frontend logs:"
    $(get_docker_compose_cmd "$compose_file" ".") logs frontend
    print_status "Nginx logs:"
    $(get_docker_compose_cmd "$compose_file" ".") logs nginx
fi

echo ""
print_status "Script completed. Check the output above for any issues."
