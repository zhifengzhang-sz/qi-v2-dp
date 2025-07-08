# Message Schema Design Tutorial

## Overview

This tutorial covers how to design, implement, and manage message schemas for the QiCore cryptocurrency data platform. Message schemas ensure data consistency, enable evolution, and provide validation across the streaming pipeline.

## Schema Design Principles

### 1. Exchange-Aware Schema Design

All message schemas include `exchangeId` as a required field to support multi-exchange data processing:

```typescript
interface BaseMessage {
  exchangeId: string;      // Required: Exchange identifier
  timestamp: Date;         // Required: Message timestamp
  source: string;          // Required: Data source identifier
  attribution: string;     // Required: Data attribution/license
}
```

### 2. Schema Hierarchy

```
BaseMessage (common fields)
├── CryptoPriceData (price information)
├── CryptoOHLCVData (candlestick data)
├── CryptoMarketAnalytics (market metrics)
├── Level1Data (order book L1)
└── ActorControlMessage (system commands)
```

## Core Message Schemas

### 1. Crypto Price Data Schema

```typescript
// lib/src/dsl/MarketDataTypes.ts
export interface CryptoPriceData extends BaseMessage {
  // Identification
  coinId: string;          // e.g., "bitcoin"
  symbol: string;          // e.g., "btc"
  name: string;            // e.g., "Bitcoin"
  exchangeId: string;      // e.g., "binance"

  // Price Information
  usdPrice: number;        // Current USD price
  btcPrice?: number;       // Optional: Price in BTC
  ethPrice?: number;       // Optional: Price in ETH

  // Market Data
  marketCap?: number;      // Market capitalization
  volume24h?: number;      // 24-hour trading volume
  change24h?: number;      // 24-hour price change percentage
  change7d?: number;       // 7-day price change percentage

  // Metadata
  lastUpdated: Date;       // Last update timestamp
  source: string;          // "coingecko", "binance-api", etc.
  attribution: string;     // Data license/attribution
}
```

**JSON Schema Validation:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CryptoPriceData",
  "type": "object",
  "required": ["coinId", "symbol", "name", "exchangeId", "usdPrice", "lastUpdated", "source", "attribution"],
  "properties": {
    "coinId": { "type": "string", "minLength": 1 },
    "symbol": { "type": "string", "minLength": 1 },
    "name": { "type": "string", "minLength": 1 },
    "exchangeId": { "type": "string", "minLength": 1 },
    "usdPrice": { "type": "number", "minimum": 0 },
    "btcPrice": { "type": "number", "minimum": 0 },
    "ethPrice": { "type": "number", "minimum": 0 },
    "marketCap": { "type": "number", "minimum": 0 },
    "volume24h": { "type": "number", "minimum": 0 },
    "change24h": { "type": "number" },
    "change7d": { "type": "number" },
    "lastUpdated": { "type": "string", "format": "date-time" },
    "source": { "type": "string", "minLength": 1 },
    "attribution": { "type": "string", "minLength": 1 }
  }
}
```

### 2. OHLCV Data Schema

```typescript
export interface CryptoOHLCVData extends BaseMessage {
  // Identification
  coinId: string;          // e.g., "bitcoin"
  symbol: string;          // e.g., "btc"
  exchangeId: string;      // e.g., "binance"

  // OHLCV Data
  timestamp: Date;         // Candle start time
  openPrice: number;       // Opening price
  highPrice: number;       // Highest price
  lowPrice: number;        // Lowest price
  closePrice: number;      // Closing price
  volume: number;          // Trading volume

  // Metadata
  timeframe: string;       // "1m", "5m", "1h", "1d", etc.
  source: string;          // Data source
  attribution: string;     // Data attribution
}
```

**Validation Rules:**
```typescript
// lib/src/dsl/validation/ohlcv-validator.ts
export function validateOHLCVData(data: CryptoOHLCVData): ValidationResult {
  const errors: string[] = [];

  // Price validation
  if (data.highPrice < data.lowPrice) {
    errors.push("High price cannot be less than low price");
  }
  
  if (data.openPrice < data.lowPrice || data.openPrice > data.highPrice) {
    errors.push("Open price must be between low and high prices");
  }
  
  if (data.closePrice < data.lowPrice || data.closePrice > data.highPrice) {
    errors.push("Close price must be between low and high prices");
  }

  // Volume validation
  if (data.volume < 0) {
    errors.push("Volume cannot be negative");
  }

  // Timeframe validation
  const validTimeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"];
  if (!validTimeframes.includes(data.timeframe)) {
    errors.push(`Invalid timeframe: ${data.timeframe}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 3. Market Analytics Schema

```typescript
export interface CryptoMarketAnalytics extends BaseMessage {
  // Timing
  timestamp: Date;         // Analytics timestamp
  exchangeId: string;      // "global", "binance", etc.

  // Market Metrics
  totalMarketCap: number;  // Total market capitalization
  totalVolume: number;     // Total 24h volume
  btcDominance: number;    // Bitcoin dominance percentage
  ethDominance?: number;   // Ethereum dominance percentage

  // Market Statistics
  activeCryptocurrencies: number;    // Number of active cryptos
  markets: number;                   // Number of markets
  marketCapChange24h: number;        // 24h market cap change %

  // Metadata
  source: string;          // Data source
  attribution: string;     // Data attribution
}
```

## Schema Evolution Strategy

### 1. Versioning Approach

```typescript
// Version-aware message envelope
interface MessageEnvelope<T> {
  version: string;         // Schema version: "1.0.0"
  messageType: string;     // Message type identifier
  timestamp: Date;         // Envelope timestamp
  payload: T;              // Actual message data
}

// Example usage
const priceMessage: MessageEnvelope<CryptoPriceData> = {
  version: "1.0.0",
  messageType: "crypto-price-data",
  timestamp: new Date(),
  payload: {
    coinId: "bitcoin",
    symbol: "btc",
    // ... rest of price data
  }
};
```

### 2. Backward Compatibility

```typescript
// lib/src/dsl/evolution/schema-migration.ts
export class SchemaMigration {
  // Migrate from v1.0.0 to v1.1.0
  migrateV1ToV1_1(oldData: CryptoPriceDataV1): CryptoPriceDataV1_1 {
    return {
      ...oldData,
      // Add new optional fields with defaults
      ethPrice: undefined,
      change7d: undefined,
      // Rename fields if needed
      priceUsd: oldData.usdPrice,  // Rename for consistency
    };
  }

  // Auto-detect and migrate
  autoMigrate(message: MessageEnvelope<any>): MessageEnvelope<any> {
    switch (message.version) {
      case "1.0.0":
        return {
          ...message,
          version: "1.1.0",
          payload: this.migrateV1ToV1_1(message.payload)
        };
      default:
        return message; // Already latest version
    }
  }
}
```

### 3. Schema Registry Integration

```typescript
// lib/src/base/streaming/schema-registry.ts
export class SchemaRegistry {
  private schemas: Map<string, JSONSchema> = new Map();

  registerSchema(messageType: string, version: string, schema: JSONSchema): void {
    const key = `${messageType}:${version}`;
    this.schemas.set(key, schema);
  }

  validateMessage(messageType: string, version: string, data: any): ValidationResult {
    const key = `${messageType}:${version}`;
    const schema = this.schemas.get(key);
    
    if (!schema) {
      return { isValid: false, errors: [`Unknown schema: ${key}`] };
    }

    return this.validateAgainstSchema(data, schema);
  }

  getLatestVersion(messageType: string): string {
    const versions = Array.from(this.schemas.keys())
      .filter(key => key.startsWith(`${messageType}:`))
      .map(key => key.split(':')[1])
      .sort((a, b) => this.compareVersions(b, a)); // Descending order

    return versions[0] || "1.0.0";
  }
}
```

## Message Serialization

### 1. JSON Serialization (Default)

```typescript
// lib/src/base/streaming/serialization/json-serializer.ts
export class JSONMessageSerializer implements MessageSerializer {
  serialize<T>(message: MessageEnvelope<T>): Buffer {
    const json = JSON.stringify(message, this.dateReplacer);
    return Buffer.from(json, 'utf-8');
  }

  deserialize<T>(buffer: Buffer): MessageEnvelope<T> {
    const json = buffer.toString('utf-8');
    return JSON.parse(json, this.dateReviver);
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}
```

### 2. Avro Serialization (High Performance)

```typescript
// lib/src/base/streaming/serialization/avro-serializer.ts
import avro from 'avsc';

export class AvroMessageSerializer implements MessageSerializer {
  private schemas: Map<string, avro.Type> = new Map();

  registerAvroSchema(messageType: string, schema: any): void {
    const avroType = avro.Type.forSchema(schema);
    this.schemas.set(messageType, avroType);
  }

  serialize<T>(message: MessageEnvelope<T>): Buffer {
    const schema = this.schemas.get(message.messageType);
    if (!schema) {
      throw new Error(`No Avro schema for message type: ${message.messageType}`);
    }

    return schema.toBuffer(message);
  }

  deserialize<T>(buffer: Buffer, messageType: string): MessageEnvelope<T> {
    const schema = this.schemas.get(messageType);
    if (!schema) {
      throw new Error(`No Avro schema for message type: ${messageType}`);
    }

    return schema.fromBuffer(buffer);
  }
}
```

## Schema Generation from DSL

### 1. Automatic Schema Generation

```typescript
// lib/scripts/generate-schemas.ts
import { generateJSONSchema } from './schema-generator';

async function generateAllSchemas(): Promise<void> {
  const schemaConfigs = [
    { 
      type: 'CryptoPriceData', 
      file: 'lib/src/dsl/MarketDataTypes.ts',
      output: 'services/redpanda/schemas/crypto-price-data.json'
    },
    { 
      type: 'CryptoOHLCVData', 
      file: 'lib/src/dsl/MarketDataTypes.ts',
      output: 'services/redpanda/schemas/crypto-ohlcv-data.json'
    },
    { 
      type: 'CryptoMarketAnalytics', 
      file: 'lib/src/dsl/MarketDataTypes.ts',
      output: 'services/redpanda/schemas/crypto-market-analytics.json'
    }
  ];

  for (const config of schemaConfigs) {
    console.log(`Generating schema for ${config.type}...`);
    const schema = await generateJSONSchema(config.file, config.type);
    await writeFile(config.output, JSON.stringify(schema, null, 2));
  }

  console.log('All schemas generated successfully!');
}
```

### 2. Schema Validation Integration

```typescript
// lib/src/actors/sources/coingecko/MarketDataReader.ts
import { validateMessage } from '../../base/streaming/schema-registry';

export class CoinGeckoMarketDataReader extends BaseReader {
  async publishData(data: CryptoPriceData): Promise<Result<void>> {
    // Validate against schema before publishing
    const validation = validateMessage('crypto-price-data', '1.0.0', data);
    
    if (!validation.isValid) {
      return failure(createQiError(
        'SCHEMA_VALIDATION_FAILED',
        `Invalid message schema: ${validation.errors.join(', ')}`,
        'BUSINESS',
        { data, errors: validation.errors }
      ));
    }

    return this.publishToTopic('crypto-prices', data);
  }
}
```

## Message Routing and Processing

### 1. Content-Based Routing

```typescript
// lib/src/base/streaming/message-router.ts
export class MessageRouter {
  private routes: Map<string, RouteHandler[]> = new Map();

  addRoute(pattern: string, handler: RouteHandler): void {
    if (!this.routes.has(pattern)) {
      this.routes.set(pattern, []);
    }
    this.routes.get(pattern)!.push(handler);
  }

  async routeMessage(message: MessageEnvelope<any>): Promise<void> {
    const routes = this.findMatchingRoutes(message);
    
    // Process routes in parallel
    await Promise.all(
      routes.map(handler => handler.process(message))
    );
  }

  private findMatchingRoutes(message: MessageEnvelope<any>): RouteHandler[] {
    const handlers: RouteHandler[] = [];
    
    for (const [pattern, routeHandlers] of this.routes) {
      if (this.matchesPattern(message, pattern)) {
        handlers.push(...routeHandlers);
      }
    }
    
    return handlers;
  }
}

// Usage example
router.addRoute('messageType=crypto-price-data AND exchangeId=binance', 
  new BinancePriceHandler());
router.addRoute('messageType=crypto-ohlcv-data AND timeframe=1h', 
  new HourlyOHLCVHandler());
```

### 2. Dead Letter Queue Handling

```typescript
// lib/src/base/streaming/dlq-handler.ts
export class DeadLetterQueueHandler {
  async handleFailedMessage(
    originalMessage: MessageEnvelope<any>, 
    error: Error,
    attemptCount: number
  ): Promise<void> {
    const dlqMessage = {
      ...originalMessage,
      dlq: {
        originalTopic: originalMessage.messageType,
        error: error.message,
        attemptCount,
        failedAt: new Date(),
        retryable: this.isRetryableError(error)
      }
    };

    await this.publishToDLQ(dlqMessage);
    
    if (dlqMessage.dlq.retryable && attemptCount < 3) {
      await this.scheduleRetry(dlqMessage, attemptCount + 1);
    }
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR'
    ];
    
    return retryableErrors.some(errorType => 
      error.message.includes(errorType)
    );
  }
}
```

## Best Practices

### 1. Message Design Guidelines

```typescript
// Good: Clear, specific message structure
interface CryptoPriceData {
  coinId: string;          // Clear identifier
  exchangeId: string;      // Exchange context
  usdPrice: number;        // Specific price type
  timestamp: Date;         // Clear timing
}

// Bad: Vague, unclear structure
interface PriceMessage {
  id: string;              // What kind of ID?
  price: number;           // Price in what currency?
  time: string;            // What format?
  data: any;               // Unclear payload
}
```

### 2. Schema Validation Strategy

```typescript
// Validate early and often
class MessageProcessor {
  async processMessage(raw: Buffer): Promise<void> {
    // 1. Deserialize
    const envelope = this.deserialize(raw);
    
    // 2. Validate schema
    const validation = await this.validateSchema(envelope);
    if (!validation.isValid) {
      throw new SchemaValidationError(validation.errors);
    }
    
    // 3. Validate business rules
    const businessValidation = await this.validateBusinessRules(envelope.payload);
    if (!businessValidation.isValid) {
      throw new BusinessValidationError(businessValidation.errors);
    }
    
    // 4. Process
    await this.processValidMessage(envelope);
  }
}
```

### 3. Error Handling and Observability

```typescript
// Add tracing and metrics to messages
interface MessageEnvelope<T> {
  // ... existing fields
  tracing: {
    traceId: string;       // Distributed tracing
    spanId: string;        // Current span
    correlationId: string; // Business correlation
  };
  metrics: {
    producedAt: Date;      // Production timestamp
    processingStarted?: Date; // Processing start
    processingCompleted?: Date; // Processing end
  };
}
```

This comprehensive guide provides the foundation for robust message schema design in the QiCore streaming platform.