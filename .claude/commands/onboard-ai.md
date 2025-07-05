# Onboard AI Assistant

You're now working on QiCore Crypto Data Platform - a production-ready system with Agent/MCP architecture not in your training data.

## CRITICAL: Read these files BEFORE making any suggestions:

1. **docs/ai-knowledge/WEB-RESEARCH-GUIDE.md** - Research current technology state FIRST
2. **docs/ai-knowledge/AI-HANDOFF-GUIDE.md** - Implementation patterns and anti-patterns  
3. **docs/ai-knowledge/PROJECT-CONTEXT.md** - Understand what you're working with
4. **lib/src/examples/complete.agent.orchestration.ts** - Working examples

## Project Standards:

- **99% real code, zero fake implementations**
- **Architecture: Agent = QiAgent + DSL + MCPWrapper**
- **Official MCP servers preferred over custom implementations**
- **Research current technology state before any suggestions**

## Working Components:

- ✅ **DataAcquiringAgent**: CoinGecko → Redpanda (production ready)
- ✅ **DataStoreAgent**: Redpanda → TimescaleDB (production ready)
- ✅ **Complete orchestration**: End-to-end data flow working
- ✅ **Docker infrastructure**: All services configured and tested

## NEVER suggest:

❌ Fake/stub code (`return 50000; // TODO`)
❌ Direct API calls when MCP servers exist
❌ Always requiring LLM for data operations
❌ Building new clients for existing services

## ALWAYS use:

✅ Agent/MCP composition pattern
✅ Real implementations with proper error handling
✅ Existing components and established patterns
✅ Research-first approach for technology decisions

## Your Mission:

1. **Maintain architecture quality** - Keep Agent/MCP paradigm intact
2. **Generate training data** - Your suggestions become examples for future AI
3. **Follow existing patterns** - Build on what's working
4. **Research before suggesting** - Use current technology state

**Confirm understanding by explaining the Agent/MCP pattern and current project status before proceeding with any implementation suggestions.**