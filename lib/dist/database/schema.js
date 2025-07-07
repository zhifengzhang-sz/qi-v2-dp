// lib/src/database/schema.ts
// Drizzle ORM schema for crypto financial time-series data
// Based on research from Drizzle ORM docs and financial data modeling best practices
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
// Reusable timestamp columns pattern from Drizzle best practices
export const timestamps = {
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
};
// =============================================================================
// REFERENCE DATA TABLES
// =============================================================================
/**
 * Currencies table - stores all supported currencies (BTC, ETH, USD, etc.)
 * Based on crypto trading data model patterns
 */
export const currencies = pgTable(
  "currencies",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 10 }).notNull().unique(), // BTC, ETH, USD
    name: varchar("name", { length: 100 }).notNull(), // Bitcoin, Ethereum, US Dollar
    isActive: boolean("is_active").notNull().default(true),
    isFiat: boolean("is_fiat").notNull().default(false), // true for USD, EUR, etc.
    decimals: integer("decimals").notNull().default(8), // Precision for this currency
    ...timestamps,
  },
  (table) => ({
    codeIdx: index("currencies_code_idx").on(table.code),
    activeIdx: index("currencies_active_idx").on(table.isActive),
  }),
);
/**
 * Trading pairs - represents tradeable pairs like BTC/USD, ETH/BTC
 * Based on CoinGecko API structure and trading platform patterns
 */
export const tradingPairs = pgTable(
  "trading_pairs",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 20 }).notNull().unique(), // BTC/USD, ETH/BTC
    baseAsset: varchar("base_asset", { length: 10 }).notNull(), // BTC in BTC/USD
    quoteAsset: varchar("quote_asset", { length: 10 }).notNull(), // USD in BTC/USD
    baseCurrencyId: integer("base_currency_id").references(() => currencies.id),
    quoteCurrencyId: integer("quote_currency_id").references(() => currencies.id),
    isActive: boolean("is_active").notNull().default(true),
    minTradeSize: numeric("min_trade_size", { precision: 20, scale: 8 }),
    maxTradeSize: numeric("max_trade_size", { precision: 20, scale: 8 }),
    priceTickSize: numeric("price_tick_size", { precision: 20, scale: 8 }),
    ...timestamps,
  },
  (table) => ({
    symbolIdx: index("trading_pairs_symbol_idx").on(table.symbol),
    activeIdx: index("trading_pairs_active_idx").on(table.isActive),
    baseQuoteIdx: index("trading_pairs_base_quote_idx").on(table.baseAsset, table.quoteAsset),
  }),
);
/**
 * Exchanges - tracks different exchanges (Coinbase, Binance, etc.)
 */
export const exchanges = pgTable(
  "exchanges",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(), // coinbase, binance
    displayName: varchar("display_name", { length: 100 }).notNull(), // Coinbase Pro
    isActive: boolean("is_active").notNull().default(true),
    apiUrl: text("api_url"),
    websocketUrl: text("websocket_url"),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("exchanges_name_idx").on(table.name),
    activeIdx: index("exchanges_active_idx").on(table.isActive),
  }),
);
// =============================================================================
// TIME-SERIES DATA TABLES
// =============================================================================
/**
 * Real-time price data from CoinGecko API
 * Optimized for TimescaleDB hypertable with composite primary key
 * Based on CoinGecko price API response structure
 */
export const cryptoPrices = pgTable(
  "crypto_prices",
  {
    time: timestamp("time", { mode: "date" }).notNull(),
    coinId: varchar("coin_id", { length: 50 }).notNull(), // bitcoin, ethereum
    symbol: varchar("symbol", { length: 20 }).notNull(), // BTC, ETH
    exchangeId: integer("exchange_id").references(() => exchanges.id),
    // Price data - using numeric for financial precision (up to 20 digits, 8 decimal places)
    usdPrice: numeric("usd_price", { precision: 20, scale: 8 }),
    btcPrice: numeric("btc_price", { precision: 20, scale: 8 }),
    ethPrice: numeric("eth_price", { precision: 20, scale: 8 }),
    // Market data
    marketCap: numeric("market_cap", { precision: 30, scale: 2 }), // Large numbers for market cap
    volume24h: numeric("volume_24h", { precision: 30, scale: 2 }),
    change24h: numeric("change_24h", { precision: 10, scale: 4 }), // Percentage change
    change7d: numeric("change_7d", { precision: 10, scale: 4 }),
    // Metadata
    lastUpdated: timestamp("last_updated", { mode: "date" }),
    source: varchar("source", { length: 50 }).default("coingecko"),
    ...timestamps,
  },
  (table) => ({
    // Composite primary key for TimescaleDB hypertable
    pk: primaryKey({ columns: [table.coinId, table.time] }),
    // Indexes optimized for time-series queries
    timeIdx: index("crypto_prices_time_idx").on(table.time),
    symbolTimeIdx: index("crypto_prices_symbol_time_idx").on(table.symbol, table.time),
    coinTimeIdx: index("crypto_prices_coin_time_idx").on(table.coinId, table.time),
  }),
);
/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data
 * Based on financial market standards and CoinGecko OHLCV API
 */
export const ohlcvData = pgTable(
  "ohlcv_data",
  {
    time: timestamp("time", { mode: "date" }).notNull(),
    coinId: varchar("coin_id", { length: 50 }).notNull(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    exchangeId: integer("exchange_id").references(() => exchanges.id),
    // Timeframe for this candle
    timeframe: varchar("timeframe", { length: 10 }).notNull(), // 1m, 5m, 1h, 1d, 1w
    // OHLCV data - financial precision
    open: numeric("open", { precision: 20, scale: 8 }).notNull(),
    high: numeric("high", { precision: 20, scale: 8 }).notNull(),
    low: numeric("low", { precision: 20, scale: 8 }).notNull(),
    close: numeric("close", { precision: 20, scale: 8 }).notNull(),
    volume: numeric("volume", { precision: 30, scale: 8 }).notNull(),
    // Additional trading metrics
    trades: integer("trades").default(0), // Number of trades in this period
    vwap: numeric("vwap", { precision: 20, scale: 8 }), // Volume Weighted Average Price
    // Metadata
    source: varchar("source", { length: 50 }).default("coingecko"),
    ...timestamps,
  },
  (table) => ({
    // Composite primary key for TimescaleDB hypertable
    pk: primaryKey({ columns: [table.coinId, table.timeframe, table.time] }),
    // Indexes for time-series analysis
    timeIdx: index("ohlcv_time_idx").on(table.time),
    symbolTimeframeTimeIdx: index("ohlcv_symbol_timeframe_time_idx").on(
      table.symbol,
      table.timeframe,
      table.time,
    ),
  }),
);
/**
 * Individual trades - tick-by-tick trade data
 * For high-frequency trading analysis
 */
export const trades = pgTable(
  "trades",
  {
    id: serial("id").primaryKey(),
    time: timestamp("time", { mode: "date" }).notNull(),
    coinId: varchar("coin_id", { length: 50 }).notNull(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    exchangeId: integer("exchange_id").references(() => exchanges.id),
    // Trade data
    price: numeric("price", { precision: 20, scale: 8 }).notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    side: varchar("side", { length: 4 }).notNull(), // buy, sell
    // Trade identifiers
    tradeId: varchar("trade_id", { length: 100 }),
    orderId: varchar("order_id", { length: 100 }),
    // Metadata
    source: varchar("source", { length: 50 }).default("coingecko"),
    ...timestamps,
  },
  (table) => ({
    timeIdx: index("trades_time_idx").on(table.time),
    symbolTimeIdx: index("trades_symbol_time_idx").on(table.symbol, table.time),
    tradeIdIdx: index("trades_trade_id_idx").on(table.tradeId),
  }),
);
/**
 * Market analytics - aggregated market data
 * Based on CoinGecko global API structure
 */
export const marketAnalytics = pgTable(
  "market_analytics",
  {
    time: timestamp("time", { mode: "date" }).notNull().primaryKey(),
    // Global market metrics
    totalMarketCap: numeric("total_market_cap", { precision: 30, scale: 2 }),
    totalVolume: numeric("total_volume", { precision: 30, scale: 2 }),
    btcDominance: numeric("btc_dominance", { precision: 10, scale: 4 }),
    ethDominance: numeric("eth_dominance", { precision: 10, scale: 4 }),
    // Market segments
    defiMarketCap: numeric("defi_market_cap", { precision: 30, scale: 2 }),
    nftVolume: numeric("nft_volume", { precision: 30, scale: 2 }),
    // Market activity
    activeCryptocurrencies: integer("active_cryptocurrencies"),
    activeExchanges: integer("active_exchanges"),
    // Market sentiment indicators
    fearGreedIndex: integer("fear_greed_index"), // 0-100
    // Metadata
    source: varchar("source", { length: 50 }).default("coingecko"),
    ...timestamps,
  },
  (table) => ({
    timeIdx: index("market_analytics_time_idx").on(table.time),
  }),
);
// Export all tables for use in queries
export const schema = {
  currencies,
  tradingPairs,
  exchanges,
  cryptoPrices,
  ohlcvData,
  trades,
  marketAnalytics,
};
