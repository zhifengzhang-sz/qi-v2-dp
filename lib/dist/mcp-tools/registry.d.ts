export interface MCPTool {
    name: string;
    description: string;
    execute(params: any): Promise<any>;
}
import type { CryptoDataConsumer } from "../consumers/crypto-data-consumer";
import type { CryptoDataPublisher } from "../publishers/crypto-data-publisher";
/**
 * MCP Tool Registry for Custom Tools
 *
 * This registry manages custom MCP tools that wrap high-performance components.
 * These tools are used when official MCP servers don't provide the required functionality.
 *
 * Architecture: Agent → MCP Client → Tool Registry → Custom Tools → High-Performance Components
 */
export declare class MCPToolRegistry {
    private tools;
    private producer;
    private consumer;
    constructor(producer: CryptoDataPublisher, consumer: CryptoDataConsumer);
    private initializeTools;
    /**
     * Register a custom MCP tool
     */
    registerTool(tool: MCPTool): void;
    /**
     * Get a tool by name
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * Execute a tool with parameters
     */
    executeTool(name: string, params: any): Promise<any>;
    /**
     * Get all registered tool names
     */
    getToolNames(): string[];
    /**
     * Get all tools with their descriptions
     */
    getToolsInfo(): Array<{
        name: string;
        description: string;
    }>;
    /**
     * Get all tools
     */
    getAllTools(): MCPTool[];
    /**
     * Get tools metadata
     */
    getToolsMetadata(): Array<{
        name: string;
        description: string;
    }>;
    /**
     * Check if a tool exists
     */
    hasTool(name: string): boolean;
    /**
     * Remove a tool from registry
     */
    unregisterTool(name: string): boolean;
    /**
     * Get registry statistics
     */
    getStats(): {
        totalTools: number;
        toolNames: string[];
        producerStatus: boolean;
        consumerStatus: boolean;
    };
    /**
     * Shutdown all tools and cleanup resources
     */
    shutdown(): Promise<void>;
}
export declare function createMCPToolRegistry(producer: CryptoDataPublisher, consumer: CryptoDataConsumer): MCPToolRegistry;
export declare function getMCPToolRegistry(): MCPToolRegistry;
export declare function shutdownMCPToolRegistry(): Promise<void>;
