# QiCore Crypto Data Platform - Project Context

## 🎯 **Current Reality (2025-07-06)**

This is a **working cryptocurrency data platform** with TRUE Actor pattern implementation. Focus is on completing the Redpanda data flow.

---

## 📋 **Quick Status Check**

```bash
# See what actually works
bun app/demos/publishers/simple-crypto-data-demo.ts
bun run test lib/tests/publishers/sources/coingecko/CoinGeckoActor.test.ts
ls lib/src/base/  # Solid infrastructure
ls lib/src/qicore/base/  # MarketDataReader abstract base
```

---

## ✅ **What Actually Exists and Works**

### **TRUE Actor Pattern Implementation**
- **CoinGeckoActor**: Concrete MarketDataReader with 5 DSL methods
- **Abstract Base**: MarketDataReader in `lib/src/qicore/base/index.ts`
- **Real Data**: Live cryptocurrency prices (Bitcoin ~$108K, Ethereum ~$2.5K)
- **Functional Error Handling**: Result<T> with `_tag` and `.right` properties

### **Infrastructure (Working)**
- **Docker Services**: Redpanda, TimescaleDB, ClickHouse, Redis
- **Low-level Base**: Solid foundation in `lib/src/base/`
- **Test Suite**: All tests pass with real API integration
- **TypeScript**: Working with path alias workarounds

### **Key Files That Work**
- `lib/src/publishers/sources/coingecko/CoinGeckoActor.ts`
- `app/demos/publishers/simple-crypto-data-demo.ts`
- `lib/src/qicore/base/index.ts`

---

## 🚧 **What Needs to Be Done Next**

### **Immediate Implementation Plan**
1. **Rename**: CoinGeckoActor → CoinGeckoReader  
2. **Build MCP Client**: Over existing `lib/src/base/` infrastructure for Redpanda
3. **Implement RedpandaReader**: Another MarketDataReader actor
4. **Implement MarketDataWriter**: Abstract base for opposite data flow
5. **Implement CoinGeckoWriter**: Concrete writer
6. **Complete Demo**: End-to-end data flow through Redpanda

### **Target Data Flow**
```
CoinGeckoReader → RedpandaWriter → RedpandaReader → CoinGeckoWriter
```

### **What to Clean Up**
- High-level demo files with outdated architecture concepts
- Documentation referencing non-existent patterns
- Keep `lib/src/base/` - it's solid infrastructure

---

## 🎯 **Implementation Guidelines**

### **Follow the Working Pattern**
1. **Extend MarketDataReader**: Like CoinGeckoActor does
2. **Implement DSL Methods**: Domain-specific financial functions
3. **Use Result<T>**: Check `_tag === "Right"` and extract `.right`
4. **Build on Base Infrastructure**: Use existing `lib/src/base/` modules
5. **Test with Real Data**: All implementations must work with live services

### **Architecture Principles**
- TRUE Actor = extends MarketDataReader + provides DSL interfaces
- No fake/stub implementations - everything must work
- Use functional error handling throughout
- Build MCP clients over low-level base modules

---

## 📁 **Key Files to Study**

### **Working Implementation (Study These)**
- **`lib/src/qicore/base/index.ts`** - MarketDataReader abstract base
- **`lib/src/publishers/sources/coingecko/CoinGeckoActor.ts`** - Working actor example
- **`app/demos/publishers/simple-crypto-data-demo.ts`** - How to use actors
- **`lib/src/base/`** - Low-level infrastructure modules

### **Configuration and Scripts**
- **`tsconfig.json`** - Path aliases (with workaround needed)
- **`check-single-file.sh`** - TypeScript individual file checking
- **`lib/check-file.sh`** - TypeScript checking from lib directory

### **Tests (All Working)**
- **`lib/tests/publishers/sources/coingecko/CoinGeckoActor.test.ts`**
- All tests pass with real cryptocurrency data

---

## 🔍 **Understanding Verification**

You understand the project when you can:

### **TRUE Actor Pattern** ✅
- [ ] Explain: Actor extends MarketDataReader base class
- [ ] Implement: DSL methods that return Result<T>
- [ ] Handle: `_tag === "Right"` checks and `.right` extraction
- [ ] Follow: CoinGeckoActor as the reference implementation

### **Technical Stack** ✅  
- [ ] Use: Existing `lib/src/base/` infrastructure
- [ ] Work with: Real cryptocurrency data (no mocks)
- [ ] Handle: TypeScript path alias issues with shell scripts
- [ ] Test: All implementations with live API data

### **Implementation Plan** ✅
- [ ] Rename: CoinGeckoActor → CoinGeckoReader
- [ ] Build: MCP clients over base modules
- [ ] Create: RedpandaReader and MarketDataWriter patterns
- [ ] Complete: End-to-end Redpanda data flow

---

## ⚡ **Quick Commands to Get Started**

```bash
# Test the working actor
bun app/demos/publishers/simple-crypto-data-demo.ts

# Run the test suite  
bun run test lib/tests/publishers/sources/coingecko/CoinGeckoActor.test.ts

# Check the structure
ls lib/src/base/                    # Solid infrastructure
ls lib/src/qicore/base/            # MarketDataReader base
ls lib/src/publishers/sources/     # CoinGeckoActor location

# TypeScript checking (individual files)
./check-single-file.sh lib/src/publishers/sources/coingecko/CoinGeckoActor.ts
```

---

## 🎓 **Learning the Pattern**

### **Step 1: Study CoinGeckoActor**
```typescript
// Abstract base
export abstract class MarketDataReader {
  // Base functionality in lib/src/qicore/base/index.ts
}

// Concrete implementation
export class CoinGeckoActor extends MarketDataReader {
  // 5 DSL methods: getCurrentPrices, getHistoricalPrices, etc.
  // All return Result<T> with functional error handling
}
```

### **Step 2: Understand Result<T> Pattern**
```typescript
const result = await coinGecko.getCurrentPrices(["bitcoin"]);
if (result._tag === "Left") {
  console.error(result.left.message);
  return;
}
const prices = result.right; // Extract actual data
```

### **Step 3: Follow the Implementation Plan**
- Rename CoinGeckoActor → CoinGeckoReader
- Build RedpandaReader using same pattern
- Create MarketDataWriter abstract base
- Implement complete data flow

---

## 🚨 **Common Mistakes to Avoid**

- ❌ **Don't rebuild** the low-level infrastructure in `lib/src/base/`
- ❌ **Don't create fake data** - all implementations must work with real APIs
- ❌ **Don't ignore Result<T>** - always check `_tag` and handle errors
- ❌ **Don't skip testing** - run demos and tests to verify

## ✅ **Success Indicators**

- ✅ Following CoinGeckoActor implementation pattern
- ✅ Building on existing `lib/src/base/` infrastructure  
- ✅ Using functional error handling with Result<T>
- ✅ Creating real data flows, not theoretical examples
- ✅ Completing the end-to-end Redpanda demonstration

---

**Last Updated**: 2025-07-06  
**Project Status**: Working actor implementation, ready for Redpanda expansion  
**Next Milestone**: Complete end-to-end data flow through Redpanda services