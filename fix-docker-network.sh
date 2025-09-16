#!/bin/bash

# Docker Network Troubleshooting and Fix Script
# This script helps diagnose and fix Docker network creation issues

set -e

echo "🔧 Docker Network Troubleshooting and Fix Script"
echo "================================================"

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

# Function to clean up existing networks
cleanup_networks() {
    echo "🧹 Cleaning up existing networks..."
    
    # Remove any existing solevaeg networks
    for network in $(docker network ls --format "{{.Name}}" | grep -E "(solevaeg|web_solevaeg)"); do
        echo "Removing network: $network"
        docker network rm "$network" 2>/dev/null || echo "Network $network not found or in use"
    done
    
    echo "✅ Network cleanup completed"
}

# Function to check iptables status
check_iptables() {
    echo "🔍 Checking iptables status..."
    
    # Check if iptables is available
    if command -v iptables > /dev/null 2>&1; then
        echo "✅ iptables is available"
        
        # Check if we can list rules (requires sudo)
        if sudo iptables -L > /dev/null 2>&1; then
            echo "✅ iptables rules can be accessed"
        else
            echo "⚠️  Cannot access iptables rules (may need sudo)"
        fi
    else
        echo "❌ iptables not found"
    fi
    
    # Check for nftables
    if command -v nft > /dev/null 2>&1; then
        echo "ℹ️  nftables is available (may conflict with iptables)"
    fi
}

# Function to test network creation
test_network_creation() {
    echo "🧪 Testing network creation..."
    
    # Try to create a test network
    if docker network create --driver bridge test-network > /dev/null 2>&1; then
        echo "✅ Test network created successfully"
        docker network rm test-network > /dev/null 2>&1
        echo "✅ Test network removed successfully"
    else
        echo "❌ Failed to create test network"
        return 1
    fi
}

# Function to create solevaeg network manually
create_solevaeg_network() {
    echo "🌐 Creating solevaeg network manually..."
    
    # Create network with specific configuration
    docker network create \
        --driver bridge \
        --subnet=172.18.0.0/16 \
        --gateway=172.18.0.1 \
        --opt com.docker.network.bridge.enable_icc=true \
        --opt com.docker.network.bridge.enable_ip_masquerade=true \
        --opt com.docker.network.bridge.host_binding_ipv4=0.0.0.0 \
        solevaeg-network
    
    echo "✅ solevaeg-network created successfully"
}

# Function to verify network configuration
verify_network() {
    echo "🔍 Verifying network configuration..."
    
    if docker network inspect solevaeg-network > /dev/null 2>&1; then
        echo "✅ solevaeg-network exists"
        
        # Show network details
        echo "📋 Network details:"
        docker network inspect solevaeg-network --format "{{.Name}}: {{.IPAM.Config}}"
    else
        echo "❌ solevaeg-network not found"
        return 1
    fi
}

# Function to test docker-compose network creation
test_compose_network() {
    echo "🧪 Testing docker-compose network creation..."
    
    # Try to create networks using docker-compose
    if docker-compose config > /dev/null 2>&1; then
        echo "✅ docker-compose configuration is valid"
        
        # Try to create networks
        if docker-compose up --no-start > /dev/null 2>&1; then
            echo "✅ docker-compose can create networks"
            docker-compose down > /dev/null 2>&1
        else
            echo "❌ docker-compose failed to create networks"
            return 1
        fi
    else
        echo "❌ docker-compose configuration is invalid"
        return 1
    fi
}

# Main troubleshooting process
main() {
    echo "🚀 Starting Docker network troubleshooting..."
    
    # Step 1: Check Docker daemon
    check_docker_daemon
    
    # Step 2: Check iptables
    check_iptables
    
    # Step 3: Clean up existing networks
    cleanup_networks
    
    # Step 4: Test basic network creation
    if test_network_creation; then
        echo "✅ Basic network creation works"
    else
        echo "❌ Basic network creation failed"
        echo "💡 This indicates a fundamental Docker networking issue"
        echo "💡 Try: sudo systemctl restart docker"
        exit 1
    fi
    
    # Step 5: Create solevaeg network manually
    create_solevaeg_network
    
    # Step 6: Verify network
    verify_network
    
    # Step 7: Test docker-compose
    if test_compose_network; then
        echo "✅ docker-compose network creation works"
    else
        echo "⚠️  docker-compose network creation failed, but manual creation works"
        echo "💡 You can use the manually created network"
    fi
    
    echo ""
    echo "🎉 Docker network troubleshooting completed!"
    echo "💡 You can now try: docker-compose up"
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        cleanup_networks
        ;;
    "test")
        test_network_creation
        ;;
    "create")
        create_solevaeg_network
        ;;
    "verify")
        verify_network
        ;;
    *)
        main
        ;;
esac
