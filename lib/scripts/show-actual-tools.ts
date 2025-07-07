#!/usr/bin/env bun

/**
 * Show Actual Tools from CoinGecko MCP Server
 *
 * This script demonstrates that listTools() returns actual tools from the connected MCP server,
 * NOT tools registered in our actor class. The tools come from the remote CoinGecko MCP server.
 */

import { createCoinGeckoMarketDataReader } from "../src/publishers/sources/coingecko/MarketDataReader";

async function showActualToolList() {
  console.log("🔍 ACTUAL TOOL DISCOVERY FROM COINGECKO MCP SERVER");
  console.log("=".repeat(60));

  const actor = createCoinGeckoMarketDataReader({
    name: "tool-discovery-demo",
    useRemoteServer: true,
    debug: false,
  });

  try {
    console.log("🔌 Connecting to CoinGecko MCP server...");
    const initResult = await actor.initialize();

    if (initResult._tag === "Right") {
      console.log("✅ Connected successfully!");

      // THE CRITICAL CALL - this queries the remote MCP server for its tools
      console.log("\n📋 CALLING listTools() on remote MCP server...");
      const toolsResult = await actor.listTools();

      console.log(`\n🎯 TOTAL TOOLS FOUND: ${toolsResult.tools?.length || 0}`);
      console.log("─".repeat(60));

      if (toolsResult.tools && toolsResult.tools.length > 0) {
        toolsResult.tools.forEach((tool, index) => {
          console.log(`\n${index + 1}. ${tool.name}`);
          console.log(`   Description: ${tool.description || "No description"}`);

          if (tool.inputSchema && tool.inputSchema.properties) {
            const params = Object.keys(tool.inputSchema.properties);
            console.log(`   Parameters: [${params.join(", ")}]`);
          } else {
            console.log(`   Parameters: None or not specified`);
          }
        });
      } else {
        console.log("❌ No tools found from MCP server");
      }

      console.log("\n🔍 KEY INSIGHT:");
      console.log("─".repeat(60));
      console.log("✅ These tools are NOT defined in our actor class");
      console.log("✅ These tools come from the remote CoinGecko MCP server");
      console.log("✅ listTools() queries the server and returns its available tools");
      console.log("✅ Our actor can then use callTool() to execute any of these tools");

      // Let's also show the server capabilities to prove it's a real MCP connection
      console.log("\n🎖️ MCP SERVER CAPABILITIES:");
      console.log("─".repeat(60));
      const capabilities = actor.getServerCapabilities();
      if (capabilities) {
        console.log(`Tools supported: ${capabilities.tools ? "✅ YES" : "❌ NO"}`);
        console.log(`Resources supported: ${capabilities.resources ? "✅ YES" : "❌ NO"}`);
        console.log(`Prompts supported: ${capabilities.prompts ? "✅ YES" : "❌ NO"}`);
        console.log(`Logging supported: ${capabilities.logging ? "✅ YES" : "❌ NO"}`);
      } else {
        console.log("❌ No server capabilities found");
      }

      await actor.cleanup();
    } else {
      console.log(`❌ Connection failed: ${initResult.left.message}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  showActualToolList()
    .then(() => {
      console.log("\n✅ Tool discovery completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed:", error);
      process.exit(1);
    });
}
