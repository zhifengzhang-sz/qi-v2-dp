# Text Generation Inference (TGI) Service Setup Guide

This guide provides comprehensive instructions for setting up the TGI service in two deployment scenarios: CPU-only and CPU+GPU. Choose the appropriate path based on your hardware and performance requirements.

## Table of Contents
- [System Requirements](#system-requirements)
- [Deployment Paths](#deployment-paths)
- [Pre-Installation Setup](#pre-installation-setup)
- [Path A: CPU-Only Deployment](#path-a-cpu-only-deployment)
- [Path B: CPU+GPU Deployment](#path-b-cpugpu-deployment)
- [Service Configuration](#service-configuration)
- [Service Deployment](#service-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## System Requirements

### CPU-Only Deployment
- Ubuntu 20.04 LTS or later
- 16GB RAM minimum (32GB recommended)
- 50GB available disk space
- Docker-compatible Linux kernel (5.4 or later recommended)

### CPU+GPU Deployment
All CPU-only requirements, plus:
- NVIDIA GPU with 8GB+ VRAM (T4, RTX 3090, A100, etc.)
- 100GB available disk space recommended
- Ubuntu 22.04 LTS recommended

## Deployment Paths

Choose the appropriate deployment path based on your hardware:
- **Path A: CPU-Only Deployment**: Use this if you don't have a compatible NVIDIA GPU or prefer CPU-only deployment
- **Path B: CPU+GPU Deployment**: Use this if you have a compatible NVIDIA GPU and want GPU acceleration

## Pre-Installation Setup

1. Update system packages:
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

2. Install basic dependencies:
```bash
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg \
    lsb-release
```

3. Set up system parameters:
```bash
# Add to /etc/sysctl.conf
vm.max_map_count=1048576
fs.file-max=1048576

# Apply changes
sudo sysctl -p
```

## Path A: CPU-Only Deployment

### A1. Docker Installation

1. Remove any old Docker versions:
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

2. Add Docker's official GPG key:
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

3. Add Docker repository:
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

4. Install Docker:
```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

5. Add current user to docker group:
```bash
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect
```

6. Verify Docker installation:
```bash
docker run hello-world
```

### A2. CPU-Only Configuration

Create the following configuration files:

1. Infrastructure configuration (config/infra/cpu.env):
```bash
# CPU-specific settings
USE_CUDA=0
USE_FLASH_ATTENTION=0
USE_TRITON=0

# General settings
HF_HUB_ENABLE_HF_TRANSFER=1
HF_HUB_OFFLINE=0
NUM_SHARD=1

# Performance tuning
MAX_CONCURRENT_REQUESTS=32
MAX_BATCH_SIZE=8
MAX_WAITING_TOKENS=20
WAITING_SERVED_RATIO=0.3
```

2. Docker Compose for CPU (docker-compose.cpu.yml):
```yaml
services:
  tgi:
    image: ghcr.io/huggingface/text-generation-inference:latest
    ports:
      - "8080:80"
    env_file:
      - ${INFRA_CONFIG:-config/infra/cpu.env}
      - ${MODEL_CONFIG:-config/models/default.env}
    deploy:
      resources:
        limits:
          memory: 8G
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:80/health" ]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - .cache:/data
```

## Path B: CPU+GPU Deployment

### B1. NVIDIA Driver and CUDA Installation

1. Verify GPU presence:
```bash
lspci | grep -i nvidia
```

2. Remove any existing NVIDIA drivers:
```bash
sudo apt-get purge nvidia*
```

3. Add NVIDIA package repository:
```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

4. Install NVIDIA driver and CUDA:
```bash
sudo apt-get update
sudo apt-get install -y nvidia-driver-525 nvidia-utils-525
# Reboot system after driver installation
sudo reboot
```

5. Verify driver installation:
```bash
nvidia-smi
```

6. Install NVIDIA Container Toolkit:
```bash
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

7. Follow Docker installation steps from Path A (A1. Docker Installation)

### B2. GPU Configuration

1. Infrastructure configuration (config/infra/gpu.env):
```bash
# GPU-specific settings
USE_CUDA=1
USE_FLASH_ATTENTION=1
USE_TRITON=1

# General settings
HF_HUB_ENABLE_HF_TRANSFER=1
HF_HUB_OFFLINE=0
NUM_SHARD=1

# Performance tuning
MAX_CONCURRENT_REQUESTS=128
MAX_BATCH_SIZE=32
MAX_WAITING_TOKENS=20
WAITING_SERVED_RATIO=0.3
```

2. Docker Compose for GPU (docker-compose.gpu.yml):
```yaml
services:
  tgi:
    image: ghcr.io/huggingface/text-generation-inference:latest
    ports:
      - "8080:80"
    env_file:
      - ${INFRA_CONFIG:-config/infra/gpu.env}
      - ${MODEL_CONFIG:-config/models/default.env}
    deploy:
      resources:
        limits:
          memory: 16G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:80/health" ]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - .cache:/data
```

## Service Configuration

### Model Configuration
Create model configurations in config/models/. Example (config/models/default.env):
```bash
MODEL_ID=gpt2
MAX_INPUT_LENGTH=1024
MAX_TOTAL_TOKENS=2048
TEMPERATURE=0.7
TOP_P=0.95
```

For larger models (config/models/large.env):
```bash
MODEL_ID=codellama/CodeLlama-7b-hf
MAX_INPUT_LENGTH=4096
MAX_TOTAL_TOKENS=8192
TEMPERATURE=0.7
TOP_P=0.95
```

## Service Deployment

### CPU-Only Deployment
```bash
# Start service
docker compose -f docker-compose.cpu.yml up -d

# Stop service
docker compose -f docker-compose.cpu.yml down
```

### CPU+GPU Deployment
```bash
# Start service
docker compose -f docker-compose.gpu.yml up -d

# Stop service
docker compose -f docker-compose.gpu.yml down
```

### Verify Deployment
```bash
# Check container status
docker ps

# Check logs
docker logs -f tgi-service-tgi-1

# Test service health
curl http://localhost:8080/health

# Test inference
curl -X POST http://localhost:8080/generate \
    -H 'Content-Type: application/json' \
    -d '{"inputs":"What is artificial intelligence?","parameters":{"max_new_tokens":50}}'
```

## Monitoring and Maintenance

### CPU-Only Monitoring
```bash
# Check container stats
docker stats

# Monitor system resources
top
htop (if installed)
```

### CPU+GPU Monitoring
```bash
# All CPU monitoring commands, plus:
nvidia-smi -l 1
```

### General Maintenance
```bash
# Update TGI image
docker compose pull

# Clean up unused images
docker image prune -a

# Clean up cache (if needed)
rm -rf .cache/*
```

## Troubleshooting

### CPU-Only Issues
1. High CPU Usage
- Reduce MAX_CONCURRENT_REQUESTS and MAX_BATCH_SIZE in cpu.env
- Consider using a smaller model
- Monitor process priority with `nice` command

2. Memory Issues
- Adjust memory limits in docker-compose.cpu.yml
- Monitor memory usage: `free -h`
- Consider enabling swap space

### GPU-Related Issues
1. GPU Not Detected
- Verify NVIDIA driver: `nvidia-smi`
- Check NVIDIA Container Toolkit: `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`
- Ensure GPU configuration is enabled in gpu.env

2. CUDA/GPU Memory Issues
- Monitor GPU memory: `nvidia-smi -l 1`
- Adjust batch size and concurrent requests in gpu.env
- Consider model sharding for large models

### Common Issues
1. Container Fails to Start
- Check logs: `docker logs tgi-service-tgi-1`
- Verify port availability: `netstat -tuln | grep 8080`
- Check disk space: `df -h`

2. Model Download Issues
- Check internet connectivity
- Verify HuggingFace token if using private models
- Check disk space in .cache directory

### Getting Help
- Check [HuggingFace TGI Documentation](https://huggingface.co/docs/text-generation-inference/index)
- File issues on [TGI GitHub Repository](https://github.com/huggingface/text-generation-inference)
- Join the HuggingFace Discord community

For additional support or custom configurations, please refer to the project documentation or contact the system administrator.