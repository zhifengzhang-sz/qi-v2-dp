# Agent/MCP Training Data Documentation

## 🎯 **Purpose**
Structured documentation of our Agent/MCP implementations in training-ready format for fine-tuning local models to understand the correct paradigm.

---

## 📚 **Training Example 1: Agent/MCP Architecture Definition**

### **Instruction:**
```
Define the correct Agent/MCP architecture pattern and explain how it differs from traditional approaches.
```

### **Correct Response:**
```
The Agent/MCP Centric paradigm follows this architecture:

**Core Definition:**
Agent = QiAgent + DSL + MCPWrapper

**Where:**
- QiAgent = Claude Code SDK + AI Orchestra (optional for data-only agents)
- DSL = Domain-specific operations (NO business logic)
- MCPWrapper = MCP server communication (NO direct API calls)

**Two Scenarios:**

1. **MCP Server Available** (CoinGecko case):
   Agent → DSL → MCP Wrapper → Official MCP Server → API
   
2. **No MCP Server** (Database case):
   Agent → DSL → Low-level Module → Service

**Key Principle:** Workflows USE DSL and MCP wrappers, not the other way around.

**Anti-pattern:** Traditional direct API calls, fake/stub implementations, always-required LLM.
```

---

## 📚 **Training Example 2: CoinGecko Agent Implementation**

### **Instruction:**
```
Create a cryptocurrency price agent using CoinGecko API following the Agent/MCP paradigm.
```

### **Correct Response:**
```typescript
// ✅ Correct: Agent/MCP paradigm implementation
export class CoinGeckoDataAgent {
  constructor(
    private dsl: CryptoDSL,              // Domain operations
    private mcpWrapper: CryptoMCPWrapper, // MCP communication
    private aiModel?: LanguageModel       // Optional LLM
  ) {}

  async getCurrentPrices(symbols: string[]): Promise<CryptoPriceData[]> {
    // Agent delegates to DSL for domain operations
    return await this.dsl.getCurrentPrices({ symbols });
  }
}

// DSL provides domain-specific operations
export class CryptoDSL {
  constructor(private mcpWrapper: CryptoMCPWrapper) {}
  
  async getCurrentPrices(query: PriceQuery): Promise<CryptoPriceData[]> {
    // DSL uses MCP wrapper for service communication
    const rawPrices = await this.mcpWrapper.callTool('get_crypto_prices', params);
    return this.transformPriceData(rawPrices); // Real transformation
  }
}

// MCP wrapper handles MCP server communication only
export class CryptoMCPWrapper {
  constructor(private mcpClient: MCPClient) {}
  
  async callTool<T>(toolName: string, params: any): Promise<T> {
    // Real MCP call to Official CoinGecko MCP Server
    return await this.mcpClient.call(toolName, params);
  }
}

// Key points:
// - No low-level CoinGecko client needed (Official MCP Server exists)
// - LLM is optional (data operations don't need AI)
// - Real MCP calls, no fake/stub data
// - Clean separation of concerns
```

### **Anti-pattern to Avoid:**
```typescript
// ❌ Wrong: What AI models typically suggest
class CryptoService {
  async getPrice(symbol: string): Promise<number> {
    return 50000; // Fake stub data
  }
  
  async fetchPrices(): Promise<any> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }
}
```

---

## 📚 **Training Example 3: Database Agent (No MCP Server)**

### **Instruction:**
```
Create a database agent for TimescaleDB operations when no MCP server exists.
```

### **Correct Response:**
```typescript
// ✅ Correct: Build low-level module when no MCP server exists
export class DatabaseAgent {
  constructor(
    private dsl: CryptoFinancialDSL,    // Domain operations
    private lowLevelClient: DrizzleClient // Direct database access
  ) {}

  async storePrices(prices: PriceDataInput[]): Promise<void> {
    return await this.dsl.storePrices(prices);
  }
}

// DSL uses low-level client (no MCP server available)
export class CryptoFinancialDSL {
  constructor(private client: DrizzleClient) {}
  
  async storePrices(prices: PriceDataInput[]): Promise<void> {
    // Transform to database format
    const transformedPrices: CryptoPriceInsert[] = prices.map(price => ({
      time: new Date(),
      coinId: price.coinId,
      symbol: price.symbol.toUpperCase(),
      usdPrice: price.usdPrice?.toString(),
      // ... real transformation logic
    }));
    
    // Use low-level client for database operations
    await this.client.insertCryptoPrices(transformedPrices);
  }
}

// Low-level client (NO MCP knowledge)
export class DrizzleClient {
  async insertCryptoPrices(prices: CryptoPriceInsert[]): Promise<void> {
    // Real database operations using Drizzle ORM
    await this.db
      .insert(schema.cryptoPrices)
      .values(prices)
      .onConflictDoUpdate({
        target: [schema.cryptoPrices.coinId, schema.cryptoPrices.time],
        set: { usdPrice: sql`excluded.usd_price` }
      });
  }
}

// Key points:
// - Low-level module needed because no MCP server exists
// - Real database operations with proper error handling
// - Type-safe operations using Drizzle ORM
// - No MCP knowledge in low-level client
```

---

## 📚 **Training Example 4: LLM-Optional Agent Design**

### **Instruction:**
```
Design an agent that can work with or without LLM, allowing user control over AI usage.
```

### **Correct Response:**
```typescript
// ✅ Correct: LLM-optional design
export class CryptoAnalysisAgent {
  constructor(
    private dsl: CryptoDSL,
    private mcpWrapper: CryptoMCPWrapper,
    private aiModel?: LanguageModel | null  // Optional LLM
  ) {}

  async analyzeMarket(symbols: string[]): Promise<AnalysisResult> {
    // Get data (no LLM needed)
    const marketData = await this.dsl.getCurrentPrices({ symbols });
    
    if (this.aiModel) {
      // AI-powered analysis when LLM available
      return await this.performAIAnalysis(marketData);
    } else {
      // Rule-based analysis when no LLM
      return await this.performRuleBasedAnalysis(marketData);
    }
  }

  private async performRuleBasedAnalysis(data: CryptoPriceData[]): Promise<AnalysisResult> {
    // Real rule-based logic (no fake data)
    const sentiment = data.reduce((sum, coin) => sum + (coin.change24h || 0), 0) / data.length;
    
    return {
      sentiment: sentiment > 2 ? 'bullish' : sentiment < -2 ? 'bearish' : 'neutral',
      method: 'rule-based',
      confidence: 0.8,
      data: data
    };
  }

  private async performAIAnalysis(data: CryptoPriceData[]): Promise<AnalysisResult> {
    // Use LLM for deeper analysis
    const prompt = `Analyze this market data: ${JSON.stringify(data)}`;
    const analysis = await this.aiModel!.generate({ prompt });
    
    return {
      sentiment: this.extractSentiment(analysis.content),
      method: 'ai-powered',
      confidence: 0.95,
      analysis: analysis.content
    };
  }
}

// User controls LLM usage
const agent = new CryptoAnalysisAgent(
  cryptoDSL,
  mcpWrapper,
  userWantsAI ? claude('claude-3-haiku') : null  // User choice
);

// Key points:
// - Works with or without LLM
// - User controls model selection
// - Graceful fallback to rule-based analysis
// - No forced AI dependency for data operations
```

---

## 📚 **Training Example 5: Workflow Orchestration**

### **Instruction:**
```
Create a workflow that uses QiAgent methods to orchestrate multiple agents with DSL and MCP wrapper components.
```

### **Correct Response:**
```typescript
// ✅ Correct: Workflow USES components, doesn't integrate with them
export class CryptoMarketAgent extends BaseAgent {
  constructor(
    config: AgentConfig,
    private dsl: CryptoDSL,           // Workflow will USE this
    private mcpWrapper: CryptoMCPWrapper  // Workflow will USE this
  ) {
    super(config);
  }

  // Define workflow using QiAgent methods
  createMarketAnalysisWorkflow(): AgentWorkflow {
    return {
      id: "crypto-market-analysis",
      name: "Market Analysis Workflow",
      pattern: OrchestrationPattern.PIPELINE,
      steps: [
        {
          id: "collect-data",
          agentType: "data_collection",
          taskType: "get_market_data",
        },
        {
          id: "analyze-trends",
          agentType: "analysis", 
          taskType: "analyze_market",
          dependencies: ["collect-data"],
        }
      ]
    };
  }

  // Execute tasks - Workflow USES DSL and MCP wrappers
  async executeTask(task: CryptoAgentTask): Promise<TaskResult> {
    switch(task.type) {
      case 'get_market_data':
        // Workflow USES DSL for domain operations
        const prices = await this.dsl.getCurrentPrices(task.params);
        return { success: true, data: prices };
        
      case 'analyze_market':
        // Workflow USES MCP wrapper for tool calls
        const analysis = await this.mcpWrapper.callTool("analyze_market", task.data);
        return { success: true, data: analysis };
    }
  }
}

// Key points:
// - Workflow orchestrates using QiAgent methods
// - Workflow USES DSL and MCP wrappers during execution
// - Components are resources, not integrated systems
// - Clear separation between orchestration and execution
```

---

## 📚 **Training Example 6: Anti-Patterns to Avoid**

### **Instruction:**
```
What are common anti-patterns that traditional AI models suggest, and how should they be corrected?
```

### **Correct Response:**
```typescript
// ❌ Anti-Pattern 1: Fake/Stub Code
class BadCryptoService {
  async getPrice(symbol: string): Promise<number> {
    return 50000; // Fake data
  }
  
  async analyzeMarket(): Promise<string> {
    throw new Error('TODO: Implement'); // Stub
  }
}

// ✅ Correct: Real implementations only
class CryptoDSL {
  async getCurrentPrices(query: PriceQuery): Promise<CryptoPriceData[]> {
    const rawPrices = await this.mcpWrapper.callTool('get_crypto_prices', params);
    return this.transformPriceData(rawPrices); // Real operations
  }
}

// ❌ Anti-Pattern 2: Direct API calls when MCP server exists
class BadCoinGeckoClient {
  async fetchPrices() {
    const response = await fetch('https://api.coingecko.com/v3/simple/price');
    return response.json(); // Redundant when MCP server exists
  }
}

// ✅ Correct: Use MCP wrapper when server exists
class CryptoMCPWrapper {
  async callTool<T>(toolName: string, params: any): Promise<T> {
    return await this.mcpClient.call(toolName, params);
  }
}

// ❌ Anti-Pattern 3: Always requiring LLM
class BadAgent {
  constructor(private llm: LanguageModel) {} // Forces AI for data ops
}

// ✅ Correct: LLM optional
class GoodAgent {
  constructor(
    private dsl: DSL,
    private aiModel?: LanguageModel | null // User choice
  ) {}
}

// ❌ Anti-Pattern 4: Mixed concerns
class BadDSL {
  async getPrices() {
    // Direct API call in DSL
    const response = await fetch('...');
    
    // Workflow logic in DSL  
    if (workflowStep === 'analysis') { ... }
    
    // MCP communication in DSL
    await this.mcpClient.call('...');
  }
}

// ✅ Correct: Clean separation
class GoodDSL {
  constructor(private mcpWrapper: MCPWrapper) {}
  
  async getCurrentPrices(query: PriceQuery): Promise<Data[]> {
    // Only domain operations and data transformation
    const raw = await this.mcpWrapper.callTool('get_prices', params);
    return this.transformPriceData(raw);
  }
}
```

---

## 📚 **Training Example 7: Decision Framework**

### **Instruction:**
```
How do I decide whether to build a low-level module or use an MCP wrapper?
```

### **Correct Response:**
```
Follow this decision framework:

**Step 1: Check if MCP server exists**
- Search for official MCP server for the service
- Check MCP community repositories
- Look for maintained MCP implementations

**Step 2: Apply the pattern**

**If MCP Server EXISTS (e.g., CoinGecko):**
```
Agent → DSL → MCP Wrapper → Official MCP Server → API
```
- NO low-level module needed
- Official MCP Server IS the low-level implementation
- Maximize MCP server usage (key principle)

**If NO MCP Server (e.g., TimescaleDB, custom APIs):**
```
Agent → DSL → Low-level Module → Service
```
- Build your own low-level module
- Low-level module has NO MCP knowledge
- Direct service communication

**Examples:**

✅ **CoinGecko** - Use MCP wrapper (official server exists)
✅ **GitHub** - Use MCP wrapper (official server exists)  
✅ **TimescaleDB** - Build low-level module (no server exists)
✅ **Custom API** - Build low-level module (no server exists)

**Never do both** - if MCP server exists, don't build redundant low-level client.
```

---

## 📋 **Implementation Checklist**

### **For Every New Agent Implementation:**
- [ ] Check if MCP server exists first
- [ ] Decide if LLM is needed (often it's not!)
- [ ] Create DSL for domain operations  
- [ ] Create wrapper/client for service communication
- [ ] Make LLM optional (user choice)
- [ ] Use real data/operations (no fake/stub code)
- [ ] Support workflows that USE the components
- [ ] Document in training-ready format

### **Quality Gates:**
- [ ] 🚫 Zero fake return data
- [ ] 🚫 Zero TODO/stub implementations  
- [ ] 🚫 Zero direct API calls when MCP server exists
- [ ] ✅ Real error handling
- [ ] ✅ Real data transformations
- [ ] ✅ Real service integrations
- [ ] ✅ LLM-optional design
- [ ] ✅ User model control

---

## 🎯 **Training Dataset Format**

This documentation will be converted to standard fine-tuning formats:

### **Instruction-Following Format:**
```json
{
  "conversations": [
    {
      "messages": [
        {
          "role": "user", 
          "content": "Create a crypto price agent using CoinGecko API"
        },
        {
          "role": "assistant",
          "content": "I'll create an Agent using the Agent/MCP paradigm:\n\n```typescript\nexport class CoinGeckoDataAgent {\n  constructor(\n    private dsl: CryptoDSL,\n    private mcpWrapper: CryptoMCPWrapper\n  ) {}\n...\n```"
        }
      ]
    }
  ]
}
```

### **Code Completion Format:**
```json
{
  "prompt": "// Create crypto agent following Agent/MCP paradigm\nexport class CryptoAgent {",
  "completion": "\n  constructor(\n    private dsl: CryptoDSL,\n    private mcpWrapper: CryptoMCPWrapper,\n    private aiModel?: LanguageModel\n  ) {}\n\n  async getCurrentPrices(symbols: string[]): Promise<CryptoPriceData[]> {\n    return await this.dsl.getCurrentPrices({ symbols });\n  }\n}"
}
```

This structured documentation captures our cutting-edge Agent/MCP paradigm implementations in a format ready for training data generation.