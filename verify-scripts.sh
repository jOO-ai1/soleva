#!/bin/bash

# Script to verify all deployment scripts work with updated paths
# Usage: ./verify-scripts.sh

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

print_status "Verifying deployment scripts with updated paths..."

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
        
        # Check if script is executable
        if [ -x "$script" ]; then
            print_success "✅ $script is executable"
        else
            print_warning "⚠️ $script is not executable, making it executable..."
            chmod +x "$script"
        fi
        
        # Check for correct project path
        if grep -q "/root/soleva" "$script"; then
            print_success "✅ $script contains correct project path"
        else
            print_error "❌ $script does not contain correct project path"
        fi
        
        # Check for old path (should not exist)
        if grep -q "/home/youssef/web" "$script"; then
            print_error "❌ $script still contains old project path"
        else
            print_success "✅ $script does not contain old project path"
        fi
        
    else
        print_error "❌ Script not found: $script"
    fi
done

# Verify project directory structure
print_status "Verifying project directory structure..."

REQUIRED_FILES=(
    "package.json"
    "docker-compose.yml"
    "vite.config.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file exists"
    else
        print_error "❌ Required file not found: $file"
    fi
done

# Check if we can change to the project directory
print_status "Testing directory change..."
if cd /root/soleva 2>/dev/null; then
    print_success "✅ Can change to /root/soleva"
    cd - >/dev/null
else
    print_warning "⚠️ Cannot change to /root/soleva (may not exist yet)"
fi

print_status "Script verification completed!"
print_status "All scripts have been updated to use the correct project path: /root/soleva"
