# QiCore Crypto Data Platform - Demo Programs

This directory contains working demo programs that showcase the QiCore Crypto Data Platform's **2-layer architecture** with real cryptocurrency data.

## 🏗️ Architecture Overview

All demos are built on the **2-Layer Architecture**:
- **Layer 1 (Low-level)**: Foundation tools (`lib/src/base` + MCP primitives)
- **Layer 2 (High-level)**: Business logic (`lib/src/abstract` + `lib/src/sources` + `lib/src/targets`)
- **Handler Pattern**: Layer 2 actors implement technology-specific handlers using Layer 1 foundations

## 📁 Demo Structure by Architecture Layers

### `/layer1/` - Layer 1 Demonstrations  
**Foundation Tools & MCP Primitives**

These demos showcase the low-level building blocks that Layer 2 business logic is built upon:

#### 🔧 **result-type-demo.ts**
**Result<T> Type System Foundation** - Core functional programming primitives:
- **Result<T> = Either<QiError, T>** functional error handling pattern
- **Structured Error Handling**: QiError with categorization (BUSINESS, SYSTEM, VALIDATION)
- **Functional Composition**: Chainable operations without exceptions
- **Async Support**: Promise<Result<T>> for async operations
- **Foundation**: What all Layer 2 business logic is built upon

**Run**: `bun app/demos/layer1/result-type-demo.ts`

#### 🔗 **mcp-tools-demo.ts**
**MCP Protocol Primitives** - Low-level MCP building blocks:
- **Raw MCP Client**: Direct protocol-level client creation and management
- **Transport Abstraction**: SSE, stdio, WebSocket transport layers  
- **Connection Lifecycle**: Raw connect/disconnect operations
- **Tool Discovery**: Protocol-level tool listing and capabilities
- **Raw Tool Calling**: Direct MCP tool invocation without business logic
- **Foundation**: What Layer 2 MCP actors are built upon

**Run**: `bun app/demos/layer1/mcp-tools-demo.ts`

### `/layer2/` - Layer 2 Demonstrations
**Business Logic Built on Layer 1 Foundations**

These demos showcase high-level business logic that uses Layer 1 foundations:

#### Business Logic Architecture Demos

##### 🏗️ **actor-architecture-demo.ts**
**Business Logic Architecture** - How Layer 2 uses Layer 1:
- **DSL Abstraction**: How BaseReader/BaseWriter provide unified interfaces
- **Handler Pattern**: How actors implement technology-specific logic using Layer 1 tools
- **Zero Code Duplication**: Multiple actors inherit the same DSL methods
- **Layer 1 Usage**: How business logic wraps Layer 1 Result<T> and MCP primitives
- **Architecture Benefits**: Scalability, composability, maintainability

**Run**: `bun app/demos/layer2/actor-architecture-demo.ts`

##### 🔄 **true-end-to-end-actor-pipeline-demo.ts**
**TRUE Actor Pipeline** - Complete business logic flow:
- **Real Actor Classes**: `CoinGeckoMarketDataReader` → `RedpandaMarketDataWriter` → `RedpandaMarketDataReader` → `TimescaleMarketDataWriter`
- **Layer 1 Foundation**: All operations use Result<T> and MCP primitives
- **Business Logic Flow**: Data flows through complete 4-actor pipeline
- **Handler Implementations**: Each actor implements technology-specific logic
- **Architecture Proof**: Demonstrates Layer 2 built on Layer 1 foundations

**Run**: `bun app/demos/layer2/true-end-to-end-actor-pipeline-demo.ts`

##### 🔄 **end-to-end-pipeline-demo.ts**
**Factory Function Pipeline** - Business logic using factory pattern:
- **Business Workflow**: CoinGecko → Redpanda → TimescaleDB data flow
- **Layer 1 Usage**: Factory functions wrap Layer 1 primitives in business logic
- **Real-time Processing**: Multi-stage data transformation
- **Production Patterns**: Complete business logic showcase

**Run**: `bun app/demos/layer2/end-to-end-pipeline-demo.ts`

#### Technology-Specific Business Logic

##### `/layer2/sources/` - Data Source Business Logic

Business logic for data acquisition using Layer 1 foundations:

###### 🚀 **coingecko-source-demo.ts**
CoinGecko business logic demonstration:
- **Business Operations**: getCurrentPrice(), getMarketAnalytics(), etc.
- **Layer 1 Usage**: Wraps raw MCP calls in Result<T> pattern
- **External Integration**: Real CoinGecko MCP server connection
- **Business Data**: Cryptocurrency prices, market analytics, OHLCV data

**Run**: `bun app/demos/layer2/sources/coingecko-source-demo.ts`

###### 📡 **redpanda-source-demo.ts**
Redpanda streaming business logic:
- **Streaming Business Logic**: Real-time data consumption patterns
- **Layer 1 Usage**: Kafka operations wrapped in Result<T>
- **Business Workflows**: Stream-based market data processing
- **Integration Patterns**: Kafka/Redpanda topic consumption

**Run**: `bun app/demos/layer2/sources/redpanda-source-demo.ts`

##### `/layer2/targets/` - Data Target Business Logic

Business logic for data publishing using Layer 1 foundations:

###### 📊 **redpanda-target-demo.ts**
Redpanda streaming business logic:
- **Publishing Business Logic**: publishPrice(), publishAnalytics(), etc.
- **Layer 1 Usage**: Kafka operations wrapped in Result<T>
- **Streaming Workflows**: Real-time data distribution
- **Business Operations**: Batch publishing, topic management

**Run**: `bun app/demos/layer2/targets/redpanda-target-demo.ts`

###### 🗄️ **timescale-target-demo.ts**
TimescaleDB business logic:
- **Time-series Business Logic**: Optimized market data storage
- **Layer 1 Usage**: Database operations wrapped in Result<T>
- **Business Workflows**: OHLCV storage, analytics persistence
- **Production Operations**: Batch operations, time-series optimization

**Run**: `bun app/demos/layer2/targets/timescale-target-demo.ts`

### `/services/` - Infrastructure Support

#### 🐳 **docker-services-demo.ts**
Infrastructure management for development:
- Service status checking (Redpanda, TimescaleDB, ClickHouse, Redis)
- Health check procedures for running services
- Integration readiness assessment
- Development workflow support

**Run**: `bun app/demos/services/docker-services-demo.ts`

## ✅ Demo Results

### Real Data Retrieved
- **Live Cryptocurrency Prices**: Bitcoin, Ethereum, and others
- **Market Analytics**: Total market cap, dominance metrics
- **OHLCV Data**: Technical analysis candlestick data
- **Streaming Data**: Real-time price feeds via Redpanda
- **Persistent Storage**: Time-series data in TimescaleDB

### Performance Metrics
- **Layer 1 Operations**: Sub-millisecond Result<T> operations
- **MCP Tool Calls**: 200-600ms per external server call
- **Business Logic**: <1 second for complex market analytics
- **Stream Publishing**: Real-time capability
- **Database Storage**: Efficient time-series writes

## 🎯 Key Features Demonstrated

### 2-Layer Architecture
✅ **Layer 1 Foundation**: Result<T> functional programming + MCP primitives  
✅ **Layer 2 Business Logic**: DSL interfaces + technology-specific actors  
✅ **Clean Separation**: Business logic built on reliable foundations  
✅ **External Integration**: Layer 1 MCP tools enable Layer 2 external data sources  
✅ **Functional Programming**: Result<T> pattern throughout all layers  
✅ **Real Data Flows**: Live cryptocurrency data in all business logic demos

### Layer 1 Capabilities
1. **Result<T> Pattern** - Functional error handling without exceptions
2. **QiError System** - Structured error categorization and context
3. **MCP Client** - Raw protocol-level server connections
4. **Transport Abstraction** - SSE, stdio, WebSocket support
5. **Tool Discovery** - Protocol-level capability detection
6. **Raw Tool Calling** - Direct MCP tool invocation

### Layer 2 Business Operations
1. **getCurrentPrice()** - Single cryptocurrency pricing
2. **getCurrentPrices()** - Multi-crypto portfolio analysis  
3. **getCurrentOHLCV()** - Technical analysis data
4. **getMarketAnalytics()** - Global market insights
5. **publishPrice()** - Single price data publishing
6. **publishPrices()** - Batch price publishing
7. **publishAnalytics()** - Market analytics publishing

### Infrastructure Management
- **Docker Services**: Status monitoring and health checks
- **Service Discovery**: Automatic readiness assessment  
- **Integration Planning**: Development workflow guidance

## 🚀 Quick Start

### 1. **Understand Layer 1 Foundations** (Start Here):
```bash
bun app/demos/layer1/result-type-demo.ts
bun app/demos/layer1/mcp-tools-demo.ts
```

### 2. **Understand Layer 2 Business Logic**:
```bash
bun app/demos/layer2/actor-architecture-demo.ts
```

### 3. **Test Business Logic with Real Data**:
```bash
bun app/demos/layer2/sources/coingecko-source-demo.ts
```

### 4. **Test Complete Business Workflows**:
```bash
bun app/demos/layer2/true-end-to-end-actor-pipeline-demo.ts
```

### 5. **Test Individual Business Components**:
```bash
bun app/demos/layer2/targets/redpanda-target-demo.ts
bun app/demos/layer2/targets/timescale-target-demo.ts
```

### 6. **Check Infrastructure**:
```bash
bun app/demos/services/docker-services-demo.ts
```

## 📊 Success Metrics

- ✅ **2-Layer Architecture**: Clear separation between foundations and business logic
- ✅ **Layer 1 Foundations**: Robust Result<T> and MCP primitive operations
- ✅ **Layer 2 Business Logic**: Complete DSL abstraction over technology implementations
- ✅ **External Integration**: Working with real external MCP servers
- ✅ **Zero Code Duplication**: Handler pattern eliminates business logic repetition
- ✅ **Real Data Flows**: Live cryptocurrency data in all business demos
- ✅ **TypeScript Clean**: Strict type safety throughout both layers
- ✅ **Performance**: Sub-second response times for business operations

## 💡 Next Steps

### Layer 1 Development
1. **Extend Foundation**: Add new Result<T> utility functions
2. **MCP Extensions**: Support additional MCP transport types
3. **Error Handling**: Enhance QiError categorization and context
4. **Performance**: Optimize foundation operations

### Layer 2 Development
1. **New Business Logic**: Add market data operations (orderbook, trades)
2. **New Sources**: Add data source actors (e.g., Binance, Kraken)
3. **New Targets**: Add target actors (e.g., ClickHouse, MongoDB)
4. **Business Optimization**: Improve technology-specific implementations

### Layer 3 Development
1. **MCP Servers**: Build MCP servers using Layer 2 business logic
2. **Service Composition**: Compose Layer 2 actors into higher-level services
3. **API Gateways**: Create external APIs using Layer 2 compositions

---

**Note**: All demos connect to real external services (CoinGecko MCP server, Redpanda, TimescaleDB) and process live cryptocurrency market data. The 2-layer architecture provides a solid foundation where Layer 1 tools enable reliable Layer 2 business logic.

## 🏗️ Architecture Benefits Demonstrated

### Layer Separation
- **Layer 1**: Foundation tools, functional programming primitives, MCP protocol operations
- **Layer 2**: Business logic, DSL interfaces, technology-specific implementations
- **Clear Dependencies**: Layer 2 built on Layer 1, never the reverse

### Code Reusability
- **Layer 1 Tools**: Used by all Layer 2 business logic consistently
- **Business Logic**: DSL methods inherited by all actors, implemented once
- **Handler Pattern**: Technology-specific code isolated and reusable
- **MCP Integration**: Layer 1 primitives enable multiple Layer 2 external integrations

### Scalability
- **Layer 1 Stability**: Foundation rarely changes, supports multiple Layer 2 implementations
- **Business Logic Growth**: Add new business operations by extending Layer 2 DSL
- **Technology Growth**: Add new integrations by implementing Layer 2 handlers
- **Compose Workflows**: Mix and match any Layer 2 source with any Layer 2 target

### Reliability
- **Layer 1 Robustness**: Result<T> eliminates exceptions throughout the system
- **Layer 2 Consistency**: All business operations use the same error handling patterns
- **External Integration**: MCP primitives provide reliable external server connections
- **Production Ready**: Real data flows demonstrate production-grade reliability