// lib/src/examples/complete-pipeline.ts
// Complete Agent/MCP Centric Data Pipeline Example
//
// This example demonstrates the complete data flow:
// CoinGecko → Agent → Official CoinGecko MCP → Data → Agent → Custom Stream Tools → Redpanda → Agent → Custom Stream Tools → TimescaleDB via Official PostgreSQL MCP
import { CryptoPlatformAgent } from "../agents/crypto-platform-agent";
/**
 * Complete Agent/MCP Centric Pipeline Example
 *
 * This demonstrates the two-centric architecture:
 * 1. Structural Framework: Data Stream Platform (Redpanda/Kafka)
 * 2. Agent/MCP Centric Framework: Agent → MCP Client → {Official MCP Servers + Custom Tools} → Services
 */
async function runCompletePipeline() {
  console.log("🚀 Starting QiCore Crypto Data Platform - Agent/MCP Centric Architecture");
  // Configuration for Agent/MCP integration
  const config = {
    redpandaBrokers: ["localhost:9092"],
    postgresConnectionString: "postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data",
    coinGeckoApiKey: process.env.COINGECKO_API_KEY,
    aivenToken: process.env.AIVEN_TOKEN,
  };
  // Initialize the Agent (Tool Set + Process Executor + Prompt/LLM)
  const platformAgent = new CryptoPlatformAgent(config);
  try {
    // 1. Initialize Agent with Agent/MCP Centric Architecture
    await platformAgent.initialize();
    console.log("✅ Agent/MCP Centric Architecture initialized");
    // 2. Demonstrate Complete Data Pipeline Flow
    // STEP 1: Data Collection via Official CoinGecko MCP Server
    console.log("\n📊 STEP 1: Data Collection via Official CoinGecko MCP");
    await platformAgent.collectCryptoData(["bitcoin", "ethereum", "cardano", "solana"]);
    // STEP 2: Historical Data Collection
    console.log("\n📈 STEP 2: OHLCV Data Collection via Official CoinGecko MCP");
    await platformAgent.collectOHLCVData("bitcoin", "1");
    // STEP 3: Stream Processing via Custom MCP Tools
    console.log("\n🔄 STEP 3: Stream Processing via Custom MCP Tools");
    await platformAgent.processStreamData();
    // STEP 4: Market Analysis and Database Storage via Official PostgreSQL MCP
    console.log("\n📈 STEP 4: Market Analysis via MCP Integration");
    const analytics = await platformAgent.analyzeMarketData();
    console.log("Analytics result:", analytics);
    // STEP 5: Platform Monitoring via All MCP Integrations
    console.log("\n🔍 STEP 5: Platform Monitoring via MCP Integration");
    await platformAgent.monitorPlatform();
    // 3. Start Continuous Orchestration
    console.log("\n🎯 Starting Continuous Orchestration...");
    await platformAgent.orchestratePlatform();
    console.log("\n✅ Complete Agent/MCP Centric Pipeline Running Successfully!");
    console.log("");
    console.log("🔄 Data Flow Summary:");
    console.log("  1. CoinGecko → Agent → Official CoinGecko MCP → Price Data");
    console.log("  2. Agent → Custom StreamCryptoDataTool → Redpanda Topics");
    console.log("  3. Redpanda → Agent → Custom ConsumeStreamDataTool → Processing");
    console.log("  4. Agent → Official PostgreSQL MCP → TimescaleDB Storage");
    console.log("  5. Agent → Custom ProcessCryptoStreamTool → AI Analytics");
  } catch (error) {
    console.error("❌ Pipeline failed:", error);
    // Handle alerts via MCP integration
    await platformAgent.handleAlert({
      type: "PIPELINE_ERROR",
      message: `Complete pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now(),
    });
    throw error;
  }
  // Setup graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down Agent/MCP Centric Pipeline...");
    await platformAgent.cleanup();
    process.exit(0);
  });
  // Keep the process running
  setInterval(() => {
    console.log("💚 Agent/MCP Centric Pipeline running... (Press Ctrl+C to stop)");
  }, 30000);
}
/**
 * Development Testing Function
 * Tests individual components of the Agent/MCP architecture
 */
async function testAgentMCPComponents() {
  console.log("🧪 Testing Agent/MCP Centric Components...");
  const config = {
    redpandaBrokers: ["localhost:9092"],
    postgresConnectionString: "postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data",
    coinGeckoApiKey: process.env.COINGECKO_API_KEY,
  };
  const agent = new CryptoPlatformAgent(config);
  try {
    await agent.initialize();
    // Test 1: Official MCP Server Integration
    console.log("\n✅ Test 1: Official MCP Server Integration");
    await agent.collectCryptoData(["bitcoin"]);
    // Test 2: Custom MCP Tools Integration
    console.log("\n✅ Test 2: Custom MCP Tools Integration");
    await agent.processStreamData();
    // Test 3: Mixed MCP Integration (Official + Custom)
    console.log("\n✅ Test 3: Mixed MCP Integration");
    await agent.analyzeMarketData();
    console.log("\n🎉 All Agent/MCP Components Working!");
  } catch (error) {
    console.error("❌ Component test failed:", error);
  } finally {
    await agent.cleanup();
  }
}
// Export functions for external use
export { runCompletePipeline, testAgentMCPComponents };
// Run if called directly
if (require.main === module) {
  const testMode = process.env.TEST_MODE === "true";
  if (testMode) {
    testAgentMCPComponents().catch(console.error);
  } else {
    runCompletePipeline().catch(console.error);
  }
}
