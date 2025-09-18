#!/bin/bash

# =============================================================================
# .gitignore Verification Script
# =============================================================================

echo "🔍 Verifying .gitignore configuration..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if files are ignored
check_ignored() {
    local file="$1"
    local description="$2"
    
    if git check-ignore "$file" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $description: $file${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: $file (NOT IGNORED)${NC}"
        return 1
    fi
}

# Function to check if files are tracked
check_tracked() {
    local file="$1"
    local description="$2"
    
    if git check-ignore "$file" >/dev/null 2>&1; then
        echo -e "${RED}❌ $description: $file (IGNORED - should be tracked)${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $description: $file${NC}"
        return 0
    fi
}

echo -e "${BLUE}📁 Checking that sensitive files are IGNORED:${NC}"
echo "----------------------------------------"

# Environment files
check_ignored ".env" "Environment file"
check_ignored ".env.local" "Local environment file"
check_ignored ".env.production" "Production environment file"
check_ignored "env.production" "Production env file"
check_ignored "env.staging" "Staging env file"
check_ignored "backend/.env" "Backend environment file"

# Build artifacts
check_ignored "dist/" "Build output directory"
check_ignored "admin/dist/" "Admin build output"
check_ignored "backend/dist/" "Backend build output"

# Dependencies
check_ignored "node_modules/" "Node modules directory"
check_ignored "admin/node_modules/" "Admin node modules"

# Logs
check_ignored "backend/logs/" "Backend logs directory"
check_ignored "backend/backend.log" "Backend log file"
check_ignored "dev.log" "Development log file"

# Cache and temporary files
check_ignored ".cache/" "Cache directory"
check_ignored ".eslintcache" "ESLint cache"
check_ignored "*.tsbuildinfo" "TypeScript build info"

# OS files
check_ignored ".DS_Store" "macOS system file"
check_ignored "Thumbs.db" "Windows thumbnail cache"

echo ""
echo -e "${BLUE}📁 Checking that essential files are TRACKED:${NC}"
echo "----------------------------------------"

# Essential source files
check_tracked "package.json" "Package configuration"
check_tracked "src/" "Source code directory"
check_tracked "public/" "Public assets directory"
check_tracked "backend/src/" "Backend source code"
check_tracked "backend/package.json" "Backend package configuration"
check_tracked "backend/prisma/schema.prisma" "Database schema"

# Configuration files
check_tracked "tsconfig.json" "TypeScript configuration"
check_tracked "vite.config.ts" "Vite configuration"
check_tracked "tailwind.config.js" "Tailwind configuration"
check_tracked "eslint.config.js" "ESLint configuration"

# Documentation
check_tracked "README.md" "Main README"
check_tracked "*.md" "Documentation files"

# Docker and deployment
check_tracked "Dockerfile*" "Docker files"
check_tracked "docker-compose*.yml" "Docker Compose files"
check_tracked "Makefile" "Makefile"

echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "=========="

# Count ignored files
ignored_count=$(git status --porcelain | grep -c "^??" || echo "0")
echo -e "Files currently untracked: ${YELLOW}$ignored_count${NC}"

# Check for any sensitive files in untracked
sensitive_untracked=$(git status --porcelain | grep -E "\.(env|log)$|node_modules|dist/" | wc -l)
if [ "$sensitive_untracked" -gt 0 ]; then
    echo -e "${RED}⚠️  Warning: $sensitive_untracked sensitive files are untracked${NC}"
    git status --porcelain | grep -E "\.(env|log)$|node_modules|dist/"
else
    echo -e "${GREEN}✅ No sensitive files in untracked list${NC}"
fi

echo ""
echo -e "${GREEN}🎉 .gitignore verification complete!${NC}"
echo ""
echo -e "${BLUE}💡 To test in a clean environment:${NC}"
echo "1. Create a new directory: mkdir test-repo"
echo "2. Clone the repo: git clone <your-repo> test-repo"
echo "3. Check that the project builds: cd test-repo && npm install && npm run build"
echo "4. Verify no sensitive files are present in the cloned repo"
