# TwelveData MCP Server Usage Guide

## Overview

TwelveData MCP Server provides comprehensive financial market data through the Model Context Protocol (MCP). It covers stocks, forex, cryptocurrencies, commodities, ETFs, and indices across 70+ global exchanges with professional-grade reliability.

## Server Information

- **Official Server URL**: `https://mcp.twelvedata.com/mcp/` *(Requires authentication)*
- **Alternative**: Direct API integration via HTTP calls
- **Authentication**: API key required
- **Data Coverage**: Stocks, Forex, Crypto, Commodities, ETFs, Indices
- **Exchanges**: 70+ global exchanges, 20+ crypto exchanges

## Authentication Setup

### 1. Get API Key
1. Visit [TwelveData Sign Up](https://twelvedata.com/)
2. Create account or log in
3. Navigate to Dashboard
4. Copy your API key

### 2. Environment Setup
```bash
export TWELVE_DATA_API_KEY=your_api_key_here
```

## Available Tools

### 1. `quote`
Get real-time price quotes and basic market data.

**Parameters:**
```typescript
{
  symbol: string,    // Symbol (e.g., "BTC/USD", "AAPL", "EUR/USD")
  apikey: string     // Your API key
}
```

**Response:**
```typescript
{
  symbol: string,
  name: string,
  exchange: string,
  mic_code: string,
  currency: string,
  datetime: string,
  timestamp: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  previous_close: string,
  change: string,
  percent_change: string,
  average_volume: string,
  is_market_open: boolean,
  fifty_two_week: {
    low: string,
    high: string,
    low_change: string,
    high_change: string,
    low_change_percent: string,
    high_change_percent: string,
    range: string
  }
}
```

### 2. `time_series`
Historical OHLCV data with flexible time ranges.

**Parameters:**
```typescript
{
  symbol: string,        // Symbol
  interval: string,      // "1min", "5min", "15min", "30min", "45min", "1h", "2h", "4h", "1day", "1week", "1month"
  start_date?: string,   // YYYY-MM-DD format
  end_date?: string,     // YYYY-MM-DD format
  outputsize?: number,   // Number of data points (max 5000)
  apikey: string        // Your API key
}
```

**Response:**
```typescript
{
  meta: {
    symbol: string,
    interval: string,
    currency: string,
    exchange_timezone: string,
    exchange: string,
    mic_code: string,
    type: string
  },
  values: [
    {
      datetime: string,
      open: string,
      high: string,
      low: string,
      close: string,
      volume: string
    }
  ],
  status: string
}
```

## Implementation Example

### HTTP Integration Approach
Since the official MCP server requires additional authentication setup, we use direct HTTP calls:

```typescript
const mcpClient = {
  callTool: async (args: { name: string; arguments: any }) => {
    const { name, arguments: params } = args;
    const baseUrl = "https://api.twelvedata.com";
    let url = "";
    
    switch (name) {
      case "quote":
        url = `${baseUrl}/price?symbol=${params.symbol}&apikey=${params.apikey}`;
        break;
      case "time_series":
        url = `${baseUrl}/time_series?symbol=${params.symbol}&interval=${params.interval}&start_date=${params.start_date}&end_date=${params.end_date}&apikey=${params.apikey}`;
        break;
      default:
        throw new Error(`Unknown TwelveData tool: ${name}`);
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "error") {
      throw new Error(`TwelveData API Error: ${data.message}`);
    }
    
    return {
      content: [{ text: JSON.stringify(data) }]
    };
  },
};
```

### Getting Stock Price

```typescript
const result = await mcpClient.callTool({
  name: "quote",
  arguments: {
    symbol: "AAPL",
    apikey: process.env.TWELVE_DATA_API_KEY
  }
});

const data = JSON.parse(result.content[0].text);
console.log(`AAPL price: $${data.price}`);
```

### Getting Historical Data

```typescript
const result = await mcpClient.callTool({
  name: "time_series",
  arguments: {
    symbol: "BTC/USD",
    interval: "1day",
    start_date: "2025-07-01",
    end_date: "2025-07-10",
    apikey: process.env.TWELVE_DATA_API_KEY
  }
});

const data = JSON.parse(result.content[0].text);
console.log(`Retrieved ${data.values.length} data points`);
```

## Symbol Format Requirements

### Cryptocurrencies
```typescript
// Correct formats
"BTC/USD"    // Bitcoin vs USD
"ETH/EUR"    // Ethereum vs Euro
"ADA/BTC"    // Cardano vs Bitcoin
```

### Stocks
```typescript
// US Stocks
"AAPL"       // Apple Inc.
"MSFT"       // Microsoft
"GOOGL"      // Alphabet Class A

// International Stocks
"ASML.AS"    // ASML (Amsterdam)
"SAP.DE"     // SAP (Frankfurt)
```

### Forex
```typescript
// Major pairs
"EUR/USD"    // Euro Dollar
"GBP/USD"    // British Pound Dollar
"USD/JPY"    // Dollar Yen

// Exotic pairs
"USD/TRY"    // Dollar Turkish Lira
"EUR/PLN"    // Euro Polish Zloty
```

### Commodities
```typescript
"GOLD"       // Gold
"SILVER"     // Silver
"WTI"        // West Texas Intermediate Oil
"BRENT"      // Brent Crude Oil
```

## Asset Class Support

### ✅ Cryptocurrencies
- 1000+ cryptocurrencies
- Real-time prices
- Historical OHLCV data
- Multiple base currencies

### ✅ Stocks
- NYSE, NASDAQ, global exchanges
- Real-time and delayed data
- Fundamental data available
- Corporate actions

### ✅ Forex
- Major and exotic currency pairs
- Real-time quotes
- Economic calendar integration
- Central bank rates

### ✅ Commodities
- Precious metals
- Energy products
- Agricultural products
- Industrial metals

### ✅ ETFs & Indices
- Major indices (S&P 500, NASDAQ, etc.)
- ETF data
- Sector indices
- Regional indices

## Date Format Specifications

### Required Format
- **Format**: `YYYY-MM-DD`
- **Example**: `"2025-07-10"`
- **Timezone**: Exchange local time (use timezone parameter for specific zones)

### Date Range Parameters
```typescript
{
  start_date: "2025-07-01",  // Inclusive start
  end_date: "2025-07-10",    // Inclusive end
  // Do not include outputsize when using date ranges
}
```

### Current Data Parameters
```typescript
{
  symbol: "AAPL",
  interval: "1day",
  outputsize: 1,  // Get last candle only
  // Do not include start_date/end_date for current data
}
```

## Integration with QiCore

### Multi-Asset Reader Setup

```typescript
import { TwelveDataMCPReader } from "@qi/dp/market/crypto/sources/TwelveDataMCPReader";

// Crypto reader
const cryptoReader = new TwelveDataMCPReader({
  name: "twelvedata-crypto",
  apiKey: process.env.TWELVE_DATA_API_KEY,
  assetClass: "crypto",
  mcpClient: mcpClient
});

// Stock reader  
const stockReader = new TwelveDataMCPReader({
  name: "twelvedata-stocks", 
  apiKey: process.env.TWELVE_DATA_API_KEY,
  assetClass: "stocks",
  mcpClient: mcpClient
});

// Forex reader
const forexReader = new TwelveDataMCPReader({
  name: "twelvedata-forex",
  apiKey: process.env.TWELVE_DATA_API_KEY, 
  assetClass: "forex",
  mcpClient: mcpClient
});
```

### Reading Different Asset Classes

```typescript
// Bitcoin price
const btcSymbol = MarketSymbol.create("BTC", "Bitcoin", "crypto", "USD", InstrumentType.CASH);
const btcPrice = await cryptoReader.readPrice(btcSymbol, cryptoContext);

// Apple stock price  
const aaplSymbol = MarketSymbol.create("AAPL", "Apple Inc", "stocks", "USD", InstrumentType.CASH);
const aaplPrice = await stockReader.readPrice(aaplSymbol, stockContext);

// EUR/USD forex rate
const eurSymbol = MarketSymbol.create("EUR", "Euro", "forex", "USD", InstrumentType.CASH);
const eurRate = await forexReader.readPrice(eurSymbol, forexContext);
```

## Error Handling

### Common API Errors

```typescript
// Invalid symbol
{
  status: "error",
  message: "symbol parameter missing or invalid. Please check if symbol is supported."
}

// Rate limit exceeded
{
  status: "error", 
  message: "You have run out of API credits for the current minute. 10 API credits were used, with the current limit being 8."
}

// Invalid date format
{
  status: "error",
  message: "Error in **start_date** format. Please check the format for correctness according to API Documentation."
}

// Invalid API key
{
  status: "error",
  message: "Invalid API key. Please check your API key."
}
```

### Error Handling Pattern

```typescript
try {
  const result = await mcpClient.callTool({
    name: "quote",
    arguments: { symbol, apikey }
  });
  
  const data = JSON.parse(result.content[0].text);
  
  if (data.status === "error") {
    if (data.message.includes("API credits")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    if (data.message.includes("symbol")) {
      throw new Error("INVALID_SYMBOL");
    }
    throw new Error(`API_ERROR: ${data.message}`);
  }
  
  return data;
} catch (error) {
  // Handle network and parsing errors
  throw new Error(`REQUEST_FAILED: ${error.message}`);
}
```

## Performance Characteristics

### Rate Limits
- **Free Plan**: 8 API calls per minute
- **Basic Plan**: 800 API calls per minute  
- **Standard Plan**: 8,000 API calls per minute
- **Professional Plan**: 80,000 API calls per minute

### Latency
- **Real-time data**: 200-800ms
- **Historical data**: 500-2000ms (depending on range)
- **Bulk requests**: Varies by data volume

### Data Limits
- **Max data points per request**: 5,000
- **Historical data availability**: Varies by asset class and plan
- **Real-time vs delayed**: Depends on exchange and subscription

## Production Considerations

### Advantages
- Comprehensive multi-asset coverage
- Professional-grade reliability (99.95% SLA)
- Real-time and historical data
- Global exchange coverage
- Technical indicators available
- Fundamental data integration

### Plan Requirements
- **Free**: Limited calls, good for testing
- **Basic**: Small applications, hobby projects
- **Standard**: Production applications
- **Professional**: High-volume, enterprise use

### Best Practices

```typescript
// 1. Implement rate limiting
const rateLimiter = new RateLimiter(8, 60000); // 8 calls per minute

// 2. Cache frequently accessed data
const priceCache = new Map();

// 3. Batch requests when possible
const symbols = ["AAPL", "MSFT", "GOOGL"];
// Use multiple parallel requests within rate limits

// 4. Handle errors gracefully
const maxRetries = 3;
const retryDelay = 1000;

// 5. Monitor API usage
console.log(`API calls used: ${response.headers['x-ratelimit-used']}`);
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   ```bash
   # Wait for next minute or upgrade plan
   # Implement exponential backoff
   ```

2. **Invalid Symbol Format**
   ```bash
   # Check symbol format for asset class
   # Crypto: "BTC/USD", Stocks: "AAPL", Forex: "EUR/USD"
   ```

3. **Date Format Errors**
   ```bash
   # Use YYYY-MM-DD format only
   # Don't mix outputsize with date ranges
   ```

4. **Authentication Issues**
   ```bash
   # Verify API key in dashboard
   # Check environment variable loading
   ```

### Debug Mode

```typescript
const reader = new TwelveDataMCPReader({
  name: "debug-reader",
  apiKey: process.env.TWELVE_DATA_API_KEY,
  assetClass: "crypto", 
  debug: true,  // Enable debug logging
  mcpClient: mcpClient
});
```

## Version History

- **2025-07-10**: Updated tool names and date format requirements
- **2025-07-07**: Added multi-asset class support documentation
- **2025-07-05**: Initial implementation with real API integration

---

*Last Updated: 2025-07-10*  
*Status: Production Ready ✅*