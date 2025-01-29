# Data Platform Services

This repository contains the Docker Compose configuration for running a comprehensive data platform stack including time-series databases (QuestDB, TimescaleDB), message queue (Redpanda), caching (Redis), and monitoring tools (Grafana, pgAdmin).

## Services Overview

- **QuestDB**: Time-series database optimized for fast ingest and complex queries
- **TimescaleDB**: PostgreSQL-based time-series database
- **Grafana**: Data visualization and monitoring platform
- **pgAdmin**: PostgreSQL administration and development platform
- **Redis**: In-memory data structure store
- **Redpanda**: Kafka-compatible event streaming platform
- **Redpanda Console**: Web UI for managing Redpanda

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- At least 5GB of free RAM
- At least 20GB of free disk space

## Configuration

1. Clone this repository
2. Copy the `.env.example` to `.env` if not already done:
```bash
cp .env.example .env
```

### Default Ports

- QuestDB: 9000 (HTTP), 9009 (TCP), 8812 (PGWire)
- Grafana: 3000
- TimescaleDB: 5432
- pgAdmin: 8000
- Redis: 6379
- Redpanda: 9092 (Kafka), 8081 (Schema Registry), 8082 (HTTP Proxy)
- Redpanda Console: 8080

## Usage

### Starting Services

```bash
# Start all services in the background
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Stopping Services

```bash
# Gracefully stop services
docker-compose down

# Stop services and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

### Maintenance

```bash
# Restart a specific service
docker-compose restart <service-name>

# View logs for a specific service
docker-compose logs <service-name>

# Update images
docker-compose pull
docker-compose up -d
```

### Health Checks

All services are configured with health checks. View their status with:
```bash
docker-compose ps
```

## Service Access

### Grafana
- URL: http://localhost:3000
- Default credentials:
  - Username: admin
  - Password: See `GF_SECURITY_ADMIN_PASSWORD` in `.env`

### pgAdmin
- URL: http://localhost:8000
- Default credentials:
  - Email: See `PGADMIN_DEFAULT_EMAIL` in `.env`
  - Password: See `PGADMIN_DEFAULT_PASSWORD` in `.env`

### TimescaleDB
- Host: localhost
- Port: 5432
- Default credentials:
  - Username: See `POSTGRES_USER` in `.env`
  - Password: See `POSTGRES_PASSWORD` in `.env`
  - Database: See `POSTGRES_DB` in `.env`

### QuestDB
- Web Console: http://localhost:9000
- PostgreSQL Wire: localhost:8812

### Redis
- Host: localhost
- Port: 6379
- Password: See `REDIS_PASSWORD` in `.env`

### Redpanda
- Bootstrap server: localhost:9092
- Schema Registry: http://localhost:8081
- HTTP Proxy: http://localhost:8082
- Console: http://localhost:8080

## Resource Limits

Services are configured with the following resource limits:

- QuestDB: 1 CPU, 1GB RAM
- TimescaleDB: 1 CPU, 2GB RAM
- Grafana: 0.5 CPU, 512MB RAM
- pgAdmin: 0.5 CPU, 512MB RAM
- Redis: 0.5 CPU, 512MB RAM

## Data Persistence

Data is persisted in Docker volumes:
- questdb_data
- timescaledb_data
- pgadmin_data
- grafana_data
- redis_data
- redpanda_data

## Network Isolation

Services are segregated into three networks:
- qi_db_network: For database services
- redis_network: For Redis
- redpanda_network: For Redpanda services

## Troubleshooting

1. **Services fail to start**
```bash
# Check service logs
docker-compose logs <service-name>

# Verify environment variables
docker-compose config

# Force recreate containers
docker-compose up -d --force-recreate
```

2. **Memory issues**
```bash
# Check resource usage
docker stats
```

3. **Connection issues**
```bash
# Verify network connectivity
docker network ls
docker network inspect qi_db_network
```

## Security Notes

- All sensitive information is stored in the `.env` file
- Default passwords should be changed in production
- Services are configured to restart automatically unless stopped manually
- Networks are isolated to minimize attack surface

## Backup and Restore

To backup volumes:
1. Stop the services: `docker-compose down`
2. Backup volume data from `/var/lib/docker/volumes/`
3. Restart services: `docker-compose up -d`

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.