# Complete Deployment Automation Guide

## 🚀 One-Command Deployment

### Quick Start (Development)
```bash
./deploy.sh
```

### Production Deployment
```bash
./deploy-production.sh
```

### Manual Complete Deployment
```bash
./deploy-complete.sh
```

## 📋 What Each Script Does

### `deploy.sh` - Quick Development Deployment
- **Purpose**: Simple one-command deployment for development
- **Features**:
  - Runs the complete deployment script
  - Provides quick access to the website
  - Perfect for development and testing

### `deploy-production.sh` - Production Deployment
- **Purpose**: Production-ready deployment with SSL and domain configuration
- **Features**:
  - Uses production docker-compose configuration
  - Validates production environment file
  - Optimized for production performance
  - Includes SSL certificate handling

### `deploy-complete.sh` - Comprehensive Deployment
- **Purpose**: Complete automated setup and deployment
- **Features**:
  - ✅ **Pre-deployment checks**: Validates Docker, files, and dependencies
  - ✅ **Dependency installation**: Installs frontend, backend, and admin dependencies
  - ✅ **Vite configuration**: Ensures correct base path and asset generation
  - ✅ **Volume cleanup**: Removes old volumes to prevent asset conflicts
  - ✅ **Service building**: Builds all containers with --no-cache
  - ✅ **Database setup**: Starts PostgreSQL and Redis
  - ✅ **Service orchestration**: Starts all services in correct order
  - ✅ **Asset verification**: Ensures HTML references match actual files
  - ✅ **Database migrations**: Runs any available migrations
  - ✅ **Comprehensive testing**: Verifies all endpoints and services
  - ✅ **Error handling**: Automatic fixes and detailed error reporting

## 🔧 Automated Fixes Included

### Frontend White Screen Fix
- **Problem**: HTML references old asset hashes, actual files have new hashes
- **Solution**: 
  - Temporarily removes volume mounts
  - Rebuilds with --no-cache
  - Verifies asset consistency
  - Restores volume mounts after verification

### Asset Consistency
- **Problem**: Mismatch between HTML references and actual files
- **Solution**:
  - Compares HTML asset references with actual files
  - Reports mismatches with detailed diagnostics
  - Provides automatic fixes when possible

### Nginx SPA Routing
- **Problem**: Single Page Application routing not working
- **Solution**:
  - Configures `try_files $uri $uri/ /index.html`
  - Ensures all routes serve the React app
  - Proper static asset handling

### Volume Management
- **Problem**: Old build files persisting in volumes
- **Solution**:
  - Clears old volumes before deployment
  - Prevents asset conflicts
  - Ensures fresh builds

## 📊 Deployment Process

### Step 1: Pre-deployment Checks
- Validates Docker installation and daemon
- Checks for required files
- Verifies project structure

### Step 2: Cleanup
- Stops existing containers
- Removes old volumes
- Cleans up old images

### Step 3: Dependencies
- Installs frontend dependencies (npm install)
- Installs backend dependencies
- Installs admin dependencies
- Handles registry fallbacks

### Step 4: Configuration
- Ensures Vite base path is set to '/'
- Validates docker-compose configurations
- Checks Nginx SPA routing

### Step 5: Building
- Builds frontend with --no-cache
- Builds backend with --no-cache
- Builds admin with --no-cache
- Builds nginx with --no-cache

### Step 6: Service Startup
- Starts PostgreSQL database
- Starts Redis cache
- Starts backend API
- Starts frontend (without volume mount)
- Starts admin panel
- Starts nginx reverse proxy

### Step 7: Verification
- Tests frontend accessibility
- Tests backend API health
- Tests admin panel access
- Verifies asset consistency
- Runs database migrations

### Step 8: Final Validation
- Comprehensive endpoint testing
- Asset loading verification
- Service health checks
- Error reporting and fixes

## 🌐 Service URLs

After successful deployment:

- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **Admin Panel**: http://localhost:3002
- **Health Check**: http://localhost/health

## 📝 Logging and Monitoring

### Log Files
- **Deployment Log**: `deployment-YYYYMMDD_HHMMSS.log`
- **Container Logs**: `docker-compose logs`
- **Nginx Logs**: `docker-compose logs nginx`

### Monitoring Commands
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx

# Monitor resource usage
docker stats
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### White Screen Issue
```bash
# Run asset consistency check
./verify-asset-consistency.sh

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

#### Asset 404 Errors
```bash
# Check asset files in container
docker exec -it solevaeg-frontend ls /usr/share/nginx/html/assets/

# Verify HTML references
docker exec -it solevaeg-frontend grep -o 'assets/[^"]*' /usr/share/nginx/html/index.html
```

#### Service Not Starting
```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose build --no-cache [service-name]
docker-compose up -d [service-name]
```

#### Database Connection Issues
```bash
# Check database status
docker exec -it solevaeg-postgres pg_isready -U solevaeg -d solevaeg_db

# Check Redis
docker exec -it solevaeg-redis redis-cli ping
```

## 🚀 Production Considerations

### Environment Variables
Ensure `.env.production` contains:
- Database credentials
- Redis configuration
- API keys and secrets
- Domain configuration
- SSL certificate paths

### SSL Configuration
- Place SSL certificates in `docker/nginx/ssl/`
- Update domain names in nginx configuration
- Run certbot for Let's Encrypt certificates

### Performance Optimization
- Enable gzip compression
- Configure static asset caching
- Set up CDN if needed
- Monitor resource usage

### Security
- Use strong passwords
- Enable firewall rules
- Regular security updates
- Monitor access logs

## 📈 Success Metrics

A successful deployment should show:
- ✅ All containers running without errors
- ✅ Frontend loads without white screen
- ✅ All assets load without 404 errors
- ✅ Backend API responds to health checks
- ✅ Admin panel is accessible
- ✅ Database connections are working
- ✅ No JavaScript errors in browser console

## 🎯 Next Steps After Deployment

1. **Test all functionality** - Navigate through the website
2. **Check browser console** - Look for any JavaScript errors
3. **Test API endpoints** - Verify backend functionality
4. **Monitor logs** - Watch for any issues
5. **Set up monitoring** - Consider adding application monitoring
6. **Backup strategy** - Implement regular backups
7. **Update documentation** - Document any custom configurations

## 🆘 Support

If you encounter issues:
1. Check the deployment log file
2. Run the verification scripts
3. Check container logs
4. Review this guide for troubleshooting steps
5. Ensure all prerequisites are met

The deployment automation handles most common issues automatically, but manual intervention may be needed for complex scenarios.
