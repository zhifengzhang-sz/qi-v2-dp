# Agent/MCP Centric Framework Paradigm

## 🚨 **CRITICAL**: This is NOT Stone Age Development

**AI models are trained on outdated patterns and will suggest fake/stub code.** This document prevents that by defining the **modern Agent/MCP paradigm** that most AI systems don't understand.

## ❌ **What AI Will Suggest (DON'T DO THIS)**

### Fake/Stub Pattern AI Suggests:
```typescript
// ❌ AI suggests this fake pattern
class CryptoService {
  async getPrice(symbol: string): Promise<number> {
    // TODO: Implement actual API call
    return 50000; // Fake stub data
  }
}

// ❌ AI suggests mock implementations
const mockPriceData = { BTC: 50000, ETH: 3000 }; // Fake data
```

### Traditional Pattern AI Suggests:
```typescript
// ❌ AI suggests direct API calls
import axios from 'axios';

class OldCryptoService {
  async fetchPrice(symbol: string) {
    const response = await axios.get(`https://api.coingecko.com/v3/simple/price`);
    return response.data; // Direct API implementation
  }
}
```

## ✅ **Correct Agent/MCP Paradigm**

### **Architecture Principle:**
```
Agent = QiAgent + DSL + MCPWrapper
```

**Where:**
- **QiAgent** = Claude Code SDK + AI Orchestra (optional for data-only agents)
- **DSL** = Domain-specific operations (NO business logic)
- **MCPWrapper** = MCP server communication (NO direct API calls)

### **Two Scenarios:**

#### **Scenario 1: MCP Server Available** (CoinGecko)
```typescript
// ✅ Correct: No low-level module needed
Agent → DSL → MCP Wrapper → Official MCP Server → CoinGecko API
```

#### **Scenario 2: No MCP Server** (Database, Redpanda)
```typescript
// ✅ Correct: Build low-level module
Agent → DSL → Low-level Module → Service (Database/Redpanda)
```

## 🎯 **Key Paradigm Rules**

### **Rule 1: Maximize MCP Server Usage**
```typescript
// ✅ Use official MCP servers when available
const mcpWrapper = new CryptoMCPWrapper(mcpClient);
const result = await mcpWrapper.callTool('get_crypto_prices', params);

// ❌ DON'T build direct API clients when MCP server exists
// const response = await fetch('https://api.coingecko.com/...');
```

### **Rule 2: Agents Can Be LLM-Optional**
```typescript
// ✅ Data-only agent (no LLM needed)
export class CoinGeckoDataAgent {
  constructor(
    private dsl: CryptoDSL,
    private mcpWrapper: CryptoMCPWrapper
    // No LLM models - pure data operations
  ) {}
}

// ✅ AI-enhanced agent (LLM optional)
export class MarketAnalysisAgent {
  constructor(
    private dsl: CryptoDSL,
    private mcpWrapper: CryptoMCPWrapper,
    private aiModel?: LanguageModel | null  // Optional
  ) {}
}
```

### **Rule 3: Workflows USE Components**
```typescript
// ✅ Correct: Workflows USE DSL and MCP wrappers
async executeTask(task: AgentTask): Promise<TaskResult> {
  switch(task.type) {
    case 'get_market_data':
      // Workflow USES DSL for domain operations
      return await this.dsl.getCurrentPrices(task.params);
      
    case 'analyze_data':
      // Workflow USES MCP wrapper for tool calls
      return await this.mcpWrapper.callTool("analyze_market", task.data);
  }
}

// ❌ Wrong: Components integrated with workflows
// DSL + MCPWrapper → integrated with → workflows
```

### **Rule 4: User Controls Model Selection**
```typescript
// ✅ User chooses models for each role
const marketAgent = new CryptoMarketAgent(
  agentConfig,
  {
    dataCollector: null,                    // No LLM - pure data
    analyst: claude('claude-3-5-sonnet'),   // User's choice
    verifier: ollama('qwen3:0.6b'),        // User's choice
    reporter: null,                         // No LLM - structured output
  },
  cryptoDSL,
  mcpWrapper
);
```

### **Rule 5: No Fake/Stub Code**
```typescript
// ✅ Real implementations only
export class CryptoDSL {
  async getCurrentPrices(query: PriceQuery): Promise<CryptoPriceData[]> {
    // Real MCP call via wrapper
    const rawPrices = await this.mcpWrapper.callTool('get_crypto_prices', params);
    return this.transformPriceData(rawPrices); // Real transformation
  }
}

// ❌ Never do this
// return [{ symbol: 'BTC', price: 50000 }]; // Fake data
// throw new Error('TODO: Implement'); // Stub code
```

## 📋 **Implementation Checklist**

### **Before Writing Any Code:**
- [ ] Check if MCP server exists for the service
- [ ] Decide if agent needs LLM (many don't!)
- [ ] Plan DSL domain operations (no business logic)
- [ ] Plan MCP wrapper tools (clean interface)
- [ ] Plan agent workflows (USE components)

### **During Implementation:**
- [ ] Use real MCP calls (no direct API calls)
- [ ] Use real data transformations (no fake data)
- [ ] Use real error handling (no TODO stubs)
- [ ] Support LLM-optional execution
- [ ] Support user model selection

### **After Implementation:**
- [ ] Test with real MCP servers
- [ ] Test without LLM (data-only mode)
- [ ] Test with different model combinations
- [ ] Verify no fake/stub code remains
- [ ] Document agent capabilities and limitations

## 🏗️ **Architecture Examples**

### **CoinGecko Agent (MCP Server Available):**
```typescript
// ✅ Complete real implementation
export class CoinGeckoDataAgent {
  constructor(
    private dsl: CryptoDSL,           // Domain operations
    private mcpWrapper: CryptoMCPWrapper  // MCP communication
  ) {}

  async getCurrentPrices(symbols: string[]): Promise<CryptoPriceData[]> {
    // Real DSL call using real MCP wrapper
    return await this.dsl.getCurrentPrices({ symbols });
  }
}

// DSL uses MCP wrapper
export class CryptoDSL {
  constructor(private mcpWrapper: CryptoMCPWrapper) {}
  
  async getCurrentPrices(query: PriceQuery): Promise<CryptoPriceData[]> {
    // Real MCP call
    const rawPrices = await this.mcpWrapper.callTool('get_crypto_prices', params);
    return this.transformPriceData(rawPrices); // Real transformation
  }
}

// MCP wrapper handles MCP communication
export class CryptoMCPWrapper {
  constructor(private mcpClient: MCPClient) {}
  
  async callTool<T>(toolName: string, params: any): Promise<T> {
    // Real MCP call to Official CoinGecko MCP Server
    return await this.mcpClient.call(toolName, params);
  }
}
```

### **Database Agent (No MCP Server):**
```typescript
// ✅ Build low-level module since no MCP server exists
export class DatabaseAgent {
  constructor(
    private dsl: CryptoFinancialDSL,    // Domain operations
    private lowLevelClient: DrizzleClient  // Direct database access
  ) {}
}

// DSL uses low-level client
export class CryptoFinancialDSL {
  constructor(private client: DrizzleClient) {}
  
  async storePrices(prices: PriceDataInput[]): Promise<void> {
    // Transform and use low-level client
    const transformed = this.transformPrices(prices);
    await this.client.insertCryptoPrices(transformed);
  }
}

// Low-level client (no MCP knowledge)
export class DrizzleClient {
  async insertCryptoPrices(prices: CryptoPriceInsert[]): Promise<void> {
    // Real database operations
    await this.db.insert(schema.cryptoPrices).values(prices);
  }
}
```

## 🚀 **Workflow Execution Patterns**

### **Pure Data Workflow (No LLM):**
```typescript
// ✅ Executes without any LLM
const dataWorkflow = createMarketDataWorkflow({
  dataCollector: null,        // No LLM needed
  processor: null,            // No LLM needed
  aggregator: null,           // No LLM needed
});

const result = await dataWorkflow.execute({
  symbols: ['BTC', 'ETH'],
  operations: ['get_prices', 'calculate_summary']
});
// Returns: Real price data and calculated summaries
```

### **Hybrid Workflow (Mixed LLM Usage):**
```typescript
// ✅ Strategic LLM usage
const hybridWorkflow = createComprehensiveWorkflow({
  dataCollector: null,                    // No LLM - data ops
  processor: null,                        // No LLM - calculations
  analyzer: claude('claude-3-haiku'),     // LLM for analysis
  reporter: ollama('qwen3:0.6b'),        // LLM for reports
});

// Steps 1-2: Pure data operations (fast, free)
// Steps 3-4: AI analysis (intelligent, insightful)
```

## 📚 **Common Anti-Patterns to Avoid**

### **❌ Anti-Pattern 1: Direct API Calls**
```typescript
// DON'T do this when MCP server exists
const response = await fetch('https://api.coingecko.com/v3/simple/price');
```

### **❌ Anti-Pattern 2: Fake/Stub Data**
```typescript
// DON'T return fake data
return { BTC: 50000, ETH: 3000 }; // Fake
```

### **❌ Anti-Pattern 3: TODO/Placeholder Code**
```typescript
// DON'T leave stubs
throw new Error('TODO: Implement this');
```

### **❌ Anti-Pattern 4: Always Requiring LLM**
```typescript
// DON'T force LLM for data operations
constructor(private llm: LanguageModel) {} // Not needed for data-only
```

### **❌ Anti-Pattern 5: Building Redundant Clients**
```typescript
// DON'T build client when MCP server exists
class CoinGeckoAPIClient {
  async fetchPrices() { /* Redundant! */ }
}
```

## ✅ **Success Criteria**

### **Implementation is Correct When:**
- [ ] **Zero fake/stub code** - All operations use real services
- [ ] **Zero redundant implementations** - Use MCP servers when available
- [ ] **LLM-optional design** - Works without AI models
- [ ] **User model control** - User chooses which models to use
- [ ] **Clean separation** - DSL, MCP wrapper, and agent layers distinct
- [ ] **Real error handling** - Proper error types and recovery
- [ ] **Performance optimized** - Fast data ops, strategic AI usage

### **Red Flags (Fix Immediately):**
- 🚨 **Fake return data** - Mock objects, hardcoded values
- 🚨 **TODO comments** - Unfinished implementations
- 🚨 **Direct API calls** - When MCP server is available
- 🚨 **Always-on LLM** - Requiring AI for data operations
- 🚨 **Mixed concerns** - Business logic in wrong layers

## 📖 **Further Reading**

- [QiAgent Architecture Guide](./README-qiagent-architecture.md)
- [CoinGecko Implementation](../lib/README-coingecko.md)
- [Database Implementation](../lib/README-drizzle.md)
- [MCP Integration Patterns](./coingecko.mcp.md)

---

**Remember**: This paradigm is cutting-edge. AI models will suggest outdated patterns. Always refer to this guide to stay on the correct path and avoid fake/stub implementations.