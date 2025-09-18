#!/bin/bash

# Soleva Store - Stop Local Development Environment
# This script will stop all local development services

set -e

echo "🛑 Stopping Soleva Store Local Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop Docker services
stop_docker_services() {
    print_status "Stopping Docker services..."
    
    if [ -f "docker-compose.local.yml" ]; then
        docker-compose -f docker-compose.local.yml down
        print_success "Docker services stopped"
    else
        print_warning "docker-compose.local.yml not found"
    fi
}

# Stop Node.js processes
stop_node_processes() {
    print_status "Stopping Node.js development servers..."
    
    # Kill processes running on common development ports
    for port in 3000 3001 5000; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_status "Stopping process on port $port (PID: $PID)"
            kill $PID 2>/dev/null || true
        fi
    done
    
    # Also kill any node processes that might be running our dev servers
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "tsx.*watch" 2>/dev/null || true
    
    print_success "Node.js processes stopped"
}

# Clean up temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove any temporary files created during development
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo "=========================================="
    echo "🛑 Stopping Soleva Store Development Environment"
    echo "=========================================="
    echo ""
    
    stop_node_processes
    echo ""
    
    stop_docker_services
    echo ""
    
    cleanup
    echo ""
    
    print_success "🎉 All services stopped successfully!"
    echo ""
    echo "💡 To start the development environment again, run: ./start-local.sh"
    echo "🗑️  To remove all data and start fresh, run: docker-compose -f docker-compose.local.yml down -v"
}

# Run main function
main "$@"
