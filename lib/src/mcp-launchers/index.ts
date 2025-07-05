// lib/src/mcp-launchers/index.ts
// MCP Server Launchers - Official MCP server management

// =============================================================================
// CORE LAUNCHERS
// =============================================================================

export { OfficialRedpandaMCPLauncher } from "../base/streaming/redpanda/redpanda-mcp-launcher";
export type { RedpandaMCPConfig } from "../base/streaming/redpanda/redpanda-mcp-launcher";

export { OfficialPostgresMCPLauncher } from "./postgres-mcp-launcher";
export type { PostgresMCPConfig } from "./postgres-mcp-launcher";

export { OfficialCoinGeckoMCPLauncher } from "./coingecko-mcp-launcher";
export type { CoinGeckoMCPConfig } from "./coingecko-mcp-launcher";

// =============================================================================
// MCP SERVER REGISTRY
// =============================================================================

export interface MCPServerRegistry {
  redpanda?: import("../streaming/redpanda/redpanda-mcp-launcher").OfficialRedpandaMCPLauncher;
  postgres?: import("./postgres-mcp-launcher").OfficialPostgresMCPLauncher;
  coingecko?: import("./coingecko-mcp-launcher").OfficialCoinGeckoMCPLauncher;
}

export class MCPServerManager {
  private servers: MCPServerRegistry = {};

  async startAll(configs: {
    redpanda?: import("../streaming/redpanda/redpanda-mcp-launcher").RedpandaMCPConfig;
    postgres?: import("./postgres-mcp-launcher").PostgresMCPConfig;
    coingecko?: import("./coingecko-mcp-launcher").CoinGeckoMCPConfig;
  }): Promise<void> {
    console.log("🚀 Starting all official MCP servers...");

    const startPromises: Promise<void>[] = [];

    // Dynamic imports to avoid circular dependencies
    if (configs.redpanda) {
      const { OfficialRedpandaMCPLauncher } = await import("../streaming/redpanda/redpanda-mcp-launcher");
      this.servers.redpanda = new OfficialRedpandaMCPLauncher(configs.redpanda);
      startPromises.push(this.servers.redpanda.start());
    }

    if (configs.postgres) {
      const { OfficialPostgresMCPLauncher } = await import("./postgres-mcp-launcher");
      this.servers.postgres = new OfficialPostgresMCPLauncher(configs.postgres);
      startPromises.push(this.servers.postgres.start());
    }

    if (configs.coingecko) {
      const { OfficialCoinGeckoMCPLauncher } = await import("./coingecko-mcp-launcher");
      this.servers.coingecko = new OfficialCoinGeckoMCPLauncher(configs.coingecko);
      startPromises.push(this.servers.coingecko.start());
    }

    // Start all servers in parallel
    await Promise.all(startPromises);

    console.log("✅ All official MCP servers started successfully");
  }

  async stopAll(): Promise<void> {
    console.log("🛑 Stopping all official MCP servers...");

    const stopPromises: Promise<void>[] = [];

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

  getServerStatus(): object {
    return {
      redpanda: this.servers.redpanda?.getStatus() || { isRunning: false },
      postgres: this.servers.postgres?.getStatus() || { isRunning: false },
      coingecko: this.servers.coingecko?.getStatus() || { isRunning: false },
    };
  }

  getServerInfo(): object {
    return {
      redpanda: this.servers.redpanda?.getServerInfo() || null,
      postgres: this.servers.postgres?.getServerInfo() || null,
      coingecko: this.servers.coingecko?.getServerInfo() || null,
    };
  }

  getAllAvailableTools(): Record<string, string[]> {
    return {
      redpanda: this.servers.redpanda?.getAvailableTools() || [],
      postgres: this.servers.postgres?.getAvailableTools() || [],
      coingecko: this.servers.coingecko?.getAvailableTools() || [],
    };
  }
}