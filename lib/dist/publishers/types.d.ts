export interface CryptoPrice {
  coin_id: string;
  symbol: string;
  timestamp: number;
  usd_price: number;
  btc_price?: number;
  market_cap?: number;
  volume_24h?: number;
  change_24h?: number;
  last_updated?: number;
}
export interface CryptoOHLCV {
  coin_id: string;
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval?: string;
}
export interface MarketAnalytics {
  timestamp: number;
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  eth_dominance: number;
  defi_market_cap: number;
  active_cryptocurrencies: number;
}
export interface TrendingData {
  timestamp: number;
  trending_coins: Array<{
    coin_id: string;
    symbol: string;
    name: string;
    price_btc: number;
    score: number;
  }>;
  trending_nfts: Array<{
    id: string;
    name: string;
    symbol: string;
    floor_price_native: number;
  }>;
}
export interface PublisherConfig {
  clientId: string;
  brokers: string[];
  retryConfig?: {
    maxRetries: number;
    initialRetryTime: number;
    maxRetryTime: number;
  };
  batchConfig?: {
    maxBatchSize: number;
    maxBatchDelay: number;
  };
}
export interface PublishResult {
  topic: string;
  partition: number;
  offset: string;
  timestamp: number;
  success: boolean;
  error?: string;
}
export interface ConsumerConfig {
  clientId: string;
  groupId: string;
  brokers: string[];
  topics: string[];
  autoCommit?: boolean;
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxWaitTimeInMs?: number;
  minBytesPerPartition?: number;
  maxBytesPerPartition?: number;
}
