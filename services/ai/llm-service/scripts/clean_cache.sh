#!/bin/bash
set -euo pipefail # Strict error handling

CACHE_DIR=".cache"
MODELS_DIR="${CACHE_DIR}/models"

# Log function for debugging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create models directory
log "Creating models directory..."
mkdir -p "${MODELS_DIR}"

# Move model directories with checks
for dir in "${CACHE_DIR}"/models--*; do
    if [ -d "$dir" ] && [ -n "$(ls -A "$dir" 2>/dev/null)" ]; then
        model_name=$(basename "$dir" | sed 's/models--//')
        target_dir="${MODELS_DIR}/${model_name}"
        log "Moving $dir to ${target_dir}..."
        mkdir -p "${target_dir}"
        cp -r "$dir/." "${target_dir}/"
        rm -rf "$dir"
    fi
done

# Handle huggingface directory
if [ -d "${CACHE_DIR}/huggingface" ] && [ -n "$(ls -A "${CACHE_DIR}/huggingface" 2>/dev/null)" ]; then
    log "Moving huggingface cache..."
    model_name="hf-internal-testing--tiny-random-gpt2"
    target_dir="${MODELS_DIR}/${model_name}"
    mkdir -p "${target_dir}"
    cp -r "${CACHE_DIR}/huggingface/." "${target_dir}/"
    rm -rf "${CACHE_DIR}/huggingface"
fi

# Clean up empty directories and links
log "Cleaning up..."
find "${CACHE_DIR}" -type l -delete
find "${CACHE_DIR}" -type d -empty -delete

log "Cache cleanup completed"
