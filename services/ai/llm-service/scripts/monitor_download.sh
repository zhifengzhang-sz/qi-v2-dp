#!/bin/bash

CACHE_DIR=".cache/hub"
MODEL_DIR="${CACHE_DIR}/models--codellama--CodeLlama-7b-instruct-hf"
INTERVAL=5

while true; do
    clear
    echo "=== CodeLlama Download Progress ==="
    echo
    echo "Time: $(date '+%H:%M:%S')"
    echo

    if [ -d "$MODEL_DIR" ]; then
        # Model files only (safetensors, bin, model files)
        model_size=$(find "$MODEL_DIR" -type f \( -name "*.safetensors" -o -name "*.bin" -o -name "*.model" \) ! -name "*.incomplete" -exec ls -l {} + |
            awk '{total += $5} END {printf "%.1fG", total/1024/1024/1024}')

        # Current downloading file
        incomplete_file=$(find "$MODEL_DIR" -name "*.incomplete" -type f -exec ls -lh {} + |
            awk '{print $5 " - " $9}')

        echo "Model Size: $model_size"
        [ -n "$incomplete_file" ] && echo "Downloading: $incomplete_file"
        echo "Status: $(find "$MODEL_DIR" -name "*.incomplete" -type f | wc -l) files downloading"
    else
        echo "Waiting for download..."
    fi
    echo "Target size: ~13GB"

    sleep $INTERVAL
done
