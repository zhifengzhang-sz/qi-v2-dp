# Check Agent/MCP Patterns

Verify that code suggestions follow the established Agent/MCP paradigm.

## Usage: /check-patterns [code or description]

**Pattern Verification Checklist:**

## ✅ Correct Agent/MCP Pattern:

```typescript
// ✅ Correct: Agent = QiAgent + DSL + MCPWrapper
export class MyAgent extends BaseAgent {
  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    private dsl: MyDSL,              // Domain operations
    private mcpWrapper: MyMCPWrapper, // MCP communication
    private aiModel?: LanguageModel   // Optional AI
  ) {}
}
```

## ❌ Anti-Patterns to Avoid:

```typescript
// ❌ Don't suggest fake data
async getPrice(): Promise<number> {
  return 50000; // Fake!
}

// ❌ Don't suggest direct API calls when MCP server exists
const response = await fetch('https://api.service.com');

// ❌ Don't always require LLM for data operations
constructor(private llm: LanguageModel) {} // Not needed for data-only
```

## Architecture Decision Tree:

```
1. Does official MCP server exist for this service?
   ✅ YES → Use Agent → DSL → MCP Wrapper → Official MCP Server
   ❌ NO → Use Agent → DSL → Low-level Module → Service

2. Does this agent need LLM?
   ✅ Analysis/Reasoning → Include optional LLM
   ❌ Pure Data Operations → No LLM needed

3. Are you building on existing components?
   ✅ YES → Good, maintain patterns
   ❌ NO → Why? Check if existing component can be extended
```

## Quality Gates:

- [ ] No fake/stub code
- [ ] Uses existing components when possible
- [ ] Follows Agent/MCP composition
- [ ] Proper error handling
- [ ] Real service integrations
- [ ] Performance considerations

**Use this checklist before suggesting any implementation.**