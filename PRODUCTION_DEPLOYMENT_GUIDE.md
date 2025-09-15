# 🚀 Soleva E-commerce Platform - Production Deployment Guide

## 📋 Overview

This guide provides complete instructions for deploying the Soleva E-commerce Platform to production using a single command. The deployment system is designed to be:

- **100% Automated**: Single command deployment
- **Idempotent**: Safe to run multiple times
- **Zero-downtime**: No service interruption during deployment
- **Self-healing**: Automatic rollback on failure
- **Secure**: SSL certificates, security headers, and best practices

## 🎯 Quick Start

### Single Command Deployment

```bash
./deploy.sh
```

That's it! The script handles everything automatically.

## 📁 Project Structure

```
soleva-web/
├── deploy.sh                    # Main deployment script
├── docker-compose.prod.yml      # Production Docker Compose
├── .env.example                 # Environment template
├── .env.production              # Production environment (create this)
├── docker/
│   └── nginx/
│       ├── nginx.conf           # Main Nginx config
│       ├── conf.d/
│       │   └── production.conf  # Production server blocks
│       ├── frontend.conf        # Frontend container config
│       └── admin.conf           # Admin container config
├── backend/                     # NestJS Backend
├── admin/                       # React Admin Panel
└── src/                         # React Frontend
```

## 🔧 Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **CPU**: Minimum 2 cores, Recommended 4+ cores

### Software Requirements

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: Latest version
- **curl**: For health checks

### Network Requirements

- **Ports**: 80 (HTTP), 443 (HTTPS), 3001 (Backend - internal)
- **Domain**: Valid domain name pointing to server
- **DNS**: A records for domain, www, api, and admin subdomains

## 🛠️ Setup Instructions

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Logout and login to apply Docker group changes
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/soleva-web.git
cd soleva-web
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit with your actual values
nano .env.production
```

### 4. Deploy

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🔐 Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `solevaeg.com` |
| `POSTGRES_PASSWORD` | Database password | `SecurePassword123!` |
| `REDIS_PASSWORD` | Redis password | `RedisPassword456!` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `Your64CharacterSecretKeyHere...` |
| `ADMIN_EMAIL` | Admin email for SSL | `admin@solevaeg.com` |
| `ADMIN_PASSWORD` | Admin panel password | `SecureAdminPass789!` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_CHAT_WIDGET` | Enable AI chat widget | `true` |
| `ENABLE_SOCIAL_LOGIN` | Enable Google/Facebook login | `true` |
| `ENABLE_ANALYTICS` | Enable Google Analytics | `true` |
| `LOG_LEVEL` | Logging level | `info` |

## 🏗️ Architecture

### Services

1. **PostgreSQL**: Database server
2. **Redis**: Caching and session storage
3. **Backend**: NestJS API server
4. **Frontend**: React application
5. **Admin**: React admin panel
6. **Nginx**: Reverse proxy and SSL termination

### Network Flow

```
Internet → Nginx (SSL) → Frontend/Admin/Backend → Database/Redis
```

### Health Checks

- **Backend**: `GET /health` endpoint
- **Frontend**: HTTP 200 response
- **Admin**: HTTP 200 response
- **Database**: `pg_isready` command
- **Redis**: `ping` command

## 🔒 Security Features

### SSL/TLS

- **Let's Encrypt**: Automatic certificate provisioning
- **Auto-renewal**: Certbot timer for certificate renewal
- **HSTS**: HTTP Strict Transport Security headers
- **OCSP Stapling**: Online Certificate Status Protocol

### Security Headers

- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **X-XSS-Protection**: XSS protection
- **Content-Security-Policy**: CSP headers
- **Referrer-Policy**: Control referrer information

### Rate Limiting

- **API**: 10 requests/second per IP
- **Auth**: 5 requests/minute per IP
- **Burst**: Configurable burst limits

## 📊 Monitoring & Logs

### Health Monitoring

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f [service]

# Check health endpoints
curl -I https://yourdomain.com
curl -I https://api.yourdomain.com/health
curl -I https://admin.yourdomain.com
```

### Log Locations

- **Application logs**: `backend/logs/`
- **Nginx logs**: `docker/nginx/logs/`
- **Docker logs**: `docker compose logs`

## 🔄 Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back on failure:

1. Stops new containers
2. Starts previous containers (if available)
3. Logs rollback actions

### Manual Rollback

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Start previous deployment (if available)
docker compose -f docker-compose.yml up -d

# Or restore from backup
git checkout [previous-commit]
./deploy.sh
```

### Database Rollback

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U solevaeg_user -d solevaeg_prod

# Run rollback migrations (if available)
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate reset
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # or nginx
sudo systemctl disable apache2
```

#### 2. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

#### 3. Database Connection Issues

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U solevaeg_user
```

#### 4. Memory Issues

```bash
# Check memory usage
free -h
docker stats

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Debug Mode

```bash
# Run with debug output
bash -x ./deploy.sh

# Check individual service logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs nginx
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_products_category ON products(category_id);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
```

### Redis Optimization

```bash
# Configure Redis for production
# Edit redis.conf in docker-compose.prod.yml
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Nginx Optimization

```nginx
# Add to nginx.conf for better performance
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

## 🔧 Maintenance

### Regular Tasks

#### Weekly

- Check SSL certificate expiration
- Review application logs
- Monitor disk space usage
- Update system packages

#### Monthly

- Review security updates
- Backup database
- Performance analysis
- Update dependencies

### Backup Procedures

```bash
# Database backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U solevaeg_user solevaeg_prod > backup_$(date +%Y%m%d).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env.production docker/nginx/
```

## 📞 Support

### Getting Help

1. **Check logs**: Always start with application logs
2. **Review documentation**: Check this guide and README files
3. **Search issues**: Look for similar problems in GitHub issues
4. **Create issue**: Provide detailed logs and environment info

### Emergency Contacts

- **Technical Lead**: [Your Contact]
- **DevOps Team**: [Your Contact]
- **Hosting Provider**: [Your Contact]

## 📝 Changelog

### Version 1.0.0
- Initial production deployment system
- Single-command deployment
- SSL automation
- Health checks and monitoring
- Comprehensive documentation

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Soleva Development Team