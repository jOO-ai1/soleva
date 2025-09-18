#!/bin/bash

# Start Backend Server Script
# This script ensures the backend is properly set up and starts the server

echo "🚀 Starting Soleva Backend Server"
echo "================================="

# Navigate to backend directory
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
    else
        echo "❌ No .env.example found. Please create .env manually."
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ ! -d dist ]; then
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

echo "✅ Backend setup complete!"
echo ""
echo "🌐 Starting server on http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/docs"
echo "❤️  Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev