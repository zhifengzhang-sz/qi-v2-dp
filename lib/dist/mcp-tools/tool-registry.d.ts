import type { MCPTool } from "./registry";
/**
 * Crypto MCP Tool Registry
 * Extends QiCore's tool system with domain-specific crypto tools
 */
export declare class CryptoMCPToolRegistry {
    private tools;
    /**
     * Register a new MCP tool
     */
    registerTool(tool: MCPTool): void;
    /**
     * Get all available tools
     */
    getAllTools(): MCPTool[];
    /**
     * Get tool by name
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * Execute tool by name
     */
    executeTool(name: string, params: any): Promise<any>;
    /**
     * Get tool names for MCP client
     */
    getToolNames(): string[];
    /**
     * Get tools metadata for MCP server
     */
    getToolsMetadata(): Array<{
        name: string;
        description: string;
    }>;
}
/**
 * Factory for creating pre-configured tool registry
 */
export declare function createCryptoToolRegistry(): CryptoMCPToolRegistry;
