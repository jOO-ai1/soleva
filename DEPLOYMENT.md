# Soleva E-commerce Platform - Production Deployment Guide

This guide provides step-by-step instructions for deploying the Soleva E-commerce Platform to production on Ubuntu + Docker.

## 🚀 Quick Start

For a one-shot deployment on a fresh Ubuntu server:

```bash
# Clone the repository
git clone <your-repository-url>
cd web

# Copy and configure environment
cp env.production .env.production
# Edit .env.production with your actual values

# Run deployment script
./deploy.sh production
```

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **Network**: Static IP address and domain name

### Required Software
- Docker 20.10+
- Docker Compose 1.29+
- Git
- Nginx (managed via Docker)
- Certbot (for SSL certificates)

### Domain Configuration
Ensure your domain DNS is configured to point to your server:
- `solevaeg.com` → Server IP
- `www.solevaeg.com` → Server IP  
- `api.solevaeg.com` → Server IP
- `admin.solevaeg.com` → Server IP

## 🔧 Detailed Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y git curl wget htop unzip
```

### 2. Project Setup

```bash
# Create project directory
sudo mkdir -p /opt/solevaeg
sudo chown -R $USER:$USER /opt/solevaeg

# Clone repository
cd /opt/solevaeg
git clone <your-repository-url> .

# Create data directories
mkdir -p data/{postgres,redis,uploads}
mkdir -p logs/{nginx,app,system}
mkdir -p backups/{database,uploads,config}
mkdir -p ssl
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.production .env.production

# Edit environment file with your values
nano .env.production
```

**Critical Environment Variables to Update:**

```bash
# Database passwords
POSTGRES_PASSWORD=your_strong_database_password
REDIS_PASSWORD=your_strong_redis_password

# JWT secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_64_chars_minimum
JWT_REFRESH_SECRET=your_refresh_secret_64_chars_minimum

# Admin credentials
ADMIN_EMAIL=admin@solevaeg.com
ADMIN_PASSWORD=your_secure_admin_password

# Email configuration
SMTP_HOST=your_smtp_server
SMTP_USER=your_email@solevaeg.com
SMTP_PASS=your_email_password

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_s3_bucket

# Social login
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id

# External services
OPENAI_API_KEY=your_openai_key
SENTRY_DSN=your_sentry_dsn
```

### 4. SSL Certificate Setup

For production, SSL certificates are automatically managed by Let's Encrypt:

```bash
# The deployment script will automatically:
# 1. Request SSL certificates for all domains
# 2. Configure auto-renewal via cron
# 3. Update Nginx configuration
```

### 5. Deploy the Application

```bash
# Run the deployment script
./deploy.sh production

# Monitor deployment progress
docker-compose logs -f
```

## 🔍 Verification

After deployment, verify all services are running:

### Health Checks

```bash
# Check all containers
docker-compose ps

# Check individual services
curl -f https://solevaeg.com
curl -f https://api.solevaeg.com/health
curl -f https://admin.solevaeg.com

# Run monitoring dashboard
./scripts/monitoring-dashboard.sh
```

### Service URLs

- **Main Website**: https://solevaeg.com
- **Admin Panel**: https://admin.solevaeg.com
- **API**: https://api.solevaeg.com
- **API Documentation**: https://api.solevaeg.com/docs

### Admin Access

1. Navigate to https://admin.solevaeg.com
2. Login with credentials from `.env.production`:
   - Email: `admin@solevaeg.com`
   - Password: `[Your configured password]`

## 📊 Monitoring & Maintenance

### Monitoring Dashboard

```bash
# View system status
./scripts/monitoring-dashboard.sh

# Check backup status  
./scripts/backup-status.sh

# View logs
docker-compose logs -f [service_name]
```

### Automated Monitoring

The platform includes automated monitoring:

- **Health Checks**: Every 5 minutes
- **Uptime Monitoring**: Every 2 minutes  
- **Performance Metrics**: Every 10 minutes
- **Daily Summary**: 8 AM daily

### Log Files

```bash
# Application logs
tail -f /opt/solevaeg/logs/app/*.log

# System logs
tail -f /opt/solevaeg/logs/system/*.log

# Nginx logs
tail -f /opt/solevaeg/logs/nginx/*.log
```

## 💾 Backup & Recovery

### Automated Backups

Backups are automatically scheduled:

- **Database**: Daily at 2 AM
- **Uploads**: Weekly (Sunday) at 3 AM
- **Configuration**: Weekly (Sunday) at 4 AM
- **Full Backup**: Monthly (1st) at 1 AM

### Manual Backup

```bash
# Full backup
./scripts/backup-full.sh

# Individual components
./scripts/backup-database.sh
./scripts/backup-uploads.sh
./scripts/backup-config.sh
```

### Restore from Backup

```bash
# List available backups
./scripts/backup-status.sh

# Restore database
./scripts/restore-backup.sh database solevaeg_db_20240101_120000.sql.gz

# Restore uploads
./scripts/restore-backup.sh uploads solevaeg_uploads_20240101_120000.tar.gz
```

## 🔧 Maintenance Commands

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
```

### Scale Services

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale frontend instances
docker-compose up -d --scale frontend=2
```

### Database Operations

```bash
# Access database
docker-compose exec postgres psql -U solevaeg_user -d solevaeg_prod

# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed
```

## 🔒 Security Checklist

### Initial Security Setup

- [ ] Change all default passwords
- [ ] Configure firewall (UFW)
- [ ] Set up SSH key authentication
- [ ] Disable root login
- [ ] Configure automatic security updates
- [ ] Set up fail2ban

### Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### SSL Certificate Verification

```bash
# Check SSL certificate
openssl s_client -servername solevaeg.com -connect solevaeg.com:443 -showcerts

# Verify auto-renewal
sudo certbot renew --dry-run
```

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs [service_name]

# Check system resources
free -h
df -h
docker system df
```

#### Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready -U solevaeg_user

# Reset database connection
docker-compose restart postgres backend
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

#### High Memory Usage

```bash
# Check container resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

### Emergency Procedures

#### Complete System Recovery

```bash
# Stop all services
docker-compose down

# Restore from backup
./scripts/restore-backup.sh database [latest_backup]
./scripts/restore-backup.sh uploads [latest_backup]

# Start services
docker-compose up -d
```

#### Rollback Deployment

```bash
# Revert to previous version
git checkout [previous_commit]
docker-compose build --no-cache
docker-compose up -d
```

## 📞 Support & Maintenance

### Regular Maintenance Schedule

- **Daily**: Monitor system health and logs
- **Weekly**: Review backup status and security logs
- **Monthly**: Update system packages and review performance
- **Quarterly**: Security audit and dependency updates

### Performance Optimization

```bash
# Database optimization
docker-compose exec postgres vacuumdb -U solevaeg_user -d solevaeg_prod --analyze

# Clean up Docker resources
docker system prune -a

# Optimize images
docker-compose exec backend npm run optimize:images
```

### Monitoring Alerts

Configure webhook URLs in `.env.production` for alerts:

- `UPTIME_WEBHOOK_URL`: For uptime alerts
- `SLACK_WEBHOOK_URL`: For Slack notifications

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/)

## 🆘 Emergency Contacts

- **System Administrator**: admin@solevaeg.com
- **Technical Support**: support@solevaeg.com
- **Emergency Hotline**: [Your emergency contact]

---

**Last Updated**: $(date)  
**Version**: 1.0.0  
**Environment**: Production
