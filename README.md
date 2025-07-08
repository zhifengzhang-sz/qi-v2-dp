# QiCore Crypto Data Platform

**Production-ready cryptocurrency data processing platform** with complete 2-layer actor architecture and DSL-driven schema management.

## 🏗️ Architecture Overview

**DSL-Driven 2-Layer System**: Single source of truth for all data schemas

```
DSL Schema (source of truth) → Auto-generates → Database + Topic schemas
```

- **Layer 1**: Generic infrastructure (BaseReader/BaseWriter, database clients, MCP primitives)
- **Layer 2**: Technology-specific actors (CoinGecko, Redpanda, TimescaleDB)
- **DSL Layer**: Unified data types driving both storage and streaming schemas

## ✨ Key Features

✅ **DSL-Driven Schema Management** - Single source of truth auto-generates database and topic schemas  
✅ **Zero Code Duplication** - Handler pattern eliminates repetitive DSL implementations  
✅ **External MCP Integration** - Live CoinGecko MCP server (46 tools, real market data)  
✅ **Real-Time Streaming** - Redpanda/Kafka with auto-generated topic schemas and JSON validation  
✅ **Time-Series Database** - TimescaleDB with hypertables, compression, and optimized queries  
✅ **Type Safety** - Complete TypeScript with functional Result<T> error handling  
✅ **Production Ready** - Docker services, schema validation, and comprehensive testing  

## 🚀 Quick Start

### Schema Generation (Core Workflow)
```bash
# Generate all schemas from DSL types
bun run scripts/generate-schema.ts

# Start services with generated schemas
cd services && docker-compose up -d

# Test end-to-end pipeline
bun run app/demos/layer2/end-to-end-pipeline-demo.ts
```

### Development Commands
```bash
# Type checking
bun run typecheck

# Testing
bun run test:basic                    # Core architecture tests
bun run test:integration             # Full system tests

# Code quality
bun run biome check --fix

# Individual demos
bun run app/demos/layer1/base/result-type-demo.ts
bun run app/demos/layer2/sources/coingecko-source-demo.ts
bun run app/demos/layer2/sources/redpanda-source-demo.ts
bun run app/demos/layer2/targets/redpanda-target-demo.ts
bun run app/demos/layer2/targets/timescale-target-demo.ts
```

### System Architecture

**DSL Types (Single Source of Truth)**:
- `CryptoPriceData` - Real-time cryptocurrency prices
- `CryptoOHLCVData` - OHLCV candlestick data for technical analysis  
- `CryptoMarketAnalytics` - Global market metrics and analytics
- `Level1Data` - Order book top-of-book data

**Layer 2 Actors (Auto-Generated from DSL)**:

*Sources (Data Input)*:
- `CoinGeckoMarketDataReader` - External MCP server (46 tools, live data)
- `RedpandaMarketDataReader` - Stream consumption with DSL validation

*Targets (Data Output)*:
- `TimescaleMarketDataWriter` - Time-series database with auto-generated schema
- `RedpandaMarketDataWriter` - Stream production with topic management

## 📊 Schema Management Workflow

**The Core Innovation**: DSL types automatically generate all storage and streaming schemas

```bash
# 1. Update DSL types in lib/src/abstract/dsl/MarketDataTypes.ts
# 2. Generate schemas from DSL
bun run scripts/generate-schema.ts

# 3. Restart services with new schemas  
cd services && docker-compose down && docker-compose up -d

# 4. All actors automatically use the updated schemas
```

**Generated Artifacts**:
- `services/database/init-timescale-generated.sql` - TimescaleDB schema
- `services/redpanda/topics.yml` - Redpanda topic configuration
- `services/redpanda/schemas.json` - JSON Schema validation
- `services/redpanda/generated-mappings.ts` - TypeScript serialization

## Live Data Results

All actors work with real cryptocurrency data:
- Bitcoin: $109,426 (live CoinGecko MCP)
- Market Cap: $3.45T total
- Performance: 200-600ms API calls, sub-second analytics

## Usage Pattern

```typescript
// Create actors
const source = createCoinGeckoMarketDataReader({name: "crypto-source"});
const target = createTimescaleMarketDataWriter({name: "crypto-db"});

// Unified DSL interface - same across all technologies
const prices = await source.getCurrentPrices(["bitcoin", "ethereum"]);
await target.publishPrices(prices.data);
```

## Prerequisites

- **Bun v1.2+**: JavaScript/TypeScript runtime
- **Docker**: For infrastructure services (optional)
- **Internet**: For external MCP server access

## Documentation

- [Complete Architecture](./docs/impl/architecture.md)
- [Layer 1 Infrastructure](./docs/impl/layer1/base.md)
- [Layer 2 DSL Actors](./docs/impl/layer2/architecture.md)

---

**Scope**: This project provides reusable actor building blocks. The parallel MCP Server project handles app-level business logic and service composition.