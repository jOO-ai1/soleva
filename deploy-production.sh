#!/bin/bash

# Production Deployment Script
# Usage: ./deploy-production.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Change to project directory
cd /root/soleva || {
    echo -e "${RED}❌ Failed to change to project directory: /root/soleva${NC}"
    exit 1
}

echo -e "${BLUE}🏭 Starting Production Deployment...${NC}"

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Production environment file not found!${NC}"
    echo -e "${YELLOW}Please create .env.production file with required environment variables${NC}"
    exit 1
fi

# Make scripts executable
chmod +x deploy-complete.sh fix-frontend-deployment.sh verify-asset-consistency.sh restore-frontend-volume.sh 2>/dev/null || true

# Use production docker compose file
echo -e "${BLUE}Using production configuration...${NC}"

# Run deployment with production config
docker compose -f docker compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker compose.prod.yml build --no-cache
docker compose -f docker compose.prod.yml up -d

# Wait for services
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 30

# Verify deployment
echo -e "${BLUE}Verifying deployment...${NC}"
if curl -f http://localhost/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Production deployment successful!${NC}"
    echo -e "${BLUE}🌐 Your production website is now available${NC}"
else
    echo -e "${RED}❌ Production deployment failed!${NC}"
    echo -e "${YELLOW}Check logs: docker compose -f docker compose.prod.yml logs${NC}"
    exit 1
fi