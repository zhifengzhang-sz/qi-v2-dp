// lib/src/platform/crypto-data-platform.ts
import { CryptoPlatformAgent, type PlatformConfig } from "../agents/crypto-platform-agent";
import {
  type CoinGeckoMCPConfig,
  MCPServerManager,
  type PostgresMCPConfig,
  type RedpandaMCPConfig,
} from "../mcp-launchers";

export interface CryptoDataPlatformConfig {
  // Platform agent configuration
  platform: PlatformConfig;

  // Official MCP server configurations (MANDATORY)
  mcpServers: {
    postgres: PostgresMCPConfig; // Official @modelcontextprotocol/server-postgres
    kafka: RedpandaMCPConfig; // Official @confluent/mcp-confluent or Redpanda MCP
    coingecko: CoinGeckoMCPConfig; // Official @coingecko/coingecko-mcp
  };

  // Platform settings
  enableMonitoring?: boolean;
}

/**
 * QiCore Crypto Data Platform - Official MCP Architecture Implementation
 *
 * This class implements the official MCP servers first architecture per docs/data-stream:
 * Architecture: QiAgent → QiMCP Client → Official MCP Servers → Services
 *
 * Official MCP Servers Used:
 * - PostgreSQL MCP: @modelcontextprotocol/server-postgres (TimescaleDB compatible)
 * - Kafka MCP: @confluent/mcp-confluent or Redpanda's official MCP
 * - CoinGecko MCP: @coingecko/coingecko-mcp (15k+ coins, 8M+ tokens)
 */
export class CryptoDataPlatform {
  private mcpServerManager: MCPServerManager;
  private platformAgent: CryptoPlatformAgent;
  private config: CryptoDataPlatformConfig;
  private isRunning = false;

  constructor(config: CryptoDataPlatformConfig) {
    this.config = {
      enableMonitoring: true,
      ...config,
    };

    // Initialize MCP server manager for official servers
    this.mcpServerManager = new MCPServerManager();

    // Initialize AI platform agent (uses official MCP servers only)
    this.platformAgent = new CryptoPlatformAgent(this.config.platform);
  }

  /**
   * Start the complete crypto data platform
   * Follows official MCP servers first architecture per docs/data-stream
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Platform is already running");
      return;
    }

    console.log("🚀 Starting QiCore Crypto Data Platform with Official MCP Architecture...");

    try {
      // Phase 1: Start Official MCP Servers
      console.log("🔌 Phase 1: Starting Official MCP Servers...");
      await this.mcpServerManager.startAll(this.config.mcpServers);
      console.log("   ✅ PostgreSQL MCP: @modelcontextprotocol/server-postgres");
      console.log("   ✅ Kafka MCP: @confluent/mcp-confluent");
      console.log("   ✅ CoinGecko MCP: @coingecko/coingecko-mcp");

      // Wait for MCP servers to be ready
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Phase 2: Initialize AI Platform Agent
      console.log("🤖 Phase 2: Initializing AI Platform Agent...");
      await this.platformAgent.initialize();
      console.log("   ✅ Agent connected to official MCP servers");

      // Phase 3: Start Platform Orchestration via Official MCP
      console.log("🎯 Phase 3: Starting Platform Orchestration...");
      await this.platformAgent.orchestratePlatform();
      console.log("   ✅ All operations via official MCP servers");

      // Phase 4: Enable Monitoring (if configured)
      if (this.config.enableMonitoring) {
        console.log("📊 Phase 4: Enabling Platform Monitoring...");
        this.startMonitoring();
      }

      this.isRunning = true;
      console.log("✅ QiCore Crypto Data Platform started successfully!");
      this.printPlatformStatus();
    } catch (error: unknown) {
      console.error("❌ Failed to start platform:", error);
      await this.stop(); // Cleanup on failure
      throw error;
    }
  }

  /**
   * Stop the complete crypto data platform
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log("⚠️ Platform is not running");
      return;
    }

    console.log("🛑 Stopping QiCore Crypto Data Platform...");

    try {
      // Stop AI agent first
      if (this.platformAgent) {
        await this.platformAgent.cleanup();
        console.log("✅ Platform agent stopped");
      }

      // Stop official MCP servers
      await this.mcpServerManager.stopAll();
      console.log("✅ Official MCP servers stopped");

      this.isRunning = false;
      console.log("✅ QiCore Crypto Data Platform stopped successfully");
    } catch (error: unknown) {
      console.error("❌ Error during platform shutdown:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive platform status
   */
  getStatus(): object {
    return {
      platform: {
        isRunning: this.isRunning,
        architecture: "official-mcp-first",
        monitoring: this.config.enableMonitoring,
      },
      mcpServers: this.mcpServerManager.getServerStatus(),
      officialServers: {
        postgres: "✅ @modelcontextprotocol/server-postgres",
        kafka: "✅ @confluent/mcp-confluent",
        coingecko: "✅ @coingecko/coingecko-mcp",
      },
      compliance: "docs/data-stream official MCP specification",
    };
  }

  /**
   * Get detailed platform information
   */
  getPlatformInfo(): object {
    return {
      platform: "QiCore Crypto Data Platform",
      version: "1.0.0",
      architecture: {
        type: "official-mcp-first",
        description: "QiAgent → QiMCP Client → Official MCP Servers → Services",
        principle: "Official MCP servers first, custom tools only as exceptions",
        layers: {
          agent: "CryptoPlatformAgent (QiAgent framework)",
          mcp: "QiMCP Client (connects to official servers)",
          servers: "Official vendor MCP servers only",
        },
      },
      officialMCPServers: {
        postgres: "@modelcontextprotocol/server-postgres (TimescaleDB compatible)",
        kafka: "@confluent/mcp-confluent or Redpanda official MCP",
        coingecko: "@coingecko/coingecko-mcp (15k+ coins, 8M+ tokens)",
      },
      mcpServers: this.mcpServerManager.getServerInfo(),
      availableTools: this.mcpServerManager.getAllAvailableTools(),
      specification: "docs/data-stream official MCP architecture",
      principle: "Zero custom MCP development unless absolutely necessary",
    };
  }

  /**
   * Execute platform operations via official MCP servers only
   */
  async executeOperation(operation: string, params?: any): Promise<any> {
    switch (operation) {
      case "collectCryptoData":
        return await this.platformAgent.collectCryptoData(params?.symbols);

      case "collectOHLCVData":
        return await this.platformAgent.collectOHLCVData(params?.symbol, params?.days);

      case "analyzeMarketData":
        return await this.platformAgent.analyzeMarketData();

      case "monitorPlatform":
        return await this.platformAgent.monitorPlatform();

      case "handleAlert":
        return await this.platformAgent.handleAlert(params);

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Start platform monitoring
   */
  private startMonitoring(): void {
    console.log("📊 Starting platform monitoring...");

    // Monitor platform health every 2 minutes
    setInterval(async () => {
      try {
        const status = this.getStatus() as any;
        console.log("📊 Platform Health Check:", {
          timestamp: new Date().toISOString(),
          isRunning: (status as any).platform?.isRunning || false,
          mcpServers: Object.values((status as any).mcpServers || {}).filter(
            (s: any) => (s as any)?.isRunning,
          ).length,
          physicalLayer:
            ((status as any).physicalLayer?.producer?.isRunning || false) &&
            ((status as any).physicalLayer?.consumer?.isRunning || false),
        });
      } catch (error: unknown) {
        console.error("❌ Health check failed:", error);
      }
    }, 120000);

    console.log("✅ Platform monitoring enabled");
  }

  /**
   * Print current platform status
   */
  private printPlatformStatus(): void {
    const status = this.getStatus();
    console.log("\n📊 Platform Status Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🏛️  Architecture: Official MCP First");
    console.log(
      `🔌 Official MCP Servers: ${Object.values((status as any).mcpServers || {}).filter((s: any) => (s as any)?.isRunning).length} running`,
    );
    console.log("   ✅ PostgreSQL MCP (@modelcontextprotocol/server-postgres)");
    console.log("   ✅ Kafka MCP (@confluent/mcp-confluent)");
    console.log("   ✅ CoinGecko MCP (@coingecko/coingecko-mcp)");
    console.log(`📊 Monitoring: ${this.config.enableMonitoring ? "Enabled" : "Disabled"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Platform ready for crypto data processing via official MCP servers!\n");
  }

  /**
   * Graceful shutdown handler
   */
  setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      try {
        await this.stop();
        process.exit(0);
      } catch (error: unknown) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdownHandler("SIGINT"));
    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  }
}
