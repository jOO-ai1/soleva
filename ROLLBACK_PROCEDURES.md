# 🔄 Rollback Procedures - Soleva E-commerce Platform

## 📋 Overview

This document provides comprehensive rollback procedures for the Soleva E-commerce Platform. Rollbacks may be necessary due to:

- Deployment failures
- Application bugs
- Performance issues
- Security vulnerabilities
- Database corruption

## 🚨 Emergency Rollback (Fastest)

### Quick Rollback (2-3 minutes)

```bash
# 1. Stop current deployment
docker compose -f docker-compose.prod.yml down

# 2. Start previous deployment (if available)
docker compose -f docker-compose.yml up -d

# 3. Verify services are running
docker compose -f docker-compose.yml ps
```

### Check Service Health

```bash
# Test main endpoints
curl -I http://yourdomain.com
curl -I http://yourdomain.com:3001/health

# Check logs for errors
docker compose -f docker-compose.yml logs --tail=50
```

## 🔧 Comprehensive Rollback

### 1. Pre-Rollback Assessment

```bash
# Check current deployment status
docker compose -f docker-compose.prod.yml ps

# Identify the issue
docker compose -f docker-compose.prod.yml logs --tail=100

# Check system resources
df -h
free -h
```

### 2. Stop Current Deployment

```bash
# Graceful shutdown
docker compose -f docker-compose.prod.yml down --timeout 30

# Force shutdown if needed
docker compose -f docker-compose.prod.yml kill
docker compose -f docker-compose.prod.yml rm -f
```

### 3. Restore Previous Version

#### Option A: Git-based Rollback

```bash
# Check git history
git log --oneline -10

# Rollback to previous commit
git checkout [previous-commit-hash]

# Deploy previous version
./deploy.sh
```

#### Option B: Docker Image Rollback

```bash
# List available images
docker images | grep solevaeg

# Use previous image tags
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### 4. Database Rollback

#### Option A: Migration Rollback

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U solevaeg_user -d solevaeg_prod

# List migrations
\dt

# Rollback specific migration (if supported)
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate reset
```

#### Option B: Database Restore

```bash
# Stop database
docker compose -f docker-compose.prod.yml stop postgres

# Restore from backup
docker run --rm -v postgres_data:/data -v $(pwd):/backup postgres:15-alpine \
  pg_restore -U solevaeg_user -d solevaeg_prod /backup/backup_YYYYMMDD.sql

# Start database
docker compose -f docker-compose.prod.yml start postgres
```

### 5. Configuration Rollback

```bash
# Restore environment file
cp .env.production.backup .env.production

# Restore Nginx configuration
cp docker/nginx/conf.d/production.conf.backup docker/nginx/conf.d/production.conf

# Restart services
docker compose -f docker-compose.prod.yml restart nginx
```

## 🗄️ Database-Specific Rollbacks

### Schema Rollback

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U solevaeg_user -d solevaeg_prod

# Check current schema version
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

# Rollback to specific migration
DELETE FROM _prisma_migrations WHERE migration_name = 'problematic_migration';
```

### Data Rollback

```bash
# Create backup before rollback
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U solevaeg_user solevaeg_prod > rollback_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore specific tables
docker compose -f docker-compose.prod.yml exec postgres psql -U solevaeg_user -d solevaeg_prod -c "
  TRUNCATE TABLE problematic_table;
  COPY problematic_table FROM '/backup/table_backup.csv' WITH CSV HEADER;
"
```

## 🔄 Service-Specific Rollbacks

### Backend Service Rollback

```bash
# Stop backend
docker compose -f docker-compose.prod.yml stop backend

# Use previous backend image
docker compose -f docker-compose.prod.yml up -d backend --force-recreate

# Check backend health
curl -f http://localhost:3001/health
```

### Frontend Service Rollback

```bash
# Stop frontend
docker compose -f docker-compose.prod.yml stop frontend

# Use previous frontend image
docker compose -f docker-compose.prod.yml up -d frontend --force-recreate

# Check frontend
curl -I http://localhost
```

### Admin Panel Rollback

```bash
# Stop admin
docker compose -f docker-compose.prod.yml stop admin

# Use previous admin image
docker compose -f docker-compose.prod.yml up -d admin --force-recreate

# Check admin
curl -I http://localhost:3002
```

## 🔒 SSL Certificate Rollback

### Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Restore previous certificate
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem.backup /etc/letsencrypt/live/yourdomain.com/fullchain.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem.backup /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Reload Nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Temporary HTTP-Only Mode

```bash
# Modify Nginx config for HTTP only
sed -i 's/443 ssl/80/g' docker/nginx/conf.d/production.conf
sed -i '/ssl_/d' docker/nginx/conf.d/production.conf

# Restart Nginx
docker compose -f docker-compose.prod.yml restart nginx
```

## 📊 Monitoring During Rollback

### Health Checks

```bash
# Continuous health monitoring
watch -n 5 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health'

# Check all services
for service in postgres redis backend frontend admin nginx; do
  echo "Checking $service..."
  docker compose -f docker-compose.prod.yml ps $service
done
```

### Log Monitoring

```bash
# Monitor logs during rollback
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Check specific service logs
docker compose -f docker-compose.prod.yml logs backend --tail=100
docker compose -f docker-compose.prod.yml logs nginx --tail=100
```

## 🚨 Emergency Procedures

### Complete System Rollback

```bash
# 1. Stop all services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.yml down

# 2. Clean up containers and images
docker system prune -f
docker volume prune -f

# 3. Restore from backup
git checkout [last-known-good-commit]
cp .env.production.backup .env.production

# 4. Deploy clean version
./deploy.sh
```

### Database Emergency Recovery

```bash
# 1. Stop database
docker compose -f docker-compose.prod.yml stop postgres

# 2. Remove corrupted data
docker volume rm solevaeg-web_postgres_data

# 3. Restore from backup
docker run --rm -v solevaeg-web_postgres_data:/data -v $(pwd):/backup postgres:15-alpine \
  tar -xzf /backup/postgres_backup_YYYYMMDD.tar.gz -C /data

# 4. Start database
docker compose -f docker-compose.prod.yml up -d postgres
```

## 📝 Rollback Checklist

### Pre-Rollback

- [ ] Identify the issue and root cause
- [ ] Assess impact and urgency
- [ ] Notify stakeholders
- [ ] Create backup of current state
- [ ] Document rollback plan

### During Rollback

- [ ] Stop affected services
- [ ] Restore previous version
- [ ] Verify database integrity
- [ ] Test critical functionality
- [ ] Monitor system health

### Post-Rollback

- [ ] Verify all services are running
- [ ] Test all endpoints
- [ ] Check application logs
- [ ] Monitor for 15 minutes
- [ ] Notify stakeholders of completion
- [ ] Document lessons learned

## 🔍 Troubleshooting Rollback Issues

### Common Rollback Problems

#### 1. Previous Version Not Available

```bash
# Check git history
git reflog

# Find last working commit
git log --oneline --graph

# Create emergency patch
git checkout [working-commit]
git checkout -b emergency-fix
```

#### 2. Database Incompatibility

```bash
# Check database version
docker compose -f docker-compose.prod.yml exec postgres psql -U solevaeg_user -d solevaeg_prod -c "SELECT version();"

# Run compatibility migration
docker compose -f docker-compose.prod.yml run --rm backend npx prisma db push --force-reset
```

#### 3. Configuration Conflicts

```bash
# Compare configurations
diff .env.production .env.production.backup

# Merge configurations manually
nano .env.production
```

## 📞 Emergency Contacts

### Escalation Path

1. **Level 1**: Development Team
2. **Level 2**: DevOps Team
3. **Level 3**: System Administrator
4. **Level 4**: Hosting Provider

### Communication Template

```
URGENT: Production Rollback Required

Issue: [Brief description]
Impact: [User impact]
Root Cause: [If known]
Rollback Plan: [Steps being taken]
ETA: [Expected resolution time]
Status: [Current status]
```

## 📚 Additional Resources

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Monitoring Setup](./MONITORING.md)
- [Backup Procedures](./BACKUP_PROCEDURES.md)

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Soleva Development Team
