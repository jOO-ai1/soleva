# Base stage
FROM node:20-alpine3.19 AS base
WORKDIR /app

# DNS configuration is handled by docker-compose.yml

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

# Install production dependencies with enhanced retry logic and registry fallbacks
COPY package*.json ./
RUN set -e && \
    echo "Installing production dependencies with multiple registry fallbacks..." && \
    for attempt in 1 2 3; do \
      echo "Attempt $attempt/3: Installing production dependencies..." && \
      if npm ci --omit=dev --no-audit --no-fund; then \
        echo "Production dependencies installed successfully on attempt $attempt" && \
        break; \
      elif [ $attempt -eq 3 ]; then \
        echo "All attempts failed, trying npm install as fallback..." && \
        npm install --omit=dev --no-audit --no-fund --no-optional || \
        (echo "npm install also failed, trying with different registries..." && \
         for registry in "https://registry.npmmirror.com/" "https://registry.npm.taobao.org/" "https://registry.yarnpkg.com/"; do \
           echo "Trying registry: $registry" && \
           npm config set registry "$registry" && \
           if npm install --omit=dev --no-audit --no-fund --no-optional; then \
             echo "Successfully installed with registry: $registry" && \
             break 2; \
           fi; \
         done); \
      else \
        echo "Attempt $attempt failed, retrying in 10 seconds..." && \
        sleep 10; \
      fi; \
    done

# Build stage - install all dependencies including devDependencies for build tools
FROM base AS build
COPY package*.json ./
# Install all dependencies including devDependencies for TypeScript compilation with registry fallbacks
RUN set -e && \
    echo "Installing all dependencies (including devDependencies) with multiple registry fallbacks..." && \
    for attempt in 1 2 3; do \
      echo "Attempt $attempt/3: Installing all dependencies..." && \
      if npm ci --include=dev --no-audit --no-fund; then \
        echo "All dependencies installed successfully on attempt $attempt" && \
        break; \
      elif [ $attempt -eq 3 ]; then \
        echo "All attempts failed, trying npm install as fallback..." && \
        npm install --include=dev --no-audit --no-fund --no-optional || \
        (echo "npm install also failed, trying with different registries..." && \
         for registry in "https://registry.npmmirror.com/" "https://registry.npm.taobao.org/" "https://registry.yarnpkg.com/"; do \
           echo "Trying registry: $registry" && \
           npm config set registry "$registry" && \
           if npm install --include=dev --no-audit --no-fund --no-optional; then \
             echo "Successfully installed with registry: $registry" && \
             break 2; \
           fi; \
         done); \
      else \
        echo "Attempt $attempt failed, retrying in 10 seconds..." && \
        sleep 10; \
      fi; \
    done
COPY . .
ENV NODE_ENV=production
# Generate Prisma client before building with retry logic
RUN echo "Generating Prisma client..." && \
    i=1; while [ $i -le 3 ]; do \
      echo "Prisma generation attempt $i/3"; \
      if npx prisma generate; then \
        echo "Prisma client generated successfully"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "Prisma generation failed, retrying in 5 seconds..."; \
        sleep 5; \
      else \
        echo "Prisma generation failed after 3 attempts"; \
        exit 1; \
      fi; \
      i=$((i + 1)); \
    done
# Verify TypeScript is available and run build with retry logic
RUN i=1; while [ $i -le 3 ]; do \
      echo "Build attempt $i/3"; \
      if npx tsc --version && npm run build; then \
        echo "Build successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "Build failed, retrying in 10 seconds..."; \
        sleep 10; \
      else \
        echo "Build failed after 3 attempts"; \
        exit 1; \
      fi; \
      i=$((i + 1)); \
    done

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

# Create directories as root and set proper ownership
RUN mkdir -p /app/uploads /app/logs && chown -R backend:nodejs /app/uploads /app/logs

# Copy built files
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=base --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma
COPY --from=build --chown=backend:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=backend:nodejs start.sh ./start.sh

# Switch to non-root user
USER backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["./start.sh"]
