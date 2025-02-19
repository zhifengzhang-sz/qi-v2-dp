.PHONY: help download start-cpu start-gpu stop clean test lint clean-cache download-clean fix-permissions build-base download-model show-config

# Configuration
DOCKER_COMPOSE := docker compose
SERVICE_NAME := llm-service
CONFIG_DIR := config
DOCKER_DIR := docker
CACHE_DIR := .cache
MIN_SPACE_GB := 15

# Colors for pretty printing
GREEN := \033[0;32m
NC := \033[0m # No Color

# Help target
help:
	@echo "LLM Service Management Commands:"
	@echo "--------------------------------"
	@echo "${GREEN}Basic Commands:${NC}"
	@echo "  make download    - Download model using downloader container"
	@echo "  make start-cpu  - Start service in CPU mode"
	@echo "  make start-gpu  - Start service in GPU mode"
	@echo "  make stop       - Stop all running services"
	@echo ""
	@echo "${GREEN}Development Commands:${NC}"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Run linters"
	@echo "  make clean      - Clean up cache and temporary files"
	@echo "  make build-base     - Build base Docker image"
	@echo "  make download-model - Download model (resumable)"
	@echo "  make clean-cache    - Clean model cache (with confirmation)"

# Core service commands
build-base:
	@echo "Building base Docker image..."
	@if ! docker image inspect local/llm-service-base:latest >/dev/null 2>&1; then \
	    echo "Building fresh base image..."; \
	    BUILD_DATE=$$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
	    $(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.download.yml build base; \
	else \
	    echo "Using cached base image"; \
	fi

export MODEL_ID ?= $(shell grep MODEL_ID config/models/model.env | cut -d'=' -f2)

download-model:
	@echo "Starting download for model: $${MODEL_ID}"
	@MODEL_ID="$${MODEL_ID}" docker compose -f docker/docker-compose.download.yml up --force-recreate download

download:
	@echo "Warning: 'make download' is deprecated."
	@echo "Use 'make download-model' instead for better download management"
	@make download-model

start-cpu:
	@echo "Starting service in CPU mode..."
	$(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.cpu.yml up -d

start-gpu:
	@echo "Starting service in GPU mode..."
	$(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.gpu.yml up -d

stop:
	@echo "Stopping all services..."
	-$(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.cpu.yml down
	-$(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.gpu.yml down
	-$(DOCKER_COMPOSE) -f $(DOCKER_DIR)/docker-compose.download.yml down

# Development commands
test:
	@echo "Running tests..."
	# Add test commands here

lint:
	@echo "Running linters..."
	# Add lint commands here

clean:
	@echo "Cleaning up..."
	rm -rf $(CACHE_DIR)/*

clean-cache:
	@echo "WARNING: This will remove ALL downloaded models!"
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
	    echo "Cleaning model cache..."; \
	    sudo rm -rf $(CACHE_DIR)/* && \
	    echo "Cache cleaned successfully"; \
	else \
	    echo "Operation cancelled"; \
	fi

# Keep this for backwards compatibility but mark as deprecated
download-clean:
	@echo "Warning: 'download-clean' is deprecated."
	@echo "Use 'make download-model' to download while preserving existing models."
	@echo "Use 'make clean-cache' if you really need to clean the cache."
	@exit 1

# Add new target for fixing permissions
fix-permissions:
	@echo "Fixing cache directory permissions..."
	@sudo chown -R $(shell id -u):$(shell id -g) .cache
	@sudo chmod -R u+rw .cache
	@echo "Permissions fixed"

show-config:
	@echo "=== Download Configuration ==="
	@echo "MODEL_ID: $${MODEL_ID:-$$(grep MODEL_ID config/models/model.env | cut -d'=' -f2)}"
	@echo "CACHE_DIR: $(CACHE_DIR)"
	@echo "MIN_SPACE_GB: $(MIN_SPACE_GB)"
	@echo
	@echo "=== Environment Files ==="
	@echo "Default ENV:"
	@cat config/infra/default.env
	@echo
	@echo "Model ENV:"
	@cat config/models/model.env
	@echo
	@echo "=== Docker Compose Environment ==="
	@docker compose -f docker/docker-compose.download.yml config