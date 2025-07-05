// lib/src/agents/mcp-crypto-agent.ts
// Agent/MCP-Centric Architecture Implementation
import { BatchProcessDataTool, ConsumeStreamDataTool, ProcessCryptoStreamTool, StreamCryptoDataTool, } from "../mcp-tools/crypto-data-tools";
// Import the BaseAgent and MCPClient from crypto-platform-agent
import { BaseAgent, MCPClient } from "./crypto-platform-agent";
/**
 * Agent/MCP-Centric Crypto Platform Agent
 *
 * Architecture: Agent → MCP Tools → High-Performance Modules
 *
 * Key insight: The agent orchestrates through MCP tools, which wrap
 * the high-performance implementations. This separates concerns:
 * - Agent: High-level AI decisions and orchestration
 * - MCP Tools: Standardized tool interface + business logic
 * - Modules: Optimized implementations for performance
 */
export class MCPCryptoPlatformAgent extends BaseAgent {
    mcpClient;
    toolRegistry; // Will be initialized in setupTools
    config;
    constructor(config) {
        super("mcp-crypto-platform-agent");
        this.config = config;
        // Initialize MCP client connection
        this.mcpClient = new MCPClient(console);
        // Initialize tool registry (would need real producer/consumer)
        // this.toolRegistry = new MCPToolRegistry(producer, consumer);
        // this.setupTools();
    }
    /**
     * Setup MCP Tools - Bridge to High-Performance Modules
     */
    setupTools() {
        // These tools would be initialized with actual high-performance modules
        // For now, using temporary implementations
        // Register crypto data streaming tool
        const streamTool = new StreamCryptoDataTool(null); // Would inject real producer
        this.toolRegistry.registerTool(streamTool);
        // Register stream consumption tool
        const consumeTool = new ConsumeStreamDataTool(null);
        this.toolRegistry.registerTool(consumeTool);
        // Register stream processing tool
        const processTool = new ProcessCryptoStreamTool(null); // Would inject real consumer
        this.toolRegistry.registerTool(processTool);
        // Register batch processing tool
        const batchTool = new BatchProcessDataTool(null, null);
        this.toolRegistry.registerTool(batchTool);
    }
    async initialize() {
        console.log("🚀 Initializing MCP Crypto Platform Agent...");
        // Connect MCP client to PostgreSQL MCP server
        await this.mcpClient.connectToServer({
            name: "postgres",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-postgres", this.config.postgresConnectionString],
        });
        // Setup infrastructure using tools
        await this.setupInfrastructure();
        console.log("✅ MCP Crypto Platform Agent initialized successfully");
        console.log(`🔧 Available tools: ${this.toolRegistry.getToolNames().join(", ")}`);
    }
    /**
     * Infrastructure setup via MCP tools
     */
    async setupInfrastructure() {
        console.log("🏗️ Setting up infrastructure via MCP tools...");
        // Example: Use tools to setup the platform
        // The agent makes high-level decisions, tools handle implementation
        try {
            // Initialize data collection capability
            await this.toolRegistry.executeTool("collect_crypto_data", {
                symbols: ["bitcoin", "ethereum"],
                interval: 60000,
            });
            console.log("✅ Infrastructure setup completed via MCP tools");
        }
        catch (error) {
            console.error("❌ Infrastructure setup failed:", error);
            throw error;
        }
    }
    /**
     * High-level data collection orchestration
     * Agent decides WHAT to collect, tools handle HOW
     */
    async collectCryptoData(symbols = ["bitcoin", "ethereum", "cardano"]) {
        console.log("💰 Agent orchestrating crypto data collection...");
        try {
            // Agent logic: Decide collection strategy
            const priority = this.prioritizeSymbols(symbols);
            const interval = this.calculateOptimalInterval(symbols.length);
            // Use MCP tool for high-performance collection
            const result = await this.toolRegistry.executeTool("collect_crypto_data", {
                symbols: priority,
                interval: interval,
                source: "coingecko",
            });
            console.log(`✅ Collected data for ${result.count} symbols in ${result.latency}ms`);
            // Agent decides next action based on results
            if (result.latency > 1000) {
                console.log("🔄 High latency detected, adjusting collection strategy...");
                await this.optimizeCollection();
            }
        }
        catch (error) {
            console.error("❌ Data collection failed:", error);
            // Agent handles errors and recovery
            await this.handleCollectionError(error);
        }
    }
    /**
     * OHLCV data collection with agent intelligence
     */
    async collectOHLCVData(symbol, period = "1h") {
        console.log(`📊 Agent collecting OHLCV data for ${symbol}...`);
        try {
            // Agent intelligence: Choose optimal interval based on market conditions
            const interval = this.determineOptimalInterval(symbol, period);
            // Use MCP tool for high-performance OHLCV collection
            const result = await this.toolRegistry.executeTool("collect_ohlcv_data", {
                symbol,
                interval,
                period,
            });
            console.log(`✅ Collected ${result.records} OHLCV records in ${result.latency}ms`);
        }
        catch (error) {
            console.error(`❌ OHLCV collection failed for ${symbol}:`, error);
            throw error;
        }
    }
    /**
     * Stream processing orchestration
     * Agent decides processing strategy, tools execute
     */
    async processMarketStream(operation) {
        console.log(`📈 Agent orchestrating ${operation} stream processing...`);
        try {
            // Agent logic: Determine processing parameters
            const params = this.calculateProcessingParams(operation);
            // Use MCP tool for high-performance stream processing
            const result = await this.toolRegistry.executeTool("process_crypto_stream", {
                operation,
                ...params,
            });
            console.log(`✅ Stream processing completed: ${result.operation} in ${result.latency}ms`);
        }
        catch (error) {
            console.error("❌ Stream processing failed:", error);
            throw error;
        }
    }
    /**
     * Market analysis using agent intelligence + MCP tools
     */
    async analyzeMarket() {
        console.log("📈 Agent analyzing market conditions...");
        try {
            // Agent intelligence: Multi-step analysis strategy
            // Step 1: Collect fresh data
            await this.collectCryptoData(["bitcoin", "ethereum", "binancecoin"]);
            // Step 2: Process streams for patterns
            await this.processMarketStream("trend_detection");
            await this.processMarketStream("volatility");
            // Step 3: Batch process for historical context
            await this.toolRegistry.executeTool("batch_process_data", {
                operation: "aggregate",
                timeRange: { start: Date.now() - 86400000, end: Date.now() },
                symbols: ["bitcoin", "ethereum"],
            });
            // Agent synthesizes results
            const analytics = {
                timestamp: Date.now(),
                total_market_cap: 0, // Would be calculated from collected data
                total_volume: 0,
                btc_dominance: 0,
                eth_dominance: 0,
                defi_market_cap: 0,
                active_cryptocurrencies: 0,
            };
            console.log("✅ Market analysis completed");
            return analytics;
        }
        catch (error) {
            console.error("❌ Market analysis failed:", error);
            throw error;
        }
    }
    /**
     * Agent intelligence methods
     */
    prioritizeSymbols(symbols) {
        // Agent logic: Prioritize based on market cap, volatility, etc.
        return symbols.sort(); // Simplified
    }
    calculateOptimalInterval(symbolCount) {
        // Agent logic: Adjust interval based on load
        return symbolCount > 10 ? 30000 : 10000;
    }
    determineOptimalInterval(symbol, period) {
        // Agent logic: Choose interval based on symbol characteristics
        return period === "1d" ? "hourly" : "minutely";
    }
    calculateProcessingParams(operation) {
        // Agent logic: Optimize parameters for operation
        switch (operation) {
            case "moving_average":
                return { window: 20 };
            case "volatility":
                return { threshold: 0.05 };
            case "trend_detection":
                return { window: 50, threshold: 0.02 };
            default:
                return {};
        }
    }
    async optimizeCollection() {
        console.log("🔧 Agent optimizing collection strategy...");
        // Agent intelligence: Adjust strategy based on performance
    }
    async handleCollectionError(error) {
        console.log("🚨 Agent handling collection error:", error.message);
        // Agent intelligence: Error recovery and adaptation
    }
    async cleanup() {
        console.log("🔌 Cleaning up MCP Crypto Platform Agent...");
        try {
            await this.mcpClient.disconnect();
            console.log("✅ MCP Crypto Platform Agent cleanup completed");
        }
        catch (error) {
            console.error("❌ Cleanup failed:", error);
        }
    }
    /**
     * Get agent status including tool availability
     */
    getStatus() {
        return {
            agent: {
                name: this.name,
                type: "mcp-centric",
                architecture: "agent → mcp-tools → modules",
            },
            tools: {
                available: this.toolRegistry.getToolNames(),
                count: this.toolRegistry.getAllTools().length,
                metadata: this.toolRegistry.getToolsMetadata(),
            },
            config: {
                brokers: this.config.redpandaBrokers.length,
                hasApiKey: !!this.config.coinGeckoApiKey,
            },
        };
    }
}
