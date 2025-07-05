# Deployment Guide

## Overview

This guide covers deployment strategies for the QiCore crypto data streaming platform, including both physical infrastructure and MCP servers.

## Infrastructure Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps
- **OS**: Linux (Ubuntu 22.04 LTS recommended)

### Production Requirements
- **CPU**: 16 cores
- **RAM**: 32GB
- **Storage**: 1TB NVMe SSD
- **Network**: 10Gbps
- **OS**: Linux (Ubuntu 22.04 LTS)

## Docker Deployment

### Complete Stack
```yaml
# docker-compose.yml
version: '3.8'
services:
  # Streaming Infrastructure
  redpanda:
    image: redpandadata/redpanda:v23.3.3
    container_name: redpanda
    ports:
      - "9092:9092"
      - "9644:9644"
      - "8082:8082"
      - "8081:8081"
    command: |
      redpanda start
      --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
      --advertise-kafka-addr internal://redpanda:9092,external://localhost:19092
      --pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082
      --advertise-pandaproxy-addr internal://redpanda:8082,external://localhost:18082
      --schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081
      --rpc-addr redpanda:33145
      --advertise-rpc-addr redpanda:33145
      --smp 4
      --memory 4G
      --mode dev-container
      --default-log-level=info
    volumes:
      - redpanda_data:/var/lib/redpanda/data
    networks:
      - crypto_net
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G

  # Database
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    container_name: timescaledb
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: crypto_data
      POSTGRES_USER: crypto_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      TIMESCALEDB_TELEMETRY: 'off'
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./sql/init-timescale.sql:/docker-entrypoint-initdb.d/init-timescale.sql
      - ./sql/create-tables.sql:/docker-entrypoint-initdb.d/create-tables.sql
    networks:
      - crypto_net
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G

  # ClickHouse for Analytics
  clickhouse:
    image: clickhouse/clickhouse-server:23.11
    container_name: clickhouse
    ports:
      - "8123:8123"
      - "9000:9000"
    environment:
      CLICKHOUSE_DB: crypto_analytics
      CLICKHOUSE_USER: crypto_user
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./sql/init-clickhouse.sql:/docker-entrypoint-initdb.d/init-clickhouse.sql
    networks:
      - crypto_net
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  # Redis for Caching
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - crypto_net
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  # Application Services
  crypto-producer:
    build: 
      context: .
      dockerfile: Dockerfile.producer
    container_name: crypto-producer
    environment:
      REDPANDA_BROKERS: redpanda:9092
      CRYPTOCOMPARE_API_KEY: ${CRYPTOCOMPARE_API_KEY}
      REDIS_URL: redis://redis:6379
    depends_on:
      - redpanda
      - redis
    networks:
      - crypto_net
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  crypto-consumer:
    build:
      context: .
      dockerfile: Dockerfile.consumer
    container_name: crypto-consumer
    environment:
      REDPANDA_BROKERS: redpanda:9092
      TIMESCALE_HOST: timescaledb
      TIMESCALE_PORT: 5432
      TIMESCALE_DB: crypto_data
      TIMESCALE_USER: crypto_user
      TIMESCALE_PASSWORD: ${POSTGRES_PASSWORD}
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 8123
      CLICKHOUSE_DB: crypto_analytics
      CLICKHOUSE_USER: crypto_user
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    depends_on:
      - redpanda
      - timescaledb
      - clickhouse
    networks:
      - crypto_net
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G

  # MCP Servers
  kafka-mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: kafka
    container_name: kafka-mcp-server
    ports:
      - "8081:8080"
    environment:
      KAFKA_BROKERS: redpanda:9092
      MCP_SERVER_PORT: 8080
    depends_on:
      - redpanda
    networks:
      - crypto_net
    restart: unless-stopped

  timescale-mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: timescale
    container_name: timescale-mcp-server
    ports:
      - "8082:8080"
    environment:
      TIMESCALE_HOST: timescaledb
      TIMESCALE_PORT: 5432
      TIMESCALE_DB: crypto_data
      TIMESCALE_USER: crypto_user
      TIMESCALE_PASSWORD: ${POSTGRES_PASSWORD}
      MCP_SERVER_PORT: 8080
    depends_on:
      - timescaledb
    networks:
      - crypto_net
    restart: unless-stopped

  crypto-mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: crypto
    container_name: crypto-mcp-server
    ports:
      - "8083:8080"
    environment:
      CRYPTOCOMPARE_API_KEY: ${CRYPTOCOMPARE_API_KEY}
      MCP_SERVER_PORT: 8080
    networks:
      - crypto_net
    restart: unless-stopped

  # Monitoring
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - crypto_net

  grafana:
    image: grafana/grafana:10.1.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - crypto_net

volumes:
  redpanda_data:
  timescale_data:
  clickhouse_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  crypto_net:
    driver: bridge
```

### Environment Configuration
```bash
# .env
POSTGRES_PASSWORD=secure_postgres_password
CLICKHOUSE_PASSWORD=secure_clickhouse_password
CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key
GRAFANA_PASSWORD=secure_grafana_password

# Optional: External services
EXTERNAL_KAFKA_BROKERS=kafka1:9092,kafka2:9092
EXTERNAL_DB_HOST=external-timescale.example.com
```

## Dockerfile Configurations

### Producer Dockerfile
```dockerfile
# Dockerfile.producer
FROM oven/bun:1.0-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./

FROM oven/bun:1.0-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

USER bun
EXPOSE 8080

CMD ["bun", "run", "src/producers/crypto-producer.ts"]
```

### Consumer Dockerfile
```dockerfile
# Dockerfile.consumer
FROM oven/bun:1.0-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./

FROM oven/bun:1.0-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

USER bun

CMD ["bun", "run", "src/consumers/crypto-consumer.ts"]
```

### MCP Server Dockerfile
```dockerfile
# Dockerfile.mcp
FROM oven/bun:1.0-alpine AS builder

ARG MCP_SERVER
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./

FROM oven/bun:1.0-alpine AS runtime

ARG MCP_SERVER
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

USER bun
EXPOSE 8080

CMD ["sh", "-c", "bun run src/mcp-servers/${MCP_SERVER}-mcp-server.ts"]
```

## Database Initialization

### TimescaleDB Setup
```sql
-- sql/init-timescale.sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create database user
CREATE USER crypto_user WITH PASSWORD 'crypto_pass';
GRANT ALL PRIVILEGES ON DATABASE crypto_data TO crypto_user;

-- Enable TimescaleDB
\c crypto_data crypto_user;
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

```sql
-- sql/create-tables.sql
\c crypto_data crypto_user;

-- OHLCV data table
CREATE TABLE ohlcv_data (
    timestamp TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(20) NOT NULL DEFAULT 'cryptocompare',
    timeframe VARCHAR(10) NOT NULL DEFAULT '1m',
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    volume_to DECIMAL(20,8),
    market_cap DECIMAL(20,8)
);

-- Create hypertable
SELECT create_hypertable('ohlcv_data', 'timestamp');

-- Indexes for performance
CREATE INDEX idx_ohlcv_symbol_time ON ohlcv_data (symbol, timestamp DESC);
CREATE INDEX idx_ohlcv_exchange_symbol ON ohlcv_data (exchange, symbol);
CREATE INDEX idx_ohlcv_timeframe ON ohlcv_data (timeframe);

-- Create retention policy (keep 1 year of 1-minute data)
SELECT add_retention_policy('ohlcv_data', INTERVAL '1 year');

-- Create continuous aggregates for different timeframes
CREATE MATERIALIZED VIEW ohlcv_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', timestamp) AS timestamp,
    symbol,
    exchange,
    '1h' as timeframe,
    first(open, timestamp) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, timestamp) AS close,
    sum(volume) AS volume,
    sum(volume_to) AS volume_to,
    avg(market_cap) AS market_cap
FROM ohlcv_data
GROUP BY time_bucket('1 hour', timestamp), symbol, exchange;

-- Refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('ohlcv_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### ClickHouse Setup
```sql
-- sql/init-clickhouse.sql
CREATE DATABASE IF NOT EXISTS crypto_analytics;

USE crypto_analytics;

-- Analytics table for aggregated data
CREATE TABLE crypto_metrics (
    timestamp DateTime64(3),
    symbol String,
    exchange String,
    timeframe String,
    price Float64,
    volume Float64,
    market_cap Float64,
    sma_20 Float64,
    sma_50 Float64,
    rsi Float64,
    macd Float64,
    bollinger_upper Float64,
    bollinger_lower Float64,
    volume_sma Float64
) ENGINE = MergeTree()
ORDER BY (symbol, exchange, timestamp)
PARTITION BY toYYYYMM(timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Materialized view for real-time aggregations
CREATE MATERIALIZED VIEW crypto_metrics_mv TO crypto_metrics AS
SELECT
    timestamp,
    symbol,
    exchange,
    timeframe,
    close as price,
    volume,
    market_cap,
    avg(close) OVER (PARTITION BY symbol ORDER BY timestamp ROWS 19 PRECEDING) as sma_20,
    avg(close) OVER (PARTITION BY symbol ORDER BY timestamp ROWS 49 PRECEDING) as sma_50,
    0 as rsi,  -- Will be calculated by application
    0 as macd, -- Will be calculated by application
    0 as bollinger_upper,
    0 as bollinger_lower,
    avg(volume) OVER (PARTITION BY symbol ORDER BY timestamp ROWS 19 PRECEDING) as volume_sma
FROM kafka_ohlcv;

-- Kafka table for streaming ingestion
CREATE TABLE kafka_ohlcv (
    timestamp DateTime64(3),
    symbol String,
    exchange String,
    timeframe String,
    open Float64,
    high Float64,
    low Float64,
    close Float64,
    volume Float64,
    market_cap Float64
) ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'redpanda:9092',
    kafka_topic_list = 'crypto-ohlcv',
    kafka_group_name = 'clickhouse-consumer',
    kafka_format = 'JSONEachRow';
```

## Kubernetes Deployment

### Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: crypto-platform
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: crypto-config
  namespace: crypto-platform
data:
  REDPANDA_BROKERS: "redpanda:9092"
  TIMESCALE_HOST: "timescaledb"
  TIMESCALE_PORT: "5432"
  TIMESCALE_DB: "crypto_data"
  TIMESCALE_USER: "crypto_user"
```

### Persistent Volumes
```yaml
# k8s/storage.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redpanda-pvc
  namespace: crypto-platform
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: timescale-pvc
  namespace: crypto-platform
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
  storageClassName: fast-ssd
```

### Redpanda Deployment
```yaml
# k8s/redpanda.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redpanda
  namespace: crypto-platform
spec:
  serviceName: redpanda
  replicas: 3
  selector:
    matchLabels:
      app: redpanda
  template:
    metadata:
      labels:
        app: redpanda
    spec:
      containers:
      - name: redpanda
        image: redpandadata/redpanda:v23.3.3
        ports:
        - containerPort: 9092
        - containerPort: 9644
        - containerPort: 8082
        - containerPort: 8081
        resources:
          requests:
            cpu: 2
            memory: 4Gi
          limits:
            cpu: 4
            memory: 8Gi
        volumeMounts:
        - name: data
          mountPath: /var/lib/redpanda/data
        command:
        - /bin/bash
        - -c
        - |
          redpanda start \
            --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092 \
            --advertise-kafka-addr internal://$(POD_NAME).redpanda:9092,external://$(POD_NAME).redpanda:19092 \
            --pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082 \
            --advertise-pandaproxy-addr internal://$(POD_NAME).redpanda:8082,external://$(POD_NAME).redpanda:18082 \
            --schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081 \
            --rpc-addr $(POD_NAME).redpanda:33145 \
            --advertise-rpc-addr $(POD_NAME).redpanda:33145 \
            --smp 2 \
            --memory 4G \
            --default-log-level=info
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redpanda
  namespace: crypto-platform
spec:
  clusterIP: None
  selector:
    app: redpanda
  ports:
  - name: kafka
    port: 9092
  - name: admin
    port: 9644
  - name: proxy
    port: 8082
  - name: schema
    port: 8081
```

### Application Deployments
```yaml
# k8s/crypto-producer.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crypto-producer
  namespace: crypto-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: crypto-producer
  template:
    metadata:
      labels:
        app: crypto-producer
    spec:
      containers:
      - name: crypto-producer
        image: crypto-platform/producer:latest
        envFrom:
        - configMapRef:
            name: crypto-config
        - secretRef:
            name: crypto-secrets
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Monitoring and Observability

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'crypto-producer'
    static_configs:
      - targets: ['crypto-producer:8080']
    metrics_path: /metrics

  - job_name: 'crypto-consumer'
    static_configs:
      - targets: ['crypto-consumer:8080']
    metrics_path: /metrics

  - job_name: 'kafka-mcp-server'
    static_configs:
      - targets: ['kafka-mcp-server:8080']
    metrics_path: /metrics

  - job_name: 'redpanda'
    static_configs:
      - targets: ['redpanda:9644']
    metrics_path: /metrics

  - job_name: 'timescaledb'
    static_configs:
      - targets: ['timescaledb:5432']

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### Alert Rules
```yaml
# monitoring/alert_rules.yml
groups:
  - name: crypto_platform_alerts
    rules:
      - alert: KafkaConsumerLag
        expr: kafka_consumer_lag_sum > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High consumer lag detected"
          description: "Consumer lag is {{ $value }} messages"

      - alert: ProducerDown
        expr: up{job="crypto-producer"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Crypto producer is down"

      - alert: DatabaseConnectionFailed
        expr: pg_up == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

## Health Checks

### Application Health Endpoints
```typescript
// src/health/health-server.ts
import { serve } from 'bun';

export class HealthServer {
  private kafkaHealthy = false;
  private dbHealthy = false;

  constructor(
    private kafkaClient: any,
    private dbClient: any
  ) {}

  async start(port: number = 8080): Promise<void> {
    // Periodic health checks
    setInterval(async () => {
      await this.checkHealth();
    }, 30000);

    serve({
      port,
      fetch: async (req) => {
        const url = new URL(req.url);
        
        switch (url.pathname) {
          case '/health':
            return this.healthCheck();
          case '/ready':
            return this.readinessCheck();
          case '/metrics':
            return this.metricsEndpoint();
          default:
            return new Response('Not Found', { status: 404 });
        }
      }
    });
  }

  private async healthCheck(): Promise<Response> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        kafka: this.kafkaHealthy ? 'healthy' : 'unhealthy',
        database: this.dbHealthy ? 'healthy' : 'unhealthy'
      }
    };

    const status = this.kafkaHealthy && this.dbHealthy ? 200 : 503;
    return new Response(JSON.stringify(health), { 
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async readinessCheck(): Promise<Response> {
    const ready = this.kafkaHealthy && this.dbHealthy;
    return new Response(ready ? 'OK' : 'Not Ready', {
      status: ready ? 200 : 503
    });
  }

  private async checkHealth(): Promise<void> {
    try {
      await this.kafkaClient.admin().listTopics();
      this.kafkaHealthy = true;
    } catch {
      this.kafkaHealthy = false;
    }

    try {
      await this.dbClient.query('SELECT 1');
      this.dbHealthy = true;
    } catch {
      this.dbHealthy = false;
    }
  }
}
```

## Deployment Scripts

### Production Deployment
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "🚀 Deploying QiCore Crypto Platform..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required"; exit 1; }

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

# Validate required environment variables
required_vars=(
    "POSTGRES_PASSWORD"
    "CLICKHOUSE_PASSWORD"
    "CRYPTOCOMPARE_API_KEY"
    "GRAFANA_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Environment variable $var is not set"
        exit 1
    fi
done

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start infrastructure services first
echo "🏗️ Starting infrastructure services..."
docker-compose up -d redpanda timescaledb clickhouse redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Initialize databases
echo "🗄️ Initializing databases..."
docker-compose exec timescaledb psql -U crypto_user -d crypto_data -f /docker-entrypoint-initdb.d/create-tables.sql

# Start application services
echo "🚀 Starting application services..."
docker-compose up -d crypto-producer crypto-consumer

# Start MCP servers
echo "🔌 Starting MCP servers..."
docker-compose up -d kafka-mcp-server timescale-mcp-server crypto-mcp-server

# Start monitoring
echo "📊 Starting monitoring services..."
docker-compose up -d prometheus grafana

echo "✅ Deployment complete!"
echo "📊 Grafana: http://localhost:3000"
echo "🔍 Prometheus: http://localhost:9090"
echo "🔌 MCP Servers:"
echo "  - Kafka: http://localhost:8081"
echo "  - TimescaleDB: http://localhost:8082"
echo "  - CryptoCompare: http://localhost:8083"
```

### Development Setup
```bash
#!/bin/bash
# scripts/setup-dev.sh

set -e

echo "🛠️ Setting up development environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
POSTGRES_PASSWORD=dev_postgres_pass
CLICKHOUSE_PASSWORD=dev_clickhouse_pass
CRYPTOCOMPARE_API_KEY=your_dev_api_key
GRAFANA_PASSWORD=dev_grafana_pass
EOF
    echo "📝 Created .env file with default values"
    echo "⚠️  Please update CRYPTOCOMPARE_API_KEY with your actual API key"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Start only infrastructure for development
echo "🏗️ Starting infrastructure services..."
docker-compose up -d redpanda timescaledb redis

# Wait for services
echo "⏳ Waiting for services..."
sleep 20

# Initialize database
echo "🗄️ Initializing database..."
docker-compose exec timescaledb psql -U crypto_user -d crypto_data -c "SELECT version();"

echo "✅ Development environment ready!"
echo "🚀 Start the application with: bun run dev"
```

This deployment guide provides comprehensive instructions for deploying the QiCore crypto data streaming platform in various environments, with proper monitoring, health checks, and operational procedures.