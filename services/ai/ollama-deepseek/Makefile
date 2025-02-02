# To solve the space/tab issue: sed -i 's/^    /\t/' Makefile
# Colors for terminal output
GREEN := $(shell tput -Txterm setaf 2)
RED   := $(shell tput -Txterm setaf 1)
RESET := $(shell tput sgr0)

# Always include common config
include .env

# If running in multi-model mode, load additional model config via generate-config.js.
# Instead of including .env-multi directly (since it's JSON), let the script handle it.

# Compute OLLAMA_MODEL_NAME if not already defined (for single model mode)
ifeq ($(strip $(OLLAMA_MODEL_NAME)),)
  OLLAMA_MODEL_NAME := $(MODEL_NAME):$(MODEL_SIZE)$(if $(strip $(MODEL_VARIANT)),-$(strip $(MODEL_VARIANT)),)
endif

.PHONY: help configure start install install-multi-models stop clean logs pull-model list-models model-info

# Default target shows help
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Usage: make <target>"
	@echo "  help                 Show this help message"
	@echo "  configure            Generate configuration file (.env-local) using Node.js"
	@echo "  start                Generate config & start containers"
	@echo "  install              Install the default (single) model if not already installed"
	@echo "  install-multi-models Install models defined in .env-multi if not installed"
	@echo "  stop                 Stop all containers"
	@echo "  clean                Stop containers and remove volumes"
	@echo "  logs                 Show logs from all containers"
	@echo "  pull-model           Pull a new Ollama model interactively"
	@echo "  list-models          List installed models"
	@echo "  model-info           Show info for a specific model"

configure: ## Generate configuration file (.env-local) from template
	@echo "$(GREEN)Generating configuration file...$(RESET)"
	@node generate-config.js

start: configure ## Generate config and start all containers in detached mode
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose up -d

install: start ## Install the default model (single-model mode)
	@echo "$(GREEN)Waiting for qi-ollama container to be healthy...$(RESET)"
	@until [ "`docker inspect -f '{{.State.Health.Status}}' qi-ollama`" = "healthy" ]; do \
		echo "Waiting for qi-ollama to become healthy..."; sleep 2; \
	done
	@echo "$(GREEN)Verifying if model ${OLLAMA_MODEL_NAME} is installed...$(RESET)"
	@docker exec qi-ollama ollama list | grep -q "${OLLAMA_MODEL_NAME}" || (echo "$(GREEN)Installing model: ${OLLAMA_MODEL_NAME}...$(RESET)" && docker exec -i qi-ollama ollama pull ${OLLAMA_MODEL_NAME})
	@echo "$(GREEN)Default model installation complete.$(RESET)"

install-multi-models: start ## Install the models defined in .env-multi (multi-model mode)
	@echo "$(GREEN)Installing multi-models from .env-multi...$(RESET)"
	@for model in $$(jq -r '.MODELS[].endpoints[].ollamaName' .env-multi); do \
	  echo "Processing model: $$model"; \
	  docker exec qi-ollama ollama list | grep -q "$$model" || (echo "$(GREEN)Installing model: $$model...$(RESET)" && docker exec -i qi-ollama ollama pull $$model); \
	done
	@echo "$(GREEN)Multi-model installation complete.$(RESET)"

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
