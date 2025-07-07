# Base Module Documentation

The `base` module provides the foundational infrastructure components for the QiCore Data Platform. It includes database clients, streaming infrastructure, and core agent utilities that support the entire platform.

## Overview

The base module contains:

- **Database Infrastructure**: TimescaleDB client with time-series optimizations
- **Streaming Infrastructure**: Redpanda client for real-time data streaming  
- **Agent Framework**: Base agent utilities and MCP integration helpers
- **Core Services**: Shared utilities used across the platform

## Architecture Diagram

```
base/
├── database/               # Database Infrastructure
│   ├── timescale-client.ts    # TimescaleDB time-series client
│   ├── drizzle-client.ts      # ORM client setup
│   ├── schema.ts              # Database schema definitions
│   ├── crypto-dsl.ts          # Database-specific DSL helpers
│   └── index.ts               # Database exports
├── streaming/              # Streaming Infrastructure  
│   ├── redpanda/              # Redpanda Kafka client
│   │   ├── redpanda-client.ts    # Core streaming client
│   │   ├── redpanda-config.ts    # Configuration management
│   │   ├── redpanda-mcp-launcher.ts # MCP integration
│   │   ├── types.ts              # Streaming type definitions
│   │   └── index.ts              # Streaming exports
│   └── index.ts               # All streaming exports
├── base-agent.ts           # Agent foundation utilities
└── services/               # Shared service utilities
    └── index.ts
```

## Core Components

### 1. Database Infrastructure (`database/`)

#### TimescaleClient (`timescale-client.ts`)
High-performance PostgreSQL/TimescaleDB client optimized for time-series data.

**Key Features:**
- **Hypertables**: Automatic time-based partitioning
- **Compression**: 90% space savings for older data
- **Batch Operations**: Efficient bulk inserts for high-throughput
- **Connection Pooling**: Optimized connection management
- **Schema Management**: Automatic table creation and migration

**Core Methods:**
```typescript
class TimescaleClient {
  async initialize(): Promise<void>
  async destroy(): Promise<void>
  
  // Cryptocurrency data operations
  async insertPrices(prices: TimescaleCryptoPrice[]): Promise<void>
  async insertOHLCV(ohlcv: TimescaleOHLCV[]): Promise<void>
  async insertMarketAnalytics(analytics: TimescaleMarketAnalytics): Promise<void>
  
  // Time-series queries
  async getPriceHistory(coinId: string, start: Date, end: Date): Promise<TimescaleCryptoPrice[]>
  async getLatestOHLCV(coinId: string, count: number): Promise<TimescaleOHLCV[]>
  
  // Database management
  async listHypertables(): Promise<HypertableInfo[]>
  async enableCompression(table: string, olderThan: string): Promise<void>
}
```

**Schema Design:**
```sql
-- Crypto prices with automatic partitioning
CREATE TABLE crypto_prices (
  time TIMESTAMPTZ NOT NULL,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  usd_price NUMERIC NOT NULL,
  btc_price NUMERIC,
  market_cap NUMERIC,
  volume_24h NUMERIC,
  change_24h NUMERIC,
  last_updated BIGINT
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('crypto_prices', 'time');

-- Enable compression for data older than 1 day
ALTER TABLE crypto_prices SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'coin_id'
);
```

#### Database Schema (`schema.ts`)
Drizzle ORM schema definitions for type-safe database operations.

**Key Tables:**
- `crypto_prices`: Real-time price data with time partitioning
- `ohlcv_data`: OHLCV candlestick data for technical analysis
- `market_analytics`: Market-wide statistics and metrics

### 2. Streaming Infrastructure (`streaming/`)

#### RedpandaClient (`redpanda/redpanda-client.ts`)
High-performance Kafka-compatible streaming client for Redpanda.

**Key Features:**
- **Producer Operations**: High-throughput message publishing
- **Consumer Operations**: Real-time stream consumption
- **Batch Processing**: Efficient batch operations
- **Compression**: gzip, snappy, lz4 compression support
- **Error Handling**: Robust error recovery and retry logic
- **Metrics**: Built-in performance monitoring

**Core Methods:**
```typescript
class RedpandaClient {
  async initialize(): Promise<void>
  async destroy(): Promise<void>
  
  // Producer operations
  async produce(message: MessagePayload): Promise<ProducerResponse>
  async produceBatch(messages: MessagePayload[]): Promise<ProducerResponse[]>
  
  // Consumer operations  
  async consumeMessages(
    topics: string[],
    groupId: string,
    handler: (message: ConsumerMessage) => Promise<void>
  ): Promise<void>
  
  // Topic management
  async createTopic(name: string, config: TopicConfig): Promise<void>
  async listTopics(): Promise<string[]>
  async getTopicMetadata(topic: string): Promise<TopicMetadata>
}
```

**Message Format:**
```typescript
interface MessagePayload {
  topic: string;
  key?: string;
  value: any;
  partition?: number;
  timestamp?: number;
  headers?: Record<string, string>;
}

interface ConsumerMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: Buffer;
  value: Buffer;
  timestamp: string;
  headers?: Record<string, Buffer>;
}
```

#### Configuration Management (`redpanda/redpanda-config.ts`)
Centralized configuration for Redpanda connections and topics.

**Configuration Options:**
```typescript
interface RedpandaConfig {
  brokers: string[];
  clientId?: string;
  groupId?: string;
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  batchSize?: number;
  timeout?: number;
  retries?: number;
  ssl?: SSLConfig;
  sasl?: SASLConfig;
}
```

### 3. Agent Framework (`base-agent.ts`)

#### Core Agent Utilities
Foundation utilities for building agents with MCP integration.

**Key Components:**
- **PromptTemplate**: Template system for AI prompts
- **MCPClient**: Simplified MCP client interface
- **Agent Lifecycle**: Standard initialization and cleanup patterns

```typescript
class PromptTemplate {
  constructor(template: string)
  format(variables: Record<string, any>): string
}

class MCPClient {
  constructor(connectionString: string)
  async call(method: string, params: any): Promise<any>
  async connect(): Promise<void>
  async disconnect(): Promise<void>
}
```

### 4. Services Integration (`services/`)

#### Shared Service Utilities
Common utilities used across the platform for service management and integration.

## Key Design Principles

### 1. Infrastructure as Code
- **Configuration-driven**: All infrastructure configurable via environment variables
- **Docker-ready**: Native container support with docker-compose integration
- **Scalable by default**: Designed for horizontal scaling

### 2. Performance Optimization
- **Connection pooling**: Efficient resource management
- **Batch operations**: Minimize network round-trips
- **Compression**: Reduce bandwidth and storage costs
- **Time-series optimization**: Automatic partitioning and compression

### 3. Reliability and Observability
- **Health checks**: Built-in health monitoring
- **Metrics collection**: Performance and usage metrics
- **Error handling**: Comprehensive error recovery
- **Logging**: Structured logging throughout

### 4. Developer Experience
- **Type safety**: Full TypeScript support
- **Easy configuration**: Sensible defaults with override capability
- **Testing support**: Mock clients for unit testing
- **Documentation**: Comprehensive API documentation

## Integration Examples

### TimescaleDB Integration
```typescript
// Initialize TimescaleDB client
const timescaleClient = new TimescaleClient(
  process.env.DATABASE_URL,
  { max: 20, idleTimeoutMillis: 30000 }
);

await timescaleClient.initialize();

// Insert price data efficiently
const prices: TimescaleCryptoPrice[] = [
  {
    time: new Date(),
    coin_id: "bitcoin",
    symbol: "BTC", 
    usd_price: 67500.45,
    market_cap: 1.33e12,
    volume_24h: 28.5e9,
    last_updated: Date.now()
  }
];

await timescaleClient.insertPrices(prices);

// Query time-series data
const history = await timescaleClient.getPriceHistory(
  "bitcoin",
  new Date("2024-01-01"),
  new Date()
);
```

### Redpanda Integration
```typescript
// Initialize Redpanda client
const redpandaClient = new RedpandaClient({
  brokers: ["localhost:9092"],
  clientId: "crypto-data-platform",
  compression: "gzip"
});

await redpandaClient.initialize();

// Publish messages
const message: MessagePayload = {
  topic: "crypto-prices",
  key: "bitcoin",
  value: priceData,
  timestamp: Date.now()
};

await redpandaClient.produce(message);

// Consume messages
await redpandaClient.consumeMessages(
  ["crypto-prices"],
  "price-processor",
  async (message) => {
    const priceData = JSON.parse(message.value.toString());
    await processPrice(priceData);
  }
);
```

## Environment Configuration

### Database Configuration
```bash
# TimescaleDB connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/crypto_data

# Connection pool settings
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000
```

### Streaming Configuration  
```bash
# Redpanda brokers
REDPANDA_BROKERS=localhost:9092,localhost:9093,localhost:9094

# Client configuration
REDPANDA_CLIENT_ID=crypto-data-platform
REDPANDA_COMPRESSION=gzip
REDPANDA_BATCH_SIZE=100
REDPANDA_TIMEOUT=30000
```

## Performance Characteristics

### TimescaleDB Performance
- **Insert throughput**: 100,000+ rows/second with batching
- **Query performance**: Sub-second for typical time-series queries
- **Compression ratio**: 90% space savings with automatic compression
- **Partition management**: Automatic time-based partitioning

### Redpanda Performance  
- **Throughput**: 1M+ messages/second per topic
- **Latency**: Sub-millisecond end-to-end latency
- **Compression**: 70-90% size reduction with gzip/snappy
- **Scaling**: Linear scaling with additional brokers

## Monitoring and Observability

### Health Checks
Both TimescaleDB and Redpanda clients provide health check endpoints:

```typescript
// Check database health
const dbHealth = await timescaleClient.healthCheck();
console.log(`DB Status: ${dbHealth.status}, Latency: ${dbHealth.latency}ms`);

// Check streaming health  
const streamHealth = await redpandaClient.healthCheck();
console.log(`Stream Status: ${streamHealth.status}, Topics: ${streamHealth.topicCount}`);
```

### Metrics Collection
Built-in metrics for monitoring performance:

- **Database metrics**: Connection count, query latency, error rates
- **Streaming metrics**: Message rates, consumer lag, partition distribution
- **Actor metrics**: Processing time, error counts, throughput

The base module provides the solid foundation that enables the abstract DSL and concrete sources/targets to operate efficiently and reliably at scale.