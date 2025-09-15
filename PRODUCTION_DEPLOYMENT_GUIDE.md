# Soleva E-commerce Platform - Production Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment Requirements

- [ ] **Server Setup**
  - [ ] Ubuntu 20.04+ or CentOS 8+ server
  - [ ] Minimum 4GB RAM, 2 CPU cores
  - [ ] 50GB+ SSD storage
  - [ ] Docker and Docker Compose installed
  - [ ] Domain name configured with DNS

- [ ] **Environment Configuration**
  - [ ] `.env.production` file created with secure values
  - [ ] All passwords changed from defaults
  - [ ] SSL certificates configured
  - [ ] Database credentials secured

- [ ] **Security Setup**
  - [ ] Firewall configured (ports 80, 443, 22)
  - [ ] SSH key authentication enabled
  - [ ] Fail2ban installed and configured
  - [ ] Regular security updates scheduled

### Deployment Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd solevaeg-platform
   ```

2. **Configure Environment**
   ```bash
   cp env.production .env.production
   # Edit .env.production with your production values
   ```

3. **Deploy Services**
   ```bash
   chmod +x deploy-production.sh
   ./deploy-production.sh
   ```

4. **Verify Deployment**
   - [ ] Frontend accessible at `https://solevaeg.com`
   - [ ] API accessible at `https://api.solevaeg.com`
   - [ ] Admin panel accessible at `https://admin.solevaeg.com`
   - [ ] Database migrations completed
   - [ ] Admin user created successfully

## 🔐 Admin Panel Access

### Default Admin Credentials

**URL:** `https://admin.solevaeg.com`

**Login Credentials:**
- **Email:** `admin@solevaeg.com`
- **Password:** `?3aeeSjqq`

### Admin Panel Features

- **Dashboard:** Overview of sales, orders, and key metrics
- **Products:** Manage product catalog, inventory, and pricing
- **Orders:** Process orders, update status, handle refunds
- **Customers:** View customer data and order history
- **Analytics:** Sales reports and performance insights
- **Settings:** Configure system settings and preferences
- **Chat:** Manage customer support conversations

### Security Recommendations

1. **Change Default Password**
   - Log in to admin panel immediately
   - Go to Profile Settings
   - Change the default password to a strong, unique password

2. **Enable Two-Factor Authentication**
   - Navigate to Security Settings
   - Enable 2FA for additional security
   - Save backup codes in a secure location

3. **Regular Security Updates**
   - Monitor for security updates
   - Update dependencies regularly
   - Review access logs periodically

## 🌐 Service URLs

### Production URLs

- **Main Website:** `https://solevaeg.com`
- **API Endpoint:** `https://api.solevaeg.com`
- **Admin Panel:** `https://admin.solevaeg.com`

### Health Check Endpoints

- **Frontend Health:** `https://solevaeg.com/health`
- **API Health:** `https://api.solevaeg.com/health`
- **Admin Health:** `https://admin.solevaeg.com/health`

## 📊 Monitoring & Maintenance

### Service Management

```bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update services
docker-compose pull
docker-compose up -d

# Stop services
docker-compose down
```

### Database Management

```bash
# Access database
docker-compose exec postgres psql -U solevaeg_user -d solevaeg_prod

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Backup database
docker-compose exec postgres pg_dump -U solevaeg_user solevaeg_prod > backup.sql
```

### Log Management

```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

## 🔧 Troubleshooting

### Common Issues

1. **Services Not Starting**
   - Check Docker daemon status
   - Verify environment variables
   - Check port conflicts

2. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Review database logs

3. **SSL Certificate Issues**
   - Verify domain configuration
   - Check certificate validity
   - Review nginx configuration

4. **Admin Panel Access Issues**
   - Verify admin credentials
   - Check backend API status
   - Review authentication logs

### Support Commands

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h

# Check network connectivity
curl -I https://solevaeg.com
```

## 📈 Performance Optimization

### Recommended Settings

- **Database:** Regular VACUUM and ANALYZE
- **Redis:** Configure appropriate memory limits
- **Nginx:** Enable gzip compression and caching
- **Docker:** Set appropriate resource limits

### Monitoring Tools

- **System Monitoring:** htop, iotop, nethogs
- **Application Monitoring:** Docker stats, application logs
- **Database Monitoring:** pg_stat_activity, slow query logs

## 🚨 Emergency Procedures

### Service Recovery

1. **Complete Service Failure**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Database Recovery**
   ```bash
   # Restore from backup
   docker-compose exec postgres psql -U solevaeg_user -d solevaeg_prod < backup.sql
   ```

3. **SSL Certificate Renewal**
   ```bash
   docker-compose exec certbot certbot renew
   docker-compose restart nginx
   ```

### Backup Strategy

- **Database:** Daily automated backups
- **Uploads:** Regular file system backups
- **Configuration:** Version control for config files
- **SSL Certificates:** Automated renewal monitoring

## 📞 Support Information

### Technical Support

- **Documentation:** Check this guide and inline code comments
- **Logs:** Review application and system logs
- **Monitoring:** Use health check endpoints

### Contact Information

- **Admin Email:** admin@solevaeg.com
- **Support Email:** support@solevaeg.com
- **Technical Issues:** Check logs and documentation first

---

## ✅ Post-Deployment Verification

After deployment, verify the following:

- [ ] All services are running and healthy
- [ ] Admin panel is accessible with correct credentials
- [ ] SSL certificates are valid and working
- [ ] Database is seeded with initial data
- [ ] All API endpoints are responding correctly
- [ ] Frontend is loading without errors
- [ ] File uploads are working
- [ ] Email notifications are configured
- [ ] Monitoring and logging are active

**🎉 Congratulations! Your Soleva E-commerce platform is now live and ready for business!**
