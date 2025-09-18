# Soleva E-commerce Platform Makefile
# Provides easy commands for database management and development

.PHONY: help install setup db-reset db-setup dev clean verify

# Default target
help:
	@echo "🔧 Soleva Backend Management"
	@echo "=========================="
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make setup      - Complete setup (install + database)"
	@echo "  make db-reset   - Reset database completely (⚠️  DESTROYS ALL DATA)"
	@echo "  make db-setup   - Setup clean database with sample data"
	@echo "  make dev        - Start development server"
	@echo "  make verify     - Verify backend configuration"
	@echo "  make clean      - Clean build artifacts and dependencies"
	@echo "  make fix        - Fix database connection issues"
	@echo ""
	@echo "⚠️  Database operations will delete existing data!"

# Install dependencies
install:
	@echo "📦 Installing backend dependencies..."
	@cd backend && npm install
	@echo "✅ Dependencies installed"

# Complete setup
setup: install db-setup
	@echo "🎉 Complete setup finished!"

# Reset database completely
db-reset:
	@echo "🔥 WARNING: This will DELETE ALL DATABASE DATA!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@node database-reset.js

# Setup clean database
db-setup:
	@echo "🗄️  Setting up clean database..."
	@node setup-clean-database.js

# Start development server
dev:
	@echo "🚀 Starting development server..."
	@cd backend && npm run dev

# Verify backend configuration
verify:
	@echo "🔍 Verifying backend setup..."
	@node verify-backend.js

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd backend && rm -rf dist/ node_modules/ .next/ .turbo/
	@echo "✅ Clean completed"

# Fix database connection issues
fix:
	@echo "🔧 Fixing database connection issues..."
	@node fix-database-connection.js

# Quick development setup
quick:
	@echo "⚡ Quick setup (for existing database)..."
	@cd backend && npm install && npx prisma generate && npm run build
	@echo "✅ Quick setup completed"

# Production setup
prod-setup: install
	@echo "🏭 Production setup..."
	@cd backend && npx prisma generate && npm run build
	@echo "✅ Production setup completed"

# Database migration
migrate:
	@echo "🔄 Running database migrations..."
	@cd backend && npx prisma migrate deploy
	@echo "✅ Migrations completed"

# Create new migration
migrate-dev:
	@echo "📝 Creating new migration..."
	@cd backend && npx prisma migrate dev
	@echo "✅ Migration created"

# Seed database only
seed:
	@echo "🌱 Seeding database..."
	@cd backend && npm run seed
	@echo "✅ Database seeded"

# Full reset and setup (most comprehensive)
reset-all: clean install db-reset
	@echo "🎊 Complete reset and setup finished!"
	@echo "🚀 Ready to start development server with: make dev"