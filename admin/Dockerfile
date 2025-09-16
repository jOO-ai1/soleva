# Multi-stage Dockerfile for React Admin Panel

FROM node:20-alpine AS base
WORKDIR /app

# Configure npm for better reliability with multiple strategies
RUN npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-factor 1.5 && \
    npm config set fetch-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN for strategy in "npm ci" "npm install --no-optional" "npm install --legacy-peer-deps"; do \
        echo "Trying strategy: $strategy"; \
        for i in 1 2 3; do \
            echo "Attempt $i for strategy: $strategy"; \
            if timeout 600 $strategy; then \
                echo "Strategy $strategy succeeded on attempt $i"; \
                break 2; \
            else \
                echo "Strategy $strategy attempt $i failed, retrying..."; \
                sleep 15; \
            fi; \
        done; \
        echo "Strategy $strategy failed all attempts, trying next..."; \
        sleep 10; \
    done || (echo "All npm strategies failed, trying with alternative registry..." && \
             npm config set registry https://registry.npmmirror.com/ && \
             npm install --no-optional)

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks with retry logic and alternative repositories
RUN for i in 1 2 3; do \
        apk update --no-cache && \
        apk add --no-cache curl && \
        break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done || \
    (echo "Using alternative repository..." && \
     sed -i 's/dl-cdn.alpinelinux.org/mirror.yandex.ru\/mirrors\/alpine/g' /etc/apk/repositories && \
     apk update --no-cache && \
     apk add --no-cache curl)

# Copy nginx config for SPA
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
