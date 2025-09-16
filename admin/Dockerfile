# Optimized Multi-stage Dockerfile for React Admin Panel

FROM node:20-alpine3.19 AS base
WORKDIR /app

# DNS configuration is handled by docker-compose.yml

# Update Alpine repositories and install build dependencies for native modules with robust retry logic
RUN set -e && \
    # Try primary repositories first
    apk update --no-cache && \
    apk add --no-cache --virtual .build-deps python3 make g++ || \
    (echo "Primary apk add failed, trying alternative mirrors..." && \
     # Try multiple Alpine mirrors with retries
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" "https://mirror.yandex.ru/mirrors/alpine/v3.19" "https://mirrors.aliyun.com/alpine/v3.19" "https://mirror.leaseweb.com/alpine/v3.19"; do \
       echo "Trying mirror: $mirror" && \
       echo "$mirror/main" > /etc/apk/repositories && \
       echo "$mirror/community" >> /etc/apk/repositories && \
       if apk update --no-cache && apk add --no-cache --virtual .build-deps python3 make g++; then \
         echo "Successfully installed packages from $mirror" && \
         break; \
       else \
         echo "Failed to install from $mirror, trying next mirror..." && \
         sleep 2; \
       fi; \
     done)

# Configure npm for faster, more reliable installs with enhanced network resilience
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 120000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false && \
    npm config set maxsockets 15 && \

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --no-audit --no-fund || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --no-audit --no-fund --no-optional)

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
COPY package*.json ./
# Install dependencies with enhanced retry logic and offline fallback
RUN set -e && \
    echo "Installing dependencies with retry logic..." && \
    for attempt in 1 2 3; do \
      echo "Attempt $attempt/3: Installing dependencies..." && \
      if npm ci --include=dev --no-audit --no-fund --prefer-offline; then \
        echo "Dependencies installed successfully on attempt $attempt" && \
        break; \
      elif [ $attempt -eq 3 ]; then \
        echo "All attempts failed, trying npm install as fallback..." && \
        npm install --no-audit --no-fund --no-optional --prefer-offline || \
        (echo "npm install also failed, trying with different registry..." && \
         npm install --no-audit --no-fund --no-optional --registry https://registry.npmmirror.com/); \
      else \
        echo "Attempt $attempt failed, retrying in 5 seconds..." && \
        sleep 5; \
      fi; \
    done
COPY . .
# Run build with local binaries to avoid network calls
RUN echo "Starting build process..." && \
    ./node_modules/.bin/tsc && \
    ./node_modules/.bin/vite build && \
    echo "Build completed successfully"

# Production stage
FROM nginx:alpine3.19 AS production

# Update repositories and install curl for health checks with robust retry logic
RUN set -e && \
    # Try primary repositories first
    apk update --no-cache && \
    apk add --no-cache curl || \
    (echo "Primary curl install failed, trying alternative mirrors..." && \
     # Try multiple Alpine mirrors with retries
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" "https://mirror.yandex.ru/mirrors/alpine/v3.19" "https://mirrors.aliyun.com/alpine/v3.19" "https://mirror.leaseweb.com/alpine/v3.19"; do \
       echo "Trying mirror: $mirror" && \
       echo "$mirror/main" > /etc/apk/repositories && \
       echo "$mirror/community" >> /etc/apk/repositories && \
       if apk update --no-cache && apk add --no-cache curl; then \
         echo "Successfully installed curl from $mirror" && \
         break; \
       else \
         echo "Failed to install curl from $mirror, trying next mirror..." && \
         sleep 2; \
       fi; \
     done)

# Copy nginx config for SPA
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
