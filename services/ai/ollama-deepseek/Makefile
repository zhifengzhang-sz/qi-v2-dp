# To solve the space/tab issue: sed -i 's/^    /\t/' Makefile
# Colors for terminal output
GREEN := $(shell tput -Txterm setaf 2)
RESET := $(shell tput -Txterm sgr0)

.PHONY: help start stop install logs clean restart status

help: ## Show this help message
	@echo 'Usage:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

start: ## Start all containers in detached mode
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose up -d

stop: ## Stop all containers
	@echo "$(GREEN)Stopping containers...$(RESET)"
	@docker-compose down

install: ## Install Deepseek model
	@echo "$(GREEN)Installing Deepseek model...$(RESET)"
	@docker exec -it qi-ollama ollama pull deepseek-r1:7b

logs: ## View logs from all containers
	@docker-compose logs -f

clean: stop ## Stop containers and remove volumes
	@echo "$(GREEN)Cleaning up...$(RESET)"
	@docker-compose down -v

restart: stop start ## Restart all containers

status: ## Check container status
	@docker-compose ps

.DEFAULT_GOAL := help