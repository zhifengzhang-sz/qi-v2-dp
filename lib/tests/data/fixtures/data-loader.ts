#!/usr/bin/env bun

/**
 * Test Data Loader - No Mocking Allowed
 *
 * Loads real data from fixtures for testing.
 * All test data comes from actual API responses or generated realistic samples.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface CryptoPriceData {
  coinId: string;
  symbol: string;
  usdPrice: number;
  lastUpdated: Date;
  source: string;
  attribution: string;
}

interface CryptoOHLCVData {
  coinId: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  source: string;
  attribution: string;
}

interface CryptoMarketAnalytics {
  timestamp: Date;
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  source: string;
  attribution: string;
}

export class TestDataLoader {
  private fixturesDir: string;

  constructor() {
    this.fixturesDir = join(process.cwd(), "lib/tests/data/fixtures");
  }

  async loadBitcoinMarketData(): Promise<any> {
    const data = await this.loadFixture("coingecko/bitcoin-market-data.json");
    return JSON.parse(data.content[0].text);
  }

  async loadMultiCoinData(): Promise<any> {
    const data = await this.loadFixture("coingecko/multi-coin-data.json");
    return JSON.parse(data.content[0].text);
  }

  async loadGlobalMarketData(): Promise<any> {
    return this.loadFixture("coingecko/global-market-data.json");
  }

  async loadRealOHLCVData(): Promise<any> {
    return this.loadFixture("coingecko/bitcoin-ohlcv-real.json");
  }

  async loadAvailableTools(): Promise<any> {
    return this.loadFixture("coingecko/available-tools.json");
  }

  async loadMarketAnalytics(): Promise<CryptoMarketAnalytics> {
    const data = await this.loadFixture("market-data/global-analytics.json");
    return {
      timestamp: new Date(data.timestamp),
      totalMarketCap: data.totalMarketCap,
      totalVolume: data.totalVolume,
      btcDominance: data.btcDominance,
      ethDominance: data.ethDominance,
      source: data.source,
      attribution: data.attribution,
    };
  }

  async loadHistoricalAnalytics(): Promise<CryptoMarketAnalytics[]> {
    const data = await this.loadFixture("market-data/historical-analytics.json");
    return data.map((item: any) => ({
      timestamp: new Date(item.timestamp),
      totalMarketCap: item.totalMarketCap,
      totalVolume: item.totalVolume,
      btcDominance: item.btcDominance,
      ethDominance: item.ethDominance,
      source: "test-fixture",
      attribution: "Historical Test Data",
    }));
  }

  async loadOHLCVSamples(): Promise<CryptoOHLCVData[]> {
    const data = await this.loadFixture("market-data/bitcoin-ohlcv-hourly.json");
    return data.map((item: any) => ({
      coinId: item.coinId,
      timestamp: new Date(item.timestamp),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      source: item.source,
      attribution: item.attribution,
    }));
  }

  async loadKafkaMessages(): Promise<any[]> {
    return this.loadFixture("redpanda/price-messages.json");
  }

  async loadConsumerGroupMetadata(): Promise<any> {
    return this.loadFixture("redpanda/consumer-group-metadata.json");
  }

  async loadTimescalePriceRecords(): Promise<any[]> {
    return this.loadFixture("timescaledb/price-records.json");
  }

  async loadTimescaleSchemas(): Promise<any> {
    return this.loadFixture("timescaledb/table-schemas.json");
  }

  // Convert real CoinGecko data to our unified format
  async loadUnifiedPriceData(): Promise<CryptoPriceData[]> {
    const bitcoinData = await this.loadBitcoinMarketData();
    const multiCoinData = await this.loadMultiCoinData();

    const unified: CryptoPriceData[] = [];

    // Process Bitcoin data
    if (bitcoinData && bitcoinData.length > 0) {
      const btc = bitcoinData[0];
      unified.push({
        coinId: btc.id,
        symbol: btc.symbol.toLowerCase(),
        usdPrice: btc.current_price,
        lastUpdated: new Date(btc.last_updated),
        source: "coingecko-real",
        attribution: "CoinGecko MCP API",
      });
    }

    // Process multi-coin data
    if (multiCoinData && multiCoinData.length > 0) {
      for (const coin of multiCoinData) {
        unified.push({
          coinId: coin.id,
          symbol: coin.symbol.toLowerCase(),
          usdPrice: coin.current_price,
          lastUpdated: new Date(coin.last_updated),
          source: "coingecko-real",
          attribution: "CoinGecko MCP API",
        });
      }
    }

    return unified;
  }

  // Get current Bitcoin price from real data
  async getCurrentBitcoinPrice(): Promise<number> {
    const bitcoinData = await this.loadBitcoinMarketData();
    if (bitcoinData && bitcoinData.length > 0) {
      return bitcoinData[0].current_price;
    }
    throw new Error("No Bitcoin price data available in fixtures");
  }

  // Validate that fixture data exists and is recent
  async validateFixtures(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check that all required fixtures exist
      const requiredFixtures = [
        "coingecko/bitcoin-market-data.json",
        "coingecko/multi-coin-data.json",
        "market-data/global-analytics.json",
        "market-data/bitcoin-ohlcv-hourly.json",
        "redpanda/price-messages.json",
        "timescaledb/price-records.json",
      ];

      for (const fixture of requiredFixtures) {
        try {
          await this.loadFixture(fixture);
        } catch (error) {
          errors.push(`Missing fixture: ${fixture}`);
        }
      }

      // Check that data is reasonably recent (within 1 hour for prices)
      try {
        const bitcoinData = await this.loadBitcoinMarketData();
        if (bitcoinData && bitcoinData.length > 0) {
          const lastUpdated = new Date(bitcoinData[0].last_updated);
          const now = new Date();
          const ageHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

          if (ageHours > 1) {
            errors.push(
              `Bitcoin price data is ${ageHours.toFixed(1)} hours old - may need refresh`,
            );
          }
        }
      } catch (error) {
        errors.push("Cannot validate data freshness");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Fixture validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { valid: false, errors };
    }
  }

  private async loadFixture(path: string): Promise<any> {
    try {
      const fullPath = join(this.fixturesDir, path);
      const content = await readFile(fullPath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to load fixture ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// Export singleton instance
export const testDataLoader = new TestDataLoader();
