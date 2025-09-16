# Base stage
FROM node:20-alpine3.19 AS base
WORKDIR /app

# Install build dependencies with retry logic
RUN set -e && \
    apk update --no-cache && \
    apk add --no-cache python3 make g++ curl || \
    (echo "Trying alternative mirrors..." && \
     for mirror in "https://dl-cdn.alpinelinux.org/alpine/v3.19" \
                   "https://mirror.yandex.ru/mirrors/alpine/v3.19" \
                   "https://mirrors.aliyun.com/alpine/v3.19" \
                   "https://mirror.leaseweb.com/alpine/v3.19"; do \
       echo "Using mirror: $mirror"; \
       echo "$mirror/main" > /etc/apk/repositories; \
       echo "$mirror/community" >> /etc/apk/repositories; \
       if apk update --no-cache && apk add --no-cache python3 make g++ curl; then break; fi; \
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

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund --no-optional

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npx tsc && npx vite build

# Production stage
FROM nginx:alpine3.19 AS production
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
