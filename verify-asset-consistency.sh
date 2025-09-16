#!/bin/bash

# Asset Consistency Verification Script
# This script verifies that HTML references match actual asset filenames

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

# Check if frontend container is running
if ! docker ps | grep -q "solevaeg-frontend"; then
    print_error "Frontend container is not running!"
    print_status "Please start the frontend container first:"
    print_status "docker-compose up -d frontend"
    exit 1
fi

print_status "Verifying asset consistency in frontend container..."

# Get the actual asset files
print_status "Actual asset files in container:"
ACTUAL_ASSETS=$(docker exec solevaeg-frontend sh -c "ls /usr/share/nginx/html/assets/ 2>/dev/null || echo 'No assets directory'")
echo "$ACTUAL_ASSETS"

echo ""

# Get the HTML file content and extract asset references
print_status "Asset references in HTML file:"
HTML_ASSETS=$(docker exec solevaeg-frontend sh -c "grep -o 'assets/[^\"]*' /usr/share/nginx/html/index.html 2>/dev/null || echo 'No asset references found'")
echo "$HTML_ASSETS"

echo ""

# Check for mismatches
print_status "Checking for mismatches..."

MISMATCHES_FOUND=false

# Extract just the filenames from HTML references
HTML_FILENAMES=$(echo "$HTML_ASSETS" | sed 's|assets/||g' | sort)

# Extract actual filenames
ACTUAL_FILENAMES=$(echo "$ACTUAL_ASSETS" | grep -v "No assets directory" | sort)

if [ "$HTML_FILENAMES" = "$ACTUAL_FILENAMES" ]; then
    print_success "✅ Asset consistency check passed!"
    print_success "All HTML references match actual asset files."
else
    print_error "❌ Asset consistency check failed!"
    print_error "HTML references do not match actual asset files."
    
    echo ""
    print_status "HTML references:"
    echo "$HTML_FILENAMES"
    
    echo ""
    print_status "Actual files:"
    echo "$ACTUAL_FILENAMES"
    
    MISMATCHES_FOUND=true
fi

# Check if assets directory exists and has files
if echo "$ACTUAL_ASSETS" | grep -q "No assets directory"; then
    print_error "❌ No assets directory found in container!"
    print_status "This might indicate a build issue."
    MISMATCHES_FOUND=true
fi

# Check if HTML has asset references
if echo "$HTML_ASSETS" | grep -q "No asset references found"; then
    print_warning "⚠️  No asset references found in HTML file!"
    print_status "This might indicate the HTML file is not properly generated."
fi

echo ""
print_status "Container file structure:"
docker exec solevaeg-frontend sh -c "ls -la /usr/share/nginx/html/"

echo ""
print_status "Index.html content preview:"
docker exec solevaeg-frontend sh -c "head -20 /usr/share/nginx/html/index.html"

if [ "$MISMATCHES_FOUND" = true ]; then
    echo ""
    print_error "Asset consistency issues detected!"
    print_status "Recommended actions:"
    print_status "1. Rebuild the frontend container with --no-cache"
    print_status "2. Ensure Vite base path is set to '/' in vite.config.ts"
    print_status "3. Check that the build process completed successfully"
    exit 1
else
    print_success "Asset consistency verification completed successfully!"
fi
