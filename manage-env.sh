#!/bin/bash

# ====== Soleva E-commerce Platform - Environment Management Script ======
# This script helps manage environment files securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup-production    - Set up production environment from template"
    echo "  validate           - Validate current environment configuration"
    echo "  backup             - Create backup of current environment files"
    echo "  restore            - Restore from backup"
    echo "  check-gitignore    - Check what files are being ignored by git"
    echo "  clean              - Clean up temporary and backup files"
    echo "  help               - Show this help message"
    echo ""
}

# Function to setup production environment
setup_production() {
    log "Setting up production environment..."
    
    if [ -f "env.production" ]; then
        warning "env.production already exists. Creating backup..."
        cp env.production "env.production.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    if [ ! -f "env.production.template" ]; then
        error "env.production.template not found!"
        exit 1
    fi
    
    cp env.production.template env.production
    success "Production environment template copied to env.production"
    warning "Please edit env.production and replace all placeholder values with your actual configuration"
    
    # Make sure the file is ignored by git
    if git check-ignore env.production > /dev/null 2>&1; then
        success "env.production is properly ignored by git"
    else
        warning "env.production is not being ignored by git. Check your .gitignore file"
    fi
}

# Function to validate environment
validate_environment() {
    log "Validating environment configuration..."
    
    if [ -f "./validate-production-config.sh" ]; then
        ./validate-production-config.sh
    else
        error "validate-production-config.sh not found!"
        exit 1
    fi
}

# Function to backup environment files
backup_environment() {
    log "Creating backup of environment files..."
    
    backup_dir="env-backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup all environment files
    for file in .env* env.*; do
        if [ -f "$file" ]; then
            cp "$file" "$backup_dir/"
            log "Backed up $file"
        fi
    done
    
    success "Environment files backed up to $backup_dir"
}

# Function to restore from backup
restore_environment() {
    log "Available backups:"
    ls -la env-backups/ 2>/dev/null || {
        error "No backups found!"
        exit 1
    }
    
    echo ""
    read -p "Enter backup directory name: " backup_name
    
    if [ ! -d "env-backups/$backup_name" ]; then
        error "Backup directory not found: env-backups/$backup_name"
        exit 1
    fi
    
    log "Restoring from env-backups/$backup_name..."
    cp env-backups/$backup_name/* .
    success "Environment files restored from backup"
}

# Function to check gitignore
check_gitignore() {
    log "Checking .gitignore configuration..."
    
    echo ""
    echo "Files being ignored by git:"
    echo "=========================="
    
    # Check environment files
    for file in .env* env.*; do
        if [ -f "$file" ]; then
            if git check-ignore "$file" > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} $file (ignored)"
            else
                # Check if it's a safe example/template file
                if [[ "$file" == *".example" ]] || [[ "$file" == *".template" ]]; then
                    echo -e "${GREEN}✓${NC} $file (safe to commit - example/template)"
                else
                    echo -e "${RED}✗${NC} $file (NOT ignored - SECURITY RISK!)"
                fi
            fi
        fi
    done
    
    echo ""
    echo "Sensitive files that should be ignored:"
    echo "======================================"
    
    sensitive_files=(
        "env.production"
        ".env.production"
        "env.local"
        ".env.local"
        "env.staging"
        ".env.staging"
        "*.key"
        "*.pem"
        "*.crt"
        "docker/nginx/ssl/"
    )
    
    for pattern in "${sensitive_files[@]}"; do
        if git check-ignore "$pattern" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $pattern (ignored)"
        else
            echo -e "${YELLOW}?${NC} $pattern (check manually)"
        fi
    done
}

# Function to clean up
clean_environment() {
    log "Cleaning up temporary and backup files..."
    
    # Remove old backups (keep last 5)
    if [ -d "env-backups" ]; then
        cd env-backups
        ls -t | tail -n +6 | xargs -r rm -rf
        cd ..
        success "Cleaned up old environment backups"
    fi
    
    # Remove temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.temp" -delete 2>/dev/null || true
    find . -name "*.backup" -delete 2>/dev/null || true
    
    success "Cleanup completed"
}

# Main script logic
case "${1:-help}" in
    "setup-production")
        setup_production
        ;;
    "validate")
        validate_environment
        ;;
    "backup")
        backup_environment
        ;;
    "restore")
        restore_environment
        ;;
    "check-gitignore")
        check_gitignore
        ;;
    "clean")
        clean_environment
        ;;
    "help"|*)
        show_usage
        ;;
esac
