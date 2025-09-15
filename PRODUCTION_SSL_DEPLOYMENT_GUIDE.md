# Soleva E-commerce Platform - Production SSL Deployment Guide

This guide provides step-by-step instructions for deploying the Soleva E-commerce Platform to production with SSL certificates.

## Prerequisites

- Linux server with Docker and Docker Compose installed
- Domain name (solevaeg.com) pointing to your server's public IP
- Router access for port forwarding configuration
- SSH access to the server

## Server Information

- **Router IP**: 213.130.147.41
- **Internal Server IP**: 192.168.1.3
- **Domain**: solevaeg.com
- **Subdomains**: www.solevaeg.com, api.solevaeg.com, admin.solevaeg.com

## Step-by-Step Deployment

### Step 1: Configure Port Forwarding

First, you need to configure port forwarding on your router to allow external access to your server.

#### Option A: Automated Configuration (Recommended)

```bash
# Install sshpass if not already installed
sudo apt-get install sshpass  # Ubuntu/Debian
# or
sudo yum install sshpass      # CentOS/RHEL
# or
brew install sshpass          # macOS

# Run the router configuration script
./configure-router.sh
```

#### Option B: Manual Configuration

1. SSH into your router:
   ```bash
   ssh root@213.130.147.41
   # Password: ?nNL2agT#OojHOTT-ZZ0
   ```

2. Configure port forwarding:
   - External port 80 → 192.168.1.3:80
   - External port 443 → 192.168.1.3:443

3. Save the configuration and restart the router if necessary.

### Step 2: Verify DNS Configuration

Ensure your domain is pointing to the router's public IP:

```bash
# Check DNS resolution
nslookup solevaeg.com
nslookup www.solevaeg.com
nslookup api.solevaeg.com
nslookup admin.solevaeg.com
```

All should resolve to `213.130.147.41`.

### Step 3: Prepare Environment Configuration

1. Copy the production environment file:
   ```bash
   cp env.production .env.production
   ```

2. Update the environment variables in `.env.production`:
   - Change all `CHANGE_THIS_*` placeholders
   - Set strong passwords for database and Redis
   - Configure email settings
   - Set up AWS S3 credentials
   - Configure other service credentials

### Step 4: Deploy with SSL Certificates

Run the automated deployment script:

```bash
./deploy-production-ssl.sh
```

This script will:
- Stop existing containers
- Configure temporary Nginx for certificate generation
- Generate Let's Encrypt SSL certificates
- Apply production Nginx configuration
- Start all services
- Set up automatic certificate renewal

### Step 5: Test the Deployment

Run the comprehensive testing script:

```bash
./test-production-deployment.sh
```

This will test:
- Docker container status
- Database connectivity
- SSL certificate validity
- HTTP to HTTPS redirects
- All subdomains
- API endpoints
- Security headers
- CORS configuration

## Manual Steps (if automated scripts fail)

### Generate SSL Certificates Manually

1. Start the temporary configuration:
   ```bash
   cp docker/nginx/conf.d/solevaeg-temp.conf docker/nginx/conf.d/solevaeg.conf
   docker-compose up -d nginx
   ```

2. Generate certificates:
   ```bash
   docker-compose run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     --email admin@solevaeg.com \
     --agree-tos \
     --no-eff-email \
     -d solevaeg.com \
     -d www.solevaeg.com \
     -d api.solevaeg.com \
     -d admin.solevaeg.com
   ```

3. Apply production configuration:
   ```bash
   # Restore the production configuration
   git checkout docker/nginx/conf.d/solevaeg.conf
   docker-compose restart nginx
   ```

### Set Up Certificate Auto-Renewal

1. Create renewal script:
   ```bash
   cat > renew-ssl.sh << 'EOF'
   #!/bin/bash
   cd /home/youssef/web
   docker-compose run --rm certbot renew
   docker-compose restart nginx
   EOF
   
   chmod +x renew-ssl.sh
   ```

2. Add to crontab:
   ```bash
   # Run twice daily at 2 AM and 2 PM
   (crontab -l 2>/dev/null; echo "0 2,14 * * * /home/youssef/web/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
   ```

## Verification Checklist

After deployment, verify the following:

- [ ] **HTTP to HTTPS Redirect**: `http://solevaeg.com` redirects to `https://solevaeg.com`
- [ ] **Main Site**: `https://solevaeg.com` loads correctly
- [ ] **www Subdomain**: `https://www.solevaeg.com` loads correctly
- [ ] **API Subdomain**: `https://api.solevaeg.com` is accessible
- [ ] **Admin Subdomain**: `https://admin.solevaeg.com` is accessible
- [ ] **SSL Certificates**: Valid and trusted certificates
- [ ] **Security Headers**: HSTS, X-Frame-Options, etc. are present
- [ ] **Database**: PostgreSQL is running and accessible
- [ ] **Redis**: Redis is running and accessible
- [ ] **File Uploads**: Upload functionality works
- [ ] **API Endpoints**: All API endpoints respond correctly

## Troubleshooting

### Common Issues

1. **Port Forwarding Not Working**
   - Verify router configuration
   - Check firewall settings
   - Test with `telnet 213.130.147.41 80`

2. **SSL Certificate Generation Fails**
   - Ensure port 80 is accessible from outside
   - Check domain DNS resolution
   - Verify no other service is using port 80

3. **Services Not Starting**
   - Check Docker logs: `docker-compose logs`
   - Verify environment variables
   - Check disk space and memory

4. **Database Connection Issues**
   - Verify PostgreSQL is running: `docker-compose ps postgres`
   - Check database credentials in environment file
   - Review database logs: `docker-compose logs postgres`

### Useful Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check SSL certificate
openssl s_client -connect solevaeg.com:443 -servername solevaeg.com

# Test external connectivity
curl -I http://solevaeg.com
curl -I https://solevaeg.com

# Check certificate renewal
docker-compose run --rm certbot certificates
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.production` to version control
2. **Database Passwords**: Use strong, unique passwords
3. **JWT Secrets**: Use cryptographically secure random strings
4. **Firewall**: Configure appropriate firewall rules
5. **Updates**: Regularly update Docker images and system packages
6. **Monitoring**: Set up monitoring and alerting for the production environment

## Monitoring and Maintenance

1. **Certificate Renewal**: Certificates auto-renew via cron job
2. **Log Monitoring**: Check logs regularly for errors
3. **Backup**: Set up regular database backups
4. **Updates**: Keep Docker images and system packages updated
5. **Performance**: Monitor resource usage and performance

## Support

If you encounter issues during deployment:

1. Check the logs: `docker-compose logs`
2. Run the test script: `./test-production-deployment.sh`
3. Verify network connectivity and DNS resolution
4. Check router port forwarding configuration

## Production URLs

After successful deployment, your application will be available at:

- **Main Site**: https://solevaeg.com
- **www**: https://www.solevaeg.com
- **API**: https://api.solevaeg.com
- **Admin Panel**: https://admin.solevaeg.com

---

**Note**: This deployment guide assumes you have the necessary permissions and access to configure the router and server. Always test in a staging environment before deploying to production.
