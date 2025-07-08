#!/usr/bin/env bun

/**
 * Redpanda Schema Generator - DSL to Topic Schema
 *
 * Generates Redpanda topic schemas and message structures from DSL types.
 * Ensures DSL changes automatically propagate to streaming layer.
 */

import { writeFileSync } from "node:fs";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
} from "../dsl/MarketDataTypes";

/**
 * Generate Redpanda topic configuration from DSL types
 */
export function generateRedpandaTopicConfig(): string {
  return `# Redpanda Topic Configuration Generated from DSL Types
# Source: lib/src/abstract/dsl/MarketDataTypes.ts
# DO NOT EDIT MANUALLY - Regenerate when DSL changes

# Topic Configuration for Crypto Data Platform
topics:
  # CryptoPriceData topic
  crypto-prices:
    partitions: 12
    replication_factor: 1
    cleanup_policy: "delete"
    retention_ms: 604800000  # 7 days
    compression_type: "snappy"
    max_message_bytes: 1048576  # 1MB
    segment_ms: 86400000  # 1 day
    
  # CryptoOHLCVData topic  
  crypto-ohlcv:
    partitions: 8
    replication_factor: 1
    cleanup_policy: "delete"
    retention_ms: 2592000000  # 30 days
    compression_type: "snappy"
    max_message_bytes: 1048576
    segment_ms: 86400000
    
  # CryptoMarketAnalytics topic
  market-analytics:
    partitions: 4
    replication_factor: 1
    cleanup_policy: "delete"
    retention_ms: 7776000000  # 90 days
    compression_type: "snappy"
    max_message_bytes: 1048576
    segment_ms: 86400000
    
  # Level1Data topic
  level1-data:
    partitions: 16
    replication_factor: 1
    cleanup_policy: "delete"
    retention_ms: 86400000  # 1 day (high frequency data)
    compression_type: "snappy"
    max_message_bytes: 1048576
    segment_ms: 3600000  # 1 hour
`;
}

/**
 * Generate JSON Schema for message validation
 */
export function generateJsonSchemas(): Record<string, any> {
  return {
    "crypto-prices": {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "CryptoPriceData",
      type: "object",
      required: [
        "coinId",
        "symbol",
        "exchangeId",
        "usdPrice",
        "lastUpdated",
        "source",
        "attribution",
      ],
      properties: {
        coinId: { type: "string", minLength: 1, maxLength: 50 },
        symbol: { type: "string", minLength: 1, maxLength: 20 },
        name: { type: "string", maxLength: 100 },
        exchangeId: { type: "string", minLength: 1, maxLength: 50 },
        usdPrice: { type: "number", minimum: 0 },
        btcPrice: { type: "number", minimum: 0 },
        ethPrice: { type: "number", minimum: 0 },
        marketCap: { type: "number", minimum: 0 },
        volume24h: { type: "number", minimum: 0 },
        change24h: { type: "number" },
        change7d: { type: "number" },
        lastUpdated: { type: "string", format: "date-time" },
        source: { type: "string", minLength: 1 },
        attribution: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },

    "crypto-ohlcv": {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "CryptoOHLCVData",
      type: "object",
      required: [
        "coinId",
        "exchangeId",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "timestamp",
        "timeframe",
        "source",
        "attribution",
      ],
      properties: {
        coinId: { type: "string", minLength: 1, maxLength: 50 },
        symbol: { type: "string", maxLength: 20 },
        exchangeId: { type: "string", minLength: 1, maxLength: 50 },
        open: { type: "number", minimum: 0 },
        high: { type: "number", minimum: 0 },
        low: { type: "number", minimum: 0 },
        close: { type: "number", minimum: 0 },
        volume: { type: "number", minimum: 0 },
        timestamp: { type: "string", format: "date-time" },
        timeframe: {
          type: "string",
          enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"],
        },
        source: { type: "string", minLength: 1 },
        attribution: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },

    "market-analytics": {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "CryptoMarketAnalytics",
      type: "object",
      required: [
        "totalMarketCap",
        "totalVolume",
        "btcDominance",
        "activeCryptocurrencies",
        "markets",
        "marketCapChange24h",
        "timestamp",
        "source",
        "attribution",
      ],
      properties: {
        exchangeId: { type: "string", maxLength: 50 },
        totalMarketCap: { type: "number", minimum: 0 },
        totalVolume: { type: "number", minimum: 0 },
        btcDominance: { type: "number", minimum: 0, maximum: 100 },
        ethDominance: { type: "number", minimum: 0, maximum: 100 },
        activeCryptocurrencies: { type: "integer", minimum: 0 },
        markets: { type: "integer", minimum: 0 },
        marketCapChange24h: { type: "number" },
        timestamp: { type: "string", format: "date-time" },
        source: { type: "string", minLength: 1 },
        attribution: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },

    "level1-data": {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Level1Data",
      type: "object",
      required: [
        "ticker",
        "bestBid",
        "bestAsk",
        "spread",
        "spreadPercent",
        "exchange",
        "market",
        "timestamp",
        "source",
        "attribution",
      ],
      properties: {
        ticker: { type: "string", minLength: 1, maxLength: 20 },
        bestBid: { type: "number", minimum: 0 },
        bestAsk: { type: "number", minimum: 0 },
        spread: { type: "number", minimum: 0 },
        spreadPercent: { type: "number", minimum: 0 },
        exchange: { type: "string", minLength: 1, maxLength: 50 },
        market: { type: "string", minLength: 1, maxLength: 50 },
        timestamp: { type: "string", format: "date-time" },
        source: { type: "string", minLength: 1 },
        attribution: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },
  };
}

/**
 * Generate message key strategies for topics
 */
export function generateKeyStrategies(): Record<string, string> {
  return {
    "crypto-prices": "coinId + ':' + exchangeId + ':' + symbol",
    "crypto-ohlcv":
      "coinId + ':' + exchangeId + ':' + timeframe + ':' + Math.floor(timestamp.getTime() / (timeframe === '1h' ? 3600000 : 86400000))",
    "market-analytics":
      "(exchangeId || 'global') + ':' + Math.floor(timestamp.getTime() / 3600000)", // Hourly keys
    "level1-data": "ticker + ':' + market + ':' + exchange",
  };
}

/**
 * Generate partition strategies for topics
 */
export function generatePartitionStrategies(): Record<string, string> {
  return {
    "crypto-prices": "hash(coinId + exchangeId) % partitionCount",
    "crypto-ohlcv": "hash(coinId + exchangeId + timeframe) % partitionCount",
    "market-analytics": "exchangeId ? hash(exchangeId) % partitionCount : 0", // Partition by exchange or single partition for global
    "level1-data": "hash(ticker + market + exchange) % partitionCount",
  };
}

/**
 * Generate type mappings for Redpanda actors
 */
export interface DSLToTopicMapping {
  topicName: string;
  dslType: string;
  keyStrategy: string;
  partitionStrategy: string;
  serializeFunction: string;
  deserializeFunction: string;
}

export function generateTopicMappings(): DSLToTopicMapping[] {
  return [
    {
      topicName: "crypto-prices",
      dslType: "CryptoPriceData",
      keyStrategy: "coinId + ':' + symbol",
      partitionStrategy: "hash(coinId) % partitionCount",
      serializeFunction: `
function serializeCryptoPriceData(data: CryptoPriceData): RedpandaMessage {
  return {
    key: data.coinId + ':' + data.symbol,
    value: JSON.stringify({
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      usdPrice: data.usdPrice,
      btcPrice: data.btcPrice,
      ethPrice: data.ethPrice,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      change24h: data.change24h,
      change7d: data.change7d,
      lastUpdated: data.lastUpdated.toISOString(),
      source: data.source,
      attribution: data.attribution
    }),
    partition: hashCode(data.coinId) % 12,
    timestamp: data.lastUpdated
  };
}`,
      deserializeFunction: `
function deserializeCryptoPriceData(message: RedpandaMessage): CryptoPriceData {
  const data = JSON.parse(message.value);
  return {
    coinId: data.coinId,
    symbol: data.symbol,
    name: data.name,
    usdPrice: data.usdPrice,
    btcPrice: data.btcPrice,
    ethPrice: data.ethPrice,
    marketCap: data.marketCap,
    volume24h: data.volume24h,
    change24h: data.change24h,
    change7d: data.change7d,
    lastUpdated: new Date(data.lastUpdated),
    source: data.source,
    attribution: data.attribution
  };
}`,
    },
    {
      topicName: "crypto-ohlcv",
      dslType: "CryptoOHLCVData",
      keyStrategy: "coinId + ':' + timeframe",
      partitionStrategy: "hash(coinId + timeframe) % partitionCount",
      serializeFunction: `
function serializeCryptoOHLCVData(data: CryptoOHLCVData): RedpandaMessage {
  return {
    key: data.coinId + ':' + data.timeframe,
    value: JSON.stringify({
      coinId: data.coinId,
      symbol: data.symbol,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
      timestamp: data.timestamp.toISOString(),
      timeframe: data.timeframe,
      source: data.source,
      attribution: data.attribution
    }),
    partition: hashCode(data.coinId + data.timeframe) % 8,
    timestamp: data.timestamp
  };
}`,
      deserializeFunction: `
function deserializeCryptoOHLCVData(message: RedpandaMessage): CryptoOHLCVData {
  const data = JSON.parse(message.value);
  return {
    coinId: data.coinId,
    symbol: data.symbol,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
    volume: data.volume,
    timestamp: new Date(data.timestamp),
    timeframe: data.timeframe,
    source: data.source,
    attribution: data.attribution
  };
}`,
    },
    {
      topicName: "market-analytics",
      dslType: "CryptoMarketAnalytics",
      keyStrategy: "'global'",
      partitionStrategy: "0",
      serializeFunction: `
function serializeMarketAnalytics(data: CryptoMarketAnalytics): RedpandaMessage {
  return {
    key: 'global',
    value: JSON.stringify({
      totalMarketCap: data.totalMarketCap,
      totalVolume: data.totalVolume,
      btcDominance: data.btcDominance,
      ethDominance: data.ethDominance,
      activeCryptocurrencies: data.activeCryptocurrencies,
      markets: data.markets,
      marketCapChange24h: data.marketCapChange24h,
      timestamp: data.timestamp.toISOString(),
      source: data.source,
      attribution: data.attribution
    }),
    partition: 0,
    timestamp: data.timestamp
  };
}`,
      deserializeFunction: `
function deserializeMarketAnalytics(message: RedpandaMessage): CryptoMarketAnalytics {
  const data = JSON.parse(message.value);
  return {
    totalMarketCap: data.totalMarketCap,
    totalVolume: data.totalVolume,
    btcDominance: data.btcDominance,
    ethDominance: data.ethDominance,
    activeCryptocurrencies: data.activeCryptocurrencies,
    markets: data.markets,
    marketCapChange24h: data.marketCapChange24h,
    timestamp: new Date(data.timestamp),
    source: data.source,
    attribution: data.attribution
  };
}`,
    },
    {
      topicName: "level1-data",
      dslType: "Level1Data",
      keyStrategy: "ticker + ':' + market",
      partitionStrategy: "hash(ticker + market) % partitionCount",
      serializeFunction: `
function serializeLevel1Data(data: Level1Data): RedpandaMessage {
  return {
    key: data.ticker + ':' + data.market,
    value: JSON.stringify({
      ticker: data.ticker,
      bestBid: data.bestBid,
      bestAsk: data.bestAsk,
      spread: data.spread,
      spreadPercent: data.spreadPercent,
      exchange: data.exchange,
      market: data.market,
      timestamp: data.timestamp.toISOString(),
      source: data.source,
      attribution: data.attribution
    }),
    partition: hashCode(data.ticker + data.market) % 16,
    timestamp: data.timestamp
  };
}`,
      deserializeFunction: `
function deserializeLevel1Data(message: RedpandaMessage): Level1Data {
  const data = JSON.parse(message.value);
  return {
    ticker: data.ticker,
    bestBid: data.bestBid,
    bestAsk: data.bestAsk,
    spread: data.spread,
    spreadPercent: data.spreadPercent,
    exchange: data.exchange,
    market: data.market,
    timestamp: new Date(data.timestamp),
    source: data.source,
    attribution: data.attribution
  };
}`,
    },
  ];
}

/**
 * Generate and write Redpanda configuration files
 */
export function generateRedpandaConfigFiles(outputDir = "../../services/redpanda/"): void {
  const topicConfig = generateRedpandaTopicConfig();
  const jsonSchemas = generateJsonSchemas();
  const mappings = generateTopicMappings();

  // Write topic configuration
  writeFileSync(`${outputDir}/topics.yml`, topicConfig);

  // Write JSON schemas
  writeFileSync(`${outputDir}/schemas.json`, JSON.stringify(jsonSchemas, null, 2));

  // Write TypeScript mappings
  const mappingsTs = `// Generated Redpanda Topic Mappings
// Source: lib/src/abstract/dsl/MarketDataTypes.ts
// DO NOT EDIT MANUALLY

${mappings.map((m) => m.serializeFunction).join("\n\n")}

${mappings.map((m) => m.deserializeFunction).join("\n\n")}

export const TOPIC_MAPPINGS = ${JSON.stringify(mappings, null, 2)};
`;

  writeFileSync(`${outputDir}/generated-mappings.ts`, mappingsTs);

  console.log(`✅ Generated Redpanda configuration files in: ${outputDir}`);
  console.log("   - topics.yml: Topic configuration");
  console.log("   - schemas.json: JSON Schema validation");
  console.log("   - generated-mappings.ts: TypeScript serialization functions");
}

/**
 * CLI entry point for Redpanda schema generation
 */
if (import.meta.main) {
  const outputDir = process.argv[2] || "../../services/redpanda/";
  generateRedpandaConfigFiles(outputDir);
}
