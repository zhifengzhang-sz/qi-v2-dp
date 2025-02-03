# To solve the space/tab issue: sed -i 's/^    /\t/' Makefile
# Colors for terminal output
GREEN := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RED := $(shell tput -Txterm setaf 1)
RESET := $(shell tput sgr0)

# Always include common config
include .env

# Add MODE variable near the top, after including .env
MODE ?= single

# If running in multi-model mode, load additional model config via generate-config.js.
# Instead of including .env-multi directly (since it's JSON), let the script handle it.

# Compute OLLAMA_MODEL_NAME if not already defined (for single model mode)
ifeq ($(strip $(OLLAMA_MODEL_NAME)),)
  OLLAMA_MODEL_NAME := $(MODEL_NAME):$(MODEL_SIZE)$(if $(strip $(MODEL_VARIANT)),-$(strip $(MODEL_VARIANT)),)
endif

.PHONY: help configure start start-single start-multi install install-multi-models stop clean logs pull-model list-models model-info

# Default target shows help
.DEFAULT_GOAL := help

# Automatically generate help from targets with '##' comments
help: ## Show this help message
	@printf "$(YELLOW)Usage:$(RESET) make [target]\n\n"
	@printf "$(YELLOW)Available targets:$(RESET)\n"
	@awk 'BEGIN {FS=":.*## "}; /^[a-zA-Z0-9_-]+:.*## / { \
        target = $$1; \
        sub(/^[ \t]+/, "", target); \
        printf "  \033[32m%-20s\033[0m %s\n", target, $$2 \
    }' $(MAKEFILE_LIST)

configure: ## Generate configuration file (.env-local) from template
	@echo "$(GREEN)Generating configuration file in $(MODE) mode...$(RESET)"
	@if [ "$(MODE)" = "multi" ]; then \
		node generate-config.js --multi; \
	else \
		node generate-config.js; \
	fi

start: configure ## Generate config & start containers
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose down
	@docker-compose up -d
	@echo "$(GREEN)Waiting for services to be ready...$(RESET)"
	@sleep 10

start-multi: MODE=multi ## Start in multi-model mode with all models
start-multi: start install-multi-models

start-single: MODE=single ## Start in single-model mode with default model
start-single: start install

install: start ## Install the default model (single-model mode)
	@echo "$(GREEN)Waiting for qi-ollama container to be healthy...$(RESET)"
	@until [ "`docker inspect -f '{{.State.Health.Status}}' qi-ollama`" = "healthy" ]; do \
		echo "Waiting for qi-ollama to become healthy..."; sleep 2; \
	done
	@echo "$(GREEN)Verifying if model ${OLLAMA_MODEL_NAME} is installed...$(RESET)"
	@docker exec qi-ollama ollama list | grep -q "${OLLAMA_MODEL_NAME}" || (echo "$(GREEN)Installing model: ${OLLAMA_MODEL_NAME}...$(RESET)" && docker exec -i qi-ollama ollama pull ${OLLAMA_MODEL_NAME})
	@echo "$(GREEN)Default model installation complete.$(RESET)"

install-multi-models: ## Install all models defined in .env-multi
	@echo "$(GREEN)Installing multiple models from .env-multi...$(RESET)"
	@for model in $$(jq -r '.MODELS[].endpoints[].ollamaName' .env-multi); do \
		echo "Processing model: $$model"; \
		if ! docker exec qi-ollama ollama list | grep -q "$$model"; then \
			echo "$(GREEN)Installing model: $$model...$(RESET)"; \
			docker exec -i qi-ollama ollama pull $$model || exit 1; \
		else \
			echo "Model $$model is already installed."; \
		fi \
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