# Targets Module Documentation

The `targets` module contains all data target actors that write/publish data to external systems. These actors extend the `BaseWriter` foundation and implement the unified DSL for data publishing and storage.

## Overview

Targets are **where data goes TO**. They implement the MarketDataWritingDSL interface and provide consistent APIs for data publishing regardless of the underlying technology.

Current targets:
- **Redpanda**: Stream-based real-time data publishing  
- **TimescaleDB**: Time-series database storage with optimization

## Architecture Diagram

```
targets/
├── redpanda/               # Redpanda Streaming Target
│   ├── RedpandaMarketDataWriter.ts  # Stream producer actor
│   ├── MarketDataWriter.ts          # Legacy actor (reference)
│   └── index.ts                     # Exports and utilities
└── timescale/              # TimescaleDB Storage Target
    ├── TimescaleMarketDataWriter.ts # Database writer actor
    └── index.ts                     # Exports and utilities
```

## Design Philosophy

### Plugin Pattern Implementation
Each target actor:
1. **Extends BaseWriter**: Gets full DSL implementation + workflow
2. **Implements only plugins**: Technology-specific data publishing
3. **Transforms results**: Converts to unified DSL result types
4. **Zero DSL code**: All DSL complexity handled by BaseWriter

### Multi-Destination Support
Targets support various destination patterns:
- **Single destination**: Database connection, single Kafka topic
- **Multiple destinations**: Multi-topic publishing, database + cache
- **Zero destinations**: File output, in-memory storage, calculations

## Core Components

### 1. Redpanda Target (`redpanda/`)

#### RedpandaMarketDataWriter.ts (Stream Producer)
Redpanda market data writer for publishing real-time cryptocurrency data streams.

**Key Features:**
- **Real-time Publishing**: High-throughput message publishing
- **Multiple Topics**: Supports prices, OHLCV, analytics, level1 data
- **Batch Operations**: Efficient batch publishing with compression
- **Message Partitioning**: Intelligent partition assignment
- **Delivery Guarantees**: Configurable acknowledgment levels

**Plugin Implementation:**
```typescript
class RedpandaMarketDataWriter extends BaseWriter {
  // Only implement plugins - BaseWriter handles all DSL methods
  
  protected async publishPricePlugin(data: CryptoPriceData, options?: PublishOptions): Promise<any> {
    const topic = options?.destination || this.config.topics?.prices || "crypto-prices";
    const key = data.coinId;
    
    const message: MessagePayload = {
      topic,
      key,
      value: data,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers
    };

    // Use real RedpandaClient from base infrastructure
    return this.redpandaClient.produceBatch([message]);
  }
  
  protected transformPublishResult(data: any): PublishResult {
    return {
      messageId: this.generateMessageId(),
      topic: data.topic || "unknown",
      partition: data.partition || 0,
      offset: data.offset || 0,
      timestamp: new Date(),
      size: data.size || 1
    };
  }
  
  // BaseWriter handles workflow: validation, error handling, Result<T> wrapping
}
```

**Configuration:**
```typescript
interface RedpandaWriterConfig {
  name: string;
  brokers: string[];
  clientId?: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  compression?: "none" | "gzip" | "snappy" | "lz4";
  batchSize?: number;
  flushInterval?: number;
  retries?: number;
  timeout?: number;
  debug?: boolean;
}
```

**Message Format Standardization:**
```typescript
// All cryptocurrency data uses consistent message format
interface StandardMessage {
  messageId: string;
  timestamp: number;
  source: string;
  dataType: "price" | "ohlcv" | "analytics" | "level1";
  payload: CryptoPriceData | CryptoOHLCVData | CryptoMarketAnalytics | Level1Data;
  metadata?: {
    attribution: string;
    processingLatency?: number;
    originalTimestamp?: number;
  };
}
```

**Batch Publishing Optimization:**
```typescript
protected async publishPricesPlugin(
  data: CryptoPriceData[],
  options?: BatchPublishOptions
): Promise<any> {
  const topic = options?.destination || this.config.topics?.prices || "crypto-prices";
  
  // Create batch messages with intelligent partitioning
  const messages: MessagePayload[] = data.map((price, index) => ({
    topic,
    key: price.coinId,
    value: price,
    partition: this.selectPartition(price.coinId, options?.partitionCount),
    timestamp: price.lastUpdated.getTime(),
    headers: {
      "content-type": "application/json",
      "source": price.source,
      "batch-index": index.toString()
    }
  }));

  // Use efficient batch publishing
  return this.redpandaClient.produceBatch(messages);
}
```

### 2. TimescaleDB Target (`timescale/`)

#### TimescaleMarketDataWriter.ts (Database Storage)
TimescaleDB market data writer optimized for time-series data storage and analytics.

**Key Features:**
- **Hypertable Storage**: Automatic time-based partitioning
- **Batch Inserts**: High-throughput bulk operations
- **Compression**: 90% space savings with automatic compression
- **Schema Management**: Automatic table creation and optimization
- **Analytics Support**: Time-series aggregation functions

**Plugin Implementation:**
```typescript
class TimescaleMarketDataWriter extends BaseWriter {
  protected async publishPricePlugin(data: CryptoPriceData, options?: PublishOptions): Promise<any> {
    // Transform to TimescaleDB schema
    const timescalePrice: TimescaleCryptoPrice = {
      time: data.lastUpdated,
      coin_id: data.coinId,
      symbol: data.symbol,
      usd_price: data.usdPrice,
      btc_price: data.btcPrice,
      market_cap: data.marketCap,
      volume_24h: data.volume24h,
      change_24h: data.change24h,
      last_updated: data.lastUpdated.getTime()
    };

    // Use real TimescaleClient from base infrastructure
    await this.timescaleClient.insertPrices([timescalePrice]);
    
    return {
      table: "crypto_prices",
      rowsInserted: 1,
      timestamp: new Date(),
      coinId: data.coinId
    };
  }
  
  protected transformPublishResult(data: any): PublishResult {
    return {
      messageId: this.generateMessageId(),
      topic: data.table || "unknown",
      partition: 0, // TimescaleDB doesn't have partitions like Kafka
      offset: 0,
      timestamp: new Date(),
      size: data.rowsInserted || 1
    };
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
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}
```

**Schema Optimization:**
```typescript
// Automatic hypertable creation and optimization
class TimescaleMarketDataWriter extends BaseWriter {
  async initialize(): Promise<Result<void>> {
    await this.timescaleClient.initialize();
    
    // Enable hypertables for time-series optimization
    await this.timescaleClient.createHypertable("crypto_prices", "time");
    await this.timescaleClient.createHypertable("ohlcv_data", "time");
    
    // Enable compression for older data
    await this.timescaleClient.enableCompression("crypto_prices", "7 days");
    await this.timescaleClient.enableCompression("ohlcv_data", "30 days");
    
    return success(undefined);
  }
}
```

**Batch Operations with Upserts:**
```typescript
protected async publishPricesPlugin(
  data: CryptoPriceData[],
  options?: BatchPublishOptions
): Promise<any> {
  // Convert to TimescaleDB format
  const timescalePrices: TimescaleCryptoPrice[] = data.map(price => ({
    time: price.lastUpdated,
    coin_id: price.coinId,
    symbol: price.symbol,
    usd_price: price.usdPrice,
    btc_price: price.btcPrice,
    market_cap: price.marketCap,
    volume_24h: price.volume24h,
    change_24h: price.change24h,
    last_updated: price.lastUpdated.getTime()
  }));

  // Use efficient bulk insert with conflict resolution
  await this.timescaleClient.insertPrices(timescalePrices);
  
  return {
    table: "crypto_prices",
    rowsInserted: data.length,
    timestamp: new Date(),
    batchId: this.generateMessageId()
  };
}
```

## Usage Examples

### Redpanda Target Usage
```typescript
// Create and initialize Redpanda target
const redpandaTarget = createRedpandaMarketDataWriter({
  name: "main-redpanda-target",
  brokers: ["localhost:9092"],
  clientId: "crypto-publisher",
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  },
  compression: "gzip",
  batchSize: 100,
  debug: true
});

await redpandaTarget.initialize();

// Publish single price - unified DSL
const publishResult = await redpandaTarget.publishPrice(bitcoinPrice);
if (publishResult.success) {
  console.log(`Published to ${publishResult.data.topic}, offset: ${publishResult.data.offset}`);
}

// Batch publish multiple prices
const batchResult = await redpandaTarget.publishPrices(cryptoPrices);
if (batchResult.success) {
  console.log(`Batch published ${batchResult.data.totalMessages} messages`);
}

// Publish OHLCV data
const ohlcvResult = await redpandaTarget.publishOHLCV(bitcoinOHLCV);

// Flush pending messages
await redpandaTarget.flush(5000);
```

### TimescaleDB Target Usage
```typescript
// Create and initialize TimescaleDB target
const timescaleTarget = createTimescaleMarketDataWriter({
  name: "main-timescale-target",
  connectionString: process.env.DATABASE_URL,
  poolConfig: { max: 20 },
  batchSize: 50,
  debug: true
});

await timescaleTarget.initialize();

// Same DSL as Redpanda - unified interface
const storeResult = await timescaleTarget.publishPrice(bitcoinPrice);
if (storeResult.success) {
  console.log(`Stored in table: ${storeResult.data.topic}`);
}

// Batch store with time-series optimization
const batchStoreResult = await timescaleTarget.publishPrices(cryptoPrices);

// Store OHLCV data for technical analysis
const ohlcvStoreResult = await timescaleTarget.publishOHLCV(bitcoinOHLCV);

// Store market analytics
const analyticsResult = await timescaleTarget.publishAnalytics(marketData);
```

## Data Flow Patterns

### Real-time Streaming (Redpanda)
```
Data → Transform → Topic → Partition → Replicas → Consumers
```

### Time-series Storage (TimescaleDB)
```
Data → Transform → Table → Hypertable → Compression → Analytics
```

### Hybrid Pipeline (Stream + Store)
```
Source → Redpanda Target → Topic → Redpanda Source → TimescaleDB Target → Database
```

## Performance Optimization

### Redpanda Performance
- **Batch Publishing**: Group messages for network efficiency
- **Compression**: Reduce bandwidth and storage costs
- **Partitioning**: Parallel processing across partitions
- **Producer Configs**: Optimize for throughput vs latency

```typescript
// High-throughput configuration
const redpandaConfig = {
  batchSize: 1000,
  compression: "lz4",
  flushInterval: 100,
  retries: 3,
  acks: "1" // Fast acknowledgment
};

// Low-latency configuration  
const lowLatencyConfig = {
  batchSize: 1,
  compression: "none", 
  flushInterval: 0,
  retries: 0,
  acks: "0" // No acknowledgment
};
```

### TimescaleDB Performance
- **Hypertables**: Automatic time-based partitioning
- **Batch Inserts**: Reduce transaction overhead
- **Compression**: 90% space savings for older data
- **Indexing**: Optimized time-series indexes

```typescript
// High-throughput configuration
const timescaleConfig = {
  batchSize: 1000,
  poolConfig: {
    max: 50,
    idleTimeoutMillis: 30000
  },
  connectionTimeoutMillis: 2000
};

// Enable automatic compression for cost optimization
await timescaleClient.setCompressionPolicy("crypto_prices", {
  compress_after: "7 days",
  compress_segmentby: "coin_id",
  compress_orderby: "time"
});
```

## Error Handling and Reliability

### Redpanda Error Handling
```typescript
// Producer failures
if (error.code === "BROKER_NOT_AVAILABLE") {
  await this.reconnectProducer();
  return this.retryWithBackoff(operation);
}

// Topic creation
if (error.code === "UNKNOWN_TOPIC_OR_PARTITION") {
  await this.createMissingTopic(topicName);
  return this.retry(operation);
}

// Message size limits
if (error.code === "MESSAGE_TOO_LARGE") {
  return this.splitAndRetry(message);
}
```

### TimescaleDB Error Handling
```typescript
// Connection failures
if (error.code === "ECONNREFUSED") {
  await this.reconnectWithBackoff();
}

// Constraint violations
if (error.code === "23505") { // Unique violation
  return this.handleDuplicateData(data);
}

// Table space issues
if (error.code === "54000") { // Disk full
  await this.enableCompression();
  await this.cleanupOldData();
}
```

## Monitoring and Observability

### Target Metrics
All targets provide standardized metrics:

```typescript
interface TargetStatus {
  isInitialized: boolean;
  isConnected: boolean;
  totalPublishes: number;
  errorCount: number;
  lastActivity?: Date;
  averageLatency: number;
  throughput: number;
}
```

### Redpanda Specific Metrics
- Message throughput per topic
- Producer lag and queue size
- Partition distribution
- Compression ratios

### TimescaleDB Specific Metrics
- Insert throughput (rows/second)
- Database size and compression ratios
- Hypertable partition count
- Query performance statistics

## Advanced Features

### Message Transformation Pipeline
```typescript
// Custom message transformations
class CustomRedpandaWriter extends RedpandaMarketDataWriter {
  protected async publishPricePlugin(data: CryptoPriceData, options?: PublishOptions): Promise<any> {
    // Add custom enrichment
    const enrichedData = {
      ...data,
      marketTier: this.classifyMarketTier(data.marketCap),
      riskScore: await this.calculateRiskScore(data),
      technicalIndicators: await this.addTechnicalIndicators(data)
    };
    
    return super.publishPricePlugin(enrichedData, options);
  }
}
```

### Time-series Analytics Integration
```typescript
// Built-in analytics queries
class AnalyticsTimescaleWriter extends TimescaleMarketDataWriter {
  async generateDailyReport(coinId: string, date: Date): Promise<DailyReport> {
    return this.timescaleClient.query(`
      SELECT 
        time_bucket('1 hour', time) as hour,
        first(usd_price, time) as open,
        max(usd_price) as high,
        min(usd_price) as low,
        last(usd_price, time) as close,
        count(*) as data_points
      FROM crypto_prices 
      WHERE coin_id = $1 AND DATE(time) = $2
      GROUP BY hour
      ORDER BY hour
    `, [coinId, date]);
  }
}
```

## Testing Strategies

### Unit Testing with Mocks
```typescript
// Mock the infrastructure clients
class MockRedpandaWriter extends RedpandaMarketDataWriter {
  protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
    return {
      topic: "crypto-prices",
      partition: 0,
      offset: 12345,
      timestamp: Date.now()
    };
  }
}

// Test DSL behavior with mocked infrastructure
const writer = new MockRedpandaWriter(config);
const result = await writer.publishPrice(testPrice);
expect(result.success).toBe(true);
```

### Integration Testing
```typescript
// Test with real infrastructure
const writer = new RedpandaMarketDataWriter(config);
await writer.initialize();

const result = await writer.publishPrice(testPrice);
expect(result.success).toBe(true);

// Verify message was actually published
const consumer = new TestConsumer(config);
const message = await consumer.waitForMessage("crypto-prices", 5000);
expect(message.value).toEqual(testPrice);
```

The targets module demonstrates how the unified DSL abstraction enables consistent data publishing across completely different technologies (streaming vs databases) while maintaining performance, reliability, and observability standards throughout.