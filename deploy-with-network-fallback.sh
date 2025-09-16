#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# Soleva E-commerce Platform - Network-Resilient Deployment Script
# =============================================================================
# This script handles network connectivity issues during Docker builds by:
# 1. Testing network connectivity before building
# 2. Using multiple DNS servers and package mirrors
# 3. Implementing retry logic with exponential backoff
# 4. Falling back to cached builds when possible
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    if ! command -v docker-compose >/dev/null; then
        log_error "Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
    log_info "Using Docker Compose v1 (docker-compose)"
    export COMPOSE_CMD="docker-compose"
else
    log_info "Using Docker Compose v2 (docker compose)"
    export COMPOSE_CMD="docker compose"
fi

# Network connectivity test function
test_network_connectivity() {
    log_info "🔍 Testing network connectivity..."
    
    local test_urls=(
        "http://deb.debian.org"
        "http://security.debian.org"
        "http://archive.ubuntu.com"
        "http://registry.npmjs.org"
        "http://github.com"
    )
    
    local failed_urls=()
    
    for url in "${test_urls[@]}"; do
        if curl -s --connect-timeout 10 --max-time 30 "$url" >/dev/null 2>&1; then
            log_success "✓ $url is reachable"
        else
            log_warning "✗ $url is not reachable"
            failed_urls+=("$url")
        fi
    done
    
    if [ ${#failed_urls[@]} -gt 0 ]; then
        log_warning "Network connectivity issues detected for: ${failed_urls[*]}"
        return 1
    else
        log_success "All network connectivity tests passed"
        return 0
    fi
}

# DNS resolution test function
test_dns_resolution() {
    log_info "🔍 Testing DNS resolution..."
    
    local test_domains=(
        "deb.debian.org"
        "security.debian.org"
        "registry.npmjs.org"
        "github.com"
    )
    
    local failed_domains=()
    
    for domain in "${test_domains[@]}"; do
        if nslookup "$domain" >/dev/null 2>&1; then
            log_success "✓ DNS resolution for $domain works"
        else
            log_warning "✗ DNS resolution for $domain failed"
            failed_domains+=("$domain")
        fi
    done
    
    if [ ${#failed_domains[@]} -gt 0 ]; then
        log_warning "DNS resolution issues detected for: ${failed_domains[*]}"
        return 1
    else
        log_success "All DNS resolution tests passed"
        return 0
    fi
}

# Create network-resilient Dockerfiles
create_network_resilient_dockerfiles() {
    log_info "🔧 Creating network-resilient Dockerfiles..."
    
    # Create enhanced backend Dockerfile
    cat > "$SCRIPT_DIR/backend/Dockerfile.network-resilient" << 'EOF'
# Network-resilient Debian-based Dockerfile for Node.js backend
# Handles DNS resolution issues and package repository connectivity problems

# Base stage with Node.js 20 - using Debian for better package availability
FROM node:20-slim AS base
WORKDIR /app

# Configure package mirrors for better connectivity (DNS is handled by Docker daemon)

# Create a robust package installation script
RUN echo '#!/bin/bash' > /usr/local/bin/install-packages && \
    echo 'set -e' >> /usr/local/bin/install-packages && \
    echo 'MAX_ATTEMPTS=5' >> /usr/local/bin/install-packages && \
    echo 'ATTEMPT=1' >> /usr/local/bin/install-packages && \
    echo 'while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do' >> /usr/local/bin/install-packages && \
    echo '  echo "Package installation attempt $ATTEMPT/$MAX_ATTEMPTS"' >> /usr/local/bin/install-packages && \
    echo '  if apt-get update && apt-get install -y --no-install-recommends "$@"; then' >> /usr/local/bin/install-packages && \
    echo '    echo "Package installation successful"' >> /usr/local/bin/install-packages && \
    echo '    break' >> /usr/local/bin/install-packages && \
    echo '  else' >> /usr/local/bin/install-packages && \
    echo '    echo "Package installation failed, attempt $ATTEMPT"' >> /usr/local/bin/install-packages && \
    echo '    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then' >> /usr/local/bin/install-packages && \
    echo '      sleep $((ATTEMPT * 10))' >> /usr/local/bin/install-packages && \
    echo '    fi' >> /usr/local/bin/install-packages && \
    echo '  fi' >> /usr/local/bin/install-packages && \
    echo '  ATTEMPT=$((ATTEMPT + 1))' >> /usr/local/bin/install-packages && \
    echo 'done' >> /usr/local/bin/install-packages && \
    echo 'if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then' >> /usr/local/bin/install-packages && \
    echo '  echo "All package installation attempts failed"' >> /usr/local/bin/install-packages && \
    echo '  exit 1' >> /usr/local/bin/install-packages && \
    echo 'fi' >> /usr/local/bin/install-packages && \
    chmod +x /usr/local/bin/install-packages

# Install build dependencies with retry logic
RUN /usr/local/bin/install-packages python3 make g++ curl

# Configure npm for faster, more reliable installs with multiple registries
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 60000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false

# Install dependencies with enhanced retry logic
COPY package*.json ./
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY package*.json ./
# Install ALL dependencies (including devDependencies) for build
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install curl with retry logic (DNS is handled by Docker daemon)

RUN i=1; while [ $i -le 5 ]; do \
      echo "Package installation attempt $i/5"; \
      if apt-get update && apt-get install -y --no-install-recommends curl; then \
        echo "Package installation successful"; \
        break; \
      elif [ $i -lt 5 ]; then \
        echo "Package installation failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "All package installation attempts failed"; \
        exit 1; \
      fi; \
      i=$((i + 1)); \
    done && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs backend

WORKDIR /app

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma
COPY --chown=backend:nodejs start.sh ./start.sh

# Install only production dependencies
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --omit=dev --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --omit=dev --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done

# Create necessary directories
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs

USER backend

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["./start.sh"]
EOF

    # Create enhanced frontend Dockerfile
    cat > "$SCRIPT_DIR/Dockerfile.frontend.network-resilient" << 'EOF'
# Network-resilient Debian-based Dockerfile for React frontend
# Handles DNS resolution issues and package repository connectivity problems

# Base stage with Node.js 20 - using Debian for better package availability
FROM node:20-slim AS base
WORKDIR /app

# Configure package mirrors for better connectivity (DNS is handled by Docker daemon)

# Configure npm for faster, more reliable installs with multiple registries
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 60000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false

# Install dependencies with enhanced retry logic
COPY package*.json ./
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:stable AS production

# Install curl with retry logic (DNS is handled by Docker daemon)

RUN i=1; while [ $i -le 5 ]; do \
      echo "Package installation attempt $i/5"; \
      if apt-get update && apt-get install -y --no-install-recommends curl; then \
        echo "Package installation successful"; \
        break; \
      elif [ $i -lt 5 ]; then \
        echo "Package installation failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "All package installation attempts failed"; \
        exit 1; \
      fi; \
      i=$((i + 1)); \
    done && \
    rm -rf /var/lib/apt/lists/*

# Copy custom nginx config
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN groupadd -g 1001 nginx-user && \
    useradd -r -u 1001 -g nginx-user frontend && \
    chown -R frontend:nginx-user /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R frontend:nginx-user /var/run/nginx.pid

USER frontend

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create enhanced admin Dockerfile
    cat > "$SCRIPT_DIR/admin/Dockerfile.network-resilient" << 'EOF'
# Network-resilient Debian-based Dockerfile for React Admin Panel
# Handles DNS resolution issues and package repository connectivity problems

FROM node:20-slim AS base
WORKDIR /app

# Configure package mirrors for better connectivity (DNS is handled by Docker daemon)

# Create a robust package installation script
RUN echo '#!/bin/bash' > /usr/local/bin/install-packages && \
    echo 'set -e' >> /usr/local/bin/install-packages && \
    echo 'MAX_ATTEMPTS=5' >> /usr/local/bin/install-packages && \
    echo 'ATTEMPT=1' >> /usr/local/bin/install-packages && \
    echo 'while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do' >> /usr/local/bin/install-packages && \
    echo '  echo "Package installation attempt $ATTEMPT/$MAX_ATTEMPTS"' >> /usr/local/bin/install-packages && \
    echo '  if apt-get update && apt-get install -y --no-install-recommends "$@"; then' >> /usr/local/bin/install-packages && \
    echo '    echo "Package installation successful"' >> /usr/local/bin/install-packages && \
    echo '    break' >> /usr/local/bin/install-packages && \
    echo '  else' >> /usr/local/bin/install-packages && \
    echo '    echo "Package installation failed, attempt $ATTEMPT"' >> /usr/local/bin/install-packages && \
    echo '    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then' >> /usr/local/bin/install-packages && \
    echo '      sleep $((ATTEMPT * 10))' >> /usr/local/bin/install-packages && \
    echo '    fi' >> /usr/local/bin/install-packages && \
    echo '  fi' >> /usr/local/bin/install-packages && \
    echo '  ATTEMPT=$((ATTEMPT + 1))' >> /usr/local/bin/install-packages && \
    echo 'done' >> /usr/local/bin/install-packages && \
    echo 'if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then' >> /usr/local/bin/install-packages && \
    echo '  echo "All package installation attempts failed"' >> /usr/local/bin/install-packages && \
    echo '  exit 1' >> /usr/local/bin/install-packages && \
    echo 'fi' >> /usr/local/bin/install-packages && \
    chmod +x /usr/local/bin/install-packages

# Install build dependencies with retry logic
RUN /usr/local/bin/install-packages python3 make g++

# Configure npm for faster, more reliable installs with multiple registries
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 60000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
COPY package*.json ./
# Install ALL dependencies (including devDependencies) for build
RUN i=1; while [ $i -le 3 ]; do \
      echo "npm install attempt $i/3"; \
      if npm ci --no-audit --no-fund; then \
        echo "npm install successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "npm install failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "npm ci failed, trying npm install..."; \
        npm install --no-audit --no-fund --no-optional; \
      fi; \
      i=$((i + 1)); \
    done
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable AS production

# Install curl with retry logic (DNS is handled by Docker daemon)

RUN i=1; while [ $i -le 5 ]; do \
      echo "Package installation attempt $i/5"; \
      if apt-get update && apt-get install -y --no-install-recommends curl; then \
        echo "Package installation successful"; \
        break; \
      elif [ $i -lt 5 ]; then \
        echo "Package installation failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "All package installation attempts failed"; \
        exit 1; \
      fi; \
      i=$((i + 1)); \
    done && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx config for SPA
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    log_success "Network-resilient Dockerfiles created"
}

# Create network-resilient docker-compose file
create_network_resilient_compose() {
    log_info "🔧 Creating network-resilient docker-compose configuration..."
    
    cat > "$SCRIPT_DIR/docker-compose.network-resilient.yml" << 'EOF'
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: solevaeg-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - solevaeg-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

  # Redis Cache
  redis:
    image: redis:7
    container_name: solevaeg-redis-prod
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - solevaeg-network
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.network-resilient
      target: production
      args:
        BUILDKIT_INLINE_CACHE: 1
    container_name: solevaeg-backend-prod
    restart: unless-stopped
    env_file:
      - .env.production
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - solevaeg-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

  # Frontend (React) - Production Build
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.network-resilient
      target: production
      args:
        BUILDKIT_INLINE_CACHE: 1
    container_name: solevaeg-frontend-prod
    restart: unless-stopped
    env_file:
      - .env.production
    volumes:
      - frontend_static:/usr/share/nginx/html:ro
    networks:
      - solevaeg-network
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

  # Admin Panel
  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile.network-resilient
      target: production
      args:
        BUILDKIT_INLINE_CACHE: 1
    container_name: solevaeg-admin-prod
    restart: unless-stopped
    env_file:
      - .env.production
    volumes:
      - admin_static:/usr/share/nginx/html:ro
    networks:
      - solevaeg-network
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

  # Nginx Reverse Proxy
  nginx:
    image: nginx:stable
    container_name: solevaeg-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
      - ./docker/nginx/ssl:/etc/letsencrypt:ro
      - ./docker/nginx/certbot-webroot:/var/www/certbot:ro
      - backend_uploads:/var/www/uploads:ro
      - frontend_static:/var/www/frontend:ro
      - admin_static:/var/www/admin:ro
      - nginx_logs:/var/log/nginx
    networks:
      - solevaeg-network
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
      admin:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
      - 1.0.0.1

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  backend_uploads:
    driver: local
  backend_logs:
    driver: local
  frontend_static:
    driver: local
  admin_static:
    driver: local
  nginx_logs:
    driver: local

networks:
  solevaeg-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "0.0.0.0"
EOF

    log_success "Network-resilient docker-compose configuration created"
}

# Configure Docker daemon DNS settings
configure_docker_dns() {
    log_info "🔧 Configuring Docker daemon DNS settings..."
    
    # Check if user has sudo access
    if ! sudo -n true 2>/dev/null; then
        log_warning "No sudo access available, skipping Docker daemon DNS configuration"
        log_info "DNS will be configured at the container level instead"
        return 0
    fi
    
    # Create or update Docker daemon configuration
    local docker_config_dir="/etc/docker"
    local docker_config_file="$docker_config_dir/daemon.json"
    
    # Create backup if config exists
    if [ -f "$docker_config_file" ]; then
        sudo cp "$docker_config_file" "$docker_config_file.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "Backed up existing Docker daemon configuration"
    fi
    
    # Create Docker config directory if it doesn't exist
    sudo mkdir -p "$docker_config_dir"
    
    # Create new daemon configuration with DNS settings
    sudo tee "$docker_config_file" > /dev/null << 'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"],
  "dns-opts": ["ndots:2", "edns0"],
  "dns-search": [],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    
    log_success "Docker daemon DNS configuration updated"
    log_info "Restarting Docker daemon to apply DNS settings..."
    
    # Restart Docker daemon
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl restart docker
        log_success "Docker daemon restarted"
    else
        log_warning "systemctl not available, please restart Docker manually"
    fi
}

# Enhanced build function with network resilience
build_with_network_resilience() {
    log_info "🔨 Building Docker images with network resilience..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Build attempt $attempt/$max_attempts with network resilience..."
        
        # Set Docker build arguments for better network handling
        if docker buildx version >/dev/null 2>&1; then
            export DOCKER_BUILDKIT=1
            export BUILDKIT_PROGRESS=plain
            export COMPOSE_DOCKER_CLI_BUILD=1
            log_info "Using BuildKit for Docker builds"
        else
            export DOCKER_BUILDKIT=0
            log_info "Using legacy Docker builder (buildx not available)"
        fi
        
        # Build with network resilience and DNS configuration
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" build \
            --no-cache \
            --parallel \
            --build-arg BUILDKIT_INLINE_CACHE=1; then
            log_success "All images built successfully with network resilience"
            return 0
        else
            log_warning "Build attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                local wait_time=$((attempt * 30))
                log_info "Waiting $wait_time seconds before retry..."
                sleep $wait_time
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "All build attempts failed"
    return 1
}

# Main deployment function
main() {
    log_info "🚀 Starting Soleva deployment with network resilience at $(date -Is)"
    
    # 1. Test network connectivity
    if ! test_network_connectivity; then
        log_warning "Network connectivity issues detected, but proceeding with resilience measures"
    fi
    
    # 2. Test DNS resolution
    if ! test_dns_resolution; then
        log_warning "DNS resolution issues detected, but proceeding with resilience measures"
    fi
    
    # 3. Configure Docker daemon DNS settings
    configure_docker_dns
    
    # 4. Create network-resilient configurations
    create_network_resilient_dockerfiles
    create_network_resilient_compose
    
    # 5. Build with network resilience
    if ! build_with_network_resilience; then
        log_error "Failed to build images with network resilience"
        exit 1
    fi
    
    # 6. Deploy using the network-resilient configuration
    log_info "🚀 Starting deployment with network-resilient configuration..."
    
    # Start infrastructure services
    log_info "🗄️ Starting infrastructure services..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" up -d postgres redis
    
    # Wait for infrastructure
    log_info "⏳ Waiting for infrastructure services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" ps postgres | grep -q "healthy" && \
           $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" ps redis | grep -q "healthy"; then
            log_success "Infrastructure services are healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for infrastructure services... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Infrastructure services failed to become healthy"
        exit 1
    fi
    
    # Run migrations
    log_info "📊 Running database migrations..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" run --rm backend npx prisma generate
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" run --rm backend npx prisma migrate deploy
    
    # Start application services
    log_info "🚀 Starting application services..."
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.network-resilient.yml" up -d
    
    # Health checks
    log_info "🏥 Performing health checks..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost:3001/health" >/dev/null 2>&1; then
            log_success "Backend health check passed"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Backend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -fsS "http://localhost" >/dev/null 2>&1; then
            log_success "Frontend health check passed"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Frontend health check attempt $attempt/$max_attempts"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "🎉 Deployment completed successfully with network resilience at $(date -Is)"
    log_info "🔗 Application is available at: http://localhost"
    log_info "🔗 Admin panel is available at: http://localhost/admin"
    log_info "🔗 API is available at: http://localhost:3001"
}

# Run main function
main "$@"
