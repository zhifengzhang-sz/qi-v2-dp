# QiCore Data Platform - Project Context

## 🎯 **Current Reality (2025-07-07)**

This is a **production-ready cryptocurrency data platform** with complete 2-layer actor architecture. The unified DSL abstraction and MCP integration are fully implemented and working with real external data sources.

---

## 📋 **Quick Status Check**

```bash
# Test the working architecture
bun run app/demos/sources/coingecko-source-demo.ts
bun run app/demos/end-to-end-pipeline-demo.ts

# Verify structure
ls lib/src/abstract/         # Layer 1: Base abstractions
ls lib/src/sources/          # Layer 2: Source actors  
ls lib/src/targets/          # Layer 2: Target actors
ls docs/impl/               # Complete documentation
```

---

## ✅ **Current Architecture (COMPLETE)**

### **2-Layer Actor System**

**Layer 1: Base Foundation (`lib/src/abstract/`)**
- ✅ **DSL Interfaces**: Unified `MarketDataReadingDSL` and `MarketDataWritingDSL`
- ✅ **Data Types**: Independent `MarketDataTypes.ts` with `CryptoPriceData`, `CryptoOHLCVData`
- ✅ **Abstract Classes**: `BaseReader` and `BaseWriter` with workflow abstraction
- ✅ **Plugin Pattern**: Common workflow captured once, technology-specific plugins

**Layer 2: Concrete Actors (`lib/src/sources/`, `lib/src/targets/`)**
- ✅ **CoinGecko Source**: Direct MCP integration with external server
- ✅ **Redpanda Source**: Stream-based data consumption  
- ✅ **Redpanda Target**: Stream-based data publishing
- ✅ **TimescaleDB Target**: Database storage with optimized schemas

### **MCP Integration Architecture**
- ✅ **External MCP Server**: `https://mcp.api.coingecko.com/sse` (verified working)
- ✅ **Live Data**: Bitcoin $109,426, Market Cap $3.45T (real-time)
- ✅ **Direct Integration**: MCP clients created and managed within actors
- ✅ **SSE Transport**: Server-sent events for real-time updates

---

## 🏗️ **Project Structure (FINAL)**

```
lib/src/
├── abstract/                    # Layer 1: Base Foundation
│   ├── dsl/                    # DSL interface definitions
│   │   ├── MarketDataReadingDSL.ts    # Unified reading interface
│   │   ├── MarketDataWritingDSL.ts    # Unified writing interface 
│   │   ├── MarketDataTypes.ts         # Independent data types
│   │   └── index.ts                   # Type exports
│   ├── readers/                # Base reader implementations
│   │   └── BaseReader.ts              # Abstract reader with workflow
│   └── writers/                # Base writer implementations
│       └── BaseWriter.ts              # Abstract writer with workflow

├── sources/                     # Layer 2: Data Sources
│   ├── coingecko/              # CoinGecko API integration
│   │   ├── MarketDataReader.ts        # Direct MCP integration
│   │   └── index.ts                   # Exports and utilities
│   └── redpanda/               # Redpanda streaming source
│       ├── MarketDataReader.ts        # Stream consumer actor
│       └── index.ts                   # Exports and utilities

├── targets/                     # Layer 2: Data Targets
│   ├── redpanda/               # Redpanda streaming target
│   │   ├── MarketDataWriter.ts        # Stream publisher actor
│   │   └── index.ts                   # Exports and utilities
│   └── timescale/              # TimescaleDB target
│       ├── MarketDataWriter.ts        # Database writer actor
│       └── index.ts                   # Exports and utilities

└── qicore/                     # Core QiCore framework
    └── base/                   # Result<T> and error handling
        ├── result.ts                  # fp-ts Either<QiError, T>
        ├── error.ts                   # QiError types
        └── index.ts                   # Framework exports
```

---

## 🚀 **Working Demos (VERIFIED)**

### **Individual Actor Demos**
```bash
# CoinGecko source with live external MCP server
bun run app/demos/sources/coingecko-source-demo.ts

# Redpanda target for streaming data
bun run app/demos/targets/redpanda-target-demo.ts

# TimescaleDB target for database storage
bun run app/demos/targets/timescale-target-demo.ts
```

### **End-to-End Pipeline**
```bash
# Complete pipeline: CoinGecko → Redpanda → TimescaleDB
bun run app/demos/end-to-end-pipeline-demo.ts
```

### **Verified Functionality**
- ✅ **Real External Data**: Live Bitcoin prices from CoinGecko MCP server
- ✅ **Unified DSL**: Same interface across all data sources and targets
- ✅ **Error Handling**: Functional Result<T> pattern with proper validation
- ✅ **Plugin Architecture**: Zero DSL code duplication between actors

---

## 🎯 **Implementation Guidelines**

### **Architectural Principles**
1. **Plugin Pattern**: Layer 1 provides workflow, Layer 2 implements only plugins
2. **Technology Agnostic**: Same DSL interface regardless of underlying technology
3. **MCP Integration**: Direct integration within actors, no wrapper classes
4. **Functional Error Handling**: Result<T> = Either<QiError, T> throughout
5. **Real Data Only**: No mock implementations, everything works with live services

### **Adding New Actors**
```typescript
// Step 1: Extend appropriate base class
class NewSourceActor extends BaseReader {
  // Step 2: Implement only the plugin methods
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // Technology-specific implementation
  }

  protected transformCurrentPrice(data: any): number {
    // Data transformation logic
  }

  // Step 3: All DSL methods inherited automatically
}
```

### **MCP Client Integration**
```typescript
// Direct MCP client creation and management
class SomeActor extends BaseReader {
  private mcpClient: Client;

  async initialize(): Promise<Result<void>> {
    // Create and connect MCP client
    this.mcpClient = new Client({...});
    const transport = new SSEClientTransport(new URL("external-server"));
    await this.mcpClient.connect(transport);
    
    // Register with base class client management
    this.addClient("mcp-client", this.mcpClient, {
      name: "mcp-client",
      type: "data-source"
    });
  }
}
```

---

## 📚 **Documentation (COMPLETE)**

### **Implementation Documentation**
- ✅ **`docs/impl/architecture.md`**: Complete 2-layer architecture documentation
- ✅ **`docs/impl/abstract.md`**: Layer 1 base abstractions
- ✅ **`docs/impl/sources.md`**: Layer 2 source actors
- ✅ **`docs/impl/targets.md`**: Layer 2 target actors

### **API Reference**
- ✅ **DSL Interface**: Complete MarketDataReadingDSL and MarketDataWritingDSL
- ✅ **Data Types**: All CryptoPriceData, CryptoOHLCVData, CryptoMarketAnalytics
- ✅ **Plugin Contracts**: Abstract methods for technology-specific implementations
- ✅ **Result Types**: Functional error handling patterns

---

## 🧪 **Testing Status**

### **Current Test Coverage**
- ✅ **Demo Validation**: All demos work with real external data
- ✅ **MCP Integration**: External CoinGecko server verified working
- ✅ **Architecture Proof**: Plugin pattern reduces code duplication to zero

### **Next: Unit Test Implementation**
- 🔄 **DSL Interface Tests**: Test every method in MarketDataReadingDSL/WritingDSL
- 🔄 **Base Module Tests**: Test workflow abstraction and error handling
- 🔄 **Actor Tests**: Test plugin implementations and data transformations
- 🔄 **Integration Tests**: Test complete pipelines with mock external services

---

## 🌟 **Foundation for Layer 3: Service Layer**

The current 2-layer architecture is the **foundation for Layer 3** where we will build **MCP servers** using Layer 2 actors.

### **Layer 3 Vision**
```typescript
// Future: MCP Server composition using Layer 2 actors
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
    // Route to appropriate Layer 2 actor using unified DSL
  }
}
```

---

## ⚡ **Quick Start Commands**

```bash
# Verify the complete architecture
bun run app/demos/sources/coingecko-source-demo.ts

# Test end-to-end pipeline  
bun run app/demos/end-to-end-pipeline-demo.ts

# Check TypeScript compilation
bun run typecheck

# View architecture documentation
cat docs/impl/architecture.md

# Explore the codebase structure
ls lib/src/abstract/         # Layer 1: Foundation
ls lib/src/sources/          # Layer 2: Sources  
ls lib/src/targets/          # Layer 2: Targets
```

---

## 🚨 **Current Understanding Verification**

You understand the project when you can:

### **2-Layer Architecture** ✅
- [x] Explain: Layer 1 provides DSL + workflow, Layer 2 implements plugins only
- [x] Implement: New actors by extending BaseReader/BaseWriter
- [x] Utilize: Plugin pattern to eliminate code duplication
- [x] Follow: Unified DSL interface across all technologies

### **MCP Integration** ✅  
- [x] Create: Direct MCP client connections within actors
- [x] Connect: To external MCP servers (e.g., CoinGecko SSE)
- [x] Integrate: MCP responses with Result<T> error handling
- [x] Manage: Client lifecycle through BaseReader/BaseWriter

### **Working System** ✅
- [x] Use: Real external data sources (no mocks)
- [x] Handle: Functional error handling with Result<T>
- [x] Build: Complete data pipelines using actor composition
- [x] Test: All implementations with live API data

---

## ✅ **Success Indicators**

- ✅ **Architecture Complete**: 2-layer system fully implemented and documented
- ✅ **Real Data Flows**: External MCP server integration verified working  
- ✅ **Zero Code Duplication**: Plugin pattern eliminates DSL implementation repetition
- ✅ **Production Ready**: All demos work with real cryptocurrency market data
- ✅ **Foundation Ready**: Prepared for Layer 3 MCP server development

---

**Last Updated**: 2025-07-07  
**Project Status**: 2-layer architecture complete, ready for Layer 3 service development  
**Next Milestone**: Comprehensive unit test coverage and Layer 3 MCP server implementation