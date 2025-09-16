#!/bin/bash

# Restore Frontend Volume Mount Script
# This script restores the frontend volume mount after successful verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Restoring frontend volume mount..."

# First, verify that the frontend is working without volume mount
print_status "Verifying frontend is working before restoring volume mount..."
if ! curl -f http://localhost/ >/dev/null 2>&1; then
    print_error "Frontend is not accessible! Please fix the frontend first before restoring volume mount."
    exit 1
fi

print_success "Frontend is working correctly. Proceeding with volume mount restoration..."

# Create a backup of current docker-compose.yml
print_status "Creating backup of docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Restore volume mount in docker-compose.yml
print_status "Restoring volume mount in docker-compose.yml..."
sed -i 's|# volumes:|volumes:|g' docker-compose.yml
sed -i 's|#   - frontend_static:/usr/share/nginx/html:ro|  - frontend_static:/usr/share/nginx/html:ro|g' docker-compose.yml

# Restore volume mount in docker-compose.prod.yml
print_status "Restoring volume mount in docker-compose.prod.yml..."
sed -i 's|# volumes:|volumes:|g' docker-compose.prod.yml
sed -i 's|#   - frontend_static:/usr/share/nginx/html:ro|  - frontend_static:/usr/share/nginx/html:ro|g' docker-compose.prod.yml

# Copy current build files to volume
print_status "Copying current build files to volume..."

# Create volume if it doesn't exist
docker volume create solevaeg_frontend_static 2>/dev/null || true

# Create a temporary container to copy files
print_status "Copying files from container to volume..."
docker run --rm -v solevaeg_frontend_static:/target -v solevaeg_frontend_static:/source alpine sh -c "cp -r /usr/share/nginx/html/* /target/" 2>/dev/null || {
    # Alternative method using docker cp
    print_status "Using alternative method to copy files..."
    TEMP_CONTAINER=$(docker run -d --rm -v solevaeg_frontend_static:/target alpine sleep 300)
    docker cp solevaeg-frontend:/usr/share/nginx/html/. $TEMP_CONTAINER:/target/
    docker stop $TEMP_CONTAINER
}

# Restart frontend with volume mount
print_status "Restarting frontend with volume mount..."
docker-compose down frontend
docker-compose up -d frontend

# Wait for container to be ready
print_status "Waiting for frontend container to be ready..."
sleep 10

# Verify the frontend still works with volume mount
print_status "Verifying frontend works with volume mount..."
if curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "✅ Volume mount restored successfully!"
    print_success "Frontend is working with persistent volume mount."
    
    echo ""
    print_status "Summary of changes:"
    print_status "1. ✅ Restored volume mount in docker-compose.yml"
    print_status "2. ✅ Restored volume mount in docker-compose.prod.yml"
    print_status "3. ✅ Copied current build files to volume"
    print_status "4. ✅ Restarted frontend with volume mount"
    print_status "5. ✅ Verified frontend is working"
    
    echo ""
    print_status "The frontend volume mount has been successfully restored."
    print_status "Future deployments will now use the persistent volume."
    
else
    print_error "❌ Frontend is not working with volume mount!"
    print_status "Restoring backup configuration..."
    
    # Find the most recent backup
    BACKUP_FILE=$(ls -t docker-compose.yml.backup.* | head -1)
    if [ -n "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" docker-compose.yml
        print_status "Restored from backup: $BACKUP_FILE"
    fi
    
    # Restart without volume mount
    docker-compose down frontend
    docker-compose up -d frontend
    
    print_error "Please investigate the volume mount issue before trying again."
    exit 1
fi

echo ""
print_success "Volume mount restoration completed successfully!"
