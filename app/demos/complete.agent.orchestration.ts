// Complete Agent Orchestration Example - Agent/MCP Centric Architecture
// Demonstrates Data Acquiring Agent → Redpanda Stream → Data Store Agent

import { MCPClient } from "@qicore/agent-lib/qimcp/client";
import { type StreamConsumerConfig, createDataStoreAgent } from "../consumers/data.store.agent";
import {
  type CryptoDataRequest,
  createDataAcquiringAgent,
} from "../publishers/data.acquiring.agent";

/**
 * Complete Crypto Data Platform Orchestration
 *
 * Architecture Flow:
 * 1. Data Acquiring Agent: CoinGecko MCP → AI Processing → Redpanda Stream
 * 2. Redpanda: Real-time data streaming topics
 * 3. Data Store Agent: Redpanda Stream → AI Validation → TimescaleDB MCP
 *
 * This example demonstrates the complete Agent/MCP workflow:
 * - Publisher Agent: Get data from data source → Publish data into data stream
 * - Consumer Agent: Get data from data stream → Store data into data store
 */
export class CryptoDataPlatformOrchestrator {
  private mcpClient: MCPClient;
  private dataAcquiringAgent: ReturnType<typeof createDataAcquiringAgent>;
  private dataStoreAgent: ReturnType<typeof createDataStoreAgent>;
  private isRunning = false;

  constructor(
    mcpServerConfig: {
      coinGeckoMCP: string;
      redpandaMCP: string;
      timescaledbMCP: string;
    },
    logger?: any,
  ) {
    // Initialize single MCP client manager
    this.mcpClient = new MCPClient({
      coinGecko: mcpServerConfig.coinGeckoMCP,
      redpanda: mcpServerConfig.redpandaMCP,
      timescaledb: mcpServerConfig.timescaledbMCP,
    });

    // Create publisher agent (Data Acquiring Agent)
    this.dataAcquiringAgent = createDataAcquiringAgent(
      {
        name: "crypto-data-acquiring-agent",
        description: "Acquires crypto data from multiple sources and publishes to stream",
        version: "1.0.0",
      },
      this.mcpClient,
      {
        priceUpdates: 1, // Every 1 minute
        ohlcvUpdates: 5, // Every 5 minutes
        marketDataUpdates: 15, // Every 15 minutes
        technicalAnalysis: 60, // Every 60 minutes
      },
      logger,
    );

    // Create consumer agent (Data Store Agent)
    this.dataStoreAgent = createDataStoreAgent(
      {
        name: "crypto-data-store-agent",
        description: "Consumes crypto data from stream and stores in time-series database",
        version: "1.0.0",
      },
      this.mcpClient,
      {
        topics: ["crypto-prices", "crypto-ohlcv", "crypto-analytics"],
        consumerGroup: "crypto-platform-consumers",
        batchSize: 1000,
        processingInterval: 5000, // 5 seconds
        maxRetries: 3,
      },
      logger,
    );
  }

  /**
   * Initialize the complete crypto data platform
   */
  async initialize(): Promise<void> {
    console.log("🚀 Initializing Crypto Data Platform...");

    // Initialize MCP client connections
    await this.mcpClient.connect();
    console.log("✅ MCP connections established");

    // Initialize agents in sequence
    await this.dataAcquiringAgent.initialize();
    console.log("✅ Data Acquiring Agent initialized");

    await this.dataStoreAgent.initialize();
    console.log("✅ Data Store Agent initialized");

    this.isRunning = true;
    console.log("🎉 Crypto Data Platform fully operational!");
  }

  /**
   * Demonstrate manual data acquisition and storage
   */
  async demonstrateManualFlow(): Promise<void> {
    console.log("\n🎯 Demonstrating Manual Data Flow...");

    // Define data request
    const dataRequest: CryptoDataRequest = {
      symbols: ["bitcoin", "ethereum", "cardano", "solana", "polkadot"],
      dataTypes: ["price", "ohlcv", "market_data"],
      frequency: 0, // One-time request
      enrichWithTechnicalIndicators: true,
    };

    try {
      // STEP 1: Data Acquiring Agent - Get data from source and publish to stream
      console.log("📊 Step 1: Acquiring data from CoinGecko and publishing to stream...");
      const publishMetrics = await this.dataAcquiringAgent.acquireAndPublishData(dataRequest);

      console.log(
        `✅ Published ${publishMetrics.successfulPublishes} records to topics:`,
        publishMetrics.topics,
      );
      console.log(`⏱️ Average latency: ${publishMetrics.averageLatency}ms`);

      // Wait for data to be available in stream
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // STEP 2: Data Store Agent - Consume from stream and store in database
      console.log("💾 Step 2: Consuming from stream and storing in TimescaleDB...");
      const storageMetrics = await this.dataStoreAgent.consumeAndStoreData();

      console.log(`✅ Stored ${storageMetrics.successfulInserts} records`);
      console.log(`📊 Database health: ${storageMetrics.databaseHealth}`);
      console.log(`⏱️ Average processing time: ${storageMetrics.averageProcessingTime}ms`);
    } catch (error) {
      console.error("❌ Manual flow demonstration failed:", error);
      throw error;
    }
  }

  /**
   * Start continuous platform operation
   */
  async startContinuousOperation(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Platform not initialized. Call initialize() first.");
    }

    console.log("\n🔄 Starting continuous platform operation...");
    console.log("📊 Data Acquiring Agent: Scheduled data acquisition active");
    console.log("💾 Data Store Agent: Continuous stream consumption active");
    console.log("🌊 Redpanda: Real-time data streaming");

    // Both agents are already running their scheduled operations
    // Data Acquiring Agent: Automatically acquiring and publishing data
    // Data Store Agent: Automatically consuming and storing data

    console.log("✅ Platform operating continuously!");
  }

  /**
   * Monitor platform health and metrics
   */
  async monitorPlatform(): Promise<{
    publisher: any;
    consumer: any;
    platform: {
      isRunning: boolean;
      uptime: number;
      dataFlow: string;
    };
  }> {
    const publisherStatus = await this.dataAcquiringAgent.getAcquisitionStatus();
    const consumerStatus = await this.dataStoreAgent.getStorageStatus();

    const platformStatus = {
      isRunning: this.isRunning,
      uptime: Date.now() - (publisherStatus.lastAcquisition?.getTime() || Date.now()),
      dataFlow: publisherStatus.isRunning && consumerStatus.isConsuming ? "flowing" : "interrupted",
    };

    // Log status
    console.log("\n📊 Platform Health Report:");
    console.log(`🟢 Publisher: ${publisherStatus.isRunning ? "ACTIVE" : "INACTIVE"}`);
    console.log(`🟢 Consumer: ${consumerStatus.isConsuming ? "ACTIVE" : "INACTIVE"}`);
    console.log(`🟢 Data Flow: ${platformStatus.dataFlow.toUpperCase()}`);
    console.log(`📈 Records Processed: ${consumerStatus.totalRecordsProcessed}`);
    console.log(`💾 Database Health: ${consumerStatus.databaseHealth.toUpperCase()}`);
    console.log(
      `🎯 Success Rate: ${((consumerStatus.successfulInserts / consumerStatus.totalRecordsProcessed) * 100).toFixed(1)}%`,
    );

    return {
      publisher: publisherStatus,
      consumer: consumerStatus,
      platform: platformStatus,
    };
  }

  /**
   * Demonstrate specific use cases
   */
  async demonstrateUseCases(): Promise<void> {
    console.log("\n🎯 Demonstrating Platform Use Cases...");

    // Use Case 1: High-frequency price monitoring
    console.log("\n📊 Use Case 1: High-frequency price monitoring");
    await this.dataAcquiringAgent.acquireSpecificData(["bitcoin", "ethereum"], ["price"]);

    // Use Case 2: Technical analysis data
    console.log("\n📈 Use Case 2: Technical analysis data collection");
    await this.dataAcquiringAgent.acquireSpecificData(
      ["bitcoin", "ethereum", "cardano"],
      ["ohlcv", "market_data"],
    );

    // Use Case 3: Portfolio monitoring
    console.log("\n💼 Use Case 3: Portfolio monitoring");
    const portfolioSymbols = [
      "bitcoin",
      "ethereum",
      "cardano",
      "solana",
      "polkadot",
      "chainlink",
      "uniswap",
    ];
    await this.dataAcquiringAgent.acquireSpecificData(portfolioSymbols, ["price", "market_data"]);

    console.log("✅ Use cases demonstrated successfully");
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log("\n🛑 Shutting down Crypto Data Platform...");

    this.isRunning = false;

    // Cleanup agents
    await this.dataAcquiringAgent.cleanup();
    console.log("✅ Data Acquiring Agent stopped");

    await this.dataStoreAgent.cleanup();
    console.log("✅ Data Store Agent stopped");

    // Disconnect MCP client
    await this.mcpClient.disconnect();
    console.log("✅ MCP connections closed");

    console.log("🎯 Platform shutdown complete");
  }
}

/**
 * Example usage and demonstration
 */
export async function runCompleteOrchestrationExample(): Promise<void> {
  // Create platform orchestrator
  const platform = new CryptoDataPlatformOrchestrator({
    coinGeckoMCP: "stdio://coingecko-mcp-server",
    redpandaMCP: "stdio://redpanda-mcp-server",
    timescaledbMCP: "stdio://timescaledb-mcp-server",
  });

  try {
    // Initialize platform
    await platform.initialize();

    // Demonstrate manual flow
    await platform.demonstrateManualFlow();

    // Start continuous operation
    await platform.startContinuousOperation();

    // Monitor platform for 30 seconds
    console.log("\n⏱️ Monitoring platform for 30 seconds...");
    const monitoringInterval = setInterval(async () => {
      await platform.monitorPlatform();
    }, 10000); // Every 10 seconds

    await new Promise((resolve) => setTimeout(resolve, 30000));
    clearInterval(monitoringInterval);

    // Demonstrate use cases
    await platform.demonstrateUseCases();

    // Final health check
    const finalHealth = await platform.monitorPlatform();
    console.log("\n🎯 Final Platform Status:", finalHealth);
  } catch (error) {
    console.error("❌ Platform orchestration failed:", error);
  } finally {
    // Always cleanup
    await platform.shutdown();
  }
}

/**
 * Export for external usage
 */
export { CryptoDataPlatformOrchestrator };

// Example: Run if this file is executed directly
if (require.main === module) {
  runCompleteOrchestrationExample()
    .then(() => {
      console.log("🎉 Complete orchestration example finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Orchestration example failed:", error);
      process.exit(1);
    });
}
