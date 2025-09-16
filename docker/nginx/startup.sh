#!/bin/sh

# Nginx startup script with SSL certificate detection
# This script checks for SSL certificates and creates appropriate configuration

echo "🔧 Starting Nginx with SSL certificate detection..."

# Check if SSL certificates exist
if [ -f "/etc/letsencrypt/live/solevaeg.com/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/solevaeg.com/privkey.pem" ]; then
    echo "✅ SSL certificates found, using production configuration"
    # Remove any existing active configuration
    rm -f /etc/nginx/conf.d/active.conf
    # Use the production configuration with SSL
    cp /etc/nginx/conf.d/production.conf /etc/nginx/conf.d/active.conf
else
    echo "⚠️  SSL certificates not found, creating HTTP-only configuration"
    # Create HTTP-only configuration
    cat > /etc/nginx/conf.d/active.conf << 'EOF'
# Upstream definitions
upstream backend {
    server backend:3001;
    keepalive 32;
}

upstream frontend {
    server frontend:80;
    keepalive 32;
}

upstream admin {
    server admin:80;
    keepalive 32;
}

# HTTP-only configuration (no SSL)
server {
    listen 80;
    server_name solevaeg.com www.solevaeg.com api.solevaeg.com admin.solevaeg.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API backend (HTTP)
server {
    listen 80;
    server_name api.solevaeg.com;
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://solevaeg.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "http://solevaeg.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Auth endpoints
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Upload endpoints
    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin panel (HTTP)
server {
    listen 80;
    server_name admin.solevaeg.com;
    
    # Admin panel
    location / {
        proxy_pass http://admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# Test the configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🚀 Starting Nginx..."
    exec nginx -g "daemon off;"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
