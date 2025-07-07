# Layer 2: DSL Actor Architecture

## Overview

Layer 2 provides the **DSL (Domain Specific Language) layer** that implements unified interfaces for cryptocurrency data operations. This layer builds on Layer 1 base infrastructure and provides technology-agnostic actors for data acquisition and publishing.

## Layer 2 Architecture

Layer 2 consists of three main components:
- **Abstract DSL Foundation** (`lib/src/abstract/`)
- **Sources** (`lib/src/sources/`) - Data input actors
- **Targets** (`lib/src/targets/`) - Data output actors

### Abstract DSL Foundation (`lib/src/abstract/`)

The foundational layer provides core abstractions and unified interfaces for all data operations.

#### Core Components

**1. DSL Interfaces (`dsl/`)**
```typescript
// MarketDataReadingDSL.ts - Unified reading interface
interface MarketDataReadingDSL {
  getCurrentPrice(coinId: string, vsCurrency?: string): Promise<Result<number>>;
  getCurrentPrices(coinIds: string[], options?: CurrentPricesOptions): Promise<Result<CryptoPriceData[]>>;
  getCurrentOHLCV(coinId: string, interval?: string): Promise<Result<CryptoOHLCVData>>;
  getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>>;
  // ... complete financial data acquisition interface
}

// MarketDataWritingDSL.ts - Unified writing interface  
interface MarketDataWritingDSL {
  publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>>;
  publishPrices(data: CryptoPriceData[]): Promise<Result<BatchPublishResult>>;
  publishOHLCV(data: CryptoOHLCVData): Promise<Result<PublishResult>>;
  // ... complete data publishing interface
}
```

**2. Data Types (`dsl/MarketDataTypes.ts`)**
```typescript
// Independent, reusable data structures
interface CryptoPriceData {
  coinId: string;
  symbol: string;
  usdPrice: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: Date;
  source: string;
  attribution: string;
}

interface CryptoOHLCVData {
  coinId: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  source: string;
  attribution: string;
}
```

**3. Abstract Base Classes**
```typescript
// BaseReader.ts - Implements DSL + workflow abstraction
abstract class BaseReader implements MarketDataReadingDSL {
  // Unified workflow implementation
  protected async workflow<TResult>(
    pluginFn: () => Promise<any>,
    transform: (data: any) => TResult,
    errorCode: string,
    validator?: (data: any) => boolean,
  ): Promise<Result<TResult>>

  // Plugin contract for concrete implementations
  protected abstract getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any>;
  protected abstract transformCurrentPrice(data: any): number;
}

// BaseWriter.ts - Implements publishing DSL + workflow
abstract class BaseWriter implements MarketDataWritingDSL {
  // Similar workflow pattern for data publishing
}
```

#### Abstract Layer Responsibilities

- **DSL Definition**: Standardized interfaces for all data operations
- **Workflow Abstraction**: Common patterns captured once, reused everywhere
- **Type Safety**: Unified data models with complete TypeScript support
- **Error Handling**: Functional Result<T> pattern with QiError integration
- **Client Management**: Universal client association patterns
- **Validation Framework**: Extensible data validation system

### Sources (Data Readers) (`lib/src/sources/`)

Technology-specific implementations that inherit DSL functionality and implement only the unique integration logic for data acquisition.

#### CoinGecko Source (`sources/coingecko/`)
```typescript
class CoinGeckoMarketDataReader extends BaseReader {
  // Only implements technology-specific plugins
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

  // Inherits ALL DSL methods from BaseReader
  // Zero DSL implementation code required
}
```

#### Redpanda Source (`sources/redpanda/`)
```typescript
class RedpandaMarketDataReader extends BaseReader {
  // Implements plugins for Kafka/Redpanda streaming
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.redpandaClient.consume({
      topic: "crypto-prices",
      filter: { coinId, vsCurrency }
    });
  }

  // Different technology, same DSL interface
}
```

### Targets (Data Writers) (`lib/src/targets/`)

Technology-specific implementations for data publishing to external systems.

#### TimescaleDB Target (`targets/timescale/`)
```typescript
class TimescaleMarketDataWriter extends BaseWriter {
  protected async publishPricePlugin(data: CryptoPriceData): Promise<any> {
    return this.timescaleClient.query(`
      INSERT INTO crypto_prices (coin_id, symbol, usd_price, market_cap, timestamp, source)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [data.coinId, data.symbol, data.usdPrice, data.marketCap, data.lastUpdated, data.source]);
  }

  // Inherits ALL publishing DSL methods
}
```

#### Redpanda Target (`targets/redpanda/`)
```typescript
class RedpandaMarketDataWriter extends BaseWriter {
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
}
```

## Inter-Component Relationships

### Inheritance Pattern
```
Abstract Base Classes (BaseReader/BaseWriter)
    ↓ (extends)
Concrete Sources/Targets (CoinGeckoReader, TimescaleWriter, etc.)
    ↓ (implements plugins only)
Complete DSL Functionality
```

### Plugin Architecture
```
DSL Method Call → BaseReader.workflow() → Concrete.plugin() → Transform → Validate → Result<T>
```

### Data Flow
```
External Source → Source Plugin → Abstract Transform → Unified Types → Target Plugin → External Target
```

## MCP Integration Architecture

### MCP Client Technique

Layer 2 uses **Model Context Protocol (MCP)** clients for standardized integration with external AI-powered data sources.

#### Direct MCP Integration Pattern
```typescript
class CoinGeckoMarketDataReader extends BaseReader {
  private mcpClient: Client;

  constructor(config: CoinGeckoActorConfig) {
    super(config);
    
    // Direct MCP client creation
    this.mcpClient = new Client({
      name: config.name,
      version: "1.0.0"
    }, { capabilities: {} });
  }

  async initialize(): Promise<Result<void>> {
    // Connect to external MCP server
    const transport = new SSEClientTransport(
      new URL("https://mcp.api.coingecko.com/sse")
    );
    await this.mcpClient.connect(transport);
    
    // Register with BaseReader's client management
    this.addClient("coingecko-mcp", this.mcpClient, {
      name: "coingecko-mcp", 
      type: "data-source"
    });
  }

  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // Use MCP tool calling
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency }
    });
  }
}
```

#### MCP Integration Benefits

1. **Standardized Protocol**: Consistent interface for AI-powered data sources
2. **Real-time Data**: Live connections to external servers via SSE transport
3. **Tool Calling**: Structured API interactions through MCP tool interface
4. **Type Safety**: MCP responses integrated with Result<T> error handling
5. **Connection Management**: Unified client lifecycle through BaseReader

#### External MCP Servers

- **CoinGecko MCP Server**: `https://mcp.api.coingecko.com/sse`
  - Provides real-time cryptocurrency market data
  - Tools: `get_coins_markets`, `get_global`, `get_range_coins_ohlc`
  - Live data: Bitcoin $109,426, Market Cap $3.45T

## Layer 2 Architecture Principles

### 1. Plugin Pattern Implementation
- **Abstract Classes**: Provide workflow + DSL interface
- **Concrete Classes**: Implement only technology-specific plugins
- **Zero Repetition**: Common patterns captured once in base classes

### 2. Technology Agnostic Design
- **Unified Interface**: Same DSL regardless of underlying technology
- **Swappable Implementations**: Easy to switch between data sources/targets
- **Future-Proof**: New technologies integrate via same plugin pattern

### 3. Functional Error Handling
- **Result<T> Pattern**: fp-ts Either<QiError, T> throughout the system
- **Composable Operations**: Chain operations without exception handling
- **Type Safety**: Compile-time guarantees for error scenarios

### 4. Layer 1 Integration
- **Base Infrastructure**: Uses Layer 1 database and streaming clients
- **Performance**: Direct access to optimized Layer 1 components
- **Consistency**: Maintains Layer 1 error handling and configuration patterns

## Usage Examples

### Factory Pattern
```typescript
// Create actors using factory functions
const coinGeckoSource = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  debug: true,
  useRemoteServer: true,
  timeout: 30000
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
// Layer 2 Actor Composition
const pipeline = {
  source: coinGeckoSource,
  streaming: createRedpandaMarketDataWriter({...}), 
  database: timescaleTarget
};

// Data flows through unified DSL
const prices = await pipeline.source.getCurrentPrices(["bitcoin", "ethereum"]);
if (isSuccess(prices)) {
  const priceData = getData(prices);
  await Promise.all([
    pipeline.streaming.publishPrices(priceData),
    pipeline.database.publishPrices(priceData)
  ]);
}
```

## Foundation for Layer 3

Layer 2 provides the **foundation for Layer 3 Service Layer**, where we will build **MCP servers** using Layer 2 actors.

### Layer 3 Vision
```typescript
// Future: MCP Server built on Layer 2 actors
class CryptoDataMCPServer extends MCPServer {
  constructor() {
    // Compose Layer 2 actors
    this.coinGeckoSource = createCoinGeckoMarketDataReader({...});
    this.timescaleTarget = createTimescaleMarketDataWriter({...});
  }

  // Expose Layer 2 functionality as MCP tools
  async handleToolCall(toolName: string, args: any): Promise<MCPResponse> {
    switch (toolName) {
      case "get_crypto_price":
        return this.coinGeckoSource.getCurrentPrice(args.coinId);
      case "store_crypto_data": 
        return this.timescaleTarget.publishPrice(args.data);
    }
  }
}
```

---

**Layer 2 Principle**: Provide unified DSL interfaces that eliminate implementation repetition while maintaining complete flexibility for technology-specific optimizations.