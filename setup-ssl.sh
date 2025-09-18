#!/bin/bash

# SSL Setup Script for Soleva E-commerce Platform
# This script sets up Let's Encrypt SSL certificates for solevaeg.com

set -e

DOMAIN="solevaeg.com"
EMAIL="admin@solevaeg.com"
WEBROOT="/var/www/certbot"

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Create webroot directory
mkdir -p $WEBROOT

# Create temporary nginx config for certificate generation
cat > /etc/nginx/sites-available/temp-ssl << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable temporary site
ln -sf /etc/nginx/sites-available/temp-ssl /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Generate SSL certificate
echo "🔑 Generating SSL certificate..."
certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Remove temporary config
rm -f /etc/nginx/sites-enabled/temp-ssl
rm -f /etc/nginx/sites-available/temp-ssl

# Copy SSL configuration
echo "📝 Setting up SSL configuration..."
cp /home/youssef/web/docker/nginx/solevaeg-ssl.conf /etc/nginx/sites-available/solevaeg-ssl
ln -sf /etc/nginx/sites-available/solevaeg-ssl /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Set up auto-renewal
echo "⏰ Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Test auto-renewal
echo "🧪 Testing auto-renewal..."
certbot renew --dry-run

echo "✅ SSL setup complete!"
echo "🌐 Your site should now be available at https://$DOMAIN"
echo "🔒 Certificate will auto-renew every 12 hours"

# Display certificate info
echo "📋 Certificate information:"
certbot certificates
