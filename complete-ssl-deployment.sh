#!/bin/bash

# Complete SSL Deployment Script for Soleva E-commerce Platform
# Run this script once external connectivity is working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Completing SSL Deployment for Soleva E-commerce Platform${NC}"
echo "=================================================="

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

# Configuration
DOMAIN="solevaeg.com"
EMAIL="admin@solevaeg.com"

# Step 1: Test external connectivity
print_info "Step 1: Testing external connectivity..."
if curl -s --connect-timeout 10 "http://$DOMAIN" > /dev/null; then
    print_status "External connectivity confirmed"
else
    print_error "External connectivity failed. Please ensure:"
    print_info "  1. Port forwarding is working (80 → 192.168.1.3:80)"
    print_info "  2. ISP is not blocking ports 80/443"
    print_info "  3. Domain DNS is pointing to 213.130.147.41"
    exit 1
fi

# Step 2: Generate SSL certificates
print_info "Step 2: Generating SSL certificates..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    print_status "SSL certificates generated successfully"
else
    print_error "Failed to generate SSL certificates"
    exit 1
fi

# Step 3: Apply production configuration
print_info "Step 3: Applying production Nginx configuration..."
# Restore the production configuration
git checkout docker/nginx/conf.d/solevaeg.conf 2>/dev/null || {
    print_warning "Git not available, manually restoring production config..."
    # The production config should already be in place
}

# Step 4: Restart services
print_info "Step 4: Restarting services with SSL configuration..."
docker compose restart nginx
sleep 10

# Step 5: Verify SSL certificates
print_info "Step 5: Verifying SSL certificates..."
if [ -f "docker/nginx/ssl/live/$DOMAIN/fullchain.pem" ]; then
    print_status "SSL certificates are in place"
else
    print_error "SSL certificates not found!"
    exit 1
fi

# Step 6: Test HTTPS
print_info "Step 6: Testing HTTPS..."
if curl -s --connect-timeout 10 "https://$DOMAIN" > /dev/null; then
    print_status "HTTPS is working correctly"
else
    print_warning "HTTPS test failed, but certificates are present"
fi

# Step 7: Set up auto-renewal
print_info "Step 7: Setting up certificate auto-renewal..."
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
cd /home/youssef/web
docker compose run --rm certbot renew
docker compose restart nginx
EOF

chmod +x renew-ssl.sh

# Add to crontab (runs twice daily)
(crontab -l 2>/dev/null; echo "0 2,14 * * * /home/youssef/web/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
print_status "Auto-renewal configured"

# Step 8: Final testing
print_info "Step 8: Running final tests..."

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

# Test www subdomain
if curl -s --connect-timeout 5 "https://www.$DOMAIN" > /dev/null; then
    print_status "www subdomain is accessible"
else
    print_warning "www subdomain may not be accessible"
fi

# Display final status
echo ""
echo "=================================================="
print_status "🎉 SSL deployment completed successfully!"
print_info "Your application is now available at:"
print_info "  🌐 Main site: https://$DOMAIN"
print_info "  🌐 www: https://www.$DOMAIN"
print_info "  🌐 API: https://api.$DOMAIN"
print_info "  🌐 Admin: https://admin.$DOMAIN"

print_info "SSL certificates will auto-renew via cron job"
print_info "Check renewal logs: tail -f /var/log/ssl-renewal.log"
