#!/bin/bash

# Complete Production Deployment Script for Soleva E-commerce Platform
# This script deploys all components with SSL and proper configuration

set -e

echo "🚀 Starting complete production deployment for Soleva E-commerce Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# 1. Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# 2. Install required packages
print_status "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server

# 3. Start and enable services
print_status "Starting and enabling services..."
systemctl start postgresql
systemctl enable postgresql
systemctl start redis-server
systemctl enable redis-server
systemctl start nginx
systemctl enable nginx

# 4. Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE solevaeg_db;" 2>/dev/null || print_warning "Database may already exist"
sudo -u postgres psql -c "CREATE USER soleva_user WITH PASSWORD 'soleva123';" 2>/dev/null || print_warning "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE solevaeg_db TO soleva_user;" 2>/dev/null || true

# 5. Build frontend
print_status "Building frontend application..."
cd /home/youssef/web
npm install
npm run build

# 6. Build admin panel
print_status "Building admin panel..."
cd /home/youssef/web/admin
npm install
npm run build

# 7. Build backend
print_status "Building backend application..."
cd /home/youssef/web/backend
npm install
npm run build

# 8. Set up nginx configuration
print_status "Setting up nginx configuration..."
cp /home/youssef/web/docker/nginx/nginx.conf /etc/nginx/nginx.conf
cp /home/youssef/web/docker/nginx/frontend.conf /etc/nginx/sites-available/solevaeg-frontend
cp /home/youssef/web/docker/nginx/admin.conf /etc/nginx/sites-available/solevaeg-admin

# Enable sites
ln -sf /etc/nginx/sites-available/solevaeg-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/solevaeg-admin /etc/nginx/sites-enabled/

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# 9. Set up SSL certificates
print_status "Setting up SSL certificates..."
if [ -f "/home/youssef/web/setup-ssl.sh" ]; then
    /home/youssef/web/setup-ssl.sh
else
    print_warning "SSL setup script not found, skipping SSL configuration"
fi

# 10. Set up systemd services
print_status "Setting up systemd services..."

# Backend service
cat > /etc/systemd/system/soleva-backend.service << EOF
[Unit]
Description=Soleva E-commerce Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=youssef
WorkingDirectory=/home/youssef/web/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://soleva_user:soleva123@localhost:5432/solevaeg_db?schema=public

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (nginx already handles this)
# Admin service (nginx already handles this)

# Enable and start services
systemctl daemon-reload
systemctl enable soleva-backend
systemctl start soleva-backend

# 11. Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/soleva << EOF
/home/youssef/web/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 youssef youssef
    postrotate
        systemctl reload soleva-backend
    endscript
}
EOF

# 12. Set up monitoring
print_status "Setting up basic monitoring..."
cat > /home/youssef/web/monitor.sh << 'EOF'
#!/bin/bash
# Basic health check script

BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:80/health"
ADMIN_URL="http://localhost:3002/health"

echo "=== Soleva Platform Health Check ==="
echo "Timestamp: $(date)"
echo

# Check backend
if curl -s $BACKEND_URL > /dev/null; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy"
fi

# Check frontend
if curl -s $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Unhealthy"
fi

# Check admin panel
if curl -s $ADMIN_URL > /dev/null; then
    echo "✅ Admin Panel: Healthy"
else
    echo "❌ Admin Panel: Unhealthy"
fi

echo
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo
echo "Disk Usage:"
df -h /
echo
echo "Service Status:"
systemctl is-active soleva-backend nginx postgresql redis-server
EOF

chmod +x /home/youssef/web/monitor.sh

# 13. Final configuration test
print_status "Testing configuration..."
nginx -t
systemctl is-active soleva-backend nginx postgresql redis-server

# 14. Display final status
print_success "Deployment completed successfully!"
echo
echo "🌐 Frontend: https://solevaeg.com"
echo "🔧 Admin Panel: https://solevaeg.com:3002"
echo "📊 API: https://solevaeg.com/api"
echo
echo "📋 Services Status:"
systemctl status soleva-backend nginx postgresql redis-server --no-pager -l
echo
echo "🔍 To monitor the platform, run: /home/youssef/web/monitor.sh"
echo "📝 Logs are available in: /home/youssef/web/backend/logs/"
echo
print_success "Soleva E-commerce Platform is now live! 🎉"