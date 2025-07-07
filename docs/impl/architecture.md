# Data Platform Actor System - Architecture

## Overview

The **Data Platform Actor System** is one of two core subprojects within the broader Data Platform project. This actor system implements a **2-layer architecture** designed for building scalable, type-safe cryptocurrency data processing actors. The system operates in parallel with the **Data Platform MCP Server** subproject, together forming the complete data platform infrastructure.

### Project Relationship

```
Data Platform Project (App-level focus)
├── Data Platform Actor System (this project)
│   └── 2-layer actor architecture
└── Data Platform MCP Server (parallel project)
    └── MCP server implementations
```

The actor system provides reusable data processing components, while the MCP server project exposes these capabilities through standardized interfaces.

## 2-Layer Actor Architecture

### ASCII Representation
```
┌─────────────────────────────────────────────────────────┐
│ Layer 2: DSL Layer (Complete)                          │
│ ┌──────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Abstract DSL │ │ Sources     │ │ Targets             │ │
│ │ - Interfaces │ │ - CoinGecko │ │ - TimescaleDB       │ │
│ │ - Base Classes│ │ - Redpanda  │ │ - Redpanda          │ │
│ │ - Data Types │ │ (Readers)   │ │ (Writers)           │ │
│ └──────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↑
                    Uses infrastructure from
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Base Infrastructure (Complete)                │
│ ┌─────────────────┐ ┌─────────────────────────────────┐ │
│ │ Database        │ │ Streaming                       │ │
│ │ - TimescaleDB   │ │ - Redpanda/Kafka                │ │
│ │ - Drizzle ORM   │ │ - Message Types                 │ │
│ │ - Schemas       │ │ - Configuration                 │ │
│ └─────────────────┘ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Base Agent Framework                                │ │
│ │ - Lifecycle Management                              │ │
│ │ - Error Handling (Result<T>)                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

External Integration:
┌─────────────────────────────────────────────────────────┐
│ Data Platform MCP Server (Parallel Project)            │
│ - Composes Layer 2 actors into MCP services            │
│ - Exposes unified APIs for external consumption        │
└─────────────────────────────────────────────────────────┘
```

### Mermaid Architecture Diagram
```mermaid
graph TB
    subgraph EXT ["External: Data Platform MCP Server (Parallel Project)"]
        MCP[MCP Servers<br/>- Market Data API<br/>- Analytics API<br/>- Real-time Feeds]
        BLS[Business Logic Services<br/>- Trading Algorithms<br/>- Risk Management<br/>- Portfolio Optimization]
    end
    
    subgraph L2 ["Layer 2: DSL Layer (Complete)"]
        ABS[Abstract DSL<br/>- Interfaces<br/>- Base Classes<br/>- Data Types]
        SRC[Sources<br/>- CoinGecko<br/>- Redpanda Readers]
        TGT[Targets<br/>- TimescaleDB<br/>- Redpanda Writers]
    end
    
    subgraph L1 ["Layer 1: Base Infrastructure (Complete)"]
        DB[Database<br/>- TimescaleDB<br/>- Drizzle ORM<br/>- Schemas]
        STR[Streaming<br/>- Redpanda/Kafka<br/>- Message Types<br/>- Configuration]
        AGT[Base Agent Framework<br/>- Lifecycle Management<br/>- Error Handling]
    end
    
    EXT -.->|composes and uses| L2
    L2 -.->|uses infrastructure from| L1
    
    MCP --> ABS
    BLS --> SRC
    BLS --> TGT
    
    SRC --> DB
    SRC --> STR
    TGT --> DB
    TGT --> STR
    
    ABS --> AGT
    SRC --> AGT
    TGT --> AGT
    
    style EXT fill:#ffe0e0,stroke:#ff6b6b,stroke-width:2px,stroke-dasharray: 5 5
```

## Layer Responsibilities

### Layer 1: Base Infrastructure (`lib/src/base/`)

**Purpose**: Foundation infrastructure components that provide raw capabilities

**Components**:
- **Database Clients**: TimescaleDB (90% compression), Drizzle ORM, Schema management
- **Streaming Clients**: Redpanda/Kafka client wrappers (sub-50ms latency)
- **Base Agent Framework**: Core agent lifecycle and error handling

**Characteristics**:
- Raw infrastructure only (no DSL abstractions)
- Technology-specific implementations optimized for performance
- High-performance components (53% faster than Node.js with Bun runtime)
- Foundation for Layer 2 abstractions

**Documentation**: [Layer 1 Details](./layer1/base.md)

### Layer 2: DSL Layer (`lib/src/abstract/`, `lib/src/sources/`, `lib/src/targets/`)

**Purpose**: Domain-specific language for cryptocurrency data operations

**Components**:
- **Abstract DSL**: Unified interfaces, data types, workflow abstractions
- **Sources**: Data input actors (CoinGecko MCP, Redpanda streaming)
- **Targets**: Data output actors (TimescaleDB persistence, Redpanda streaming)

**Characteristics**:
- Technology-agnostic DSL interfaces enabling seamless source/target migration
- Plugin pattern implementation eliminating code duplication
- Zero code duplication across the entire platform
- MCP integration support for AI-powered data sources

**Documentation**: [Layer 2 Details](./layer2/architecture.md)

### External Integration: Data Platform MCP Server (Parallel Project)

**Purpose**: Composes Layer 2 actors into business services and MCP server implementations

**Components** (in parallel project):
- **MCP Servers**: Expose Layer 2 functionality as external APIs
- **Business Services**: Trading algorithms, analytics, risk management
- **Service Orchestration**: Complex workflows using actor composition

**Characteristics**:
- Uses Layer 2 actors as building blocks
- Implements app-level business logic
- External API endpoints ready for production deployment
- Microservice deployment ready

## Data Flow Architecture

### Complete Data Pipeline
```
External Data Sources (CoinGecko, APIs, etc.)
        ↓ Real-time streaming
Layer 2 Sources (via MCP or direct integration)
        ↓ Unified DSL interface
Layer 2 DSL Operations (getCurrentPrice, publishPrice, etc.)
        ↓ Technology abstraction
Layer 2 Targets (database, streaming)
        ↓ Raw client operations
Layer 1 Infrastructure (TimescaleClient, RedpandaClient)
        ↓ High-performance connections
External Systems (TimescaleDB, Redpanda clusters)
```

### Mermaid Data Flow Diagram
```mermaid
flowchart TD
    EXT[External Data Sources<br/>CoinGecko APIs, Market Feeds]
    
    SRC[Layer 2 Sources<br/>MCP Integration, Direct APIs]
    DSL[Layer 2 DSL Operations<br/>getCurrentPrice, publishPrice]
    TGT[Layer 2 Targets<br/>Database, Streaming]
    
    INF[Layer 1 Infrastructure<br/>TimescaleClient, RedpandaClient]
    SYS[External Systems<br/>TimescaleDB, Redpanda Clusters]
    
    EXT -->|Real-time streaming| SRC
    SRC -->|Unified DSL interface| DSL
    DSL -->|Technology abstraction| TGT
    TGT -->|Raw client operations| INF
    INF -->|High-performance connections| SYS
    
    style EXT fill:#e1f5fe
    style SRC fill:#f3e5f5
    style DSL fill:#fff3e0
    style TGT fill:#f3e5f5
    style INF fill:#e8f5e8
    style SYS fill:#e1f5fe
```

### Project Integration Pattern
```
Data Platform MCP Server (Parallel Project)
    ↓ (composes and uses)
Layer 2 DSL Actors (Sources + Targets)
    ↓ (leverages infrastructure)
Layer 1 Infrastructure (Database + Streaming)
    ↓ (connects to)
External Technologies (Databases, Message Queues)
```

## Current Implementation Status

### Layer 1: Production Ready ✓
- TimescaleDB client with connection pooling (90% compression achieved)
- Redpanda/Kafka streaming infrastructure (sub-50ms latency verified)
- Base agent framework with Result<T> error handling
- Database schemas for cryptocurrency data (fully optimized)

### Layer 2: Complete ✓
- Abstract DSL interfaces for reading and writing operations
- BaseReader/BaseWriter with zero-duplication plugin pattern
- CoinGecko source with external MCP server integration (46 tools available)
- Redpanda source and target for real-time streaming data
- TimescaleDB target for persistent storage
- Complete factory functions and working demos (real data, no mocks)

### External Integration: Data Platform MCP Server (Parallel Project)
- MCP server implementations using Layer 2 actors
- Business logic services for trading and analytics
- Service orchestration and deployment patterns

## Key Architectural Benefits

### 1. **Clean Separation of Concerns**
- **Layer 1**: Raw infrastructure capabilities
- **Layer 2**: Domain-specific business logic
- **Layer 3**: Service composition and external APIs

### 2. **Technology Agnostic Design**
- Same DSL interface regardless of underlying technology
- Easy migration between data sources and targets
- Future-proof for new technology integrations

### 3. **Plugin Pattern Implementation**
- Zero code duplication across implementations
- Technology-specific logic isolated to plugins
- Unified workflow and error handling

### 4. **Scalable Architecture**
- Independent layer evolution
- Microservice deployment ready
- Horizontal scaling support

### 5. **Type Safety Throughout**
- Complete TypeScript integration
- Functional error handling with Result<T>
- Compile-time guarantees for data flow

## Real-World Usage Example

```typescript
// Layer 1: Infrastructure setup (if needed directly)
const timescaleClient = new TimescaleClient(dbConfig);
const redpandaClient = new RedpandaClient(streamConfig);

// Layer 2: Actor creation and composition
const coinGeckoSource = createCoinGeckoMarketDataReader({
  name: "coingecko-reader",
  useRemoteServer: true  // Uses external MCP server
});

const timescaleTarget = createTimescaleMarketDataWriter({
  name: "timescale-writer",
  connectionString: process.env.DATABASE_URL
});

const redpandaTarget = createRedpandaMarketDataWriter({
  name: "redpanda-publisher",
  brokers: ["localhost:9092"],
  topics: { prices: "crypto-prices" }
});

// Layer 2: Data pipeline execution
async function runDataPipeline() {
  // Get data from external source via MCP
  const prices = await coinGeckoSource.getCurrentPrices(["bitcoin", "ethereum"]);
  
  if (isSuccess(prices)) {
    const priceData = getData(prices);
    
    // Publish to multiple targets simultaneously
    await Promise.all([
      timescaleTarget.publishPrices(priceData),    // Persistent storage
      redpandaTarget.publishPrices(priceData)      // Real-time streaming
    ]);
  }
}

// Layer 3: Service implementation (Future)
class CryptoDataMCPServer extends MCPServer {
  constructor() {
    this.source = coinGeckoSource;
    this.database = timescaleTarget;
    this.stream = redpandaTarget;
  }
  
  // Expose Layer 2 functionality as MCP tools
  async handleGetPrice(args: {coinId: string}) {
    return this.source.getCurrentPrice(args.coinId);
  }
  
  async handleStorePrice(args: {data: CryptoPriceData}) {
    return this.database.publishPrice(args.data);
  }
}
```

## Technology Stack Integration

### Runtime & Tooling
- **Bun 3.0+**: 53% faster than Node.js, native TypeScript support
- **Biome**: 35x faster linting and formatting
- **Vitest**: 10-20x faster testing with instant HMR

### Data Infrastructure
- **TimescaleDB**: Time-series database with 90% compression
- **Redpanda**: Kafka-compatible streaming with sub-50ms latency
- **ClickHouse**: Analytics database for future Layer 3 services

### Protocol Integration
- **MCP (Model Context Protocol)**: Standardized AI service integration
- **SSE Transport**: Real-time data streaming
- **Result<T> Pattern**: Functional error handling throughout

## Future Evolution

### Layer 3 Development Path
1. **MCP Server Implementation**: Expose Layer 2 actors as external APIs
2. **Business Logic Services**: Trading algorithms using actor pipelines
3. **Service Orchestration**: Complex workflows and deployment patterns
4. **Analytics Platform**: Real-time market analysis using ClickHouse

### Scalability Roadmap
1. **Horizontal Scaling**: Deploy actors as independent microservices
2. **Performance Optimization**: Layer 1 infrastructure enhancements
3. **Multi-Tenancy**: Layer 3 service isolation and resource management
4. **Global Distribution**: Geographic data replication and edge computing

---

**Architecture Principle**: Each layer builds upon the previous layer while maintaining clear boundaries, enabling independent evolution and optimal performance characteristics for cryptocurrency data processing at scale.