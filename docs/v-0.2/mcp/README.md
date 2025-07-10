# MCP Server Integration Documentation

## Overview

This directory contains comprehensive usage guides for Model Context Protocol (MCP) servers integrated with the QiCore Data Platform. Each server provides specialized financial market data through standardized MCP tools.

## Available MCP Servers

### [CoinGecko MCP Server](./coingecko-mcp-server.md)
- **Focus**: Cryptocurrency market data
- **Coverage**: 15,000+ cryptocurrencies, 1,000+ exchanges
- **Authentication**: No API key required (public server)
- **Real-time**: ✅ Prices, market caps, trading volumes
- **Historical**: ⚠️ Limited OHLC data
- **Status**: Production Ready ✅

### [TwelveData MCP Server](./twelvedata-mcp-server.md)
- **Focus**: Multi-asset financial data
- **Coverage**: Stocks, Forex, Crypto, Commodities, ETFs, Indices
- **Authentication**: API key required
- **Real-time**: ✅ All asset classes
- **Historical**: ✅ Comprehensive OHLCV data
- **Status**: Production Ready ✅

## Quick Comparison

| Feature | CoinGecko | TwelveData |
|---------|-----------|------------|
| **Asset Classes** | Crypto only | Multi-asset |
| **API Key** | Not required | Required |
| **Rate Limits** | Public limits | Plan-based |
| **Real-time Data** | ✅ | ✅ |
| **Historical Data** | Limited | Comprehensive |
| **Level1 Data** | ❌ | ✅ |
| **Global Exchanges** | 1,000+ crypto | 70+ traditional |
| **Reliability** | 99.9%+ | 99.95% SLA |

## Architecture Integration

### QiCore Actor Pattern

```typescript
// Layer 1: DSL interfaces and base workflows
import { BaseReader } from "@qi/abstract/readers/BaseReader";

// Layer 2: MCP-specific implementations  
import { CoinGeckoMCPReader } from "@qi/dp/market/crypto/sources/CoinGeckoMCPReader";
import { TwelveDataMCPReader } from "@qi/dp/market/crypto/sources/TwelveDataMCPReader";

// Create readers for different use cases
const cryptoReader = new CoinGeckoMCPReader({ /* config */ });
const multiAssetReader = new TwelveDataMCPReader({ /* config */ });
```

### Plugin Architecture Benefits

1. **Zero Code Duplication**: DSL methods inherited from BaseReader
2. **Consistent Interface**: All readers implement MarketDataReadingDSL
3. **Easy Integration**: MCP clients injected into actor constructors
4. **Error Handling**: Unified Result<T> pattern throughout
5. **Type Safety**: Complete TypeScript support

## Common Usage Patterns

### Real-time Price Monitoring

```typescript
// Bitcoin price from CoinGecko
const bitcoinSymbol = MarketSymbol.create("bitcoin", "Bitcoin", "crypto", "usd", InstrumentType.CASH);
const btcPrice = await cryptoReader.readPrice(bitcoinSymbol, context);

// Apple stock from TwelveData
const appleSymbol = MarketSymbol.create("AAPL", "Apple Inc", "stocks", "USD", InstrumentType.CASH);
const aaplPrice = await stockReader.readPrice(appleSymbol, context);
```

### Historical Data Analysis

```typescript
const interval = createTimeInterval(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  new Date(Date.now() - 24 * 60 * 60 * 1000)      // 1 day ago
);

// Historical OHLCV data
const ohlcvResult = await multiAssetReader.readOHLCV(symbol, context, interval);
```

### Multi-source Data Aggregation

```typescript
// Combine data from multiple sources
const [coingeckoPrice, twelvedataPrice] = await Promise.allSettled([
  cryptoReader.readPrice(bitcoinSymbol, cryptoContext),
  cryptoTwelveReader.readPrice(btcTwelveSymbol, cryptoContext)
]);

// Compare and validate prices
if (isSuccess(coingeckoPrice) && isSuccess(twelvedataPrice)) {
  const price1 = getData(coingeckoPrice).price;
  const price2 = getData(twelvedataPrice).price;
  const spread = Math.abs(price1 - price2);
  console.log(`Price spread: $${spread}`);
}
```

## Error Handling Strategies

### Graceful Degradation

```typescript
async function getRobustPrice(symbol: MarketSymbol): Promise<Result<Price>> {
  // Try primary source first
  const primaryResult = await primaryReader.readPrice(symbol, context);
  if (isSuccess(primaryResult)) {
    return primaryResult;
  }

  // Fallback to secondary source
  console.warn(`Primary source failed: ${getError(primaryResult)?.message}`);
  const secondaryResult = await secondaryReader.readPrice(symbol, context);
  
  if (isSuccess(secondaryResult)) {
    console.log("Using fallback data source");
    return secondaryResult;
  }

  // Both sources failed
  return failure(createQiError(
    "ALL_SOURCES_FAILED", 
    "No data available from any source",
    "NETWORK"
  ));
}
```

### Rate Limit Management

```typescript
class RateLimitedReader {
  private lastCall = 0;
  private minInterval = 1000; // 1 second between calls

  async readPrice(symbol: MarketSymbol, context: MarketContext): Promise<Result<Price>> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
    return this.reader.readPrice(symbol, context);
  }
}
```

## Testing Strategy

### Real Integration Tests

All MCP servers are tested with real connections:

```bash
# Test CoinGecko integration
bun test lib/tests/sources/coingecko-mcp-reader.test.ts

# Test TwelveData integration  
bun test lib/tests/sources/twelve-data-mcp-reader.test.ts
```

### Test Coverage

- ✅ Real server connections
- ✅ Actual API responses
- ✅ Error condition handling
- ✅ DSL interface compliance
- ✅ Symbol format validation
- ✅ Asset class restrictions
- ✅ Time interval validation

## Production Deployment

### Environment Configuration

```bash
# Required for TwelveData
export TWELVE_DATA_API_KEY=your_api_key_here

# Optional debug settings
export MCP_DEBUG=true
export LOG_LEVEL=info
```

### Monitoring

```typescript
// Connection health checks
async function healthCheck() {
  try {
    const testSymbol = MarketSymbol.create("bitcoin", "Bitcoin", "crypto", "usd", InstrumentType.CASH);
    const result = await reader.readPrice(testSymbol, context);
    return isSuccess(result) ? "healthy" : "degraded";
  } catch (error) {
    return "unhealthy";
  }
}

// Performance monitoring
const startTime = Date.now();
const result = await reader.readPrice(symbol, context);
const latency = Date.now() - startTime;
console.log(`Request latency: ${latency}ms`);
```

### Scaling Considerations

1. **Connection Pooling**: Reuse MCP connections across requests
2. **Circuit Breakers**: Stop calling failing services temporarily
3. **Caching**: Cache frequently requested data
4. **Load Balancing**: Distribute requests across multiple API keys
5. **Monitoring**: Track latency, error rates, and usage quotas

## Future Roadmap

### Planned Integrations

- **CCXT MCP Server**: Exchange connectivity for trading
- **Alpha Vantage MCP**: Additional fundamental data
- **Polygon.io MCP**: Real-time US market data
- **IEX Cloud MCP**: Alternative US market data

### Enhancements

- **WebSocket Support**: Real-time streaming data
- **Caching Layer**: Redis-based response caching  
- **Data Validation**: Cross-source price validation
- **Metrics Collection**: Prometheus/Grafana integration

## Support and Troubleshooting

### Common Issues

1. **Connection Failures**: Check network connectivity and server status
2. **Authentication Errors**: Verify API keys and permissions
3. **Rate Limiting**: Implement proper rate limiting and retry logic
4. **Symbol Format**: Use correct symbol formats for each provider
5. **Data Availability**: Some data may not be available for all assets

### Getting Help

- **Documentation**: Refer to individual server guides
- **Testing**: Use integration tests to validate setup
- **Debugging**: Enable debug mode for detailed logging
- **Issues**: Report problems with specific error messages and reproduction steps

---

*Last Updated: 2025-07-10*  
*QiCore v0.2 - MCP Integration Complete*