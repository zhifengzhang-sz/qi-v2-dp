# MCP (Model Context Protocol) Integration

This directory contains documentation for MCP server integrations and recommendations for market data providers.

## 🎯 **Recommended MCP Servers for Market Data**

Based on comprehensive research and testing, here are the production-ready MCP servers for financial market data:

### **For Cryptocurrency Markets**

#### **1. Twelve Data MCP Server** ⭐⭐⭐⭐⭐ (Primary)
- **Provider**: Twelve Data (Official)
- **Downloads**: 20.3k weekly
- **Coverage**: 4,800+ crypto pairs
- **Features**:
  - Real-time and historical OHLCV data
  - WebSocket streaming (ultra-low latency ~170ms)
  - Production-grade reliability (99.95% SLA)
  - Official MCP protocol support
  - Level1 bid/ask data available
- **URL**: `https://mcp.twelvedata.com` (requires API key)
- **Pricing**: Free tier (800 requests/day), Paid plans from $12/month

#### **2. CCXT MCP Server** ⭐⭐⭐⭐ (Complementary)
- **Provider**: Community (Multiple implementations)
- **Downloads**: 3.4k weekly (most popular variant)
- **Coverage**: 100+ cryptocurrency exchanges
- **Features**:
  - **Real Level1 order book data**
  - Direct exchange connectivity
  - Trading capabilities
  - Unified API across exchanges (Binance, Coinbase, Kraken, etc.)
- **Repository**: Multiple community implementations available
- **Cost**: Free (open source) + exchange API fees

### **For Stock Markets**

#### **Twelve Data MCP Server** ⭐⭐⭐⭐⭐ (Comprehensive)
- **Coverage**: 160,000+ stock symbols globally
- **Features**:
  - Real-time Level1 data (bid/ask)
  - Comprehensive OHLCV data
  - Global coverage (US, EU, APAC, etc.)
  - ETFs, indices, commodities
  - Fundamentals and corporate actions
- **Same endpoint as crypto**: `https://mcp.twelvedata.com`

### **Enterprise Options**

#### **CoinAPI MCP Server** ⭐⭐⭐⭐⭐
- **Provider**: CoinAPI (Official)
- **Coverage**: 380+ crypto exchanges
- **Features**:
  - Enterprise-grade infrastructure
  - Real-time order book depth
  - Official MCP protocol support
- **URL**: `https://mcp.md.coinapi.io/mcp`
- **Pricing**: Enterprise pricing

## 🚫 **Not Recommended**

### **CoinGecko MCP Server** ❌
- **Issues**:
  - Network connectivity problems
  - Limited to aggregated data only
  - No real Level1 bid/ask data
  - Unreliable MCP endpoint
- **Status**: Not suitable for production use

## 📋 **Implementation Strategy**

### **Recommended Architecture**

```typescript
// Crypto Data Stack
const cryptoReaderTwelveData = createTwelveDataMCPReader({
  name: "crypto-twelve-data",
  apiKey: "YOUR_TWELVE_DATA_KEY",
  assetClass: "crypto"
});

const cryptoReaderCCXT = createCCXTMCPReader({
  name: "crypto-ccxt",
  exchange: "binance",
  apiKey: "YOUR_EXCHANGE_API_KEY"
});

// Stock Data Stack
const stockReader = createTwelveDataMCPReader({
  name: "stock-twelve-data",
  apiKey: "YOUR_TWELVE_DATA_KEY",
  assetClass: "stocks"
});
```

### **Use Case Mapping**

| Data Need | Crypto Solution | Stock Solution |
|-----------|----------------|----------------|
| **Price Data** | Twelve Data | Twelve Data |
| **OHLCV Candles** | Twelve Data | Twelve Data |
| **Level1 Bid/Ask** | CCXT | Twelve Data |
| **Order Book Depth** | CCXT | Twelve Data |
| **Real-time Streaming** | Twelve Data | Twelve Data |
| **Historical Analysis** | Twelve Data | Twelve Data |
| **Trading Execution** | CCXT | Twelve Data |

## 🔧 **Configuration Examples**

### **Twelve Data Configuration**
```json
{
  "name": "twelve-data-mcp",
  "url": "https://mcp.twelvedata.com",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  },
  "capabilities": {
    "price": true,
    "ohlcv": true,
    "level1": true,
    "streaming": true
  }
}
```

### **CCXT Configuration**
```json
{
  "name": "ccxt-binance-mcp",
  "exchange": "binance",
  "config": {
    "apiKey": "YOUR_BINANCE_API_KEY",
    "secret": "YOUR_BINANCE_SECRET",
    "sandbox": false
  },
  "capabilities": {
    "orderbook": true,
    "trading": true,
    "level1": true
  }
}
```

## 📊 **Performance Comparison**

| MCP Server | Latency | Uptime | Coverage | Level1 Data |
|------------|---------|--------|----------|-------------|
| **Twelve Data** | ~170ms | 99.95% | Global Markets | ✅ Real |
| **CCXT** | Exchange-dependent | 99%+ | 100+ Crypto Exchanges | ✅ Real |
| **CoinAPI** | <100ms | 99.9% | 380+ Crypto Exchanges | ✅ Real |
| **CoinGecko** | Variable | Unknown | Aggregated Only | ❌ Fake |

## 🔗 **Related Documentation**

- [Aiven MCP Server](./aiven-mcp-server.md) - Database integration
- [Azure PostgreSQL MCP](./azure-postgresql-mcp.md) - Cloud database
- [Twelve Data MCP](./twelve-data-mcp.md) - Detailed implementation guide

## 📝 **Migration Notes**

When migrating from CoinGecko to recommended servers:

1. **Replace fake Level1 data** with real bid/ask from CCXT or Twelve Data
2. **Update error handling** to properly handle unsupported operations
3. **Add proper capability reporting** in status methods
4. **Implement rate limiting** according to provider specifications
5. **Test thoroughly** with real market conditions

## 🎯 **Next Steps**

1. Obtain API keys for Twelve Data (free tier available)
2. Implement Twelve Data MCP reader
3. Add CCXT MCP reader for order book data
4. Replace CoinGecko implementation
5. Update tests to reflect real data behavior