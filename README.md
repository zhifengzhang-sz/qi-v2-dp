# QiCore Market Data Platform

A market data processing platform with real external API integrations and professional market data standards.

## What This Does

**Market Data Integration**: Connect to real financial data sources through standardized interfaces.

**Live Data Sources**:
- ✅ **CoinGecko**: Real-time crypto prices via official MCP server (no API key)
- ✅ **TwelveData**: Multi-asset data (crypto, stocks, forex) with production API
- ✅ **CCXT**: 100+ exchange integration ready for MCP deployment

**Current Focus**: Cryptocurrency data sources are used for initial development because they have accessible APIs and real-time data feeds.

**Professional Data Structures**: Type-safe, immutable data classes following FIX Protocol 4.4 standards.

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd qi-v2-dp-ts-actor
bun install

# Run demos with live data
bun run app/demos/platform.validation.ts      # See all integrations working
bun run app/demos/coingecko.live-data.ts      # Live Bitcoin prices
bun run app/demos/twelvedata.multi-asset.ts   # Multi-asset data
```

## Project Structure

```
qi-v2-dp-ts-actor/
├── lib/src/
│   ├── dsl/                          # Core data types and interfaces  
│   │   ├── types.ts                  # Price, OHLCV, Level1, MarketSymbol, etc.
│   │   ├── interfaces.ts             # MarketDataReader interface
│   │   └── utils.ts                  # Time interval utilities
│   ├── market/                       # Market data implementations by asset class
│   │   ├── crypto/actors/sources/    # Cryptocurrency-specific sources
│   │   │   ├── CoinGeckoMCPReader.ts # Real-time crypto prices (no API key)
│   │   │   └── CCXTMCPReader.ts      # 100+ crypto exchanges
│   │   ├── multi-asset/actors/sources/ # Multi-asset sources  
│   │   │   └── TwelveDataMCPReader.ts# Stocks, forex, crypto, commodities
│   │   └── stock/actors/sources/     # Stock market sources
│   │       └── AlphaVantageMCPReader.ts # NASDAQ-licensed stock data
│   ├── domain/                       # Business logic and calculations
│   ├── qicore/base/                  # Functional error handling (Result<T>)
│   └── utils/                        # Time intervals and utilities
├── app/demos/                        # Working examples with live data
├── lib/tests/                        # Integration tests (35 tests, no mocks)
├── docs/v-0.2/mcp/                   # MCP server documentation
└── docs/                             # Implementation documentation
```

## Core Data Types

### Market Data
```typescript
// Price point
const price = Price.create(new Date(), 45000.50, 1.5);

// OHLCV candlestick data  
const ohlcv = OHLCV.create(new Date(), 44500, 45200, 44300, 45000.50, 125.75);

// Order book data
const level1 = Level1.create(new Date(), 44999.50, 0.25, 45000.50, 0.30);
```

### Market Context
```typescript
// Define exchanges and symbols
const binance = Exchange.create("binance", "Binance", "Global", "centralized");
const btcSymbol = MarketSymbol.create("BTC/USD", "Bitcoin", "crypto", "USD", InstrumentType.CASH);
const context = MarketContext.create(binance, btcSymbol);
```

## Data Sources

### CoinGecko (Working)
```typescript
const reader = new CoinGeckoMCPReader({ name: "coingecko-reader" });
const price = await reader.readPrice(btcSymbol, context);
```

### TwelveData (Multi-Asset)
```typescript
const reader = new TwelveDataMCPReader({ 
  name: "twelvedata-reader",
  apiKey: process.env.TWELVE_DATA_API_KEY 
});
// Supports crypto, stocks, forex, commodities
```

### CCXT (100+ Exchanges)
```typescript
const reader = new CCXTMCPReader({ name: "ccxt-reader" });
// Binance, Coinbase, Kraken, etc.
```

## Unified Interface

All data sources implement the same interface:

```typescript
interface MarketDataReader {
  readPrice(symbol: MarketSymbol, context: MarketContext): Promise<Price>;
  readOHLCV(symbol: MarketSymbol, context: MarketContext): Promise<OHLCV>;
  readLevel1(symbol: MarketSymbol, context: MarketContext): Promise<Level1>;
  // ... historical data methods
}
```

## Integration Status

| Source | Asset Classes | Price | OHLCV | Level1 | Status |
|--------|---------------|-------|-------|--------|--------|
| **CoinGecko** | Crypto | ✅ | ⚠️ | ❌ | Working with live MCP server |
| **TwelveData** | Multi-asset | ✅ | ✅ | ✅ | Production ready with real API |  
| **Alpha Vantage** | Stocks | ✅ | ✅ | ❌ | Ready with API key |
| **CCXT** | Crypto | ✅ | ✅ | ✅ | Ready for MCP server setup |

## Development

### Run Tests
```bash
bun run test           # 35 integration tests
bun run typecheck      # TypeScript validation
bun run lint           # Code style checks
```

### Working Demos
```bash
# All integrations
bun run app/demos/platform.validation.ts

# Individual sources  
bun run app/demos/coingecko.live-data.ts
bun run app/demos/twelvedata.multi-asset.ts
bun run app/demos/ccxt.exchange-data.ts
```

## Documentation

**📚 Complete MCP Guides**: See [`docs/v-0.2/mcp/`](./docs/v-0.2/mcp/) for comprehensive usage documentation:
- [CoinGecko MCP Server Guide](./docs/v-0.2/mcp/coingecko-mcp-server.md)
- [TwelveData MCP Server Guide](./docs/v-0.2/mcp/twelvedata-mcp-server.md)
- [MCP Integration Overview](./docs/v-0.2/mcp/README.md)

## Deployment

### CoinGecko (Ready Now)
- Works immediately with live MCP server
- No API key required
- Real-time cryptocurrency data

### TwelveData (Configure API Key)
```bash
export TWELVE_DATA_API_KEY=your_api_key
```
- Multi-asset support (crypto, stocks, forex)
- Professional financial data

### CCXT (Install MCP Server)
```bash
bun add -g @lazydino/ccxt-mcp
```
- 100+ cryptocurrency exchanges
- Real order book data

## Architecture

**Type Safety**: All data structures are immutable with TypeScript support.

**Error Handling**: Functional `Result<T>` pattern throughout.

**Standards Compliance**: FIX Protocol 4.4 compliant market data structures.

**Real Data**: No mocking - all examples work with live external APIs.

## Version

**v-0.2.2**: MCP Integration Complete ✅
- **Real MCP Server Integration**: CoinGecko and TwelveData working with official servers
- **Production-Ready Testing**: 35 integration tests with live API validation
- **Multi-Asset Support**: Crypto, stocks, forex, commodities through TwelveData
- **Official Tool Names**: Updated to use correct MCP server tools and protocols
- **Comprehensive Documentation**: Complete MCP usage guides in `docs/v-0.2/mcp/`

### Previous Releases
- **v-0.2.1**: DSL Module Cleanup - Pure data definitions
- **v-0.2.0**: DSL System Upgrade - Market data actors foundation

---

**Status**: Production Ready 🎯  
**Next**: Layer 3 MCP servers for external tool exposure