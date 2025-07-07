// lib/src/mcp-launchers/index.ts
export { OfficialRedpandaMCPLauncher } from "../redpanda/redpanda-mcp-launcher";
export { OfficialPostgresMCPLauncher } from "./postgres-mcp-launcher";
export { OfficialCoinGeckoMCPLauncher } from "./coingecko-mcp-launcher";
export class MCPServerManager {
  servers = {};
  async startAll(configs) {
    console.log("🚀 Starting all official MCP servers...");
    const startPromises = [];
    // Dynamic imports to avoid circular dependencies
    const { OfficialRedpandaMCPLauncher } = await import("../redpanda/redpanda-mcp-launcher");
    const { OfficialPostgresMCPLauncher } = await import("./postgres-mcp-launcher");
    const { OfficialCoinGeckoMCPLauncher } = await import("./coingecko-mcp-launcher");
    // Start Redpanda MCP Server
    if (configs.redpanda) {
      this.servers.redpanda = new OfficialRedpandaMCPLauncher(configs.redpanda);
      startPromises.push(this.servers.redpanda.start());
    }
    // Start PostgreSQL MCP Server
    if (configs.postgres) {
      this.servers.postgres = new OfficialPostgresMCPLauncher(configs.postgres);
      startPromises.push(this.servers.postgres.start());
    }
    // Start CoinGecko MCP Server
    if (configs.coingecko) {
      this.servers.coingecko = new OfficialCoinGeckoMCPLauncher(configs.coingecko);
      startPromises.push(this.servers.coingecko.start());
    }
    // Start all servers in parallel
    await Promise.all(startPromises);
    console.log("✅ All official MCP servers started successfully");
  }
  async stopAll() {
    console.log("🛑 Stopping all official MCP servers...");
    const stopPromises = [];
    if (this.servers.redpanda) {
      stopPromises.push(this.servers.redpanda.stop());
    }
    if (this.servers.postgres) {
      stopPromises.push(this.servers.postgres.stop());
    }
    if (this.servers.coingecko) {
      stopPromises.push(this.servers.coingecko.stop());
    }
    // Stop all servers in parallel
    await Promise.all(stopPromises);
    this.servers = {};
    console.log("✅ All official MCP servers stopped");
  }
  getServerStatus() {
    return {
      redpanda: this.servers.redpanda?.getStatus() || { isRunning: false },
      postgres: this.servers.postgres?.getStatus() || { isRunning: false },
      coingecko: this.servers.coingecko?.getStatus() || { isRunning: false },
    };
  }
  getServerInfo() {
    return {
      redpanda: this.servers.redpanda?.getServerInfo() || null,
      postgres: this.servers.postgres?.getServerInfo() || null,
      coingecko: this.servers.coingecko?.getServerInfo() || null,
    };
  }
  getAllAvailableTools() {
    return {
      redpanda: this.servers.redpanda?.getAvailableTools() || [],
      postgres: this.servers.postgres?.getAvailableTools() || [],
      coingecko: this.servers.coingecko?.getAvailableTools() || [],
    };
  }
}
