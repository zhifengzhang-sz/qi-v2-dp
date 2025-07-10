# QiCore Data Platform v-0.2.0 Documentation

## Overview

Version 0.2.0 represents a **DSL System Upgrade** that modernizes the data processing architecture. This version requires reimplementation of components due to DSL changes, with v-0.2.0 focusing on completing crypto market actors first.

## What's New in v-0.2.0

### 🚀 DSL System Upgrade
- **Modernized DSL Architecture**: Updated interfaces and data structures in `lib/src/dsl/`
- **Domain Context Organization**: `market/crypto/actors/` hierarchy for better organization
- **MCP Actor Implementation**: Real external server integration patterns
- **Immutable Data Classes**: Professional market data structures with factory methods
- **Complete Type Safety**: Full TypeScript support with Result<T> error handling

### 📊 Live External Integration
- **CoinGecko MCP Server**: Real-time cryptocurrency data working
- **CCXT & TwelveData**: Ready for deployment with proper configuration
- **Working Demos**: Live Bitcoin/ETH prices with real market data

### 🏗️ Implementation Scope
- **v-0.2.0**: Crypto market actors complete (CoinGecko, CCXT, TwelveData)
- **DSL Breaking Changes**: All components require reimplementation
- **Future Versions**: Planned expansion to other asset classes

## Documentation Structure

```
docs/v-0.2.0/
├── README.md                    # This overview
├── architecture/
│   ├── overview.md             # Complete system architecture
│   ├── fp-layer.md             # FP system architectural details
│   └── evolution.md            # v-0.1.0 to v-0.2.0 evolution
├── fp-system/
│   ├── README.md               # FP system introduction
│   ├── dsl-design.md           # DSL modular design
│   ├── partial-application.md  # Context binding patterns
│   ├── actor-patterns.md       # Generic vs MCP actors
│   └── performance.md          # Performance characteristics
├── implementation/
│   ├── getting-started.md      # Quick start guide
│   ├── creating-actors.md      # How to create new FP actors
│   ├── context-binding.md      # Context binding examples
│   └── testing.md              # Testing FP actors
└── guides/
    ├── aliasing-requirements.md # ⚠️ CRITICAL: Module aliasing requirements
    ├── migration.md            # Migrating from v-0.1.0
    ├── best-practices.md       # FP system best practices
    └── troubleshooting.md      # Common issues and solutions
```

## Key Features

### 1. Modernized DSL System
- **Clean Interfaces**: MarketDataReader pattern with consistent method signatures
- **Immutable Data Classes**: Price, OHLCV, Level1, MarketSymbol, MarketContext, Exchange
- **Time Interval Support**: Professional historical data query utilities
- **Type-Safe Operations**: Complete TypeScript support with compile-time guarantees

### 2. MCP Actor Architecture
- **External MCP Integration**: Direct connection to real market data servers
- **Consistent Error Handling**: Result<T> pattern throughout
- **Professional Data Structures**: FIX Protocol 4.4 compliant market data
- **Real Market Data**: Working with live external servers

### 3. Complete Actor Coverage

| Actor | Price | OHLCV | Level1 | Assets | Exchanges |
|-------|-------|-------|--------|--------|-----------|
| **CoinGecko** | ✅ | ✅ | ❌ | Crypto | Aggregated |
| **CCXT** | ✅ | ✅ | ✅ | Crypto | 100+ |
| **TwelveData** | ✅ | ✅ | ✅ | Multi-asset | Aggregated |

### 4. Real-World Integration
- **Live Cryptocurrency Data**: CoinGecko MCP server integration working
- **Ready for Deployment**: CCXT and TwelveData actors implemented  
- **Production Ready**: Comprehensive testing and error handling

## Quick Start

```typescript
import { CoinGeckoMCPReader } from "@qi/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Create MCP client connection
const client = new Client(
  { name: "trading-app", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const transport = new SSEClientTransport(
  new URL("https://mcp.api.coingecko.com/sse")
);
await client.connect(transport);

// Create reader with real MCP integration
const reader = new CoinGeckoMCPReader({
  name: "coingecko-reader",
  mcpClient: client
});

// Use DSL interface for market data
const priceResult = await reader.readPrice(btcSymbol, context);
```

## Breaking Changes from v-0.1.0

⚠️ **DSL Upgrade Requires Reimplementation**:
- All actors need to be rebuilt using new DSL interfaces
- Data structures changed to immutable classes with factory methods
- Import paths updated to use module aliasing (@qi/core, @qi/dsl)
- v-0.1.0 components are not compatible with v-0.2.0

## Migration Requirements

1. **Complete Reimplementation**: All components must be rewritten for new DSL
2. **Module Aliasing**: Critical requirement for import management
3. **Testing**: All functionality must be re-validated with new architecture

## Version Comparison

| Feature | v-0.1.0 | v-0.2.0 |
|---------|---------|---------|
| DSL Architecture | Original | **Upgraded** (breaking changes) |
| Data Classes | Mutable | **Immutable** with factory methods |
| MCP Integration | Basic | **Real external servers** |
| Actor Coverage | All assets | **Crypto only** (others in future) |
| Module Aliasing | Optional | **Required** |
| Backward Compatibility | N/A | **None** (complete rewrite needed) |

## v-0.2.x Roadmap

- **v-0.2.0**: ✅ Crypto market actors (CoinGecko, CCXT, TwelveData)
- **v-0.2.1**: DSL improvements (current DSL needs optimization)
- **v-0.2.2**: Stock market support
- **v-0.2.3**: Kafka integration
- **v-0.2.4**: TimescaleDB support  
- **v-0.2.5**: ClickHouse support
- **v-0.2.6**: Combinators

## TwelveData API Key Setup

To test TwelveData MCP actor before checkin:

1. **Retrieve API Key**: Sign in to [TwelveData Dashboard](https://twelvedata.com/dashboard)
2. **Navigate**: Go to "API Keys" section in left sidebar  
3. **Reveal Key**: Click "reveal" button to show your API key
4. **Secure Storage**: Set environment variable `TWELVE_DATA_API_KEY=your_key_here`
5. **Test Actor**: Run working demo to validate integration

## Next Steps

1. **CRITICAL**: Read [Aliasing Requirements](guides/aliasing-requirements.md) ⚠️
2. **Setup**: Configure TwelveData API key for testing
3. **Learn**: Follow the [Getting Started Guide](implementation/getting-started.md)
4. **Build**: Create MCP actors using established patterns
5. **Validate**: Test with real external servers before checkin

---

**Note**: This documentation covers the v-0.2.0 DSL upgrade. v-0.1.0 components require complete reimplementation for v-0.2.x compatibility.