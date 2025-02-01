# To solve the space/tab issue: sed -i 's/^    /\t/' Makefile
# Colors for terminal output
GREEN := $(shell tput -Txterm setaf 2)
RED   := $(shell tput -Txterm setaf 1)
RESET := $(shell tput -Txterm sgr0)

# Include environment variables from .env
include .env

# Compute OLLAMA_MODEL_NAME if not already defined (Make does not support bash expansion)
ifeq ($(strip $(OLLAMA_MODEL_NAME)),)
  OLLAMA_MODEL_NAME := $(MODEL_NAME):$(MODEL_SIZE)$(if $(strip $(MODEL_VARIANT)),-$(strip $(MODEL_VARIANT)),)
endif

.PHONY: help configure start install stop clean logs pull-model list-models model-info

# Default target shows help
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Usage: make <target>"
	@echo "  help         Show this help message"
	@echo "  configure    Generate configuration file (.env-local) using Node.js"
	@echo "  start        Generate config & start containers"
	@echo "  install      Wait for containers to be healthy and install default model"
	@echo "  stop         Stop all containers"
	@echo "  clean        Stop containers and remove volumes"
	@echo "  logs         Show logs from all containers"
	@echo "  pull-model   Pull a new Ollama model interactively"
	@echo "  list-models  List installed models"
	@echo "  model-info   Show info for a specific model"

configure: ## Generate configuration file (.env-local) from template
	@echo "$(GREEN)Generating configuration file...$(RESET)"
	@node generate-config.js

start: configure ## Generate config and start all containers in detached mode
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose up -d

install: start ## Install the default model after containers are up
	@echo "$(GREEN)Waiting for qi-ollama container to be healthy...$(RESET)"
	@until [ "`docker inspect -f '{{.State.Health.Status}}' qi-ollama`" = "healthy" ]; do \
		echo "Waiting for qi-ollama to become healthy..."; sleep 2; \
	done
	@echo "$(GREEN)Installing model: ${OLLAMA_MODEL_NAME}...$(RESET)"
	@docker exec -i qi-ollama ollama pull ${OLLAMA_MODEL_NAME}
	@echo "$(GREEN)Models installed successfully.$(RESET)"

stop: ## Stop all containers
	@echo "$(GREEN)Stopping containers...$(RESET)"
	@docker-compose down

clean: stop ## Stop containers and remove volumes
	@echo "$(GREEN)Removing volumes...$(RESET)"
	@docker-compose down -v

logs: ## View logs from all containers
	@docker-compose logs -f

pull-model: ## Pull a new Ollama model interactively
	@read -p "Enter model name: " model; \
	docker exec -it qi-ollama ollama pull $$model

list-models: ## List installed models
	@docker exec -it qi-ollama ollama list

model-info: ## Show info for a specific model
	@read -p "Enter model name: " model; \
	docker exec -it qi-ollama ollama show $$model
