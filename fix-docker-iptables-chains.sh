#!/bin/bash

# Docker iptables Chains Fix Script
# This script fixes iptables chain/target/match errors for Docker networking

set -e

echo "🔧 Docker iptables Chains Fix Script"
echo "===================================="

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

# Function to check iptables backend
check_iptables_backend() {
    echo "🔍 Checking iptables backend..."
    
    # Check iptables version
    if command -v iptables > /dev/null 2>&1; then
        echo "📋 iptables version:"
        iptables --version
    fi
    
    # Check current backend
    if [ -L /usr/sbin/iptables ]; then
        echo "📋 Current iptables backend:"
        ls -la /usr/sbin/iptables
        ls -la /etc/alternatives/iptables
    fi
    
    # Check if iptables-legacy is available
    if command -v iptables-legacy > /dev/null 2>&1; then
        echo "📋 iptables-legacy is available"
    else
        echo "❌ iptables-legacy not found"
    fi
    
    # Check if iptables-nft is available
    if command -v iptables-nft > /dev/null 2>&1; then
        echo "📋 iptables-nft is available"
    else
        echo "❌ iptables-nft not found"
    fi
    
    # Check if nftables is available
    if command -v nft > /dev/null 2>&1; then
        echo "📋 nftables is available"
        if sudo nft list tables > /dev/null 2>&1; then
            echo "📋 nftables is active"
        else
            echo "📋 nftables is not active"
        fi
    fi
}

# Function to switch to iptables-legacy
switch_to_iptables_legacy() {
    echo "🔄 Switching to iptables-legacy..."
    
    if command -v iptables-legacy > /dev/null 2>&1; then
        sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
        echo "✅ Switched to iptables-legacy"
        
        # Verify the switch
        echo "📋 New iptables backend:"
        ls -la /etc/alternatives/iptables
        iptables --version
    else
        echo "❌ iptables-legacy not available"
        return 1
    fi
}

# Function to switch to iptables-nft
switch_to_iptables_nft() {
    echo "🔄 Switching to iptables-nft..."
    
    if command -v iptables-nft > /dev/null 2>&1; then
        sudo update-alternatives --set iptables /usr/sbin/iptables-nft
        echo "✅ Switched to iptables-nft"
        
        # Verify the switch
        echo "📋 New iptables backend:"
        ls -la /etc/alternatives/iptables
        iptables --version
    else
        echo "❌ iptables-nft not available"
        return 1
    fi
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
        --subnet=172.25.0.0/16 \
        --gateway=172.25.0.1 \
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

# Function to provide alternative solutions
provide_alternatives() {
    echo ""
    echo "🔄 Alternative Solutions:"
    echo "========================"
    echo ""
    echo "1. Manual Network Creation:"
    echo "   docker network create --driver bridge solevaeg-network"
    echo ""
    echo "2. Use Host Network:"
    echo "   Add 'network_mode: host' to services in docker-compose.yml"
    echo ""
    echo "3. Restart Docker Daemon:"
    echo "   sudo systemctl restart docker"
    echo ""
    echo "4. Check iptables:"
    echo "   sudo iptables -L -n"
    echo ""
    echo "5. Use Different Subnet:"
    echo "   Update docker-compose.yml with different subnet (e.g., 172.26.0.0/16)"
    echo ""
    echo "6. Install iptables-legacy:"
    echo "   sudo apt-get install iptables-legacy"
    echo ""
}

# Main fix process
main() {
    echo "🚀 Starting Docker iptables chains fix process..."
    
    # Step 1: Check Docker daemon
    check_docker_daemon
    
    # Step 2: Check iptables backend
    check_iptables_backend
    
    # Step 3: Try switching to iptables-legacy
    if switch_to_iptables_legacy; then
        echo "✅ Switched to iptables-legacy"
    else
        echo "⚠️  Could not switch to iptables-legacy, continuing with current backend"
    fi
    
    # Step 4: Stop Docker daemon
    stop_docker
    
    # Step 5: Clean up iptables
    cleanup_iptables
    
    # Step 6: Reset iptables (optional, more aggressive)
    if [ "${1:-}" = "reset" ]; then
        echo "🔄 Performing full iptables reset..."
        reset_iptables
    fi
    
    # Step 7: Start Docker daemon
    start_docker
    
    # Step 8: Test basic network creation
    if test_network_creation; then
        echo "✅ Basic network creation works"
    else
        echo "❌ Basic network creation failed"
        echo "💡 This indicates a fundamental Docker networking issue"
        provide_alternatives
        exit 1
    fi
    
    # Step 9: Create solevaeg network
    create_solevaeg_network
    
    # Step 10: Verify network
    verify_network
    
    # Step 11: Test docker-compose
    if test_docker_compose; then
        echo "✅ docker-compose network creation works"
    else
        echo "⚠️  docker-compose network creation failed, but manual creation works"
        echo "💡 You can use the manually created network"
    fi
    
    echo ""
    echo "🎉 Docker iptables chains fix completed!"
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
    "backend")
        check_iptables_backend
        ;;
    "legacy")
        switch_to_iptables_legacy
        ;;
    "nft")
        switch_to_iptables_nft
        ;;
    *)
        main
        ;;
esac
