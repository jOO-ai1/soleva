# Soleva E-commerce Platform - Production Configuration Guide

## Overview

This guide covers the complete production configuration for the Soleva E-commerce Platform. The configuration includes all necessary environment variables, security settings, and deployment instructions.

## Configuration Files

### Primary Configuration
- `env.production` - Main production environment file
- `docker-compose.yml` - Docker services configuration
- `deploy-production-complete.sh` - Complete deployment script
- `validate-production-config.sh` - Configuration validation script

## Environment Variables

### Application Settings
```bash
NODE_ENV=production
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
ADMIN_URL=https://admin.your-domain.com
```

### Server Ports
```bash
PORT=3001
FRONTEND_PORT=80
ADMIN_PORT=3002
```

### Database Configuration
```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=your_production_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_strong_db_password_here
DATABASE_URL=postgresql://your_db_user:your_strong_db_password_here@postgres:5432/your_production_db_name
```

### Redis Configuration
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_redis_password_here
REDIS_URL=redis://:your_strong_redis_password_here@redis:6379
```

### JWT Security
```bash
JWT_SECRET=your_64_character_jwt_secret_here_minimum_64_chars_long_for_security
JWT_REFRESH_SECRET=your_64_character_jwt_refresh_secret_here_minimum_64_chars_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Admin Configuration
```bash
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_strong_admin_password_here
ADMIN_NAME="Your Admin Name"
```

### Email Configuration (SMTP)
```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-email@your-domain.com
SMTP_PASS=your_smtp_password_here

EMAIL_INFO=info@your-domain.com
EMAIL_SALES=sales@your-domain.com
EMAIL_BUSINESS=business@your-domain.com
EMAIL_SUPPORT=support@your-domain.com
EMAIL_FROM="Your App Name <your-smtp-email@your-domain.com>"
```

### File Storage
```bash
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf
UPLOAD_DIR=/app/uploads
```

### Social Login
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# TODO: Replace with actual Facebook App credentials
FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID_HERE
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET_HERE
```

### Analytics & Tracking
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GTM_CONTAINER_ID=GTM-XXXXXXX
VITE_GTM_CONTAINER_ID=GTM-XXXXXXX
FACEBOOK_PIXEL_ID=YOUR_FACEBOOK_PIXEL_ID_HERE
```

### AI Integration
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

### Security Settings
```bash
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com,https://admin.your-domain.com
```

### Feature Flags
```bash
ENABLE_CHAT_WIDGET=true
ENABLE_SOCIAL_LOGIN=true
ENABLE_ANALYTICS=true
ENABLE_PAYMENT_PROOFS=true
ENABLE_ADAPTIVE_MODE=true
```

### Payment Methods
```bash
ENABLE_COD=true
ENABLE_BANK_WALLET=true
ENABLE_DIGITAL_WALLET=true
FREE_SHIPPING_THRESHOLD=500
```

### Cache Configuration
```bash
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000
```

### Logging
```bash
LOG_LEVEL=info
LOG_MAX_FILES=10
LOG_MAX_SIZE=10m
```

### Frontend Configuration
```bash
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_APP_NAME=Your App Name
VITE_APP_URL=https://your-domain.com
```

### Application Settings
```bash
APP_TIMEZONE=Africa/Cairo
```

## Deployment Instructions

### 1. Pre-deployment Validation

Before deploying, validate your configuration:

```bash
./validate-production-config.sh
```

This script will check:
- All required environment variables are set
- Password strength and security
- URL and email format validation
- Placeholder values that need replacement
- Feature flag configuration

### 2. Complete Production Deployment

Deploy the entire platform:

```bash
./deploy-production-complete.sh
```

This script will:
- Validate environment variables
- Stop existing containers
- Build and start all services
- Run database migrations
- Seed the database
- Test all endpoints
- Display deployment summary

### 3. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Load environment variables
export $(grep -v '^#' env.production | xargs)

# Stop existing services
docker-compose down --remove-orphans

# Build and start services
docker-compose --env-file env.production up --build -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed
```

## Service Architecture

### Services Included
1. **PostgreSQL Database** - Primary data storage
2. **Redis Cache** - Session and cache storage
3. **Backend API** - Node.js/Express API server
4. **Frontend** - React application
5. **Admin Panel** - React admin interface
6. **Nginx** - Reverse proxy and static file server

### Port Configuration
- Frontend: `80` (HTTP) / `443` (HTTPS)
- Backend API: `3001`
- Admin Panel: `3002`
- PostgreSQL: `5432`
- Redis: `6379`

## Security Features

### Implemented Security Measures
- ✅ JWT Authentication with refresh tokens
- ✅ Password-protected Redis instance
- ✅ Strong database passwords
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration for production domains
- ✅ Secure SMTP configuration
- ✅ Environment variable isolation

### Security Recommendations
1. **SSL/TLS**: Configure SSL certificates for production domains
2. **Firewall**: Restrict access to database and Redis ports
3. **Monitoring**: Set up Sentry for error tracking
4. **Backups**: Configure automated database backups
5. **Updates**: Regularly update Docker images and dependencies

## Monitoring & Analytics

### Google Analytics 4
- Measurement ID: `G-XXXXXXXXXX`
- Configured for e-commerce tracking

### Google Tag Manager
- Container ID: `GTM-XXXXXXX`
- Manages all tracking scripts

### Error Monitoring
- Sentry DSN: Configure with actual Sentry project
- Environment: `production`

## Backup Configuration

### Database Backups
```bash
BACKUP_ENCRYPTION_KEY=your_32_character_backup_encryption_key_here
BACKUP_S3_BUCKET=your-backups-bucket-name
BACKUP_RETENTION_DAYS=30
```

### Backup Schedule
Configure automated backups using cron or your preferred scheduler.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL container status
   - Verify database credentials
   - Ensure database is accessible from backend

2. **Redis Connection Failed**
   - Check Redis container status
   - Verify Redis password
   - Test Redis connectivity

3. **Frontend Not Loading**
   - Check Nginx container status
   - Verify frontend build
   - Check static file permissions

4. **API Endpoints Not Responding**
   - Check backend container status
   - Verify environment variables
   - Check backend logs

### Log Access
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Test API health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:80

# Test admin panel
curl http://localhost:3002
```

## Maintenance

### Regular Maintenance Tasks
1. **Update Dependencies**: Regularly update npm packages and Docker images
2. **Database Maintenance**: Run database optimization queries
3. **Log Rotation**: Monitor log file sizes and rotate as needed
4. **Security Updates**: Apply security patches promptly
5. **Backup Verification**: Test backup restoration procedures

### Performance Monitoring
- Monitor CPU and memory usage
- Track database query performance
- Monitor API response times
- Check cache hit rates

## Support

For technical support or questions about the production configuration:
- Check the logs for error details
- Review the validation script output
- Consult the deployment documentation
- Contact the development team

---

**Last Updated**: $(date)
**Version**: Production v1.0
**Environment**: Production
