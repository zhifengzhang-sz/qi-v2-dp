// lib/src/publishers/sources/coingecko/index.ts
// CoinGecko Actor + DSL Entry Point
// Provides Actor/MCP architecture for crypto market data operations

// =============================================================================
// MAIN EXPORTS - Core Classes
// =============================================================================

export { CoinGeckoActor, createCoinGeckoActor, createCoinGeckoAgent } from './coingecko-actor';
export { CoinGeckoDSL } from './coingecko-dsl';

// =============================================================================
// TYPE EXPORTS - All TypeScript Definitions
// =============================================================================

export * from './types';
export type { 
  DateRangeOHLCVQuery,
  RealtimeStreamQuery,
  Level1Query,
  Level1Data,
  RealtimeDataEvent,
  TradeData,
  OrderBookData
} from './coingecko-dsl';

// =============================================================================
// CONVENIENCE FACTORIES
// =============================================================================

import { type CoinGeckoActorConfig, createCoinGeckoActor } from './coingecko-actor';
import { CoinGeckoDSL } from './coingecko-dsl';

/**
 * Create a fully configured CoinGecko DSL instance (direct usage)
 * 
 * @example
 * ```typescript
 * import { createCoinGeckoDSL } from '@qicore/crypto-data-platform/coingecko';
 * 
 * const dsl = createCoinGeckoDSL({
 *   apiKey: process.env.COINGECKO_API_KEY,
 *   environment: 'demo',
 *   debug: true,
 * });
 * 
 * await dsl.initialize();
 * const btcPrice = await dsl.getPrice('BTC');
 * ```
 */
export function createCoinGeckoDSL(config: any = {}): CoinGeckoDSL {
  return new CoinGeckoDSL({
    debug: false,
    useRemoteServer: true,
    environment: 'demo',
    ...config,
  });
}

/**
 * Create a CoinGecko actor for Actor/MCP architecture
 * 
 * @example
 * ```typescript
 * import { createCoinGeckoActor } from '@qicore/crypto-data-platform/coingecko';
 * 
 * const actor = createCoinGeckoActor({
 *   name: 'crypto-data-actor',
 *   coinGeckoConfig: {
 *     apiKey: process.env.COINGECKO_API_KEY,
 *     environment: 'demo',
 *   }
 * });
 * 
 * await actor.initialize();
 * const prices = await actor.getCurrentPrices(['bitcoin', 'ethereum']);
 * ```
 */
export function createCoinGeckoActorWrapper(config: CoinGeckoActorConfig) {
  return createCoinGeckoActor(config);
}

// =============================================================================
// QUICK START HELPERS
// =============================================================================

/**
 * Quick helper to get Bitcoin price using Actor/MCP architecture
 */
export async function getBitcoinPrice(config?: any): Promise<number | null> {
  const actor = createCoinGeckoActor({
    name: 'quick-bitcoin-actor',
    description: 'Quick Bitcoin price lookup',
    version: '1.0.0',
    coinGeckoConfig: config || {}
  });
  
  try {
    await actor.initialize();
    const prices = await actor.getCurrentPrices(['bitcoin']);
    return prices[0]?.usdPrice || null;
  } finally {
    await actor.cleanup();
  }
}

/**
 * Quick helper to get multiple cryptocurrency prices using Actor/MCP architecture
 */
export async function getCryptoPrices(
  coinIds: string[], 
  config?: any
): Promise<Map<string, number>> {
  const actor = createCoinGeckoActor({
    name: 'quick-crypto-prices-actor',
    description: 'Quick crypto prices lookup',
    version: '1.0.0',
    coinGeckoConfig: config || {}
  });
  
  try {
    await actor.initialize();
    const prices = await actor.getCurrentPrices(coinIds);
    
    const priceMap = new Map<string, number>();
    prices.forEach(price => {
      priceMap.set(price.coinId, price.usdPrice);
    });
    
    return priceMap;
  } finally {
    await actor.cleanup();
  }
}

/**
 * Quick helper to get market analytics using Actor/MCP architecture
 */
export async function getMarketAnalytics(config?: any) {
  const actor = createCoinGeckoActor({
    name: 'quick-market-analytics-actor',
    description: 'Quick market analytics lookup',
    version: '1.0.0',
    coinGeckoConfig: config || {}
  });
  
  try {
    await actor.initialize();
    const data = await actor.getCryptoData({
      coinIds: ['bitcoin'],
      dataTypes: ['analytics'],
      includeAnalysis: false
    });
    return data.analytics;
  } finally {
    await actor.cleanup();
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Popular cryptocurrency coin IDs for quick reference
 */
export const POPULAR_COINS = {
  BITCOIN: 'bitcoin',
  ETHEREUM: 'ethereum',
  BINANCE_COIN: 'binancecoin',
  CARDANO: 'cardano',
  SOLANA: 'solana',
  POLYGON: 'matic-network',
  CHAINLINK: 'chainlink',
  UNISWAP: 'uniswap',
  LITECOIN: 'litecoin',
  DOGECOIN: 'dogecoin',
} as const;

/**
 * Common vs currencies
 */
export const VS_CURRENCIES = {
  USD: 'usd',
  EUR: 'eur',
  JPY: 'jpy',
  BTC: 'btc',
  ETH: 'eth',
} as const;

/**
 * Default configuration for different environments
 */
export const DEFAULT_CONFIGS = {
  FREE: {
    environment: 'free' as const,
    useRemoteServer: true,
    debug: false,
  },
  DEMO: {
    environment: 'demo' as const,
    useRemoteServer: true,
    debug: false,
  },
  PRO: {
    environment: 'pro' as const,
    useRemoteServer: false,
    debug: false,
  },
} as const;

// =============================================================================
// VERSION INFO
// =============================================================================

export const VERSION = '1.0.0';
export const COINGECKO_API_VERSION = 'v3';
export const MCP_SERVER_VERSION = '1.5.0';

// =============================================================================
// MODULE METADATA
// =============================================================================

export const MODULE_INFO = {
  name: '@qicore/crypto-data-platform-coingecko',
  version: VERSION,
  description: 'CoinGecko Actor/MCP architecture for crypto market data operations',
  architecture: 'Actor = MCP Client + DSL → MCP Server → CoinGecko API',
  features: [
    'Actor/MCP paradigm implementation (not Agent - no AI workflows)',
    'Financial market DSL (OHLCV date ranges, Level 1 data)',
    'Real-time streaming with polling fallback',
    'Symbol/ticker resolution (BTC → bitcoin)',
    'Exchange/market parameter support',
    'Bid/ask spread calculations',
    'Market analytics and trending data',
    'TypeScript type safety',
    'Clean DSL interface (hides MCP complexity)',
    'Proper attribution compliance',
  ],
  dependencies: {
    'Official CoinGecko MCP Server': '@coingecko/coingecko-mcp',
    'QiCore Agent Library': '@qicore/agent-lib',
  },
  patterns: {
    'Actor': 'Special MCP Client that provides DSL tooling interfaces',
    'Agent': 'Special QiAgent with workflow composed of Actors',
    'DSL': 'Domain-specific tooling interfaces (the Actor\'s specialty)',
    'MCP': 'Protocol + Server + Local tools integration',
  },
} as const;