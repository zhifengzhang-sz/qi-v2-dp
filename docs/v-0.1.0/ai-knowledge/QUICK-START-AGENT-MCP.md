# Quick Start: 2-Layer Actor/MCP Architecture

## 🚨 **For AI Models/Developers: READ THIS FIRST**

**This project uses a production-ready 2-layer actor architecture with direct MCP integration. The plugin pattern eliminates all code duplication while maintaining type safety.**

## ⚡ **Quick Reference**

### **Before You Code - Understand the Architecture:**

1. **Layer 1 (Base Foundation)**: Provides DSL interface + workflow abstraction
2. **Layer 2 (Concrete Actors)**: Implements only technology-specific plugins 
3. **MCP Integration**: Direct client creation within actors, no wrapper classes

### **Current Implementation Status:**
- ✅ **CoinGecko Actor**: Working with external MCP server (`https://mcp.api.coingecko.com/sse`)
- ✅ **Redpanda Actors**: Stream-based data sources and targets
- ✅ **TimescaleDB Actor**: Database storage with optimized schemas
- ✅ **End-to-End Pipelines**: Complete data flows with real cryptocurrency data

## 🏗️ **Architecture Patterns**

### **Pattern 1: MCP-Enabled Data Source** (CoinGecko)
```
Layer 2 Actor → BaseReader → DSL Interface → External MCP Server → Live Data
```

```typescript
// ✅ Current working implementation
class CoinGeckoMarketDataReader extends BaseReader {
  private mcpClient: Client;

  async initialize(): Promise<Result<void>> {
    // Direct MCP client creation
    this.mcpClient = new Client({
      name: this.config.name,
      version: "1.0.0"
    }, { capabilities: {} });

    // Connect to external MCP server
    const transport = new SSEClientTransport(
      new URL("https://mcp.api.coingecko.com/sse")
    );
    await this.mcpClient.connect(transport);

    // Register with BaseReader client management
    this.addClient("coingecko-mcp", this.mcpClient, {
      name: "coingecko-mcp",
      type: "data-source"
    });
  }

  // Implement only technology-specific plugins
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 }
    });
  }

  protected transformCurrentPrice(data: any): number {
    const extracted = this.extractMCPData(data);
    return extracted[0].current_price;
  }

  // ALL DSL methods inherited from BaseReader automatically
  // getCurrentPrice(), getCurrentPrices(), getMarketAnalytics(), etc.
}
```

### **Pattern 2: Non-MCP Data Source** (Redpanda, TimescaleDB)
```
Layer 2 Actor → BaseReader/Writer → DSL Interface → Direct Client → Service
```

```typescript
// ✅ Current working implementation
class RedpandaMarketDataReader extends BaseReader {
  private redpandaClient: RedpandaClient;

  async initialize(): Promise<Result<void>> {
    // Direct client creation for streaming
    this.redpandaClient = new RedpandaClient({
      brokers: this.config.brokers,
      groupId: this.config.groupId
    });

    await this.redpandaClient.connect();

    // Register with BaseReader client management
    this.addClient("redpanda-stream", this.redpandaClient, {
      name: "redpanda-stream", 
      type: "data-source"
    });
  }

  // Implement only streaming-specific plugins
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    return this.redpandaClient.consume({
      topic: this.config.topics.prices,
      filter: { coinId, vsCurrency }
    });
  }

  // ALL DSL methods inherited automatically
}
```

## 🎯 **Implementation Guidelines**

### **Adding New Actors - Follow This Pattern:**

```typescript
// Step 1: Extend appropriate base class
class NewSourceActor extends BaseReader {
  private client: SomeClient;

  // Step 2: Initialize technology-specific client
  async initialize(): Promise<Result<void>> {
    this.client = new SomeClient(this.config);
    await this.client.connect();
    
    this.addClient("client-name", this.client, {
      name: "client-name",
      type: "data-source"
    });
  }

  // Step 3: Implement only the plugin methods
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // Technology-specific data fetching
    return this.client.fetchPrice(coinId, vsCurrency);
  }

  protected transformCurrentPrice(data: any): number {
    // Technology-specific data transformation
    return data.price;
  }

  // Step 4: All DSL methods work automatically
  // getCurrentPrice(), getCurrentPrices(), etc. - ZERO implementation needed
}
```

### **MCP Client Integration Best Practices:**

```typescript
// ✅ Direct MCP client creation within actors
class SomeMCPActor extends BaseReader {
  private mcpClient: Client;

  async initialize(): Promise<Result<void>> {
    // Create MCP client
    this.mcpClient = new Client({
      name: this.config.name,
      version: "1.0.0" 
    }, {
      capabilities: {}
    });

    // Connect to external server
    const transport = new SSEClientTransport(new URL(this.config.serverUrl));
    await this.mcpClient.connect(transport);

    // Register for client lifecycle management
    this.addClient("mcp-client", this.mcpClient, {
      name: "mcp-client",
      type: "data-source"
    });
  }

  protected async somePlugin(...args): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    
    return this.mcpClient.callTool({
      name: "some_tool",
      arguments: { ...args }
    });
  }
}
```

## 🚫 **What NOT to Do**

### **❌ Don't Create Wrapper Classes:**
```typescript
// DON'T DO THIS - wrapper classes are unnecessary
class MCPWrapper {
  async callTool(name: string, args: any) { /* ... */ }
}

class SomeActor {
  constructor(private wrapper: MCPWrapper) {} // ❌ Extra layer
}
```

### **❌ Don't Implement DSL Methods:**
```typescript
// DON'T DO THIS - DSL is inherited from BaseReader
class SomeActor extends BaseReader {
  // ❌ Don't implement these - they're inherited
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    // This creates code duplication
  }
}
```

### **❌ Don't Use Fake/Stub Data:**
```typescript
// DON'T DO THIS - all implementations must work with real services
async getCurrentPricePlugin(coinId: string): Promise<any> {
  return { price: 50000 }; // ❌ Fake data
}
```

## ✅ **Success Verification**

### **Working Examples to Study:**
```bash
# Study the working implementations
cat lib/src/sources/coingecko/MarketDataReader.ts    # MCP integration
cat lib/src/sources/redpanda/MarketDataReader.ts     # Streaming integration
cat lib/src/targets/timescale/MarketDataWriter.ts    # Database integration

# Test the demos
bun run app/demos/sources/coingecko-source-demo.ts
bun run app/demos/end-to-end-pipeline-demo.ts
```

### **Architecture Understanding Check:**
You understand the system when you can:

1. **Explain Plugin Pattern**: Layer 1 provides workflow, Layer 2 implements plugins only
2. **Implement New Actors**: Extend BaseReader/BaseWriter, implement plugins, get DSL for free
3. **MCP Integration**: Create direct client connections within actors
4. **Zero Duplication**: No DSL implementation code in Layer 2 actors

## 🌟 **Key Benefits**

- **Zero Code Duplication**: DSL implementation captured once in Layer 1
- **Type Safety**: Complete TypeScript support throughout
- **Real Data**: All implementations work with live external services
- **Scalable**: Easy to add new data sources and targets
- **MCP Ready**: Direct integration with external MCP servers

---

**Architecture**: 2-layer system with plugin pattern  
**MCP Integration**: Direct client creation within actors  
**Status**: Production-ready with verified external data sources