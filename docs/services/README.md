# Services

## Overview
This directory contains Docker Compose configurations and environment settings for core platform services:

- **Databases**
  - TimescaleDB (SQL, time-series)
  - QuestDB (time-series optimized)
- **Cache**
  - Redis
- **Message Queue**
  - RedPanda (Kafka API compatible)
  - RedPanda Console
- **Monitoring**
  - Grafana
  - pgAdmin

## Service Configuration

### Port Mappings

| Service | Purpose | External Port | Internal Port |
|---------|---------|---------------|---------------|
| TimescaleDB | Primary Database | 5432 | 5432 |
| QuestDB | Time Series DB | 9000, 8812, 9009 | 9000, 8812, 9009 |
| Redis | Cache | 6379 | 6379 |
| RedPanda | Message Queue | 9092, 8081, 9644, 8082 | 9092, 8081, 9644, 8082 |
| RedPanda Console | Queue Management | 8080 | 8080 |
| Grafana | Monitoring | 4000 | 3000 |
| pgAdmin | Database Management | 8000 | 80 |

### Resource Limits

| Service | Memory | CPUs |
|---------|--------|------|
| TimescaleDB | 2GB | 1.0 |
| QuestDB | 1GB | 1.0 |
| Redis | 512MB | 0.5 |
| RedPanda | 2GB | 1.0 |
| Grafana | 512MB | 0.5 |
| pgAdmin | 512MB | 0.5 |

## Setup

### 1. Generate Configuration
```bash
# Initialize environment files
npm run config:init

# Map configuration with version
npm run config:map -- 1.0.0
```

Generated files:
- `services/.env`: Service credentials and environment variables
- `config/services-1.0.0.json`: Service configuration
- `config/services.env`: Environment configuration copy

### 2. Network Setup
```bash
# Create required networks
docker network create qi_db
docker network create redis_network
docker network create redpanda_network
```

### 3. Start Services
```bash
# Start all services
docker compose up -d

# Verify status
docker compose ps
```

## Service Management

### Health Checks

All services include health checks:

```bash
# View health status
docker compose ps
```

Health check configurations:
- Interval: 30s
- Timeout: 10s
- Retries: 3-5

### Volume Management

Persistent volumes:
- `questdb_data`: QuestDB data
- `timescaledb_data`: TimescaleDB data
- `pgadmin_data`: pgAdmin settings
- `grafana_data`: Grafana dashboards
- `redis_data`: Redis data
- `redpanda_data`: RedPanda logs

### Service Operations

```bash
# View service logs
docker compose logs [service-name]

# Restart service
docker compose restart [service-name]

# Stop specific service
docker compose stop [service-name]

# Remove service and data
docker compose rm -v [service-name]
```

## Configuration

### Environment Variables

Key variables in `services/.env`:
```bash
# Database
POSTGRES_PASSWORD=<generated>
POSTGRES_USER=postgres
POSTGRES_DB=postgres

# Redis
REDIS_PASSWORD=<generated>

# Monitoring
GF_SECURITY_ADMIN_PASSWORD=<generated>
PGADMIN_DEFAULT_EMAIL=qi@tianyi.com
PGADMIN_DEFAULT_PASSWORD=<generated>

# RedPanda
REDPANDA_BROKER_ID=0
REDPANDA_ADVERTISED_KAFKA_API=redpanda
```

### Updating Configuration

1. Modify environment:
   ```bash
   # Edit environment file
   vi services/.env

   # Remap configuration
   npm run config:map -- <version>
   ```

2. Apply changes:
   ```bash
   # Restart affected services
   docker compose up -d --force-recreate [service-name]
   ```

## Accessing Services

### Database Access
- TimescaleDB:
  ```bash
  psql -h localhost -p 5432 -U postgres
  ```
- QuestDB: http://localhost:9000

### Monitoring
- Grafana: http://localhost:4000
  - Default user: `admin`
  - Password: See `services/.env`

- pgAdmin: http://localhost:8000
  - Email: Set in `services/.env`
  - Password: Set in `services/.env`

### Message Queue
- RedPanda Console: http://localhost:8080
- Kafka API: localhost:9092
- Schema Registry: http://localhost:8081
- REST Proxy: http://localhost:8082

### Cache
- Redis:
  ```bash
  redis-cli -h localhost -p 6379
  # AUTH <password from services/.env>
  ```

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker compose logs [service-name]
   
   # Verify network
   docker network inspect [network-name]
   
   # Check port conflicts
   netstat -tulpn | grep <port>
   ```

2. **Connection Issues**
   ```bash
   # Verify service is running
   docker compose ps
   
   # Check container networking
   docker inspect [container-name]
   
   # Test connectivity
   docker compose exec [service-name] ping [other-service]
   ```

3. **Data Persistence**
   ```bash
   # List volumes
   docker volume ls
   
   # Inspect volume
   docker volume inspect [volume-name]
   
   # Backup volume
   docker run --rm -v [volume-name]:/data -v $(pwd):/backup alpine tar czf /backup/[volume-name].tar.gz /data
   ```

### Reset Environment
```bash
# Stop all services
docker compose down

# Remove volumes
docker compose down -v

# Remove networks
docker network rm qi_db redis_network redpanda_network

# Regenerate configuration
npm run config:init
npm run config:map -- 1.0.0

# Recreate networks
docker network create qi_db
docker network create redis_network
docker network create redpanda_network

# Start services
docker compose up -d
```