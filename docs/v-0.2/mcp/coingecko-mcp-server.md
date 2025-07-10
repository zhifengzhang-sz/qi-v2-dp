# CoinGecko MCP Server Usage Guide

## Overview

CoinGecko MCP Server provides real-time cryptocurrency market data through the Model Context Protocol (MCP). This is the official CoinGecko MCP server that connects directly to their API without requiring an API key for basic usage.

## Server Information

- **Official Server URL**: `https://mcp.api.coingecko.com/sse`
- **Protocol**: Server-Sent Events (SSE)
- **Authentication**: No API key required for public server
- **Data Coverage**: 15,000+ cryptocurrencies across 1,000+ exchanges

## Available Tools

### 1. `get_coins_markets`
Retrieves comprehensive market data for cryptocurrencies.

**Parameters:**
```typescript
{
  ids: string,           // Coin ID (e.g., "bitcoin", "ethereum")
  vs_currency: string,   // Currency (e.g., "usd", "eur")
  order: string,         // Sort order ("market_cap_desc")
  per_page: number,      // Results per page (1-250)
  page: number          // Page number
}
```

**Response:**
```typescript
[{
  id: string,
  symbol: string,
  name: string,
  current_price: number,
  market_cap: number,
  market_cap_rank: number,
  fully_diluted_valuation: number,
  total_volume: number,
  high_24h: number,
  low_24h: number,
  price_change_24h: number,
  price_change_percentage_24h: number,
  market_cap_change_24h: number,
  market_cap_change_percentage_24h: number,
  circulating_supply: number,
  total_supply: number,
  max_supply: number,
  ath: number,
  ath_change_percentage: number,
  ath_date: string,
  atl: number,
  atl_change_percentage: number,
  atl_date: string,
  last_updated: string
}]
```

### 2. `get_simple_price`
Simple price lookup for multiple coins.

**Parameters:**
```typescript
{
  ids: string,              // Comma-separated coin IDs
  vs_currencies: string     // Comma-separated currencies
}
```

**Response:**
```typescript
{
  [coinId]: {
    [currency]: number
  }
}
```

### 3. `get_coins_id_ohlc` *(In Testing)*
OHLC (Open, High, Low, Close) data for historical analysis.

**Parameters:**
```typescript
{
  id: string,           // Coin ID
  vs_currency: string,  // Currency
  days: number         // Number of days back
}
```

## Implementation Example

### Basic Setup

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Create MCP client
const mcpClient = new Client(
  { name: "coingecko-integration", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Connect to CoinGecko MCP server
const transport = new SSEClientTransport(
  new URL("https://mcp.api.coingecko.com/sse")
);

await mcpClient.connect(transport);
```

### Getting Bitcoin Price

```typescript
const result = await mcpClient.callTool({
  name: "get_coins_markets",
  arguments: {
    ids: "bitcoin",
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: 1,
    page: 1,
  },
});

const data = JSON.parse(result.content[0].text);
const bitcoinPrice = data[0].current_price;
console.log(`Bitcoin price: $${bitcoinPrice}`);
```

### Getting Multiple Coin Prices

```typescript
const result = await mcpClient.callTool({
  name: "get_simple_price",
  arguments: {
    ids: "bitcoin,ethereum,cardano",
    vs_currencies: "usd,eur"
  },
});

const prices = JSON.parse(result.content[0].text);
// Result: { bitcoin: { usd: 111000, eur: 102000 }, ethereum: { usd: 2800, eur: 2580 } }
```

## Symbol Format Requirements

### Coin IDs
Use CoinGecko's official coin IDs (lowercase):
- ✅ `"bitcoin"` (not "BTC")
- ✅ `"ethereum"` (not "ETH") 
- ✅ `"cardano"` (not "ADA")

### Currencies
Use lowercase currency codes:
- ✅ `"usd"` (not "USD")
- ✅ `"eur"` (not "EUR")
- ✅ `"btc"` (not "BTC")

## Supported Features

### ✅ Available
- Real-time cryptocurrency prices
- Market capitalization data
- 24h trading volumes
- Price change percentages
- All-time high/low data
- Market rankings
- Historical price data (limited)

### ❌ Not Available
- Level1 bid/ask data
- Real-time order book
- Trade-by-trade data
- Depth charts
- Advanced technical indicators

## Error Handling

### Common Errors

```typescript
// Unknown coin ID
{
  error: "coin not found",
  message: "The requested coin ID does not exist"
}

// Invalid currency
{
  error: "vs_currency not found",
  message: "The requested vs_currency is not supported"
}

// Rate limiting
{
  error: "rate limit exceeded",
  message: "API rate limit exceeded. Please try again later."
}
```

### Best Practices

```typescript
try {
  const result = await mcpClient.callTool({
    name: "get_coins_markets",
    arguments: { /* ... */ }
  });
  
  const data = JSON.parse(result.content[0].text);
  
  if (!data || data.length === 0) {
    throw new Error("No data returned");
  }
  
  return data[0].current_price;
} catch (error) {
  if (error.message.includes("coin not found")) {
    throw new Error(`Invalid coin ID: ${coinId}`);
  }
  if (error.message.includes("rate limit")) {
    throw new Error("Rate limit exceeded - retry later");
  }
  throw error;
}
```

## Integration with QiCore

### Using with CoinGeckoMCPReader

```typescript
import { CoinGeckoMCPReader } from "@qi/dp/market/crypto/sources/CoinGeckoMCPReader";

const reader = new CoinGeckoMCPReader({
  name: "coingecko-production",
  debug: false,
  mcpClient: mcpClient
});

// Read current Bitcoin price
const bitcoinSymbol = MarketSymbol.create(
  "bitcoin",
  "Bitcoin", 
  "crypto",
  "usd",
  InstrumentType.CASH
);

const priceResult = await reader.readPrice(bitcoinSymbol, context);
if (isSuccess(priceResult)) {
  const price = getData(priceResult);
  console.log(`Bitcoin: $${price.price}`);
}
```

## Performance Characteristics

- **Latency**: ~200-500ms per request
- **Rate Limits**: Public server has rate limiting (exact limits not specified)
- **Reliability**: 99.9%+ uptime
- **Data Freshness**: Real-time updates (~30 seconds delay)

## Production Considerations

### Advantages
- No API key required
- Official CoinGecko server
- Comprehensive cryptocurrency coverage
- Reliable infrastructure

### Limitations
- Public rate limits
- No Level1 market data
- Limited historical data depth
- Cryptocurrency focus only (no stocks/forex)

### Recommended Use Cases
- Real-time crypto price monitoring
- Portfolio valuation
- Market analysis dashboards
- Cryptocurrency research applications

### Not Recommended For
- High-frequency trading
- Order book analysis
- Real-time bid/ask spreads
- Multi-asset class applications

## Troubleshooting

### Connection Issues
```bash
# Test server connectivity
curl -N "https://mcp.api.coingecko.com/sse"
```

### Tool Discovery
```typescript
// List available tools
const tools = await mcpClient.listTools();
console.log("Available tools:", tools);
```

### Debug Mode
```typescript
const reader = new CoinGeckoMCPReader({
  name: "debug-reader",
  debug: true,  // Enable debug logging
  mcpClient: mcpClient
});
```

## Version History

- **2025-07-10**: Updated tool names based on official server
- **2025-07-07**: Initial documentation with working examples
- **2025-07-05**: First implementation and testing

---

*Last Updated: 2025-07-10*  
*Status: Production Ready ✅*