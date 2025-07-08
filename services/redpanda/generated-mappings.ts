// Generated Redpanda Topic Mappings
// Source: lib/src/abstract/dsl/MarketDataTypes.ts
// DO NOT EDIT MANUALLY

function serializeCryptoPriceData(data: CryptoPriceData): RedpandaMessage {
  return {
    key: `${data.coinId}:${data.symbol}`,
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
      attribution: data.attribution,
    }),
    partition: hashCode(data.coinId) % 12,
    timestamp: data.lastUpdated,
  };
}

function serializeCryptoOHLCVData(data: CryptoOHLCVData): RedpandaMessage {
  return {
    key: `${data.coinId}:${data.timeframe}`,
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
      attribution: data.attribution,
    }),
    partition: hashCode(data.coinId + data.timeframe) % 8,
    timestamp: data.timestamp,
  };
}

function serializeMarketAnalytics(data: CryptoMarketAnalytics): RedpandaMessage {
  return {
    key: "global",
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
      attribution: data.attribution,
    }),
    partition: 0,
    timestamp: data.timestamp,
  };
}

function serializeLevel1Data(data: Level1Data): RedpandaMessage {
  return {
    key: `${data.ticker}:${data.market}`,
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
      attribution: data.attribution,
    }),
    partition: hashCode(data.ticker + data.market) % 16,
    timestamp: data.timestamp,
  };
}

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
    attribution: data.attribution,
  };
}

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
    attribution: data.attribution,
  };
}

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
    attribution: data.attribution,
  };
}

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
    attribution: data.attribution,
  };
}

export const TOPIC_MAPPINGS = [
  {
    topicName: "crypto-prices",
    dslType: "CryptoPriceData",
    keyStrategy: "coinId + ':' + symbol",
    partitionStrategy: "hash(coinId) % partitionCount",
    serializeFunction:
      "\nfunction serializeCryptoPriceData(data: CryptoPriceData): RedpandaMessage {\n  return {\n    key: data.coinId + ':' + data.symbol,\n    value: JSON.stringify({\n      coinId: data.coinId,\n      symbol: data.symbol,\n      name: data.name,\n      usdPrice: data.usdPrice,\n      btcPrice: data.btcPrice,\n      ethPrice: data.ethPrice,\n      marketCap: data.marketCap,\n      volume24h: data.volume24h,\n      change24h: data.change24h,\n      change7d: data.change7d,\n      lastUpdated: data.lastUpdated.toISOString(),\n      source: data.source,\n      attribution: data.attribution\n    }),\n    partition: hashCode(data.coinId) % 12,\n    timestamp: data.lastUpdated\n  };\n}",
    deserializeFunction:
      "\nfunction deserializeCryptoPriceData(message: RedpandaMessage): CryptoPriceData {\n  const data = JSON.parse(message.value);\n  return {\n    coinId: data.coinId,\n    symbol: data.symbol,\n    name: data.name,\n    usdPrice: data.usdPrice,\n    btcPrice: data.btcPrice,\n    ethPrice: data.ethPrice,\n    marketCap: data.marketCap,\n    volume24h: data.volume24h,\n    change24h: data.change24h,\n    change7d: data.change7d,\n    lastUpdated: new Date(data.lastUpdated),\n    source: data.source,\n    attribution: data.attribution\n  };\n}",
  },
  {
    topicName: "crypto-ohlcv",
    dslType: "CryptoOHLCVData",
    keyStrategy: "coinId + ':' + timeframe",
    partitionStrategy: "hash(coinId + timeframe) % partitionCount",
    serializeFunction:
      "\nfunction serializeCryptoOHLCVData(data: CryptoOHLCVData): RedpandaMessage {\n  return {\n    key: data.coinId + ':' + data.timeframe,\n    value: JSON.stringify({\n      coinId: data.coinId,\n      symbol: data.symbol,\n      open: data.open,\n      high: data.high,\n      low: data.low,\n      close: data.close,\n      volume: data.volume,\n      timestamp: data.timestamp.toISOString(),\n      timeframe: data.timeframe,\n      source: data.source,\n      attribution: data.attribution\n    }),\n    partition: hashCode(data.coinId + data.timeframe) % 8,\n    timestamp: data.timestamp\n  };\n}",
    deserializeFunction:
      "\nfunction deserializeCryptoOHLCVData(message: RedpandaMessage): CryptoOHLCVData {\n  const data = JSON.parse(message.value);\n  return {\n    coinId: data.coinId,\n    symbol: data.symbol,\n    open: data.open,\n    high: data.high,\n    low: data.low,\n    close: data.close,\n    volume: data.volume,\n    timestamp: new Date(data.timestamp),\n    timeframe: data.timeframe,\n    source: data.source,\n    attribution: data.attribution\n  };\n}",
  },
  {
    topicName: "market-analytics",
    dslType: "CryptoMarketAnalytics",
    keyStrategy: "'global'",
    partitionStrategy: "0",
    serializeFunction:
      "\nfunction serializeMarketAnalytics(data: CryptoMarketAnalytics): RedpandaMessage {\n  return {\n    key: 'global',\n    value: JSON.stringify({\n      totalMarketCap: data.totalMarketCap,\n      totalVolume: data.totalVolume,\n      btcDominance: data.btcDominance,\n      ethDominance: data.ethDominance,\n      activeCryptocurrencies: data.activeCryptocurrencies,\n      markets: data.markets,\n      marketCapChange24h: data.marketCapChange24h,\n      timestamp: data.timestamp.toISOString(),\n      source: data.source,\n      attribution: data.attribution\n    }),\n    partition: 0,\n    timestamp: data.timestamp\n  };\n}",
    deserializeFunction:
      "\nfunction deserializeMarketAnalytics(message: RedpandaMessage): CryptoMarketAnalytics {\n  const data = JSON.parse(message.value);\n  return {\n    totalMarketCap: data.totalMarketCap,\n    totalVolume: data.totalVolume,\n    btcDominance: data.btcDominance,\n    ethDominance: data.ethDominance,\n    activeCryptocurrencies: data.activeCryptocurrencies,\n    markets: data.markets,\n    marketCapChange24h: data.marketCapChange24h,\n    timestamp: new Date(data.timestamp),\n    source: data.source,\n    attribution: data.attribution\n  };\n}",
  },
  {
    topicName: "level1-data",
    dslType: "Level1Data",
    keyStrategy: "ticker + ':' + market",
    partitionStrategy: "hash(ticker + market) % partitionCount",
    serializeFunction:
      "\nfunction serializeLevel1Data(data: Level1Data): RedpandaMessage {\n  return {\n    key: data.ticker + ':' + data.market,\n    value: JSON.stringify({\n      ticker: data.ticker,\n      bestBid: data.bestBid,\n      bestAsk: data.bestAsk,\n      spread: data.spread,\n      spreadPercent: data.spreadPercent,\n      exchange: data.exchange,\n      market: data.market,\n      timestamp: data.timestamp.toISOString(),\n      source: data.source,\n      attribution: data.attribution\n    }),\n    partition: hashCode(data.ticker + data.market) % 16,\n    timestamp: data.timestamp\n  };\n}",
    deserializeFunction:
      "\nfunction deserializeLevel1Data(message: RedpandaMessage): Level1Data {\n  const data = JSON.parse(message.value);\n  return {\n    ticker: data.ticker,\n    bestBid: data.bestBid,\n    bestAsk: data.bestAsk,\n    spread: data.spread,\n    spreadPercent: data.spreadPercent,\n    exchange: data.exchange,\n    market: data.market,\n    timestamp: new Date(data.timestamp),\n    source: data.source,\n    attribution: data.attribution\n  };\n}",
  },
];
