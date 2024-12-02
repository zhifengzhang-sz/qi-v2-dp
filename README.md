# The Data Platform

## Setting up the development environment

### Prerequisites

1. [Docker](https://docs.docker.com/get-docker/) and Docker Compose
2. [Node.js](https://nodejs.org/en/) version 22
   - [nvm](https://github.com/nvm-sh/nvm) (recommended for Node.js version management)
3. [Visual Studio Code](https://code.visualstudio.com/)
   - Required extension: [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Required extension: [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
4. [Git](https://git-scm.com/)
5. [zsh](docs/vscode/zsh.md)

### Development Container Architecture

The development environment consists of three main components:

1. **Core Services** - Running in separate containers:
   - Databases (TimescaleDB, QuestDB)
   - Cache (Redis)
   - Message Queue (Redpanda)
   - Monitoring (Grafana, pgAdmin)

2. **Docker Networks**:
   - `qi_db` - For database services
   - `redis_network` - For Redis cache
   - `redpanda_network` - For message queue

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

2. **Set Up Environment Variables**
   ```bash
   # Create .env file for devcontainer configuration
   cat > .env << EOL
   USERNAME=your_username
   UID=$(id -u)
   GID=$(id -g)
   REGISTRY=your_registry
   VERSION=latest
   EOL
   ```

3. **Generate Service Configurations**
   ```bash
   # Install dependencies
   npm install

   # Generate service configurations and passwords
   npm run config:init
   npm run config:map -- 1.0.0
   ```

4. **Start Core Services**
   ```bash
   # Start services (creates required networks)
   docker compose up -d

   # Verify services are running
   docker compose ps
   ```

5. **Start Development Container**
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

### VS Code Workflow Options

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

### Development Workflow

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

The platform includes:
- TimescaleDB (Port: 5432)
- QuestDB (Ports: 9000, 8812, 9009)
- Redis (Port: 6379)
- Redpanda (Ports: 9092, 8081, 9644, 8082)
- Grafana (Port: 4000)
- pgAdmin (Port: 8000)

Access credentials are stored in `services/.env`

### Troubleshooting

1. **Network Issues**
   ```bash
   # Check networks
   docker network ls | grep -E 'qi_db|redis_network|redpanda_network'

   # Recreate if needed
   docker compose down
   docker network prune
   docker compose up -d
   ```

2. **Container Access Problems**
   - Check UID/GID in `.env`
   - Verify service status
   - Ensure networks exist
   - Review container logs:
     ```bash
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
   ```

For more detailed information about the services and their configuration, see the [Services Documentation](docs/services/README.md).