#!/bin/bash

MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $(($RETRY_COUNT + 1)) of $MAX_RETRIES"
    if docker compose -f docker/docker-compose.yml build; then
        echo "Build successful!"
        exit 0
    fi
    RETRY_COUNT=$(($RETRY_COUNT + 1))
    echo "Build failed. Waiting 10 seconds before retry..."
    sleep 10
done

echo "Build failed after $MAX_RETRIES attempts"
exit 1
