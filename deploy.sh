#!/bin/bash

# One-Command Complete Deployment Script
# Usage: ./deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Change to project directory
cd /root/soleva || {
    echo -e "${RED}❌ Failed to change to project directory: /root/soleva${NC}"
    exit 1
}

echo -e "${BLUE}🚀 Starting Complete Project Deployment...${NC}"

# Make scripts executable
chmod +x deploy-complete.sh fix-frontend-deployment.sh verify-asset-consistency.sh restore-frontend-volume.sh 2>/dev/null || true

# Run the complete deployment
./deploy-complete.sh

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}🌐 Your website is now available at: http://localhost/${NC}"