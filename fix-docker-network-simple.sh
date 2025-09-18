#!/bin/bash

# Simple Docker Network Fix Script
# This script fixes Docker network creation issues without requiring sudo access

set -e

echo "🔧 Simple Docker Network Fix Script"
echo "==================================="

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
        "--driver bridge --subnet=172.19.0.0/16 --gateway=172.19.0.1"
        "--driver bridge --subnet=172.20.0.0/16 --gateway=172.20.0.1"
        "--driver bridge --subnet=172.21.0.0/16 --gateway=172.21.0.1"
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
    echo "   Update docker-compose.yml with different subnet (e.g., 172.22.0.0/16)"
    echo ""
}

# Main fix process
main() {
    echo "🚀 Starting simple Docker network fix process..."
    
    # Step 1: Check Docker daemon
    check_docker_daemon
    
    # Step 2: Clean up Docker resources
    cleanup_docker
    
    # Step 3: Test basic network creation
    if test_basic_network; then
        echo "✅ Basic network creation works"
    else
        echo "❌ Basic network creation failed"
        echo "💡 This indicates a fundamental Docker networking issue"
        provide_alternatives
        exit 1
    fi
    
    # Step 4: Create solevaeg network
    if create_solevaeg_network; then
        echo "✅ solevaeg-network created successfully"
    else
        echo "❌ Failed to create solevaeg-network"
        provide_alternatives
        exit 1
    fi
    
    # Step 5: Verify network
    if verify_network; then
        echo "✅ Network verification successful"
    else
        echo "❌ Network verification failed"
        exit 1
    fi
    
    # Step 6: Test docker-compose
    if test_docker_compose; then
        echo "✅ docker-compose network creation works"
        echo ""
        echo "🎉 Docker network fix completed successfully!"
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
    *)
        main
        ;;
esac
