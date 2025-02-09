# Development Environment

## Setup

1. Generate the environment file:
```bash
make env
```

2. Edit the `.env` file if needed:
   - Adjust model memory limits and threads based on your system
   - Set your username and UID/GID if needed

## Available Services

### JavaScript Service (dp_js)
- Node.js 22 with npm 10.8.3
- Mounts `/qi` directory for development
- Exposed port: 7071
- Development tools pre-installed

### Python Coding Service (coder)
- Python 3.11 environment
- Resource configuration:
  - Memory: 32-56GB (configurable)
  - CPU threads: 8 (configurable)
- Project root mounted at `/home/${USERNAME}`
- Model cache mounted at `/cache`
- Development tools included

## Networks
All services connect to:
- qi_db_network
- redis_network 
- redpanda_network

## Volume Management

The services use Docker volumes for persistence:
- Named volume `model_cache` for LLM storage
- Bind mounts for development files
- Shared volume for common resources

## Usage

1. Create required networks (if not existing):
```bash
docker network create qi_db
docker network create redis_network
docker network create redpanda_network
```

2. Create model cache volume:
```bash
docker volume create model_cache
```

3. Start development environment:
```bash
docker compose up -d
```