// lib/src/mcp-tools/registry.ts
// MCP Tool Registry for Agent/MCP Centric Architecture
// TODO: Fix QiCore imports when library is ready
// import type { MCPTool } from '@qicore/agent-lib/src/qimcp/client';
import { BatchProcessDataTool, ConsumeStreamDataTool, ProcessCryptoStreamTool, StreamCryptoDataTool, } from "./crypto-data-tools";
/**
 * MCP Tool Registry for Custom Tools
 *
 * This registry manages custom MCP tools that wrap high-performance components.
 * These tools are used when official MCP servers don't provide the required functionality.
 *
 * Architecture: Agent → MCP Client → Tool Registry → Custom Tools → High-Performance Components
 */
export class MCPToolRegistry {
    tools = new Map();
    producer;
    consumer;
    constructor(producer, consumer) {
        this.producer = producer;
        this.consumer = consumer;
        this.initializeTools();
    }
    initializeTools() {
        console.log("🔧 Initializing MCP Tool Registry...");
        // Register custom MCP tools that wrap high-performance components
        this.registerTool(new StreamCryptoDataTool(this.producer));
        this.registerTool(new ConsumeStreamDataTool(this.consumer));
        this.registerTool(new ProcessCryptoStreamTool(this.consumer));
        this.registerTool(new BatchProcessDataTool(this.producer, this.consumer));
        console.log(`✅ Registered ${this.tools.size} custom MCP tools`);
    }
    /**
     * Register a custom MCP tool
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            console.warn(`⚠️ Tool '${tool.name}' already registered, overwriting`);
        }
        this.tools.set(tool.name, tool);
        console.log(`🔧 Registered tool: ${tool.name} - ${tool.description}`);
    }
    /**
     * Get a tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Execute a tool with parameters
     */
    async executeTool(name, params) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}. Available tools: ${this.getToolNames().join(", ")}`);
        }
        console.log(`🚀 Executing tool: ${name}`);
        const startTime = Date.now();
        try {
            const result = await tool.execute(params);
            const latency = Date.now() - startTime;
            console.log(`✅ Tool '${name}' completed in ${latency}ms`);
            return result;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            console.error(`❌ Tool '${name}' failed after ${latency}ms:`, error);
            throw error;
        }
    }
    /**
     * Get all registered tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * Get all tools with their descriptions
     */
    getToolsInfo() {
        return Array.from(this.tools.values()).map((tool) => ({
            name: tool.name,
            description: tool.description,
        }));
    }
    /**
     * Get all tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Get tools metadata
     */
    getToolsMetadata() {
        return this.getToolsInfo();
    }
    /**
     * Check if a tool exists
     */
    hasTool(name) {
        return this.tools.has(name);
    }
    /**
     * Remove a tool from registry
     */
    unregisterTool(name) {
        const removed = this.tools.delete(name);
        if (removed) {
            console.log(`🗑️ Unregistered tool: ${name}`);
        }
        return removed;
    }
    /**
     * Get registry statistics
     */
    getStats() {
        return {
            totalTools: this.tools.size,
            toolNames: this.getToolNames(),
            producerStatus: this.producer.getStatus().isRunning,
            consumerStatus: this.consumer.getStatus().isRunning,
        };
    }
    /**
     * Shutdown all tools and cleanup resources
     */
    async shutdown() {
        console.log("🛑 Shutting down MCP Tool Registry...");
        try {
            // Stop high-performance components
            await this.producer.stop();
            await this.consumer.stop();
            // Clear tool registry
            this.tools.clear();
            console.log("✅ MCP Tool Registry shutdown completed");
        }
        catch (error) {
            console.error("❌ Error during MCP Tool Registry shutdown:", error);
            throw error;
        }
    }
}
/**
 * Singleton instance for global tool registry access
 */
let globalRegistry = null;
export function createMCPToolRegistry(producer, consumer) {
    if (globalRegistry) {
        console.warn("⚠️ MCP Tool Registry already exists, returning existing instance");
        return globalRegistry;
    }
    globalRegistry = new MCPToolRegistry(producer, consumer);
    return globalRegistry;
}
export function getMCPToolRegistry() {
    if (!globalRegistry) {
        throw new Error("MCP Tool Registry not initialized. Call createMCPToolRegistry() first.");
    }
    return globalRegistry;
}
export async function shutdownMCPToolRegistry() {
    if (globalRegistry) {
        await globalRegistry.shutdown();
        globalRegistry = null;
    }
}
