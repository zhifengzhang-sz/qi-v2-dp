# Data Platform Actor System

**Reusable cryptocurrency data processing actors** - One of two core subprojects within the broader Data Platform project.

## Project Structure

```
Data Platform Project
├── Data Platform Actor System (this repo) - Reusable actors
└── Data Platform MCP Server (parallel) - App-level services
```

## Architecture

**2-Layer Actor System**: Production-ready foundation for cryptocurrency data processing

- **Layer 1**: Base Infrastructure (TimescaleDB, Redpanda, Base Agents)
- **Layer 2**: DSL Actors (Sources & Targets with unified interfaces)
- **External**: MCP Server project composes these actors into business services

## Key Features

✅ **Zero Code Duplication** - Plugin pattern eliminates repetitive DSL implementations  
✅ **Technology Agnostic** - Swap data sources/targets without code changes  
✅ **MCP Integration** - CoinGecko external MCP server (46 tools, live data)  
✅ **Real Performance** - Sub-50ms streaming, 90% DB compression, 53% faster than Node.js  
✅ **Type Safety** - Complete TypeScript with functional Result<T> error handling  

## Quick Start

### Development Commands
```bash
# Type checking
bun run typecheck

# Testing
bun run test

# Code quality
bun run biome check --fix

# Demos
bun app/demos/index.ts
```

### Current Actors

**Sources (Data Input)**:
- `CoinGeckoMarketDataReader` - External MCP server integration
- `RedpandaMarketDataReader` - Kafka/Redpanda streaming consumer

**Targets (Data Output)**:
- `TimescaleMarketDataWriter` - Time-series database persistence
- `RedpandaMarketDataWriter` - Kafka/Redpanda streaming producer

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