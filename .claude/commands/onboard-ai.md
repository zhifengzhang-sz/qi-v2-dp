# Onboard AI Assistant

You're now working on the **Data Platform Actor System** - a production-ready 2-layer actor architecture for cryptocurrency data processing.

## CRITICAL: Read these files BEFORE making any suggestions:

1. **docs/ai-knowledge/PROJECT-CONTEXT.md** - Complete project overview and current state
2. **docs/impl/architecture.md** - 2-layer architecture with Mermaid diagrams
3. **docs/ai-knowledge/AI-HANDOFF-GUIDE.md** - Implementation patterns and guidelines
4. **app/demos/end-to-end-pipeline-demo.ts** - Working pipeline example

## Project Architecture (2-Layer System):

### **Layer 1: Base Infrastructure** (`lib/src/base/`)
- **Database Infrastructure**: TimescaleDB, Drizzle ORM, schemas
- **Streaming Infrastructure**: Redpanda/Kafka clients  
- **Base Agent Framework**: Core agent lifecycle and error handling

### **Layer 2: DSL Actors** (`lib/src/abstract/`, `lib/src/sources/`, `lib/src/targets/`)
- **Abstract DSL Foundation**: Unified interfaces, base classes, data types
- **Sources**: CoinGecko (MCP integration), Redpanda (streaming consumer)
- **Targets**: Redpanda (streaming producer), TimescaleDB (database storage)

## Current Implementation Status:

- ✅ **Complete 2-layer architecture** - All components implemented and working
- ✅ **External MCP integration** - CoinGecko MCP server (46 tools, live data)
- ✅ **Real data flows** - Bitcoin $109,426, Market Cap $3.45T (live)
- ✅ **Plugin pattern** - Zero code duplication across implementations
- ✅ **Complete documentation** - Architecture, APIs, examples
- ✅ **Working demos** - Individual actors and end-to-end pipelines

## Project Standards:

### **Architecture Principles**:
- **Plugin Pattern**: Layer 1 provides DSL + workflow, Layer 2 implements plugins only
- **Technology Agnostic**: Same DSL interface regardless of underlying technology  
- **MCP Integration**: Direct external server connections within actors
- **Functional Error Handling**: Result<T> = Either<QiError, T> throughout
- **Real Data Only**: No mock implementations, everything works with live services

### **Implementation Patterns**:
```typescript
// ✅ Correct: Extend base class, implement plugins only
class NewSourceActor extends BaseReader {
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // Technology-specific implementation only
  }
  
  protected transformCurrentPrice(data: any): number {
    // Data transformation only
  }
  
  // All DSL methods inherited automatically
}
```

## NEVER suggest:

❌ Rebuilding base infrastructure (Layer 1 is production-ready)  
❌ Rebuilding abstract DSL foundation (Plugin pattern is complete)  
❌ Fake/mock implementations (Everything uses real external services)  
❌ Direct API calls when MCP servers exist  
❌ Breaking the plugin pattern (DSL methods should not be implemented in concrete classes)

## ALWAYS use:

✅ **Plugin pattern** - Extend BaseReader/BaseWriter, implement plugins only  
✅ **Factory functions** - Use existing `create*()` functions  
✅ **Real implementations** - Connect to actual external services  
✅ **Existing components** - Build on what's already working  
✅ **Current architecture** - Follow the 2-layer DSL actor system

## Development Opportunities:

### **New Source Actors**:
- TwelveData integration (stock market data)
- News API sources (sentiment analysis)
- On-chain data sources (blockchain metrics)

### **New Target Actors**:
- ClickHouse target (analytics database)  
- File system targets (CSV, JSON outputs)
- API targets (webhooks, REST APIs)

### **Service Layer (Future)**:
- MCP servers using Layer 2 actors as building blocks
- Business logic services (trading algorithms, analytics)
- Service orchestration (complex workflows)

## Your Mission:

1. **Maintain architecture quality** - Keep 2-layer DSL actor pattern intact
2. **Build on existing foundation** - Use Layer 1 infrastructure and Layer 2 abstractions
3. **Follow plugin pattern** - Implement only technology-specific plugins
4. **Use real data** - Connect to actual external services and APIs
5. **Document additions** - Follow established documentation patterns

## Success Verification:

You understand the project when you can:
- Explain the 2-layer architecture and plugin pattern benefits
- Create new actors by extending BaseReader/BaseWriter
- Use MCP clients for external data source integration  
- Build complete data pipelines using actor composition
- Reference the correct file paths for current implementation

**Confirm understanding by explaining the current 2-layer architecture and plugin pattern before proceeding with any suggestions.**