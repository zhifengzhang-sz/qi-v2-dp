# PROJECT CONTEXT - Read This First!

## 🎯 **For Future AI Assistants**

If you're an AI assistant asked to work on this project, **START HERE** to understand what you're working with.

---

## 📋 **Quick Project Status Check**

```bash
# Run this to understand current state
find lib/src -name "*.ts" | grep -E "(agent|dsl|wrapper)" | head -20
cat docs/QUICK-START-AGENT-MCP.md
cat docs/AI-HANDOFF-GUIDE.md
```

---

## 🏗️ **What This Project IS**

✅ **Production-Ready Crypto Data Platform**
- Real TimescaleDB database with 4,600 req/s performance
- Real Redpanda streaming (53% faster than Kafka)  
- Real CoinGecko API integration via MCP server
- AI-enhanced data processing and validation
- Complete Docker infrastructure

✅ **Agent/MCP Architecture Implementation**
- DataAcquiringAgent: CoinGecko → Redpanda (working)
- DataStoreAgent: Redpanda → TimescaleDB (working)
- Complete orchestration example (working)
- 99% real code, 0% fake/stub implementations

✅ **Training Data for Future AI Models**
- Structured examples of Agent/MCP patterns
- Anti-patterns documented to prevent AI mistakes
- Real implementation patterns, not theoretical

---

## 🚫 **What This Project is NOT**

❌ **Tutorial or Demo Project**
- This is production-ready code, not educational examples
- Performance requirements: sub-second processing, 4,600+ req/s database
- Real financial data with exact decimal precision

❌ **Traditional Architecture**
- Does NOT use microservices
- Does NOT use direct API calls when MCP servers exist
- Does NOT use always-on LLM for data operations

❌ **Mock/Stub Implementation**
- Zero fake return data allowed
- Zero TODO placeholders in production paths
- Zero mock API responses

---

## 🎯 **Your Mission (Future AI)**

### Primary Goals
1. **Maintain Architecture**: Keep Agent/MCP paradigm intact
2. **Use Real Implementations**: No fake/stub code ever
3. **Follow Existing Patterns**: Don't reinvent what works
4. **Generate Training Data**: Help teach future AI correct patterns

### Secondary Goals
1. Add new data sources using existing patterns
2. Enhance performance while maintaining reliability
3. Extend functionality without breaking core architecture
4. Document decisions for future reference

---

## 📁 **Critical Files to Understand**

### Must Read (in order)
1. **`docs/WEB-RESEARCH-GUIDE.md`** - **START HERE** - Research current technology state
2. **`docs/AI-HANDOFF-GUIDE.md`** - How to work on this project
3. **`docs/QUICK-START-AGENT-MCP.md`** - Implementation patterns
4. **`docs/architecture/agent.mcp.specification.md`** - Complete workflows
5. **`lib/src/examples/complete.agent.orchestration.ts`** - Working example

### Implementation References
- **`lib/src/publishers/data.acquiring.agent.ts`** - Publisher pattern
- **`lib/src/consumers/data.store.agent.ts`** - Consumer pattern  
- **`lib/src/base/database/drizzle-client.ts`** - Database operations
- **`lib/src/mcp-tools/`** - MCP tool implementations

### Architecture Documentation
- **`docs/design/agent.mcp.paradigm.md`** - Core principles
- **`docs/implementation/roadmap.md`** - Current status
- **`docs/history.md`** - Evolution story

---

## 🔍 **How to Verify You Understand**

Before making ANY suggestions, verify:

### Architecture Check ✅
- [ ] Agent = QiAgent + DSL + MCPWrapper pattern
- [ ] Official MCP servers used when available
- [ ] Custom MCP tools only for performance-critical operations
- [ ] LLM is optional for data operations

### Code Quality Check ✅  
- [ ] No fake return data (`return 50000; // TODO`)
- [ ] No stub implementations (`throw new Error('TODO')`)
- [ ] Real error handling with proper types
- [ ] Performance meets requirements (4,600 req/s)

### Integration Check ✅
- [ ] Uses existing database client (Drizzle)
- [ ] Uses existing streaming client (Redpanda)
- [ ] Follows existing agent patterns
- [ ] Integrates with existing orchestration

---

## ⚡ **Quick Commands for Orientation**

```bash
# See current architecture
ls -la lib/src/*/

# Check agent implementations  
ls -la lib/src/publishers/ lib/src/consumers/

# Review MCP tools
ls -la lib/src/mcp-tools/*/

# Check documentation
ls -la docs/*/

# Verify no fake code (should return nothing)
grep -r "TODO" lib/src/ | grep -v "TODO:"
grep -r "50000" lib/src/
grep -r "fake" lib/src/
```

---

## 🎓 **Learning Path**

### Step 1: Understand the Problem
- Read `docs/history.md` to see why this architecture exists
- Understand why AI models suggest fake/stub code
- See how Agent/MCP paradigm solves these issues

### Step 2: Study the Pattern
- Read `docs/design/agent.mcp.paradigm.md` for principles
- Study `docs/QUICK-START-AGENT-MCP.md` for implementation
- Review working agents to see patterns in action

### Step 3: Apply the Knowledge
- Use existing agents as templates
- Follow DSL + MCPWrapper + Agent composition
- Test with real data, real services, real performance

### Step 4: Extend Thoughtfully
- Add new functionality using established patterns
- Document decisions for future reference
- Generate training examples for AI improvement

---

## 🚨 **Red Flags - Stop and Ask for Help**

If you find yourself about to suggest:
- Fake return data or TODO stubs
- Direct API calls when MCP servers exist
- Building new low-level clients for existing services
- Always requiring LLM for data operations
- Changing core architecture patterns

**STOP** and re-read the documentation. These are anti-patterns that we've specifically solved.

---

## 💡 **Success Indicators**

You're on the right track when:
- ✅ Your suggestions build on existing components
- ✅ You use real data and real service integrations
- ✅ You follow Agent/MCP composition patterns
- ✅ You maintain performance requirements
- ✅ You generate training-worthy examples

---

## 📞 **Getting Help**

When stuck:
1. **Check the docs** - Answer is usually documented
2. **Study existing code** - Patterns are established
3. **Ask specific questions** - "How do I add X using pattern Y?"
4. **Reference working examples** - Complete orchestration shows integration

---

**Remember: You're not just coding - you're creating training data that teaches future AI models to suggest correct patterns instead of fake/stub code.** 🎯

---

**Last Updated**: 2025-01-04  
**Project Phase**: Production (99% real implementations)  
**Next Focus**: Multi-source integration and training data generation