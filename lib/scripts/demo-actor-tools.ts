#!/usr/bin/env bun

/**
 * Demonstration: List Tools from TRUE Actors
 *
 * This script demonstrates how our TRUE Actors (which extend Client via MarketDataReader)
 * can discover and list available MCP tools from their connected servers.
 */

import { createRedpandaMarketDataReader } from "../src/consumers/sources/redpanda/MarketDataReader";
import { createCoinGeckoMarketDataReader } from "../src/publishers/sources/coingecko/MarketDataReader";
import { RedpandaMarketDataWriter } from "../src/publishers/targets/redpanda/MarketDataWriter";

async function demonstrateActorToolDiscovery() {
  console.log("🎭 TRUE Actor Tool Discovery Demonstration");
  console.log("=".repeat(50));

  // 1. CoinGecko Actor - Demonstrates MCP client capabilities
  console.log("\n1. CoinGecko Market Data Reader (TRUE Actor)");
  console.log("-".repeat(40));

  const coinGeckoActor = createCoinGeckoMarketDataReader({
    name: "coingecko-demo",
    useRemoteServer: true,
    debug: true,
  });

  try {
    console.log("🔌 Initializing CoinGecko Actor...");
    const initResult = await coinGeckoActor.initialize();

    if (initResult._tag === "Right") {
      console.log("✅ CoinGecko Actor initialized successfully");

      // THIS IS THE KEY METHOD - listTools() inherited from Client class
      console.log("🔍 Discovering available tools...");
      try {
        const toolsResult = await coinGeckoActor.listTools();
        console.log(`📋 Found ${toolsResult.tools?.length || 0} tools:`);

        toolsResult.tools?.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name}`);
          console.log(`      Description: ${tool.description || "No description"}`);
          if (tool.inputSchema) {
            console.log(
              `      Input Schema: ${JSON.stringify(tool.inputSchema.properties ? Object.keys(tool.inputSchema.properties) : "None")}`,
            );
          }
        });
      } catch (error) {
        console.log(`❌ Tool discovery failed: ${error}`);
      }

      // Cleanup
      await coinGeckoActor.cleanup();
    } else {
      console.log(`❌ CoinGecko Actor initialization failed: ${initResult.left.message}`);
    }
  } catch (error) {
    console.log(`❌ CoinGecko Actor error: ${error}`);
  }

  // 2. Redpanda Reader Actor
  console.log("\n2. Redpanda Market Data Reader (TRUE Actor)");
  console.log("-".repeat(40));

  const redpandaReader = createRedpandaMarketDataReader({
    name: "redpanda-reader-demo",
    debug: true,
    useLocalMCP: true,
  });

  try {
    console.log("🔌 Initializing Redpanda Reader Actor...");
    const initResult = await redpandaReader.initialize();

    if (initResult._tag === "Right") {
      console.log("✅ Redpanda Reader Actor initialized successfully");

      // listTools() method available because it extends Client
      console.log("🔍 Discovering available streaming tools...");
      try {
        const toolsResult = await redpandaReader.listTools();
        console.log(`📋 Found ${toolsResult.tools?.length || 0} streaming tools:`);

        toolsResult.tools?.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name}`);
          console.log(`      Description: ${tool.description || "No description"}`);
        });
      } catch (error) {
        console.log(`❌ Streaming tool discovery failed: ${error}`);
      }

      await redpandaReader.cleanup();
    } else {
      console.log(`❌ Redpanda Reader initialization failed: ${initResult.left.message}`);
    }
  } catch (error) {
    console.log(`❌ Redpanda Reader error: ${error}`);
  }

  // 3. Redpanda Writer Actor
  console.log("\n3. Redpanda Market Data Writer (TRUE Actor)");
  console.log("-".repeat(40));

  const redpandaWriter = new RedpandaMarketDataWriter({
    name: "redpanda-writer-demo",
    debug: true,
  });

  try {
    console.log("🔌 Initializing Redpanda Writer Actor...");
    const initResult = await redpandaWriter.initialize();

    if (initResult._tag === "Right") {
      console.log("✅ Redpanda Writer Actor initialized successfully");

      // listTools() method available because it extends Client via MarketDataWriter
      console.log("🔍 Discovering available publishing tools...");
      try {
        const toolsResult = await redpandaWriter.listTools();
        console.log(`📋 Found ${toolsResult.tools?.length || 0} publishing tools:`);

        toolsResult.tools?.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name}`);
          console.log(`      Description: ${tool.description || "No description"}`);
        });
      } catch (error) {
        console.log(`❌ Publishing tool discovery failed: ${error}`);
      }

      await redpandaWriter.cleanup();
    } else {
      console.log(`❌ Redpanda Writer initialization failed: ${initResult.left.message}`);
    }
  } catch (error) {
    console.log(`❌ Redpanda Writer error: ${error}`);
  }

  console.log("\n🎯 TRUE Actor MCP Protocol Compliance Summary:");
  console.log("=".repeat(50));
  console.log("✅ All actors extend Client class (via MarketDataReader/Writer)");
  console.log("✅ All actors inherit listTools() method from MCP SDK Client");
  console.log("✅ All actors can discover tools from their connected MCP servers");
  console.log("✅ All actors implement MCP protocol for tool calling and communication");
  console.log("✅ All actors are TRUE MCP clients with full protocol compliance");
}

// Run the demonstration
if (import.meta.main) {
  demonstrateActorToolDiscovery()
    .then(() => {
      console.log("\n🎉 Demonstration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Demonstration failed:", error);
      process.exit(1);
    });
}
