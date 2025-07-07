# Claude Context for QiCore Crypto Data Platform

## Project Context

This is the **QiCore Crypto Data Platform** - a production-ready cryptocurrency data processing platform with complete 2-layer actor architecture. The unified DSL abstraction and MCP integration are fully implemented and working with real external data sources.

## Current Status: ✅ ARCHITECTURE COMPLETE

### What's Already Built (Don't Rebuild)
- ✅ **2-Layer Actor System**: Complete plugin architecture with zero code duplication
- ✅ **Layer 1 Foundation**: DSL interfaces, workflow abstraction, and base classes
- ✅ **Layer 2 Actors**: CoinGecko, Redpanda, TimescaleDB implementations
- ✅ **External MCP Integration**: Working with `https://mcp.api.coingecko.com/sse`
- ✅ **Real Data Flows**: Live Bitcoin prices, market analytics, end-to-end pipelines
- ✅ **Comprehensive Tests**: DSL interfaces, base modules, and integration tests
- ✅ **Complete Documentation**: Architecture, implementation guides, AI knowledge

### Current Phase: Foundation for Layer 3
- ✅ **Main Achievement**: 2-layer architecture complete and verified working
- ✅ **MCP Experience**: Direct external server integration proven successful
- 🔄 **Next Phase**: Build Layer 3 MCP servers using Layer 2 actors
- 🔄 **Goal**: Compose actors into services for external MCP tool exposure

## Key Technical Architecture

### 2-Layer System (COMPLETE)
- **Layer 1 (`lib/src/abstract/`)**: Base abstractions providing DSL + workflow
- **Layer 2 (`lib/src/sources/`, `lib/src/targets/`)**: Technology-specific plugins only
- **Plugin Pattern**: BaseReader/BaseWriter capture all workflow, actors implement plugins only

### Framework Usage (CURRENT)
- **Runtime**: Bun v3.0+ with native TypeScript support
- **Error Handling**: `Result<T> = Either<QiError, T>` functional pattern throughout
- **MCP Integration**: Direct external server connections within actors
- **Testing**: Vitest with comprehensive coverage (basic + integration tests)

### Correct Imports (CURRENT)
```typescript
// Layer 1 - Base abstractions
import { BaseReader } from '../abstract/readers/BaseReader';
import { BaseWriter } from '../abstract/writers/BaseWriter';

// Layer 2 - Concrete actors
import { createCoinGeckoMarketDataReader } from '../sources/coingecko';
import { createTimescaleMarketDataWriter } from '../targets/timescale';

// Core framework
import { isSuccess, isFailure, getData, getError } from '../qicore/base';

// MCP integration
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
```

## Response Guidelines

### Communication Style
- **Be concise**: User prefers direct, actionable responses
- **Focus on current architecture**: Reference the actual 2-layer system
- **Acknowledge completed work**: The architecture is done, don't rebuild it
- **Use correct file paths**: Reference actual implementation structure

### Code Standards
- **Plugin Pattern Only**: Never implement DSL methods in Layer 2 actors
- **Real Data Only**: All implementations must work with live external services
- **TypeScript Strict**: Complete type safety throughout the system
- **Result<T> Pattern**: Use functional error handling everywhere

### Documentation Updates
- **Keep current**: Documentation now matches actual implementation
- **Cross-reference**: Link to `docs/impl/architecture.md` for details
- **Update examples**: Ensure code examples reflect plugin pattern

## Current Architecture Status

### Layer 1 Foundation ✅
```typescript
// BaseReader provides DSL implementation + workflow
abstract class BaseReader implements MarketDataReadingDSL {
  // Workflow abstraction - captures repetitive patterns
  protected async workflow<TResult>(
    pluginFn: () => Promise<any>,
    transform: (data: any) => TResult,
    errorCode: string,
    validator?: (data: any) => boolean
  ): Promise<Result<TResult>>

  // Plugin contract - concrete classes implement these only
  protected abstract getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any>;
  protected abstract transformCurrentPrice(data: any): number;
}
```

### Layer 2 Implementation ✅
```typescript
// CoinGecko actor - implements plugins only, inherits ALL DSL methods
class CoinGeckoMarketDataReader extends BaseReader {
  private mcpClient: Client;

  async initialize(): Promise<Result<void>> {
    // Direct MCP client creation
    this.mcpClient = new Client({...});
    const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));
    await this.mcpClient.connect(transport);
    
    // Register with BaseReader client management
    this.addClient("coingecko-mcp", this.mcpClient, {
      name: "coingecko-mcp",
      type: "data-source"
    });
  }

  // ONLY implement plugins - DSL methods inherited automatically
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency }
    });
  }

  protected transformCurrentPrice(data: any): number {
    const extracted = this.extractMCPData(data);
    return extracted[0].current_price;
  }

  // ALL DSL methods available automatically:
  // getCurrentPrice(), getCurrentPrices(), getMarketAnalytics(), etc.
}
```

## File Structure Reference

```
/home/zzhang/dev/qi/github/qi-v2-dp/
├── lib/src/
│   ├── abstract/                    # Layer 1: Base Foundation
│   │   ├── dsl/                    # DSL interface definitions
│   │   ├── readers/BaseReader.ts   # Workflow + DSL implementation
│   │   └── writers/BaseWriter.ts   # Publishing workflow + DSL
│   ├── sources/                    # Layer 2: Data Sources
│   │   ├── coingecko/             # ✅ External MCP integration
│   │   └── redpanda/              # ✅ Streaming source
│   ├── targets/                   # Layer 2: Data Targets
│   │   ├── redpanda/              # ✅ Streaming target
│   │   └── timescale/             # ✅ Database target
│   └── qicore/base/               # ✅ Result<T> system
├── app/demos/                     # ✅ Working demos
├── lib/tests/                     # ✅ Comprehensive test suite
├── docs/impl/architecture.md      # ✅ Complete 2-layer documentation
├── docs/ai-knowledge/             # ✅ Updated AI context
└── CLAUDE.md                      # ✅ This context file
```

## Architecture Principles (PROVEN)

### ✅ Plugin Pattern Benefits
- **Zero Code Duplication**: DSL implementation captured once in Layer 1
- **Type Safety**: Complete TypeScript support maintained throughout
- **Scalability**: Easy to add new data sources using same pattern
- **Maintainability**: Changes to DSL affect all actors automatically

### ✅ MCP Integration Pattern
- **Direct Client Creation**: No wrapper classes needed
- **External Server Proven**: `https://mcp.api.coingecko.com/sse` working
- **Real Data Verified**: Live Bitcoin prices, $3.45T market cap
- **Client Management**: Unified lifecycle through BaseReader

### ✅ Functional Error Handling
- **Result<T> Throughout**: `Either<QiError, T>` pattern everywhere
- **Composable Operations**: Chain operations without exception handling
- **Type Safety**: Compile-time guarantees for error scenarios

## Common Mistakes to Avoid

### ❌ Don't Do This
- **Rebuild the architecture**: The 2-layer system is complete and working
- **Implement DSL methods in actors**: They're inherited from BaseReader
- **Create wrapper classes**: Direct MCP integration is the pattern
- **Use mock data**: All implementations work with real external services
- **Ignore plugin pattern**: Layer 2 implements plugins only

### ✅ Do This Instead
- **Extend BaseReader/BaseWriter**: Get all DSL functionality for free
- **Implement plugins only**: Technology-specific data fetching and transformation
- **Use direct MCP clients**: Create and manage clients within actors
- **Follow working examples**: Study CoinGecko, Redpanda, TimescaleDB actors
- **Build on the foundation**: Architecture is ready for Layer 3 development

## Development Context

### User Preferences
- **Production focus**: Build real systems, not prototypes
- **Architecture consistency**: Follow the proven 2-layer pattern
- **Working implementations**: Everything must work with live data
- **Comprehensive testing**: Verify functionality with real external services

### Verified Working Components
1. **External MCP Server**: CoinGecko integration with live cryptocurrency data
2. **Plugin Architecture**: Zero DSL duplication confirmed by tests
3. **Unified Data Types**: Consistent interfaces across all technologies
4. **Error Handling**: Result<T> pattern working throughout system
5. **Test Coverage**: Comprehensive suite covering all major components

## Layer 3 Vision (Next Phase)

### MCP Server Development
```typescript
// Future: MCP Server built on Layer 2 actors
class CryptoDataMCPServer extends MCPServer {
  constructor() {
    // Compose existing Layer 2 actors
    this.sources = {
      coingecko: createCoinGeckoMarketDataReader({...}),
      redpanda: createRedpandaMarketDataReader({...})
    };
    this.targets = {
      timescale: createTimescaleMarketDataWriter({...}),
      redpanda: createRedpandaMarketDataWriter({...})
    };
  }

  // Expose Layer 2 functionality as MCP tools
  async handleToolCall(toolName: string, args: any): Promise<MCPResponse> {
    switch (toolName) {
      case "get_crypto_price":
        return this.sources.coingecko.getCurrentPrice(args.coinId);
      case "store_crypto_data":
        return this.targets.timescale.publishPrice(args.data);
    }
  }
}
```

## Quick Commands

### Test the Architecture
```bash
# Verify basic architecture
bun test lib/tests/basic-architecture.test.ts

# Test external MCP integration
bun test lib/tests/integration/complete-system.test.ts

# Run individual actor demos
bun run app/demos/sources/coingecko-source-demo.ts
bun run app/demos/end-to-end-pipeline-demo.ts
```

### Explore the Implementation
```bash
# Study the 2-layer architecture
cat docs/impl/architecture.md

# Examine Layer 1 foundation
ls lib/src/abstract/

# Review Layer 2 actors
ls lib/src/sources/ lib/src/targets/

# Check working demos
ls app/demos/
```

## Success Metrics (ACHIEVED)

- ✅ **2-Layer Architecture**: Complete implementation with plugin pattern
- ✅ **External MCP Integration**: Working with real CoinGecko server
- ✅ **Zero Code Duplication**: Plugin pattern eliminates DSL repetition
- ✅ **Real Data Flows**: Live cryptocurrency data in all demos
- ✅ **Comprehensive Tests**: Architecture and functionality verified
- ✅ **Complete Documentation**: Implementation guides and AI knowledge
- ✅ **Foundation Ready**: Prepared for Layer 3 MCP server development

---

**Remember**: This project has a **complete, working 2-layer architecture**. Build Layer 3 services by composing existing Layer 2 actors, don't rebuild the foundation.

**Last Updated**: 2025-07-07 - Architecture complete, ready for Layer 3 development