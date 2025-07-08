# Twelve Data MCP Server

Professional real-time financial data MCP server with WebSocket streaming capabilities for cryptocurrencies, stocks, and forex.

## Overview

The Twelve Data MCP server provides sub-50ms latency real-time financial data streaming through WebSocket connections, making it ideal for trading applications and real-time analytics.

## Key Features

### Real-Time Streaming
- **Sub-50ms latency** WebSocket streaming
- **Automatic reconnection** handling with exponential backoff
- **Type-safe message processing** with schema validation
- **Persistent connection management** with heartbeat monitoring
- **Error recovery mechanisms** for network interruptions

### Data Coverage
- **15,000+ cryptocurrencies** across major exchanges
- **70,000+ stocks** from global markets
- **300+ forex pairs** with real-time quotes
- **ETFs and indices** coverage
- **Options and futures** data (premium)

### Professional Features
- **Multiple data feeds** (Level 1, Level 2, Time & Sales)
- **Historical data** with minute-level granularity
- **Technical indicators** (50+ built-in indicators)
- **Market sentiment** and news integration
- **Corporate actions** and dividends data

## API Capabilities

### Real-Time Price Streaming

```typescript
// WebSocket subscription for real-time prices
await mcpClient.callTool("subscribe_realtime_price", {
  symbol: "BTC/USD",
  exchange: "BINANCE",
  interval: "1s"
});

// Batch subscription for multiple symbols
await mcpClient.callTool("subscribe_price_batch", {
  symbols: ["BTC/USD", "ETH/USD", "ADA/USD"],
  exchange: "BINANCE"
});
```

### OHLCV Data

```typescript
// Real-time OHLCV candles
await mcpClient.callTool("get_realtime_ohlcv", {
  symbol: "BTC/USD",
  interval: "1min",
  outputsize: 100
});

// Historical OHLCV with extended data
await mcpClient.callTool("get_time_series", {
  symbol: "BTC/USD",
  interval: "1h",
  start_date: "2024-01-01",
  end_date: "2024-12-31"
});
```

### Market Data

```typescript
// Live order book (Level 2 data)
await mcpClient.callTool("get_orderbook", {
  symbol: "BTC/USD",
  exchange: "BINANCE",
  depth: 20
});

// Market statistics
await mcpClient.callTool("get_market_stats", {
  symbol: "BTC/USD",
  exchange: "BINANCE"
});
```

### Technical Analysis

```typescript
// Real-time technical indicators
await mcpClient.callTool("get_technical_indicator", {
  symbol: "BTC/USD",
  indicator: "RSI",
  interval: "1h",
  time_period: 14
});

// Multiple indicators in batch
await mcpClient.callTool("get_indicator_batch", {
  symbol: "BTC/USD",
  indicators: ["RSI", "MACD", "SMA", "EMA"],
  interval: "1h"
});
```

## Integration with QiCore DSL

### Enhanced BaseReader Implementation

```typescript
class TwelveDataReader extends BaseReader {
  private wsConnection?: WebSocket;
  private subscriptions = new Map<string, Function>();

  // Real-time price handler with WebSocket
  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    const result = await this.mcpClient.callTool("get_realtime_price", {
      symbol: `${coinId.toUpperCase()}/${vsCurrency.toUpperCase()}`,
      exchange: "BINANCE"
    });
    return result.data.price;
  }

  // Subscription-based real-time updates
  async subscribeToPrice(coinId: string, callback: (price: number) => void): Promise<void> {
    const subscriptionId = await this.mcpClient.callTool("subscribe_realtime_price", {
      symbol: `${coinId.toUpperCase()}/USD`,
      exchange: "BINANCE"
    });
    
    this.subscriptions.set(subscriptionId, callback);
  }

  // Unsubscribe from real-time updates
  async unsubscribeFromPrice(coinId: string): Promise<void> {
    await this.mcpClient.callTool("unsubscribe_price", {
      symbol: `${coinId.toUpperCase()}/USD`
    });
  }
}
```

### Real-Time DSL Methods

```typescript
// New DSL methods for real-time capabilities
interface RealTimeMarketDataDSL {
  // Subscription management
  subscribeToPrice(coinId: string, callback: (price: number) => void): Promise<string>;
  subscribeToOHLCV(coinId: string, interval: string, callback: (ohlcv: CryptoOHLCVData) => void): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  
  // Real-time queries
  getCurrentPriceStream(coinId: string): AsyncIterator<number>;
  getOrderBookStream(coinId: string): AsyncIterator<OrderBookData>;
  getTradesStream(coinId: string): AsyncIterator<TradeData>;
}
```

## Authentication & Configuration

### API Key Setup

```typescript
// MCP client configuration for Twelve Data
const mcpConfig = {
  server: "twelve-data-mcp",
  authentication: {
    apiKey: process.env.TWELVE_DATA_API_KEY,
    plan: "pro" // basic, grow, pro, enterprise
  },
  websocket: {
    maxConnections: 5,
    reconnectAttempts: 10,
    heartbeatInterval: 30000
  }
};
```

### Rate Limits by Plan

| Plan | Requests/min | WebSocket Connections | Historical Data |
|------|-------------|----------------------|-----------------|
| Basic | 800 | 1 | 2 years |
| Grow | 8,000 | 5 | 5 years |
| Pro | 30,000 | 20 | 10 years |
| Enterprise | Unlimited | 100 | 30+ years |

## Production Deployment

### Performance Characteristics

- **Latency**: Sub-50ms for real-time data
- **Throughput**: Up to 10,000 updates/second per connection
- **Availability**: 99.9% uptime SLA
- **Global CDN**: Edge servers in 15+ regions

### Error Handling

```typescript
// Robust error handling for production
class TwelveDataMCPClient {
  private async handleWebSocketError(error: WebSocketError): Promise<void> {
    switch (error.code) {
      case 1006: // Connection closed abnormally
        await this.reconnectWithBackoff();
        break;
      case 4001: // Rate limit exceeded
        await this.throttleRequests();
        break;
      case 4003: // Invalid API key
        throw new Error("Invalid Twelve Data API key");
      default:
        console.error("WebSocket error:", error);
    }
  }

  private async reconnectWithBackoff(): Promise<void> {
    const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    await this.connect();
  }
}
```

### Monitoring & Observability

```typescript
// Metrics collection for production monitoring
interface TwelveDataMetrics {
  activeConnections: number;
  messagesReceived: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
  reconnectionCount: number;
}
```

## Use Cases in QiCore Platform

### 1. Real-Time Trading Algorithms

```typescript
// Real-time algorithmic trading with sub-second data
const tradingAgent = new TradingAgent({
  dataSource: new TwelveDataReader(config),
  strategy: new MomentumStrategy()
});

await tradingAgent.subscribeToPrice("BTC", (price) => {
  const signal = tradingAgent.analyzePrice(price);
  if (signal.action === "BUY") {
    tradingAgent.executeTrade(signal);
  }
});
```

### 2. Real-Time Analytics Dashboard

```typescript
// Live market data for analytics dashboard
const dashboardData = new RealTimeAnalytics({
  sources: [new TwelveDataReader(config)]
});

await dashboardData.subscribeToMultipleAssets(
  ["BTC", "ETH", "ADA"],
  (updates) => {
    dashboardData.updateCharts(updates);
    dashboardData.calculateMetrics(updates);
  }
);
```

### 3. Risk Management System

```typescript
// Real-time risk monitoring
const riskMonitor = new RiskMonitor({
  dataFeed: new TwelveDataReader(config),
  thresholds: { volatility: 0.05, drawdown: 0.1 }
});

await riskMonitor.subscribeToPortfolio(portfolioId, (metrics) => {
  if (metrics.riskScore > 0.8) {
    riskMonitor.triggerAlert(metrics);
  }
});
```

## Cost Optimization

### Efficient Subscription Management

```typescript
// Optimize WebSocket usage for cost efficiency
class SubscriptionManager {
  private subscriptions = new Map<string, Set<Function>>();

  // Share single subscription across multiple consumers
  async subscribeShared(symbol: string, callback: Function): Promise<void> {
    if (!this.subscriptions.has(symbol)) {
      await this.createSubscription(symbol);
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(callback);
  }

  // Automatically unsubscribe when no consumers
  async unsubscribeShared(symbol: string, callback: Function): Promise<void> {
    const callbacks = this.subscriptions.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        await this.removeSubscription(symbol);
        this.subscriptions.delete(symbol);
      }
    }
  }
}
```

## Security Considerations

### Data Protection

- **TLS 1.3 encryption** for all WebSocket connections
- **API key rotation** support with zero downtime
- **IP whitelisting** for production environments
- **Audit logging** for all data access

### Access Control

```typescript
// Role-based access to different data types
const accessControl = {
  basic: ["realtime_price", "basic_ohlcv"],
  premium: ["orderbook", "technical_indicators", "sentiment"],
  enterprise: ["level2_data", "time_sales", "custom_indicators"]
};
```

---

**Status**: Production-ready MCP server with enterprise-grade real-time streaming capabilities, ideal for replacing direct API integrations in the QiCore platform.