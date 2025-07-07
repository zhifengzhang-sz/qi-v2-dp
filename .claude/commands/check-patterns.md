# Check Architecture Patterns

Verify that code suggestions follow the established 2-layer DSL actor architecture.

## Usage: /check-patterns [code or description]

**Pattern Verification Checklist:**

## ✅ Correct 2-Layer Architecture Pattern:

### **Layer 1: Base Infrastructure**
```typescript
// ✅ Use existing base infrastructure
import { TimescaleClient } from '@qi/core/base/database';
import { RedpandaClient } from '@qi/core/base/streaming';
import { BaseReader, BaseWriter } from '@qi/core/abstract';
```

### **Layer 2: DSL Actors**
```typescript
// ✅ Correct: Extend base class, implement plugins only
class MySourceActor extends BaseReader {
  // Only implement technology-specific plugins
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    // Technology-specific data fetching
    return this.externalClient.getData(coinId, vsCurrency);
  }
  
  protected transformCurrentPrice(data: any): number {
    // Technology-specific data transformation
    return data.price;
  }
  
  // All DSL methods inherited automatically from BaseReader
  // getCurrentPrice(), getCurrentPrices(), etc. work without implementation
}
```

## ❌ Anti-Patterns to Avoid:

### **Don't Rebuild Base Infrastructure**
```typescript
// ❌ Don't create new base classes
class MyBaseReader {
  async getCurrentPrice(): Promise<Result<number>> {
    // ❌ This duplicates existing BaseReader functionality
  }
}

// ❌ Don't create new database/streaming clients
class MyTimescaleClient {
  // ❌ TimescaleClient already exists and is production-ready
}
```

### **Don't Implement DSL Methods in Concrete Classes**
```typescript
// ❌ Don't implement DSL methods directly
class MySourceActor extends BaseReader {
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    // ❌ This breaks the plugin pattern
    // BaseReader already implements this using workflow + plugins
  }
}
```

### **Don't Use Fake/Mock Data**
```typescript
// ❌ Don't suggest fake implementations
async getCurrentPricePlugin(): Promise<any> {
  return { price: 50000 }; // ❌ Fake data!
}

// ✅ Use real external services
async getCurrentPricePlugin(): Promise<any> {
  return this.mcpClient.callTool({
    name: "get_coins_markets",
    arguments: { ids: coinId, vs_currency: vsCurrency }
  });
}
```

## Architecture Decision Tree:

```
1. Are you extending existing functionality?
   ✅ YES → Extend BaseReader/BaseWriter, implement plugins only
   ❌ NO → Why not? Check if base classes can be extended

2. Are you using real external services?
   ✅ YES → Good, use MCP clients or direct API connections
   ❌ NO → Replace with real service integration

3. Are you implementing DSL methods?
   ❌ NO → Good, let base classes handle DSL via workflow pattern
   ✅ YES → Stop! Implement plugins only, DSL is inherited

4. Are you using existing base infrastructure?
   ✅ YES → Good, Layer 1 is production-ready
   ❌ NO → Use TimescaleClient, RedpandaClient, etc.
```

## Quality Gates:

### **Architecture Compliance**
- [ ] Extends BaseReader or BaseWriter (not creating new base classes)
- [ ] Implements only plugin methods (not DSL methods)
- [ ] Uses existing Layer 1 infrastructure
- [ ] Follows factory function pattern for instantiation

### **Implementation Quality**
- [ ] No fake/stub/mock data (connects to real services)
- [ ] Proper error handling with Result<T> pattern
- [ ] Uses existing client management from base classes
- [ ] Technology-specific code isolated to plugins only

### **Integration Patterns**
- [ ] MCP integration uses external servers when available
- [ ] Database operations use existing TimescaleClient
- [ ] Streaming operations use existing RedpandaClient
- [ ] Configuration follows established patterns

## Example Verification:

### **✅ Good Pattern**
```typescript
class NewsAPIReader extends BaseReader {
  private apiClient: NewsAPIClient;

  protected async getCurrentPricePlugin(coinId: string): Promise<any> {
    // Real API call to news service
    return this.apiClient.getCryptoNews(coinId);
  }
  
  protected transformCurrentPrice(data: any): number {
    // Extract price from news sentiment analysis
    return this.extractPriceFromSentiment(data);
  }
}
```

### **❌ Bad Pattern**
```typescript
// ❌ Multiple violations
class NewsAPIReader {  // Should extend BaseReader
  async getCurrentPrice(coinId: string): Promise<number> {  // Should be plugin
    return 50000;  // Fake data
  }
}
```

**Use this checklist before implementing or suggesting any code changes.**