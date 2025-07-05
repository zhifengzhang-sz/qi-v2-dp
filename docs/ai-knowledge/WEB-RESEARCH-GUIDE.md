# Web Research Guide for Technology Updates

## 🔍 **CRITICAL: For Next AI Assistant**

**Your training data has a knowledge cutoff. This project uses cutting-edge technologies that may have evolved since your training. You MUST research current state before making suggestions.**

---

## 🚨 **When to Research (Always Check These)**

### **Before ANY Implementation Suggestions:**
- [ ] **MCP Server Availability** - New official servers may exist
- [ ] **Library Versions** - Package versions and breaking changes
- [ ] **Framework Updates** - QiCore, Drizzle, TimescaleDB improvements
- [ ] **Performance Benchmarks** - Updated performance comparisons
- [ ] **Security Updates** - CVEs and security best practices

### **Specific Research Triggers:**
- User mentions a technology not in your training data
- Package versions in project are older than your knowledge cutoff
- Performance claims need verification (e.g., "Redpanda 53% faster")
- Official MCP servers may have been added since training
- Best practices may have evolved

---

## 🔎 **Research Strategy by Technology**

### **1. MCP Servers (CRITICAL - Check First)**

**Search Queries:**
```
"MCP server" site:github.com/modelcontextprotocol/servers
"official MCP server" [technology name] 2024 2025
"@modelcontextprotocol/server-" npm
"MCP tools" [service name] official
```

**Key Sources:**
- https://github.com/modelcontextprotocol/servers (official directory)
- https://www.npmjs.com/search?q=%40modelcontextprotocol (npm packages)
- https://docs.anthropic.com/en/docs/build-with-claude/mcp (official docs)

**What to Look For:**
- New official MCP servers for services we use custom implementations for
- Updated server capabilities and configuration options
- Performance improvements and best practices
- Breaking changes in MCP protocol

**Example Research:**
```
Search: "TimescaleDB MCP server" 2025
Search: "CoinGecko MCP server" official github
Search: "Redpanda MCP server" @modelcontextprotocol
```

### **2. Database Technologies**

**Search Queries:**
```
"Drizzle ORM" performance benchmarks 2024 2025
"TimescaleDB" latest features performance
"database ORM comparison" 2025 TypeScript
"Drizzle vs Prisma" performance 2024
```

**Key Sources:**
- https://orm.drizzle.team (official Drizzle docs)
- https://docs.timescale.com (TimescaleDB docs)
- GitHub repositories for latest issues and releases
- Performance benchmarking blogs and articles

**What to Look For:**
- New Drizzle features that improve performance
- TimescaleDB version updates and new capabilities
- Updated performance benchmarks (our claim: 4,600 req/s)
- New database optimization techniques

### **3. Streaming Technologies**

**Search Queries:**
```
"Redpanda vs Kafka" performance 2024 2025
"Redpanda" latest version features
"streaming performance" comparison 2025
"Kafka alternative" benchmark 2024
```

**Key Sources:**
- https://redpanda.com/blog (official Redpanda blog)
- https://vectorized.io (Redpanda company blog)
- Streaming technology comparison articles
- GitHub repositories and release notes

**What to Look For:**
- Updated performance claims (our claim: 53% faster than Kafka)
- New Redpanda features and capabilities
- Alternative streaming technologies
- Integration improvements

### **4. AI/LLM Technologies**

**Search Queries:**
```
"Agent framework" 2025 TypeScript
"LLM integration" best practices 2025
"AI agent architecture" patterns
"QiAgent" OR "QiCore" updates documentation
```

**Key Sources:**
- https://docs.anthropic.com (Claude documentation)
- https://platform.openai.com/docs (OpenAI documentation)
- AI framework GitHub repositories
- Research papers on agent architectures

**What to Look For:**
- New agent framework patterns
- Performance improvements in LLM APIs
- Updated best practices for AI integration
- Cost optimization strategies

### **5. TypeScript/Node.js Ecosystem**

**Search Queries:**
```
"Bun vs Node.js" performance 2024 2025
"TypeScript 5" new features performance
"npm package" [package-name] security vulnerabilities
"JavaScript runtime" performance comparison 2025
```

**Key Sources:**
- https://bun.sh (official Bun documentation)
- https://www.typescriptlang.org (TypeScript documentation)
- https://nodejs.org/en/blog (Node.js blog)
- NPM security advisories

**What to Look For:**
- Runtime performance improvements
- Security vulnerabilities in dependencies
- New language features that could improve code
- Breaking changes in major versions

---

## 📋 **Research Checklist Template**

### **Before Suggesting Any Technology:**

```markdown
## Technology Research: [Technology Name]

### Current Project Usage:
- Version: [current version in project]
- Purpose: [how we use it]
- Claims: [performance/feature claims we make]

### Research Findings:
- Latest Version: [found version]
- Breaking Changes: [any breaking changes]
- New Features: [relevant new features]
- Performance Updates: [benchmark updates]
- Security Issues: [any CVEs or security updates]

### MCP Server Status:
- Official Server Exists: [yes/no]
- Server Capabilities: [what it can do]
- Recommendation: [use official vs custom implementation]

### Recommendation:
- Action: [update/keep current/research more]
- Reasoning: [why this decision]
- Impact: [effect on project]
```

---

## 🔍 **Specific Research Instructions**

### **1. Verify MCP Server Availability (Priority 1)**

**Always check FIRST before suggesting custom implementations:**

```bash
# Research these specific technologies:
1. "Aiven MCP server" - might support PostgreSQL + Kafka + ClickHouse
2. "CoinGecko MCP server" - crypto data integration
3. "Docker MCP server" - container management
4. "Redis MCP server" - caching operations
5. "ClickHouse MCP server" - analytics database
```

**Research Template:**
```
Search: "[service] MCP server" site:github.com/modelcontextprotocol
Search: "@modelcontextprotocol/server-[service]" npm
Search: "official MCP server [service]" 2024 2025
```

### **2. Performance Claims Verification**

**Our project makes these performance claims - verify current accuracy:**

```bash
# Verify these specific claims:
1. "Drizzle ORM: 4,600 requests/second"
2. "Redpanda: 53% faster than Kafka"  
3. "Bun: 4x faster than Node.js"
4. "TimescaleDB: 90% compression"
```

**Research Template:**
```
Search: "[technology] benchmark" 2024 2025
Search: "[technology] performance comparison" latest
Search: "[claim]" verification independent benchmark
```

### **3. Security and Dependencies**

**Check for security issues in key dependencies:**

```bash
# Research security for:
1. Drizzle ORM - any security advisories
2. PostgreSQL drivers - connection security
3. Kafka/Redpanda clients - authentication updates
4. Docker images - base image vulnerabilities
```

**Research Template:**
```
Search: "[package] security vulnerability" CVE 2024 2025
Search: "[package] npm audit" security
Search: "Docker image [service]" security best practices
```

---

## 📚 **Technology-Specific Deep Dive**

### **MCP Protocol Evolution**

**Essential Research Areas:**
```
1. MCP Protocol Updates:
   - Search: "MCP protocol" v2024 v2025 changelog
   - Look for: New capabilities, breaking changes
   
2. Official Server Ecosystem:
   - Search: "modelcontextprotocol servers" directory 2025
   - Look for: New servers that replace our custom tools
   
3. Performance Improvements:
   - Search: "MCP server performance" optimization 2024
   - Look for: Benchmarks, best practices
```

### **Database Technology Advances**

**Essential Research Areas:**
```
1. TimescaleDB Evolution:
   - Search: "TimescaleDB 2.16" OR "TimescaleDB 2.17" features
   - Look for: New compression, performance improvements
   
2. ORM Performance:
   - Search: "Drizzle ORM" vs "Prisma" vs "Kysely" 2025
   - Look for: Updated benchmarks, new features
   
3. Connection Pooling:
   - Search: "PostgreSQL connection pool" best practices 2025
   - Look for: Performance optimizations, new libraries
```

### **Streaming Platform Updates**

**Essential Research Areas:**
```
1. Redpanda vs Kafka:
   - Search: "Redpanda 2024 benchmark" vs "Apache Kafka"
   - Look for: Updated performance comparisons
   
2. Alternative Platforms:
   - Search: "streaming platform 2025" Apache Pulsar NATS
   - Look for: New competitors, feature comparisons
   
3. Schema Management:
   - Search: "schema registry" comparison 2025
   - Look for: Best practices, new tools
```

---

## ⚡ **Quick Research Workflow**

### **5-Minute Technology Check:**

```bash
1. MCP Server Check (2 minutes):
   - Search: "[technology] MCP server" official
   - Check: github.com/modelcontextprotocol/servers
   
2. Version Check (1 minute):
   - Search: "[package] latest version" 2025
   - Check: npm, GitHub releases
   
3. Security Check (1 minute):
   - Search: "[package] security" CVE vulnerability
   - Check: npm audit, GitHub security tab
   
4. Performance Check (1 minute):
   - Search: "[technology] benchmark" 2024 2025
   - Check: Updated performance claims
```

### **15-Minute Deep Research:**

```bash
1. Comprehensive MCP Research (5 minutes):
   - Official MCP server directory
   - npm @modelcontextprotocol packages
   - Documentation updates
   
2. Alternative Analysis (5 minutes):
   - Competing technologies
   - Feature comparisons
   - Migration considerations
   
3. Implementation Impact (5 minutes):
   - Breaking changes
   - Performance implications
   - Integration complexity
```

---

## 🎯 **Research Output Format**

### **Always Provide Research Summary:**

```markdown
## Research Summary: [Technology/Request]

### MCP Server Status:
- Official Server: [exists/doesn't exist/new since training]
- Capabilities: [what it can do]
- Recommendation: [use official vs keep custom]

### Current Technology Status:
- Latest Version: [version vs project version]
- Major Changes: [breaking changes or new features]
- Performance: [updated benchmarks if available]
- Security: [any issues or updates]

### Implementation Recommendation:
- Action: [specific recommendation]
- Reasoning: [why based on research]
- Migration Effort: [complexity assessment]
- Benefits: [what we gain]
- Risks: [what we might lose]

### Sources:
- [List of sources researched]
```

---

## 🚨 **Critical Research Scenarios**

### **When User Asks About New Technology:**

```markdown
BEFORE suggesting implementation:
1. Research if official MCP server exists
2. Check if technology supersedes current choice
3. Verify performance and security claims
4. Assess migration complexity vs benefits
```

### **When Suggesting Performance Optimizations:**

```markdown
BEFORE claiming performance improvements:
1. Find current benchmarks (not training data)
2. Verify claims with multiple sources
3. Check for recent performance regressions
4. Consider real-world vs synthetic benchmarks
```

### **When Adding New Dependencies:**

```markdown
BEFORE recommending new packages:
1. Check package security and maintenance status
2. Research if functionality exists in current stack
3. Verify if official MCP server provides capability
4. Assess bundle size and performance impact
```

---

## 📖 **Research Documentation Requirements**

### **Always Document Research:**

```typescript
// Include research findings in code comments
export class NewImplementation {
  // Research findings (2025-01-04):
  // - Official MCP server exists: @modelcontextprotocol/server-xyz
  // - Performance: 15% improvement over custom implementation
  // - Security: No known vulnerabilities as of research date
  // - Migration effort: Low - compatible API
  constructor() {
    // Implementation based on research findings
  }
}
```

### **Update Project Documentation:**

```markdown
## Technology Decision Log

### [Date]: [Technology] Research Update
- Research Trigger: [what prompted research]
- Findings: [key discoveries]
- Decision: [what we decided]
- Rationale: [why we decided this]
- Implementation: [how to implement]
```

---

## 💡 **Remember: Research is Part of Implementation**

**Your job is not just to code - it's to:**
1. **Research current best practices** before suggesting solutions
2. **Verify technology claims** with recent data
3. **Find official MCP servers** to replace custom implementations
4. **Update project knowledge** based on findings
5. **Document research** for future AI assistants

**The goal: Ensure suggestions are based on current reality, not outdated training data.**

---

**Last Updated**: 2025-01-04  
**Next Update**: When new AI assistant begins work (research current state first!)  
**Research Frequency**: Before any major technology suggestions