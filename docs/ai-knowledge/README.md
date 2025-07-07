# QiCore Crypto Data Platform - AI Context

## 🎯 **Current Project State (2025-07-06)**

This is a **working crypto data platform** with TRUE Actor pattern implementation. The focus is on real data flow through Redpanda services.

---

## ✅ **What Actually Exists and Works**

### **Core Architecture**
- **TRUE Actor Pattern**: "Class that extends MarketDataReader base and provides DSL interfaces"
- **CoinGeckoActor**: Working concrete implementation with 5 financial DSL methods
- **Abstract Base**: MarketDataReader in `lib/src/qicore/base/index.ts`
- **Low-level Infrastructure**: Solid base modules in `lib/src/base/`
- **Real Data Integration**: Live cryptocurrency prices (Bitcoin ~$108K, Ethereum ~$2.5K)

### **Working Components**
- ✅ CoinGeckoActor with getCurrentPrices, getHistoricalPrices, etc.
- ✅ Result<T> functional error handling with `_tag` and `.right` properties  
- ✅ Docker services (Redpanda, TimescaleDB, ClickHouse, Redis)
- ✅ TypeScript configuration with path aliases
- ✅ Test suite with real API integration

---

## 🚧 **Next Implementation Plan**

### **Immediate Tasks:**
1. **Rename**: CoinGeckoActor → CoinGeckoReader  
2. **Build MCP Client**: Over low-level base modules for Redpanda
3. **Implement RedpandaReader**: Another MarketDataReader actor
4. **Implement MarketDataWriter**: Abstract base for opposite data flow
5. **Implement CoinGeckoWriter**: Concrete writer
6. **End-to-end Demo**: Complete data flow through Redpanda

### **File Structure Understanding:**
```
lib/src/
├── base/                    # ✅ Keep - solid low-level infrastructure
├── qicore/base/            # ✅ Keep - MarketDataReader abstract base
├── publishers/sources/coingecko/  # ✅ Working CoinGeckoActor
└── [high-level demos]      # ❌ Cleanup needed - outdated concepts
```

---

## 🧠 **Key Architecture Concepts**

### **TRUE Actor Pattern:**
```typescript
// Abstract base
class MarketDataReader {
  // Base functionality
}

// Concrete implementation
class CoinGeckoActor extends MarketDataReader {
  // 5 DSL methods: getCurrentPrices, getHistoricalPrices, etc.
  // Returns Result<T> with _tag and .right properties
}
```

### **Data Flow Goal:**
```
CoinGeckoReader → RedpandaWriter → RedpandaReader → CoinGeckoWriter
```

---

## 🔧 **Current Technical Issues**

### **TypeScript Path Aliases:**
- **Problem**: Individual file checking fails with `@qi/core/base` imports
- **Solution**: Use shell script workarounds in `check-single-file.sh` and `lib/check-file.sh`
- **Why**: tsx/ts-node broken with fp-ts + ES modules

### **Code Quality Standards:**
- ✅ **Real implementations only** - No fake/stub code
- ✅ **Functional error handling** - Result<T> pattern with `_tag` checks
- ✅ **Working examples** - All demos use live crypto data
- ✅ **Performance tested** - Sub-second API responses

---

## 📂 **Key Files to Understand**

### **Working Implementation:**
- `lib/src/qicore/base/index.ts` - MarketDataReader abstract base
- `lib/src/publishers/sources/coingecko/CoinGeckoActor.ts` - Concrete actor
- `app/demos/publishers/simple-crypto-data-demo.ts` - Working demo
- `lib/src/base/` - Low-level infrastructure (database, streaming)

### **Configuration:**
- `tsconfig.json` - Path aliases configuration
- `check-single-file.sh` - TypeScript workaround scripts
- `docker-compose.yml` - Services infrastructure

### **Tests:**
- All tests pass with real API data
- Performance: 200-600ms per API call

---

## ⚠️ **What Needs Cleanup**

### **Outdated High-level Code:**
- Most demo/orchestration files reference old architecture concepts
- Documentation mentions non-existent files and patterns
- High-level abstractions that don't match current TRUE Actor implementation

### **Keep vs. Remove:**
- ✅ **Keep**: `lib/src/base/` - solid foundation
- ✅ **Keep**: CoinGeckoActor pattern - it works
- ❌ **Cleanup**: High-level demos with outdated concepts
- ❌ **Update**: Documentation to match actual implementation

---

## 🚀 **Immediate Next Steps**

1. **Start with renaming**: CoinGeckoActor → CoinGeckoReader
2. **Build MCP clients** over existing `lib/src/base/` infrastructure  
3. **Follow the working pattern**: Extend MarketDataReader, implement DSL methods
4. **Use Result<T> everywhere**: Check `_tag === "Right"` and extract `.right`
5. **Test with real data**: All implementations must work with live services

---

## 📋 **Success Criteria**

**You understand the project when you can:**
1. Explain TRUE Actor pattern (extends MarketDataReader + DSL methods)
2. Follow the CoinGeckoActor implementation pattern
3. Use Result<T> functional error handling correctly
4. Build on existing `lib/src/base/` infrastructure
5. Complete the end-to-end Redpanda data flow

---

**Last Updated**: 2025-07-06  
**Project Status**: Working actor implementation, ready for expansion  
**Next Goal**: Complete Redpanda data flow with real cryptocurrency data