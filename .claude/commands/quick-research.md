# Quick Technology Research

Research current state of specified technology before making suggestions.

## Usage: /quick-research [technology]

**Research checklist for any technology:**

1. **MCP Server Status**:
   - Search: "[technology] MCP server" site:github.com/modelcontextprotocol
   - Check: @modelcontextprotocol npm packages
   - Look for: Official servers that replace custom implementations

2. **Current Version & Security**:
   - Search: "[technology] latest version" 2024 2025
   - Check: npm audit, GitHub security advisories
   - Verify: No known vulnerabilities

3. **Performance Claims**:
   - Search: "[technology] benchmark" 2024 2025
   - Verify: Performance claims in our documentation
   - Update: If significant changes found

4. **Breaking Changes**:
   - Search: "[technology] breaking changes" migration
   - Check: Major version updates since project started
   - Assess: Migration effort vs benefits

## Quick Research Template:

```markdown
## Research: [Technology Name]

### MCP Server Status:
- Official Server: [exists/doesn't exist]
- Capabilities: [what it provides]
- Recommendation: [use official vs keep custom]

### Current Status:
- Latest Version: [version]
- Security: [any issues]
- Performance: [updated benchmarks]
- Breaking Changes: [major updates]

### Recommendation:
- Action: [keep/update/migrate/research more]
- Reasoning: [why]
- Impact: [effect on project]
```

**Always complete research before suggesting implementation changes.**