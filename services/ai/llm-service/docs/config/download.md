# Download Configuration

## Environment Variables

```yaml
# Base Configuration
LLM_CACHE_DIR=/data/model-cache      # Base directory for model cache
LLM_MAX_CACHE_SIZE=100GB             # Maximum cache size
LLM_WORKERS=4                        # Number of download workers

# Network Configuration
LLM_DOWNLOAD_TIMEOUT=3600            # Download timeout in seconds
LLM_MAX_RETRIES=3                    # Maximum retry attempts
LLM_CHUNK_SIZE=8MB                   # Download chunk size

# Storage Configuration
LLM_MIN_FREE_SPACE=20GB              # Minimum free space required
LLM_CLEANUP_INTERVAL=3600            # Cache cleanup interval in seconds
LLM_MAX_PARALLEL_DOWNLOADS=2         # Maximum parallel downloads

# Authentication
LLM_HF_TOKEN=${HF_TOKEN}            # HuggingFace API token
LLM_AUTH_ENABLED=true                # Enable authentication

# Metrics
LLM_METRICS_ENABLED=true             # Enable metrics collection
LLM_METRICS_PORT=9090                # Metrics server port
```

## Configuration File

```yaml
# filepath: /home/zzhang/dev/qi/github/qi-v2-dp/services/ai/llm-service/config/download.yaml
storage:
  cache_dir: /data/model-cache
  max_size: 107374182400 # 100GB
  min_free_space: 21474836480 # 20GB
  cleanup_interval: 3600

network:
  timeout: 3600
  max_retries: 3
  chunk_size: 8388608 # 8MB
  max_parallel: 2

workers:
  count: 4
  queue_size: 100

auth:
  enabled: true
  token: ${HF_TOKEN}

metrics:
  enabled: true
  port: 9090
  collectors:
    - download_progress
    - cache_usage
    - worker_status
```

## Docker Environment

```yaml
# filepath: /home/zzhang/dev/qi/github/qi-v2-dp/services/ai/llm-service/docker-compose.download.yml
version: "3.8"

services:
  download:
    build: .
    environment:
      - LLM_CACHE_DIR=/data/model-cache
      - LLM_MAX_CACHE_SIZE=100GB
      - LLM_WORKERS=4
      - LLM_HF_TOKEN=${HF_TOKEN}
    volumes:
      - model-cache:/data/model-cache
    configs:
      - source: download_config
        target: /app/config/download.yaml

configs:
  download_config:
    file: ./config/download.yaml

volumes:
  model-cache:
    driver: local
```

## Configuration Loading

```python
# filepath: /home/zzhang/dev/qi/github/qi-v2-dp/services/ai/llm-service/core/config.py
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from pydantic import BaseSettings, ByteSize

@dataclass
class StorageConfig:
    cache_dir: Path
    max_size: ByteSize
    min_free_space: ByteSize
    cleanup_interval: int

@dataclass
class NetworkConfig:
    timeout: int
    max_retries: int
    chunk_size: ByteSize
    max_parallel: int

@dataclass
class WorkerConfig:
    count: int
    queue_size: int

class DownloadConfig(BaseSettings):
    storage: StorageConfig
    network: NetworkConfig
    workers: WorkerConfig
    auth_enabled: bool = True
    hf_token: Optional[str] = None
    metrics_enabled: bool = True
    metrics_port: int = 9090

    class Config:
        env_prefix = "LLM_"
```
