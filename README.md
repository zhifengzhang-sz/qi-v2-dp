# QiCore Crypto Data Platform

> **DSL-Driven 2-Layer Actor Architecture for Cryptocurrency Data Processing with AI Agent Control**

A production-ready cryptocurrency data processing platform implementing a **Domain-Specific Language (DSL) driven architecture** with **AI agent control via MCP servers**. Features auto-generated schemas, clean 2-layer separation, and real external integrations.

## 🏗️ Architecture Overview

### 2-Layer Architecture
- **Layer 1**: Infrastructure (Database, Streaming, Base Services)
- **Layer 2**: DSL + Actors (Business Logic, Data Processing)

### Key Features
- **DSL as Single Source of Truth**: Auto-generates schemas, types, and validation
- **Exchange-Aware Design**: All data includes `exchangeId` for multi-exchange support  
- **Law-Based Combinators**: Type-safe composition with compile-time guarantees
- **MCP Integration**: AI agent control via Model Context Protocol
- **Functional Error Handling**: Result<T> pattern throughout
- **Production Ready**: Real TimescaleDB + Redpanda integrations

## 🚀 Quick Start

### Prerequisites
- **Bun** (latest)
- **Docker & Docker Compose**
- **TimescaleDB** (via Docker)
- **Redpanda** (via Docker)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd qi-v2-dp-ts-actor

# Install dependencies
bun install

# Start infrastructure
cd services
docker-compose up -d

# Generate schemas
cd ../lib
bun run generate:schemas

# Run tests
bun test
```

## 📁 Project Structure

```
qi-v2-dp-ts-actor/
├── lib/src/                      # Core library
│   ├── dsl/                      # Layer 2: DSL definitions
│   │   ├── MarketDataTypes.ts    # Core types with exchangeId
│   │   ├── MarketDataReadingDSL.ts
│   │   ├── MarketDataWritingDSL.ts
│   │   └── laws/                 # Combinator laws
│   ├── actors/                   # Layer 2: Actor implementations
│   │   ├── abstract/             # BaseReader/BaseWriter
│   │   ├── sources/              # Data readers
│   │   │   ├── coingecko/        # CoinGecko API
│   │   │   ├── redpanda/         # Redpanda consumer
│   │   │   ├── redpanda-mcp/     # Redpanda MCP reader
│   │   │   └── timescale-mcp/    # TimescaleDB MCP reader
│   │   └── targets/              # Data writers
│   │       ├── redpanda/         # Redpanda producer
│   │       ├── timescale/        # TimescaleDB writer
│   │       └── *-mcp/            # MCP writers (TODO)
│   ├── base/                     # Layer 1: Infrastructure
│   │   ├── database/             # TimescaleDB integration
│   │   └── streaming/            # Redpanda integration
│   └── qicore/                   # Core utilities
├── app/demos/                    # Usage examples
├── services/                     # Docker infrastructure
└── docs/                         # Documentation
```

## 🔄 Data Flow

### Exchange-Aware Architecture

All data includes `exchangeId` for multi-exchange support:

```typescript
interface CryptoPriceData {
  coinId: string;
  symbol: string;
  exchangeId: string;  // NEW: Required field
  usdPrice: number;
  lastUpdated: Date;
  // ... other fields
}
```

### DSL-Driven Schema Generation

```bash
# Single command updates everything
bun run generate:schemas

# Automatically updates:
# - Database schemas (Drizzle)
# - Kafka topics & schemas (Redpanda)  
# - JSON validation
# - TypeScript types
```

## 🎯 Core Components

### 1. DSL Foundation

**Unified interfaces** for all data operations:

```typescript
// Reading DSL
interface MarketDataReadingDSL {
  getCurrentPrice(coinId: string): Promise<Result<number>>;
  getCurrentPrices(coinIds: string[]): Promise<Result<CryptoPriceData[]>>;
  getCurrentOHLCV(coinId: string): Promise<Result<CryptoOHLCVData>>;
  getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>>;
}

// Writing DSL  
interface MarketDataWritingDSL {
  publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>>;
  publishPrices(data: CryptoPriceData[]): Promise<Result<BatchPublishResult>>;
  publishOHLCV(data: CryptoOHLCVData): Promise<Result<PublishResult>>;
}
```

### 2. Actor Pattern

**Clean separation** with BaseReader/BaseWriter:

```typescript
class CoinGeckoMarketDataReader extends BaseReader {
  // Inherits full DSL interface
  // Implements only CoinGecko-specific logic
}

class TimescaleMarketDataWriter extends BaseWriter {
  // Inherits full DSL interface  
  // Implements only TimescaleDB-specific logic
}
```

### 3. Law-Based Combinators

**Type-safe composition** with compile-time guarantees:

```typescript
const pipeline = createLawfulDSLCombinator(
  coinGeckoReader.getCurrentPrices,
  timescaleWriter.publishPrices
);

// Enforces 5 fundamental laws:
// 1. Type Coherence: Read output = Write input
// 2. Error Propagation: Result<T> throughout
// 3. Data Flow: Unidirectional 
// 4. Temporal Execution: Sequential
// 5. Method Compatibility: Valid DSL only
```

### 4. MCP Integration

**AI agent control** via Model Context Protocol:

```typescript
// MCP Actor (IS an MCP client)
class TimescaleMCPReader extends BaseReader {
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    const result = await this.mcpClient.callTool({
      name: "query_timescale",
      arguments: { 
        query: "SELECT usd_price FROM crypto_prices WHERE coin_id = $1",
        params: [coinId]
      }
    });
    return success(result.data.rows[0].usd_price);
  }
}
```

## 📊 Implementation Status

### ✅ Completed (Items 1-5)

1. **Directory Reorganization**: DSL moved to Layer 2, actors structure created
2. **Exchange ID Integration**: Added throughout data model and database  
3. **Schema Consistency**: Drizzle schemas match DSL exactly
4. **Kafka Topic Design**: Updated with exchangeId partitioning
5. **Layer 2 Laws**: Combinator laws with compile-time enforcement

### ✅ Completed (Item 6)

6. **MCP Actors**: 4 of 4 completed
   - ✅ TimescaleDB MCP Reader: `lib/src/actors/sources/timescale-mcp/`
   - ✅ Redpanda MCP Reader: `lib/src/actors/sources/redpanda-mcp/`
   - ✅ TimescaleDB MCP Writer: `lib/src/actors/targets/timescale-mcp/`
   - ✅ Redpanda MCP Writer: `lib/src/actors/targets/redpanda-mcp/`

## 🧪 Usage Examples

### Basic Pipeline

```typescript
import { createCoinGeckoMarketDataReader } from "@qi/dp/actors/sources/coingecko";
import { createTimescaleMarketDataWriter } from "@qi/dp/actors/targets/timescale";

const reader = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  useRemoteServer: true
});

const writer = createTimescaleMarketDataWriter({
  name: "timescale-writer", 
  connectionString: "postgresql://user:pass@localhost:5432/crypto"
});

// Initialize actors
await reader.initialize();
await writer.initialize();

// Fetch and store data
const prices = await reader.getCurrentPrices(["bitcoin", "ethereum"]);
if (isSuccess(prices)) {
  await writer.publishPrices(getData(prices));
}
```

### Law-Based Composition

```typescript
import { createLawfulDSLCombinator } from "@qi/dp/dsl/laws";

const pipeline = createLawfulDSLCombinator(
  reader.getCurrentPrices,
  writer.publishPrices
);

// Type-safe, law-enforced execution
const result = await pipeline.execute(["bitcoin", "ethereum"]);
```

## 🔧 Development

### Generate Schemas

```bash
cd lib
bun run generate:schemas
```

### Run Tests

```bash
bun test                    # All tests
bun test integration        # Integration tests only
bun test --watch           # Watch mode
```

### Type Checking

```bash
bun run typecheck
```

### Demos

```bash
cd app/demos/layer2

# Source demos
bun run sources/coingecko-source-demo.ts
bun run sources/redpanda-source-demo.ts

# Target demos  
bun run targets/timescale-target-demo.ts
bun run targets/redpanda-target-demo.ts

# End-to-end pipeline
bun run end-to-end-pipeline-demo.ts
```

## 🏛️ Architecture Benefits

### Type Safety
- **Compile-time law enforcement**
- **Automatic schema propagation** 
- **Result<T> error handling**

### Scalability  
- **Exchange-aware partitioning**
- **Clean actor separation**
- **MCP-driven automation**

### Maintainability
- **Single source of truth (DSL)**
- **Law-based composition**
- **Clear directory structure**

## 📚 Documentation

- [Layer 2 Architecture](docs/impl/layer2/architecture.md)
- [DSL Laws](docs/impl/layer2/abstract/README.md)
- [MCP Integration](docs/mcp/README.md)
- [Todo Progress](docs/todo-progress-1-6.md)

## 🤝 Contributing

1. Follow the DSL-driven architecture
2. Maintain Result<T> error handling
3. Add tests for new actors
4. Update schemas when changing data types

## 📄 License

MIT License - see LICENSE file for details.