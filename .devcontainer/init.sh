#!/bin/bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Initializing development environment...${NC}"

# Create required directories
echo "Setting up directories..."
mkdir -p /cache/{transformers,huggingface}
mkdir -p /backups/model-cache

# Make scripts executable
echo "Setting up scripts..."
chmod +x scripts/*.sh

# Install pre-commit hooks if git repository exists
if [ -d ".git" ]; then
	echo "Installing pre-commit hooks..."
	pre-commit install
fi

echo -e "${GREEN}Development environment initialized successfully!${NC}"
