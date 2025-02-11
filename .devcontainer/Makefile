.PHONY: setup env clean

# Default values
.PHONY: setup env clean

include .env

# Fallback values come from the system if not defined in .env.
USERNAME ?= $(shell id -un)
UID ?= $(shell id -u)
GID ?= $(shell id -g)
REGISTRY ?= blackgolfer
VERSION ?= latest
COMPOSE_PROJECT_NAME ?= qi-v2-dp

# Model settings
MODEL_THREADS = 8
MODEL_MAX_MEMORY = 60129542144
MODEL_MIN_MEMORY = 34359738368

setup: env
	mkdir -p ../services/ai/python/.cache/{transformers,huggingface,torch}
	chmod -R 775 ../services/ai/python/.cache

env: .env

.env:
	@echo "Creating .env file..."
	@echo "COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)" > .env
	@echo "USERNAME=$(USERNAME)" >> .env
	@echo "UID=$(UID)" >> .env
	@echo "GID=$(GID)" >> .env
	@echo "REGISTRY=$(REGISTRY)" >> .env
	@echo "VERSION=$(VERSION)" >> .env
	@echo "MODEL_THREADS=$(MODEL_THREADS)" >> .env
	@echo "MODEL_MAX_MEMORY=$(MODEL_MAX_MEMORY)" >> .env
	@echo "MODEL_MIN_MEMORY=$(MODEL_MIN_MEMORY)" >> .env
	@echo "PYTHON_WORKDIR=/home/$(USERNAME)/python" >> .env
	@echo "QI_WORKDIR=/home/$(USERNAME)/qi" >> .env

clean:
	rm -f .env
	rm -rf ../services/ai/python/.cache