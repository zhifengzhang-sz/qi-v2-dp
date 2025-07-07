# Abstract Module Documentation

The `abstract` module provides the unified DSL (Domain Specific Language) foundation for the QiCore Data Platform. It implements the plugin pattern where abstract base classes handle DSL interfaces and workflow management, while concrete classes only implement specific plugins.

## Overview

The abstract module is the core of the unified architecture, providing:

- **Unified DSL Interfaces**: Consistent APIs across all data sources and targets
- **Plugin Pattern**: Separation of workflow (abstract) from implementation (concrete)
- **Functional Error Handling**: Using `Result<T>` patterns with qicore
- **Actor Lifecycle Management**: Standardized initialization and cleanup
- **Multi-Client Support**: Both composition and inheritance patterns

## Architecture Diagram

```
abstract/
├── dsl/                    # DSL Interface Definitions
│   ├── MarketDataTypes.ts     # Independent data types
│   ├── MarketDataReadingDSL.ts # Reading interface contract
│   ├── MarketDataWritingDSL.ts # Writing interface contract
│   └── index.ts               # Unified exports
├── readers/                # Reader Foundation
│   └── BaseReader.ts          # Abstract reader with workflow
└── writers/                # Writer Foundation
    └── BaseWriter.ts          # Abstract writer with workflow
```

## Core Components

### 1. DSL Interface Definitions (`dsl/`)

#### MarketDataTypes.ts
Independent data class definitions used by both readers and writers. Eliminates circular dependencies.

**Key Types:**
- `CryptoPriceData`: Real-time price information
- `CryptoOHLCVData`: OHLCV candlestick data  
- `CryptoMarketAnalytics`: Market-wide statistics
- `Level1Data`: Order book level 1 data

```typescript
export interface CryptoPriceData {
  coinId: string;
  symbol: string;
  name?: string;
  usdPrice: number;
  btcPrice?: number;
  ethPrice?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  lastUpdated: Date;
  source: string;
  attribution: string;
}
```

#### MarketDataReadingDSL.ts
Defines the contract for all data reading operations.

**Core Functions:**
- `getCurrentPrice(coinId, vsCurrency)`: Get single price
- `getCurrentPrices(coinIds, options)`: Get multiple prices
- `getCurrentOHLCV(coinId)`: Get current OHLCV data
- `getLatestOHLCV(coinId, count, interval)`: Get historical OHLCV
- `getMarketAnalytics()`: Get market-wide analytics
- `getAvailableTickers(limit)`: Get available tickers
- `getLevel1Data(query)`: Get order book data

#### MarketDataWritingDSL.ts
Defines the contract for all data writing operations.

**Core Functions:**
- `publishPrice(data, options)`: Publish single price
- `publishPrices(data, options)`: Publish multiple prices
- `publishOHLCV(data, options)`: Publish OHLCV data
- `publishOHLCVBatch(data, options)`: Publish OHLCV batch
- `publishAnalytics(data, options)`: Publish analytics
- `publishLevel1(data, options)`: Publish level 1 data
- `flush(timeoutMs)`: Flush pending messages
- `createDestination(name, config)`: Create topics/tables
- `getPublishingMetrics()`: Get performance metrics

### 2. BaseReader Foundation (`readers/`)

#### BaseReader.ts
Abstract base class that implements the reading DSL using the workflow pattern.

**Key Features:**
- **DSL Implementation**: All DSL methods implemented using workflow pattern
- **Plugin Architecture**: Concrete classes only implement plugins
- **Client Management**: Support for ≥0 MCP/API clients via composition
- **Error Handling**: Functional error handling with `Result<T>`
- **Activity Tracking**: Query counting and performance metrics

**Workflow Pattern:**
```typescript
async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
  return this.workflow(
    () => this.getCurrentPricePlugin(coinId, vsCurrency),
    (data) => this.transformCurrentPrice(data),
    "PRICE_FETCH_ERROR",
    (data) => this.validateCurrentPrice(data),
  );
}

// Concrete classes implement only this:
protected abstract getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any>;
protected abstract transformCurrentPrice(data: any): number;
```

**Client Patterns Supported:**
- **Actor Pattern (Composition)**: Associate with ≥0 MCP clients
- **MCP Actor Pattern (Inheritance)**: IS an MCP client directly

### 3. BaseWriter Foundation (`writers/`)

#### BaseWriter.ts  
Abstract base class that implements the writing DSL using the workflow pattern.

**Key Features:**
- **DSL Implementation**: All DSL methods implemented using workflow pattern
- **Plugin Architecture**: Concrete classes only implement plugins
- **Multi-Destination**: Support for multiple targets (Kafka, DB, Files, APIs)
- **Batch Operations**: Efficient batch publishing with metrics
- **Client Management**: Universal client association management

**Workflow Pattern:**
```typescript
async publishPrice(data: CryptoPriceData, options?: PublishOptions): Promise<Result<PublishResult>> {
  return this.workflow(
    () => this.publishPricePlugin(data, options),
    (result) => this.transformPublishResult(result),
    "PRICE_PUBLISH_ERROR", 
    (result) => this.validatePublishResult(result),
  );
}

// Concrete classes implement only this:
protected abstract publishPricePlugin(data: CryptoPriceData, options?: PublishOptions): Promise<any>;
protected abstract transformPublishResult(data: any): PublishResult;
```

## Key Design Principles

### 1. Plugin Pattern Implementation
- **Abstract classes**: Handle DSL interface + workflow complexity
- **Concrete classes**: Implement only plugins for specific technologies
- **Separation of concerns**: Workflow logic separate from implementation

### 2. Unified DSL Abstraction
- **Same interface**: All sources/targets use identical DSL
- **Technology agnostic**: Works with MCP, Kafka, databases, APIs, files
- **Functional error handling**: Consistent `Result<T>` patterns

### 3. Client Management Flexibility
- **Zero clients**: Local files, memory, calculations
- **Single client**: MCP server, database connection, API
- **Multiple clients**: Multi-destination publishing, failover

### 4. Actor Lifecycle
- **Initialization**: `initialize()` - setup resources, connections
- **Operation**: DSL method calls with automatic workflow
- **Cleanup**: `cleanup()` - release resources, close connections
- **Status**: `getStatus()` - health and performance metrics

## Usage Examples

### Creating a Source Actor
```typescript
// Concrete implementation only needs plugins
class MyAPIReader extends BaseReader {
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // API-specific implementation
    return this.apiClient.getPrice(coinId, vsCurrency);
  }
  
  protected transformCurrentPrice(data: any): number {
    // API-specific data transformation
    return data.price;
  }
  
  // BaseReader handles all other DSL methods + workflow
}
```

### Creating a Target Actor
```typescript
// Concrete implementation only needs plugins  
class MyDatabaseWriter extends BaseWriter {
  protected async publishPricePlugin(data: CryptoPriceData, options?: PublishOptions): Promise<any> {
    // Database-specific implementation
    return this.dbClient.insert('prices', data);
  }
  
  protected transformPublishResult(data: any): PublishResult {
    // Database-specific result transformation
    return { messageId: data.id, topic: 'prices', ... };
  }
  
  // BaseWriter handles all other DSL methods + workflow
}
```

## Benefits

### For Developers
- **Consistent APIs**: Same DSL across all data sources and targets
- **Reduced boilerplate**: Only implement plugins, not full DSL
- **Type safety**: Full TypeScript support with strict typing
- **Error handling**: Automatic functional error handling

### For Architecture
- **Composability**: Mix and match sources and targets easily
- **Testability**: Plugin methods are simple to unit test
- **Scalability**: Add new sources/targets without changing core logic
- **Maintainability**: Centralized workflow logic in abstract classes

### For Operations
- **Observability**: Built-in metrics and status reporting
- **Reliability**: Consistent error handling and lifecycle management
- **Performance**: Efficient batch operations and connection management
- **Flexibility**: Support for various deployment patterns

## Integration with Sources and Targets

The abstract module serves as the foundation for all concrete implementations:

- **Sources** (`lib/src/sources/`): Extend `BaseReader`
  - CoinGecko: API-based market data reader
  - Redpanda: Stream-based market data reader

- **Targets** (`lib/src/targets/`): Extend `BaseWriter`  
  - Redpanda: Stream-based market data writer
  - TimescaleDB: Database-based market data writer

This architecture ensures that adding new data sources or targets requires minimal code while maintaining full compatibility with the unified DSL.