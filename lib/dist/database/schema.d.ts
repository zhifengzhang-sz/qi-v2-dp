export declare const timestamps: {
  createdAt: import("drizzle-orm").HasDefault<
    import("drizzle-orm").NotNull<
      import("drizzle-orm/pg-core").PgTimestampBuilderInitial<"created_at">
    >
  >;
  updatedAt: import("drizzle-orm").HasDefault<
    import("drizzle-orm").NotNull<
      import("drizzle-orm/pg-core").PgTimestampBuilderInitial<"updated_at">
    >
  >;
};
/**
 * Currencies table - stores all supported currencies (BTC, ETH, USD, etc.)
 * Based on crypto trading data model patterns
 */
export declare const currencies: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "currencies";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "currencies";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "currencies";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    id: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "id";
        tableName: "currencies";
        dataType: "number";
        columnType: "PgSerial";
        data: number;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    code: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "code";
        tableName: "currencies";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    name: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "name";
        tableName: "currencies";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    isActive: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "is_active";
        tableName: "currencies";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    isFiat: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "is_fiat";
        tableName: "currencies";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    decimals: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "decimals";
        tableName: "currencies";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * Trading pairs - represents tradeable pairs like BTC/USD, ETH/BTC
 * Based on CoinGecko API structure and trading platform patterns
 */
export declare const tradingPairs: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "trading_pairs";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "trading_pairs";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "trading_pairs";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    id: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "id";
        tableName: "trading_pairs";
        dataType: "number";
        columnType: "PgSerial";
        data: number;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    symbol: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "symbol";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    baseAsset: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "base_asset";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    quoteAsset: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "quote_asset";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    baseCurrencyId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "base_currency_id";
        tableName: "trading_pairs";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    quoteCurrencyId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "quote_currency_id";
        tableName: "trading_pairs";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    isActive: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "is_active";
        tableName: "trading_pairs";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    minTradeSize: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "min_trade_size";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    maxTradeSize: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "max_trade_size";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    priceTickSize: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "price_tick_size";
        tableName: "trading_pairs";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * Exchanges - tracks different exchanges (Coinbase, Binance, etc.)
 */
export declare const exchanges: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "exchanges";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "exchanges";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "exchanges";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    id: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "id";
        tableName: "exchanges";
        dataType: "number";
        columnType: "PgSerial";
        data: number;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    name: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "name";
        tableName: "exchanges";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    displayName: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "display_name";
        tableName: "exchanges";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    isActive: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "is_active";
        tableName: "exchanges";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    apiUrl: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "api_url";
        tableName: "exchanges";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    websocketUrl: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "websocket_url";
        tableName: "exchanges";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * Real-time price data from CoinGecko API
 * Optimized for TimescaleDB hypertable with composite primary key
 * Based on CoinGecko price API response structure
 */
export declare const cryptoPrices: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "crypto_prices";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "crypto_prices";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "crypto_prices";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    time: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "time";
        tableName: "crypto_prices";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    coinId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "coin_id";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    symbol: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "symbol";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    exchangeId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "exchange_id";
        tableName: "crypto_prices";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    usdPrice: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "usd_price";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    btcPrice: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "btc_price";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    ethPrice: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "eth_price";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    marketCap: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "market_cap";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    volume24h: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "volume_24h";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    change24h: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "change_24h";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    change7d: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "change_7d";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    lastUpdated: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "last_updated";
        tableName: "crypto_prices";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    source: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "source";
        tableName: "crypto_prices";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data
 * Based on financial market standards and CoinGecko OHLCV API
 */
export declare const ohlcvData: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "ohlcv_data";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "ohlcv_data";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "ohlcv_data";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    time: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "time";
        tableName: "ohlcv_data";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    coinId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "coin_id";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    symbol: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "symbol";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    exchangeId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "exchange_id";
        tableName: "ohlcv_data";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    timeframe: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "timeframe";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    open: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "open";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    high: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "high";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    low: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "low";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    close: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "close";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    volume: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "volume";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    trades: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "trades";
        tableName: "ohlcv_data";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    vwap: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "vwap";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    source: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "source";
        tableName: "ohlcv_data";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * Individual trades - tick-by-tick trade data
 * For high-frequency trading analysis
 */
export declare const trades: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "trades";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "trades";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "trades";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    id: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "id";
        tableName: "trades";
        dataType: "number";
        columnType: "PgSerial";
        data: number;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    time: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "time";
        tableName: "trades";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    coinId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "coin_id";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    symbol: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "symbol";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    exchangeId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "exchange_id";
        tableName: "trades";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    price: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "price";
        tableName: "trades";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    quantity: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "quantity";
        tableName: "trades";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    side: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "side";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    tradeId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "trade_id";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    orderId: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "order_id";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
    source: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "source";
        tableName: "trades";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
/**
 * Market analytics - aggregated market data
 * Based on CoinGecko global API structure
 */
export declare const marketAnalytics: import("drizzle-orm/pg-core").PgTableWithColumns<{
  name: "market_analytics";
  schema: undefined;
  columns: {
    createdAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "created_at";
        tableName: "market_analytics";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "updated_at";
        tableName: "market_analytics";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    time: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "time";
        tableName: "market_analytics";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    totalMarketCap: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "total_market_cap";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    totalVolume: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "total_volume";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    btcDominance: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "btc_dominance";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    ethDominance: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "eth_dominance";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    defiMarketCap: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "defi_market_cap";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    nftVolume: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "nft_volume";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgNumeric";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    activeCryptocurrencies: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "active_cryptocurrencies";
        tableName: "market_analytics";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    activeExchanges: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "active_exchanges";
        tableName: "market_analytics";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    fearGreedIndex: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "fear_greed_index";
        tableName: "market_analytics";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      {},
      {}
    >;
    source: import("drizzle-orm/pg-core").PgColumn<
      {
        name: "source";
        tableName: "market_analytics";
        dataType: "string";
        columnType: "PgVarchar";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      {},
      {}
    >;
  };
  dialect: "pg";
}>;
export type Currency = typeof currencies.$inferSelect;
export type TradingPair = typeof tradingPairs.$inferSelect;
export type Exchange = typeof exchanges.$inferSelect;
export type CryptoPrice = typeof cryptoPrices.$inferSelect;
export type OHLCVData = typeof ohlcvData.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type MarketAnalytics = typeof marketAnalytics.$inferSelect;
export type CurrencyInsert = typeof currencies.$inferInsert;
export type TradingPairInsert = typeof tradingPairs.$inferInsert;
export type ExchangeInsert = typeof exchanges.$inferInsert;
export type CryptoPriceInsert = typeof cryptoPrices.$inferInsert;
export type OHLCVDataInsert = typeof ohlcvData.$inferInsert;
export type TradeInsert = typeof trades.$inferInsert;
export type MarketAnalyticsInsert = typeof marketAnalytics.$inferInsert;
export declare const schema: {
  currencies: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "currencies";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "currencies";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "currencies";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      id: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "id";
          tableName: "currencies";
          dataType: "number";
          columnType: "PgSerial";
          data: number;
          driverParam: number;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      code: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "code";
          tableName: "currencies";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      name: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "name";
          tableName: "currencies";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      isActive: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "is_active";
          tableName: "currencies";
          dataType: "boolean";
          columnType: "PgBoolean";
          data: boolean;
          driverParam: boolean;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      isFiat: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "is_fiat";
          tableName: "currencies";
          dataType: "boolean";
          columnType: "PgBoolean";
          data: boolean;
          driverParam: boolean;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      decimals: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "decimals";
          tableName: "currencies";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  tradingPairs: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "trading_pairs";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "trading_pairs";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "trading_pairs";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      id: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "id";
          tableName: "trading_pairs";
          dataType: "number";
          columnType: "PgSerial";
          data: number;
          driverParam: number;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      symbol: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "symbol";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      baseAsset: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "base_asset";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      quoteAsset: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "quote_asset";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      baseCurrencyId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "base_currency_id";
          tableName: "trading_pairs";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      quoteCurrencyId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "quote_currency_id";
          tableName: "trading_pairs";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      isActive: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "is_active";
          tableName: "trading_pairs";
          dataType: "boolean";
          columnType: "PgBoolean";
          data: boolean;
          driverParam: boolean;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      minTradeSize: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "min_trade_size";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      maxTradeSize: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "max_trade_size";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      priceTickSize: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "price_tick_size";
          tableName: "trading_pairs";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  exchanges: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "exchanges";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "exchanges";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "exchanges";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      id: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "id";
          tableName: "exchanges";
          dataType: "number";
          columnType: "PgSerial";
          data: number;
          driverParam: number;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      name: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "name";
          tableName: "exchanges";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      displayName: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "display_name";
          tableName: "exchanges";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      isActive: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "is_active";
          tableName: "exchanges";
          dataType: "boolean";
          columnType: "PgBoolean";
          data: boolean;
          driverParam: boolean;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      apiUrl: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "api_url";
          tableName: "exchanges";
          dataType: "string";
          columnType: "PgText";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      websocketUrl: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "websocket_url";
          tableName: "exchanges";
          dataType: "string";
          columnType: "PgText";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  cryptoPrices: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "crypto_prices";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "crypto_prices";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "crypto_prices";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      time: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "time";
          tableName: "crypto_prices";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      coinId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "coin_id";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      symbol: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "symbol";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      exchangeId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "exchange_id";
          tableName: "crypto_prices";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      usdPrice: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "usd_price";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      btcPrice: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "btc_price";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      ethPrice: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "eth_price";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      marketCap: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "market_cap";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      volume24h: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "volume_24h";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      change24h: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "change_24h";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      change7d: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "change_7d";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      lastUpdated: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "last_updated";
          tableName: "crypto_prices";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      source: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "source";
          tableName: "crypto_prices";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: true;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  ohlcvData: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "ohlcv_data";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "ohlcv_data";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "ohlcv_data";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      time: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "time";
          tableName: "ohlcv_data";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      coinId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "coin_id";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      symbol: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "symbol";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      exchangeId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "exchange_id";
          tableName: "ohlcv_data";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      timeframe: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "timeframe";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      open: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "open";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      high: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "high";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      low: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "low";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      close: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "close";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      volume: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "volume";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      trades: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "trades";
          tableName: "ohlcv_data";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      vwap: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "vwap";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      source: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "source";
          tableName: "ohlcv_data";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: true;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  trades: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "trades";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "trades";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "trades";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      id: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "id";
          tableName: "trades";
          dataType: "number";
          columnType: "PgSerial";
          data: number;
          driverParam: number;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      time: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "time";
          tableName: "trades";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      coinId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "coin_id";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      symbol: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "symbol";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      exchangeId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "exchange_id";
          tableName: "trades";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      price: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "price";
          tableName: "trades";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      quantity: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "quantity";
          tableName: "trades";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      side: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "side";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      tradeId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "trade_id";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      orderId: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "order_id";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
      source: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "source";
          tableName: "trades";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: true;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  marketAnalytics: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "market_analytics";
    schema: undefined;
    columns: {
      createdAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "created_at";
          tableName: "market_analytics";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      updatedAt: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "updated_at";
          tableName: "market_analytics";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      time: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "time";
          tableName: "market_analytics";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      totalMarketCap: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "total_market_cap";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      totalVolume: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "total_volume";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      btcDominance: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "btc_dominance";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      ethDominance: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "eth_dominance";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      defiMarketCap: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "defi_market_cap";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      nftVolume: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "nft_volume";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgNumeric";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      activeCryptocurrencies: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "active_cryptocurrencies";
          tableName: "market_analytics";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      activeExchanges: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "active_exchanges";
          tableName: "market_analytics";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      fearGreedIndex: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "fear_greed_index";
          tableName: "market_analytics";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: false;
          hasDefault: false;
          enumValues: undefined;
          baseColumn: never;
        },
        {},
        {}
      >;
      source: import("drizzle-orm/pg-core").PgColumn<
        {
          name: "source";
          tableName: "market_analytics";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: true;
          enumValues: [string, ...string[]];
          baseColumn: never;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
};
