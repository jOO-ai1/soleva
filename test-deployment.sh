#!/usr/bin/env bash
# Test script to verify deployment setup

echo "🧪 Testing Soleva Deployment Setup"
echo "=================================="

# Test 1: Check if we're in the right directory
echo "✅ Test 1: Directory check"
if [ -f "deploy.sh" ] && [ -f ".env.production" ] && [ -f "docker-compose.prod.yml" ]; then
    echo "   ✓ All required files found in current directory"
else
    echo "   ✗ Missing required files. Please run this script from the project root."
    echo "   Required files: deploy.sh, .env.production, docker-compose.prod.yml"
    exit 1
fi

# Test 2: Check Docker Compose detection
echo ""
echo "✅ Test 2: Docker Compose detection"
if ! docker compose version >/dev/null 2>&1; then
    if ! command -v docker-compose >/dev/null; then
        echo "   ✗ Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
    echo "   ✓ Using Docker Compose v1 (docker-compose)"
    export COMPOSE_CMD="docker-compose"
else
    echo "   ✓ Using Docker Compose v2 (docker compose)"
    export COMPOSE_CMD="docker compose"
fi

# Test 3: Check environment file
echo ""
echo "✅ Test 3: Environment file validation"
if [ -f ".env.production" ]; then
    echo "   ✓ .env.production file exists"
    
    # Check for required variables
    if grep -q "DOMAIN=" .env.production && grep -q "POSTGRES_PASSWORD=" .env.production; then
        echo "   ✓ Required environment variables found"
    else
        echo "   ⚠️  Some required environment variables may be missing"
    fi
else
    echo "   ✗ .env.production file not found"
    exit 1
fi

# Test 4: Check Docker Compose configuration
echo ""
echo "✅ Test 4: Docker Compose configuration"
if $COMPOSE_CMD -f docker-compose.prod.yml config --quiet; then
    echo "   ✓ Docker Compose configuration is valid"
else
    echo "   ✗ Docker Compose configuration has errors"
    exit 1
fi

# Test 5: Check port availability
echo ""
echo "✅ Test 5: Port availability check"
for port in 80 443; do
    if ss -tuln | grep -q ":$port "; then
        echo "   ⚠️  Port $port is already in use"
    else
        echo "   ✓ Port $port is available"
    fi
done

echo ""
echo "🎉 All tests completed!"
echo ""
echo "To deploy, run:"
echo "  ./deploy.sh"
echo ""
echo "If you encounter issues, check:"
echo "  - Docker is running: docker info"
echo "  - Environment variables are set correctly"
echo "  - Ports 80 and 443 are available"
