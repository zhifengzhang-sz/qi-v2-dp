# Alpha Vantage MCP Server Integration Guide

## Overview

The Alpha Vantage MCP Server provides access to NASDAQ-licensed US equity market data, ETFs, and basic forex data. It offers real-time quotes, historical data, and fundamental information for stock market analysis.

## Server Information

- **Package**: `@alphavantage/mcp-server`
- **Protocol**: MCP (Model Context Protocol)
- **Transport**: SSE (Server-Sent Events)
- **Asset Classes**: US Equities, ETFs, Basic Forex
- **Data**: Real-time quotes, historical OHLCV, company fundamentals

## Installation

### Global Installation
```bash
npm install -g @alphavantage/mcp-server
# or
bun add -g @alphavantage/mcp-server
```

### Local Development
```bash
npm install @alphavantage/mcp-server
# or
bun add @alphavantage/mcp-server
```

## API Key Setup

Alpha Vantage requires a free API key from [alphavantage.co](https://www.alphavantage.co/support/#api-key).

### Get Your API Key
1. Visit https://www.alphavantage.co/support/#api-key
2. Fill out the form (free tier available)
3. Copy your API key
4. Set environment variable: `ALPHA_VANTAGE_API_KEY=your_key_here`

### Free Tier Limits
- **Requests**: 25 requests per day
- **Rate**: 5 API requests per minute
- **Data**: Real-time and historical data
- **Symbols**: All US equities and ETFs

### Premium Tiers
- **Basic**: 500 requests/day ($49.99/month)
- **Pro**: 1,200 requests/day ($149.99/month)
- **Premium**: 5,000 requests/day ($499.99/month)

## Server Setup

### 1. Start the MCP Server
```bash
# With environment variable
export ALPHA_VANTAGE_API_KEY=your_key_here
alpha-vantage-mcp-server

# Custom port
alpha-vantage-mcp-server --port 8080

# With inline API key
alpha-vantage-mcp-server --api-key YOUR_API_KEY
```

### 2. Configuration File (Optional)
Create `alpha-vantage-config.json`:
```json
{
  "port": 3000,
  "apiKey": "YOUR_API_KEY",
  "debug": false,
  "timeout": 30000,
  "cors": {
    "enabled": true,
    "origins": ["*"]
  }
}
```

## Available Tools

The Alpha Vantage MCP Server provides these tools:

### `get-stock-quote`
Get real-time quote for a stock symbol.

**Parameters:**
- `symbol` (string): Stock ticker symbol (e.g., "AAPL")
- `apikey` (string): Your Alpha Vantage API key

**Response:**
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "02. open": "194.50",
    "03. high": "196.80",
    "04. low": "194.20",
    "05. price": "195.34",
    "06. volume": "45000000",
    "07. latest trading day": "2025-07-10",
    "08. previous close": "194.80",
    "09. change": "0.54",
    "10. change percent": "0.28%"
  }
}
```

### `get-company-info`
Get company overview and fundamental data.

**Parameters:**
- `symbol` (string): Stock ticker symbol
- `apikey` (string): Your Alpha Vantage API key

**Response:**
```json
{
  "Symbol": "AAPL",
  "Name": "Apple Inc",
  "Description": "Apple Inc. designs, manufactures...",
  "CIK": "320193",
  "Exchange": "NASDAQ",
  "Currency": "USD",
  "Country": "USA",
  "Sector": "TECHNOLOGY",
  "Industry": "Electronic Equipment & Instruments",
  "MarketCapitalization": "3040000000000",
  "EBITDA": "123456000000",
  "PERatio": "28.5",
  "DividendYield": "0.0044"
}
```

### `get-time-series`
Get historical OHLCV data.

**Parameters:**
- `symbol` (string): Stock ticker symbol
- `interval` (string): Time interval ("daily", "weekly", "monthly")
- `apikey` (string): Your Alpha Vantage API key

**Response:**
```json
{
  "Meta Data": {
    "1. Information": "Daily Prices",
    "2. Symbol": "AAPL",
    "3. Last Refreshed": "2025-07-10",
    "4. Output Size": "Compact",
    "5. Time Zone": "US/Eastern"
  },
  "Time Series (Daily)": {
    "2025-07-10": {
      "1. open": "194.50",
      "2. high": "196.80",
      "3. low": "194.20",
      "4. close": "195.34",
      "5. volume": "45000000"
    }
  }
}
```

## QiCore Integration

### Basic Setup
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { AlphaVantageMCPReader } from "@qi/dp/market/stock/sources";

// Connect to Alpha Vantage MCP server
const mcpClient = new Client({
  name: "qi-alphavantage-client",
  version: "1.0.0"
}, { capabilities: { tools: {} } });

const transport = new SSEClientTransport(new URL("http://localhost:3000/sse"));
await mcpClient.connect(transport);

// Create reader
const reader = new AlphaVantageMCPReader({
  name: "alpha-vantage-stocks",
  apiKey: process.env.ALPHA_VANTAGE_API_KEY!,
  mcpClient: mcpClient
});
```

### Reading Stock Data
```typescript
import { MarketSymbol, MarketContext, Exchange, InstrumentType } from "@qi/core";

// Set up market context for stocks
const nasdaq = Exchange.create("nasdaq", "NASDAQ", "US", "centralized");
const aaplSymbol = MarketSymbol.create("AAPL", "Apple Inc", "equity", "USD", InstrumentType.CASH);
const context = MarketContext.create(nasdaq, aaplSymbol);

// Read current stock price
const priceResult = await reader.readPrice(aaplSymbol, context);
if (isSuccess(priceResult)) {
  const price = getData(priceResult);
  console.log(`AAPL: $${price.price} (Volume: ${price.size.toLocaleString()})`);
}

// Read OHLCV data
const ohlcvResult = await reader.readOHLCV(aaplSymbol, context);
if (isSuccess(ohlcvResult)) {
  const ohlcv = getData(ohlcvResult);
  console.log(`AAPL OHLCV: O:$${ohlcv.open} H:$${ohlcv.high} L:$${ohlcv.low} C:$${ohlcv.close}`);
}

// Historical data with time range
const interval = createTimeInterval(
  new Date('2025-07-01'),
  new Date('2025-07-10')
);
const historicalResult = await reader.readHistoricalPrices(aaplSymbol, context, interval);
if (isSuccess(historicalResult)) {
  const prices = getData(historicalResult);
  console.log(`Retrieved ${prices.length} historical prices`);
}
```

### Error Handling with Rate Limits
```typescript
const result = await reader.readPrice(symbol, context);
if (isFailure(result)) {
  const error = getError(result);
  switch (error.code) {
    case "RATE_LIMIT":
      console.log("API rate limit exceeded. Wait and retry.");
      break;
    case "INVALID_API_KEY":
      console.log("Check your Alpha Vantage API key");
      break;
    case "NO_DATA":
      console.log("Symbol not found or market closed");
      break;
    case "FETCH_ERROR":
      console.log("Network error or API unavailable");
      break;
  }
}
```

## Supported Symbols

### US Equities
- **All NASDAQ stocks**: AAPL, MSFT, GOOGL, AMZN, etc.
- **All NYSE stocks**: IBM, JPM, GE, etc.
- **All AMEX stocks**: SPY, QQQ, IWM, etc.

### ETFs
- **Sector ETFs**: XLK (Technology), XLF (Financial), etc.
- **Index ETFs**: SPY (S&P 500), QQQ (NASDAQ 100), etc.
- **International ETFs**: EFA, EEM, VEA, etc.

### Symbol Format
```typescript
// US stocks use simple ticker symbols
const symbols = [
  "AAPL",  // Apple Inc
  "MSFT",  // Microsoft
  "GOOGL", // Alphabet Class A
  "TSLA",  // Tesla
  "NVDA"   // NVIDIA
];
```

## Data Features

### Real-Time Quotes
- Current price and volume
- Daily high, low, open
- Previous close and change
- Change percentage

### Historical Data
- Daily OHLCV data
- Up to 20 years of history
- Adjusted close prices
- Volume data

### Company Fundamentals
- Market capitalization
- P/E ratio, dividend yield
- Financial metrics
- Company description

### Limitations

#### Data Limitations
1. **No Level1 Data**: Alpha Vantage doesn't provide bid/ask spreads
2. **No Intraday**: Free tier only provides daily data
3. **US Markets Only**: Limited international coverage
4. **No Real-Time**: 15-20 minute delay on free tier

#### API Limitations
1. **Rate Limits**: 5 requests per minute (free tier)
2. **Daily Limits**: 25 requests per day (free tier)
3. **Weekends**: No data updates during market closure
4. **Holidays**: No data on market holidays

## Error Handling Patterns

### Rate Limit Handling
```typescript
class RateLimitedReader {
  private lastRequest = 0;
  private readonly minInterval = 12000; // 12 seconds between requests
  
  async readWithRateLimit(symbol: MarketSymbol, context: MarketContext) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
    return this.reader.readPrice(symbol, context);
  }
}
```

### Retry Logic
```typescript
async function readWithRetry(
  reader: AlphaVantageMCPReader,
  symbol: MarketSymbol,
  context: MarketContext,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await reader.readPrice(symbol, context);
    
    if (isSuccess(result)) {
      return result;
    }
    
    const error = getError(result);
    if (error.code === "RATE_LIMIT" && i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      continue;
    }
    
    return result; // Give up
  }
}
```

## Production Deployment

### Docker Setup
```dockerfile
FROM node:18-alpine
RUN npm install -g @alphavantage/mcp-server
ENV ALPHA_VANTAGE_API_KEY=""
EXPOSE 3000
CMD ["alpha-vantage-mcp-server", "--port", "3000"]
```

### Environment Variables
```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
ALPHA_VANTAGE_PORT=3000
ALPHA_VANTAGE_DEBUG=false
ALPHA_VANTAGE_TIMEOUT=30000
```

### Health Check
```bash
curl "http://localhost:3000/health"
```

## Best Practices

### API Key Security
```typescript
// Never hardcode API keys
const reader = new AlphaVantageMCPReader({
  name: "alpha-vantage-production",
  apiKey: process.env.ALPHA_VANTAGE_API_KEY!, // From environment
  mcpClient: mcpClient
});
```

### Caching Strategy
```typescript
class CachedAlphaVantageReader {
  private cache = new Map();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes
  
  async readPrice(symbol: MarketSymbol, context: MarketContext) {
    const key = `${symbol.ticker}-price`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result;
    }
    
    const result = await this.reader.readPrice(symbol, context);
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }
}
```

### Market Hours Awareness
```typescript
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  
  // NYSE/NASDAQ hours: Monday-Friday, 9:30 AM - 4:00 PM ET
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
}

if (!isMarketOpen()) {
  console.log("Market is closed. Using cached or previous day data.");
}
```

## Troubleshooting

### Common Issues

#### Invalid API Key
```typescript
if (error.message.includes("Invalid API call")) {
  console.log("Check your Alpha Vantage API key");
  console.log("Get a free key at: https://www.alphavantage.co/support/#api-key");
}
```

#### Rate Limit Exceeded
```typescript
if (error.message.includes("rate limit")) {
  console.log("Rate limit exceeded. Free tier: 5 requests/minute");
  console.log("Consider upgrading to premium tier");
}
```

#### Symbol Not Found
```typescript
if (error.message.includes("Invalid symbol")) {
  console.log("Symbol not found. Check ticker symbol spelling");
  console.log("Use US-listed symbols only (NASDAQ, NYSE, AMEX)");
}
```

## Version Compatibility

- **QiCore**: v0.2.2+
- **Alpha Vantage MCP Server**: v1.0.0+
- **Node.js**: 16+
- **Bun**: 1.0+

## Next Steps

1. **Get API Key**: Register at https://www.alphavantage.co/support/#api-key
2. **Install MCP Server**: `npm install -g @alphavantage/mcp-server`
3. **Set Environment**: `export ALPHA_VANTAGE_API_KEY=your_key`
4. **Start Server**: `alpha-vantage-mcp-server`
5. **Test Integration**: Use the examples above
6. **Implement Caching**: For production use with rate limits