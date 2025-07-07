# Layer 2: Sources - Data Input Actors

## Overview

Sources are **where data comes FROM**. They implement the MarketDataReadingDSL interface by extending BaseReader and provide technology-specific plugins for data acquisition from external systems.

## Architecture

Sources in Layer 2:
- **Extend BaseReader**: Inherit complete DSL implementation and workflow
- **Implement plugins only**: Technology-specific data fetching and transformation
- **Support multiple patterns**: MCP integration, direct APIs, streaming consumption
- **Zero DSL code**: All cryptocurrency data operations inherited automatically

## Current Implementations

### CoinGecko Source (`sources/coingecko/`)

#### External MCP Integration Pattern
```
CoinGecko Source → External MCP Server → CoinGecko API → Live Cryptocurrency Data
```

**Key Features:**
- **External MCP Server**: Connects to `https://mcp.api.coingecko.com/sse`
- **Real-time Data**: Live Bitcoin prices, market analytics, OHLCV data
- **SSE Transport**: Server-sent events for real-time updates
- **46 Available Tools**: Complete CoinGecko API coverage via MCP

**Implementation Pattern:**
```typescript
class CoinGeckoMarketDataReader extends BaseReader {
  private mcpClient: Client;

  async initialize(): Promise<Result<void>> {
    // Direct MCP client creation
    this.mcpClient = new Client({
      name: this.config.name,
      version: "1.0.0"
    }, { capabilities: {} });

    // Connect to external MCP server
    const transport = new SSEClientTransport(
      new URL("https://mcp.api.coingecko.com/sse")
    );
    await this.mcpClient.connect(transport);

    // Register with BaseReader client management
    this.addClient("coingecko-mcp", this.mcpClient, {
      name: "coingecko-mcp",
      type: "data-source"
    });
  }

  // Plugin implementations - technology-specific only
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 }
    });
  }

  protected transformCurrentPrice(data: any): number {
    const extracted = this.extractMCPData(data);
    return extracted[0].current_price;
  }

  // ALL DSL methods available automatically:
  // getCurrentPrice(), getCurrentPrices(), getMarketAnalytics(), etc.
}
```

**Available DSL Operations:**
- `getCurrentPrice(coinId, vsCurrency)`: Single cryptocurrency price
- `getCurrentPrices(coinIds, options)`: Multiple cryptocurrency prices  
- `getMarketAnalytics()`: Global market statistics
- `getCurrentOHLCV(coinId, interval)`: OHLCV candle data
- `getLatestOHLCV(coinId, count, interval)`: Multiple OHLCV candles
- `getAvailableTickers(limit)`: List of available cryptocurrencies

### Redpanda Source (`sources/redpanda/`)

#### Streaming Consumption Pattern
```
Redpanda Source → Kafka Topics → Real-time Message Stream → Parsed Data
```

**Key Features:**
- **Real-time Streaming**: Consumes from Kafka/Redpanda topics
- **Message Filtering**: Topic-based and content-based filtering
- **Batch Processing**: Efficient handling of high-throughput streams
- **Layer 1 Integration**: Uses `@qi/core/base/streaming/redpanda` infrastructure

**Implementation Pattern:**
```typescript
class RedpandaMarketDataReader extends BaseReader {
  private redpandaClient: RedpandaClient;

  async initialize(): Promise<Result<void>> {
    // Use Layer 1 streaming infrastructure
    this.redpandaClient = new RedpandaClient({
      brokers: this.config.brokers,
      groupId: this.config.groupId,
      topics: this.config.topics
    });

    await this.redpandaClient.connect();

    // Register with BaseReader client management
    this.addClient("redpanda-stream", this.redpandaClient, {
      name: "redpanda-stream",
      type: "data-source"
    });
  }

  // Plugin implementations for streaming data
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.redpandaClient.consume({
      topic: this.config.topics.prices,
      filter: { coinId, vsCurrency },
      maxMessages: 1
    });
  }

  protected transformCurrentPrice(data: any): number {
    const messages = data.messages;
    const latestMessage = messages[0];
    return JSON.parse(latestMessage.value).price;
  }

  // ALL DSL methods work with streaming data automatically
}
```

**Configuration:**
```typescript
interface RedpandaReaderConfig {
  name: string;
  brokers: string[];
  groupId: string;
  topics: {
    prices: string;
    ohlcv: string;
    analytics: string;
  };
  timeout?: number;
  debug?: boolean;
}
```

## Plugin Architecture Benefits

### 1. Zero DSL Implementation Required
```typescript
// ❌ DON'T implement DSL methods in source classes
class SomeSource extends BaseReader {
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    // ❌ This creates code duplication
  }
}

// ✅ DO implement plugins only
class SomeSource extends BaseReader {
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // ✅ Technology-specific data fetching only
  }
  
  protected transformCurrentPrice(data: any): number {
    // ✅ Data transformation only
  }
  
  // All DSL methods inherited automatically
}
```

### 2. Uniform Interface Across Technologies
```typescript
// Same interface for all sources regardless of technology
const coinGeckoPrice = await coinGeckoSource.getCurrentPrice("bitcoin");
const redpandaPrice = await redpandaSource.getCurrentPrice("bitcoin");
const futureAPIPrice = await futureAPISource.getCurrentPrice("bitcoin");

// All return Result<number> with same error handling
```

### 3. Easy Technology Migration
```typescript
// Switch data sources without changing client code
const dataSource = useExternalAPI 
  ? createCoinGeckoMarketDataReader(config)
  : createRedpandaMarketDataReader(config);

// Same DSL methods available regardless of choice
const price = await dataSource.getCurrentPrice("bitcoin");
```

## Data Transformation Pipeline

### Raw Data → Unified Types
```typescript
// Each source transforms technology-specific data to unified types
protected transformCurrentPrices(data: any): CryptoPriceData[] {
  return data.map((item: any) => ({
    coinId: item.id,                    // CoinGecko: 'id', Redpanda: 'symbol'
    symbol: item.symbol,                // Normalize field names
    name: item.name,
    usdPrice: item.current_price,       // Consistent numeric types
    marketCap: item.market_cap,
    volume24h: item.total_volume,
    change24h: item.price_change_percentage_24h,
    lastUpdated: new Date(),            // Consistent Date objects
    source: "coingecko-mcp",           // Source attribution
    attribution: "Data provided by CoinGecko API via MCP"
  }));
}
```

### Error Handling Integration
```typescript
// Each source handles technology-specific errors
protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
  if (!this.mcpClient) {
    throw new Error("MCP client not initialized");
  }
  
  try {
    return await this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency }
    });
  } catch (error) {
    // Technology-specific error handling
    if (error.code === 'RATE_LIMITED') {
      throw new Error(`CoinGecko rate limit: ${error.message}`);
    }
    throw error;
  }
}
```

## Client Management Integration

### Multiple Client Support
```typescript
// Sources can manage multiple clients if needed
async initialize(): Promise<Result<void>> {
  // Primary data client
  this.addClient("primary-api", this.apiClient, {
    name: "primary-api",
    type: "data-source"
  });
  
  // Backup data client
  this.addClient("backup-api", this.backupClient, {
    name: "backup-api", 
    type: "data-source"
  });
  
  // Cache client
  this.addClient("redis-cache", this.cacheClient, {
    name: "redis-cache",
    type: "cache"
  });
}
```

### Client Failover
```typescript
// BaseReader automatically handles client selection
protected getActiveClient(): any {
  // Try data-source clients first
  const dataSources = this.getClientsByType("data-source")
    .filter(assoc => assoc.isConnected);
  
  if (dataSources.length > 0) {
    return dataSources[0].client;  // Primary client
  }
  
  // Fallback to any connected client
  return this.getAllClients()
    .find(assoc => assoc.isConnected)?.client;
}
```

## Integration with Layer 1

### Database Integration
```typescript
// Sources can optionally cache data using Layer 1 database clients
protected async cachePrice(coinId: string, price: number): Promise<void> {
  const dbClient = this.getClient("database");
  if (dbClient?.isConnected) {
    await dbClient.client.insertPrice({
      coinId,
      price,
      timestamp: new Date()
    });
  }
}
```

### Streaming Integration
```typescript
// Sources can publish to Layer 1 streaming infrastructure
protected async publishToStream(data: CryptoPriceData): Promise<void> {
  const streamClient = this.getClient("stream-publisher");
  if (streamClient?.isConnected) {
    await streamClient.client.produce("crypto-prices", data);
  }
}
```

## Usage Examples

### Factory Pattern
```typescript
// Create sources using factory functions
const coinGeckoSource = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  debug: true,
  useRemoteServer: true,
  timeout: 30000
});

const redpandaSource = createRedpandaMarketDataReader({
  name: "redpanda-reader",
  brokers: ["localhost:9092"],
  groupId: "crypto-consumers",
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  }
});
```

### Pipeline Integration
```typescript
// Sources as part of data pipelines
const pipeline = {
  source: coinGeckoSource,
  target: redpandaTarget
};

// Get data from source
const prices = await pipeline.source.getCurrentPrices(["bitcoin", "ethereum"]);

// Send to target
if (isSuccess(prices)) {
  await pipeline.target.publishPrices(getData(prices));
}
```

---

**Sources Principle**: Implement technology-specific data acquisition plugins while inheriting unified DSL operations that work consistently across all data sources.