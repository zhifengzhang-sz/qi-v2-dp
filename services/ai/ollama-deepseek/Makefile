# To solve the space/tab issue: sed -i 's/^    /\t/' Makefile
# Colors for terminal output
GREEN := $(shell tput -Txterm setaf 2)
RESET := $(shell tput -Txterm sgr0)

include .env

MODEL_URL=https://huggingface.co/TheBloke/${MODEL_NAME}-${MODEL_SIZE}-instruct-GGUF/resolve/main/${MODEL_NAME}-${MODEL_SIZE}-instruct.${MODEL_VARIANT}.gguf

.PHONY: help start stop install logs clean restart status pull-model list-models model-info build verify speedup

help: ## Show this help message
	@echo 'Usage:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo "$(GREEN)Available targets:$(RESET)"
	@echo "  pull-model   Pull a new Ollama model"
	@echo "  list-models  List installed models" 
	@echo "  model-info   Show info for specific model"

start: ## Start all containers in detached mode
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose up -d

stop: ## Stop all containers
	@echo "$(GREEN)Stopping containers...$(RESET)"
	@docker-compose down

install: speedup ## Install models
	@echo "Installing models..."
	@docker exec -it qi-ollama ollama pull ${OLLAMA_MODEL_NAME}

logs: ## View logs from all containers
	@docker-compose logs -f

clean: stop ## Stop containers and remove volumes
	@echo "$(GREEN)Cleaning up...$(RESET)"
	@docker-compose down -v

restart: stop start ## Restart all containers

status: ## Check container status
	@docker-compose ps

pull-model: ## Pull a new Ollama model
	@read -p "Enter model name: " model; \
	docker exec -it qi-ollama ollama pull $$model

list-models: ## List installed models
	@docker exec -it qi-ollama ollama list

model-info: ## Show info for specific model
	@read -p "Enter model name: " model; \
	docker exec -it qi-ollama ollama show $$model

build: ## Build optimized Ollama
	docker-compose build ollama-service

verify: ## Check installation
	@docker exec -it qi-ollama ollama list

speedup: ## Speed up model installation
	@docker exec -i qi-ollama /bin/sh -c 'cd /root/.ollama && \
		if [ ! -f model.gguf ]; then \
			wget -O model.gguf ${MODEL_URL}; \
		fi && \
		echo "FROM ./model.gguf\nPARAMETER num_ctx ${OLLAMA_NUM_CTX}\nPARAMETER num_thread ${OLLAMA_NUM_THREAD}\nPARAMETER num_gpu ${OLLAMA_GPU}" > Modelfile && \
		ollama create ${OLLAMA_MODEL_NAME} -f Modelfile'

.DEFAULT_GOAL := help