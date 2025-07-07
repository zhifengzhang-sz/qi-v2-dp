import type { CryptoDataConsumer } from "../consumers/crypto-data-consumer";
import type { CryptoDataPublisher } from "../publishers/crypto-data-publisher";
import type { CryptoOHLCV, CryptoPrice } from "../publishers/types";
import type { MCPTool } from "./registry";
/**
 * High-Performance Crypto Data Streaming Tool
 *
 * Justification for custom tool:
 * - Official CoinGecko MCP provides data fetching, but NOT streaming pipelines
 * - This tool handles high-performance streaming: CoinGecko → Redpanda
 * - Wraps CryptoDataProducer for real-time data publishing
 */
export declare class StreamCryptoDataTool implements MCPTool {
  private producer;
  name: string;
  description: string;
  constructor(producer: CryptoDataPublisher);
  execute(params: {
    operation: "start" | "stop" | "publish_price" | "publish_ohlcv" | "publish_analytics";
    priceData?: CryptoPrice;
    ohlcvData?: CryptoOHLCV;
    analyticsData?: any;
  }): Promise<{
    success: boolean;
    operation: string;
    latency: number;
  }>;
}
/**
 * High-Performance Stream Consumer Tool
 *
 * Justification for custom tool:
 * - Official Kafka MCP provides basic operations, but NOT streaming pipelines
 * - This tool handles: Redpanda → Consumer → TimescaleDB
 * - Wraps CryptoDataConsumer for real-time data processing
 */
export declare class ConsumeStreamDataTool implements MCPTool {
  private consumer;
  name: string;
  description: string;
  constructor(consumer: CryptoDataConsumer);
  execute(params: {
    operation: "start" | "stop" | "subscribe" | "get_stats";
    topics?: string[];
    groupId?: string;
  }): Promise<{
    success: boolean;
    operation: string;
    latency: number;
    stats?: any;
  }>;
}
/**
 * High-Performance Stream Processing Tool
 * Wraps the high-performance consumer for real-time processing
 */
export declare class ProcessCryptoStreamTool implements MCPTool {
  private consumer;
  name: string;
  description: string;
  constructor(consumer: CryptoDataConsumer);
  execute(params: {
    operation: "moving_average" | "volatility" | "trend_detection";
    window?: number;
    threshold?: number;
  }): Promise<{
    success: boolean;
    operation: string;
    latency: number;
  }>;
}
/**
 * Batch Data Processing Tool
 * High-performance batch operations
 */
export declare class BatchProcessDataTool implements MCPTool {
  private producer;
  private consumer;
  name: string;
  description: string;
  constructor(producer: CryptoDataPublisher, consumer: CryptoDataConsumer);
  execute(params: {
    operation: "backfill" | "reprocess" | "aggregate";
    timeRange: {
      start: number;
      end: number;
    };
    symbols: string[];
  }): Promise<{
    success: boolean;
    processed: number;
    latency: number;
  }>;
}
