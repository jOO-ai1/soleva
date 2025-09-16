# Docker Build Guide

This guide provides multiple approaches to build the Docker services, addressing network connectivity issues and DNS resolution problems.

## 🚀 Quick Start

### Option 1: Enhanced Build Script (Recommended)
```bash
# Build all services with enhanced network configuration
./build-with-dns.sh

# Build specific service
./build-with-dns.sh backend
./build-with-dns.sh frontend
./build-with-dns.sh admin

# Test DNS resolution only
./build-with-dns.sh test-dns
```

### Option 2: Offline Build (For Poor Network)
```bash
# First, prepare offline build contexts (requires network)
./prepare-offline-build.sh

# Then build without network access
./build-offline.sh

# Build specific service offline
./build-offline.sh backend
./build-offline.sh frontend
./build-offline.sh admin
```

### Option 3: Standard Docker Compose
```bash
# Build with host network configuration
docker-compose build

# Run services
docker-compose up
```

## 🔧 Network Configuration

### DNS Configuration
The project uses multiple DNS servers for redundancy:
- **Google DNS**: 8.8.8.8, 8.8.4.4
- **Cloudflare DNS**: 1.1.1.1, 1.0.0.1

### Build Network Modes
- **Host Network**: Build processes use host network for better connectivity
- **Bridge Network**: Runtime containers use isolated bridge network
- **DNS Fallbacks**: Multiple npm registries for package installation

## 📦 Build Strategies

### 1. Enhanced Build Script (`build-with-dns.sh`)
- Tests DNS resolution before building
- Uses host network for builds
- Falls back to individual builds if docker-compose fails
- Comprehensive error handling

### 2. Offline Build (`build-offline.sh`)
- Pre-downloads all dependencies
- Builds without network access
- Useful for unreliable network environments
- Requires initial network access for preparation

### 3. Docker Compose Build
- Standard docker-compose build process
- Uses host network for builds
- Integrated with docker-compose.yml configuration

## 🛠️ Troubleshooting

### DNS Resolution Issues
```bash
# Test DNS resolution
./build-with-dns.sh test-dns

# Check Docker daemon DNS configuration
docker info | grep -i dns
```

### Network Connectivity Issues
```bash
# Use offline build approach
./prepare-offline-build.sh
./build-offline.sh

# Or build with host network directly
docker build --network=host -f Dockerfile.frontend .
```

### Build Failures
```bash
# Clean build with no cache
docker-compose build --no-cache

# Or use enhanced build script
./build-with-dns.sh
```

## 📁 File Structure

```
├── build-with-dns.sh          # Enhanced build script
├── build-offline.sh           # Offline build script
├── prepare-offline-build.sh   # Offline build preparation
├── daemon.json                # Docker daemon configuration
├── docker-compose.yml         # Service configuration
├── Dockerfile.frontend        # Frontend Dockerfile
├── backend/Dockerfile         # Backend Dockerfile
├── admin/Dockerfile           # Admin Dockerfile
└── offline-build/             # Offline build contexts (created)
```

## 🔍 Build Process Details

### Frontend Build
1. **Base Stage**: Installs dependencies with npm registry fallbacks
2. **Build Stage**: Compiles with Vite using retry logic
3. **Production Stage**: Serves with nginx

### Backend Build
1. **Base Stage**: Installs production dependencies
2. **Build Stage**: Installs all dependencies + TypeScript compilation
3. **Production Stage**: Runs Node.js application

### Admin Build
1. **Base Stage**: Installs dependencies with fallbacks
2. **Deps Stage**: Separate dependency installation
3. **Build Stage**: TypeScript + Vite compilation
4. **Production Stage**: Serves with nginx

## 🌐 Network Resilience Features

### npm Registry Fallbacks
- Primary: `https://registry.npmjs.org/`
- Fallback 1: `https://registry.npmmirror.com/`
- Fallback 2: `https://registry.npm.taobao.org/`
- Fallback 3: `https://registry.yarnpkg.com/`

### Alpine Mirror Fallbacks
- Primary: `https://dl-cdn.alpinelinux.org/alpine/v3.19`
- Multiple geographic mirrors for redundancy

### Retry Logic
- 3 attempts for dependency installation
- 3 attempts for build processes
- 10-second delays between attempts
- Comprehensive error logging

## 🚀 Production Deployment

After successful build:
```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

## 📋 Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Internet access (for initial dependency download)
- 4GB+ available disk space
- 2GB+ available RAM

## 🔧 Configuration Files

### docker-compose.yml
- DNS configuration for all services
- Host network for builds
- Health checks and monitoring
- Volume and network configuration

### daemon.json
- Docker daemon DNS configuration
- Logging configuration
- Build optimization settings

## 📞 Support

If you encounter issues:
1. Check DNS resolution: `./build-with-dns.sh test-dns`
2. Try offline build: `./prepare-offline-build.sh && ./build-offline.sh`
3. Check Docker daemon configuration
4. Verify network connectivity
5. Review build logs for specific errors
