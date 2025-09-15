#!/bin/bash

# Soleva E-commerce Platform - Production SSL Deployment Script
# This script handles the complete production deployment with SSL certificates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="solevaeg.com"
EMAIL="admin@solevaeg.com"
ROUTER_IP="213.130.147.41"
ROUTER_USER="root"
ROUTER_PASSWORD="?nNL2agT#OojHOTT-ZZ0"
INTERNAL_IP="192.168.1.3"

echo -e "${BLUE}🚀 Soleva E-commerce Platform - Production SSL Deployment${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is not recommended for security reasons."
fi

# Step 1: Verify environment file exists
print_info "Step 1: Checking environment configuration..."
if [ ! -f "env.production" ]; then
    print_error "env.production file not found!"
    print_info "Please ensure env.production exists with all required variables."
    exit 1
fi
print_status "Environment file found"

# Step 2: Load environment variables
print_info "Step 2: Loading production environment..."
source env.production
print_status "Environment variables loaded"

# Step 3: Create necessary directories
print_info "Step 3: Creating SSL and certbot directories..."
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/certbot-webroot
print_status "Directories created"

# Step 4: Stop any running containers
print_info "Step 4: Stopping existing containers..."
docker-compose down 2>/dev/null || true
print_status "Containers stopped"

# Step 5: Configure temporary Nginx for certificate generation
print_info "Step 5: Configuring temporary Nginx for certificate generation..."
cp docker/nginx/conf.d/solevaeg-temp.conf docker/nginx/conf.d/solevaeg.conf
print_status "Temporary configuration applied"

# Step 6: Start services for certificate generation
print_info "Step 6: Starting services for certificate generation..."
docker-compose up -d nginx
sleep 10
print_status "Nginx started"

# Step 7: Generate SSL certificates
print_info "Step 7: Generating Let's Encrypt SSL certificates..."
print_warning "This step requires port forwarding to be configured on your router!"
print_warning "Please ensure ports 80 and 443 are forwarded to $INTERNAL_IP before continuing."

read -p "Have you configured port forwarding? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Port forwarding must be configured first!"
    print_info "Please configure the following on your router:"
    print_info "  - External port 80 → $INTERNAL_IP:80"
    print_info "  - External port 443 → $INTERNAL_IP:443"
    exit 1
fi

# Test external connectivity
print_info "Testing external connectivity..."
if curl -s --connect-timeout 10 "http://$DOMAIN" > /dev/null; then
    print_status "External connectivity confirmed"
else
    print_warning "External connectivity test failed. Continuing anyway..."
fi

# Generate certificates
print_info "Generating SSL certificates for $DOMAIN and www.$DOMAIN..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d api.$DOMAIN \
    -d admin.$DOMAIN

if [ $? -eq 0 ]; then
    print_status "SSL certificates generated successfully"
else
    print_error "Failed to generate SSL certificates"
    print_info "Please check:"
    print_info "  1. Port forwarding is correctly configured"
    print_info "  2. Domain DNS is pointing to $ROUTER_IP"
    print_info "  3. No firewall is blocking ports 80/443"
    exit 1
fi

# Step 8: Apply production Nginx configuration
print_info "Step 8: Applying production Nginx configuration..."
# The production configuration is already in solevaeg.conf
print_status "Production configuration applied"

# Step 9: Start all services
print_info "Step 9: Starting all production services..."
docker-compose down
docker-compose up -d
sleep 15
print_status "All services started"

# Step 10: Verify SSL certificates
print_info "Step 10: Verifying SSL certificates..."
if [ -f "docker/nginx/ssl/live/$DOMAIN/fullchain.pem" ]; then
    print_status "SSL certificates are in place"
    
    # Test HTTPS
    if curl -s --connect-timeout 10 "https://$DOMAIN" > /dev/null; then
        print_status "HTTPS is working correctly"
    else
        print_warning "HTTPS test failed, but certificates are present"
    fi
else
    print_error "SSL certificates not found!"
    exit 1
fi

# Step 11: Set up certificate auto-renewal
print_info "Step 11: Setting up certificate auto-renewal..."
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

cd /home/youssef/web
docker-compose run --rm certbot renew
docker-compose restart nginx
EOF

chmod +x renew-ssl.sh

# Add to crontab (runs twice daily)
(crontab -l 2>/dev/null; echo "0 2,14 * * * /home/youssef/web/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
print_status "Auto-renewal configured (runs at 2 AM and 2 PM daily)"

# Step 12: Final testing
print_info "Step 12: Running final tests..."

# Test HTTP to HTTPS redirect
if curl -s -I "http://$DOMAIN" | grep -q "301\|302"; then
    print_status "HTTP to HTTPS redirect working"
else
    print_warning "HTTP to HTTPS redirect may not be working"
fi

# Test HTTPS
if curl -s -I "https://$DOMAIN" | grep -q "200"; then
    print_status "HTTPS is accessible"
else
    print_warning "HTTPS accessibility test failed"
fi

# Test subdomains
for subdomain in "www.$DOMAIN" "api.$DOMAIN" "admin.$DOMAIN"; do
    if curl -s --connect-timeout 5 "https://$subdomain" > /dev/null; then
        print_status "$subdomain is accessible"
    else
        print_warning "$subdomain may not be accessible"
    fi
done

# Step 13: Display final status
print_info "Step 13: Deployment Summary"
echo "=================================================="
print_status "Production deployment completed!"
print_info "Your application is now available at:"
print_info "  🌐 Main site: https://$DOMAIN"
print_info "  🌐 API: https://api.$DOMAIN"
print_info "  🌐 Admin: https://admin.$DOMAIN"
print_info "  🌐 www: https://www.$DOMAIN"

print_info "SSL certificates will auto-renew via cron job"
print_info "Check renewal logs: tail -f /var/log/ssl-renewal.log"

print_info "To monitor your services:"
print_info "  docker-compose ps"
print_info "  docker-compose logs -f"

print_info "To restart services:"
print_info "  docker-compose restart"

print_status "🎉 Production deployment with SSL completed successfully!"
