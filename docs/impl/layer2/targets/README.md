# Layer 2: Targets - Data Output Actors

## Overview

Targets are **where data goes TO**. They implement the MarketDataWritingDSL interface by extending BaseWriter and provide technology-specific plugins for data publishing to external systems.

## Architecture

Targets in Layer 2:
- **Extend BaseWriter**: Inherit complete publishing DSL implementation and workflow
- **Implement plugins only**: Technology-specific data publishing and transformation
- **Support multiple destinations**: Databases, streams, APIs, files
- **Zero DSL code**: All data publishing operations inherited automatically

## Current Implementations

### Redpanda Target (`targets/redpanda/`)

#### Streaming Publication Pattern
```
Data Input → Redpanda Target → Kafka Topics → Real-time Message Stream
```

**Key Features:**
- **Real-time Publishing**: Publishes to Kafka/Redpanda topics
- **Batch Processing**: Efficient handling of high-throughput data
- **Message Serialization**: JSON and Avro serialization support
- **Layer 1 Integration**: Uses `@qi/core/base/streaming/redpanda` infrastructure

**Implementation Pattern:**
```typescript
class RedpandaMarketDataWriter extends BaseWriter {
  private redpandaClient: RedpandaClient;

  async initialize(): Promise<Result<void>> {
    // Use Layer 1 streaming infrastructure
    this.redpandaClient = new RedpandaClient({
      brokers: this.config.brokers,
      clientId: this.config.clientId,
      topics: this.config.topics,
      compression: this.config.compression
    });

    await this.redpandaClient.connect();

    // Register with BaseWriter client management
    this.addClient("redpanda-publisher", this.redpandaClient, {
      name: "redpanda-publisher",
      type: "stream-target"
    });
  }

  // Plugin implementations - technology-specific only
  protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
    return this.redpandaClient.produce({
      topic: this.config.topics.prices,
      messages: [{
        key: data.coinId,
        value: JSON.stringify(data),
        timestamp: data.lastUpdated.getTime()
      }]
    });
  }

  protected transformPublishResult(result: any): PublishResult {
    return {
      messageId: result.recordMetadata[0].offset.toString(),
      timestamp: new Date(),
      topic: result.recordMetadata[0].topic,
      partition: result.recordMetadata[0].partition,
      offset: result.recordMetadata[0].offset,
      size: JSON.stringify(result).length
    };
  }

  // ALL publishing DSL methods available automatically:
  // publishPrice(), publishPrices(), publishOHLCV(), etc.
}
```

**Configuration:**
```typescript
interface RedpandaWriterConfig {
  name: string;
  brokers: string[];
  clientId: string;
  topics: {
    prices: string;
    ohlcv: string;
    analytics: string;
  };
  compression?: "gzip" | "snappy" | "lz4";
  batchSize?: number;
  timeout?: number;
  debug?: boolean;
}
```

### TimescaleDB Target (`targets/timescale/`)

#### Database Storage Pattern
```
Data Input → TimescaleDB Target → Database Tables → Persistent Storage
```

**Key Features:**
- **Time-series Optimization**: Leverages TimescaleDB hypertables for automatic partitioning
- **Bulk Operations**: Efficient batch insertions for high-throughput data
- **Schema Management**: Automatic table creation and migration
- **Layer 1 Integration**: Uses `@qi/core/base/database/timescale` infrastructure

**Implementation Pattern:**
```typescript
class TimescaleMarketDataWriter extends BaseWriter {
  private timescaleClient: TimescaleClient;

  async initialize(): Promise<Result<void>> {
    // Use Layer 1 database infrastructure
    this.timescaleClient = new TimescaleClient({
      connectionString: this.config.connectionString,
      poolConfig: this.config.poolConfig
    });

    await this.timescaleClient.connect();

    // Register with BaseWriter client management
    this.addClient("timescale-db", this.timescaleClient, {
      name: "timescale-db",
      type: "database"
    });
  }

  // Plugin implementations for database operations
  protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
    return this.timescaleClient.query(`
      INSERT INTO crypto_prices (
        coin_id, symbol, name, usd_price, market_cap, volume_24h,
        change_24h, change_7d, last_updated, source, attribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      data.coinId, data.symbol, data.name, data.usdPrice,
      data.marketCap, data.volume24h, data.change24h, data.change7d,
      data.lastUpdated, data.source, data.attribution
    ]);
  }

  protected transformPublishResult(result: any): PublishResult {
    return {
      messageId: result.rows[0].id.toString(),
      timestamp: new Date(),
      topic: "crypto_prices_table",
      partition: 0,
      offset: result.rows[0].id,
      size: JSON.stringify(result.rows[0]).length
    };
  }

  // Batch operations for high-throughput scenarios
  protected async publishPricesPlugin(data: CryptoPriceData[]): Promise<any> {
    const values = data.map(item => [
      item.coinId, item.symbol, item.name, item.usdPrice,
      item.marketCap, item.volume24h, item.change24h, item.change7d,
      item.lastUpdated, item.source, item.attribution
    ]);

    return this.timescaleClient.bulkInsert("crypto_prices", values);
  }
}
```

**Configuration:**
```typescript
interface TimescaleWriterConfig {
  name: string;
  connectionString: string;
  poolConfig?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
  };
  batchSize?: number;
  debug?: boolean;
}
```

## Plugin Architecture Benefits

### 1. Zero DSL Implementation Required
```typescript
// ❌ DON'T implement DSL methods in target classes
class SomeTarget extends BaseWriter {
  async publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>> {
    // ❌ This creates code duplication
  }
}

// ✅ DO implement plugins only
class SomeTarget extends BaseWriter {
  protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
    // ✅ Technology-specific publishing only
  }
  
  protected transformPublishResult(result: any): PublishResult {
    // ✅ Result transformation only
  }
  
  // All publishing DSL methods inherited automatically
}
```

### 2. Uniform Interface Across Technologies
```typescript
// Same interface for all targets regardless of technology
await redpandaTarget.publishPrice(priceData);
await timescaleTarget.publishPrice(priceData);
await futureAPITarget.publishPrice(priceData);

// All return Result<PublishResult> with same error handling
```

### 3. Easy Technology Migration
```typescript
// Switch storage destinations without changing client code
const dataTarget = useDatabase 
  ? createTimescaleMarketDataWriter(dbConfig)
  : createRedpandaMarketDataWriter(streamConfig);

// Same DSL methods available regardless of choice
await dataTarget.publishPrices(priceData);
```

## Data Publishing Pipeline

### Unified Types → Technology-Specific Format
```typescript
// Each target transforms unified types to technology-specific format
protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
  // Redpanda: JSON message format
  const message = {
    key: data.coinId,
    value: JSON.stringify({
      coin_id: data.coinId,        // Transform to snake_case
      price_usd: data.usdPrice,    // Transform field names
      market_cap: data.marketCap,
      updated_at: data.lastUpdated.toISOString(),
      data_source: data.source
    }),
    timestamp: Date.now()
  };
  
  return this.redpandaClient.produce({
    topic: this.config.topics.prices,
    messages: [message]
  });
}

// TimescaleDB: SQL parameter format
protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
  return this.timescaleClient.query(`
    INSERT INTO crypto_prices (...) VALUES ($1, $2, ...)
  `, [
    data.coinId,
    data.usdPrice,
    data.marketCap,
    data.lastUpdated
  ]);
}
```

### Batch Processing Optimization
```typescript
// Efficient batch operations for high-throughput scenarios
protected async publishPricesPlugin(data: CryptoPriceData[]): Promise<any> {
  // Redpanda: Batch message production
  const messages = data.map(item => ({
    key: item.coinId,
    value: JSON.stringify(item)
  }));
  
  return this.redpandaClient.produce({
    topic: this.config.topics.prices,
    messages: messages
  });
}

// TimescaleDB: Bulk database insertion
protected async publishPricesPlugin(data: CryptoPriceData[]): Promise<any> {
  const values = data.map(item => [
    item.coinId, item.usdPrice, item.marketCap, item.lastUpdated
  ]);
  
  return this.timescaleClient.bulkInsert("crypto_prices", values);
}
```

## Publishing DSL Operations

### Single Data Publishing
```typescript
// Available automatically on all targets
await target.publishPrice(cryptoPriceData);
await target.publishOHLCV(ohlcvData);
await target.publishMarketAnalytics(analyticsData);
await target.publishLevel1Data(level1Data);
```

### Batch Publishing
```typescript
// Efficient batch operations
await target.publishPrices(priceDataArray);
await target.publishOHLCVBatch(ohlcvDataArray);
await target.publishBatch(mixedDataArray);
```

### Utility Operations
```typescript
// Flow control operations
await target.flush();  // Ensure all pending data is published
```

## Error Handling and Resilience

### Technology-Specific Error Handling
```typescript
protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
  try {
    return await this.redpandaClient.produce({
      topic: this.config.topics.prices,
      messages: [{ key: data.coinId, value: JSON.stringify(data) }]
    });
  } catch (error) {
    // Handle Kafka-specific errors
    if (error.code === 'TOPIC_AUTHORIZATION_FAILED') {
      throw new Error(`Kafka authorization failed for topic: ${this.config.topics.prices}`);
    }
    if (error.code === 'REQUEST_TIMED_OUT') {
      throw new Error(`Kafka publish timeout: ${error.message}`);
    }
    throw error;
  }
}
```

### Automatic Retry and Backoff
```typescript
// BaseWriter provides retry mechanisms
protected async workflow<TResult>(
  pluginFn: () => Promise<any>,
  transform: (result: any) => TResult,
  errorCode: string
): Promise<Result<TResult>> {
  let retries = 0;
  const maxRetries = this.config.maxRetries || 3;
  
  while (retries <= maxRetries) {
    try {
      const result = await pluginFn();
      return success(transform(result));
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        return failure(createQiError(errorCode, error.message, "SYSTEM"));
      }
      await this.backoff(retries);
    }
  }
}
```

## Integration with Layer 1

### Database Targets
```typescript
// Use Layer 1 database infrastructure
import { TimescaleClient } from '@qi/core/base/database';

class SomeDatabaseTarget extends BaseWriter {
  private dbClient: TimescaleClient;
  
  async initialize(): Promise<Result<void>> {
    this.dbClient = new TimescaleClient(this.config);
    await this.dbClient.connect();
  }
}
```

### Streaming Targets
```typescript
// Use Layer 1 streaming infrastructure
import { RedpandaClient } from '@qi/core/base/streaming';

class SomeStreamTarget extends BaseWriter {
  private streamClient: RedpandaClient;
  
  async initialize(): Promise<Result<void>> {
    this.streamClient = new RedpandaClient(this.config);
    await this.streamClient.connect();
  }
}
```

## Usage Examples

### Factory Pattern
```typescript
// Create targets using factory functions
const redpandaTarget = createRedpandaMarketDataWriter({
  name: "redpanda-publisher",
  brokers: ["localhost:9092"],
  clientId: "crypto-publisher",
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  },
  compression: "gzip",
  batchSize: 100
});

const timescaleTarget = createTimescaleMarketDataWriter({
  name: "timescale-writer",
  connectionString: "postgresql://user:pass@localhost:5432/crypto_data",
  poolConfig: { max: 10 },
  batchSize: 1000
});
```

### Pipeline Integration
```typescript
// Targets as part of data pipelines
const pipeline = {
  source: coinGeckoSource,
  streamTarget: redpandaTarget,
  dbTarget: timescaleTarget
};

// Get data from source
const prices = await pipeline.source.getCurrentPrices(["bitcoin", "ethereum"]);

if (isSuccess(prices)) {
  const priceData = getData(prices);
  
  // Publish to both stream and database
  await Promise.all([
    pipeline.streamTarget.publishPrices(priceData),
    pipeline.dbTarget.publishPrices(priceData)
  ]);
}
```

### Multi-Target Publishing
```typescript
// Publish to multiple destinations simultaneously
const targets = [redpandaTarget, timescaleTarget, s3Target];

const publishToAll = async (data: CryptoPriceData[]) => {
  const results = await Promise.allSettled(
    targets.map(target => target.publishPrices(data))
  );
  
  return results.map((result, index) => ({
    target: targets[index].config.name,
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : null
  }));
};
```

---

**Targets Principle**: Implement technology-specific data publishing plugins while inheriting unified DSL operations that work consistently across all data destinations.