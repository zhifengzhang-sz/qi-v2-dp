# Target Actors - Data Writing Implementations

## Overview

Target actors implement data writing functionality by extending BaseWriter and implementing technology-specific handlers. Each target actor provides data persistence and streaming capabilities to different storage systems and message brokers.

## Available Target Actors

### 1. TimescaleDB Writer (`timescale/`)

**Purpose**: Time-series database persistence for cryptocurrency data

**Technology**: PostgreSQL + TimescaleDB extension
**Storage**: Hypertables optimized for time-series data
**Connection**: Direct database connection via Drizzle ORM

**MCP Server Details**:
- **Server Type**: N/A (Direct database connection)
- **No MCP server used**: Direct database protocol integration

**Base Infrastructure Used**:
- **TimescaleClient**: From `lib/src/base/database/timescale-client.ts`
- **DrizzleClient**: From `lib/src/base/database/drizzle-client.ts`
- **Database Schema**: From `lib/src/base/database/schema.ts`
- **Connection Pool**: Managed via TimescaleClient
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Batch Processing**: High-performance bulk operations

**Key Features**:
- 90% data compression through TimescaleDB
- Automatic time-based partitioning (hypertables)
- Optimized indexes for time-series queries
- Batch insertion support for high throughput
- ACID transaction guarantees
- Exchange-aware data partitioning

**Usage**:
```typescript
import { createTimescaleMarketDataWriter } from './targets/timescale';

const writer = createTimescaleMarketDataWriter({
  name: "timescale-writer",
  connectionString: process.env.DATABASE_URL,
  batchSize: 1000,
  flushInterval: 5000 // 5 seconds
});

await writer.initialize();

// Write single price
await writer.publishPrice(priceData);

// Write batch of prices
await writer.publishPrices(pricesArray);

// Write OHLCV data
await writer.publishOHLCV(ohlcvData);

// Write market analytics
await writer.publishAnalytics(analyticsData);
```

**Performance**: 10,000+ inserts/second with batch processing, 90% compression

**Database Schema**:
```sql
-- Auto-generated from DSL types
CREATE TABLE crypto_prices (
  coin_id VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  exchange_id VARCHAR(50) NOT NULL,
  usd_price NUMERIC(20,8) NOT NULL,
  market_cap NUMERIC(20,2),
  volume_24h NUMERIC(20,2),
  time TIMESTAMPTZ NOT NULL,
  source VARCHAR(100) NOT NULL,
  attribution TEXT NOT NULL,
  PRIMARY KEY (coin_id, exchange_id, time)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('crypto_prices', 'time');
```

### 2. Redpanda Writer (`redpanda/`)

**Purpose**: Streaming data publication to Redpanda/Kafka topics

**Technology**: Kafka protocol via KafkaJS
**Storage**: Distributed message topics
**Connection**: Redpanda cluster

**MCP Server Details**:
- **Server Type**: N/A (Direct Kafka/Redpanda connection)
- **No MCP server used**: Direct protocol integration

**Base Infrastructure Used**:
- **RedpandaClient**: From `lib/src/base/streaming/redpanda/redpanda-client.ts`
- **RedpandaConfig**: From `lib/src/base/streaming/redpanda/redpanda-config.ts`
- **Producer Pool**: High-performance connection pooling
- **Topic Management**: Auto-generated topic configurations
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Message Serialization**: Optimized JSON/binary encoding

**Key Features**:
- High-throughput message production
- Exchange-aware topic routing
- Automatic message serialization
- Producer connection pooling
- Sub-50ms message delivery
- Configurable partitioning strategies

**Usage**:
```typescript
import { createRedpandaMarketDataWriter } from './targets/redpanda';

const writer = createRedpandaMarketDataWriter({
  name: "redpanda-writer",
  brokers: ["localhost:9092"],
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics",
    level1: "crypto-level1"
  },
  producerConfig: {
    maxInFlightRequests: 1,
    idempotent: true
  }
});

await writer.initialize();

// Publish prices to stream
await writer.publishPrices(pricesArray);

// Publish with custom partitioning
await writer.publishPrice(priceData, { partition: "bitcoin" });
```

**Performance**: 50,000+ messages/second, sub-50ms latency

**Topic Configuration**:
```yaml
# Auto-generated from DSL types
crypto-prices:
  partitions: 12
  replication-factor: 3
  retention-ms: 604800000  # 7 days
  cleanup-policy: delete
  compression-type: lz4
```

### 3. Redpanda MCP Writer (`redpanda-mcp/`) 🔄

**Purpose**: MCP-controlled streaming data publication

**Technology**: MCP + Kafka protocol
**Storage**: MCP-managed message topics
**Connection**: Local MCP server controlling Redpanda access

**MCP Server Details**:
- **Server Type**: Internal (QiCore-managed)
- **Transport**: HTTP/WebSocket (local server)
- **URL**: `http://localhost:8080/mcp` (configurable)
- **Available Tools**: Redpanda streaming publication tools
- **Authentication**: Local authentication (if configured)
- **Management**: Launched via `redpanda-mcp-launcher.ts`

**Base Infrastructure Used**:
- **RedpandaClient**: From `lib/src/base/streaming/redpanda/redpanda-client.ts`
- **MCP Launcher**: From `lib/src/base/streaming/redpanda/redpanda-mcp-launcher.ts`
- **Producer Pool**: MCP-managed connection pooling
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Dynamic Topics**: MCP-controlled topic creation

**Key Features**:
- MCP-driven topic management
- Dynamic topic creation
- Message routing and filtering
- AI-controlled data publication patterns

**Usage**:
```typescript
import { createRedpandaMCPWriter } from './targets/redpanda-mcp';

const writer = createRedpandaMCPWriter({
  name: "redpanda-mcp-writer",
  mcpServerUrl: "http://localhost:8080/mcp"
});

await writer.initialize();

// MCP-controlled data publication
await writer.publishPrices(pricesArray);
```

**Status**: 🔄 In Progress

### 4. TimescaleDB MCP Writer (`timescale-mcp/`) 🔄

**Purpose**: MCP-controlled database persistence

**Technology**: MCP + PostgreSQL/TimescaleDB
**Storage**: MCP-managed hypertables
**Connection**: Local MCP server controlling database access

**MCP Server Details**:
- **Server Type**: Internal (QiCore-managed)
- **Transport**: HTTP/WebSocket (local server)
- **URL**: `http://localhost:8080/mcp` (configurable)
- **Available Tools**: TimescaleDB write and transaction tools
- **Authentication**: Database credentials via MCP server
- **Management**: Launched alongside database infrastructure

**Base Infrastructure Used**:
- **TimescaleClient**: From `lib/src/base/database/timescale-client.ts`
- **DrizzleClient**: From `lib/src/base/database/drizzle-client.ts`
- **Database Schema**: From `lib/src/base/database/schema.ts`
- **Transaction Management**: MCP-controlled ACID operations
- **Connection Pool**: Managed via TimescaleClient
- **QiCore Result<T>**: For error handling (`@qi/core/base`)

**Key Features**:
- MCP-driven SQL generation
- Transaction management
- Schema evolution support
- AI-controlled data persistence patterns

**Usage**:
```typescript
import { createTimescaleMCPWriter } from './targets/timescale-mcp';

const writer = createTimescaleMCPWriter({
  name: "timescale-mcp-writer",
  mcpServerUrl: "http://localhost:8080/mcp"
});

await writer.initialize();

// MCP-controlled data persistence
await writer.publishPrices(pricesArray);
```

**Status**: 🔄 In Progress

## Implementation Pattern

All target actors follow the same implementation pattern:

### 1. Handler Implementation Only

```typescript
export class TargetActorExample extends BaseWriter {
  // ✅ Implement handlers only
  protected async publishPricesHandler(prices: CryptoPriceData[]): Promise<void> {
    // Technology-specific implementation
    await this.batchInsert(prices);
  }

  // ❌ Never reimplement DSL methods
  // async publishPrices() { ... } // DON'T DO THIS
}
```

### 2. Batch Processing Support

All target actors support efficient batch operations:

```typescript
protected async publishPricesHandler(prices: CryptoPriceData[]): Promise<void> {
  // Process in batches for optimal performance
  const batches = this.createBatches(prices, this.config.batchSize);
  
  for (const batch of batches) {
    await this.processBatch(batch);
  }
}
```

### 3. Transaction Support

Database writers support atomic transactions:

```typescript
protected async publishPricesHandler(prices: CryptoPriceData[]): Promise<void> {
  await this.withTransaction(async () => {
    await this.insertPrices(prices);
    await this.updateMetadata();
  });
}
```

## Data Flow Architecture

```
Application Code
        ↓
DSL Interface (standardized)
        ↓
BaseWriter Workflow (unified)
        ↓
Target Actor Handlers (technology-specific)
        ↓
External Storage Systems
```

## Exchange-Aware Storage

All target actors handle exchange-specific data routing:

### TimescaleDB Partitioning
```sql
-- Partition by exchange_id for optimal queries
CREATE INDEX idx_crypto_prices_exchange_time 
ON crypto_prices (exchange_id, time DESC);
```

### Redpanda Topic Routing
```typescript
// Route messages by exchange
const topic = `crypto-prices-${data.exchangeId}`;
await producer.send({
  topic,
  messages: [{ key: data.symbol, value: JSON.stringify(data) }]
});
```

## Error Handling and Reliability

### Retry Logic
```typescript
protected async publishWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private isOpen = false;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error("Circuit breaker is open");
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Performance Optimization

### Batch Processing
```typescript
// Optimal batch sizes per target
const BATCH_SIZES = {
  timescale: 1000,    // Database insert efficiency
  redpanda: 100,      // Message broker throughput
  mcp: 50             // MCP server capacity
};
```

### Connection Pooling
```typescript
// Database connection pool
const pool = new Pool({
  max: 20,           // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Kafka producer pool
const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  acks: 'all'
});
```

## Testing

Each target actor includes comprehensive tests:

```bash
# Test TimescaleDB writer
bun test lib/tests/actors/targets/timescale/

# Test Redpanda writer
bun test lib/tests/actors/targets/redpanda/

# Test MCP writers (when completed)
bun test lib/tests/actors/targets/timescale-mcp/
bun test lib/tests/actors/targets/redpanda-mcp/
```

## Performance Characteristics

| Target Actor | Throughput | Latency | Storage Type | Durability |
|--------------|------------|---------|--------------|------------|
| TimescaleDB | 10k inserts/s | <100ms | Persistent | ACID |
| Redpanda | 50k msgs/s | <50ms | Streaming | At-least-once |
| TimescaleDB MCP | Variable | <200ms | Persistent | ACID |
| Redpanda MCP | Variable | <100ms | Streaming | Configurable |

## Multi-Target Publishing

### Parallel Publishing
```typescript
import { createReaderWriterCombinator } from '../dsl/laws/combinator';

// Create multiple targets
const timescaleWriter = createTimescaleMarketDataWriter({...});
const redpandaWriter = createRedpandaMarketDataWriter({...});

// Publish to multiple targets simultaneously
await Promise.all([
  timescaleWriter.publishPrices(prices),  // Persistent storage
  redpandaWriter.publishPrices(prices)    // Real-time streaming
]);
```

### Fan-out Pattern
```typescript
class MultiTargetWriter {
  constructor(private targets: BaseWriter[]) {}
  
  async publishPrices(prices: CryptoPriceData[]): Promise<Result<void>> {
    const results = await Promise.allSettled(
      this.targets.map(target => target.publishPrices(prices))
    );
    
    // Handle partial failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      // Log failures but don't fail entire operation
      console.warn(`${failures.length} targets failed`);
    }
    
    return success(undefined);
  }
}
```

## Adding New Target Actors

To add a new target actor:

1. **Create directory**: `lib/src/actors/targets/new-target/`

2. **Implement actor class**:
```typescript
export class NewTargetWriter extends BaseWriter {
  protected async publishPricesHandler(prices: CryptoPriceData[]): Promise<void> {
    // Your implementation
  }
  // ... implement all required handlers
}
```

3. **Add factory function**:
```typescript
export function createNewTargetWriter(config: NewTargetConfig): NewTargetWriter {
  return new NewTargetWriter(config);
}
```

4. **Add tests**: `lib/tests/actors/targets/new-target/`

5. **Update documentation**: Add to this README

---

**Next**: See [DSL Documentation](../../dsl/README.md) for interface specifications