# Service Configuration Reference

## File Structure
```
config/
├── services-1.0.json     # Service configuration
└── services.env         # Environment variables
```

## Schema
```typescript
interface ServiceConfig {
  type: "services";
  version: string;
  databases: {
    postgres: PostgresConfig;
    questdb: QuestDBConfig;
    redis: RedisConfig;
  };
  messageQueue: MessageQueueConfig;
  monitoring: MonitoringConfig;
  networking: NetworkConfig;
}

interface PostgresConfig {
  host: string;
  port: number;        // Default: 5432
  database: string;    // Default: postgres
  user: string;        // Default: postgres
  maxConnections: number; // Default: 100
}

interface QuestDBConfig {
  host: string;
  httpPort: number;    // Default: 9000
  pgPort: number;      // Default: 8812
  influxPort: number;  // Default: 9009
}

interface RedisConfig {
  host: string;
  port: number;        // Default: 6379
  maxRetries: number;  // Default: 3
}

interface MessageQueueConfig {
  redpanda: {
    kafkaPort: number;         // Default: 9092
    schemaRegistryPort: number;// Default: 8081
    adminPort: number;         // Default: 9644
    pandaproxyPort: number;    // Default: 8082
  };
}

interface MonitoringConfig {
  grafana: {
    host: string;
    port: number;      // Default: 3000
  };
  pgAdmin: {
    host: string;
    port: number;      // Default: 80
  };
}

interface NetworkConfig {
  networks: {
    db: string;
    redis: string;
    redpanda: string;
  };
}
```

## Environment Variables

### Database Credentials
```env
POSTGRES_PASSWORD=<required>
POSTGRES_USER=<required>
POSTGRES_DB=<required>
REDIS_PASSWORD=<required>
```

### Monitoring
```env
GF_SECURITY_ADMIN_PASSWORD=<required>
PGADMIN_DEFAULT_EMAIL=<required>
PGADMIN_DEFAULT_PASSWORD=<required>
```

### QuestDB Settings
```env
QDB_TELEMETRY_ENABLED=<boolean> # Default: false
```

### RedPanda Configuration
```env
REDPANDA_BROKER_ID=<number>
REDPANDA_ADVERTISED_KAFKA_API=<hostname>
REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=<hostname>
REDPANDA_ADVERTISED_PANDAPROXY_API=<hostname>
```

## Service Initialization

Each service supports these configuration options:
```typescript
interface ServiceOptions {
  enabled: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;  // ms
    timeout: number;   // ms
    retries: number;
  };
}

// RedPanda specific
interface RedPandaOptions extends ServiceOptions {
  consumer?: {
    groupId: string;
    sessionTimeout: number;
    rebalanceTimeout: number;
    heartbeatInterval: number;
  };
  producer?: {
    allowAutoTopicCreation: boolean;
    maxInFlightRequests: number;
    idempotent: boolean;
  };
}
```

## Network Configuration
Services are isolated in separate networks:
- `qi_db`: Database network
- `redis_network`: Redis instances
- `redpanda_network`: Message queue services

## Port Matrix
| Service | Port | Protocol | Usage |
|---------|------|----------|--------|
| TimescaleDB | 5432 | PostgreSQL | Database connections |
| QuestDB | 9000 | HTTP | Web console |
| QuestDB | 8812 | PostgreSQL | Wire protocol |
| QuestDB | 9009 | InfluxDB | Line protocol |
| Redis | 6379 | Redis | Cache operations |
| RedPanda | 9092 | Kafka | Message broker |
| RedPanda | 8081 | HTTP | Schema registry |
| RedPanda | 9644 | HTTP | Admin API |
| RedPanda | 8082 | HTTP | REST proxy |
| Grafana | 3000 | HTTP | Monitoring UI |
| pgAdmin | 80 | HTTP | Database admin |