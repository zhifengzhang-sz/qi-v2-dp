# The Data Platform

A development environment for data processing and analytics, featuring TimescaleDB, QuestDB, Redis, Redpanda, and monitoring tools.

## Setting up the development environment

### Prerequisites

1. [Docker](https://docs.docker.com/get-docker/) and Docker Compose
   ```bash
   # Verify installation
   docker --version
   docker compose version
   ```

2. [Node.js](https://nodejs.org/en/) version 22
   - [nvm](https://github.com/nvm-sh/nvm) (recommended for Node.js version management)
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install and use Node.js 22
   nvm install 22
   nvm use 22
   
   # Verify version
   node --version  # Should be v22.x.x
   ```

3. [Visual Studio Code](https://code.visualstudio.com/)
   - Required extension: [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Required extension: [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)

4. [Git](https://git-scm.com/)
   ```bash
   git --version
   ```

5. [zsh](docs/vscode/zsh.md)

### Project Dependencies

The project uses ES modules and includes the following package configuration:

```json
{
  "name": "data-platform",
  "version": "0.0.1",
  "description": "Data platform for the QI system",
  "type": "module",
  "scripts": {
    "config": "node scripts/generate-config.js",
    "config:version": "node scripts/generate-config.js",
    "config:init": "node scripts/generate-config.js init",
    "config:map": "node scripts/generate-config.js map"
  },
  "dependencies": {
    "kafkajs": "^2.2.4"
  },
  "devDependencies": {
    "tsconfig-paths": "^4.2.0"
  }
}
```

Available scripts:
- `npm run config:init`: Generate initial service configurations and passwords
- `npm run config:map -- <version>`: Map configurations to version
- `npm run config:version -- <command> <version>`: Run specific command with version
- `npm run config`: Combined configuration generation

### Development Container Architecture

The development environment consists of three main components:

1. **Core Services** - Running in separate containers:
   - Databases:
     - TimescaleDB (time-series SQL database)
     - QuestDB (high-performance time-series)
   - Cache:
     - Redis (in-memory data store)
   - Message Queue:
     - Redpanda (Kafka-compatible streaming)
     - Redpanda Console (management UI)
   - Monitoring:
     - Grafana (metrics visualization)
     - pgAdmin (database management)

2. **Docker Networks**:
   - `qi_db` - For database services (TimescaleDB, QuestDB)
   - `redis_network` - For Redis cache
   - `redpanda_network` - For message queue services

3. **Development Container**:
   - Node.js development environment
   - Connected to all service networks
   - VS Code integration
   - Mounted project volumes

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/zhifengzhang-sz/qi-v2-dp.git
   cd qi-v2-dp
   ```

2. **Install Dependencies**
   ```bash
   # Verify Node.js version
   node --version  # Should be v22.x.x
   
   # Install dependencies
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   # Create .env file for devcontainer configuration
   cat > .env << EOL
   USERNAME=$(whoami)
   UID=$(id -u)
   GID=$(id -g)
   REGISTRY=blackgolfer
   VERSION=latest
   EOL
   ```

4. **Generate Service Configurations**
   ```bash
   # Generate initial service configurations
   npm run config:init

   # Map configurations with version
   npm run config:map -- 1.0.0
   ```

5. **Create Docker Networks**
   ```bash
   # Create required networks
   docker network create qi_db
   docker network create redis_network
   docker network create redpanda_network

   # Verify network creation
   docker network ls | grep -E 'qi_db|redis_network|redpanda_network'
   ```

   Expected output:
   ```bash
   NETWORK ID     NAME                 DRIVER    SCOPE
   <id>           qi_db                bridge    local
   <id>           redis_network        bridge    local
   <id>           redpanda_network     bridge    local
   ```

6. **Start Core Services**
   ```bash
   # Start all services
   docker compose up -d

   # Verify services are running
   docker compose ps
   ```

7. **Start Development Container**
   ```bash
   # Open in VS Code
   code .
   ```

### Development Container Setup

The development container is configured via several files:

1. `.devcontainer/devcontainer.json`:
   - VS Code settings
   - Extensions
   - Post-start commands
   - User configuration

2. `docker-compose.yml`:
   - Container build configuration
   - Network connections
   - Volume mounts
   - Resource limits

3. `.devcontainer/setup_networks.sh`:
   - Network creation script
   - Runs during container startup
   - Ensures required networks exist

## VS Code Workflow Options

1. **First Time Setup**:
   ```bash
   # First, ensure services are running
   docker compose up -d
   
   # Then open VS Code
   code .
   
   # Press F1 and select:
   "Remote-Containers: Rebuild and Reopen in Container"
   ```

2. **Regular Development**:
   ```bash
   # Start services if not running
   docker compose up -d
   
   # Open VS Code
   code .
   
   # Press F1 and select:
   "Remote-Containers: Reopen in Container"
   ```

3. **Container Rebuild Required**:
   - When changing container configuration
   - After service restarts
   - Network issues
   ```bash
   # Press F1 and select:
   "Remote-Containers: Rebuild Container"
   ```

## Development Workflow

1. **Starting Work**
   ```bash
   # 1. Start services first
   docker compose up -d
   
   # 2. Verify services and networks
   docker compose ps
   docker network ls
   
   # 3. Start VS Code and dev container
   code .
   # Then use appropriate VS Code command
   ```

2. **During Development**
   - Code changes are automatically synced
   - Services are accessible via configured ports
   - Use integrated terminal for commands
   - Extensions are pre-configured

3. **Stopping Work**
   ```bash
   # Stop services but keep data
   docker compose stop

   # Or to remove everything
   docker compose down
   ```

### Available Services

| Service | Purpose | Port(s) | Default Credentials |
|---------|---------|---------|-------------------|
| TimescaleDB | Primary Database | 5432 | See services/.env |
| QuestDB | Time-series DB | 9000, 8812, 9009 | admin/quest |
| Redis | Cache | 6379 | See services/.env |
| Redpanda | Message Queue | 9092, 8081, 9644, 8082 | N/A |
| Redpanda Console | Queue Management | 8080 | N/A |
| Grafana | Monitoring | 4000 | admin/see services/.env |
| pgAdmin | DB Management | 8000 | See services/.env |

### Troubleshooting

1. **Network Issues**
   ```bash
   # Check networks
   docker network ls | grep -E 'qi_db|redis_network|redpanda_network'

   # Recreate if needed
   docker compose down
   docker network prune
   docker network create qi_db
   docker network create redis_network
   docker network create redpanda_network
   docker compose up -d
   ```

2. **Container Access Problems**
   ```bash
   # Check environment variables
   cat .env
   
   # Verify values match system
   echo $USER
   id -u
   id -g
   
   # Check container logs
   docker compose logs dp_js
   ```

3. **Dev Container Won't Start**
   ```bash
   # Complete reset
   docker compose down
   docker network prune
   rm -rf .devcontainer/.data
   docker compose up -d
   # Then rebuild container in VS Code
   ```

4. **Service Connection Issues**
   ```bash
   # Check service status
   docker compose ps
   
   # View service logs
   docker compose logs [service-name]
   
   # Check service health
   docker compose ps --format "table {{.Name}}\t{{.Status}}"
   ```

5. **Configuration Issues**
   ```bash
   # Regenerate configurations
   npm run config:init
   npm run config:map -- 1.0.0
   
   # Verify files exist
   ls services/.env config/services-1.0.0.json
   ```

For more detailed information about the services and their configuration, see:
- [Services Documentation](docs/services/README.md)
- [Configuration Guide](docs/config/README.md)
- [Development Container Guide](docs/devcontainer/README.md)