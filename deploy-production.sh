#!/bin/bash

# Production Deployment Script
# Usage: ./deploy-production.sh

set -e

# Source Docker Compose utilities
source "$(dirname "$0")/docker-compose-utils.sh"

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

# Detect Docker Compose files
echo -e "${BLUE}Detecting Docker Compose files...${NC}"
if ! validate_docker_compose_files "."; then
    echo -e "${RED}❌ Docker Compose file validation failed${NC}"
    exit 1
fi

compose_file=$(detect_docker_compose_file ".")
prod_compose_file=$(detect_docker_compose_prod_file ".")

echo -e "${GREEN}✅ Using Docker Compose file: $compose_file${NC}"
if [ -n "$prod_compose_file" ]; then
    echo -e "${GREEN}✅ Using production Docker Compose file: $prod_compose_file${NC}"
else
    echo -e "${YELLOW}⚠️ No production Docker Compose file found, using main file${NC}"
    prod_compose_file="$compose_file"
fi

# Make scripts executable
chmod +x deploy-complete.sh fix-frontend-deployment.sh verify-asset-consistency.sh restore-frontend-volume.sh 2>/dev/null || true

# Use production docker compose file
echo -e "${BLUE}Using production configuration...${NC}"

# Run deployment with production config
$(get_docker_compose_cmd "$prod_compose_file" ".") down --remove-orphans 2>/dev/null || true
$(get_docker_compose_cmd "$prod_compose_file" ".") build --no-cache
$(get_docker_compose_cmd "$prod_compose_file" ".") up -d

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
    echo -e "${YELLOW}Check logs: $(get_docker_compose_cmd "$prod_compose_file" ".") logs${NC}"
    exit 1
fi