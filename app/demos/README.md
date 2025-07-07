# QiCore Crypto Data Platform - Demo Programs

This directory contains working demo programs that showcase the QiCore Crypto Data Platform's capabilities with real cryptocurrency data.

## 🏗️ Architecture

All demos are built on the **TRUE Actor Pattern**:
- **Actor Definition**: "A class of MCP client that provides DSL interfaces"
- **Actor IS an MCP client** (extends MCPClient directly)
- **No wrapper layers** - direct MCP integration with domain-specific methods

## 📁 Demo Structure

### `/publishers/` - Data Acquisition Demos

Real cryptocurrency data acquisition using the CoinGeckoActor:

#### 🚀 **simple-crypto-data-demo.ts**
Basic CoinGecko Actor demonstration showing:
- Actor initialization and status checking
- Current price retrieval (Bitcoin, Ethereum)
- Multiple cryptocurrency price analysis
- Market analytics and global data
- Level 1 market data with bid/ask spreads

**Run**: `bun app/demos/publishers/simple-crypto-data-demo.ts`

#### 📈 **advanced-crypto-demo.ts**
Comprehensive financial DSL showcase demonstrating all 5 functions:
1. Current price analysis with portfolio metrics
2. OHLCV technical analysis with candlestick insights
3. Historical price trends and volatility analysis
4. Top cryptocurrency market overview
5. Global market analytics with health indicators

**Run**: `bun app/demos/publishers/advanced-crypto-demo.ts`

#### 🏗️ **demo-architecture-simple.ts**
Architecture validation demo showing:
- Factor-compositional architecture principles
- Actor independence and domain expertise
- Source-agnostic design patterns
- Clean DSL interface abstractions

**Run**: `bun app/demos/publishers/demo-architecture-simple.ts`

### `/services/` - Infrastructure Demos

#### 🐳 **docker-services-demo.ts**
Docker infrastructure management showing:
- Service status checking (Redpanda, TimescaleDB, ClickHouse, Redis)
- Health check procedures for running services
- Integration readiness assessment
- Service management commands and workflows

**Run**: `bun app/demos/services/docker-services-demo.ts`

## ✅ Demo Results

### Real Data Retrieved
- **Bitcoin**: ~$108,000 (live pricing)
- **Ethereum**: ~$2,512 (live pricing)  
- **Market Cap**: $3.4T total cryptocurrency market
- **BTC Dominance**: 63.15%
- **Active Cryptocurrencies**: 17,596
- **Technical Analysis**: OHLCV data with candlestick patterns

### Performance Metrics
- **Actor Initialization**: <2 seconds
- **Price Retrieval**: 200-600ms per request
- **Market Analytics**: <1 second for global data
- **All Tests Passing**: 16/16 integration tests

## 🎯 Key Features Demonstrated

### TRUE Actor Pattern
✅ **IS MCP Client**: Extends MCPClient directly  
✅ **DSL Interfaces**: Financial market data acquisition methods  
✅ **No Wrappers**: Direct MCP integration  
✅ **Domain Expertise**: Cryptocurrency data specialization  
✅ **Functional Programming**: Result<T> error handling  
✅ **Real Data**: Live CoinGecko market data

### Financial DSL Functions
1. **getCurrentPrice()** - Single cryptocurrency pricing
2. **getCurrentPrices()** - Multi-crypto portfolio analysis  
3. **getCurrentOHLCV()** - Technical analysis data
4. **getPriceHistory()** - Historical trend analysis
5. **getAvailableTickers()** - Market overview and rankings
6. **getMarketAnalytics()** - Global market insights
7. **getLevel1Data()** - Bid/ask spread analysis

### Infrastructure Management
- **Docker Services**: Status monitoring and health checks
- **Service Discovery**: Automatic readiness assessment  
- **Integration Planning**: Development workflow guidance

## 🚀 Quick Start

1. **Test Basic Functionality**:
   ```bash
   bun app/demos/publishers/simple-crypto-data-demo.ts
   ```

2. **Explore Advanced Features**:
   ```bash
   bun app/demos/publishers/advanced-crypto-demo.ts
   ```

3. **Check Infrastructure**:
   ```bash
   bun app/demos/services/docker-services-demo.ts
   ```

## 📊 Success Metrics

- ✅ **TypeScript Clean**: No type errors
- ✅ **Biome Clean**: No linting issues  
- ✅ **Unit Tests**: 16/16 passing
- ✅ **Real Data**: Live cryptocurrency market data
- ✅ **Performance**: Sub-second response times
- ✅ **Architecture**: TRUE Actor pattern validated

## 💡 Next Steps

1. **Run Demos**: Experience the working cryptocurrency data platform
2. **Study Code**: Understand the TRUE Actor pattern implementation
3. **Extend Functionality**: Add new financial DSL methods
4. **Integration**: Connect with streaming infrastructure
5. **Analytics**: Develop market analysis dashboards

---

**Note**: All demos connect to real CoinGecko APIs and retrieve live cryptocurrency market data. Rate limiting may occasionally affect demo performance, which is expected behavior and handled gracefully by the Actor pattern.