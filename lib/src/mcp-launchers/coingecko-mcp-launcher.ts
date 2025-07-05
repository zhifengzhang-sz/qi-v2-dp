// lib/src/mcp-launchers/coingecko-mcp-launcher.ts
import { type ChildProcess, spawn } from "node:child_process";

export interface CoinGeckoMCPConfig {
  apiKey?: string;
  rateLimit?: number;
  timeout?: number;
  environment?: "free" | "pro" | "demo";
  useRemoteServer?: boolean;
  useDynamicTools?: boolean; // New option to control tools mode
}

export class OfficialCoinGeckoMCPLauncher {
  private process?: ChildProcess;
  private isRunning = false;
  private config: CoinGeckoMCPConfig;

  constructor(config: CoinGeckoMCPConfig = {}) {
    this.config = {
      rateLimit: 50,
      timeout: 30000,
      environment: "free",
      useRemoteServer: true,  // PRODUCTION-READY: Use remote server (no local auth issues)
      useDynamicTools: false, // PRODUCTION-READY: Static tools mode for reliability
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log("🪙 Starting Official CoinGecko MCP Server...");

    if (this.config.useRemoteServer) {
      // Use official CoinGecko public remote MCP server (no API key required)
      console.log("🌐 Using official CoinGecko remote MCP server (free tier)");
      this.process = spawn("npx", ["mcp-remote", "https://mcp.api.coingecko.com/sse"], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      // Use local MCP server with configurable tools mode
      const args = ["-y", "@coingecko/coingecko-mcp", "--client=claude"];
      
      // Add tools mode flag based on configuration
      if (this.config.useDynamicTools) {
        args.push("--tools=dynamic");
        console.log('🔧 Using --client=claude --tools=dynamic for dynamic tools mode');
      } else {
        console.log('🔧 Using --client=claude for static tools mode (no --tools=dynamic)');
      }

      // Set up environment variables for free tier
      const env = {
        ...process.env,
        COINGECKO_RATE_LIMIT: this.config.rateLimit?.toString(),
        COINGECKO_TIMEOUT: this.config.timeout?.toString(),
      };

      // For official CoinGecko MCP server environment variables
      // NOTE: CoinGecko MCP server uses COINGECKO_PRO_API_KEY for both demo and pro keys
      // But environment should be "demo" for demo keys to use api.coingecko.com endpoint
      if (this.config.apiKey) {
        env.COINGECKO_PRO_API_KEY = this.config.apiKey;
        env.COINGECKO_ENVIRONMENT = this.config.environment === "free" ? "demo" : this.config.environment || "demo";
      } else if (this.config.environment === "free") {
        // Explicitly tell server to use free tier by omitting API key headers
        env.COINGECKO_USE_FREE_API = "true";
        env.COINGECKO_OMIT_API_HEADERS = "true";
        env.COINGECKO_ENVIRONMENT = "free";
      }

      // Debug: Log environment variables being passed
      if (this.config.debug || true) {
        console.log('🔧 MCP Server Environment Variables:');
        Object.entries(env).forEach(([key, value]) => {
          if (key.includes('COINGECKO')) {
            console.log(`   ${key}: ${value ? (key.includes('API_KEY') ? `${value.substring(0, 8)}...${value.slice(-4)}` : value) : 'undefined'}`);
          }
        });
      }

      this.process = spawn("npx", args, {
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });
    }

    this.process.on("error", (error: Error) => {
      console.error("❌ Official CoinGecko MCP Server error:", error);
      this.isRunning = false;
    });

    this.process.on("exit", (code: number | null) => {
      console.log(`🪙 Official CoinGecko MCP Server exited with code ${code}`);
      this.isRunning = false;
    });

    // Handle stdout for debugging
    this.process.stdout?.on("data", (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`🪙 CoinGecko MCP: ${output}`);
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
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

  async stop(): Promise<void> {
    if (this.process && this.isRunning) {
      console.log("🛑 Stopping Official CoinGecko MCP Server...");

      this.process.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
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

  private async waitForReady(): Promise<void> {
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
    } catch (error: unknown) {
      throw new Error(
        `CoinGecko MCP Server startup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getStatus(): { isRunning: boolean; pid?: number; config: CoinGeckoMCPConfig } {
    return {
      isRunning: this.isRunning,
      pid: this.process?.pid,
      config: this.config,
    };
  }

  // Available MCP Tools (provided by Official CoinGecko MCP Server)
  getAvailableTools(): string[] {
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
  getServerInfo(): object {
    return {
      server: "Official CoinGecko MCP Server",
      version: "v1.5.0",
      provider: "CoinGecko",
      endpoint: this.config.useRemoteServer ? "https://mcp.api.coingecko.com/sse" : "local",
      attribution: {
        required: true,
        text: "Data provided by CoinGecko (https://www.coingecko.com)",
        link: "https://www.coingecko.com",
        apiLink: "https://www.coingecko.com/en/api/",
        logoRequired: false, // For API usage, text attribution is sufficient
        compliance: "https://brand.coingecko.com/resources/attribution-guide"
      },
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
        freeThreshold: this.config.useRemoteServer ? "No API key required" : "Local server needs API key",
      },
      transport: this.config.useRemoteServer ? "remote-sse" : "stdio",
    };
  }
}
