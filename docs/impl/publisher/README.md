# Publisher Module Documentation

## Overview

The Publisher module handles **data acquisition** from external sources in the QiCore Crypto Data Platform. Publishers follow the **Actor/MCP pattern** for clean separation of concerns.

## Architecture Pattern

```
🎭 Actor = Special MCP Client that provides DSL tooling interfaces
🤖 Agent = Special QiAgent with workflow composed of Actors
🔧 DSL = Domain-specific tooling interfaces (the Actor's specialty)
📡 MCP = Protocol + Server + Local tools integration
```

## Key Concepts

### Actor vs Agent (Refined Definition)

- **Actor**: Special MCP Client that provides DSL tooling interfaces
  - MCP Client uses tools from: Tool module (local) + MCP server tools
  - Specialty: DSL tooling interfaces for particular task domain
  - Implementation: DSL wraps MCP tools with domain-specific interfaces
  - Examples: `CoinGeckoActor` (crypto DSL), `TwelveDataActor` (stock DSL)

- **Agent**: Special QiAgent with workflow composed of Actors
  - Workflow composed of multiple nodes, each node associates one or more Actors
  - Each workflow node uses specific Actors to accomplish tasks
  - AI-powered decision making and workflow orchestration
  - Examples: `TradingAgent` (uses CoinGecko + TwelveData Actors), `MarketAnalysisAgent`

## Current Publishers

### 1. CoinGecko Publisher
- **Type**: Actor (MCP Client + DSL)
- **Path**: `lib/src/publishers/sources/coingecko/`
- **Status**: ✅ Production Ready (87.5% test success)

**Components:**
- `CoinGeckoActor` - Main actor class (MCP Client + DSL)
- `CoinGeckoDSL` - Financial market DSL with 24 MCP tools
- `CoinGeckoMCPLauncher` - MCP server management

**Capabilities:**
- Date-range OHLCV queries: `getOHLCVByDateRange()`
- Real-time streaming: `streamRealtimeOHLCV()`, `streamLevel1Data()`
- Level 1 market data: `getLevel1Data()` with bid/ask spreads
- Symbol resolution: BTC → bitcoin automatic conversion
- Market analytics: `getMarketAnalytics()`

### 2. TwelveData Publisher
- **Type**: Actor (planned)
- **Path**: `lib/src/publishers/sources/twelvedata/`
- **Status**: 📋 TODO

## Usage Examples

### Basic Actor Usage
```typescript
import { createCoinGeckoActor } from '@qicore/crypto-data-platform/coingecko';

// Create actor for data operations
const actor = createCoinGeckoActor({
  name: 'crypto-data-actor',
  coinGeckoConfig: {
    apiKey: process.env.COINGECKO_API_KEY,
    environment: 'demo',
  }
});

await actor.initialize();

// Execute data operations
const prices = await actor.getCurrentPrices(['bitcoin', 'ethereum']);
const ohlcv = await actor.getOHLCVByDateRange({
  ticker: 'BTC',
  dateStart: new Date('2024-01-01'),
  dateEnd: new Date('2024-01-31'),
  interval: '1d'
});

await actor.cleanup();
```

### Financial Market DSL
```typescript
// Level 1 market data
const level1 = await actor.getLevel1Data({
  ticker: 'BTC',
  market: 'USD'
});
console.log(`Bid: $${level1.bestBid}, Ask: $${level1.bestAsk}`);

// Real-time streaming
const stopStream = await actor.streamLevel1Data(
  { ticker: 'ETH', market: 'USD' },
  (data) => console.log(`ETH: $${data.bestBid}/$${data.bestAsk}`),
  { pollIntervalMs: 5000 }
);
```

## Testing

### Test Files Location
- Path: `tests/`
- **DSL Verification**: `test-dsl-mcp-verification.ts` (87.5% success)
- **Financial DSL**: `test-financial-dsl.ts`
- **Actor Integration**: `test-with-api-key.ts`

### Verified MCP Tool Mappings
- `getCurrentPrices()` → `get_simple_price`
- `getPrice('BTC')` → `get_search` + `get_simple_price` 
- `getOHLCVByDateRange()` → `get_range_coins_ohlc`
- `getMarketAnalytics()` → `get_global`
- `getLevel1Data()` → `get_search` + `get_simple_price`

## Data Attribution

All publishers must comply with data source attribution requirements:

**CoinGecko**: "Data provided by CoinGecko (https://www.coingecko.com)"
- Implemented in all data structures
- Required for commercial usage
- See: `docs/ATTRIBUTION-COMPLIANCE.md`

## Future Publishers

### Planned Actors
1. **TwelveDataActor** - Stock market and forex data
2. **NewsActor** - Crypto news and sentiment data
3. **OnChainActor** - Blockchain metrics and analytics

### Integration Pattern: Agent Workflow Composed of Actors
```typescript
// Agent = Special QiAgent with workflow composed of Actors
// Each workflow node associates one or more Actors to do the job
class MarketAnalysisAgent extends BaseAgent {
  private coinGeckoActor: CoinGeckoActor;      
  private twelveDataActor: TwelveDataActor;    
  private newsActor: NewsActor;                
  
  async executeAnalysis(): Promise<MarketInsights> {
    // Agent workflow: each node associates specific Actor(s)
    const workflow = this.createWorkflow([
      // Node 1: Associates CoinGeckoActor for crypto data
      {
        name: 'gatherCryptoData',
        actors: [this.coinGeckoActor],
        execute: async () => this.coinGeckoActor.getCryptoData({
          coinIds: ['bitcoin', 'ethereum'],
          dataTypes: ['price', 'analytics']
        })
      },
      
      // Node 2: Associates TwelveDataActor for stock data
      {
        name: 'gatherStockData', 
        actors: [this.twelveDataActor],
        execute: async () => this.twelveDataActor.getMarketData({
          symbols: ['AAPL', 'MSFT'],
          dataTypes: ['price', 'fundamentals']
        })
      },
      
      // Node 3: Associates NewsActor for sentiment data
      {
        name: 'gatherNewsData',
        actors: [this.newsActor],
        execute: async () => this.newsActor.getCryptoNews({
          coins: ['bitcoin', 'ethereum'],
          sentiment: true
        })
      },
      
      // Node 4: Associates multiple Actors for cross-correlation analysis
      {
        name: 'analyzeCorrelation',
        actors: [this.coinGeckoActor, this.twelveDataActor, this.newsActor],
        execute: async (cryptoData, stockData, newsData) => 
          this.analyzeCorrelation(cryptoData, stockData, newsData)
      },
      
      // Node 5: Agent AI decision making (no Actor association)
      {
        name: 'generateInsights',
        actors: [],
        execute: async (analysis) => this.generateInsights(analysis)
      }
    ]);
    
    return await workflow.execute();
  }
}
```

## Development Guidelines

### Creating New Publishers

1. **Choose Pattern**: Actor (data operations) vs Agent (AI decisions)
2. **Follow Structure**: 
   ```
   sources/[source-name]/
   ├── [source]-actor.ts     # Main actor class
   ├── [source]-dsl.ts       # Domain-specific language
   ├── index.ts              # Exports and factories
   └── types.ts              # TypeScript definitions
   ```
3. **Implement Tests**: DSL verification, integration tests
4. **Add Documentation**: Module-specific docs in `docs/impl/publisher/`

### Code Standards
- **TypeScript Strict**: Full type safety
- **Attribution Compliance**: All data sources properly attributed
- **Error Handling**: Comprehensive error recovery
- **MCP Tool Verification**: Test each DSL method → MCP tool mapping

---

**Next**: See individual module documentation for detailed implementation guides.