# Optimized Multi-stage Dockerfile for Node.js backend

# Base stage with Node.js 20 - using Alpine 3.19 for better package availability
FROM node:20-alpine3.19 AS base
WORKDIR /app

# Update Alpine repositories and install build dependencies with robust retry logic
RUN set -e && \
    # Try primary repositories first
    apk update --no-cache && \
    apk add --no-cache --virtual .build-deps python3 make g++ curl || \
    (echo "Primary apk add failed, trying alternative mirrors..." && \
     # Try multiple Alpine mirrors with retries
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" "https://mirror.yandex.ru/mirrors/alpine/v3.19" "https://mirrors.aliyun.com/alpine/v3.19" "https://mirror.leaseweb.com/alpine/v3.19"; do \
       echo "Trying mirror: $mirror" && \
       echo "$mirror/main" > /etc/apk/repositories && \
       echo "$mirror/community" >> /etc/apk/repositories && \
       if apk update --no-cache && apk add --no-cache --virtual .build-deps python3 make g++ curl; then \
         echo "Successfully installed packages from $mirror" && \
         break; \
       else \
         echo "Failed to install from $mirror, trying next mirror..." && \
         sleep 2; \
       fi; \
     done)

# Configure npm for faster, more reliable installs
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 60000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false

# Install dependencies with simplified retry logic
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --omit=dev --no-audit --no-fund --no-optional)

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --no-audit --no-fund || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --no-audit --no-fund --no-optional)
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY package*.json ./
# Install all dependencies including devDependencies for build tools like TypeScript
RUN npm ci --no-audit --no-fund || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --no-audit --no-fund --no-optional)
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine3.19 AS production

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

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma
COPY --chown=backend:nodejs start.sh ./start.sh

# Create necessary directories
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs

USER backend

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["./start.sh"]
