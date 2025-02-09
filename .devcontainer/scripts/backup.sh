#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/backups/model-cache"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${CACHE_RETENTION_DAYS:-30}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating model cache backup..."
tar -czf "$BACKUP_DIR/model-cache_$TIMESTAMP.tar.gz" -C /cache .

# Cleanup old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "model-cache_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: $BACKUP_DIR/model-cache_$TIMESTAMP.tar.gz"
