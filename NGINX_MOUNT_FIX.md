# Nginx Docker Mount Fix

This guide addresses the Docker volume mount error: "Are you trying to mount a directory onto a file (or vice-versa)?" for the Nginx container.

## ✅ Problem Fixed

**Issue**: Docker was unable to mount the Nginx configuration file due to mount type conflicts and read-only filesystem issues.

**Root Causes**:
1. **Mount type mismatch**: Potential conflict between source and target file types
2. **Read-only filesystem**: Default.conf file was read-only, preventing modifications
3. **Configuration conflicts**: Default.conf and production.conf were conflicting
4. **Volume mount issues**: Docker couldn't properly mount the configuration file

**Solution**: Created a custom Nginx Docker image that removes default.conf and includes our production configuration.

## 🔧 Changes Made

### 1. **Created Custom Nginx Dockerfile**
```dockerfile
FROM nginx:alpine

# Remove the default.conf file to avoid conflicts
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/production.conf /etc/nginx/conf.d/production.conf

# Create necessary directories
RUN mkdir -p /var/www/certbot /var/log/nginx

# Set proper permissions
RUN chown -R nginx:nginx /var/www/certbot /var/log/nginx

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. **Updated docker-compose.yml Nginx Service**
```yaml
nginx:
  build:
    context: ./docker/nginx
    dockerfile: Dockerfile
  container_name: solevaeg-nginx
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./docker/nginx/ssl:/etc/letsencrypt:ro
    - ./docker/nginx/certbot-webroot:/var/www/certbot:ro
    - backend_uploads:/var/www/uploads:ro
    - frontend_static:/var/www/frontend:ro
    - nginx_logs:/var/log/nginx
  networks:
    - solevaeg-network
  depends_on:
    - frontend
    - backend
    - admin
```

### 3. **Created .dockerignore File**
```
ssl/
certbot-webroot/
*.log
*.tmp
.DS_Store
Thumbs.db
```

### 4. **Created Utility Scripts**
- `remove-default-conf.sh`: Script to remove default.conf from running container

## 🚀 How to Use

### **Build and Start Nginx**
```bash
# Build the custom Nginx image
docker-compose build nginx

# Start Nginx container
docker-compose up nginx

# Or start all services
docker-compose up -d
```

### **Test Nginx Configuration**
```bash
# Test Nginx configuration
docker-compose exec nginx nginx -t

# Reload Nginx configuration
docker-compose exec nginx nginx -s reload

# Check Nginx status
docker-compose exec nginx nginx -s status
```

### **Debug Nginx Issues**
```bash
# View Nginx logs
docker-compose logs nginx

# Access Nginx container shell
docker-compose exec nginx sh

# Check configuration files
docker-compose exec nginx ls -la /etc/nginx/conf.d/
```

## 🔍 Configuration Details

### **File Structure**
```
docker/nginx/
├── Dockerfile
├── .dockerignore
├── nginx.conf
├── conf.d/
│   └── production.conf
├── ssl/
├── certbot-webroot/
└── remove-default-conf.sh
```

### **Volume Mounts**
- **SSL Certificates**: `./docker/nginx/ssl:/etc/letsencrypt:ro`
- **Certbot Webroot**: `./docker/nginx/certbot-webroot:/var/www/certbot:ro`
- **Backend Uploads**: `backend_uploads:/var/www/uploads:ro`
- **Frontend Static**: `frontend_static:/var/www/frontend:ro`
- **Nginx Logs**: `nginx_logs:/var/log/nginx`

### **Network Configuration**
- **Network**: `solevaeg-network`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Dependencies**: frontend, backend, admin

## 🛠️ Troubleshooting

### **Common Issues and Solutions**

#### 1. **"Are you trying to mount a directory onto a file?"**
```bash
# Solution: Use custom Docker image instead of volume mounts
docker-compose build nginx
docker-compose up nginx
```

#### 2. **"can not modify /etc/nginx/conf.d/default.conf (read-only file system?)"**
```bash
# Solution: Remove default.conf in Dockerfile
# This is already handled in our custom Dockerfile
```

#### 3. **"host not found in upstream"**
```bash
# Solution: Start all services together
docker-compose up -d
# Or start dependencies first
docker-compose up -d backend frontend admin
docker-compose up nginx
```

#### 4. **Build context errors**
```bash
# Solution: Check .dockerignore file
# Ensure ssl/ and certbot-webroot/ are excluded
```

#### 5. **Permission issues**
```bash
# Solution: Check file permissions
chmod 644 docker/nginx/nginx.conf
chmod 644 docker/nginx/conf.d/production.conf
```

### **Verification Commands**
```bash
# Check if Nginx is running
docker-compose ps nginx

# Test Nginx configuration
docker-compose exec nginx nginx -t

# Check configuration files
docker-compose exec nginx ls -la /etc/nginx/conf.d/

# View Nginx logs
docker-compose logs nginx

# Test HTTP access
curl -I http://localhost
```

## 📋 System Requirements

### **Docker Configuration**
- Docker 20.10+
- Docker Compose 2.0+
- Build context access to `./docker/nginx/`

### **File Requirements**
- `docker/nginx/nginx.conf`: Main Nginx configuration
- `docker/nginx/conf.d/production.conf`: Production server configuration
- `docker/nginx/Dockerfile`: Custom Nginx image definition

### **Permissions**
- Read access to configuration files
- Write access to build context
- Docker daemon access

## 🔧 Advanced Configuration

### **Custom Configuration Updates**
To update Nginx configuration:
1. Edit `docker/nginx/nginx.conf` or `docker/nginx/conf.d/production.conf`
2. Rebuild the image: `docker-compose build nginx`
3. Restart the container: `docker-compose up -d nginx`

### **SSL Certificate Management**
```bash
# Generate SSL certificates
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d solevaeg.com

# Renew SSL certificates
docker-compose run --rm certbot renew
```

### **Log Management**
```bash
# View access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# View error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log

# Rotate logs
docker-compose exec nginx nginx -s reopen
```

## 📞 Support

If you encounter issues:

1. **Check Docker build**: `docker-compose build nginx`
2. **Verify configuration**: `docker-compose exec nginx nginx -t`
3. **Check logs**: `docker-compose logs nginx`
4. **Test connectivity**: `curl -I http://localhost`
5. **Verify dependencies**: `docker-compose ps`
6. **Check file permissions**: `ls -la docker/nginx/`

## ✅ Success Indicators

The Nginx mount fix is successful when:
- ✅ `docker-compose build nginx` completes without errors
- ✅ `docker-compose up nginx` starts without mount errors
- ✅ No "Are you trying to mount a directory onto a file?" errors
- ✅ No "can not modify /etc/nginx/conf.d/default.conf" warnings
- ✅ Nginx configuration loads successfully
- ✅ HTTP/HTTPS ports are accessible
- ✅ Upstream services are reachable when running

## 🎯 Key Improvements

### **Mount Configuration**
- **Custom Docker image**: Eliminates volume mount conflicts
- **Built-in configuration**: Configuration files are part of the image
- **No read-only issues**: Default.conf is removed during build
- **Proper permissions**: Files have correct ownership and permissions

### **Docker Compose**
- **Build context**: Uses local Dockerfile instead of external image
- **Simplified volumes**: Only mounts necessary runtime data
- **Better isolation**: Configuration is immutable in the image
- **Easier updates**: Rebuild image to update configuration

### **Troubleshooting**
- **Clear error messages**: No more mount type confusion
- **Predictable behavior**: Configuration is consistent across deployments
- **Easy debugging**: Clear separation between build-time and runtime
- **Better logging**: Nginx logs are properly accessible

## 🔍 Technical Details

### **Before vs After**

#### **Before (Volume Mount Approach)**
```yaml
volumes:
  - ./docker/nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
```
**Issues**:
- Mount type conflicts
- Read-only filesystem errors
- Default.conf conflicts
- Permission issues

#### **After (Custom Image Approach)**
```dockerfile
RUN rm -f /etc/nginx/conf.d/default.conf
COPY conf.d/production.conf /etc/nginx/conf.d/production.conf
```
**Benefits**:
- No mount conflicts
- No read-only issues
- Clean configuration
- Proper permissions

### **Build Process**
1. **Base Image**: Start with nginx:alpine
2. **Remove Conflicts**: Delete default.conf
3. **Copy Configuration**: Add our production.conf
4. **Set Permissions**: Ensure proper ownership
5. **Create Directories**: Set up required paths
6. **Expose Ports**: Configure HTTP/HTTPS access

### **Runtime Behavior**
- **Configuration**: Loaded from built-in files
- **Volumes**: Only mount runtime data (SSL, logs, uploads)
- **Networking**: Connected to solevaeg-network
- **Dependencies**: Waits for backend, frontend, admin services
