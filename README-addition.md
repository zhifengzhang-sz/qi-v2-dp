## TypeScript Path Alias Workaround

### The Problem
Individual file type checking with path aliases doesn't work:
```bash
bun tsc --noEmit lib/src/file.ts  # ❌ Error: Cannot find module '@qi/core/base'
```

### The Solution
Use our shell script workarounds:

**From root:**
```bash
bun run typecheck:file lib/src/publishers/sources/coingecko/CoinGeckoActor.ts
./check-single-file.sh lib/src/file1.ts lib/src/file2.ts
```

**From lib/:**
```bash
bun run lib:typecheck:file src/publishers/sources/coingecko/CoinGeckoActor.ts  
cd lib && ./check-file.sh src/file1.ts src/file2.ts
```

### Why This "Stupid" Approach
After research: tsx/ts-node are broken with fp-ts + ES modules. This workaround is the only thing that actually works with our functional programming stack.