#!/bin/bash

# Simple Docker Networking Fix Script
# This script fixes Docker networking issues without stopping Docker daemon

set -e

echo "🔧 Simple Docker Networking Fix Script"
echo "======================================"

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
}

# Function to clean up Docker resources
cleanup_docker() {
    echo "🧹 Cleaning up Docker resources..."
    
    # Stop and remove all containers
    echo "Stopping and removing containers..."
    docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"
    docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
    
    # Remove all networks except default ones
    echo "Removing custom networks..."
    for network in $(docker network ls --format "{{.Name}}" | grep -v -E "^(bridge|host|none)$"); do
        echo "Removing network: $network"
        docker network rm "$network" 2>/dev/null || echo "Network $network not found or in use"
    done
    
    # Clean up unused resources
    echo "Cleaning up unused resources..."
    docker system prune -f > /dev/null 2>&1 || echo "System prune completed"
    
    echo "✅ Docker cleanup completed"
}

# Function to test basic network creation
test_basic_network() {
    echo "🧪 Testing basic network creation..."
    
    # Try to create a simple test network
    if docker network create test-network > /dev/null 2>&1; then
        echo "✅ Basic network creation works"
        docker network rm test-network > /dev/null 2>&1
        echo "✅ Test network removed"
        return 0
    else
        echo "❌ Basic network creation failed"
        return 1
    fi
}

# Function to create solevaeg network with different configurations
create_solevaeg_network() {
    echo "🌐 Creating solevaeg network..."
    
    # Try different network configurations
    local configs=(
        "--driver bridge --subnet=172.25.0.0/16 --gateway=172.25.0.1"
        "--driver bridge --subnet=172.26.0.0/16 --gateway=172.26.0.1"
        "--driver bridge --subnet=172.27.0.0/16 --gateway=172.27.0.1"
        "--driver bridge"
    )
    
    for config in "${configs[@]}"; do
        echo "Trying configuration: $config"
        if docker network create $config solevaeg-network > /dev/null 2>&1; then
            echo "✅ solevaeg-network created successfully with config: $config"
            return 0
        else
            echo "❌ Failed with config: $config"
        fi
    done
    
    echo "❌ All network configurations failed"
    return 1
}

# Function to test docker-compose network creation
test_docker_compose() {
    echo "🧪 Testing docker-compose network creation..."
    
    # Check if docker-compose config is valid
    if docker-compose config > /dev/null 2>&1; then
        echo "✅ docker-compose configuration is valid"
    else
        echo "❌ docker-compose configuration is invalid"
        return 1
    fi
    
    # Try to create networks using docker-compose
    if timeout 30 docker-compose up --no-start > /dev/null 2>&1; then
        echo "✅ docker-compose can create networks"
        docker-compose down > /dev/null 2>&1
        return 0
    else
        echo "❌ docker-compose failed to create networks"
        return 1
    fi
}

# Function to verify network configuration
verify_network() {
    echo "🔍 Verifying network configuration..."
    
    if docker network inspect solevaeg-network > /dev/null 2>&1; then
        echo "✅ solevaeg-network exists"
        
        # Show network details
        echo "📋 Network details:"
        docker network inspect solevaeg-network --format "{{.Name}}: {{.IPAM.Config}}"
        return 0
    else
        echo "❌ solevaeg-network not found"
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
    echo "   Update docker-compose.yml with different subnet (e.g., 172.28.0.0/16)"
    echo ""
    echo "6. Install iptables-legacy:"
    echo "   sudo apt-get install iptables-legacy"
    echo ""
    echo "7. Run Comprehensive Fix:"
    echo "   ./fix-docker-iptables-chains.sh"
    echo ""
}

# Function to try switching iptables backend
try_switch_iptables_backend() {
    echo "🔄 Attempting to switch iptables backend..."
    
    # Check if iptables-legacy is available
    if command -v iptables-legacy > /dev/null 2>&1; then
        echo "📋 iptables-legacy is available, attempting to switch..."
        if sudo update-alternatives --set iptables /usr/sbin/iptables-legacy 2>/dev/null; then
            echo "✅ Switched to iptables-legacy"
            echo "📋 New iptables backend:"
            ls -la /etc/alternatives/iptables
            iptables --version
            return 0
        else
            echo "❌ Failed to switch to iptables-legacy"
        fi
    else
        echo "❌ iptables-legacy not available"
    fi
    
    # Check if iptables-nft is available
    if command -v iptables-nft > /dev/null 2>&1; then
        echo "📋 iptables-nft is available, attempting to switch..."
        if sudo update-alternatives --set iptables /usr/sbin/iptables-nft 2>/dev/null; then
            echo "✅ Switched to iptables-nft"
            echo "📋 New iptables backend:"
            ls -la /etc/alternatives/iptables
            iptables --version
            return 0
        else
            echo "❌ Failed to switch to iptables-nft"
        fi
    else
        echo "❌ iptables-nft not available"
    fi
    
    echo "⚠️  Could not switch iptables backend"
    return 1
}

# Main fix process
main() {
    echo "🚀 Starting simple Docker networking fix process..."
    
    # Step 1: Check Docker daemon
    check_docker_daemon
    
    # Step 2: Check iptables backend
    check_iptables_backend
    
    # Step 3: Try switching iptables backend
    if try_switch_iptables_backend; then
        echo "✅ iptables backend switched successfully"
    else
        echo "⚠️  Could not switch iptables backend, continuing with current backend"
    fi
    
    # Step 4: Clean up Docker resources
    cleanup_docker
    
    # Step 5: Test basic network creation
    if test_basic_network; then
        echo "✅ Basic network creation works"
    else
        echo "❌ Basic network creation failed"
        echo "💡 This indicates a fundamental Docker networking issue"
        provide_alternatives
        exit 1
    fi
    
    # Step 6: Create solevaeg network
    if create_solevaeg_network; then
        echo "✅ solevaeg-network created successfully"
    else
        echo "❌ Failed to create solevaeg-network"
        provide_alternatives
        exit 1
    fi
    
    # Step 7: Verify network
    if verify_network; then
        echo "✅ Network verification successful"
    else
        echo "❌ Network verification failed"
        exit 1
    fi
    
    # Step 8: Test docker-compose
    if test_docker_compose; then
        echo "✅ docker-compose network creation works"
        echo ""
        echo "🎉 Docker networking fix completed successfully!"
        echo "💡 You can now run: docker-compose up"
    else
        echo "⚠️  docker-compose network creation failed, but manual creation works"
        echo "💡 You can use the manually created network"
        echo ""
        echo "🎉 Partial fix completed!"
        echo "💡 Try: docker-compose up (may work with existing network)"
    fi
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        cleanup_docker
        ;;
    "test")
        test_basic_network
        ;;
    "create")
        create_solevaeg_network
        ;;
    "verify")
        verify_network
        ;;
    "compose")
        test_docker_compose
        ;;
    "backend")
        check_iptables_backend
        try_switch_iptables_backend
        ;;
    *)
        main
        ;;
esac
