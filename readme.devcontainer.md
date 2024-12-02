# QI Data Platform

## Overview
QI Data Platform is a development environment for building and managing data services. It provides a containerized development setup with integrated databases, message queues, and monitoring tools, all configured to work together in a VS Code development container.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Visual Studio Code with Remote - Containers extension
- Git
- Node.js (for local configuration generation)

### Initial Setup

1. **Clone and Configure**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd <repository-name>
   
   # Create environment file
   cat > .env << EOL
   USERNAME=your_username
   UID=1000  # Your user ID (use 'id -u')
   GID=1000  # Your group ID (use 'id -g')
   REGISTRY=your_registry
   VERSION=latest
   EOL
   ```

2. **Generate Service Configurations**
   ```bash
   # Install dependencies
   npm install
   
   # Generate initial configuration
   npm run config:init
   
   # Map configuration (use appropriate version)
   npm run config:map -- 1.0.0
   ```

3. **Start Services**
   ```bash
   # Launch core services (creates required networks)
   docker compose up -d
   
   # Verify services are running
   docker compose ps
   ```

4. **Start Development Container**
   ```bash
   # Open in VS Code
   code .
   
   # Use Command Palette (F1):
   # "Remote-Containers: Reopen in Container"
   ```

## Architecture

### Services

#### Databases
1. **TimescaleDB**
   - Purpose: Time-series data storage
   - Port: 5432
   - Network: qi_db
   - Credentials: See `services/.env`

2. **QuestDB**
   - Purpose: High-performance time-series analytics
   - Ports:
     - HTTP API: 9000
     - PostgreSQL: 8812
     - InfluxDB: 9009
   - Network: qi_db

#### Cache
- **Redis**
  - Purpose: In-memory cache
  - Port: 6379
  - Network: redis_network
  - Authentication: Password in `services/.env`

#### Message Queue
- **Redpanda**
  - Purpose: Kafka-compatible message broker
  - Ports:
    - Kafka API: 9092
    - Schema Registry: 8081
    - Admin API: 9644
    - REST Proxy: 8082
  - Network: redpanda_network
  - Management UI: Redpanda Console (port 8080)

#### Monitoring
1. **Grafana**
   - Purpose: Metrics visualization
   - Port: 4000
   - Default User: admin
   - Password: See `services/.env`

2. **pgAdmin**
   - Purpose: PostgreSQL management
   - Port: 8000
   - Default Email: qi@tianyi.com
   - Password: See `services/.env`

### Network Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│    qi_db        │     │redis_network │     │redpanda_network│
├─────────────────┤     ├──────────────┤     ├───────────────┤
│ - TimescaleDB   │     │ - Redis      │     │ - Redpanda    │
│ - QuestDB       │     │              │     │ - Console     │
│ - pgAdmin       │     │              │     │               │
└─────────────────┘     └──────────────┘     └───────────────┘
         ▲                     ▲                     ▲
         │                     │                     │
         └─────────┬──────────┴──────────┬─────────┘
                   │                     │
            ┌──────┴─────────────────────┴──────┐
            │        Development Container       │
            └────────────────────────────────────┘
```

## Configuration Management

### Configuration Files
- `services/.env`: Primary environment file
- `config/services-<version>.json`: Service configuration
- `config/services.env`: Environment configuration copy

### Configuration Commands
```bash
# Generate initial environment
npm run config:init

# Map configuration with version
npm run config:map -- 1.0.0

# Generate all configurations
npm run config -- 1.0.0
# or
npm run config:version -- all 1.0.0
```

## Development Container

### Features
- Node.js development environment
- Pre-configured VS Code extensions
- Network access to all services
- Shared volume mounts
- Automatic network setup

### VS Code Extensions
- Jest testing tools
- ESLint and Prettier
- TypeScript support
- Git integration
- GitHub Copilot
- Markdown preview
- Live Share
- State machine tools

### Volume Mounts
- `/workspace`: Project root
- `/home/${USERNAME}/qi`: QI source code
- `/home/${USERNAME}/docs`: Documentation
- `/shared`: Shared resources

## Development Workflow

### First-Time Setup
```bash
# 1. Clone and setup
git clone <repository-url>
cd <repository-name>
# Set up .env file

# 2. Generate configurations
npm install
npm run config:init
npm run config:map -- 1.0.0

# 3. Start services
docker compose up -d

# 4. Start development container
code .
# Use "Reopen in Container"
```

### Daily Development
```bash
# 1. Start services
docker compose up -d

# 2. Open VS Code
code .
# Use "Reopen in Container"
```

### Stopping Work
```bash
# Stop services but keep data
docker compose stop

# Or, stop and remove everything
docker compose down
```

## Troubleshooting

### Common Issues

1. **Network Connectivity**
   ```bash
   # Check networks
   docker network ls
   
   # Recreate networks
   docker compose down
   docker network prune
   docker compose up -d
   ```

2. **Service Access**
   ```bash
   # Check service status
   docker compose ps
   
   # View service logs
   docker compose logs [service-name]
   ```

3. **Development Container**
   ```bash
   # Rebuild container
   # VS Code: "Rebuild Container"
   # or
   docker compose up -d --build dp_js
   ```

4. **Configuration Issues**
   ```bash
   # Regenerate configuration
   rm services/.env
   npm run config
   ```

### Known Issues
1. Container must be restarted if services are restarted
2. Network creation may fail if previous networks exist
3. Volume permissions may need adjustment based on host OS

## Security

### Password Management
- All passwords are automatically generated
- Stored in `services/.env`
- Never committed to version control
- Preserved across container restarts

### Network Security
- Services isolated in separate networks
- Only required ports exposed
- Inter-service communication through Docker networks
- External access limited to necessary ports

## Contributing

### Development Guidelines
1. Fork the repository
2. Create feature branch
3. Follow code style guidelines
4. Add tests for new features
5. Update documentation
6. Submit pull request

### Testing
```bash
# Run tests
npm test

# Run specific test
npm test -- [test-name]
```

### Documentation
- Update README for significant changes
- Document new features
- Include configuration changes
- Update troubleshooting guides

## License
MIT License - See LICENSE file for details

## Support
For issues or questions:
1. Check existing GitHub issues
2. Consult service documentation
3. Create new issue with details
4. Contact development team