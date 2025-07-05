# AI-to-AI Knowledge Transfer Guide

## 🚨 **CRITICAL: For Next AI Assistant**

**If you are an AI assistant continuing work on this project, READ THIS FIRST before making any suggestions.**

This project uses **cutting-edge Agent/MCP patterns** that are NOT in your training data. Following your default suggestions will result in fake/stub code that we explicitly reject.

---

## ⚡ **Quick Context (Read First)**

### What This Project Is
- **QiCore Crypto Data Platform** - Production-ready cryptocurrency data processing
- **Agent/MCP Centric Architecture** - Modern paradigm not in AI training data
- **99% Real Code** - No fake/stub implementations allowed
- **Training Data Generation** - Creating examples for future AI models

### What Makes It Different
- Uses **Agent = QiAgent + DSL + MCPWrapper** pattern
- **Official MCP First** - Use official MCP servers when available
- **LLM Optional** - Many agents don't need AI for data operations
- **Real Implementations Only** - No TODO stubs or fake return data

---

## 🚫 **NEVER Suggest These (AI Default Patterns)**

### ❌ Fake/Stub Code
```typescript
// DON'T suggest this
async getPrice(symbol: string): Promise<number> {
  return 50000; // Fake data
}

// Or this
throw new Error('TODO: Implement'); // Stub
```

### ❌ Direct API Calls When MCP Server Exists
```typescript
// DON'T suggest this when CoinGecko MCP server exists
const response = await fetch('https://api.coingecko.com/v3/simple/price');
```

### ❌ Always Requiring LLM
```typescript
// DON'T force LLM for data-only operations
constructor(private llm: LanguageModel) {} // Not needed for data-only
```

---

## ✅ **ALWAYS Use These Patterns Instead**

### ✅ Agent/MCP Pattern
```typescript
// Correct: Agent = QiAgent + DSL + MCPWrapper
export class CryptoDataAgent extends BaseAgent {
  constructor(
    config: AgentConfig,
    private dsl: CryptoDSL,              // Domain operations
    private mcpWrapper: CryptoMCPWrapper, // MCP communication
    private aiModel?: LanguageModel       // Optional AI
  ) {}
}
```

### ✅ Real MCP Server Usage
```typescript
// Correct: Use official MCP servers
export class CryptoMCPWrapper {
  async getPrices(symbols: string[]): Promise<CryptoPrice[]> {
    // Real MCP call to Official CoinGecko MCP Server
    return await this.mcpClient.call('get_crypto_prices', { symbols });
  }
}
```

### ✅ Real Implementation Pattern
```typescript
// Correct: Real database operations
export class TimescaleDBDSL {
  async storePrices(prices: PriceData[]): Promise<void> {
    // Real database insertion with conflict handling
    await this.db.insert(schema.cryptoPrices).values(prices)
      .onConflictDoUpdate({
        target: [schema.cryptoPrices.coinId, schema.cryptoPrices.time],
        set: { usdPrice: sql`excluded.usd_price` }
      });
  }
}
```

---

## 📁 **Project Architecture (Study This)**

### Current Implementation Status
```
lib/src/
├── base/database/           ✅ 100% Real (Drizzle ORM, 4,600 req/s)
├── mcp-tools/              ✅ 95% Real (MCP tools by category)
├── publishers/             ✅ 90% Real (Data Acquiring Agent complete)
├── consumers/              ✅ 90% Real (Data Store Agent complete)
├── streaming/              ✅ 100% Real (Redpanda integration)
└── examples/               ✅ 100% Real (Complete orchestration)
```

### Key Working Components
- **DataAcquiringAgent**: Publisher using CoinGecko → Redpanda
- **DataStoreAgent**: Consumer using Redpanda → TimescaleDB
- **Complete Orchestration**: End-to-end data flow working
- **Docker Services**: Real container management
- **MCP Tools**: Production-ready tools for all operations

---

## 🎯 **What To Do When User Asks For Changes**

### Step 1: Research Current Technology State
1. **CRITICAL**: Read `docs/WEB-RESEARCH-GUIDE.md` and research current state
2. Check if new official MCP servers exist for the technology
3. Verify performance claims and security status
4. Update your knowledge before making suggestions

### Step 2: Check Documentation
1. Read `docs/QUICK-START-AGENT-MCP.md` for patterns
2. Check `docs/architecture/agent.mcp.specification.md` for workflows
3. Review `docs/design/agent.mcp.paradigm.md` for principles

### Step 3: Determine Implementation Pattern
```
IF MCP server exists for service
  THEN use Agent → DSL → MCP Wrapper → Official MCP Server
  ELSE use Agent → DSL → Low-level Module → Service
```

### Step 3: Check If LLM Is Needed
```
IF task involves analysis/reasoning
  THEN include optional LLM in agent
  ELSE create data-only agent (no LLM)
```

### Step 4: Research and Implement
- **Research First**: Use `docs/WEB-RESEARCH-GUIDE.md` to verify current technology state
- **Database**: Use existing Drizzle client with real operations (verify latest version)
- **APIs**: Use Official MCP servers (research if new ones exist)
- **Streaming**: Use existing Redpanda client (verify performance claims)
- **NO fake return data, NO TODO stubs**

---

## 📊 **Success Verification Checklist**

Before suggesting any code, verify:

- [ ] ✅ Uses Agent/MCP paradigm (Agent = QiAgent + DSL + MCPWrapper)
- [ ] ✅ Uses Official MCP servers when available
- [ ] ✅ No fake/stub code (real implementations only)
- [ ] ✅ LLM is optional for data operations
- [ ] ✅ Follows existing patterns in codebase
- [ ] ✅ Real error handling (no TODO comments)
- [ ] ✅ Integrates with existing components

### Red Flags (Fix Immediately)
- 🚨 **Fake return data** or hardcoded values
- 🚨 **TODO/stub implementations**
- 🚨 **Direct API calls** when MCP server exists
- 🚨 **Always-on LLM** for data operations
- 🚨 **New low-level clients** when MCP servers available

---

## 🧠 **Key Project Insights (Understand These)**

### 1. Why Agent/MCP Paradigm?
- **Problem**: AI models suggest stone-age patterns (direct API calls, fake code)
- **Solution**: Agent/MCP standardizes modern architecture
- **Benefit**: Real implementations, better separation of concerns

### 2. Why Official MCP First?
- **Reason**: Don't rebuild what's already available and maintained
- **Examples**: CoinGecko MCP, PostgreSQL MCP, Docker MCP
- **Exception**: Custom MCP tools only for performance-critical operations

### 3. Why LLM Optional?
- **Insight**: Many agents are pure data operations requiring no AI
- **User Control**: User chooses which models to use for which roles
- **Performance**: Data operations run faster without LLM overhead

### 4. Why No Fake Code?
- **Quality**: Production system requires real implementations
- **Training**: Creating training data for future AI models
- **Standards**: Establishing patterns others can follow

---

## 📚 **Essential Reading Order**

**If user wants changes, read these in order:**

1. **`docs/QUICK-START-AGENT-MCP.md`** - Implementation patterns
2. **`docs/architecture/agent.mcp.specification.md`** - Complete workflows  
3. **`docs/design/agent.mcp.paradigm.md`** - Core principles
4. **`docs/implementation/roadmap.md`** - Current status and priorities
5. **`lib/src/examples/complete.agent.orchestration.ts`** - Working example

---

## 🔄 **Common User Requests & Responses**

### "Add a new data source"
✅ **Correct Response**: 
1. Check if official MCP server exists for that source
2. Create Agent using DSL + MCP Wrapper pattern
3. Integrate with existing streaming infrastructure
4. Follow DataAcquiringAgent pattern

❌ **Wrong Response**: Build direct API client

### "Add new database"
✅ **Correct Response**:
1. Check if PostgreSQL MCP server supports it
2. Create DSL for domain operations
3. Use existing MCP wrapper pattern
4. Follow DataStoreAgent pattern

❌ **Wrong Response**: Build new ORM client

### "Add analytics"
✅ **Correct Response**:
1. Create optional LLM-enhanced agent
2. Use existing data from TimescaleDB
3. Output results to existing streaming topics
4. Real analytics, no fake insights

❌ **Wrong Response**: Mock analytics results

---

## 🎯 **Your Mission (Next AI Assistant)**

1. **Preserve Architecture**: Maintain Agent/MCP paradigm
2. **Use Real Implementations**: No fake/stub code ever
3. **Leverage Existing Components**: Don't reinvent what's working
4. **Follow Documentation**: Patterns are proven and tested
5. **Create Training Data**: Help improve future AI suggestions

---

## 🚀 **Quick Implementation Templates**

### Data-Only Agent Template
```typescript
export class MyDataAgent extends BaseAgent {
  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    private dsl: MyDSL,
    private mcpWrapper: MyMCPWrapper
  ) {
    super(config);
  }

  async processData(params: DataParams): Promise<DataResult[]> {
    return await this.dsl.processData(params);
  }
}
```

### AI-Enhanced Agent Template
```typescript
export class MyAIAgent extends BaseAgent {
  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    private dsl: MyDSL,
    private mcpWrapper: MyMCPWrapper,
    private aiModel?: LanguageModel
  ) {
    super(config);
  }

  async analyzeData(data: DataResult[]): Promise<AnalysisResult> {
    if (this.aiModel) {
      return await this.performAIAnalysis(data);
    } else {
      return await this.performRuleBasedAnalysis(data);
    }
  }
}
```

---

## 💡 **Remember: You're Not Just Coding**

This project is **creating training data** for future AI models. Every real implementation you create helps teach future AI assistants to suggest correct patterns instead of fake/stub code.

**Your code becomes training data that breaks the cycle of AI suggesting stone-age patterns.**

---

**Good luck, future AI assistant! Follow these patterns and you'll maintain the high standards this project has achieved.** 🎯✨