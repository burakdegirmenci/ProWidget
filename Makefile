# ================================
# ProWidget Makefile
# Convenience commands for development
# ================================

.PHONY: help install dev build start stop restart logs clean db-reset db-migrate db-seed

# Default target
help:
	@echo "ProWidget - Available Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install all dependencies"
	@echo "  make setup        - Full setup (install + db migrate)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-docker   - Start with Docker (dev mode)"
	@echo ""
	@echo "Production:"
	@echo "  make build        - Build all services"
	@echo "  make start        - Start production containers"
	@echo "  make stop         - Stop all containers"
	@echo "  make restart      - Restart all containers"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-reset     - Reset database (WARNING: deletes data)"
	@echo "  make db-seed      - Seed database with sample data"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs         - View container logs"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make shell-backend - Open shell in backend container"
	@echo ""

# ================================
# Setup
# ================================

install:
	@echo "Installing dependencies..."
	cd backend && npm install
	cd admin-panel && npm install
	cd xml-parser && npm install
	cd cdn && npm install
	@echo "Dependencies installed!"

setup: install db-migrate
	@echo "Setup complete!"

# ================================
# Development
# ================================

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:3000"
	@echo "Admin: http://localhost:3001"
	@make -j3 dev-backend dev-admin dev-xml-parser

dev-backend:
	cd backend && npm run dev

dev-admin:
	cd admin-panel && npm run dev

dev-xml-parser:
	cd xml-parser && npm run dev

dev-docker:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# ================================
# Production
# ================================

build:
	@echo "Building Docker images..."
	docker-compose build

start:
	@echo "Starting production containers..."
	docker-compose up -d
	@echo ""
	@echo "Services started:"
	@echo "  Backend API: http://localhost:3000"
	@echo "  Admin Panel: http://localhost:3001"
	@echo ""

stop:
	@echo "Stopping containers..."
	docker-compose down

restart: stop start

# ================================
# Database
# ================================

db-migrate:
	@echo "Running database migrations..."
	cd backend && npx prisma migrate deploy

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	cd backend && npx prisma migrate reset --force

db-seed:
	@echo "Seeding database..."
	cd backend && npx prisma db seed

db-studio:
	@echo "Opening Prisma Studio..."
	cd backend && npx prisma studio

# ================================
# Utilities
# ================================

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-admin:
	docker-compose logs -f admin

logs-parser:
	docker-compose logs -f xml-parser

clean:
	@echo "Cleaning up..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup complete!"

shell-backend:
	docker-compose exec backend sh

shell-db:
	docker-compose exec db psql -U $${POSTGRES_USER:-pwx_user} -d $${POSTGRES_DB:-prowidget}

# ================================
# Testing
# ================================

test:
	@echo "Running tests..."
	cd backend && npm test
	cd admin-panel && npm test

test-backend:
	cd backend && npm test

test-admin:
	cd admin-panel && npm test

# ================================
# CDN Build
# ================================

build-cdn:
	@echo "Building CDN scripts..."
	cd cdn && npm run build
	@echo "CDN build complete! Output in cdn/dist/"

# ================================
# Health Check
# ================================

health:
	@echo "Checking service health..."
	@curl -s http://localhost:3000/api/health | jq . || echo "Backend: Not responding"
	@curl -s http://localhost:3001 > /dev/null && echo "Admin: OK" || echo "Admin: Not responding"
