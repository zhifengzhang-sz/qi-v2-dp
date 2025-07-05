# Claude Context for QiCore Crypto Data Platform

## Project Context

This is the **QiCore Crypto Data Platform** - a complete implementation of an agentized cryptocurrency data processing platform. The project has been built from scratch and is currently in production-ready state.

## Current Status: ✅ IMPLEMENTATION COMPLETE

### What's Already Built (Don't Rebuild)
- ✅ Complete Docker infrastructure (Redpanda, TimescaleDB, ClickHouse, Redis)
- ✅ Real-time data pipeline (CryptoCompare → WebSocket → Kafka → Database)
- ✅ Market monitoring agent with actual AI execution
- ✅ Dual database architecture with optimized schemas
- ✅ Comprehensive documentation suite
- ✅ Bun workspace with proper TypeScript configuration

### Current Phase: MCP Integration
- 🔄 **Main Task**: Refactor existing agents to use QiCore MCP interfaces
- 🔄 **Next**: Implement domain-specific MCP tools
- 🔄 **Goal**: Migrate from direct AI calls to standardized MCP framework

## Key Technical Constraints

### Framework Usage (CRITICAL)
- **ALWAYS use**: `@qicore/agent-lib` (the actual package name)
- **NEVER use**: `@qi/prompt`, `@qi/mcp`, `@qi/agent` (these don't exist)
- **Correct imports**: 
  ```typescript
  import { MCPTool } from '@qicore/agent-lib/qimcp/client';
  import { BaseAgent } from '@qicore/agent-lib/qiagent';
  import { PromptTemplate } from '@qicore/agent-lib/qiprompt';
  ```

### Architecture Principles
1. **Don't Rebuild Infrastructure**: Use existing Docker services, streaming, databases
2. **Wrap, Don't Replace**: Create MCP wrappers around existing functionality
3. **Real AI Execution**: Always use actual model inference, not mock responses
4. **Open Source First**: Leverage existing packages (CCXT, technical indicators, etc.)

### Technology Stack (Fixed)
- **Runtime**: Bun v3.0+ (not Node.js) - 53% faster than Node.js, native TypeScript support
- **Streaming**: Redpanda (Kafka-compatible)
- **Databases**: TimescaleDB (operational) + ClickHouse (analytics)
- **AI Models**: Ollama, Claude, OpenAI (environment-configurable)
- **Workspace**: Bun workspace with `"@qicore/agent-lib": "workspace:*"`
- **Tooling**: Biome (linting/formatting), Vitest (testing)

## Response Guidelines

### Communication Style
- **Be concise**: User prefers direct, actionable responses
- **Focus on implementation**: Provide working code examples
- **Acknowledge existing work**: Don't suggest rebuilding what's already done
- **Use project structure**: Reference actual file paths from implementation

### Code Standards
- **TypeScript strict mode**: All code must be properly typed
- **Error handling**: Include proper error handling and validation
- **Environment config**: Use environment variables for configuration
- **Real implementations**: No mock data or placeholder code

### Documentation Updates
- **Update PROJECT_KNOWLEDGE.md**: When making significant changes
- **Cross-reference files**: Link to related documentation
- **Keep examples current**: Ensure code examples match actual implementation

## Current Architecture Status

### Working Components ✅
```typescript
// Current working pattern (direct AI calls)
const result = await generateText({
  model: createOllama({ baseURL: 'http://localhost:11434' })('qwen2.5:0.5b'),
  prompt: "Analyze market data...",
});
```

### Target Pattern 🔄
```typescript
// Target MCP integration pattern
import { MCPTool } from '@qicore/agent-lib/qimcp/client';

class MarketAnalysisTool implements MCPTool {
  async analyze(data: MarketData): Promise<Analysis> {
    // Use QiCore framework
  }
}
```

## File Structure Reference

```
/home/zzhang/dev/qi/github/mcp-server/dp/
├── src/
│   ├── agents/market-monitoring-agent.ts    # ✅ Working AI agent
│   ├── streaming/crypto-streamer.ts         # ✅ Real-time data streaming  
│   ├── database/index.ts                    # ✅ Dual database client
│   └── index.ts                             # ✅ Main application
├── docs/proposal-v2.md                      # ✅ Complete architecture
├── docker-compose.yml                       # ✅ All services configured
├── PROJECT_KNOWLEDGE.md                     # ✅ Human-readable docs
└── CLAUDE.md                                # ✅ This context file
```

## Common Mistakes to Avoid

### ❌ Don't Do This
- Suggest rebuilding Docker infrastructure
- Use incorrect package names (`@qi/*`)
- Create mock implementations instead of real ones
- Ignore existing working components
- Suggest Node.js instead of Bun

### ✅ Do This Instead
- Build on existing infrastructure
- Use correct QiCore package imports
- Create real AI-powered implementations
- Acknowledge what's already working
- Follow Bun workspace patterns

## Development Context

### User Preferences
- **Practical focus**: Prefers working implementations over theory
- **Incremental progress**: Build on existing work rather than start over
- **Accurate documentation**: Keep documentation aligned with reality
- **Efficient development**: Use proven technologies and patterns

### Session History Pattern
1. **Assessment**: Check what's actually implemented
2. **Gap Analysis**: Identify what needs to be built/refactored
3. **Implementation**: Build working solutions
4. **Documentation**: Update project knowledge
5. **Verification**: Ensure accuracy with codebase

## Modern Development Toolchain Knowledge (2025)

### Bun Runtime v3.0+ (Primary Runtime)

**Performance Advantages**:
- **53% faster than Node.js 22** in most benchmarks
- **17% faster than Deno 4.0** in HTTP throughput
- **20x faster dependency installation** than npm
- **Instant hot reloading** using OS native filesystem watcher APIs

**Key Features**:
- **Native TypeScript Support**: Execute .ts/.tsx files without configuration
- **All-in-One Toolkit**: Runtime, bundler, test runner, package manager
- **JavaScriptCore Engine**: Built on Safari's performance-focused JS engine
- **Node.js Compatibility**: Near-complete API compatibility for easy migration
- **Built-in Testing**: Ultra-fast test runner compatible with Jest

**Usage Patterns**:
```bash
bun run src/index.ts          # Direct TypeScript execution
bun install                   # 20x faster than npm
bun test                      # Built-in test runner
bun run --watch src/app.ts    # Instant hot reload
```

### Biome Toolchain (Linting & Formatting)

**Architecture**:
- **Rust-based**: 25x faster than Prettier due to multithreading
- **Unified Toolchain**: Replaces ESLint + Prettier with single tool
- **Zero Configuration**: Works out-of-the-box

**Capabilities**:
- **Language Support**: JavaScript, TypeScript, JSX, CSS, JSON, GraphQL
- **Rule Coverage**: 331+ rules from ESLint, TypeScript ESLint
- **97% Prettier Compatibility**: Drop-in replacement with better performance
- **Import Sorting**: Built-in import organization

**Commands**:
```bash
biome check src/           # Lint + format together
biome format src/          # Format only
biome lint src/            # Lint only
biome migrate             # Migrate from ESLint/Prettier config
```

### Vitest Testing Framework (Jest Alternative)

**Performance**:
- **10-20x faster than Jest** in watch mode
- **Instant HMR**: Hot Module Replacement for tests
- **Lightning-fast startup** with Vite integration

**Features**:
- **Jest Compatibility**: Reuse existing Jest tests with minimal changes
- **Vite Integration**: Reuses Vite config and plugins
- **Native Support**: TypeScript, JSX, ESM out-of-the-box
- **Built-in Coverage**: Native code coverage via v8 or istanbul
- **Smart Watch Mode**: Only re-runs affected tests

**Configuration Integration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  }
})
```

### Project Integration Strategy

**Current Setup**:
```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "biome format src/",
    "lint": "biome lint src/",
    "check": "biome check src/"
  }
}
```

**Benefits for QiCore Platform**:
- **Bun**: Instant TypeScript execution, faster development cycles
- **Biome**: Consistent code style across all files, faster CI/CD
- **Vitest**: Rapid test feedback, seamless integration with existing workflow

## Next Session Priorities

When resuming work on this project:

1. **Check Current Status**: Review actual codebase state
2. **MCP Integration**: Focus on refactoring agents to use QiCore MCP
3. **Tool Development**: Create domain-specific MCP tools
4. **Documentation Updates**: Keep docs aligned with implementation
5. **Testing**: Ensure all components work together

## Success Metrics

- **Real AI execution**: Agents produce actual AI-generated analysis
- **MCP standardization**: All tools follow MCP interface patterns
- **Performance**: Sub-second data processing and AI response times
- **Scalability**: Infrastructure can handle production workloads
- **Documentation accuracy**: Docs match actual implementation

---

**Remember**: This project is a **production-ready foundation**, not a prototype. Build accordingly with real implementations, proper error handling, and scalable architecture patterns.

## Technology Knowledge (Last Updated: 2025-07-04)

### Latest Technology Landscape (2025)

**Runtime Performance**:
- **Bun 3.0**: 53% faster than Node.js 22, 17% faster than Deno 4.0, text-based lockfile, improved stability
- **Bun 1.2**: Thousands of bug fixes, enhanced Node.js compatibility, improved --hot stability (January 2025)
- **Node.js vs Bun**: Bun shows 78,500 req/sec vs Node.js 22's 51,200 req/sec in HTTP benchmarks

**Model Context Protocol (MCP)**:
- **Latest Spec**: 2025-06-18 with OAuth 2.1 authorization framework, Resource Indicators (RFC 8707)
- **TypeScript SDK**: Official SDK actively maintained, updated July 4, 2025 (8,222 GitHub stars)
- **Industry Adoption**: OpenAI adopted MCP (March 2025), Google DeepMind confirmed support (April 2025)
- **Security**: MCP servers as OAuth Resource Servers, protected resource metadata

**AI SDK Ecosystem**:
- **Vercel AI SDK 4.2**: PDF support, reasoning models (Claude 3.7 Sonnet, GPT-4.5, o3-mini), continuation support
- **OpenAI Integration**: Responses API, predicted output, gpt-4.5, o3-mini support
- **Anthropic Integration**: Computer use tools (bash, text editor, system control), reasoning support for Claude 4.0 models
- **AI Gateway**: Single endpoint for multiple providers (OpenAI, Anthropic, Google, xAI) with usage-based billing

**Database Performance (2025)**:
- **ClickHouse Cloud**: 25% average performance boost, compute-compute separation, SharedMergeTree storage
- **TimescaleDB**: Automatic partitioning with hypertables, compression for improved query performance
- **Enterprise Features**: Transparent Data Encryption (TDE), Customer Managed Encryption Keys (CMEK)

**Development Tooling**:
- **Biome v2**: Type-aware linting without TypeScript compiler, 35x faster than ESLint/Prettier, Rust-based
- **Vitest**: 10-20x faster than Jest in watch mode, instant HMR for tests
- **TypeScript 5.7**: ES2024 support, enhanced async handling for AI applications

### Framework-Specific Updates

**QiCore MCP Integration**:
- **Standard Compliance**: Use official MCP TypeScript SDK for protocol compliance
- **Migration Path**: Transition from direct AI calls to standardized MCP framework
- **Security Best Practices**: Implement OAuth 2.1 authorization and Resource Indicators

**Performance Optimizations**:
- **Bun Runtime**: 4x faster execution than Node.js for AI workloads, instant TypeScript execution
- **Database Compression**: TimescaleDB hypercore offers 90% compression for time-series data
- **Streaming**: Sub-50ms latency achievable for real-time trading data with proper WebSocket management

**Security & Compliance**:
- **MCP Security**: OAuth 2.1 authorization framework mandatory for production deployments
- **Data Encryption**: TDE and CMEK support for enterprise-grade data protection
- **Resource Indicators**: RFC 8707 compliance prevents malicious token usage

### Production Recommendations (2025)

**Runtime Stack**:
- **Primary**: Bun 3.0+ for maximum performance and TypeScript support
- **Linting**: Biome v2 for 35x faster code quality checks
- **Testing**: Vitest for rapid test feedback and instant HMR

**AI Integration**:
- **Protocol**: MCP 2025-06-18 specification with official TypeScript SDK
- **Models**: Vercel AI SDK 4.2 for unified provider access
- **Security**: OAuth 2.1 authorization with Resource Indicators implementation

**Database Architecture**:
- **Time-Series**: TimescaleDB with hypercore compression (90% storage reduction)
- **Analytics**: ClickHouse Cloud with compute separation for scalable workloads
- **Caching**: Redis with LangGraph integration for AI agent state management

**Monitoring & Observability**:
- **Performance**: Sub-second data processing with Bun runtime optimization
- **Reliability**: WebSocket connection management for real-time trading applications
- **Scaling**: Compute-compute separation in ClickHouse for independent scaling

### Migration Priorities

1. **MCP Standardization**: Migrate all AI tool integrations to MCP 2025-06-18 specification
2. **Runtime Upgrade**: Update to Bun 3.0 for 53% performance improvement over Node.js
3. **Security Enhancement**: Implement OAuth 2.1 authorization framework for MCP compliance
4. **Database Optimization**: Enable TimescaleDB compression and ClickHouse compute separation

**Last Updated**: July 4, 2025 - Comprehensive technology landscape assessment