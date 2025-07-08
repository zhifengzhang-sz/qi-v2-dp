#!/usr/bin/env bun

/**
 * Phase 1: One-Time Data Collection Setup
 *
 * Collects real data from external APIs and stores as test fixtures.
 * This runs once manually or in CI/CD setup phase.
 *
 * If this fails, it indicates external API issues or network problems.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface CollectionResult {
  success: boolean;
  dataFiles: string[];
  errors: string[];
  timestamp: Date;
}

export class Phase1DataCollector {
  private dataDir: string;
  private errors: string[] = [];
  private dataFiles: string[] = [];

  constructor() {
    this.dataDir = join(process.cwd(), "lib/tests/data/fixtures");
  }

  private async connectWithRetry(maxRetries = 3): Promise<Client | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${maxRetries}...`);

        const client = new Client(
          {
            name: "phase1-data-collector",
            version: "1.0.0",
          },
          {
            capabilities: {},
          },
        );

        const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));

        await client.connect(transport);
        console.log("✅ Connected to CoinGecko MCP API");
        return client;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`❌ Attempt ${attempt} failed: ${errorMsg}`);

        if (attempt < maxRetries) {
          const delay = 2 ** attempt * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return null;
  }

  private async apiDelay(ms: number): Promise<void> {
    console.log(`⏳ Rate limiting delay: ${ms}ms`);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async collectAll(): Promise<CollectionResult> {
    console.log("🔄 Phase 1: Starting one-time data collection...");

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Collect data from each source
      await this.collectCoinGeckoData();
      await this.collectMarketAnalytics();
      await this.collectOHLCVSamples();

      // Generate sample Kafka/Redpanda messages
      await this.generateKafkaFixtures();

      // Generate TimescaleDB test records
      await this.generateTimescaleFixtures();

      const result: CollectionResult = {
        success: this.errors.length === 0,
        dataFiles: this.dataFiles,
        errors: this.errors,
        timestamp: new Date(),
      };

      // Save collection metadata
      await this.saveMetadata(result);

      if (result.success) {
        console.log("✅ Phase 1: Data collection completed successfully");
        console.log(`📁 Created ${result.dataFiles.length} fixture files`);
      } else {
        console.error("❌ Phase 1: Data collection failed");
        console.error("Errors:", result.errors);
      }

      return result;
    } catch (error) {
      const errorMsg = `Phase 1 setup failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error("❌", errorMsg);

      return {
        success: false,
        dataFiles: this.dataFiles,
        errors: [...this.errors, errorMsg],
        timestamp: new Date(),
      };
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = ["coingecko", "redpanda", "timescaledb", "market-data"];

    for (const dir of dirs) {
      await mkdir(join(this.dataDir, dir), { recursive: true });
    }
  }

  private async collectCoinGeckoData(): Promise<void> {
    console.log("🌐 Collecting CoinGecko data...");

    try {
      // Implement backoff retry for rate limiting
      const client = await this.connectWithRetry();
      if (!client) {
        throw new Error("Failed to connect to CoinGecko API after retries");
      }

      // Collect Bitcoin price data
      const bitcoinData = await client.callTool({
        name: "get_coins_markets",
        arguments: {
          ids: "bitcoin",
          vs_currency: "usd",
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true,
        },
      });

      await this.saveFixture("coingecko/bitcoin-market-data.json", bitcoinData);

      // Rate limiting delay
      await this.apiDelay(2000);

      // Collect multiple coin data
      const multiCoinData = await client.callTool({
        name: "get_coins_markets",
        arguments: {
          ids: "bitcoin,ethereum,cardano",
          vs_currency: "usd",
          include_market_cap: true,
        },
      });

      await this.saveFixture("coingecko/multi-coin-data.json", multiCoinData);

      // Rate limiting delay
      await this.apiDelay(2000);

      // List available tools first
      const toolsResult = await client.listTools();
      await this.saveFixture("coingecko/available-tools.json", toolsResult);

      // Rate limiting delay
      await this.apiDelay(2000);

      // Get global market data using correct tool name
      try {
        const globalData = await client.callTool({
          name: "get_global", // Correct tool name from available tools
          arguments: {},
        });
        await this.saveFixture("coingecko/global-market-data.json", globalData);
        console.log("✅ Global market data collected");

        // Rate limiting delay
        await this.apiDelay(2000);
      } catch (globalError) {
        console.log("ℹ️ Global market data tool failed, using market data from coins");
        // Use the multi-coin data as global market proxy
        await this.saveFixture("coingecko/global-market-data.json", {
          data: multiCoinData,
          source: "derived-from-coins",
          timestamp: new Date().toISOString(),
          note: "Global data derived from individual coin data due to API limitations",
        });
      }

      // Get OHLCV data from CoinGecko directly
      try {
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 24 * 60 * 60; // 24 hours ago

        const ohlcvData = await client.callTool({
          name: "get_range_coins_ohlc",
          arguments: {
            id: "bitcoin",
            vs_currency: "usd",
            from: startTime,
            to: endTime,
            interval: "hourly",
          },
        });
        await this.saveFixture("coingecko/bitcoin-ohlcv-real.json", ohlcvData);
        console.log("✅ Real OHLCV data collected");
      } catch (ohlcvError) {
        console.log("ℹ️ OHLCV tool failed, will use generated samples");
      }

      await client.close();
      console.log("✅ CoinGecko data collected");
    } catch (error) {
      const errorMsg = `CoinGecko data collection failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errorMsg);
      console.error("❌", errorMsg);
    }
  }

  private async collectMarketAnalytics(): Promise<void> {
    console.log("📊 Generating market analytics fixtures...");

    try {
      const marketAnalytics = {
        timestamp: new Date().toISOString(),
        totalMarketCap: 2500000000000,
        totalVolume: 50000000000,
        btcDominance: 45.5,
        ethDominance: 18.2,
        marketCapChange24h: 2.5,
        volumeChange24h: -5.2,
        activeCryptocurrencies: 12500,
        markets: 850,
        source: "test-fixture",
        attribution: "Phase 1 Data Collection",
      };

      await this.saveFixture("market-data/global-analytics.json", marketAnalytics);

      // Historical analytics (sample time series)
      const historicalAnalytics = [];
      const now = new Date();

      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly data
        historicalAnalytics.push({
          timestamp: timestamp.toISOString(),
          totalMarketCap: 2500000000000 + (Math.random() - 0.5) * 100000000000,
          totalVolume: 50000000000 + (Math.random() - 0.5) * 10000000000,
          btcDominance: 45.5 + (Math.random() - 0.5) * 2,
          ethDominance: 18.2 + (Math.random() - 0.5) * 1,
        });
      }

      await this.saveFixture("market-data/historical-analytics.json", historicalAnalytics);
      console.log("✅ Market analytics fixtures generated");
    } catch (error) {
      const errorMsg = `Market analytics generation failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errorMsg);
      console.error("❌", errorMsg);
    }
  }

  private async collectOHLCVSamples(): Promise<void> {
    console.log("📈 Generating OHLCV fixtures...");

    try {
      const ohlcvData = [];
      const now = new Date();
      const basePrice = 50000; // Bitcoin base price

      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly candles
        const open = basePrice + (Math.random() - 0.5) * 2000;
        const high = open + Math.random() * 1000;
        const low = open - Math.random() * 1000;
        const close = low + Math.random() * (high - low);
        const volume = Math.random() * 1000000;

        ohlcvData.push({
          coinId: "bitcoin",
          timestamp: timestamp.toISOString(),
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume: Math.round(volume * 100) / 100,
          source: "test-fixture",
          attribution: "Phase 1 OHLCV Generation",
        });
      }

      await this.saveFixture("market-data/bitcoin-ohlcv-hourly.json", ohlcvData);
      console.log("✅ OHLCV fixtures generated");
    } catch (error) {
      const errorMsg = `OHLCV generation failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errorMsg);
      console.error("❌", errorMsg);
    }
  }

  private async generateKafkaFixtures(): Promise<void> {
    console.log("🔄 Generating Kafka message fixtures...");

    try {
      // Price update messages
      const priceMessages = [
        {
          topic: "crypto-prices",
          partition: 0,
          offset: "1001",
          key: "bitcoin",
          value: {
            coinId: "bitcoin",
            symbol: "BTC",
            usdPrice: 50000,
            timestamp: new Date().toISOString(),
            source: "test-fixture",
          },
          headers: {
            messageType: "price-update",
            version: "1.0",
          },
        },
        {
          topic: "crypto-prices",
          partition: 0,
          offset: "1002",
          key: "ethereum",
          value: {
            coinId: "ethereum",
            symbol: "ETH",
            usdPrice: 3000,
            timestamp: new Date().toISOString(),
            source: "test-fixture",
          },
          headers: {
            messageType: "price-update",
            version: "1.0",
          },
        },
      ];

      await this.saveFixture("redpanda/price-messages.json", priceMessages);

      // Consumer group metadata
      const consumerGroupData = {
        groupId: "test-consumer-group",
        state: "Stable",
        protocolType: "consumer",
        protocol: "range",
        members: [
          {
            memberId: "test-member-1",
            clientId: "test-client-1",
            clientHost: "/127.0.0.1",
            assignments: [{ topic: "crypto-prices", partitions: [0, 1] }],
          },
        ],
      };

      await this.saveFixture("redpanda/consumer-group-metadata.json", consumerGroupData);
      console.log("✅ Kafka fixtures generated");
    } catch (error) {
      const errorMsg = `Kafka fixture generation failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errorMsg);
      console.error("❌", errorMsg);
    }
  }

  private async generateTimescaleFixtures(): Promise<void> {
    console.log("🗄️ Generating TimescaleDB fixtures...");

    try {
      // Sample price records
      const priceRecords = [];
      const now = new Date();

      for (let i = 0; i < 1000; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 1000); // Minute data
        priceRecords.push({
          coin_id: "bitcoin",
          symbol: "BTC",
          usd_price: 50000 + (Math.random() - 0.5) * 1000,
          market_cap_usd: 1000000000000,
          volume_24h_usd: 20000000000,
          timestamp: timestamp.toISOString(),
          source: "test-fixture",
          attribution: "Phase 1 TimescaleDB Generation",
        });
      }

      await this.saveFixture("timescaledb/price-records.json", priceRecords);

      // Hypertable schemas
      const schemas = {
        crypto_prices: {
          columns: [
            { name: "coin_id", type: "TEXT", constraints: ["NOT NULL"] },
            { name: "symbol", type: "TEXT", constraints: ["NOT NULL"] },
            { name: "usd_price", type: "DECIMAL(20,8)", constraints: ["NOT NULL"] },
            { name: "market_cap_usd", type: "BIGINT" },
            { name: "volume_24h_usd", type: "BIGINT" },
            { name: "timestamp", type: "TIMESTAMPTZ", constraints: ["NOT NULL"] },
            { name: "source", type: "TEXT", constraints: ["NOT NULL"] },
            { name: "attribution", type: "TEXT" },
          ],
          timeColumn: "timestamp",
          chunkInterval: "1 day",
        },
        crypto_ohlcv: {
          columns: [
            { name: "coin_id", type: "TEXT", constraints: ["NOT NULL"] },
            { name: "timestamp", type: "TIMESTAMPTZ", constraints: ["NOT NULL"] },
            { name: "open_price", type: "DECIMAL(20,8)", constraints: ["NOT NULL"] },
            { name: "high_price", type: "DECIMAL(20,8)", constraints: ["NOT NULL"] },
            { name: "low_price", type: "DECIMAL(20,8)", constraints: ["NOT NULL"] },
            { name: "close_price", type: "DECIMAL(20,8)", constraints: ["NOT NULL"] },
            { name: "volume", type: "DECIMAL(30,8)" },
            { name: "source", type: "TEXT", constraints: ["NOT NULL"] },
          ],
          timeColumn: "timestamp",
          chunkInterval: "1 day",
        },
      };

      await this.saveFixture("timescaledb/table-schemas.json", schemas);
      console.log("✅ TimescaleDB fixtures generated");
    } catch (error) {
      const errorMsg = `TimescaleDB fixture generation failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errorMsg);
      console.error("❌", errorMsg);
    }
  }

  private async saveFixture(filepath: string, data: any): Promise<void> {
    const fullPath = join(this.dataDir, filepath);
    await writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
    this.dataFiles.push(filepath);
    console.log(`💾 Saved: ${filepath}`);
  }

  private async saveMetadata(result: CollectionResult): Promise<void> {
    const metadata = {
      collectionTime: result.timestamp,
      success: result.success,
      filesCreated: result.dataFiles.length,
      errors: result.errors,
      dataFiles: result.dataFiles,
      phase: "phase1-one-time-setup",
      nextPhase: "phase2-service-validation",
    };

    await writeFile(
      join(this.dataDir, "_metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf8",
    );
  }
}

// CLI execution
if (import.meta.main) {
  const collector = new Phase1DataCollector();
  const result = await collector.collectAll();

  if (!result.success) {
    console.error("❌ Phase 1 setup failed - tests cannot run without proper fixtures");
    process.exit(1);
  }

  console.log("🎉 Phase 1 complete - fixtures ready for testing");
  process.exit(0);
}
