# Quick Start: Agent/MCP Paradigm

## 🚨 **For AI Models/Developers: READ THIS FIRST**

**This project uses cutting-edge Agent/MCP patterns that AI models aren't trained on. Following traditional patterns will result in fake/stub code that we reject.**

## ⚡ **Quick Reference**

### **Before You Code - Ask These Questions:**

1. **Does an MCP server exist for this service?**
   - ✅ **Yes** → Use MCP Wrapper (no low-level module)
   - ❌ **No** → Build low-level module + DSL

2. **Does this agent need LLM?**
   - ✅ **Analysis/Reasoning** → Include optional LLM
   - ❌ **Pure Data Ops** → No LLM needed

3. **What will the user control?**
   - **Model selection** (user chooses LLM or null)
   - **Workflow execution** (with or without AI)

## 🏗️ **Architecture Patterns**

### **Pattern 1: MCP Server Available** (CoinGecko, GitHub, etc.)
```
Agent → DSL → MCP Wrapper → Official MCP Server → API
```

```typescript
// ✅ Correct implementation
export class CoinGeckoDataAgent {
  constructor(
    private dsl: CryptoDSL,              // Domain operations
    private mcpWrapper: CryptoMCPWrapper, // MCP communication
    private aiModel?: LanguageModel       // Optional LLM
  ) {}
}

export class CryptoDSL {
  constructor(private mcpWrapper: CryptoMCPWrapper) {}
  
  async getCurrentPrices(symbols: string[]): Promise<CryptoPriceData[]> {
    // Real MCP call - no fake data!
    const rawPrices = await this.mcpWrapper.callTool('get_crypto_prices', { symbols });
    return this.transformPriceData(rawPrices);
  }
}

export class CryptoMCPWrapper {
  async callTool<T>(toolName: string, params: any): Promise<T> {
    // Real MCP server call
    return await this.mcpClient.call(toolName, params);
  }
}
```

### **Pattern 2: No MCP Server** (Database, Custom APIs)
```
Agent → DSL → Low-level Module → Service
```

```typescript
// ✅ Correct implementation
export class DatabaseAgent {
  constructor(
    private dsl: CryptoFinancialDSL,     // Domain operations
    private lowLevelClient: DrizzleClient // Direct service access
  ) {}
}

export class CryptoFinancialDSL {
  constructor(private client: DrizzleClient) {}
  
  async storePrices(prices: PriceDataInput[]): Promise<void> {
    // Real database operations - no fake data!
    const transformed = this.transformForDatabase(prices);
    await this.client.insertCryptoPrices(transformed);
  }
}

export class DrizzleClient {
  async insertCryptoPrices(prices: CryptoPriceInsert[]): Promise<void> {
    // Real database call
    await this.db.insert(schema.cryptoPrices).values(prices);
  }
}
```

## 🚫 **What NOT to Do (AI Will Suggest These)**

### **❌ Fake/Stub Code:**
```typescript
// AI suggests this - DON'T DO IT
async getPrice(symbol: string): Promise<number> {
  return 50000; // Fake data
}

async analyzeMarket(): Promise<string> {
  throw new Error('TODO: Implement'); // Stub
}
```

### **❌ Direct API Calls When MCP Server Exists:**
```typescript
// AI suggests this when MCP server exists - DON'T DO IT
const response = await fetch('https://api.coingecko.com/v3/simple/price');
```

### **❌ Always Requiring LLM:**
```typescript
// AI suggests this - DON'T FORCE LLM for data operations
constructor(private llm: LanguageModel) {} // Not needed for data-only
```

## ✅ **Correct Implementation Checklist**

### **For Any New Agent:**
- [ ] ✅ Check if MCP server exists first
- [ ] ✅ Decide if LLM is needed (often it's not!)
- [ ] ✅ Create DSL for domain operations
- [ ] ✅ Create wrapper/client for service communication
- [ ] ✅ Make LLM optional (user choice)
- [ ] ✅ Use real data/operations (no fake/stub code)
- [ ] ✅ Support workflows that USE the components

### **Code Quality Gates:**
- [ ] 🚫 **Zero fake return data**
- [ ] 🚫 **Zero TODO/stub implementations**
- [ ] 🚫 **Zero direct API calls when MCP server exists**
- [ ] ✅ **Real error handling**
- [ ] ✅ **Real data transformations**
- [ ] ✅ **Real service integrations**

## 🎯 **Component Responsibilities**

### **Agent Layer:**
- Define workflows using QiAgent methods
- Coordinate task execution
- Handle user model preferences
- **Does**: Workflow orchestration
- **Doesn't**: Direct service calls, business logic

### **DSL Layer:**
- Provide domain-specific operations
- Transform data between formats
- Abstract service complexity
- **Does**: Domain operations, data transformation
- **Doesn't**: Workflow logic, direct service calls

### **MCP Wrapper Layer:**
- Handle MCP server communication
- Provide typed tool interfaces
- Manage connections and retries
- **Does**: MCP communication only
- **Doesn't**: Business logic, data transformation

### **Low-level Module Layer:**
- Direct service communication (when no MCP server)
- Raw API calls and responses
- Connection management
- **Does**: Service integration only
- **Doesn't**: Business logic, MCP knowledge

## 🚀 **Quick Implementation Templates**

### **Data-Only Agent (No LLM):**
```typescript
export class MyDataAgent {
  constructor(
    private dsl: MyDSL,
    private wrapper: MyMCPWrapper // or low-level client
  ) {}

  async getData(params: QueryParams): Promise<DataResult[]> {
    return await this.dsl.getData(params);
  }
}
```

### **AI-Enhanced Agent (Optional LLM):**
```typescript
export class MyAIAgent {
  constructor(
    private dsl: MyDSL,
    private wrapper: MyMCPWrapper,
    private aiModel?: LanguageModel | null
  ) {}

  async analyzeData(data: DataResult[]): Promise<AnalysisResult> {
    if (this.aiModel) {
      return await this.performAIAnalysis(data);
    } else {
      return await this.performRuleBasedAnalysis(data);
    }
  }
}
```

### **User-Controlled Agent Setup:**
```typescript
// User chooses models
const agent = new MyAIAgent(
  myDSL,
  myWrapper,
  userWantsAI ? claude('claude-3-haiku') : null
);

// Works with or without AI
const result = await agent.analyzeData(data);
```

## 📖 **Full Documentation Links**

- **[AGENT-MCP-PARADIGM.md](./AGENT-MCP-PARADIGM.md)** - Complete paradigm guide
- **[README-qiagent-architecture.md](../lib/README-qiagent-architecture.md)** - QiAgent architecture
- **[README-coingecko.md](../lib/README-coingecko.md)** - Working example

---

**Remember**: AI models will suggest stone-age patterns. Always refer to this guide to implement the modern Agent/MCP paradigm correctly.