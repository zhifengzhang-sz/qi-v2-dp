# LLM Service Documentation

## Table of Contents

1. [Overview](#overview)
2. [Deployment Guide](#deployment-guide)
3. [API Documentation](#api-documentation)
4. [Configuration Guide](#configuration-guide)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The LLM Service provides a containerized environment for running large language models, specifically optimized for code generation tasks. The service uses HuggingFace's infrastructure and supports models like DeepSeek and CodeLlama.

### Key Features

- Containerized deployment using Docker
- Automatic resource management
- Built-in monitoring and metrics
- Health checking and error handling
- Support for multiple models

## Deployment Guide

### Prerequisites

- Docker and Docker Compose
- Minimum 48GB RAM
- 100GB available disk space
- NVIDIA GPU (optional but recommended)

### Installation Steps

1. Clone the repository:

```bash
git clone <repository-url>
cd llm-service
```

2. Set up environment:

```bash
# Create necessary directories
mkdir -p .cache/huggingface
mkdir -p metrics/db
mkdir -p metrics/grafana
```

3. Configure the service:

```bash
# Copy example configurations
cp config/models/deepseek.env.example config/models/deepseek.env
cp config/models/codellama.env.example config/models/codellama.env
```

4. Start the service:

```bash
# Start with DeepSeek model
docker-compose --env-file config/models/deepseek.env up -d

# Or start with CodeLlama model
docker-compose --env-file config/models/codellama.env up -d
```

5. Verify deployment:

```bash
# Check service status
docker-compose ps

# Run health check
docker-compose exec llm-service python /app/workspace/health_check.py
```

### Resource Requirements

| Model         | Min RAM | Recommended RAM | Disk Space |
| ------------- | ------- | --------------- | ---------- |
| DeepSeek 6.7B | 32GB    | 48GB            | 50GB       |
| CodeLlama 7B  | 32GB    | 48GB            | 50GB       |

## API Documentation

### Text Generation Endpoint

**Endpoint**: `/generate`
**Method**: POST

**Request Format**:

```json
{
    "prompt": "string",
    "max_length": int,     // optional, default: 2048
    "temperature": float,  // optional, default: 0.7
    "top_p": float,       // optional, default: 0.95
}
```

**Response Format**:

```json
{
    "generated_text": "string",
    "metadata": {
        "model": "string",
        "generation_time": float,
        "token_count": int
    }
}
```

**Example**:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a Python function to sort a list"}'
```

### Health Check Endpoint

**Endpoint**: `/health`
**Method**: GET

**Response Format**:

```json
{
    "status": "string",
    "checks": {
        "memory": boolean,
        "disk": boolean,
        "model": boolean
    },
    "timestamp": string
}
```

## Configuration Guide

### Environment Variables

| Variable        | Description                       | Default                              |
| --------------- | --------------------------------- | ------------------------------------ |
| MODEL_ID        | HuggingFace model identifier      | deepseek-ai/deepseek-coder-6.7b-base |
| MAX_LENGTH      | Maximum generation length         | 2048                                 |
| TEMPERATURE     | Generation temperature            | 0.7                                  |
| TOP_P           | Top-p sampling parameter          | 0.95                                 |
| OMP_NUM_THREADS | Number of threads for computation | 8                                    |
| MKL_NUM_THREADS | Number of MKL threads             | 8                                    |

### Resource Configuration

The service uses Docker resource limits defined in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: "9"
      memory: 48G
```

### Model Configuration

Model-specific configurations are stored in `config/models/`:

```ini
# deepseek.env
MODEL_ID=deepseek-ai/deepseek-coder-6.7b-base
MAX_LENGTH=2048
TEMPERATURE=0.7
TOP_P=0.95
```

## Monitoring & Metrics

### Metrics Collection

The service collects the following metrics:

- Memory usage
- CPU utilization
- Cache size
- Inference count
- Average inference time

### Grafana Dashboard

Access the Grafana dashboard at `http://localhost:3000`:

- Default username: admin
- Default password: admin

### Alert Configuration

Alerts are configured in the metrics collector with the following default thresholds:

- Memory usage: 45GB
- CPU usage: 90%
- Cache size: 40GB
- Average inference time: 10 seconds

## Troubleshooting Guide

### Common Issues

#### 1. Service Fails to Start

**Symptoms**:

- Docker container exits immediately
- Health check fails

**Solutions**:

1. Check resource availability:

```bash
free -h
df -h
```

2. Verify model configuration:

```bash
docker-compose logs llm-service
```

3. Check for port conflicts:

```bash
netstat -tulpn | grep 8000
```

#### 2. High Memory Usage

**Symptoms**:

- Container OOM errors
- Slow response times

**Solutions**:

1. Reduce concurrent requests
2. Adjust memory limits
3. Monitor memory usage:

```bash
docker stats llm-service
```

#### 3. Model Loading Failures

**Symptoms**:

- Health check fails
- Generation requests fail

**Solutions**:

1. Check network connectivity
2. Verify cache directory permissions:

```bash
ls -la .cache/huggingface
```

3. Clear model cache:

```bash
rm -rf .cache/huggingface/*
```

### Logging

Access service logs:

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs llm-service

# Follow logs
docker-compose logs -f llm-service
```

### Debug Mode

Enable debug logging:

1. Set environment variable:

```bash
export LOG_LEVEL=DEBUG
```

2. Restart service:

```bash
docker-compose restart llm-service
```

### Performance Optimization

1. Cache warmup:

```bash
docker-compose exec llm-service python /app/workspace/warmup.py
```

2. Optimize thread settings:

```bash
export OMP_NUM_THREADS=12
export MKL_NUM_THREADS=12
```

3. Monitor and adjust resource limits based on usage patterns.

### Support and Maintenance

1. Regular maintenance tasks:

```bash
# Prune Docker resources
docker system prune -f

# Backup metrics database
cp metrics/db/metrics.db metrics/db/metrics.backup.db

# Update service
docker-compose pull
docker-compose up -d
```

2. Monitoring checks:

```bash
# Check system resources
docker-compose exec llm-service python /app/workspace/monitor.py

# View active alerts
docker-compose exec llm-service python /app/workspace/alerts.py list
```

3. Backup and restore:

```bash
# Backup
tar -czf backup.tar.gz .cache/huggingface metrics/db

# Restore
tar -xzf backup.tar.gz
```
