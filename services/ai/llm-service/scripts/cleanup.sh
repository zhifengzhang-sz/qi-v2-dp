#!/bin/bash
set -euo pipefail

CACHE_DIR=".cache"
MODELS_DIR="${CACHE_DIR}/models"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create models directory if it doesn't exist
if [ ! -d "${MODELS_DIR}" ]; then
    log "Creating models directory..."
    mkdir -p "${MODELS_DIR}"
fi

# Clean up old model directories without changing permissions
log "Cleaning up old model directories..."
if [ -d "${CACHE_DIR}/models--TinyLlama--TinyLlama-1.1B-Chat-v1.0" ]; then
    rm -rf "${CACHE_DIR}/models--TinyLlama--TinyLlama-1.1B-Chat-v1.0"
fi

# Clean up huggingface directory if it exists
if [ -d "${CACHE_DIR}/huggingface" ]; then
    log "Cleaning up huggingface cache..."
    rm -rf "${CACHE_DIR}/huggingface"
fi

# Remove empty directories without touching permissions
log "Removing empty directories..."
find "${CACHE_DIR}" -type d -empty -print -delete 2>/dev/null || true

log "Cache cleanup completed"
