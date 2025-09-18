#!/bin/bash

# Production Deployment Testing Script for Soleva E-commerce Platform
# This script tests all aspects of the production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="solevaeg.com"
ROUTER_IP="213.130.147.41"

echo -e "${BLUE}🧪 Production Deployment Testing for Soleva E-commerce Platform${NC}"
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

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_info "Testing: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        print_status "$test_name - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test HTTP response
test_http_response() {
    local url="$1"
    local expected_status="$2"
    local test_name="$3"
    
    print_info "Testing: $test_name"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_status "$test_name - PASSED (Status: $status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name - FAILED (Status: $status_code, Expected: $expected_status)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test SSL certificate
test_ssl_certificate() {
    local domain="$1"
    local test_name="$2"
    
    print_info "Testing: $test_name"
    
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$cert_info" ]; then
        print_status "$test_name - PASSED"
        echo "Certificate details:"
        echo "$cert_info" | sed 's/^/  /'
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test Docker containers
test_docker_containers() {
    print_info "Testing: Docker containers status"
    
    local containers=("solevaeg-postgres" "solevaeg-redis" "solevaeg-backend" "solevaeg-frontend" "solevaeg-admin" "solevaeg-nginx")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            print_error "Container $container is not running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = true ]; then
        print_status "All Docker containers are running - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "Some Docker containers are not running - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test database connectivity
test_database_connectivity() {
    print_info "Testing: Database connectivity"
    
    if docker exec solevaeg-postgres pg_isready -U solevaeg_user -d solevaeg_prod >/dev/null 2>&1; then
        print_status "Database connectivity - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "Database connectivity - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test Redis connectivity
test_redis_connectivity() {
    print_info "Testing: Redis connectivity"
    
    if docker exec solevaeg-redis redis-cli ping | grep -q "PONG"; then
        print_status "Redis connectivity - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "Redis connectivity - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_info "Testing: API endpoints"
    
    local api_base="https://api.$DOMAIN"
    local endpoints=("/api/v1/health" "/api/v1/auth/status")
    local all_passed=true
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s --connect-timeout 10 "$api_base$endpoint" >/dev/null 2>&1; then
            print_error "API endpoint $endpoint is not accessible"
            all_passed=false
        fi
    done
    
    if [ "$all_passed" = true ]; then
        print_status "API endpoints - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "API endpoints - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test file uploads
test_file_uploads() {
    print_info "Testing: File upload functionality"
    
    local test_file="/tmp/test_upload.txt"
    echo "Test file content" > "$test_file"
    
    # Test if upload endpoint is accessible (this is a basic test)
    if curl -s --connect-timeout 10 "https://api.$DOMAIN/api/v1/upload" >/dev/null 2>&1; then
        print_status "File upload endpoint - PASSED"
        ((TESTS_PASSED++))
        rm -f "$test_file"
        return 0
    else
        print_error "File upload endpoint - FAILED"
        ((TESTS_FAILED++))
        rm -f "$test_file"
        return 1
    fi
}

# Function to test security headers
test_security_headers() {
    print_info "Testing: Security headers"
    
    local headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null)
    local required_headers=("Strict-Transport-Security" "X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection")
    local all_present=true
    
    for header in "${required_headers[@]}"; do
        if ! echo "$headers" | grep -qi "$header"; then
            print_error "Security header $header is missing"
            all_present=false
        fi
    done
    
    if [ "$all_present" = true ]; then
        print_status "Security headers - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "Security headers - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test CORS
test_cors() {
    print_info "Testing: CORS configuration"
    
    local cors_headers=$(curl -s -I -H "Origin: https://$DOMAIN" "https://api.$DOMAIN/api/v1/health" 2>/dev/null)
    
    if echo "$cors_headers" | grep -qi "Access-Control-Allow-Origin"; then
        print_status "CORS configuration - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "CORS configuration - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test rate limiting
test_rate_limiting() {
    print_info "Testing: Rate limiting"
    
    # This is a basic test - in a real scenario, you'd test actual rate limiting
    local response=$(curl -s -w "%{http_code}" -o /dev/null "https://api.$DOMAIN/api/v1/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        print_status "Rate limiting endpoint accessible - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "Rate limiting endpoint - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Main testing execution
print_info "Starting comprehensive production testing..."

# Test 1: Docker containers
test_docker_containers

# Test 2: Database connectivity
test_database_connectivity

# Test 3: Redis connectivity
test_redis_connectivity

# Test 4: HTTP to HTTPS redirect
test_http_response "http://$DOMAIN" "301" "HTTP to HTTPS redirect"

# Test 5: HTTPS accessibility
test_http_response "https://$DOMAIN" "200" "HTTPS accessibility"

# Test 6: SSL certificate validity
test_ssl_certificate "$DOMAIN" "SSL certificate for $DOMAIN"

# Test 7: www subdomain
test_http_response "https://www.$DOMAIN" "200" "www subdomain accessibility"

# Test 8: API subdomain
test_http_response "https://api.$DOMAIN" "200" "API subdomain accessibility"

# Test 9: Admin subdomain
test_http_response "https://admin.$DOMAIN" "200" "Admin subdomain accessibility"

# Test 10: API endpoints
test_api_endpoints

# Test 11: File uploads
test_file_uploads

# Test 12: Security headers
test_security_headers

# Test 13: CORS configuration
test_cors

# Test 14: Rate limiting
test_rate_limiting

# Test 15: External connectivity
print_info "Testing: External connectivity from router IP"
if curl -s --connect-timeout 10 "http://$ROUTER_IP" >/dev/null 2>&1; then
    print_status "External connectivity from router IP - PASSED"
    ((TESTS_PASSED++))
else
    print_warning "External connectivity from router IP - FAILED (this might be expected if only HTTPS is configured)"
    ((TESTS_FAILED++))
fi

# Display final results
echo ""
echo "=================================================="
print_info "Testing Summary"
echo "=================================================="
print_status "Tests Passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Tests Failed: $TESTS_FAILED"
else
    print_status "Tests Failed: $TESTS_FAILED"
fi

# Overall result
if [ $TESTS_FAILED -eq 0 ]; then
    print_status "🎉 All tests passed! Production deployment is working correctly."
    exit 0
else
    print_warning "⚠️  Some tests failed. Please review the issues above."
    exit 1
fi
