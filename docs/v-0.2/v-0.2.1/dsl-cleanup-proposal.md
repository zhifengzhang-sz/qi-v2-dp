# DSL Module Cleanup Proposal - v-0.2.1

## Problem Statement

The current `lib/src/dsl/` module violates the single responsibility principle by mixing pure data definitions with business logic, utility functions, and complex operations. This makes the DSL "dirty" and harder to maintain.

## Current Issues

### 1. Mixed Concerns in Data Classes

**Problem**: Data classes contain business logic methods
```typescript
// In types.ts - BUSINESS LOGIC mixed with data
class Level1 {
  get spread(): number { return this.askPrice - this.bidPrice; }
  get midPrice(): number { return (this.bidPrice + this.askPrice) / 2; }
}

class MarketSymbol {
  isCash(): boolean { ... }
  isDerivative(): boolean { ... }
  isFuture(): boolean { ... }
}

class MarketContext {
  getMarketId(): string { ... } // Business logic
}
```

### 2. Utility Functions in DSL

**Problem**: Time interval utilities pollute DSL namespace
```typescript
// In utils.ts - UTILITIES mixed with DSL
export function createTimeInterval(startDate: Date, endDate: Date): TimeInterval
export function createLastNDaysInterval(days: number): TimeInterval
export function validateTimeInterval(timeInterval: TimeInterval): void
```

### 3. Complex Dependencies

**Problem**: Interfaces import utilities, creating coupling
```typescript
// In interfaces.ts
import type { TimeInterval } from "./utils.js"; // Tight coupling
```

## Proposed Solution

### Core Principle
**DSL module should contain ONLY pure data definitions and interface contracts**

### New Structure

```
lib/src/
├── dsl/                     # PURE DATA + CONTRACTS ONLY
│   ├── types.ts            # Data classes: constructor, equals, toString only
│   ├── interfaces.ts       # Interface contracts only
│   └── index.ts            # Clean exports
├── domain/                 # BUSINESS LOGIC
│   ├── market-logic.ts     # isCash(), isDerivative(), getMarketId()
│   ├── price-calc.ts       # spread(), midPrice() calculations
│   └── index.ts
└── utils/                  # GENERAL UTILITIES
    ├── time-intervals.ts   # Time interval utilities
    ├── validation.ts       # Validation functions
    └── index.ts
```

## Implementation Plan

### Phase 1: Clean DSL Types
- Remove all business logic methods from data classes
- Keep only: constructor, equals(), toString()
- Move spread/midPrice calculations to domain module

### Phase 2: Extract Utilities
- Move time interval utilities to `lib/src/utils/time-intervals.ts`
- Remove utils.ts from DSL module
- Update interface imports

### Phase 3: Create Domain Layer
- Create `lib/src/domain/market-logic.ts` for business operations
- Implement functions that operate on DSL types
- Maintain type safety throughout

## Before/After Examples

### Before (Mixed Concerns)
```typescript
// lib/src/dsl/types.ts
class Level1 {
  constructor(public readonly timestamp: Date, ...) {}
  
  // BUSINESS LOGIC - WRONG PLACE
  get spread(): number { return this.askPrice - this.bidPrice; }
  get midPrice(): number { return (this.bidPrice + this.askPrice) / 2; }
  
  equals(other: Level1): boolean { ... }
}
```

### After (Pure Data)
```typescript
// lib/src/dsl/types.ts - PURE DATA
class Level1 {
  constructor(public readonly timestamp: Date, ...) {}
  equals(other: Level1): boolean { ... }
  toString(): string { ... }
}

// lib/src/domain/price-calc.ts - BUSINESS LOGIC
export function getSpread(level1: Level1): number {
  return level1.askPrice - level1.bidPrice;
}

export function getMidPrice(level1: Level1): number {
  return (level1.bidPrice + level1.askPrice) / 2;
}
```

## Benefits

1. **Separation of Concerns**: Pure data vs business logic
2. **Maintainability**: Easier to modify data structures or logic independently
3. **Testability**: Business logic can be tested separately from data structures
4. **Reusability**: Domain functions can work with any DSL-compliant data
5. **Clean Dependencies**: No circular imports or tight coupling

## Migration Strategy

1. **Backward Compatibility**: Maintain existing public API during transition
2. **Gradual Migration**: Move methods one module at a time
3. **Deprecation Warnings**: Mark old methods as deprecated before removal
4. **Documentation**: Update all examples to use new structure

## Success Criteria

- ✅ DSL module contains only data classes and interface contracts
- ✅ No business logic methods in data classes
- ✅ All utilities moved to appropriate modules
- ✅ Clean import dependencies
- ✅ All existing functionality preserved
- ✅ TypeScript compilation clean
- ✅ All tests passing

## Timeline

- **Week 1**: Phase 1 - Clean DSL types
- **Week 2**: Phase 2 - Extract utilities  
- **Week 3**: Phase 3 - Create domain layer
- **Week 4**: Testing and documentation updates

This restructuring will provide a solid foundation for v-0.2.x development and future DSL extensions.