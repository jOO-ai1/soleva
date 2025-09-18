#!/bin/bash

# Docker iptables Fix Script
# This script fixes iptables issues that prevent Docker network creation
# Specifically addresses "SKIP DNAT rule" and "No chain/target/match" errors

set -e

echo "🔧 Docker iptables Fix Script"
echo "============================="

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

# Function to stop Docker daemon
stop_docker() {
    echo "🛑 Stopping Docker daemon..."
    
    if command -v systemctl > /dev/null 2>&1; then
        sudo systemctl stop docker
        echo "✅ Docker daemon stopped"
    else
        echo "⚠️  systemctl not available, trying alternative method"
        sudo service docker stop
    fi
}

# Function to clean up iptables rules
cleanup_iptables() {
    echo "🧹 Cleaning up iptables rules..."
    
    # Check if iptables is available
    if ! command -v iptables > /dev/null 2>&1; then
        echo "❌ iptables not found"
        return 1
    fi
    
    # Flush Docker-related chains
    echo "Flushing Docker iptables chains..."
    sudo iptables -t nat -F DOCKER 2>/dev/null || echo "DOCKER chain not found in nat table"
    sudo iptables -t filter -F DOCKER 2>/dev/null || echo "DOCKER chain not found in filter table"
    sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-1 2>/dev/null || echo "DOCKER-ISOLATION-STAGE-1 chain not found"
    sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-2 2>/dev/null || echo "DOCKER-ISOLATION-STAGE-2 chain not found"
    sudo iptables -t filter -F DOCKER-USER 2>/dev/null || echo "DOCKER-USER chain not found"
    
    # Delete Docker-related chains
    echo "Deleting Docker iptables chains..."
    sudo iptables -t nat -X DOCKER 2>/dev/null || echo "DOCKER chain not found in nat table"
    sudo iptables -t filter -X DOCKER 2>/dev/null || echo "DOCKER chain not found in filter table"
    sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-1 2>/dev/null || echo "DOCKER-ISOLATION-STAGE-1 chain not found"
    sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-2 2>/dev/null || echo "DOCKER-ISOLATION-STAGE-2 chain not found"
    sudo iptables -t filter -X DOCKER-USER 2>/dev/null || echo "DOCKER-USER chain not found"
    
    echo "✅ iptables cleanup completed"
}

# Function to reset iptables to default state
reset_iptables() {
    echo "🔄 Resetting iptables to default state..."
    
    # Flush all rules
    sudo iptables -F
    sudo iptables -t nat -F
    sudo iptables -t mangle -F
    sudo iptables -t raw -F
    
    # Delete all custom chains
    sudo iptables -X
    sudo iptables -t nat -X
    sudo iptables -t mangle -X
    sudo iptables -t raw -X
    
    # Set default policies
    sudo iptables -P INPUT ACCEPT
    sudo iptables -P FORWARD ACCEPT
    sudo iptables -P OUTPUT ACCEPT
    
    echo "✅ iptables reset completed"
}

# Function to start Docker daemon
start_docker() {
    echo "🚀 Starting Docker daemon..."
    
    if command -v systemctl > /dev/null 2>&1; then
        sudo systemctl start docker
        echo "✅ Docker daemon started"
    else
        echo "⚠️  systemctl not available, trying alternative method"
        sudo service docker start
    fi
    
    # Wait for Docker to be ready
    echo "⏳ Waiting for Docker to be ready..."
    sleep 5
    
    # Check if Docker is running
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker daemon is ready"
    else
        echo "❌ Docker daemon failed to start"
        return 1
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

# Function to create solevaeg network
create_solevaeg_network() {
    echo "🌐 Creating solevaeg network..."
    
    # Create network with specific configuration
    docker network create \
        --driver bridge \
        --subnet=172.19.0.0/16 \
        --gateway=172.19.0.1 \
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
        
        # Check iptables rules
        echo "📋 iptables rules:"
        sudo iptables -t nat -L DOCKER 2>/dev/null || echo "No DOCKER chain in nat table"
        sudo iptables -t filter -L DOCKER 2>/dev/null || echo "No DOCKER chain in filter table"
    else
        echo "❌ solevaeg-network not found"
        return 1
    fi
}

# Function to test docker-compose
test_docker_compose() {
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

# Main fix process
main() {
    echo "🚀 Starting Docker iptables fix process..."
    
    # Step 1: Check Docker daemon
    check_docker_daemon
    
    # Step 2: Stop Docker daemon
    stop_docker
    
    # Step 3: Clean up iptables
    cleanup_iptables
    
    # Step 4: Reset iptables (optional, more aggressive)
    if [ "${1:-}" = "reset" ]; then
        echo "🔄 Performing full iptables reset..."
        reset_iptables
    fi
    
    # Step 5: Start Docker daemon
    start_docker
    
    # Step 6: Test basic network creation
    if test_network_creation; then
        echo "✅ Basic network creation works"
    else
        echo "❌ Basic network creation failed"
        echo "💡 This indicates a fundamental Docker networking issue"
        exit 1
    fi
    
    # Step 7: Create solevaeg network
    create_solevaeg_network
    
    # Step 8: Verify network
    verify_network
    
    # Step 9: Test docker-compose
    if test_docker_compose; then
        echo "✅ docker-compose network creation works"
    else
        echo "⚠️  docker-compose network creation failed, but manual creation works"
        echo "💡 You can use the manually created network"
    fi
    
    echo ""
    echo "🎉 Docker iptables fix completed!"
    echo "💡 You can now try: docker-compose up"
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        cleanup_iptables
        ;;
    "reset")
        main reset
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
