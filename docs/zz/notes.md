## Architecture Overview - 3-Layer Architecture
### Layer 1: Base Infrastructure

```base
src/base
├── base-agent.ts
├── database
│   ├── crypto-dsl.ts                # outdated?
│   ├── drizzle-client.ts            # Drizzle ORM
│   ├── index.ts                     # database interface
│   ├── schema.ts                    # Database schemas
│   └── timescale-client.ts          # TimescaleDB client
└── streaming
    ├── index.ts
    └── redpanda
        ├── index.ts
        ├── redpanda-client.ts       # KafkaJS wrapper
        ├── redpanda-config.ts       # Configuration
        ├── redpanda-mcp-launcher.ts # MCP server launcher (not used as we can find good server)
        └── types.ts                 # Kafka message types
```

### Layer 2: DSL Layer

```
src
├── abstract
│   ├── dsl
│   │   ├── MarketDataReadingDSL.ts
│   │   ├── MarketDataTypes.ts
│   │   ├── MarketDataWritingDSL.ts
│   │   └── index.ts
│   ├── readers
│   │   └── BaseReader.ts
│   └── writers
│       └── BaseWriter.ts
├── sources
│   ├── coingecko
│   │   ├── MarketDataReader.ts
│   │   ├── MarketDataReaderWithMCP.ts
│   │   └── index.ts
│   └── redpanda
│       ├── MarketDataReader.ts
│       └── index.ts
├── targets
│   ├── redpanda
│   │   ├── MarketDataWriter.ts
│   │   ├── RedpandaMarketDataWriter.ts
│   │   └── index.ts
│   └── timescale
│       ├── TimescaleMarketDataWriter.ts
│       └── index.ts
└── utils
```

### Layer 3: Service Layer (Future)
  Market Data Publishing MCP Server    # Uses Layer 2 DSL actors
  Market Data Storing MCP Server       # Uses Layer 2 DSL actors
  Current Implementations
  CoinGecko (Two Types)
  - MCP Actor: publishers/sources/coingecko/MarketDataReader.ts
    - Extends MCP Client
    - Uses CoinGecko MCP server (46 tools)
  - Actor: publishers/sources/coingecko/MarketDataActor.ts (future)
    - Composition pattern
  Redpanda (One Type)
  - Actor: consumers/sources/redpanda/MarketDataReader.ts
  - Actor: publishers/targets/redpanda/MarketDataWriter.ts
  - Uses base/streaming/redpanda infrastructure directly
  - No MCP server exists for Redpanda
  Design Constraints
  - Layer 2+: Only use DSL interfaces (getCurrentPrice(), writePrice())
  - Path aliases: @qi/core/base (never relative paths)
  - Error handling: Result<T> functional patterns
  - TypeScript: Strict mode, proper typing


### Data Flow
  ```
  Layer 3: MCP Server Tools
      ↓
  Layer 2: DSL Methods (getCurrentPrice, writePrice, etc.)
      ↓
  Layer 1: Raw clients (RedpandaClient, TimescaleClient, etc.)
  ```

---
  🏗️ The Complete Abstraction Stack

  ┌─────────────────────────────────────────┐
  │ BUSINESS LOGIC                          │  ← Where we want to spend time
  │ - Trading algorithms                    │
  │ - Risk management                       │
  │ - Portfolio optimization                │
  │ - Market analysis                       │
  └─────────────────────────────────────────┘
                ⬆️ Uses DSL
  ┌─────────────────────────────────────────┐
  │ DSL LAYER (Our Focus)                   │  ← Business language
  │ getCurrentPrice(), publishPrice()       │
  │ getMarketAnalytics(), getOHLCV()        │
  └─────────────────────────────────────────┘
                ⬆️ Uses MCP
  ┌─────────────────────────────────────────┐
  │ MCP LAYER                               │  ← Protocol abstraction
  │ - Tool calling                          │
  │ - Schema management                     │
  │ - Response handling                     │
  └─────────────────────────────────────────┘
                ⬆️ Handles APIs
  ┌─────────────────────────────────────────┐
  │ LOW-LEVEL INFRASTRUCTURE                │  ← What we DON'T want to deal with
  │ - HTTP requests                         │
  │ - Authentication                        │
  │ - Rate limiting                         │
  │ - Schema evolution                      │
  │ - Error codes                           │
  │ - Connection pooling                    │
  └─────────────────────────────────────────┘

  💼 Business Logic Focus

  // THIS is where we want to spend our time:
  class TradingStrategy {
    async executeMomentumStrategy(): Promise<TradeDecision> {
      // Business logic using DSL
      const btcPrice = await this.coinGecko.getCurrentPrice("bitcoin");
      const ethPrice = await this.coinGecko.getCurrentPrice("ethereum");
      const analytics = await this.coinGecko.getMarketAnalytics();

      // Pure business logic - no infrastructure concerns
      if (analytics.data.btcDominance > 0.6 && btcPrice.data > 100000) {
        return { action: "buy", asset: "ethereum", reason: "btc-dominance-rotation" };
      }
    }
  }

  🗣️ DSL as Business Language

  The DSL becomes the vocabulary for financial logic:
  - getCurrentPrice() - universal concept across all data sources
  - getMarketAnalytics() - market-wide metrics
  - publishPrice() - store/stream data anywhere
  - getOHLCV() - technical analysis data

  This is financial domain language, not technical infrastructure language.

  🚀 The Time Allocation Shift

  Without This Architecture ❌

  90% time: Dealing with 12 different APIs
  ├── CoinGecko authentication changes
  ├── TwelveData rate limiting
  ├── Yahoo Finance schema updates
  ├── Binance connection issues
  └── Manual schema maintenance

  10% time: Actual trading logic

  With This Architecture ✅

  10% time: MCP integration (once per source)
  └── Implement response handler per DSL method

  90% time: Business logic using DSL
  ├── Trading strategies
  ├── Risk algorithms
  ├── Portfolio optimization
  └── Market analysis

  🎯 The Strategic Value

  You're building a financial data platform where:
  - Data sources are commoditized (handled by MCP)
  - DSL interface is your competitive moat (business language)
  - Business logic is where value creation happens

  The architecture lets you focus on what makes money (trading algorithms, risk management) instead of plumbing
  (API wrappers, schema maintenance).

  This is strategic architecture - it pushes commodity work down to MCP layer so you can focus on high-value
  business logic using a clean, financial domain-specific language.
