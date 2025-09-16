#!/usr/bin/env bash
set -Eeuo pipefail

# =============================================================================
# Network Connectivity Diagnostic and Fix Script
# =============================================================================
# This script diagnoses and attempts to fix network connectivity issues
# that may be causing Docker build failures
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test basic network connectivity
test_basic_connectivity() {
    log_info "🔍 Testing basic network connectivity..."
    
    local test_hosts=(
        "8.8.8.8"
        "1.1.1.1"
        "google.com"
        "github.com"
    )
    
    local failed_hosts=()
    
    for host in "${test_hosts[@]}"; do
        if ping -c 1 -W 5 "$host" >/dev/null 2>&1; then
            log_success "✓ $host is reachable"
        else
            log_warning "✗ $host is not reachable"
            failed_hosts+=("$host")
        fi
    done
    
    if [ ${#failed_hosts[@]} -gt 0 ]; then
        log_warning "Basic connectivity issues detected for: ${failed_hosts[*]}"
        return 1
    else
        log_success "Basic network connectivity is working"
        return 0
    fi
}

# Test DNS resolution
test_dns_resolution() {
    log_info "🔍 Testing DNS resolution..."
    
    local test_domains=(
        "deb.debian.org"
        "security.debian.org"
        "registry.npmjs.org"
        "github.com"
        "google.com"
    )
    
    local failed_domains=()
    
    for domain in "${test_domains[@]}"; do
        if nslookup "$domain" >/dev/null 2>&1; then
            log_success "✓ DNS resolution for $domain works"
        else
            log_warning "✗ DNS resolution for $domain failed"
            failed_domains+=("$domain")
        fi
    done
    
    if [ ${#failed_domains[@]} -gt 0 ]; then
        log_warning "DNS resolution issues detected for: ${failed_domains[*]}"
        return 1
    else
        log_success "DNS resolution is working"
        return 0
    fi
}

# Test HTTP connectivity to package repositories
test_package_repositories() {
    log_info "🔍 Testing connectivity to package repositories..."
    
    local test_urls=(
        "http://deb.debian.org"
        "http://security.debian.org"
        "http://archive.ubuntu.com"
        "http://registry.npmjs.org"
        "https://registry.npmjs.org"
    )
    
    local failed_urls=()
    
    for url in "${test_urls[@]}"; do
        if curl -s --connect-timeout 10 --max-time 30 "$url" >/dev/null 2>&1; then
            log_success "✓ $url is reachable"
        else
            log_warning "✗ $url is not reachable"
            failed_urls+=("$url")
        fi
    done
    
    if [ ${#failed_urls[@]} -gt 0 ]; then
        log_warning "Package repository connectivity issues detected for: ${failed_urls[*]}"
        return 1
    else
        log_success "Package repository connectivity is working"
        return 0
    fi
}

# Check Docker daemon network configuration
check_docker_network() {
    log_info "🔍 Checking Docker daemon network configuration..."
    
    if ! command -v docker >/dev/null; then
        log_error "Docker is not installed"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        return 1
    fi
    
    log_info "Docker daemon information:"
    docker info | grep -E "(Server Version|Storage Driver|Logging Driver|Cgroup Version|Network|Registry)" || true
    
    log_info "Docker network configuration:"
    docker network ls || true
    
    log_success "Docker daemon is running"
    return 0
}

# Fix DNS configuration
fix_dns_configuration() {
    log_info "🔧 Attempting to fix DNS configuration..."
    
    # Backup current resolv.conf
    if [ -f /etc/resolv.conf ]; then
        sudo cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d_%H%M%S)
        log_info "Backed up current resolv.conf"
    fi
    
    # Create a more robust resolv.conf
    log_info "Configuring multiple DNS servers..."
    sudo tee /etc/resolv.conf > /dev/null << 'EOF'
# Primary DNS servers
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
nameserver 1.0.0.1

# Secondary DNS servers
nameserver 208.67.222.222
nameserver 208.67.220.220

# Options
options timeout:2
options attempts:3
options rotate
options single-request-reopen
EOF
    
    log_success "DNS configuration updated"
}

# Restart network services
restart_network_services() {
    log_info "🔧 Restarting network services..."
    
    # Restart systemd-resolved if available
    if systemctl is-active --quiet systemd-resolved; then
        log_info "Restarting systemd-resolved..."
        sudo systemctl restart systemd-resolved
        log_success "systemd-resolved restarted"
    fi
    
    # Restart NetworkManager if available
    if systemctl is-active --quiet NetworkManager; then
        log_info "Restarting NetworkManager..."
        sudo systemctl restart NetworkManager
        log_success "NetworkManager restarted"
    fi
    
    # Flush DNS cache
    log_info "Flushing DNS cache..."
    sudo systemctl flush-dns 2>/dev/null || true
    sudo resolvectl flush-caches 2>/dev/null || true
    
    log_success "Network services restarted"
}

# Configure Docker daemon for better network handling
configure_docker_network() {
    log_info "🔧 Configuring Docker daemon for better network handling..."
    
    # Create Docker daemon configuration directory if it doesn't exist
    sudo mkdir -p /etc/docker
    
    # Backup existing daemon.json if it exists
    if [ -f /etc/docker/daemon.json ]; then
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%Y%m%d_%H%M%S)
        log_info "Backed up existing daemon.json"
    fi
    
    # Create enhanced daemon.json
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"],
  "dns-opts": ["timeout:2", "attempts:3", "rotate", "single-request-reopen"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 24
    }
  ]
}
EOF
    
    log_success "Docker daemon configuration updated"
    
    # Restart Docker daemon
    log_info "Restarting Docker daemon..."
    sudo systemctl restart docker
    
    # Wait for Docker to be ready
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker info >/dev/null 2>&1; then
            log_success "Docker daemon is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for Docker daemon... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Docker daemon failed to start"
        return 1
    fi
}

# Test Docker build with network resilience
test_docker_build() {
    log_info "🔍 Testing Docker build with network resilience..."
    
    # Create a temporary directory for the test
    local test_dir=$(mktemp -d)
    
    # Create a simple test Dockerfile
    cat > "$test_dir/Dockerfile" << 'EOF'
FROM node:20-slim
# Test network connectivity and package installation with retry logic
RUN for i in {1..3}; do \
      echo "Package installation attempt $i/3"; \
      if apt-get update && apt-get install -y --no-install-recommends curl; then \
        echo "Package installation successful"; \
        break; \
      elif [ $i -lt 3 ]; then \
        echo "Package installation failed, retrying in $((i * 10)) seconds..."; \
        sleep $((i * 10)); \
      else \
        echo "All package installation attempts failed"; \
        exit 1; \
      fi; \
    done && \
    rm -rf /var/lib/apt/lists/*
# Test HTTP connectivity
RUN curl -f http://httpbin.org/get || echo "HTTP test failed but continuing"
# Test DNS resolution
RUN nslookup google.com || echo "DNS test failed but continuing"
EOF
    
    # Test the build (try BuildKit first, fallback to legacy)
    if docker buildx version >/dev/null 2>&1; then
        export DOCKER_BUILDKIT=1
        log_info "Using BuildKit for Docker build test"
    else
        export DOCKER_BUILDKIT=0
        log_info "Using legacy Docker builder for test (buildx not available)"
    fi
    
    if docker build -t network-test:latest "$test_dir"; then
        log_success "Docker build test passed"
        docker rmi network-test:latest >/dev/null 2>&1 || true
        rm -rf "$test_dir"
        return 0
    else
        log_error "Docker build test failed"
        docker rmi network-test:latest >/dev/null 2>&1 || true
        rm -rf "$test_dir"
        return 1
    fi
}

# Main function
main() {
    log_info "🚀 Starting network connectivity diagnostic and fix at $(date -Is)"
    
    local issues_found=false
    
    # 1. Test basic connectivity
    if ! test_basic_connectivity; then
        issues_found=true
    fi
    
    # 2. Test DNS resolution
    if ! test_dns_resolution; then
        issues_found=true
    fi
    
    # 3. Test package repositories
    if ! test_package_repositories; then
        issues_found=true
    fi
    
    # 4. Check Docker network
    if ! check_docker_network; then
        issues_found=true
    fi
    
    if [ "$issues_found" = true ]; then
        log_warning "Network issues detected. Attempting to fix..."
        
        # Fix DNS configuration
        fix_dns_configuration
        
        # Restart network services
        restart_network_services
        
        # Configure Docker network
        configure_docker_network
        
        # Wait a bit for changes to take effect
        log_info "Waiting for network changes to take effect..."
        sleep 10
        
        # Re-test after fixes
        log_info "🔍 Re-testing after fixes..."
        
        if test_basic_connectivity && test_dns_resolution && test_package_repositories; then
            log_success "Network issues have been resolved"
        else
            log_warning "Some network issues may still persist"
        fi
    else
        log_success "No network issues detected"
    fi
    
    # 5. Test Docker build
    if test_docker_build; then
        log_success "Docker build test passed - ready for deployment"
    else
        log_error "Docker build test failed - deployment may have issues"
        exit 1
    fi
    
    log_success "🎉 Network connectivity diagnostic and fix completed at $(date -Is)"
    log_info "💡 You can now try running the deployment script:"
    log_info "   ./deploy-with-network-fallback.sh"
}

# Run main function
main "$@"
