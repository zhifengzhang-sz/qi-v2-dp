# Sources Module Documentation

The `sources` module contains all data source actors that read/consume data from external systems. These actors extend the `BaseReader` foundation and implement the unified DSL for data acquisition.

## Overview

Sources are **where data comes FROM**. They implement the MarketDataReadingDSL interface and provide consistent APIs for data acquisition regardless of the underlying technology.

Current sources:
- **CoinGecko**: REST API-based cryptocurrency market data
- **Redpanda**: Stream-based real-time data consumption

## Architecture Diagram

```
sources/
├── coingecko/              # CoinGecko API Source
│   ├── MarketDataReader.ts       # Actor pattern (composition)
│   ├── MarketDataReaderWithMCP.ts # MCP Actor pattern (inheritance)
│   └── index.ts                  # Exports and utilities
└── redpanda/               # Redpanda Streaming Source  
    ├── MarketDataReader.ts       # Stream consumer actor
    └── index.ts                  # Exports and utilities
```

## Design Philosophy

### Plugin Pattern Implementation
Each source actor:
1. **Extends BaseReader**: Gets full DSL implementation + workflow
2. **Implements only plugins**: Technology-specific data fetching
3. **Transforms data**: Converts to unified DSL data types
4. **Zero DSL code**: All DSL complexity handled by BaseReader

### Actor Pattern Support
Sources support both actor patterns:
- **Actor Pattern (Composition)**: Can associate with ≥0 MCP clients
- **MCP Actor Pattern (Inheritance)**: IS an MCP client directly

## Core Components

### 1. CoinGecko Source (`coingecko/`)

#### MarketDataReader.ts (Actor Pattern)
CoinGecko market data reader using composition pattern with MCP client association.

**Key Features:**
- **MCP Integration**: Associates with CoinGecko MCP server via composition
- **API Fallback**: Falls back to direct API calls if MCP unavailable
- **Rate Limiting**: Respects CoinGecko API rate limits
- **Error Recovery**: Robust error handling with fallback strategies

**Plugin Implementation:**
```typescript
class CoinGeckoMarketDataReader extends BaseReader {
  // Only implement plugins - BaseReader handles all DSL methods
  
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // CoinGecko-specific MCP call
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 }
    });
  }
  
  protected transformCurrentPrice(data: any): number {
    // Extract price from CoinGecko MCP response
    const extracted = this.extractMCPData(data) as any[];
    return extracted[0]?.current_price || 0;
  }
  
  // BaseReader handles workflow: validation, error handling, Result<T> wrapping
}
```

**Configuration:**
```typescript
interface CoinGeckoActorConfig {
  name: string;
  debug?: boolean;
  useRemoteServer?: boolean;
  environment?: "pro" | "demo" | "free";
  timeout?: number;
  rateLimit?: number;
}
```

#### MarketDataReaderWithMCP.ts (MCP Actor Pattern)  
CoinGecko market data reader using inheritance pattern - IS an MCP client.

**Key Features:**
- **Direct MCP Inheritance**: Extends MCP SDK Client directly
- **Simplified Integration**: No composition overhead
- **Transport Flexibility**: SSE or stdio transport support
- **Type Safety**: Full TypeScript MCP integration

**Implementation Pattern:**
```typescript
class CoinGeckoMarketDataReaderWithMCP {
  private mcpClient: Client;
  
  // MCP Client functionality via composition
  async callTool(request: { name: string; arguments: any }): Promise<any> {
    return await this.mcpClient.callTool(request);
  }
  
  // DSL methods implemented directly (simplified pattern)
  async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
    try {
      const result = await this.callTool({
        name: "get_coins_markets",
        arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 }
      });
      
      const data = this.extractMCPData(result);
      return success(data[0]?.current_price || 0);
    } catch (error) {
      return failure(createQiError("PRICE_FETCH_ERROR", error.message, "SYSTEM"));
    }
  }
}
```

#### CoinGecko Data Transformations
Converts CoinGecko API responses to unified DSL data types:

**Price Data Transformation:**
```typescript
protected transformCurrentPrices(data: any): CryptoPriceData[] {
  return data.map((coin: any) => ({
    coinId: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    usdPrice: coin.current_price,
    btcPrice: coin.current_price / (coin.market_data?.current_price?.btc || 1),
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    change24h: coin.price_change_percentage_24h,
    change7d: coin.price_change_percentage_7d_in_currency,
    lastUpdated: new Date(),
    source: "coingecko-mcp",
    attribution: "Data provided by CoinGecko API via MCP"
  }));
}
```

**OHLCV Data Transformation:**
```typescript
protected transformCurrentOHLCV(coinId: string, data: any): CryptoOHLCVData {
  const extracted = this.extractMCPData(data) as Array<[number, number, number, number, number]>;
  const latest = extracted[extracted.length - 1];
  const [timestamp, open, high, low, close] = latest;

  return {
    coinId,
    timestamp: new Date(timestamp),
    open,
    high,
    low,
    close,
    volume: 0, // CoinGecko OHLC doesn't include volume
    timeframe: "daily",
    source: "coingecko-mcp",
    attribution: "Data provided by CoinGecko API via MCP"
  };
}
```

### 2. Redpanda Source (`redpanda/`)

#### MarketDataReader.ts (Stream Consumer)
Redpanda market data reader for consuming real-time cryptocurrency data streams.

**Key Features:**
- **Real-time Consumption**: Continuous stream processing
- **Multiple Topics**: Supports prices, OHLCV, analytics, level1 data
- **Consumer Groups**: Scalable consumer group management
- **Offset Management**: Automatic or manual offset control
- **Message Filtering**: Topic-based and content-based filtering

**Plugin Implementation:**
```typescript
class RedpandaMarketDataReader extends BaseReader {
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    const topic = this.config.topics?.prices || "crypto-prices";
    
    // Wait for matching message from stream
    return new Promise((resolve, reject) => {
      this.redpandaClient.consumeMessages([topic], this.config.groupId, async (message) => {
        try {
          const data = this.parseMessage(message) as CryptoPriceData;
          if (data.coinId === coinId) {
            resolve(data);
          }
        } catch (error) {
          // Skip invalid messages, continue consuming
        }
      }).catch(reject);
      
      // Timeout after configured duration
      setTimeout(() => reject(new Error("Stream timeout")), this.config.timeout);
    });
  }
  
  protected transformCurrentPrice(data: any): number {
    // Data already in correct format from stream
    return data.usdPrice;
  }
}
```

**Configuration:**
```typescript
interface RedpandaReaderConfig {
  name: string;
  brokers: string[];
  groupId: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  timeout?: number;
  debug?: boolean;
  autoCommit?: boolean;
  startFromBeginning?: boolean;
}
```

**Message Processing:**
```typescript
private parseMessage(message: ConsumerMessage): CryptoPriceData | CryptoOHLCVData | CryptoMarketAnalytics {
  try {
    const data = JSON.parse(message.value.toString());
    
    // Validate message structure
    if (!data.coinId && !data.timestamp) {
      throw new Error("Invalid message format");
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse message: ${error.message}`);
  }
}
```

## Usage Examples

### CoinGecko Source Usage
```typescript
// Create and initialize CoinGecko source
const coinGeckoSource = createCoinGeckoMarketDataReader({
  name: "main-coingecko-source",
  debug: true,
  useRemoteServer: true,
  environment: "free"
});

await coinGeckoSource.initialize();

// Use unified DSL - same across all sources
const priceResult = await coinGeckoSource.getCurrentPrice("bitcoin", "usd");
if (priceResult.success) {
  console.log(`Bitcoin: $${priceResult.data}`);
}

const pricesResult = await coinGeckoSource.getCurrentPrices(
  ["bitcoin", "ethereum", "cardano"],
  { vsCurrency: "usd", includeMarketCap: true }
);

const analyticsResult = await coinGeckoSource.getMarketAnalytics();
```

### Redpanda Source Usage
```typescript
// Create and initialize Redpanda source
const redpandaSource = createRedpandaMarketDataReader({
  name: "main-redpanda-source", 
  brokers: ["localhost:9092"],
  groupId: "crypto-processors",
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  },
  timeout: 5000
});

await redpandaSource.initialize();

// Same DSL as CoinGecko - unified interface
const streamPriceResult = await redpandaSource.getCurrentPrice("bitcoin", "usd");
if (streamPriceResult.success) {
  console.log(`Bitcoin from stream: $${streamPriceResult.data}`);
}

// Real-time OHLCV from stream
const streamOHLCVResult = await redpandaSource.getCurrentOHLCV("bitcoin");
```

## Data Flow Patterns

### Pull-based (CoinGecko)
```
API Request → CoinGecko API → Response → Transform → DSL Result
```

### Push-based (Redpanda)
```
Stream Message → Topic → Consumer → Filter → Transform → DSL Result
```

### Hybrid Pipeline
```
CoinGecko Source → Transform → Redpanda Target → Redpanda Source → TimescaleDB Target
```

## Error Handling Patterns

### CoinGecko Error Handling
```typescript
// Rate limiting
if (error.message.includes("rate limit")) {
  await this.backoff();
  return this.retry(operation);
}

// API downtime fallback
if (error.message.includes("503")) {
  return this.fallbackToCache();
}

// MCP server issues
if (error.message.includes("MCP")) {
  return this.fallbackToDirectAPI();
}
```

### Redpanda Error Handling
```typescript
// Connection failures
if (error.message.includes("ECONNREFUSED")) {
  await this.reconnectWithBackoff();
}

// Consumer lag
if (this.getConsumerLag() > threshold) {
  await this.scaleConsumers();
}

// Message parsing errors
if (error instanceof SyntaxError) {
  this.skipMessage();
  this.incrementErrorCount();
}
```

## Performance Characteristics

### CoinGecko Source
- **Throughput**: Limited by API rate limits (50 requests/minute free tier)
- **Latency**: 200-500ms API response time
- **Reliability**: High availability, but rate limited
- **Cost**: Free tier available, paid tiers for higher limits

### Redpanda Source  
- **Throughput**: 1M+ messages/second per topic
- **Latency**: Sub-millisecond end-to-end
- **Reliability**: High availability with replication
- **Cost**: Self-hosted infrastructure costs

## Monitoring and Observability

### Source Metrics
All sources provide standardized metrics:

```typescript
interface SourceStatus {
  isInitialized: boolean;
  isConnected: boolean;
  totalQueries: number;
  errorCount: number;
  lastActivity?: Date;
  averageLatency: number;
  successRate: number;
}
```

### CoinGecko Specific Metrics
- API rate limit remaining
- MCP server connection status
- Fallback usage statistics

### Redpanda Specific Metrics
- Consumer lag per partition
- Message processing rate
- Topic subscription status

## Testing Strategies

### Unit Testing
```typescript
// Mock the plugin methods for testing
class MockCoinGeckoReader extends CoinGeckoMarketDataReader {
  protected async getCurrentPricePlugin(): Promise<any> {
    return mockApiResponse;
  }
}

// Test DSL behavior with mocked plugins
const reader = new MockCoinGeckoReader(config);
const result = await reader.getCurrentPrice("bitcoin");
expect(result.success).toBe(true);
```

### Integration Testing
```typescript
// Test with real external systems
const reader = new CoinGeckoMarketDataReader(config);
await reader.initialize();

const result = await reader.getCurrentPrice("bitcoin");
expect(result.success).toBe(true);
expect(result.data).toBeGreaterThan(0);
```

The sources module demonstrates how the unified DSL abstraction enables consistent data acquisition across completely different technologies (REST APIs vs streaming) while maintaining type safety and error handling throughout.