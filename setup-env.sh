#!/bin/bash

# Soleva E-commerce Platform - Environment Setup Script
# This script creates a .env file with all required environment variables

echo "Setting up environment variables for Soleva E-commerce Platform..."

# Create .env file
cat > .env << 'EOF'
# Soleva E-commerce Platform - Environment Configuration
# IMPORTANT: Update all placeholder values before deploying to production

# Application
NODE_ENV=development
DOMAIN=solevaeg.com
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# Server Configuration
PORT=3001
FRONTEND_PORT=5173
ADMIN_PORT=3002
BACKEND_PORT=3001

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=solevaeg_db
POSTGRES_USER=solevaeg
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://solevaeg:password@postgres:5432/solevaeg_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://redis:6379

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345678901234567890
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-12345678901234567890
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@solevaeg.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Soleva Admin

# Email Configuration (SMTP) - Configure for production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Addresses
EMAIL_INFO=info@solevaeg.com
EMAIL_SALES=sales@solevaeg.com
EMAIL_BUSINESS=business@solevaeg.com
EMAIL_SUPPORT=support@solevaeg.com

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,image/heic,application/pdf
UPLOAD_DIR=/app/uploads

# AWS S3 Configuration (for file storage) - Configure for production
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=solevaeg-uploads
S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com

# Social Login Configuration - Configure for production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OpenAI Configuration (for AI chat) - Configure for production
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Sentry Configuration (Error Tracking) - Configure for production
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=development

# Analytics Configuration - Configure for production
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
FACEBOOK_PIXEL_ID=your-pixel-id
GTM_CONTAINER_ID=GTM-XXXXXXX

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173,http://localhost:3002

# Backup Configuration - Configure for production
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key-32-chars
BACKUP_S3_BUCKET=solevaeg-backups
BACKUP_RETENTION_DAYS=30

# Monitoring Configuration - Configure for production
UPTIME_WEBHOOK_URL=your-uptime-webhook-url
SLACK_WEBHOOK_URL=your-slack-webhook-url

# SSL Configuration
SSL_EMAIL=admin@solevaeg.com

# Feature Flags
ENABLE_CHAT_WIDGET=true
ENABLE_SOCIAL_LOGIN=true
ENABLE_ANALYTICS=true
ENABLE_PAYMENT_PROOFS=true
ENABLE_ADAPTIVE_MODE=true

# Payment Configuration
ENABLE_COD=true
ENABLE_BANK_WALLET=true
ENABLE_DIGITAL_WALLET=true
FREE_SHIPPING_THRESHOLD=500

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000

# Log Configuration
LOG_LEVEL=info
LOG_MAX_FILES=10
LOG_MAX_SIZE=10m

# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_NAME=Soleva
VITE_APP_URL=http://localhost:5173
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: Please update the following critical values in .env:"
echo "   - JWT_SECRET: Generate a strong 64+ character secret"
echo "   - JWT_REFRESH_SECRET: Generate a strong 64+ character secret"
echo "   - ADMIN_PASSWORD: Set a strong admin password"
echo "   - SMTP credentials: Configure your email service"
echo "   - AWS credentials: Configure for file storage"
echo "   - OpenAI API key: For AI chat functionality"
echo ""
echo "🔧 For production deployment, also update:"
echo "   - DOMAIN: Your actual domain name"
echo "   - Database passwords: Use strong passwords"
echo "   - All API keys and secrets"
echo ""
echo "📖 See env.production for production-ready configuration examples."
