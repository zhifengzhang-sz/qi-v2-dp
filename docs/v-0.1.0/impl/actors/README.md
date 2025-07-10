# Layer 2 Actor System Documentation

## Overview

The Layer 2 Actor System implements a **plugin pattern architecture** where all DSL functionality is centralized in base classes, and concrete actors implement only technology-specific handlers. This eliminates code duplication and ensures consistent behavior across all data sources and targets.

## Architecture Principles

### 1. Plugin Pattern Implementation

```typescript
// Base classes provide DSL + workflow
abstract class BaseReader implements MarketDataReadingDSL {
  // All DSL methods implemented here
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    return this.workflow(() => this.getCurrentPriceHandler(coinId), "PRICE_FETCH_ERROR");
  }
  
  // Concrete classes implement only handlers
  protected abstract getCurrentPriceHandler(coinId: string): Promise<number>;
}

// Concrete actors implement handlers only
class CoinGeckoMarketDataReader extends BaseReader {
  protected async getCurrentPriceHandler(coinId: string): Promise<number> {
    // CoinGecko-specific implementation
  }
}
```

### 2. Dual Client Patterns

**Actor Pattern (Composition)**:
- Actor associates with external clients (≥0)
- Uses `addClient()` to manage MCP, database, or API clients
- Flexible client management

**MCP Actor Pattern (Inheritance)**:
- Actor IS an MCP client directly
- Inherits MCP methods (`callTool`, `connect`, etc.)
- Simplified for single-client scenarios

## Directory Structure

```
lib/src/actors/
├── abstract/                    # Base actor classes
│   ├── readers/BaseReader.ts    # Universal reading foundation
│   └── writers/BaseWriter.ts    # Universal writing foundation
├── sources/                     # Data reading actors
│   ├── coingecko/              # CoinGecko API + MCP integration
│   ├── redpanda/               # Redpanda streaming consumer
│   ├── redpanda-mcp/           # Redpanda MCP reader
│   └── timescale-mcp/          # TimescaleDB MCP reader
└── targets/                    # Data writing actors
    ├── redpanda/               # Redpanda streaming producer
    ├── redpanda-mcp/           # Redpanda MCP writer (TODO)
    ├── timescale/              # TimescaleDB direct writer
    └── timescale-mcp/          # TimescaleDB MCP writer (TODO)
```

## Implementation Status

### ✅ Completed Actors

1. **CoinGecko Reader** (`sources/coingecko/`)
   - External MCP server integration
   - Real-time cryptocurrency data
   - All DSL methods implemented

2. **Redpanda Reader** (`sources/redpanda/`)
   - Streaming data consumption
   - Message deserialization
   - Exchange-aware partitioning

3. **TimescaleDB Writer** (`targets/timescale/`)
   - Time-series data persistence
   - Hypertable optimization
   - Batch insertion support

4. **Redpanda Writer** (`targets/redpanda/`)
   - Streaming data production
   - Message serialization
   - Topic routing

5. **TimescaleDB MCP Reader** (`sources/timescale-mcp/`)
   - MCP-controlled database queries
   - Historical data retrieval
   - SQL query abstraction

6. **Redpanda MCP Reader** (`sources/redpanda-mcp/`)
   - MCP-controlled streaming
   - Message filtering
   - Topic management

### 🔄 In Progress Actors

1. **TimescaleDB MCP Writer** (`targets/timescale-mcp/`)
   - MCP-controlled database writes
   - Transaction management
   - Schema evolution support

2. **Redpanda MCP Writer** (`targets/redpanda-mcp/`)
   - MCP-controlled streaming
   - Dynamic topic creation
   - Message routing

## MCP Server and Base Infrastructure Mapping

### External vs Internal MCP Servers

The actor system integrates with both external (third-party) and internal (QiCore-managed) MCP servers:

#### External MCP Servers
- **CoinGecko Reader**: Uses external `https://mcp.api.coingecko.com/sse`
- **Benefits**: No infrastructure management, instant access to live data
- **Limitations**: Rate limits, external dependencies, limited customization

#### Internal MCP Servers  
- **Redpanda MCP Reader/Writer**: Uses local MCP server for Redpanda control
- **TimescaleDB MCP Reader/Writer**: Uses local MCP server for database control
- **Benefits**: Full control, no rate limits, custom tools, enhanced security
- **Requirements**: MCP server deployment and management

### Actor Infrastructure Dependencies

| Actor | MCP Server | Base Infrastructure | Purpose |
|-------|------------|-------------------|---------|
| **CoinGecko Reader** | External (CoinGecko) | QiCore Result<T> only | Live market data via external API |
| **Redpanda Reader** | None | RedpandaClient, RedpandaConfig | Direct streaming consumption |
| **Redpanda Writer** | None | RedpandaClient, Producer Pool | Direct streaming production |
| **TimescaleDB Writer** | None | TimescaleClient, DrizzleClient, Schema | Direct database persistence |
| **Redpanda MCP Reader** | Internal (QiCore) | RedpandaClient + MCP Launcher | MCP-controlled streaming |
| **Redpanda MCP Writer** | Internal (QiCore) | RedpandaClient + MCP Launcher | MCP-controlled publishing |
| **TimescaleDB MCP Reader** | Internal (QiCore) | TimescaleClient + Database Schema | MCP-controlled queries |
| **TimescaleDB MCP Writer** | Internal (QiCore) | TimescaleClient + Transaction Mgmt | MCP-controlled persistence |

### Base Infrastructure Usage Patterns

#### Direct Integration Pattern (No MCP)
```typescript
// Uses base infrastructure directly
class RedpandaWriter extends BaseWriter {
  constructor(
    private redpandaClient: RedpandaClient,  // From lib/src/base/streaming
    private config: RedpandaConfig
  ) {
    super();
  }
}
```

#### External MCP Pattern  
```typescript
// Uses external MCP server only
class CoinGeckoReader extends BaseReader {
  private mcpClient: Client; // External MCP client
  
  async initialize() {
    const transport = new SSEClientTransport(
      new URL("https://mcp.api.coingecko.com/sse")
    );
    await this.mcpClient.connect(transport);
  }
}
```

#### Internal MCP Pattern
```typescript
// Uses internal MCP + base infrastructure
class TimescaleMCPWriter extends BaseWriter {
  constructor(
    private mcpServer: MCPServer,           // Internal MCP server
    private timescaleClient: TimescaleClient // Base infrastructure
  ) {
    super();
  }
}
```

## Key Features

### 1. Zero Code Duplication
- All DSL methods implemented once in BaseReader/BaseWriter
- Concrete actors implement only technology-specific handlers
- Consistent error handling and workflow patterns

### 2. Universal Client Management
- Support for 0 to N clients per actor
- Unified lifecycle management
- Connection pooling and error tracking

### 3. Type Safety
- Complete TypeScript integration
- Result<T> error handling throughout
- Compile-time guarantees for data flow

### 4. Exchange-Aware Design
- All data includes `exchangeId` field
- Multi-exchange support built-in
- Proper data partitioning and routing

## Client Configuration Examples

### External MCP Configuration (CoinGecko)
```typescript
const coinGeckoReader = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  useRemoteServer: true,     // Use external server
  debug: true,
  timeout: 30000,
  
  // External MCP server automatically connects to:
  // https://mcp.api.coingecko.com/sse
});
```

### Direct Base Infrastructure Configuration (Redpanda)
```typescript
const redpandaWriter = createRedpandaMarketDataWriter({
  name: "redpanda-writer",
  
  // Direct Redpanda configuration
  brokers: ["localhost:9092", "localhost:9093"],
  topics: {
    prices: "crypto-prices",
    ohlcv: "crypto-ohlcv",
    analytics: "crypto-analytics"
  },
  
  // Producer optimization
  producerConfig: {
    maxInFlightRequests: 5,
    batchSize: 16384,
    lingerMs: 5,
    compressionType: 'lz4',
    acks: 'all'
  }
});
```

### Internal MCP Configuration (TimescaleDB MCP)
```typescript
const timescaleMCPReader = createTimescaleMCPReader({
  name: "timescale-mcp-reader",
  
  // Internal MCP server configuration
  mcpServerUrl: "http://localhost:8080/mcp",
  mcpServerConfig: {
    authentication: {
      type: "bearer",
      token: process.env.MCP_TOKEN
    },
    timeout: 30000
  },
  
  // Underlying database configuration
  databaseConfig: {
    connectionString: process.env.DATABASE_URL,
    poolSize: 10,
    ssl: false
  }
});
```

### Mixed Configuration (Base + MCP)
```typescript
const redpandaMCPWriter = createRedpandaMCPWriter({
  name: "redpanda-mcp-writer",
  
  // Internal MCP server
  mcpServerUrl: "http://localhost:8080/mcp",
  
  // Base Redpanda configuration (used by MCP server)
  redpandaConfig: {
    brokers: ["localhost:9092"],
    producerConfig: {
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    }
  },
  
  // MCP-specific settings
  mcpToolsConfig: {
    enableTopicCreation: true,
    enablePartitionManagement: true,
    maxTopicsPerRequest: 10
  }
});
```

## Usage Examples

### Creating a Reader Actor

```typescript
import { createCoinGeckoMarketDataReader } from '../sources/coingecko';

const reader = createCoinGeckoMarketDataReader({
  name: "market-data-reader",
  useRemoteServer: true,
  debug: true
});

await reader.initialize();

// All DSL methods available
const price = await reader.getCurrentPrice("bitcoin");
const prices = await reader.getCurrentPrices(["bitcoin", "ethereum"]);
const analytics = await reader.getMarketAnalytics();
```

### Creating a Writer Actor

```typescript
import { createTimescaleMarketDataWriter } from '../targets/timescale';

const writer = createTimescaleMarketDataWriter({
  name: "timescale-writer",
  connectionString: process.env.DATABASE_URL
});

await writer.initialize();

// All DSL methods available
await writer.publishPrices(priceData);
await writer.publishOHLCV(ohlcvData);
await writer.publishAnalytics(analyticsData);
```

### Combining Actors

```typescript
import { createReaderWriterCombinator } from '../dsl/laws/combinator';

const combinator = createReaderWriterCombinator(reader, writer);

// Type-safe pipeline execution
const pipeline = combinator.pricesPipeline.execute(
  [["bitcoin", "ethereum"]], // reader args
  []                         // writer args
);

const result = await pipeline();
```

## Testing

Each actor includes comprehensive tests:

```bash
# Test individual actors
bun test lib/tests/actors/sources/coingecko/
bun test lib/tests/actors/targets/timescale/

# Test integration
bun test lib/tests/integration/complete-system.test.ts
```

## Performance Characteristics

- **CoinGecko Reader**: 46 available MCP tools, sub-second responses
- **Redpanda Streaming**: Sub-50ms latency, high throughput
- **TimescaleDB Writer**: 90% compression, optimized for time-series
- **Memory Usage**: Minimal overhead from plugin pattern

## Future Enhancements

1. **Actor Composition**: Combine multiple actors into pipelines
2. **Auto-scaling**: Dynamic actor creation based on load
3. **Circuit Breakers**: Fault tolerance for unreliable data sources
4. **Caching Layer**: Intelligent caching for frequently accessed data

---

**Next**: See [DSL Documentation](../dsl/README.md) for interface details