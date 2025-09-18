#!/bin/bash

# Router Configuration Script for Soleva E-commerce Platform
# This script helps configure port forwarding on the router

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROUTER_IP="213.130.147.41"
ROUTER_USER="root"
ROUTER_PASSWORD="?nNL2agT#OojHOTT-ZZ0"
INTERNAL_IP="192.168.1.3"

echo -e "${BLUE}🔧 Router Configuration for Soleva E-commerce Platform${NC}"
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

# Function to test SSH connection
test_ssh_connection() {
    print_info "Testing SSH connection to router..."
    if sshpass -p "$ROUTER_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$ROUTER_USER@$ROUTER_IP" "echo 'SSH connection successful'" 2>/dev/null; then
        print_status "SSH connection successful"
        return 0
    else
        print_error "SSH connection failed"
        return 1
    fi
}

# Function to configure port forwarding
configure_port_forwarding() {
    print_info "Configuring port forwarding on router..."
    
    # Create a temporary script for the router
    cat > /tmp/router_config.sh << 'EOF'
#!/bin/bash

# Port forwarding configuration
INTERNAL_IP="192.168.1.3"

echo "Configuring port forwarding..."

# Check if iptables is available
if command -v iptables >/dev/null 2>&1; then
    echo "Using iptables for port forwarding..."
    
    # Enable IP forwarding
    echo 1 > /proc/sys/net/ipv4/ip_forward
    
    # Configure port forwarding rules
    iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination $INTERNAL_IP:80
    iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination $INTERNAL_IP:443
    
    # Configure forwarding rules
    iptables -A FORWARD -p tcp -d $INTERNAL_IP --dport 80 -j ACCEPT
    iptables -A FORWARD -p tcp -d $INTERNAL_IP --dport 443 -j ACCEPT
    
    # Save iptables rules (if iptables-save is available)
    if command -v iptables-save >/dev/null 2>&1; then
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
    fi
    
    echo "Port forwarding configured with iptables"
    
elif command -v uci >/dev/null 2>&1; then
    echo "Using UCI (OpenWrt) for port forwarding..."
    
    # Configure port forwarding using UCI
    uci set firewall.@redirect[0].name="HTTP"
    uci set firewall.@redirect[0].src="wan"
    uci set firewall.@redirect[0].src_dport="80"
    uci set firewall.@redirect[0].dest_ip="$INTERNAL_IP"
    uci set firewall.@redirect[0].dest_port="80"
    uci set firewall.@redirect[0].proto="tcp"
    
    uci set firewall.@redirect[1].name="HTTPS"
    uci set firewall.@redirect[1].src="wan"
    uci set firewall.@redirect[1].src_dport="443"
    uci set firewall.@redirect[1].dest_ip="$INTERNAL_IP"
    uci set firewall.@redirect[1].dest_port="443"
    uci set firewall.@redirect[1].proto="tcp"
    
    uci commit firewall
    /etc/init.d/firewall reload
    
    echo "Port forwarding configured with UCI"
    
else
    echo "No supported firewall configuration tool found"
    echo "Please manually configure port forwarding:"
    echo "  - External port 80 → $INTERNAL_IP:80"
    echo "  - External port 443 → $INTERNAL_IP:443"
    exit 1
fi

echo "Port forwarding configuration completed"
EOF

    # Copy and execute the script on the router
    if sshpass -p "$ROUTER_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/router_config.sh "$ROUTER_USER@$ROUTER_IP:/tmp/" 2>/dev/null; then
        print_status "Configuration script uploaded to router"
        
        if sshpass -p "$ROUTER_PASSWORD" ssh -o StrictHostKeyChecking=no "$ROUTER_USER@$ROUTER_IP" "chmod +x /tmp/router_config.sh && /tmp/router_config.sh" 2>/dev/null; then
            print_status "Port forwarding configured successfully"
        else
            print_warning "Failed to execute configuration script"
            print_info "You may need to configure port forwarding manually"
        fi
    else
        print_warning "Failed to upload configuration script"
        print_info "You may need to configure port forwarding manually"
    fi
    
    # Clean up
    rm -f /tmp/router_config.sh
}

# Function to test port forwarding
test_port_forwarding() {
    print_info "Testing port forwarding..."
    
    # Test port 80
    if timeout 10 bash -c "</dev/tcp/$ROUTER_IP/80" 2>/dev/null; then
        print_status "Port 80 is accessible"
    else
        print_warning "Port 80 is not accessible"
    fi
    
    # Test port 443
    if timeout 10 bash -c "</dev/tcp/$ROUTER_IP/443" 2>/dev/null; then
        print_status "Port 443 is accessible"
    else
        print_warning "Port 443 is not accessible"
    fi
}

# Main execution
print_info "Router Configuration for Soleva E-commerce Platform"
print_info "Router IP: $ROUTER_IP"
print_info "Internal IP: $INTERNAL_IP"

# Check if sshpass is installed
if ! command -v sshpass >/dev/null 2>&1; then
    print_error "sshpass is not installed. Please install it first:"
    print_info "  Ubuntu/Debian: sudo apt-get install sshpass"
    print_info "  CentOS/RHEL: sudo yum install sshpass"
    print_info "  macOS: brew install sshpass"
    exit 1
fi

# Test SSH connection
if test_ssh_connection; then
    # Configure port forwarding
    configure_port_forwarding
    
    # Test port forwarding
    test_port_forwarding
    
    print_status "Router configuration completed!"
    print_info "You can now proceed with the SSL certificate generation"
else
    print_error "Cannot connect to router. Please check:"
    print_info "  1. Router IP address is correct: $ROUTER_IP"
    print_info "  2. SSH is enabled on the router"
    print_info "  3. Username and password are correct"
    print_info "  4. Network connectivity to the router"
    print_info ""
    print_info "You can also configure port forwarding manually:"
    print_info "  - External port 80 → $INTERNAL_IP:80"
    print_info "  - External port 443 → $INTERNAL_IP:443"
fi
