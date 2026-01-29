# Wpp-Total-Search Makefile
.PHONY: help install run test lint docker-build docker-run clean

# Default target
help:
	@echo "Wpp-Total-Search - Cross-Platform Search Intelligence"
	@echo ""
	@echo "Usage:"
	@echo "  make install      Install dependencies"
	@echo "  make run          Run the development server"
	@echo "  make test         Run tests"
	@echo "  make lint         Run linting"
	@echo "  make docker-build Build Docker image"
	@echo "  make docker-run   Run with Docker Compose"
	@echo "  make clean        Clean up generated files"

# Install dependencies
install:
	cd backend && pip install -r requirements.txt

# Run development server
run:
	cd backend && uvicorn app.main:app --reload --port 8000

# Run tests
test:
	cd backend && pytest tests/ -v

# Run tests with coverage
test-cov:
	cd backend && pytest tests/ -v --cov=app --cov-report=html

# Run linting
lint:
	cd backend && ruff check app/
	cd backend && mypy app/ --ignore-missing-imports

# Format code
format:
	cd backend && ruff format app/

# Build Docker image
docker-build:
	docker-compose build

# Run with Docker Compose
docker-run:
	docker-compose up

# Run with Docker Compose (detached)
docker-up:
	docker-compose up -d

# Stop Docker Compose
docker-down:
	docker-compose down

# View logs
docker-logs:
	docker-compose logs -f backend

# Clean up
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true

# Setup development environment
setup:
	cd backend && python -m venv venv
	cd backend && . venv/bin/activate && pip install -r requirements.txt
	cp backend/.env.example backend/.env
	@echo "✅ Setup complete! Run 'make run' to start the server"
