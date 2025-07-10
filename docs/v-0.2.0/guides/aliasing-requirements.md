# Module Aliasing Requirements

## Critical Requirement

**All imports in `app/`, `tests/`, and external modules MUST use module aliasing. Relative imports are FORBIDDEN.**

This requirement is **critically important** as it allows module relocation without changing source code. Relative imports within the `lib/` project are allowed only for internal module communication.

## Module Categories

### 1. Internal Modules (`lib/src/`)
- **Allowed**: Relative imports within `lib/src/` 
- **Purpose**: Internal module communication only
- **Example**: `import { BaseReader } from "./abstract/BaseReader"`

### 2. External Modules
- **qicore**: Considered external (copied for convenience)
- **External packages**: All npm packages
- **MUST use aliasing**: No exceptions

### 3. Application Code (`app/`, `tests/`)
- **MUST use aliasing**: For ALL imports from `lib/`
- **FORBIDDEN**: Relative imports to `lib/`
- **Purpose**: Module relocation without source changes

## Aliasing Configuration

### Current TypeScript Aliases

```json
{
  "paths": {
    "@qi/core": ["lib/src/index.ts"],
    "@qi/core/base": ["lib/src/qicore/base/index.ts"],
    "@qi/core/*": ["lib/src/qicore/*"],
    "@qi/fp": ["lib/src/fp/index.ts"],
    "@qi/fp/dsl": ["lib/src/fp/dsl/index.ts"],
    "@qi/fp/*": ["lib/src/fp/*"],
    "@qi/dp/dsl": ["lib/src/dsl/index.ts"],
    "@qi/dp/actors/*": ["lib/src/actors/*"]
  }
}
```

## Import Rules by Location

### ✅ Correct Examples

#### Application Code (`app/`)
```typescript
// CORRECT - Using aliases
import { Price, OHLCV, createMarketContext } from "@qi/core";
import { createCoinGeckoMCPReader } from "@qi/fp";
import { getData, getError, isSuccess } from "@qi/core/base";

// FORBIDDEN - Relative imports
// import { Price } from "../lib/src/index"; // ❌ NEVER DO THIS
// import { BaseReader } from "../../lib/src/abstract/BaseReader"; // ❌ NEVER DO THIS
```

#### Test Code (`tests/`, `lib/tests/`)
```typescript
// CORRECT - Using aliases
import { BaseReader } from "@qi/dp/actors/abstract/readers/BaseReader";
import { Result } from "@qi/core/base";
import { createCoinGeckoMCPReader } from "@qi/fp";

// FORBIDDEN - Relative imports
// import { BaseReader } from "../lib/src/actors/abstract/readers/BaseReader"; // ❌ NEVER DO THIS
```

#### Internal Modules (`lib/src/`)
```typescript
// ALLOWED - Relative imports within lib/src/
import { BaseReader } from "./abstract/BaseReader";
import { DSLInterface } from "../dsl/interfaces";

// REQUIRED - Aliases for external modules
import { Result } from "@qi/core/base"; // qicore is external
import { Client } from "@modelcontextprotocol/sdk/client/index.js"; // npm package
```

### ❌ Forbidden Examples

#### Application/Test Code
```typescript
// FORBIDDEN - Relative paths to lib
import { Price } from "../lib/src/index"; // ❌
import { BaseReader } from "../../lib/src/abstract/BaseReader"; // ❌
import { Result } from "../lib/src/qicore/base"; // ❌

// FORBIDDEN - Direct lib imports
import { Price } from "lib/src/index"; // ❌
```

## Benefits of Aliasing

### 1. Module Relocation Freedom
```typescript
// If we move lib/src/fp to lib/src/functional-programming
// Application code remains unchanged:
import { createPureReader } from "@qi/fp"; // Still works!

// Without aliasing, would need to update all relative paths:
// "../lib/src/fp/..." → "../lib/src/functional-programming/..."
```

### 2. Clean Imports
```typescript
// Clean, semantic imports
import { createCoinGeckoMCPReader } from "@qi/fp";
import { Price, OHLCV } from "@qi/core";

// vs messy relative paths
import { createCoinGeckoMCPReader } from "../../../lib/src/fp/market/crypto/actors/sources/CoinGeckoMCPReader";
```

### 3. Refactoring Safety
- **Module moves**: Update tsconfig.json only
- **Package renames**: Update aliases, not every file
- **Architecture changes**: Transparent to application code

## Available Aliases

### Core System
```typescript
// Main library exports
import { ... } from "@qi/core";

// Core utilities and error handling
import { Result, getData, getError } from "@qi/core/base";

// Any qicore module
import { ... } from "@qi/core/*";
```

### FP System (v-0.2.0)
```typescript
// Main FP system
import { createCoinGeckoMCPReader, createPureReader } from "@qi/fp";

// FP DSL interfaces and types
import { MarketContext, Price, OHLCV } from "@qi/fp/dsl";

// Any FP module
import { ... } from "@qi/fp/*";
```

### Data Platform (v-0.1.0)
```typescript
// Main DSL
import { MarketDataReadingDSL } from "@qi/dp/dsl";

// Actors
import { CoinGeckoMarketDataReader } from "@qi/dp/actors/sources/coingecko";
import { BaseReader } from "@qi/dp/actors/abstract/readers/BaseReader";
```

## Common Mistakes

### 1. Using Relative Imports in App Code
```typescript
// WRONG - Don't do this in app/ or tests/
import { Price } from "../lib/src/index";

// CORRECT - Use aliases
import { Price } from "@qi/core";
```

### 2. Mixing Import Styles
```typescript
// INCONSISTENT - Mixing relative and aliased imports
import { Price } from "@qi/core";
import { BaseReader } from "../lib/src/abstract/BaseReader"; // Wrong!

// CORRECT - Use aliases consistently
import { Price } from "@qi/core";
import { BaseReader } from "@qi/fp/market/crypto/actors/abstract/BaseReader";
```

### 3. Forgetting External Module Rules
```typescript
// WRONG - Relative import to external module (qicore)
import { Result } from "../qicore/base";

// CORRECT - Alias for external module
import { Result } from "@qi/core/base";
```

## Implementation Checklist

### For Application Code (`app/`)
- [ ] All imports use `@qi/*` aliases
- [ ] No relative imports to `lib/`
- [ ] No direct `lib/src/...` imports
- [ ] External packages use proper imports

### For Test Code (`tests/`, `lib/tests/`)
- [ ] All imports use `@qi/*` aliases
- [ ] No relative imports to `lib/` from outside
- [ ] Test utilities use proper aliases
- [ ] Mock imports use aliases

### For Library Code (`lib/src/`)
- [ ] Internal relative imports allowed
- [ ] External modules use aliases (`@qi/core/base`)
- [ ] npm packages use standard imports
- [ ] No relative imports to external modules

## Verification

### TypeScript Check
```bash
# This should pass without errors
bun run typecheck
```

### Import Audit
```bash
# Check for forbidden relative imports in app/
grep -r "from ['\"]\.\..*lib/" app/ && echo "❌ Found forbidden imports" || echo "✅ All imports clean"

# Check for forbidden relative imports in tests/
grep -r "from ['\"]\.\..*lib/" tests/ && echo "❌ Found forbidden imports" || echo "✅ All imports clean"
```

## Migration Guide

### Step 1: Identify Violations
```bash
# Find all relative imports to lib/ in app and tests
find app/ tests/ -name "*.ts" -exec grep -l "from ['\"]\.\..*lib/" {} \;
```

### Step 2: Replace with Aliases
```typescript
// Before
import { Price } from "../lib/src/index";
import { BaseReader } from "../../lib/src/abstract/BaseReader";

// After
import { Price } from "@qi/core";
import { BaseReader } from "@qi/fp/market/crypto/actors/abstract/BaseReader";
```

### Step 3: Verify
```bash
# Ensure no broken imports
bun run typecheck

# Run tests to ensure functionality
bun run test:unit
```

## Adding New Aliases

### 1. Update tsconfig.json
```json
{
  "paths": {
    "@qi/new-module": ["lib/src/new-module/index.ts"],
    "@qi/new-module/*": ["lib/src/new-module/*"]
  }
}
```

### 2. Update Documentation
- Add to this aliasing guide
- Update main README examples
- Add to getting started guide

### 3. Communicate Changes
- Update team on new aliases
- Add to development guidelines
- Include in code review checklist

---

**Remember**: Aliasing is not just a convenience—it's a critical architectural requirement that enables module relocation without source code changes. Always use aliases for external module imports in `app/` and `tests/`.