# Soleva E-commerce Platform - Makefile
# Comprehensive deployment and management commands

# Variables
COMPOSE_FILE := $(COMPOSE_CMD).yml
ENV_FILE := .env
PROJECT_NAME := solevaeg
DOMAIN := solevaeg.com

# Docker Compose command (v2)
COMPOSE_CMD := docker compose

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help install dev build deploy start stop restart logs clean backup restore ssl health test lint

# Default target
help: ## Show this help message
	@echo "$(BLUE)Soleva E-commerce Platform$(NC)"
	@echo "$(BLUE)===============================$(NC)"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and Setup
install: ## Install dependencies and setup environment
	@echo "$(BLUE)Installing Soleva E-commerce Platform...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp backend/env.example $(ENV_FILE); \
		echo "$(RED)Please edit .env file with your configuration!$(NC)"; \
	fi
	@echo "$(GREEN)✅ Installation complete!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Edit .env file with your configuration"
	@echo "  2. Run 'make dev' for development"
	@echo "  3. Run 'make deploy' for production"

# Development
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up --build -d postgres redis
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	@sleep 10
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up --build backend frontend
	@echo "$(GREEN)✅ Development environment started!$(NC)"
	@echo "$(BLUE)Frontend:$(NC) http://localhost:5173"
	@echo "$(BLUE)Backend API:$(NC) http://localhost:3001"
	@echo "$(BLUE)API Docs:$(NC) http://localhost:3001/docs"

dev-detached: ## Start development environment in background
	@echo "$(BLUE)Starting development environment (detached)...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up --build -d
	@echo "$(GREEN)✅ Development environment started in background!$(NC)"

# Production Build
build: ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)✅ Production images built successfully!$(NC)"

# Production Deployment
deploy: ## Deploy to production with SSL
	@echo "$(BLUE)Deploying Soleva to production...$(NC)"
	@echo "$(YELLOW)Building production images...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) build --no-cache
	@echo "$(YELLOW)Starting core services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up -d postgres redis
	@echo "$(YELLOW)Waiting for database...$(NC)"
	@sleep 15
	@echo "$(YELLOW)Running database migrations...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) run --rm backend npm run migrate
	@echo "$(YELLOW)Seeding database...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) run --rm backend npm run seed
	@echo "$(YELLOW)Starting application services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up -d backend frontend nginx
	@echo "$(YELLOW)Setting up SSL certificates...$(NC)"
	@make ssl
	@echo "$(GREEN)✅ Deployment complete!$(NC)"
	@make health

# SSL Certificate Setup
ssl: ## Setup SSL certificates with Let's Encrypt
	@echo "$(BLUE)Setting up SSL certificates...$(NC)"
	@if [ -z "$(ADMIN_EMAIL)" ]; then \
		echo "$(RED)Error: ADMIN_EMAIL environment variable is required$(NC)"; \
		exit 1; \
	fi
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile ssl run --rm certbot
	@echo "$(YELLOW)Reloading Nginx with SSL...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec nginx nginx -s reload
	@echo "$(GREEN)✅ SSL certificates configured!$(NC)"

ssl-renew: ## Renew SSL certificates
	@echo "$(BLUE)Renewing SSL certificates...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile ssl run --rm certbot renew
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec nginx nginx -s reload
	@echo "$(GREEN)✅ SSL certificates renewed!$(NC)"

# Service Management
start: ## Start all services
	@echo "$(BLUE)Starting all services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) start
	@echo "$(GREEN)✅ All services started!$(NC)"

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)✅ All services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting all services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)✅ All services restarted!$(NC)"

# Database Management
migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm run migrate
	@echo "$(GREEN)✅ Database migrations completed!$(NC)"

migrate-dev: ## Run database migrations for development
	@echo "$(BLUE)Running database migrations (development)...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm run migrate:dev
	@echo "$(GREEN)✅ Development database migrations completed!$(NC)"

seed: ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm run seed
	@echo "$(GREEN)✅ Database seeded successfully!$(NC)"

# Backup and Restore
backup: ## Create database and uploads backup
	@echo "$(BLUE)Creating backup...$(NC)"
	@mkdir -p backups
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec postgres pg_dump -U $${POSTGRES_USER:-solevaeg} -d $${POSTGRES_DB:-solevaeg_db} > backups/db_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@docker run --rm -v solevaeg_backend_uploads:/data -v $(PWD)/backups:/backup alpine tar czf /backup/uploads_backup_$(shell date +%Y%m%d_%H%M%S).tar.gz -C /data .
	@echo "$(GREEN)✅ Backup created in backups/ directory!$(NC)"

restore: ## Restore database from backup (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Please specify BACKUP_FILE variable$(NC)"; \
		echo "$(YELLOW)Usage: make restore BACKUP_FILE=backups/db_backup_20231201_120000.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restoring database from $(BACKUP_FILE)...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec -T postgres psql -U $${POSTGRES_USER:-solevaeg} -d $${POSTGRES_DB:-solevaeg_db} < $(BACKUP_FILE)
	@echo "$(GREEN)✅ Database restored successfully!$(NC)"

# Monitoring and Logs
logs: ## Show logs for all services
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f --tail=100

logs-backend: ## Show backend logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f backend --tail=100

logs-frontend: ## Show frontend logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f frontend --tail=100

logs-nginx: ## Show nginx logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f nginx --tail=100

logs-db: ## Show database logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f postgres --tail=100

# Health Checks
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo "$(YELLOW)Backend API:$(NC)"
	@curl -f http://localhost:3001/health 2>/dev/null && echo " $(GREEN)✅ Healthy$(NC)" || echo " $(RED)❌ Unhealthy$(NC)"
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -f http://localhost:5173 2>/dev/null && echo " $(GREEN)✅ Healthy$(NC)" || echo " $(RED)❌ Unhealthy$(NC)"
	@echo "$(YELLOW)Database:$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec postgres pg_isready -U $${POSTGRES_USER:-solevaeg} 2>/dev/null && echo " $(GREEN)✅ Healthy$(NC)" || echo " $(RED)❌ Unhealthy$(NC)"
	@echo "$(YELLOW)Redis:$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec redis redis-cli ping 2>/dev/null && echo " $(GREEN)✅ Healthy$(NC)" || echo " $(RED)❌ Unhealthy$(NC)"

# Development Tools
shell-backend: ## Open shell in backend container
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend sh

shell-frontend: ## Open shell in frontend container
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend sh

shell-db: ## Open PostgreSQL shell
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec postgres psql -U $${POSTGRES_USER:-solevaeg} -d $${POSTGRES_DB:-solevaeg_db}

shell-redis: ## Open Redis CLI
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec redis redis-cli

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm test
	@echo "$(GREEN)✅ Tests completed!$(NC)"

test-backend: ## Run backend tests
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm test

# Code Quality
lint: ## Run linting on all code
	@echo "$(BLUE)Running linting...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm run lint
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm run lint
	@echo "$(GREEN)✅ Linting completed!$(NC)"

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend npm run lint:fix
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm run lint:fix
	@echo "$(GREEN)✅ Linting fixes applied!$(NC)"

# Cleanup
clean: ## Clean up containers and volumes
	@echo "$(BLUE)Cleaning up...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

clean-all: ## Clean everything including images
	@echo "$(BLUE)Cleaning everything...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) down -v --remove-orphans --rmi all
	@docker system prune -a -f
	@echo "$(GREEN)✅ Full cleanup completed!$(NC)"

# Monitoring (Optional)
monitoring: ## Start monitoring services (Prometheus + Grafana)
	@echo "$(BLUE)Starting monitoring services...$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile monitoring up -d prometheus grafana
	@echo "$(GREEN)✅ Monitoring services started!$(NC)"
	@echo "$(BLUE)Prometheus:$(NC) http://localhost:9090"
	@echo "$(BLUE)Grafana:$(NC) http://localhost:3000 (admin/admin)"

# Quick commands
quick-start: ## Quick start for development
	@make dev-detached
	@echo "$(YELLOW)Waiting for services to start...$(NC)"
	@sleep 30
	@make migrate-dev
	@make seed
	@make health

production-deploy: ## Full production deployment
	@make build
	@make deploy
	@make health

# Update
update: ## Update and restart services
	@echo "$(BLUE)Updating services...$(NC)"
	@git pull
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) pull
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up --build -d
	@make migrate
	@echo "$(GREEN)✅ Services updated!$(NC)"

# Status
status: ## Show status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) ps
