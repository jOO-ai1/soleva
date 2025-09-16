#!/bin/bash

# Script to copy updated deployment scripts to production location
# Usage: ./copy-scripts-to-production.sh

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

# Source and destination directories
SOURCE_DIR="/home/youssef/web"
DEST_DIR="/root/soleva"

print_status "Copying updated deployment scripts to production location..."

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Check if destination directory exists
if [ ! -d "$DEST_DIR" ]; then
    print_error "Destination directory not found: $DEST_DIR"
    print_status "Creating destination directory..."
    mkdir -p "$DEST_DIR" || {
        print_error "Failed to create destination directory: $DEST_DIR"
        exit 1
    }
fi

# List of scripts to copy
SCRIPTS=(
    "deploy.sh"
    "deploy-production.sh"
    "deploy-complete.sh"
    "fix-frontend-deployment.sh"
    "verify-asset-consistency.sh"
    "restore-frontend-volume.sh"
)

# Copy each script
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SOURCE_DIR/$script" ]; then
        print_status "Copying $script..."
        cp "$SOURCE_DIR/$script" "$DEST_DIR/$script" || {
            print_error "Failed to copy $script"
            exit 1
        }
        chmod +x "$DEST_DIR/$script" || {
            print_warning "Failed to make $script executable"
        }
        print_success "Copied $script"
    else
        print_warning "Script not found: $script"
    fi
done

# Copy documentation files
DOCS=(
    "FRONTEND_DEPLOYMENT_FIX_GUIDE.md"
    "DEPLOYMENT_AUTOMATION_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$SOURCE_DIR/$doc" ]; then
        print_status "Copying $doc..."
        cp "$SOURCE_DIR/$doc" "$DEST_DIR/$doc" || {
            print_warning "Failed to copy $doc"
        }
        print_success "Copied $doc"
    else
        print_warning "Documentation not found: $doc"
    fi
done

print_success "✅ All scripts copied successfully to $DEST_DIR"
print_status "You can now run the deployment scripts from the production directory:"
print_status "cd $DEST_DIR"
print_status "./deploy.sh"
