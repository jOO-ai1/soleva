# Base stage
FROM node:20-alpine3.19 AS base
WORKDIR /app

# Install build dependencies with robust mirror fallback
RUN set -e && \
    apk update --no-cache && apk add --no-cache python3 make g++ curl || \
    (echo "Primary package install failed, trying alternative mirrors..." && \
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" \
                   "https://mirror.yandex.ru/mirrors/alpine/v3.19" \
                   "https://mirrors.aliyun.com/alpine/v3.19" \
                   "https://mirror.leaseweb.com/alpine/v3.19" \
                   "https://mirror.xtom.com/alpine/v3.19" \
                   "https://mirror.clarkson.edu/alpine/v3.19" \
                   "https://mirror.one.com/alpine/v3.19" \
                   "https://mirror.ams1.nl.leaseweb.net/alpine/v3.19"; do \
       echo "Trying mirror: $mirror"; \
       echo "$mirror/main" > /etc/apk/repositories; \
       echo "$mirror/community" >> /etc/apk/repositories; \
       if apk update --no-cache && apk add --no-cache python3 make g++ curl; then \
         echo "Successfully installed packages from $mirror"; \
         break; \
       else \
         echo "Failed to install from $mirror, trying next mirror..."; \
         sleep 2; \
       fi; \
     done)

# Configure npm
RUN npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 120000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set prefer-online true && \
    npm config set audit false && \
    npm config set fund false && \
    npm config set maxsockets 15

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund --no-optional

# Build stage - install all dependencies including devDependencies for build tools
FROM base AS build
COPY package*.json ./
# Install all dependencies including devDependencies for TypeScript compilation
RUN npm ci --include=dev --no-audit --no-fund || npm install --include=dev --no-audit --no-fund --no-optional
COPY . .
ENV NODE_ENV=production
# Verify TypeScript is available and run build
RUN npx tsc --version && npm run build

# Production stage
FROM node:20-alpine3.19 AS production
WORKDIR /app

# Install curl for health checks with robust mirror fallback
RUN set -e && \
    apk update --no-cache && apk add --no-cache curl || \
    (echo "Primary curl install failed, trying alternative mirrors..." && \
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" \
                   "https://mirror.yandex.ru/mirrors/alpine/v3.19" \
                   "https://mirrors.aliyun.com/alpine/v3.19" \
                   "https://mirror.leaseweb.com/alpine/v3.19" \
                   "https://mirror.xtom.com/alpine/v3.19" \
                   "https://mirror.clarkson.edu/alpine/v3.19"; do \
       echo "Trying mirror: $mirror"; \
       echo "$mirror/main" > /etc/apk/repositories; \
       echo "$mirror/community" >> /etc/apk/repositories; \
       if apk update --no-cache && apk add --no-cache curl; then \
         echo "Successfully installed curl from $mirror"; \
         break; \
       else \
         echo "Failed to install curl from $mirror, trying next mirror..."; \
         sleep 2; \
       fi; \
     done)

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S backend -u 1001
USER backend

# Copy built files
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=base --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma
COPY --chown=backend:nodejs start.sh ./start.sh

# Create directories
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["./start.sh"]
