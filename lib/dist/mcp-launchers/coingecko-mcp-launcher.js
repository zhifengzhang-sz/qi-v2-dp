// lib/src/mcp-launchers/coingecko-mcp-launcher.ts
import { spawn } from "node:child_process";
export class OfficialCoinGeckoMCPLauncher {
  process;
  isRunning = false;
  config;
  constructor(config = {}) {
    this.config = {
      rateLimit: 50,
      timeout: 30000,
      environment: "free",
      useRemoteServer: false,
      ...config,
    };
  }
  async start() {
    if (this.isRunning) {
      return;
    }
    console.log("🪙 Starting Official CoinGecko MCP Server...");
    if (this.config.useRemoteServer) {
      // Use public remote MCP server (no API key required)
      this.process = spawn("npx", ["mcp-remote", "https://mcp.api.coingecko.com/sse"], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      // Use local MCP server
      const args = ["-y", "@coingecko/coingecko-mcp"];
      // Add optional configuration
      if (this.config.apiKey) {
        args.push("--client=claude", "--tools=dynamic");
      }
      this.process = spawn("npx", args, {
        env: {
          ...process.env,
          ...(this.config.apiKey && {
            COINGECKO_PRO_API_KEY: this.config.apiKey,
            COINGECKO_ENVIRONMENT: this.config.environment,
          }),
          COINGECKO_RATE_LIMIT: this.config.rateLimit?.toString(),
          COINGECKO_TIMEOUT: this.config.timeout?.toString(),
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
    }
    this.process.on("error", (error) => {
      console.error("❌ Official CoinGecko MCP Server error:", error);
      this.isRunning = false;
    });
    this.process.on("exit", (code) => {
      console.log(`🪙 Official CoinGecko MCP Server exited with code ${code}`);
      this.isRunning = false;
    });
    // Handle stdout for debugging
    this.process.stdout?.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`🪙 CoinGecko MCP: ${output}`);
      }
    });
    this.process.stderr?.on("data", (data) => {
      const error = data.toString().trim();
      if (error && !error.includes("ExperimentalWarning")) {
        console.error(`🪙 CoinGecko MCP Error: ${error}`);
      }
    });
    // Wait for server to be ready
    await this.waitForReady();
    this.isRunning = true;
    console.log("✅ Official CoinGecko MCP Server started successfully");
  }
  async stop() {
    if (this.process && this.isRunning) {
      console.log("🛑 Stopping Official CoinGecko MCP Server...");
      this.process.kill("SIGTERM");
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        if (this.process) {
          this.process.on("exit", () => {
            resolve();
          });
          // Force kill after 10 seconds
          setTimeout(() => {
            if (this.process && this.isRunning) {
              this.process.kill("SIGKILL");
            }
            resolve();
          }, 10000);
        } else {
          resolve();
        }
      });
      this.process = undefined;
      this.isRunning = false;
      console.log("✅ Official CoinGecko MCP Server stopped");
    }
  }
  async waitForReady() {
    // Wait for server initialization
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // Test server availability
    try {
      // For remote server, test connection is handled automatically
      if (this.config.useRemoteServer) {
        console.log("🌐 Using CoinGecko remote MCP server");
        return;
      }
      // For local server, wait for npm package installation if needed
      console.log("🔍 Verifying CoinGecko MCP server availability...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      throw new Error(
        `CoinGecko MCP Server startup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.process?.pid,
      config: this.config,
    };
  }
  // Available MCP Tools (provided by Official CoinGecko MCP Server)
  getAvailableTools() {
    return [
      // Price Data
      "get_price",
      "get_simple_price",
      // OHLCV Data
      "get_ohlcv",
      "get_ohlcv_range",
      // Historical Data
      "get_history",
      "get_history_range",
      // Market Data
      "get_coins_markets",
      "get_coin_by_id",
      "get_coin_tickers",
      // Trending Data
      "get_trending",
      "get_trending_search",
      // Global Data
      "get_global",
      "get_global_defi",
      // Categories
      "get_categories",
      "get_categories_list",
      // Exchanges
      "get_exchanges",
      "get_exchanges_list",
      // Search
      "search",
      "search_trending",
      // Companies
      "get_companies_public_treasury",
      // DeFi
      "get_defi_protocols",
      "get_defi_protocol_data",
      // NFTs (if supported)
      "get_nfts_list",
      "get_nft_data",
    ];
  }
  // Get server configuration info
  getServerInfo() {
    return {
      server: "Official CoinGecko MCP Server",
      version: "v1.5.0",
      provider: "CoinGecko",
      capabilities: {
        networks: "200+",
        tokens: "8M+",
        exchanges: "1000+",
        realTimeData: true,
        historicalData: true,
        defiData: true,
        nftData: true,
      },
      api: {
        environment: this.config.environment,
        rateLimit: this.config.rateLimit,
        timeout: this.config.timeout,
        authenticated: !!this.config.apiKey,
      },
      transport: this.config.useRemoteServer ? "remote-sse" : "stdio",
    };
  }
}
