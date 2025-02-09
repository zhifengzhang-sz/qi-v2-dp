.PHONY: setup env clean

# Default values
USERNAME ?= $(shell whoami)
UID ?= $(shell id -u)
GID ?= $(shell id -g)
REGISTRY ?= blackgolfer
VERSION ?= latest
MODEL_THREADS ?= 8
MODEL_MAX_MEMORY ?= 56G
MODEL_MIN_MEMORY ?= 32G
CACHE_MAX_SIZE ?= 100G

setup: env
    chmod +x init.sh scripts/*.sh
    ./init.sh

env: .env

.env:
    @echo "Generating .env file..."
    @echo "USERNAME=$(USERNAME)" > .env
    @echo "UID=$(UID)" >> .env
    @echo "GID=$(GID)" >> .env
    @echo "REGISTRY=$(REGISTRY)" >> .env
    @echo "VERSION=$(VERSION)" >> .env
    @echo "" >> .env
    @echo "# Model configuration" >> .env
    @echo "MODEL_THREADS=$(MODEL_THREADS)" >> .env
    @echo "MODEL_MAX_MEMORY=$(MODEL_MAX_MEMORY)" >> .env
    @echo "MODEL_MIN_MEMORY=$(MODEL_MIN_MEMORY)" >> .env
    @echo "" >> .env
    @echo "# Cache configuration" >> .env
    @echo "CACHE_MAX_SIZE=$(CACHE_MAX_SIZE)" >> .env
    @echo "HF_HOME=./model-cache/huggingface" >> .env
    @echo "TRANSFORMERS_CACHE=./model-cache/transformers" >> .env
    @echo "HF_TOKEN=your_hf_token_here  # Required for private models" >> .env
    @echo ".env file generated successfully"

clean:
    rm -f .env