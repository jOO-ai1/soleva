#!/bin/bash

# SSL Certificate Setup Script
# This script generates SSL certificates using Certbot

set -e

echo "🔐 SSL Certificate Setup Script"
echo "==============================="

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        echo "⚠️  Running as root. Some operations may not work properly."
        echo "💡 Consider running as regular user with sudo access."
    fi
}

# Function to check Docker daemon status
check_docker_daemon() {
    echo "🔍 Checking Docker daemon status..."
    
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker daemon is not running or not accessible"
        echo "💡 Try: sudo systemctl start docker"
        exit 1
    fi
    
    echo "✅ Docker daemon is running"
}

# Function to check if domain is accessible
check_domain_accessibility() {
    local domain="${1:-solevaeg.com}"
    echo "🔍 Checking domain accessibility: $domain"
    
    if curl -s --connect-timeout 10 "http://$domain" > /dev/null 2>&1; then
        echo "✅ Domain $domain is accessible"
        return 0
    else
        echo "❌ Domain $domain is not accessible"
        echo "💡 Make sure the domain points to this server's IP address"
        return 1
    fi
}

# Function to start services for certificate generation
start_services_for_certbot() {
    echo "🚀 Starting services for certificate generation..."
    
    # Start only the services needed for certificate generation
    docker compose up -d nginx
    
    # Wait for Nginx to be ready
    echo "⏳ Waiting for Nginx to be ready..."
    sleep 10
    
    # Check if Nginx is running
    if docker compose ps nginx | grep -q "Up"; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx failed to start"
        return 1
    fi
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    local domain="${1:-solevaeg.com}"
    local email="${2:-admin@solevaeg.com}"
    
    echo "🔐 Generating SSL certificates for $domain..."
    
    # Create certbot command
    local certbot_cmd="docker compose run --rm certbot certonly --webroot -w /var/www/certbot"
    
    # Add domains
    certbot_cmd="$certbot_cmd -d $domain"
    certbot_cmd="$certbot_cmd -d www.$domain"
    certbot_cmd="$certbot_cmd -d api.$domain"
    certbot_cmd="$certbot_cmd -d admin.$domain"
    
    # Add email if provided
    if [ -n "$email" ]; then
        certbot_cmd="$certbot_cmd --email $email --agree-tos --no-eff-email"
    else
        certbot_cmd="$certbot_cmd --register-unsafely-without-email"
    fi
    
    echo "📋 Running: $certbot_cmd"
    
    # Execute certbot command
    if eval $certbot_cmd; then
        echo "✅ SSL certificates generated successfully"
        return 0
    else
        echo "❌ Failed to generate SSL certificates"
        return 1
    fi
}

# Function to verify SSL certificates
verify_ssl_certificates() {
    local domain="${1:-solevaeg.com}"
    echo "🔍 Verifying SSL certificates..."
    
    # Check if certificate files exist
    if [ -f "docker/nginx/ssl/live/$domain/fullchain.pem" ] && [ -f "docker/nginx/ssl/live/$domain/privkey.pem" ]; then
        echo "✅ SSL certificate files exist"
        
        # Check certificate validity
        if openssl x509 -in "docker/nginx/ssl/live/$domain/fullchain.pem" -text -noout > /dev/null 2>&1; then
            echo "✅ SSL certificate is valid"
            
            # Show certificate details
            echo "📋 Certificate details:"
            openssl x509 -in "docker/nginx/ssl/live/$domain/fullchain.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
            
            return 0
        else
            echo "❌ SSL certificate is invalid"
            return 1
        fi
    else
        echo "❌ SSL certificate files not found"
        return 1
    fi
}

# Function to restart Nginx with SSL
restart_nginx_with_ssl() {
    echo "🔄 Restarting Nginx with SSL configuration..."
    
    # Rebuild Nginx image to pick up SSL certificates
    docker compose build nginx
    
    # Restart Nginx
    docker compose up -d nginx
    
    # Wait for Nginx to be ready
    echo "⏳ Waiting for Nginx to be ready..."
    sleep 10
    
    # Check if Nginx is running
    if docker compose ps nginx | grep -q "Up"; then
        echo "✅ Nginx is running with SSL"
        return 0
    else
        echo "❌ Nginx failed to start with SSL"
        return 1
    fi
}

# Function to test SSL configuration
test_ssl_configuration() {
    local domain="${1:-solevaeg.com}"
    echo "🧪 Testing SSL configuration..."
    
    # Test HTTP to HTTPS redirect
    if curl -s -I "http://$domain" | grep -q "301"; then
        echo "✅ HTTP to HTTPS redirect is working"
    else
        echo "⚠️  HTTP to HTTPS redirect may not be working"
    fi
    
    # Test HTTPS access
    if curl -s -I "https://$domain" -k | grep -q "200\|301"; then
        echo "✅ HTTPS access is working"
    else
        echo "⚠️  HTTPS access may not be working"
    fi
}

# Main setup process
main() {
    local domain="${1:-solevaeg.com}"
    local email="${2:-admin@solevaeg.com}"
    
    echo "🚀 Starting SSL certificate setup for $domain..."
    
    # Step 1: Check prerequisites
    check_docker_daemon
    
    # Step 2: Check domain accessibility
    if ! check_domain_accessibility "$domain"; then
        echo "⚠️  Domain is not accessible, but continuing with certificate generation..."
    fi
    
    # Step 3: Start services
    start_services_for_certbot
    
    # Step 4: Generate SSL certificates
    if generate_ssl_certificates "$domain" "$email"; then
        echo "✅ SSL certificates generated successfully"
    else
        echo "❌ SSL certificate generation failed"
        echo "💡 You can continue with HTTP-only configuration"
        exit 1
    fi
    
    # Step 5: Verify certificates
    if verify_ssl_certificates "$domain"; then
        echo "✅ SSL certificates verified"
    else
        echo "❌ SSL certificate verification failed"
        exit 1
    fi
    
    # Step 6: Restart Nginx with SSL
    if restart_nginx_with_ssl; then
        echo "✅ Nginx restarted with SSL"
    else
        echo "❌ Failed to restart Nginx with SSL"
        exit 1
    fi
    
    # Step 7: Test SSL configuration
    test_ssl_configuration "$domain"
    
    echo ""
    echo "🎉 SSL certificate setup completed successfully!"
    echo "💡 Your site is now accessible via HTTPS"
    echo "🌐 Test your site: https://$domain"
}

# Handle command line arguments
case "${1:-}" in
    "check")
        check_domain_accessibility "${2:-solevaeg.com}"
        ;;
    "verify")
        verify_ssl_certificates "${2:-solevaeg.com}"
        ;;
    "test")
        test_ssl_configuration "${2:-solevaeg.com}"
        ;;
    "restart")
        restart_nginx_with_ssl
        ;;
    *)
        main "$@"
        ;;
esac
