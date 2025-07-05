# Update Technology Knowledge Command

## Command: `/update-tech-knowledge`

**Purpose**: Research and update knowledge about all technologies and packages used in the QiCore Crypto Data Platform

## Usage
```
/update-tech-knowledge [category]
```

**Categories**:
- `all` (default) - Update all technology knowledge
- `frameworks` - AI frameworks and QiCore components
- `databases` - Database technologies and clients
- `streaming` - Message brokers and streaming platforms
- `crypto` - Cryptocurrency APIs and trading libraries
- `infrastructure` - Runtime, containerization, and dev tools

## Implementation Instructions for Claude

When this command is executed, perform the following research sequence:

### 1. QiCore Framework Research
```typescript
// Current usage in project
"@qicore/agent-lib": "workspace:*"
```

**Research Tasks**:
- Search for QiCore framework documentation and latest versions
- Check for any updates to qiprompt, qimcp, qiagent modules
- Verify MCP (Model Context Protocol) specification updates
- Look for best practices in AI agent orchestration

**Web Search Queries**:
- "QiCore agent framework TypeScript MCP"
- "Model Context Protocol 2024 specification updates"
- "AI agent orchestration best practices TypeScript"

### 2. AI & Model Integration Research
```typescript
// Current packages
"ai": "^4.3.16"
"ollama-ai-provider": "^1.2.0"
"@ai-sdk/anthropic": "^1.2.12"
"@ai-sdk/openai": "^1.3.22"
```

**Research Tasks**:
- Check for updates to Vercel AI SDK
- Research latest Ollama provider capabilities
- Verify Anthropic and OpenAI SDK compatibility
- Look for new model providers or integration patterns

**Web Search Queries**:
- "Vercel AI SDK latest version 2024 updates"
- "Ollama TypeScript provider latest features"
- "Anthropic Claude API TypeScript SDK updates"
- "OpenAI API TypeScript integration best practices"

### 3. Database Technology Research
```typescript
// Current packages
"@timescale/toolkit": "^0.0.12"
"@clickhouse/client": "^0.2.5"
"pg": "^8.11.0"
"redis": "^4.6.0"
```

**Research Tasks**:
- Check TimescaleDB latest features and performance improvements
- Research ClickHouse client updates and optimization techniques
- Verify PostgreSQL compatibility and best practices
- Look for Redis optimization patterns for AI agent state

**Web Search Queries**:
- "TimescaleDB 2024 features performance cryptocurrency data"
- "ClickHouse TypeScript client latest version"
- "PostgreSQL TypeScript best practices time series"
- "Redis AI agent state management patterns"

### 4. Streaming & Messaging Research
```typescript
// Current packages
"kafkajs": "^2.2.4"
"@redpanda-data/console": "^2.3.0"
"ws": "^8.14.0"
```

**Research Tasks**:
- Research Redpanda vs Kafka performance comparisons
- Check for KafkaJS updates and performance optimizations
- Look for WebSocket best practices in trading applications
- Verify Redpanda console management features

**Web Search Queries**:
- "Redpanda vs Apache Kafka 2024 performance trading"
- "KafkaJS TypeScript latest version features"
- "WebSocket real-time trading data best practices"
- "Redpanda data streaming cryptocurrency applications"

### 5. Cryptocurrency & Trading Research
```typescript
// Current packages
"ccxt": "^4.3.0"
"technicalindicators": "^3.1.0"
"tulind": "^0.8.21"
```

**Research Tasks**:
- Check CCXT library for new exchange integrations
- Research latest technical indicators and trading patterns
- Look for performance optimizations in technical analysis
- Verify cryptocurrency data provider reliability

**Web Search Queries**:
- "CCXT cryptocurrency exchange library 2024 updates"
- "technical indicators JavaScript TypeScript latest"
- "cryptocurrency trading algorithms 2024 best practices"
- "CryptoCompare API alternatives comparison 2024"

### 6. Infrastructure & Development Research
```typescript
// Current packages
"bun": ">=1.2.0"
"typescript": "^5.7.2"
"docker": "compose"
```

**Research Tasks**:
- Check Bun runtime latest performance improvements
- Research TypeScript 5.x new features for our use case
- Look for Docker optimization patterns for data platforms
- Verify development workflow best practices

**Web Search Queries**:
- "Bun runtime 2024 TypeScript performance improvements"
- "TypeScript 5.7 features AI applications"
- "Docker compose cryptocurrency data platform optimization"
- "TypeScript AI agent development best practices 2024"

## Output Format

After completing research, update the following files:

### 1. Update CLAUDE.md
Add new section:
```markdown
## Technology Knowledge (Last Updated: [DATE])

### Key Findings
- [Technology]: [Latest version] - [Key updates/features]
- [Framework]: [Status] - [Recommendations]

### Deprecated/Security Concerns
- [Package]: [Issue] - [Recommended action]

### New Opportunities
- [Technology]: [Benefit] - [Implementation suggestion]
```

### 2. Update PROJECT_KNOWLEDGE.md
Update the dependencies section with:
```markdown
## Technology Stack Updates (Last Updated: [DATE])

### Recommended Updates
- [Package]: [Current] → [Latest] - [Reason]

### New Technologies to Consider
- [Technology]: [Use case] - [Integration effort]

### Security & Performance Notes
- [Finding]: [Impact] - [Action needed]
```

### 3. Create Technology Report
Create a new file: `docs/tech-research-[DATE].md` with:
```markdown
# Technology Research Report - [DATE]

## Executive Summary
[Brief overview of key findings]

## Detailed Findings
[Detailed research results by category]

## Recommendations
[Prioritized action items]

## Implementation Plan
[How to apply updates to current project]
```

## Example Usage

```bash
# Update all technology knowledge
/update-tech-knowledge all

# Focus on AI frameworks only
/update-tech-knowledge frameworks

# Check database technologies
/update-tech-knowledge databases
```

## Success Criteria

The command succeeds when:
- ✅ All web searches completed for relevant technologies
- ✅ Findings documented with specific version numbers and features
- ✅ Security vulnerabilities identified and flagged
- ✅ Performance improvements and new opportunities highlighted
- ✅ Actionable recommendations provided with implementation effort estimates
- ✅ Documentation files updated with timestamp and findings

## Notes for Claude

- **Always verify**: Check package versions against our current usage
- **Security focus**: Flag any security vulnerabilities or deprecated packages
- **Performance impact**: Assess how updates might affect our real-time trading platform
- **Breaking changes**: Identify any updates that might require code changes
- **New opportunities**: Look for technologies that could enhance our AI agent capabilities

This command should be run monthly or before major development phases to ensure the project uses the latest, most secure, and performant technologies.