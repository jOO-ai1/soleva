#!/bin/bash

# Soleva Store - Local Development Quick Start Script
# This script will set up and start the local development environment

set -e

echo "🚀 Starting Soleva Store Local Development Environment..."

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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) is installed"
}

# Start local services
start_services() {
    print_status "Starting local services (PostgreSQL, Redis, Mailhog, MinIO)..."
    
    if [ ! -f "docker-compose.local.yml" ]; then
        print_error "docker-compose.local.yml not found. Please run this script from the project root."
        exit 1
    fi
    
    docker-compose -f docker-compose.local.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_success "Local services started successfully"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Check if .env exists, if not copy from example
    if [ ! -f ".env" ]; then
        if [ -f "env.local.example" ]; then
            cp env.local.example .env
            print_warning "Created .env file from example. Please review and update the configuration."
        else
            print_error "env.local.example not found in backend directory"
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    print_status "Running database migrations..."
    npx prisma migrate dev --name init
    
    # Seed database
    print_status "Seeding database..."
    npx prisma db seed
    
    print_success "Backend setup completed"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    # Check if .env.local exists, if not copy from example
    if [ ! -f ".env.local" ]; then
        if [ -f "env.local.example" ]; then
            cp env.local.example .env.local
            print_warning "Created .env.local file from example. Please review and update the configuration."
        else
            print_error "env.local.example not found in project root"
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Frontend setup completed"
}

# Setup admin panel
setup_admin() {
    print_status "Setting up admin panel..."
    
    cd admin
    
    # Install dependencies
    print_status "Installing admin dependencies..."
    npm install
    
    print_success "Admin panel setup completed"
    cd ..
}

# Start development servers
start_dev_servers() {
    print_status "Starting development servers..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 5
    
    # Start frontend in background
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Start admin panel in background
    print_status "Starting admin panel..."
    cd admin
    npm run dev &
    ADMIN_PID=$!
    cd ..
    
    # Wait for servers to start
    sleep 10
    
    print_success "Development servers started successfully!"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend:    http://localhost:3000"
    echo "   Backend API: http://localhost:5000/api/v1"
    echo "   Admin Panel: http://localhost:3001"
    echo "   Database:    http://localhost:8080"
    echo "   Email Test:  http://localhost:8025"
    echo "   File Storage: http://localhost:9001"
    echo ""
    echo "📝 Process IDs:"
    echo "   Backend: $BACKEND_PID"
    echo "   Frontend: $FRONTEND_PID"
    echo "   Admin: $ADMIN_PID"
    echo ""
    echo "🛑 To stop all services, run: ./stop-local.sh"
    echo "   Or manually kill the processes: kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID"
}

# Main execution
main() {
    echo "=========================================="
    echo "🚀 Soleva Store Local Development Setup"
    echo "=========================================="
    echo ""
    
    # Pre-flight checks
    check_docker
    check_node
    echo ""
    
    # Setup
    start_services
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    setup_admin
    echo ""
    
    # Start development servers
    start_dev_servers
    
    echo ""
    print_success "🎉 Local development environment is ready!"
    echo ""
    echo "📚 For detailed setup instructions, see LOCAL_SETUP.md"
    echo "🐛 For troubleshooting, check the logs or see the troubleshooting section in LOCAL_SETUP.md"
}

# Run main function
main "$@"
