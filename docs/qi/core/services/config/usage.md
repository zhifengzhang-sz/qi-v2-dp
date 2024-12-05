# The Data Platform

A development environment for data processing and analytics, featuring TimescaleDB, QuestDB, Redis, Redpanda, and monitoring tools.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Project Setup](#initial-project-setup)
- [Using the Development Container](#using-the-development-container)
- [Working with Services](#working-with-services)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Docker and Docker Compose**
   - [Docker Desktop](https://docs.docker.com/get-docker/) for Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) for Linux

2. **Node.js 22**
   - Install via [nvm](https://github.com/nvm-sh/nvm) (recommended):
     ```bash
     nvm install 22
     nvm use 22
     ```

3. **Visual Studio Code**
   - Install [VS Code](https://code.visualstudio.com/)
   - Required extensions:
     - [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
     - [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)

4. **Git**
   - Install [Git](https://git-scm.com/)

5. **zsh**
   - Follow [zsh setup guide](docs/vscode/zsh.md)

## Initial Project Setup

### 1. Clone and Navigate
```bash
git clone https://github.com/zhifengzhang-sz/qi-v2-dp.git
cd qi-v2-dp
```

### 2. Create Environment Files

1. **Development Container Environment**
   ```bash
   # Create .env in project root
   cat > .env << EOL
   USERNAME=$(whoami)
   UID=$(id -u)
   GID=$(id -g)
   REGISTRY=blackgolfer
   VERSION=latest
   EOL
   ```

2. **Initialize Service Configuration**
   ```bash
   # Install dependencies
   npm install

   # Generate initial service configurations
   npm run config:init

   # Map configurations with version
   npm run config:map -- 1.0.0
   ```

### 3. Create Docker Networks
```bash
# Create required networks
docker network create qi_db
docker network create redis_network
docker network create redpanda_network

# Verify networks
docker network ls | grep -E 'qi_db|redis_network|redpanda_network'
```

### 4. Start Core Services
```bash
# Start all services
docker compose up -d

# Verify services are running
docker compose ps
```

## Using the Development Container

### Initial Setup

1. **Open Project in VS Code**
   ```bash
   code .
   ```

2. **Start Development Container**
   - Press `F1` or `Ctrl+Shift+P`
   - Select "Remote-Containers: Rebuild and Reopen in Container"
   - Wait for container setup to complete

### Daily Development Workflow

1. **Starting Work**
   ```bash
   # 1. Start services if not running
   docker compose up -d

   # 2. Open VS Code
   code .

   # 3. Reopen in container
   # Press F1 -> "Remote-Containers: Reopen in Container"
   ```

2. **Ending Work**
   ```bash
   # Stop services but keep data
   docker compose stop

   # Or remove everything (including data)
   docker compose down
   ```

### Container Management

- **Rebuild Container**: When configuration changes
  - Press F1 -> "Remote-Containers: Rebuild Container"
  
- **Update Container**: After pulling new changes
  - Press F1 -> "Remote-Containers: Rebuild and Reopen in Container"

## Working with Services

### Available Services

| Service     | Purpose           | Port(s)              | Default Credentials |
|-------------|------------------|---------------------|-------------------|
| TimescaleDB | Primary Database | 5432                | See services/.env |
| QuestDB     | Time-series DB   | 9000, 8812, 9009    | admin/quest      |
| Redis       | Cache            | 6379                | See services/.env |
| Redpanda    | Message Queue    | 9092, 8081, 9644, 8082 | N/A          |
| Grafana     | Monitoring       | 4000                | admin/see services/.env |
| pgAdmin     | DB Management    | 8000                | See services/.env |

### Accessing Services

1. **Database Access**
   - TimescaleDB:
     ```bash
     psql -h localhost -p 5432 -U postgres
     # Password in services/.env
     ```
   - QuestDB: http://localhost:9000

2. **Monitoring**
   - Grafana: http://localhost:4000
   - pgAdmin: http://localhost:8000

3. **Message Queue**
   - Redpanda Console: http://localhost:8080
   - Kafka API: localhost:9092
   - Schema Registry: http://localhost:8081
   - REST Proxy: http://localhost:8082

4. **Cache**
   - Redis CLI:
     ```bash
     redis-cli -h localhost -p 6379
     # AUTH <password from services/.env>
     ```

### Service Management

```bash
# View service logs
docker compose logs [service-name]

# Restart a service
docker compose restart [service-name]

# Stop specific service
docker compose stop [service-name]

# Check service health
docker compose ps
```

## Troubleshooting

### Network Issues
```bash
# Reset networks
docker compose down
docker network prune
docker network create qi_db
docker network create redis_network
docker network create redpanda_network
docker compose up -d
```

### Container Access Problems
1. **Check Environment**
   ```bash
   # Verify .env values
   cat .env
   
   # Ensure they match your system
   echo $USER
   id -u
   id -g
   ```

2. **Reset Development Container**
   - Press F1 -> "Remote-Containers: Rebuild Container"
   - If issues persist, try:
     ```bash
     docker compose down
     rm -rf .devcontainer/.data
     docker compose up -d
     ```

### Service Connection Issues
1. **Check Service Status**
   ```bash
   docker compose ps
   docker compose logs [service-name]
   ```

2. **Verify Network Connectivity**
   ```bash
   docker network inspect qi_db
   docker network inspect redis_network
   docker network inspect redpanda_network
   ```

3. **Reset Services**
   ```bash
   docker compose down
   docker compose up -d
   ```

For more detailed information about services and configuration, see the [Services Documentation](docs/services/README.md).