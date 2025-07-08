# Source Actors - Data Reading Implementations

## Overview

Source actors implement data reading functionality by extending BaseReader and implementing technology-specific handlers. Each source actor provides access to cryptocurrency market data through different protocols and technologies.

## Available Source Actors

### 1. CoinGecko Reader (`coingecko/`)

**Purpose**: External API integration with CoinGecko MCP server

**Technology**: Model Context Protocol (MCP) + REST API
**Data Sources**: Real-time cryptocurrency prices, market analytics, OHLCV data
**Connection**: External MCP server at `https://mcp.api.coingecko.com/sse`

**MCP Server Details**:
- **Server Type**: External (Third-party)
- **Transport**: SSE (Server-Sent Events)
- **URL**: `https://mcp.api.coingecko.com/sse`
- **Available Tools**: 46 cryptocurrency data tools
- **Authentication**: None required (public API)
- **Rate Limits**: Standard CoinGecko API limits apply

**Base Infrastructure Used**:
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **No direct base clients**: Uses external MCP connection only

**Key Features**:
- 46 available MCP tools for comprehensive market data
- Real-time price feeds for 13,000+ cryptocurrencies
- Global market analytics (market cap, dominance, volume)
- Historical price and OHLCV data
- Exchange-aware data with `exchangeId: "coingecko"`

**Usage**:
```typescript
import { createCoinGeckoMarketDataReader } from './sources/coingecko';

const reader = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  useRemoteServer: true,
  debug: true
});

await reader.initialize();

// Get current Bitcoin price
const price = await reader.getCurrentPrice("bitcoin");

// Get multiple prices with market data
const prices = await reader.getCurrentPrices(
  ["bitcoin", "ethereum", "cardano"],
  { includeMarketData: true, includePriceChange: true }
);

// Get global market analytics
const analytics = await reader.getMarketAnalytics();
```

**Performance**: Sub-second response times, reliable external MCP connection

### 2. Redpanda Reader (`redpanda/`)

**Purpose**: Streaming data consumption from Redpanda/Kafka topics

**Technology**: Kafka protocol via KafkaJS
**Data Sources**: Real-time streaming cryptocurrency data
**Connection**: Local Redpanda cluster

**MCP Server Details**:
- **Server Type**: N/A (Direct Kafka/Redpanda connection)
- **No MCP server used**: Direct protocol integration

**Base Infrastructure Used**:
- **RedpandaClient**: From `lib/src/base/streaming/redpanda/redpanda-client.ts`
- **RedpandaConfig**: From `lib/src/base/streaming/redpanda/redpanda-config.ts`
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Topic Management**: Auto-generated topic configurations

**Key Features**:
- High-throughput streaming data consumption
- Exchange-aware message routing
- Automatic message deserialization
- Consumer group management
- Sub-50ms message processing latency

**Usage**:
```typescript
import { createRedpandaMarketDataReader } from './sources/redpanda';

const reader = createRedpandaMarketDataReader({
  name: "redpanda-reader",
  brokers: ["localhost:9092"],
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  },
  groupId: "crypto-data-processor"
});

await reader.initialize();

// Read latest prices from stream
const prices = await reader.getCurrentPrices(["bitcoin", "ethereum"]);
```

**Performance**: Sub-50ms latency, handles 10k+ messages/second

### 3. Redpanda MCP Reader (`redpanda-mcp/`)

**Purpose**: MCP-controlled streaming data access

**Technology**: MCP + Kafka protocol
**Data Sources**: MCP-managed streaming cryptocurrency data
**Connection**: Local MCP server controlling Redpanda access

**MCP Server Details**:
- **Server Type**: Internal (QiCore-managed)
- **Transport**: HTTP/WebSocket (local server)
- **URL**: `http://localhost:8080/mcp` (configurable)
- **Available Tools**: Redpanda-specific streaming tools
- **Authentication**: Local authentication (if configured)
- **Management**: Launched via `redpanda-mcp-launcher.ts`

**Base Infrastructure Used**:
- **RedpandaClient**: From `lib/src/base/streaming/redpanda/redpanda-client.ts`
- **MCP Launcher**: From `lib/src/base/streaming/redpanda/redpanda-mcp-launcher.ts`
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Topic Management**: MCP-controlled topic subscription

**Key Features**:
- MCP-driven stream management
- Dynamic topic subscription
- Message filtering and transformation
- AI-controlled data access patterns

**Usage**:
```typescript
import { createRedpandaMCPReader } from './sources/redpanda-mcp';

const reader = createRedpandaMCPReader({
  name: "redpanda-mcp-reader",
  mcpServerUrl: "http://localhost:8080/mcp"
});

await reader.initialize();

// MCP-controlled data access
const data = await reader.getCurrentPrices(["bitcoin"]);
```

**Status**: ✅ Completed

### 4. TimescaleDB MCP Reader (`timescale-mcp/`)

**Purpose**: MCP-controlled historical data access

**Technology**: MCP + PostgreSQL/TimescaleDB
**Data Sources**: Historical cryptocurrency data from TimescaleDB
**Connection**: Local MCP server controlling database access

**MCP Server Details**:
- **Server Type**: Internal (QiCore-managed)
- **Transport**: HTTP/WebSocket (local server)
- **URL**: `http://localhost:8080/mcp` (configurable)
- **Available Tools**: TimescaleDB query and analysis tools
- **Authentication**: Database credentials via MCP server
- **Management**: Launched alongside database infrastructure

**Base Infrastructure Used**:
- **TimescaleClient**: From `lib/src/base/database/timescale-client.ts`
- **DrizzleClient**: From `lib/src/base/database/drizzle-client.ts`
- **Database Schema**: From `lib/src/base/database/schema.ts`
- **QiCore Result<T>**: For error handling (`@qi/core/base`)
- **Connection Pooling**: Managed via TimescaleClient

**Key Features**:
- MCP-driven SQL query generation
- Historical data analysis
- Time-series optimized queries
- Hypertable query optimization

**Usage**:
```typescript
import { createTimescaleMCPReader } from './sources/timescale-mcp';

const reader = createTimescaleMCPReader({
  name: "timescale-mcp-reader",
  mcpServerUrl: "http://localhost:8080/mcp"
});

await reader.initialize();

// Get historical price data
const history = await reader.getPriceHistory("bitcoin", 30);

// Get OHLCV data by date range
const ohlcv = await reader.getOHLCVByDateRange({
  ticker: "ethereum",
  dateStart: new Date("2024-01-01"),
  dateEnd: new Date("2024-01-31"),
  interval: "1d"
});
```

**Status**: ✅ Completed

## Implementation Pattern

All source actors follow the same implementation pattern:

### 1. Handler Implementation Only

```typescript
export class SourceActorExample extends BaseReader {
  // ✅ Implement handlers only
  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    // Technology-specific implementation
    const data = await this.fetchFromSource(coinId, vsCurrency);
    return this.extractPrice(data);
  }

  // ❌ Never reimplement DSL methods
  // async getCurrentPrice() { ... } // DON'T DO THIS
}
```

### 2. Factory Functions

Each source actor provides a factory function:

```typescript
export function createSourceActor(config: SourceConfig): SourceActor {
  return new SourceActor(config);
}
```

### 3. Configuration Types

Strongly-typed configuration interfaces:

```typescript
export interface SourceActorConfig {
  name: string;
  debug?: boolean;
  timeout?: number;
  // Source-specific options
}
```

## Data Flow Architecture

```
External Data Sources
        ↓
Source Actor Handlers (technology-specific)
        ↓
BaseReader Workflow (unified)
        ↓
DSL Interface (standardized)
        ↓
Application Code
```

## Exchange-Aware Design

All source actors include exchange identification:

```typescript
// Every data object includes exchangeId
interface CryptoPriceData {
  coinId: string;
  symbol: string;
  exchangeId: string;  // "coingecko", "binance", etc.
  usdPrice: number;
  // ... other fields
}
```

## Error Handling

Unified error handling through Result<T> pattern:

```typescript
const result = await reader.getCurrentPrice("bitcoin");

if (isSuccess(result)) {
  const price = getData(result);
} else {
  const error = getError(result);
  // Handle specific error types
  switch (error.code) {
    case "PRICE_FETCH_ERROR":
      // Handle price fetch failure
      break;
    case "NO_CLIENT":
      // Handle client connection issues
      break;
  }
}
```

## Testing

Each source actor includes comprehensive tests:

```bash
# Test CoinGecko reader
bun test lib/tests/actors/sources/coingecko/

# Test Redpanda reader
bun test lib/tests/actors/sources/redpanda/

# Test MCP readers
bun test lib/tests/actors/sources/redpanda-mcp/
bun test lib/tests/actors/sources/timescale-mcp/
```

## Performance Characteristics

| Source Actor | Latency | Throughput | Data Types |
|--------------|---------|------------|------------|
| CoinGecko | <1s | 100 req/min | Prices, OHLCV, Analytics |
| Redpanda | <50ms | 10k msg/s | Streaming All Types |
| Redpanda MCP | <100ms | Variable | MCP-Controlled |
| TimescaleDB MCP | <200ms | High | Historical Data |

## Adding New Source Actors

To add a new source actor:

1. **Create directory**: `lib/src/actors/sources/new-source/`

2. **Implement actor class**:
```typescript
export class NewSourceReader extends BaseReader {
  protected async getCurrentPriceHandler(coinId: string): Promise<number> {
    // Your implementation
  }
  // ... implement all required handlers
}
```

3. **Add factory function**:
```typescript
export function createNewSourceReader(config: NewSourceConfig): NewSourceReader {
  return new NewSourceReader(config);
}
```

4. **Add tests**: `lib/tests/actors/sources/new-source/`

5. **Update documentation**: Add to this README

## Integration Examples

### Multi-Source Data Pipeline

```typescript
import { createCoinGeckoMarketDataReader } from './sources/coingecko';
import { createRedpandaMarketDataReader } from './sources/redpanda';

// Create multiple sources
const coinGeckoReader = createCoinGeckoMarketDataReader({...});
const redpandaReader = createRedpandaMarketDataReader({...});

// Initialize all sources
await Promise.all([
  coinGeckoReader.initialize(),
  redpandaReader.initialize()
]);

// Compare data from different sources
const [coinGeckoPrice, redpandaPrice] = await Promise.all([
  coinGeckoReader.getCurrentPrice("bitcoin"),
  redpandaReader.getCurrentPrice("bitcoin")
]);
```

### Real-time + Historical Analysis

```typescript
// Live data from CoinGecko
const livePrice = await coinGeckoReader.getCurrentPrice("bitcoin");

// Historical data from TimescaleDB
const historicalData = await timescaleReader.getPriceHistory("bitcoin", 30);

// Combine for analysis
const analysis = analyzePrice(livePrice, historicalData);
```

---

**Next**: See [Target Actors](../targets/README.md) for data writing implementations