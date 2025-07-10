# Layer 2: Abstract DSL Foundation

## Overview

The `abstract` component of Layer 2 provides the DSL (Domain Specific Language) foundation for all cryptocurrency data operations. This includes unified interfaces, data types, and workflow abstractions that eliminate code duplication across all concrete implementations.

## Architecture

The abstract layer provides:
- **DSL Interfaces**: Unified cryptocurrency data operations
- **Data Types**: Common data structures across all sources and targets
- **Base Classes**: Workflow abstractions with plugin pattern
- **Zero Implementation**: Pure abstractions that concrete classes inherit

## Components

### DSL Interfaces (`lib/src/abstract/dsl/`)

```
lib/src/abstract/dsl/
├── MarketDataReadingDSL.ts    # Reading operations interface
├── MarketDataWritingDSL.ts    # Writing operations interface  
├── MarketDataTypes.ts         # Data type definitions
└── index.ts                   # Type exports
```

#### MarketDataReadingDSL
Unified interface for all cryptocurrency data reading operations:

```typescript
interface MarketDataReadingDSL {
  // Price operations
  getCurrentPrice(coinId: string, vsCurrency?: string): Promise<Result<number>>;
  getCurrentPrices(coinIds: string[], options?: CurrentPricesOptions): Promise<Result<CryptoPriceData[]>>;
  
  // OHLCV operations
  getCurrentOHLCV(coinId: string, interval?: string): Promise<Result<CryptoOHLCVData>>;
  getLatestOHLCV(coinId: string, count?: number, interval?: string): Promise<Result<CryptoOHLCVData[]>>;
  getOHLCVByDateRange(query: DateRangeOHLCVQuery): Promise<Result<CryptoOHLCVData[]>>;
  
  // Historical operations
  getPriceHistory(coinId: string, dateStart: Date, dateEnd: Date): Promise<Result<Array<{date: Date; price: number}>>>;
  
  // Market operations
  getAvailableTickers(limit?: number): Promise<Result<CryptoPriceData[]>>;
  getLevel1Data(query: Level1Query): Promise<Result<Level1Data>>;
  getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>>;
}
```

#### MarketDataWritingDSL
Unified interface for all cryptocurrency data writing operations:

```typescript
interface MarketDataWritingDSL {
  // Single data publishing
  publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>>;
  publishOHLCV(data: CryptoOHLCVData): Promise<Result<PublishResult>>;
  publishMarketAnalytics(data: CryptoMarketAnalytics): Promise<Result<PublishResult>>;
  
  // Batch operations
  publishPrices(data: CryptoPriceData[]): Promise<Result<BatchPublishResult>>;
  publishOHLCVBatch(data: CryptoOHLCVData[]): Promise<Result<BatchPublishResult>>;
  publishBatch(data: any[]): Promise<Result<BatchPublishResult>>;
  
  // Utility operations
  flush(): Promise<Result<void>>;
}
```

### Data Types (`MarketDataTypes.ts`)

#### Core Data Structures
Independent data types used across all sources and targets:

```typescript
interface CryptoPriceData {
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

interface CryptoMarketAnalytics {
  timestamp: Date;
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChange24h: number;
  source: string;
  attribution: string;
}
```

### Base Classes (`lib/src/abstract/readers/`, `lib/src/abstract/writers/`)

#### BaseReader (`readers/BaseReader.ts`)
Abstract class that implements the complete MarketDataReadingDSL using the plugin pattern:

```typescript
abstract class BaseReader implements MarketDataReadingDSL {
  // DSL implementation using workflow pattern
  async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
    return this.workflow(
      () => this.getCurrentPricePlugin(coinId, vsCurrency),
      (data) => this.transformCurrentPrice(data),
      "PRICE_FETCH_ERROR",
      (data) => this.validateCurrentPrice(data)
    );
  }
  
  // Plugin contract - concrete classes implement these
  protected abstract getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any>;
  protected abstract transformCurrentPrice(data: any): number;
  
  // Workflow abstraction - captures repetitive patterns
  protected async workflow<TResult>(
    pluginFn: () => Promise<any>,
    transform: (data: any) => TResult,
    errorCode: string,
    validator?: (data: any) => boolean
  ): Promise<Result<TResult>>
}
```

#### BaseWriter (`writers/BaseWriter.ts`)
Abstract class that implements the complete MarketDataWritingDSL:

```typescript
abstract class BaseWriter implements MarketDataWritingDSL {
  // DSL implementation using workflow pattern
  async publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>> {
    return this.workflow(
      () => this.publishPricePlugin(data),
      (result) => this.transformPublishResult(result),
      "PRICE_PUBLISH_ERROR"
    );
  }
  
  // Plugin contract - concrete classes implement these
  protected abstract publishPricePlugin(data: CryptoPriceData): Promise<any>;
  protected abstract transformPublishResult(result: any): PublishResult;
}
```

## Plugin Pattern Benefits

### 1. Zero Code Duplication
- **DSL Implementation**: Written once in base classes
- **Workflow Logic**: Error handling, validation, transformation patterns captured
- **Type Safety**: Complete TypeScript integration maintained

### 2. Technology Agnostic
- **Same Interface**: Whether CoinGecko API, Redpanda stream, or TimescaleDB
- **Consistent Behavior**: All implementations follow same patterns
- **Easy Migration**: Switch between technologies without changing client code

### 3. Simplified Implementation
```typescript
// Concrete implementation - ONLY implements plugins
class CoinGeckoMarketDataReader extends BaseReader {
  // Implements ONLY technology-specific logic
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency }
    });
  }
  
  protected transformCurrentPrice(data: any): number {
    return this.extractMCPData(data)[0].current_price;
  }
  
  // ALL DSL methods work automatically:
  // getCurrentPrice(), getCurrentPrices(), getMarketAnalytics(), etc.
}
```

## Workflow Abstraction

### Error Handling Pattern
```typescript
protected async workflow<TResult>(
  pluginFn: () => Promise<any>,        // Technology-specific data fetching
  transform: (data: any) => TResult,   // Data transformation
  errorCode: string,                   // Error classification
  validator?: (data: any) => boolean   // Data validation
): Promise<Result<TResult>> {
  try {
    this.updateActivity();
    const client = this.getActiveClient();
    const response = await pluginFn();
    const data = this.extractData ? this.extractData(response) : response;
    
    if (validator && !validator(data)) {
      return failure(createQiError("INVALID_DATA", "Data validation failed", "BUSINESS"));
    }
    
    const result = transform(data);
    return success(result);
  } catch (error) {
    this.incrementErrors();
    return failure(createQiError(errorCode, error.message, "SYSTEM"));
  }
}
```

### Activity Tracking
- **Query Counting**: Automatic tracking of DSL method calls
- **Error Counting**: Failed operations tracked per actor
- **Last Activity**: Timestamp of most recent operation
- **Client Status**: Connection health for all associated clients

## Client Management

### Universal Client Association
```typescript
// Support for multiple client types
addClient(clientName: string, client: any, config: ClientConfig): void;
getClient(clientName: string): ClientAssociation | undefined;
getClientsByType(type: "data-source" | "database" | "cache"): ClientAssociation[];
```

### Client Lifecycle
- **Connection Management**: Track connected/disconnected state
- **Error Tracking**: Per-client error counting
- **Type Classification**: Organize clients by purpose
- **Health Monitoring**: Query client status across all connections

## Usage by Layer 2 Implementations

### Sources Implementation
```typescript
class SomeMarketDataReader extends BaseReader {
  // 1. Implement required plugin methods only
  protected async getCurrentPricePlugin(...): Promise<any> { /* tech-specific */ }
  protected transformCurrentPrice(data: any): number { /* tech-specific */ }
  
  // 2. All DSL methods work automatically
  // 3. Zero DSL implementation required
}
```

### Targets Implementation  
```typescript
class SomeMarketDataWriter extends BaseWriter {
  // 1. Implement required plugin methods only
  protected async publishPricePlugin(...): Promise<any> { /* tech-specific */ }
  protected transformPublishResult(result: any): PublishResult { /* tech-specific */ }
  
  // 2. All publishing DSL methods work automatically
  // 3. Zero DSL implementation required
}
```

## Integration with Layer 1

### Base Infrastructure Usage
- **Layer 1 Clients**: BaseReader/BaseWriter use Layer 1 database and streaming clients
- **Error Handling**: Result<T> pattern maintained from Layer 1
- **Configuration**: Environment-based configuration from Layer 1

### Technology Abstraction
- **Hide Complexity**: Layer 2 abstractions hide Layer 1 implementation details
- **Consistent Interface**: Same DSL regardless of underlying Layer 1 technology
- **Performance**: Direct Layer 1 access when needed for optimization

---

**Abstract Layer Principle**: Provide unified DSL interfaces that eliminate implementation repetition while maintaining complete flexibility for technology-specific optimizations.