#!/usr/bin/env bun

/**
 * Show What Tools Our MCP Clients (Actors) Provide
 *
 * This script examines what tools our TRUE Actors provide as MCP clients,
 * not what tools they consume from MCP servers.
 */

import { createCoinGeckoMarketDataReader } from "../src/publishers/sources/coingecko/MarketDataReader";

async function showClientTools() {
  console.log("🔍 WHAT TOOLS DO OUR MCP CLIENTS (ACTORS) PROVIDE?");
  console.log("=".repeat(60));

  const actor = createCoinGeckoMarketDataReader({
    name: "client-tool-inspection",
    debug: false,
  });

  // Check what tool handlers are registered in our actor
  console.log("🔧 Inspecting Actor's MCP Client Tool Handlers:");
  console.log("─".repeat(60));

  // Look for request handlers (tools that our client provides)
  const actorMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(actor));
  const mcpMethods = actorMethods.filter(
    (method) =>
      method.startsWith("get") ||
      method.startsWith("list") ||
      method.startsWith("create") ||
      method.startsWith("update") ||
      method.startsWith("delete"),
  );

  console.log("📋 Actor Methods (potential MCP client tools):");
  mcpMethods.forEach((method, index) => {
    console.log(`   ${index + 1}. ${method}`);
  });

  // Check if actor has any registered tool handlers
  console.log("\n🎯 MCP Tool Handler Registration Check:");
  console.log("─".repeat(60));

  // Access internal MCP client state (if possible)
  try {
    // @ts-ignore - accessing private properties for inspection
    const requestHandlers = actor._requestHandlers || {};
    const handlerCount = Object.keys(requestHandlers).length;

    console.log(`Registered MCP request handlers: ${handlerCount}`);

    if (handlerCount > 0) {
      console.log("Registered handlers:");
      Object.keys(requestHandlers).forEach((handler, index) => {
        console.log(`   ${index + 1}. ${handler}`);
      });
    } else {
      console.log("❌ No MCP request handlers registered");
      console.log("   → This means our actor doesn't provide tools to MCP servers");
      console.log("   → Our actor only CONSUMES tools from MCP servers");
    }
  } catch (error) {
    console.log("❌ Cannot access internal MCP client state");
  }

  console.log("\n🤔 ANALYSIS:");
  console.log("─".repeat(60));
  console.log("✅ Our actors are MCP CLIENTS (inherit from Client class)");
  console.log("✅ Our actors can CALL tools from MCP servers (via callTool)");
  console.log("❓ Our actors may not PROVIDE tools to MCP servers");
  console.log("❓ TRUE Actor pattern might be CLIENT-ONLY, not bidirectional");

  console.log("\n💡 MCP ARCHITECTURE CLARIFICATION:");
  console.log("─".repeat(60));
  console.log("🔹 MCP Server: Provides tools, actors call them");
  console.log("🔹 MCP Client: Can provide tools for servers to call back");
  console.log("🔹 Our Actors: Currently CLIENT-ONLY (call server tools)");
  console.log("🔹 To provide tools: Need to register request handlers");

  console.log("\n🎭 TRUE ACTOR CURRENT IMPLEMENTATION:");
  console.log("─".repeat(60));
  console.log("✅ Extends MCP Client → Can call server tools");
  console.log("✅ Provides DSL methods → Financial data interfaces");
  console.log("❓ May need tool handler registration for bidirectional MCP");
}

if (import.meta.main) {
  showClientTools()
    .then(() => {
      console.log("\n✅ Client tool inspection completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed:", error);
      process.exit(1);
    });
}
