#!/bin/bash
set -euo pipefail

CACHE_DIR="${CACHE_DIR:-.cache}"
MODEL_ID="$1"
INTERVAL=5

if [ -z "$MODEL_ID" ]; then
    echo "Usage: $0 <model-id>"
    exit 1
fi

MODEL_DIR="$CACHE_DIR/models/${MODEL_ID//\/\//--}"

while true; do
    clear
    echo "=== Model Download Progress: $MODEL_ID ==="
    echo "Time: $(date '+%H:%M:%S')"
    echo

    if [ -d "$MODEL_DIR" ]; then
        # Get downloaded size
        size=$(du -sh "$MODEL_DIR" 2>/dev/null | cut -f1)
        echo "Current Size: $size"

        # Check for safetensors/pytorch files
        weights=$(find "$MODEL_DIR" -type f \( -name "*.safetensors" -o -name "*.bin" \))
        if [ -n "$weights" ]; then
            echo "Model weights downloaded"
        else
            echo "Waiting for model weights..."
        fi
    else
        echo "Waiting for download to start..."
    fi

    sleep $INTERVAL
done
