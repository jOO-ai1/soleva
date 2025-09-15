# Optimized Multi-stage Dockerfile for Node.js backend

# Base stage with Node.js 20
FROM node:20-alpine AS base
WORKDIR /app

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
RUN npm ci --no-audit --no-fund || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --no-audit --no-fund --no-optional)
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

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
