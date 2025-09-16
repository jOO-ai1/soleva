# Multi-stage Dockerfile for Node.js backend

# Base stage with Node.js 20 LTS (fixes dependency compatibility issues)
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

# Install dependencies with aggressive retry logic and fallback strategies
COPY package*.json ./
RUN for strategy in "npm ci --omit=dev" "npm install --omit=dev --no-optional" "npm install --omit=dev --legacy-peer-deps"; do \
        echo "Trying strategy: $strategy"; \
        for i in 1 2 3; do \
            echo "Attempt $i for strategy: $strategy"; \
            if timeout 600 $strategy; then \
                echo "Strategy $strategy succeeded on attempt $i"; \
                npm cache clean --force; \
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
             npm install --omit=dev --no-optional)

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN for strategy in "npm ci" "npm install --no-optional" "npm install --legacy-peer-deps"; do \
        echo "Trying dev strategy: $strategy"; \
        for i in 1 2 3; do \
            echo "Dev attempt $i for strategy: $strategy"; \
            if timeout 600 $strategy; then \
                echo "Dev strategy $strategy succeeded on attempt $i"; \
                break 2; \
            else \
                echo "Dev strategy $strategy attempt $i failed, retrying..."; \
                sleep 15; \
            fi; \
        done; \
        echo "Dev strategy $strategy failed all attempts, trying next..."; \
        sleep 10; \
    done
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY package*.json ./
RUN for strategy in "npm ci" "npm install --no-optional" "npm install --legacy-peer-deps"; do \
        echo "Trying build strategy: $strategy"; \
        for i in 1 2 3; do \
            echo "Build attempt $i for strategy: $strategy"; \
            if timeout 600 $strategy; then \
                echo "Build strategy $strategy succeeded on attempt $i"; \
                break 2; \
            else \
                echo "Build strategy $strategy attempt $i failed, retrying..."; \
                sleep 15; \
            fi; \
        done; \
        echo "Build strategy $strategy failed all attempts, trying next..."; \
        sleep 10; \
    done
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl with retry logic and alternative repositories
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

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma

# Create necessary directories
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs

USER backend

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
