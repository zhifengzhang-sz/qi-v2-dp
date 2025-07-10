# CCXT MCP Server Integration Guide

## Overview

The CCXT MCP Server provides access to 100+ cryptocurrency exchanges through a unified interface. It supports real-time market data, order book information, and OHLCV historical data.

## Server Information

- **Package**: `@ccxt/ccxt-mcp-server`
- **Protocol**: MCP (Model Context Protocol)
- **Transport**: SSE (Server-Sent Events)
- **Asset Classes**: Cryptocurrency
- **Exchanges**: 100+ including Binance, Coinbase, Kraken, OKX, etc.

## Installation

### Global Installation
```bash
npm install -g @ccxt/ccxt-mcp-server
# or
bun add -g @ccxt/ccxt-mcp-server
```

### Local Development
```bash
npm install @ccxt/ccxt-mcp-server
# or
bun add @ccxt/ccxt-mcp-server
```

## Server Setup

### 1. Start the MCP Server
```bash
# Basic server (default port 3000)
ccxt-mcp-server

# Custom port
ccxt-mcp-server --port 8080

# With specific exchanges
ccxt-mcp-server --exchanges binance,coinbase,kraken
```

### 2. Configuration File (Optional)
Create `ccxt-mcp-config.json`:
```json
{
  "port": 3000,
  "exchanges": ["binance", "coinbase", "kraken", "okx"],
  "sandbox": false,
  "debug": false,
  "cors": {
    "enabled": true,
    "origins": ["*"]
  }
}
```

## Available Tools

The CCXT MCP Server provides these tools:

### `get-ticker`
Get current ticker information for a symbol.

**Parameters:**
- `exchange` (string): Exchange name (e.g., "binance")
- `symbol` (string): Trading pair symbol (e.g., "BTC/USDT")

**Response:**
```json
{
  "last": 97500.25,
  "timestamp": 1678901234567,
  "baseVolume": 1250.5,
  "bid": 97495.0,
  "ask": 97505.0
}
```

### `get-orderbook`
Get order book data for a symbol.

**Parameters:**
- `exchange` (string): Exchange name
- `symbol` (string): Trading pair symbol

**Response:**
```json
{
  "bids": [[97495.0, 0.5], [97490.0, 1.2]],
  "asks": [[97505.0, 0.3], [97510.0, 0.8]],
  "timestamp": 1678901234567
}
```

### `get-ohlcv`
Get OHLCV (candlestick) data for a symbol.

**Parameters:**
- `exchange` (string): Exchange name
- `symbol` (string): Trading pair symbol
- `timeframe` (string): Timeframe (e.g., "1d", "1h", "5m")
- `since` (number, optional): Start timestamp
- `limit` (number, optional): Number of candles

**Response:**
```json
[
  [1678901234567, 96500, 98000, 96000, 97500, 2500]
]
```

## QiCore Integration

### Basic Setup
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CCXTMCPReader } from "@qi/dp/market/crypto/sources";

// Connect to CCXT MCP server
const mcpClient = new Client({
  name: "qi-ccxt-client",
  version: "1.0.0"
}, { capabilities: { tools: {} } });

const transport = new SSEClientTransport(new URL("http://localhost:3000/sse"));
await mcpClient.connect(transport);

// Create reader
const reader = new CCXTMCPReader({
  name: "ccxt-binance",
  exchange: "binance",
  mcpClient: mcpClient
});
```

### Reading Market Data
```typescript
import { MarketSymbol, MarketContext, Exchange, InstrumentType } from "@qi/core";

// Set up market context
const binance = Exchange.create("binance", "Binance", "Global", "centralized");
const btcSymbol = MarketSymbol.create("BTC", "Bitcoin", "crypto", "USDT", InstrumentType.CASH);
const context = MarketContext.create(binance, btcSymbol);

// Read current price
const priceResult = await reader.readPrice(btcSymbol, context);
if (isSuccess(priceResult)) {
  const price = getData(priceResult);
  console.log(`BTC/USDT: $${price.price}`);
}

// Read order book (Level1)
const level1Result = await reader.readLevel1(btcSymbol, context);
if (isSuccess(level1Result)) {
  const level1 = getData(level1Result);
  console.log(`Bid: $${level1.bidPrice}, Ask: $${level1.askPrice}`);
}

// Read OHLCV data
const ohlcvResult = await reader.readOHLCV(btcSymbol, context);
if (isSuccess(ohlcvResult)) {
  const ohlcv = getData(ohlcvResult);
  console.log(`OHLC: ${ohlcv.open}/${ohlcv.high}/${ohlcv.low}/${ohlcv.close}`);
}
```

### With API Credentials (Optional)
```typescript
const reader = new CCXTMCPReader({
  name: "ccxt-binance-authenticated",
  exchange: "binance",
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET,
  sandbox: false, // Set to true for testing
  mcpClient: mcpClient
});
```

## Supported Exchanges

### Major Exchanges
- **binance**: Binance Global
- **coinbase**: Coinbase Pro
- **kraken**: Kraken
- **okx**: OKX (formerly OKEx)
- **huobi**: Huobi Global
- **gate**: Gate.io
- **kucoin**: KuCoin
- **bybit**: Bybit

### Regional Exchanges
- **bitfinex**: Bitfinex
- **gemini**: Gemini
- **bitstamp**: Bitstamp
- **poloniex**: Poloniex
- **bittrex**: Bittrex

### And 85+ More
The CCXT library supports over 100 exchanges. Check the [CCXT documentation](https://docs.ccxt.com/en/latest/manual.html#exchanges) for the complete list.

## Error Handling

```typescript
const result = await reader.readPrice(symbol, context);
if (isFailure(result)) {
  const error = getError(result);
  switch (error.code) {
    case "INVALID_RESPONSE":
      console.log("Server connection issue");
      break;
    case "NO_DATA":
      console.log("Symbol not found or no data available");
      break;
    case "FETCH_ERROR":
      console.log("Network or exchange error");
      break;
  }
}
```

## Production Deployment

### Docker Setup
```dockerfile
FROM node:18-alpine
RUN npm install -g @ccxt/ccxt-mcp-server
EXPOSE 3000
CMD ["ccxt-mcp-server", "--port", "3000"]
```

### Environment Variables
```bash
CCXT_PORT=3000
CCXT_EXCHANGES=binance,coinbase,kraken
CCXT_DEBUG=false
CCXT_CORS_ENABLED=true
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Limitations

1. **Rate Limits**: Each exchange has its own rate limits
2. **Market Hours**: Some exchanges have trading hours restrictions
3. **Symbol Formats**: Each exchange may use different symbol formats
4. **API Keys**: Some data requires authenticated access
5. **WebSocket**: Currently only REST API support (WebSocket planned)

## Troubleshooting

### Connection Issues
```typescript
// Check server status
try {
  const response = await fetch("http://localhost:3000/health");
  console.log("Server status:", response.status);
} catch (error) {
  console.log("Server not accessible:", error);
}
```

### Exchange-Specific Issues
```typescript
// Test exchange connectivity
const result = await reader.readPrice(testSymbol, context);
if (isFailure(result)) {
  console.log("Exchange issue:", getError(result).message);
}
```

### Symbol Format Issues
```typescript
// Different exchanges use different formats:
// Binance: "BTC/USDT"
// Coinbase: "BTC-USD"
// Kraken: "XBTUSD"

// Use exchange-specific symbol mapping
const symbolMap = {
  binance: "BTC/USDT",
  coinbase: "BTC-USD", 
  kraken: "XBTUSD"
};
```

## Performance Tips

1. **Connection Pooling**: Reuse MCP client connections
2. **Batch Requests**: Group multiple symbol requests when possible
3. **Caching**: Cache frequently requested data
4. **Exchange Selection**: Choose exchanges with better API performance
5. **Error Recovery**: Implement fallback to alternative exchanges

## Version Compatibility

- **QiCore**: v0.2.2+
- **CCXT MCP Server**: v1.0.0+
- **Node.js**: 16+
- **Bun**: 1.0+

## Next Steps

1. **Set up the MCP server**: `npm install -g @ccxt/ccxt-mcp-server`
2. **Start the server**: `ccxt-mcp-server`
3. **Update your code**: Use the examples above
4. **Test with multiple exchanges**: Try different exchange configurations
5. **Deploy to production**: Use Docker or cloud deployment