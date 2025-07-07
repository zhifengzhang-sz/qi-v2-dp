# QiCore Data Platform Architecture

## Overview

The QiCore Data Platform implements a **2-layer actor system** designed for building scalable, type-safe data processing pipelines. This architecture provides a clean separation of concerns while maintaining maximum flexibility for different data source and target integrations.

## Architecture Layers

### Layer 1: Base Foundation (`lib/src/abstract/`)

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

#### Layer 1 Responsibilities

- **DSL Definition**: Standardized interfaces for all data operations
- **Workflow Abstraction**: Common patterns captured once, reused everywhere
- **Type Safety**: Unified data models with complete TypeScript support
- **Error Handling**: Functional Result<T> pattern with QiError integration
- **Client Management**: Universal client association patterns
- **Validation Framework**: Extensible data validation system

### Layer 2: Concrete Actors (`lib/src/sources/`, `lib/src/targets/`)

Technology-specific implementations that inherit DSL functionality and implement only the unique integration logic.

#### Sources (Data Readers)

**CoinGecko Source (`sources/coingecko/`)**
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

**Redpanda Source (`sources/redpanda/`)**
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

#### Targets (Data Writers)

**TimescaleDB Target (`targets/timescale/`)**
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

#### Layer 2 Responsibilities

- **Technology Integration**: Implement only the unique technology-specific logic
- **Data Transformation**: Convert between external formats and unified types
- **Connection Management**: Handle technology-specific client connections
- **Plugin Implementation**: Provide concrete implementations of abstract plugin methods
- **Validation Overrides**: Customize validation for specific data source formats

## Inter-Layer Relationships

### Inheritance Pattern
```
Layer 1 (BaseReader/BaseWriter)
    ↓ (extends)
Layer 2 (CoinGeckoReader, TimescaleWriter, etc.)
    ↓ (implements plugins only)
Complete DSL Functionality
```

### Plugin Architecture
```
DSL Method Call → BaseReader.workflow() → Concrete.plugin() → Transform → Validate → Result<T>
```

### Data Flow
```
External Source → Layer 2 Plugin → Layer 1 Transform → Unified Types → Layer 2 Target Plugin → External Target
```

## MCP Integration Architecture

### MCP Client Technique

The platform uses **Model Context Protocol (MCP)** clients for standardized integration with external AI-powered data sources.

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

## Foundation for Layer 3: Service Layer

### Planned Service Layer (`lib/src/services/`)

The current 2-layer architecture provides the **foundation for Layer 3**, where we will build **MCP servers** using Layer 2 actors.

#### Layer 3 Vision
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

#### Service Layer Benefits

1. **Actor Composition**: Combine multiple Layer 2 actors into services
2. **MCP Server Creation**: Expose internal functionality as external MCP servers
3. **Business Logic**: Implement complex workflows using actor pipelines
4. **API Gateway**: Unified interface for external MCP client consumption
5. **Scalable Services**: Deploy actors as independent microservices

## Key Architectural Principles

### 1. Plugin Pattern Implementation
- **Layer 1**: Provides workflow + DSL interface
- **Layer 2**: Implements only technology-specific plugins
- **Zero Repetition**: Common patterns captured once in base classes

### 2. Technology Agnostic Design
- **Unified Interface**: Same DSL regardless of underlying technology
- **Swappable Implementations**: Easy to switch between data sources/targets
- **Future-Proof**: New technologies integrate via same plugin pattern

### 3. Functional Error Handling
- **Result<T> Pattern**: fp-ts Either<QiError, T> throughout the system
- **Composable Operations**: Chain operations without exception handling
- **Type Safety**: Compile-time guarantees for error scenarios

### 4. Scalable Architecture
- **Actor Composition**: Build complex systems from simple actors
- **Microservice Ready**: Each actor can run independently
- **Performance Optimized**: Bun runtime, TimescaleDB, ClickHouse integration

## Example: Complete Pipeline

```typescript
// Layer 2 Actor Composition (Current)
const pipeline = {
  source: createCoinGeckoMarketDataReader({...}),
  streaming: createRedpandaMarketDataWriter({...}), 
  database: createTimescaleMarketDataWriter({...})
};

// Data flows through unified DSL
const prices = await pipeline.source.getCurrentPrices(["bitcoin", "ethereum"]);
await pipeline.streaming.publishPrices(prices.data);
await pipeline.database.publishPrices(prices.data);

// Layer 3 Service (Future)
const mcpServer = new CryptoDataMCPServer([
  pipeline.source,
  pipeline.streaming, 
  pipeline.database
]);
```

This architecture provides a **clean, scalable foundation** for building sophisticated data processing systems while maintaining simplicity and type safety at every layer.