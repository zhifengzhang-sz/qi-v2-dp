# for format the tab spacing: use shell command: sed -i 's/^    /\t/' Makefile
.PHONY: help clean test build run docs lint install dev fmt check setup python-env download-model download-tiny download clean-cache clean-models clean-python clean-all

PYTHON_VERSION := 3.10.13
VENV_DIR := .venv
PYENV_ROOT := $(HOME)/.pyenv
PYENV_BIN := $(PYENV_ROOT)/versions/$(PYTHON_VERSION)/bin/python
SHELL := /bin/bash

# Auto-generated help menu
help: ## Show this help menu
	@echo 'Usage: make [TARGET]'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

python-env: ## Setup Python environment with pyenv
	@echo "Setting up Python $(PYTHON_VERSION)..."
	@pyenv install --skip-existing $(PYTHON_VERSION)
	@pyenv local $(PYTHON_VERSION)
	@rm -rf $(VENV_DIR)
	@$(PYENV_BIN) -m venv $(VENV_DIR)
	@. $(VENV_DIR)/bin/activate && python --version
	@$(VENV_DIR)/bin/pip install --upgrade pip

setup: clean python-env ## Setup development environment
	@echo "Installing development dependencies..."
	@$(VENV_DIR)/bin/pip install -r requirements/dev.txt
	@. $(VENV_DIR)/bin/activate && python --version

clean-python: ## Clean Python artifacts
	@echo "Cleaning Python cache..."
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@echo "Python cache cleaned"

clean-cache: ## Clean model cache
	@echo "Cleaning model cache..."
	@rm -rf .cache/models/*
	@echo "Model cache cleaned"

clean: clean-python ## Clean Python artifacts
	@echo "Clean completed"

clean-all: clean clean-cache ## Clean everything including models
	@echo "All clean completed"

install: ## Install production dependencies
	$(VENV_DIR)/bin/pip install -r requirements.txt

dev: clean ## Install development dependencies
	$(VENV_DIR)/bin/pip install -r requirements/dev.txt

fmt: ## Format code using black and isort
	black scripts tests
	isort scripts tests

check: ## Run type checking with mypy
	mypy scripts tests

lint: fmt check ## Run all linters and type checking
	flake8 scripts tests

test: lint ## Run tests with coverage
	pytest tests/test_download_model.py -v --cov=scripts --cov-report=term-missing

build: test ## Build Docker image (requires tests to pass)
	./scripts/build.sh

run: ## Run the download service
	docker compose -f docker/docker-compose.yml up

docs: ## Build documentation
	@echo "Documentation structure:"
	@tree docs/

validate: lint test ## Run all validation (lint, type check, test)

download-model: ## Download model with arguments
	python scripts/download_model.py $(MODEL_ARGS)

download-tiny: ## Download tiny test model
	$(MAKE) download-model MODEL_ARGS="--model-id hf-internal-testing/tiny-random-gpt2 --cache-dir .cache/huggingface"

download: clean-cache ## Download model with specified MODEL_ID
	@if [ -z "$(MODEL_ID)" ]; then \
		echo "Error: MODEL_ID is required. Usage: make download MODEL_ID=org/model"; \
		exit 1; \
	fi
	python scripts/download_model.py --model-id $(MODEL_ID) --cache-dir .cache