# QiCore Data Platform - AI Knowledge Directory

## 🎯 **Current Project State (2025-07-07)**

This is a **production-ready cryptocurrency data platform** with complete 2-layer actor architecture. The unified DSL abstraction and MCP integration are fully implemented and working with real external data sources.

---

## ✅ **Current Architecture (COMPLETE)**

### **2-Layer Actor System**
- **Layer 1**: Base abstractions (`lib/src/abstract/`) - DSL interfaces, workflow abstraction
- **Layer 2**: Concrete actors (`lib/src/sources/`, `lib/src/targets/`) - Technology-specific implementations

### **Key Components**
- ✅ **Unified DSL**: MarketDataReadingDSL and MarketDataWritingDSL interfaces
- ✅ **Plugin Pattern**: BaseReader/BaseWriter abstract classes with workflow abstraction
- ✅ **MCP Integration**: Direct external server connections (CoinGecko MCP server)
- ✅ **Real Data Flows**: Live Bitcoin prices, market analytics, complete pipelines
- ✅ **Functional Error Handling**: Result<T> = Either<QiError, T> throughout

---

## 📚 **AI Knowledge Files**

### **Current Project Context**
- **`PROJECT-CONTEXT.md`** ✅ - Complete and accurate project overview
- **`AI-HANDOFF-GUIDE.md`** - Guidelines for AI agent handoffs
- **`ONBOARD-AI-COMMAND.md`** - Quick onboarding commands

### **Implementation Guides**  
- **`QUICK-START-AGENT-MCP.md`** - MCP client integration patterns
- **`TRAINING-DATA-WORKFLOW.md`** - Development workflow documentation
- **`WEB-RESEARCH-GUIDE.md`** - Research methodology

### **Knowledge Transfer**
- **`KNOWLEDGE-TRANSFER-COMPLETE.md`** - Project completion markers
- **`training-examples.jsonl`** - Training data examples

---

## 🏗️ **Architecture Reference**

### **Quick Structure Overview**
```
lib/src/
├── abstract/           # Layer 1: Base Foundation
│   ├── dsl/           # DSL interface definitions
│   ├── readers/       # BaseReader abstract class
│   └── writers/       # BaseWriter abstract class
├── sources/           # Layer 2: Data Sources  
│   ├── coingecko/     # CoinGecko MCP integration
│   └── redpanda/      # Redpanda streaming source
└── targets/           # Layer 2: Data Targets
    ├── redpanda/      # Redpanda streaming target
    └── timescale/     # TimescaleDB target
```

### **Working Demos**
```bash
# Individual actor demos
bun run app/demos/sources/coingecko-source-demo.ts
bun run app/demos/targets/redpanda-target-demo.ts
bun run app/demos/targets/timescale-target-demo.ts

# End-to-end pipeline
bun run app/demos/end-to-end-pipeline-demo.ts
```

---

## 🎯 **Implementation Patterns**

### **Adding New Actors**
```typescript
// Extend appropriate base class
class NewActor extends BaseReader {
  // Implement only technology-specific plugins
  protected async getCurrentPricePlugin(...): Promise<any> {
    // Technology-specific implementation
  }
  
  protected transformCurrentPrice(data: any): number {
    // Data transformation
  }
  
  // All DSL methods inherited automatically
}
```

### **MCP Client Integration**
```typescript
// Direct MCP client creation and management
async initialize(): Promise<Result<void>> {
  this.mcpClient = new Client({...});
  const transport = new SSEClientTransport(new URL("external-server"));
  await this.mcpClient.connect(transport);
  
  this.addClient("mcp-client", this.mcpClient, {
    name: "mcp-client",
    type: "data-source"
  });
}
```

---

## 🧪 **Testing & Verification**

### **Current Verification**
- ✅ **External MCP Server**: `https://mcp.api.coingecko.com/sse` verified working
- ✅ **Live Data**: Bitcoin $109,426, Market Cap $3.45T (real-time)
- ✅ **Plugin Architecture**: Zero DSL code duplication between actors
- ✅ **Complete Pipelines**: End-to-end data flows working

### **Next: Unit Test Coverage**
- 🔄 **DSL Interface Tests**: Test every method in reading/writing DSL
- 🔄 **Base Module Tests**: Test workflow abstraction and error handling
- 🔄 **Actor Integration Tests**: Test complete pipelines with mock services

---

## 🌟 **Foundation for Layer 3**

The current 2-layer architecture provides the foundation for **Layer 3: Service Layer** where we will build MCP servers using Layer 2 actors.

### **Layer 3 Vision**
```typescript
// Future: MCP Server built on Layer 2 actors
class CryptoDataMCPServer extends MCPServer {
  constructor() {
    // Compose Layer 2 actors
    this.sources = { coingecko: createCoinGeckoMarketDataReader({...}) };
    this.targets = { timescale: createTimescaleMarketDataWriter({...}) };
  }
  
  // Expose Layer 2 functionality as MCP tools
  async handleToolCall(toolName: string, args: any): Promise<MCPResponse> {
    // Route to appropriate Layer 2 actor using unified DSL
  }
}
```

---

## ⚡ **Quick AI Onboarding**

### **Understand the System**
1. **Read**: `PROJECT-CONTEXT.md` for complete current state
2. **Explore**: `docs/impl/architecture.md` for detailed architecture
3. **Test**: `bun run app/demos/sources/coingecko-source-demo.ts`
4. **Study**: `lib/src/abstract/` for Layer 1 foundation

### **Key Principles**
- **Plugin Pattern**: Layer 1 provides workflow, Layer 2 implements plugins only
- **Real Data Only**: No mock implementations, everything works with live services  
- **MCP Integration**: Direct external server connections within actors
- **Functional Errors**: Result<T> = Either<QiError, T> throughout

### **Success Verification**
You understand the project when you can:
- Explain the 2-layer architecture and plugin pattern
- Implement new actors by extending BaseReader/BaseWriter
- Use MCP clients for external data source integration
- Build complete data pipelines using actor composition

---

**Last Updated**: 2025-07-07  
**Architecture Status**: 2-layer system complete and verified working  
**Next Phase**: Comprehensive unit test coverage and Layer 3 MCP server development