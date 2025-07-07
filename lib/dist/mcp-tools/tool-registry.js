// lib/src/mcp-tools/tool-registry.ts
// Tool Registry for extending QiCore MCP Tools
/**
 * Crypto MCP Tool Registry
 * Extends QiCore's tool system with domain-specific crypto tools
 */
export class CryptoMCPToolRegistry {
  tools = new Map();
  /**
   * Register a new MCP tool
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }
  /**
   * Get all available tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }
  /**
   * Get tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }
  /**
   * Execute tool by name
   */
  async executeTool(name, params) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(params);
  }
  /**
   * Get tool names for MCP client
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }
  /**
   * Get tools metadata for MCP server
   */
  getToolsMetadata() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }
}
/**
 * Factory for creating pre-configured tool registry
 */
export function createCryptoToolRegistry() {
  const registry = new CryptoMCPToolRegistry();
  // Tools will be registered when instances are created
  // This allows for dependency injection of high-performance modules
  return registry;
}
