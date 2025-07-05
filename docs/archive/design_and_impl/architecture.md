# QiCore Crypto Data Platform - Agent/MCP Centric Architecture

## Overview

This document specifies the **Agent/MCP Centric Architecture** for the QiCore Crypto Data Platform. The architecture follows a two-centric approach: **Data Stream Platform** (structural) + **Agent/MCP Framework** (implementation).

## Platform Functionality

**Platform Purpose**: Get data from data source → Data pushed to data stream to be used → Users of the data stream get the data and do their jobs

### Complete Data Flow
```mermaid
graph LR
    subgraph "📊 Data Sources"
        DS1[CoinGecko API]
        DS2[TwelveData API] 
        DS3[CryptoCompare API]
    end
    
    subgraph "🤖 Publisher Agents"
        PA1[Publisher Agent 1<br/>Get data → Publish to stream]
        PA2[Publisher Agent 2<br/>Get data → Publish to stream]
        PA3[Publisher Agent 3<br/>Get data → Publish to stream]
    end
    
    subgraph "🌊 Data Stream (Redpanda)"
        T1[crypto-prices]
        T2[crypto-ohlcv]
        T3[crypto-analytics]
    end
    
    subgraph "🤖 Consumer Agents"
        CA1[Consumer Agent 1<br/>Get from stream → Store data]
        CA2[Consumer Agent 2<br/>Get from stream → Store data]
        CA3[Consumer Agent 3<br/>Get from stream → Store data]
    end
    
    subgraph "💾 Data Stores"
        DS[TimescaleDB]
        CH[ClickHouse]
        RD[Redis]
    end
    
    subgraph "👥 Stream Users"
        U1[Alerting Systems]
        U2[Trading Bots]
        U3[Analytics Dashboards]
    end
    
    DS1 --> PA1
    DS2 --> PA2
    DS3 --> PA3
    
    PA1 --> T1
    PA2 --> T2
    PA3 --> T3
    
    T1 --> CA1
    T2 --> CA2
    T3 --> CA3
    
    CA1 --> DS
    CA2 --> CH
    CA3 --> RD
    
    T1 -.-> U1
    T2 -.-> U2
    T3 -.-> U3
    
    style PA1 fill:#e8f5e8
    style PA2 fill:#e8f5e8
    style PA3 fill:#e8f5e8
    style CA1 fill:#fff3cd
    style CA2 fill:#fff3cd
    style CA3 fill:#fff3cd
```

### Agent Types and Functionalities

#### Publisher Agent Type
- **Functionality**: Get data from data source → Publish data into data stream
- **Examples**: CoinGecko Publisher Agent, CryptoCompare Publisher Agent, TwelveData Publisher Agent
- **Workflow**: External API → Agent → Official MCP Server → Data Processing → Custom Stream Tools → Redpanda Topics
- **Responsibilities**:
  - Connect to external data sources via Official MCP servers
  - Transform raw data into standardized format
  - Publish processed data to appropriate Redpanda topics
  - Handle rate limiting and error recovery

#### Consumer Agent Type
- **Functionality**: Get data from data stream → Store data into data store
- **Examples**: TimescaleDB Consumer Agent, ClickHouse Consumer Agent, Analytics Consumer Agent
- **Workflow**: Redpanda Topics → Custom Stream Tools → Agent → Data Processing → Official MCP Server → Database/Storage
- **Responsibilities**:
  - Subscribe to relevant Redpanda topics
  - Process streaming data in real-time
  - Store processed data via Official MCP servers
  - Maintain data quality and consistency

### Data Stream Users
- **Real-time Applications**: Live price monitoring, alerting systems
- **Analytics Teams**: Historical analysis, pattern recognition
- **Trading Systems**: Algorithmic trading, risk management
- **Research Projects**: Academic studies, market intelligence
- **Custom Integrations**: Third-party applications, webhooks

## Architecture Principles

### 1. Agent/MCP Centric Framework

#### **Implementation Architecture Diagram**
```mermaid
graph TB
    subgraph "🤖 Agent Layer (QiCore Framework)"
        subgraph "Publisher Agents"
            PA1[CoinGecko Publisher<br/>Tool Set + PE + LLM]
            PA2[TwelveData Publisher<br/>Tool Set + PE + LLM]
        end
        
        subgraph "Consumer Agents"
            CA1[TimescaleDB Consumer<br/>Tool Set + PE + LLM]
            CA2[Analytics Consumer<br/>Tool Set + PE + LLM]
        end
        
        subgraph "MCP Client (Single Manager)"
            MC[MCP Client<br/>Manages all connections]
        end
    end
    
    subgraph "✅ Official MCP Servers (100% Priority)"
        CGMCP[CoinGecko MCP<br/>@coingecko/coingecko-mcp<br/>15k+ coins, 8M+ tokens]
        PGMCP[PostgreSQL MCP<br/>@modelcontextprotocol/server-postgres<br/>TimescaleDB compatible]
        KMCP[Kafka MCP<br/>@confluent/mcp-confluent<br/>Redpanda compatible]
    end
    
    subgraph "⚠️ Custom MCP Tools (Exception Only)"
        TR[Tool Registry<br/>Manages custom tools]
        SCT[StreamCryptoDataTool<br/>High-performance streaming]
        CCT[ConsumeStreamDataTool<br/>High-performance consumption]
        PCT[ProcessCryptoStreamTool<br/>Real-time processing]
    end
    
    subgraph "🔧 Services & Infrastructure"
        CG[CoinGecko API]
        RP[Redpanda Cluster<br/>High-performance streaming]
        TS[TimescaleDB<br/>Time-series database]
    end
    
    PA1 --> MC
    PA2 --> MC
    CA1 --> MC
    CA2 --> MC
    
    MC --> CGMCP
    MC --> PGMCP
    MC --> KMCP
    MC --> TR
    
    TR --> SCT
    TR --> CCT
    TR --> PCT
    
    CGMCP --> CG
    SCT --> RP
    CCT --> RP
    PCT --> RP
    PGMCP --> TS
    
    style PA1 fill:#e8f5e8
    style PA2 fill:#e8f5e8
    style CA1 fill:#fff3cd
    style CA2 fill:#fff3cd
    style CGMCP fill:#e1f5fe
    style PGMCP fill:#e1f5fe
    style KMCP fill:#e1f5fe
    style SCT fill:#fff3e0
    style CCT fill:#fff3e0
    style PCT fill:#fff3e0
```

**Agent Definition**: Tool Set + Process Executor + Prompt/LLM
- **Tool Set**: MCP tools (official MCP servers + custom tools)
- **Process Executor**: Workflow/orchestration logic  
- **Prompt/LLM**: AI-powered decision making
- **MCP Client**: Single manager for all MCP connections

### 2. Official MCP First Principle (MANDATORY)
- **✅ ALWAYS USE**: Official MCP servers when available (100% usage)
- **PostgreSQL**: `@modelcontextprotocol/server-postgres` (TimescaleDB compatible)
- **Kafka**: `@confluent/mcp-confluent` (Redpanda compatible)
- **CoinGecko**: `@coingecko/coingecko-mcp` (15k+ coins, 8M+ tokens)

### 3. Custom MCP Tools: Exception Only
- **ONLY when**: Official server doesn't exist or lacks functionality
- **High-performance components**: Wrapped as MCP tools for agent access
- **MUST document**: Justification for custom implementation

## Data Pipeline Flow

### Publisher Agent Workflow (Get data from data source → Publish data into data stream)

#### **Publisher Agent Sequence Diagram**
```mermaid
sequenceDiagram
    participant API as CoinGecko API
    participant PA as Publisher Agent<br/>(Tool Set + PE + LLM)
    participant MC as MCP Client
    participant CGMCP as Official CoinGecko MCP
    participant TR as Tool Registry
    participant SCT as StreamCryptoDataTool
    participant RP as Redpanda Topics
    
    Note over PA: 🚀 FUNCTIONALITY: Get data from data source → Publish data into data stream
    
    rect rgb(230, 245, 230)
        Note over PA, CGMCP: STEP 1: Get data from data source
        PA->>MC: Request crypto data
        MC->>CGMCP: get_price(['bitcoin', 'ethereum'])
        CGMCP->>API: HTTP request to CoinGecko
        API-->>CGMCP: Raw JSON response
        CGMCP-->>MC: Structured price data
        MC-->>PA: Official MCP data
    end
    
    Note over PA: 🧠 Agent processes data with AI logic
    
    rect rgb(255, 243, 224)
        Note over PA, RP: STEP 2: Publish data into data stream
        PA->>MC: Request data publishing
        MC->>TR: Access custom tools
        TR->>SCT: stream_crypto_data('publish_price')
        SCT->>RP: High-performance Kafka protocol
        RP-->>SCT: Partition/offset confirmation
        SCT-->>TR: Success + latency metrics
        TR-->>MC: Operation complete
        MC-->>PA: Data published successfully
    end
    
    Note over PA: ✅ Publisher Agent functionality complete
```

**Step-by-Step Publisher Flow**:
1. **Get data from data source**: Publisher Agent calls Official CoinGecko MCP Server (`get_price`, `get_ohlcv`)
2. **Data transformation**: Agent processes raw API data into standardized format
3. **Publish data into data stream**: Agent uses Custom `StreamCryptoDataTool` to publish to Redpanda topics

### Consumer Agent Workflow (Get data from data stream → Store data into data store)

#### **Consumer Agent Sequence Diagram**
```mermaid
sequenceDiagram
    participant RP as Redpanda Topics
    participant CA as Consumer Agent<br/>(Tool Set + PE + LLM)
    participant MC as MCP Client
    participant TR as Tool Registry
    participant CCT as ConsumeStreamDataTool
    participant PGMCP as Official PostgreSQL MCP
    participant TS as TimescaleDB
    
    Note over CA: 🚀 FUNCTIONALITY: Get data from data stream → Store data into data store
    
    rect rgb(255, 243, 224)
        Note over RP, CCT: STEP 1: Get data from data stream
        CA->>MC: Request stream subscription
        MC->>TR: Access custom tools
        TR->>CCT: consume_stream_data('subscribe')
        CCT->>RP: Subscribe to crypto-prices topic
        RP-->>CCT: Stream messages (real-time)
        CCT-->>TR: Processed stream data
        TR-->>MC: Data ready for consumption
        MC-->>CA: Stream data available
    end
    
    Note over CA: 🧠 Agent processes stream data with AI logic
    Note over CA: (aggregation, validation, enrichment)
    
    rect rgb(225, 245, 254)
        Note over CA, TS: STEP 2: Store data into data store
        CA->>MC: Request data storage
        MC->>PGMCP: execute_query (INSERT statement)
        PGMCP->>TS: SQL INSERT with crypto price data
        TS-->>PGMCP: Row insertion confirmation
        PGMCP-->>MC: Query execution success
        MC-->>CA: Data stored successfully
    end
    
    Note over CA: ✅ Consumer Agent functionality complete
    Note over RP: 🔄 Continuous streaming continues...
```

**Step-by-Step Consumer Flow**:
1. **Get data from data stream**: Consumer Agent uses Custom `ConsumeStreamDataTool` to subscribe to Redpanda topics
2. **Data processing**: Agent processes streaming data (aggregation, validation, enrichment)
3. **Store data into data store**: Agent uses Official PostgreSQL MCP Server to store in TimescaleDB

### Complete Platform Data Flow

#### **End-to-End Implementation Architecture**
```mermaid
graph TB
    subgraph "🌐 External Data Sources"
        CG_API[CoinGecko API<br/>15k+ cryptocurrencies]
        TD_API[TwelveData API<br/>Stock & crypto data]
        CC_API[CryptoCompare API<br/>Market data]
    end
    
    subgraph "🤖 Publisher Agents (Get data from source → Publish to stream)"
        PA_CG[CoinGecko Publisher Agent<br/>Tool Set + PE + LLM]
        PA_TD[TwelveData Publisher Agent<br/>Tool Set + PE + LLM]
        PA_CC[CryptoCompare Publisher Agent<br/>Tool Set + PE + LLM]
        
        subgraph "Official MCP Servers (Publisher Side)"
            CG_MCP[CoinGecko MCP<br/>@coingecko/coingecko-mcp]
            TD_MCP[TwelveData MCP<br/>Financial data]
            CC_MCP[CryptoCompare MCP<br/>Market data]
        end
        
        subgraph "Custom Streaming Tools"
            SCT[StreamCryptoDataTool<br/>High-performance publishing]
        end
    end
    
    subgraph "🌊 Data Stream Layer (Redpanda Cluster)"
        T_PRICES[crypto-prices<br/>Real-time pricing]
        T_OHLCV[crypto-ohlcv<br/>Historical data]
        T_ANALYTICS[crypto-analytics<br/>Market insights]
        T_TRENDING[crypto-trending<br/>Popular coins]
    end
    
    subgraph "🤖 Consumer Agents (Get data from stream → Store data)"
        CA_TS[TimescaleDB Consumer Agent<br/>Tool Set + PE + LLM]
        CA_CH[ClickHouse Consumer Agent<br/>Tool Set + PE + LLM]
        CA_AN[Analytics Consumer Agent<br/>Tool Set + PE + LLM]
        
        subgraph "Official MCP Servers (Consumer Side)"
            PG_MCP[PostgreSQL MCP<br/>@modelcontextprotocol/server-postgres]
            CH_MCP[ClickHouse MCP<br/>Analytics database]
        end
        
        subgraph "Custom Consumption Tools"
            CCT[ConsumeStreamDataTool<br/>High-performance consumption]
            PCT[ProcessCryptoStreamTool<br/>Real-time processing]
        end
    end
    
    subgraph "💾 Data Storage Layer"
        TS_DB[TimescaleDB<br/>Time-series optimization]
        CH_DB[ClickHouse<br/>Analytics warehouse]
        REDIS_DB[Redis<br/>Real-time cache]
    end
    
    subgraph "👥 Data Stream Users (Get data and do their jobs)"
        ALERT[🚨 Alerting Systems<br/>Price monitoring]
        TRADING[📈 Trading Bots<br/>Algorithmic trading]
        DASH[📊 Analytics Dashboards<br/>Market intelligence]
        API_USERS[🔌 Custom APIs<br/>Third-party integrations]
    end
    
    %% Data Source Connections
    CG_API --> CG_MCP
    TD_API --> TD_MCP
    CC_API --> CC_MCP
    
    %% Publisher Agent Connections
    CG_MCP --> PA_CG
    TD_MCP --> PA_TD
    CC_MCP --> PA_CC
    
    PA_CG --> SCT
    PA_TD --> SCT
    PA_CC --> SCT
    
    %% Stream Publishing
    SCT --> T_PRICES
    SCT --> T_OHLCV
    SCT --> T_ANALYTICS
    SCT --> T_TRENDING
    
    %% Stream Consumption
    T_PRICES --> CCT
    T_OHLCV --> CCT
    T_ANALYTICS --> PCT
    T_TRENDING --> PCT
    
    %% Consumer Agent Processing
    CCT --> CA_TS
    CCT --> CA_CH
    PCT --> CA_AN
    
    %% Database Storage
    CA_TS --> PG_MCP
    CA_CH --> CH_MCP
    CA_AN --> PG_MCP
    
    PG_MCP --> TS_DB
    CH_MCP --> CH_DB
    CA_AN --> REDIS_DB
    
    %% Direct Stream Access (Dotted lines for stream users)
    T_PRICES -.-> ALERT
    T_OHLCV -.-> TRADING
    T_ANALYTICS -.-> DASH
    T_TRENDING -.-> API_USERS
    
    %% Styling
    style PA_CG fill:#e8f5e8
    style PA_TD fill:#e8f5e8
    style PA_CC fill:#e8f5e8
    style CA_TS fill:#fff3cd
    style CA_CH fill:#fff3cd
    style CA_AN fill:#fff3cd
    style CG_MCP fill:#e1f5fe
    style TD_MCP fill:#e1f5fe
    style CC_MCP fill:#e1f5fe
    style PG_MCP fill:#e1f5fe
    style CH_MCP fill:#e1f5fe
    style SCT fill:#fff3e0
    style CCT fill:#fff3e0
    style PCT fill:#fff3e0
```

**Platform Responsibilities**:
- **Data Ingestion**: Publisher agents reliably collect data from multiple sources via Official MCP servers
- **Data Streaming**: High-performance Redpanda cluster distributes data via Custom streaming tools
- **Data Storage**: Consumer agents persist data in optimized databases via Official MCP servers
- **Data Access**: Stream users consume data directly from topics for their specific use cases

## Implementation Architecture

### 1. Physical Infrastructure (High Performance)
```yaml
# docker-compose.yml
version: '3.8'
services:
  redpanda:
    image: redpandadata/redpanda:latest
    ports:
      - "9092:9092"
    # ... Redpanda configuration
  
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    ports:
      - "5432:5432"
    # ... TimescaleDB configuration
```

### 2. Agent Layer (QiCore Framework)

#### Publisher Agent Example (Get data from data source → Publish data into data stream)
```typescript
// lib/src/agents/crypto-publisher-agent.ts
import { BaseAgent } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

export class CryptoPublisherAgent extends BaseAgent {
  private mcpClient: MCPClient;

  constructor(config: PublisherConfig) {
    super('crypto-publisher-agent');
    this.mcpClient = new MCPClient(console);
  }

  async initialize(): Promise<void> {
    // Connect to official data source MCP server
    await this.mcpClient.connectToServer({
      name: 'coingecko',
      command: 'npx', 
      args: ['-y', '@coingecko/coingecko-mcp', '--client=claude', '--tools=dynamic']
    });
  }

  // Publisher Agent Functionality: Get data from data source
  async collectCryptoData(symbols: string[]): Promise<void> {
    // STEP 1: Get data from data source via Official CoinGecko MCP
    const priceData = await this.mcpClient.callTool('coingecko', 'get_price', {
      ids: symbols.join(','),
      vs_currencies: 'usd,btc',
      include_market_cap: true
    });

    // STEP 2: Publish data into data stream via Custom MCP Tool
    await this.toolRegistry.executeTool('stream_crypto_data', {
      operation: 'publish_price',
      priceData: priceData
    });
  }
}
```

#### Consumer Agent Example (Get data from data stream → Store data into data store)
```typescript
// lib/src/agents/crypto-consumer-agent.ts
import { BaseAgent } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

export class CryptoConsumerAgent extends BaseAgent {
  private mcpClient: MCPClient;

  constructor(config: ConsumerConfig) {
    super('crypto-consumer-agent');
    this.mcpClient = new MCPClient(console);
  }

  async initialize(): Promise<void> {
    // Connect to official database MCP server
    await this.mcpClient.connectToServer({
      name: 'postgres',
      command: 'npx',
      args: ['@modelcontextprotocol/server-postgres', this.config.postgresConnectionString]
    });
  }

  // Consumer Agent Functionality: Get data from data stream → Store data into data store
  async processStreamData(): Promise<void> {
    // STEP 1: Get data from data stream via Custom MCP Tool
    await this.toolRegistry.executeTool('consume_stream_data', {
      operation: 'subscribe',
      topics: ['crypto-prices', 'crypto-ohlcv']
    });

    // STEP 2: Store data into data store via Official PostgreSQL MCP
    this.setupMessageHandlers(); // Handlers store data via PostgreSQL MCP
  }

  private setupMessageHandlers(): void {
    this.consumer.onPriceData(async (priceData) => {
      // Store data into data store via Official PostgreSQL MCP
      await this.mcpClient.callTool('postgres', 'execute_query', {
        query: 'INSERT INTO crypto_prices (...) VALUES (...)',
        params: [/* price data */]
      });
    });
  }
}
```

### 3. Custom MCP Tools (Exception Only)
```typescript
// lib/src/mcp-tools/crypto-data-tools.ts
export class StreamCryptoDataTool implements MCPTool {
  name = "stream_crypto_data";
  description = "High-performance crypto data streaming to Redpanda";

  // ✅ JUSTIFICATION DOCUMENTED:
  // Official Kafka MCP provides basic operations, but NOT streaming pipelines
  // This tool handles high-performance streaming: CoinGecko → Redpanda
  
  constructor(private producer: CryptoDataProducer) {}

  async execute(params: {
    operation: 'start' | 'stop' | 'publish_price' | 'publish_ohlcv';
    priceData?: CryptoPrice;
    ohlcvData?: CryptoOHLCV;
  }): Promise<{ success: boolean; latency: number }> {
    // Custom implementation wrapping high-performance CryptoDataProducer
    switch (params.operation) {
      case 'publish_price':
        await this.producer.publishPrice(params.priceData);
        break;
      // ... other operations
    }
    return { success: true, latency: Date.now() - startTime };
  }
}
```

### 4. MCP Tool Registry
```typescript
// lib/src/mcp-tools/registry.ts
import { MCPTool } from '@qicore/agent-lib/qimcp/client';
import { StreamCryptoDataTool } from './crypto-data-tools';

export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  constructor(
    private producer: CryptoDataProducer,
    private consumer: CryptoDataConsumer
  ) {
    // Register custom MCP tools
    this.registerTool(new StreamCryptoDataTool(producer));
    this.registerTool(new ConsumeStreamDataTool(consumer));
    this.registerTool(new ProcessCryptoStreamTool(consumer));
  }

  private registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(params);
  }
}
```

## Configuration

### Official MCP Servers
```json
// Claude Desktop Configuration
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data"]
    },
    "coingecko": {
      "command": "npx",
      "args": ["-y", "@coingecko/coingecko-mcp", "--client=claude", "--tools=dynamic"]
    },
    "kafka": {
      "command": "npx",
      "args": ["@confluent/mcp-confluent"]
    }
  }
}
```

### Environment Variables
```bash
# .env
REDPANDA_BROKERS=localhost:9092
TIMESCALE_CONNECTION_STRING=postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data
COINGECKO_API_KEY=your_api_key
```

## Usage Examples

### Complete Platform Data Flow
```typescript
// app/src/main.ts - Complete Platform Implementation
import { CryptoPublisherAgent } from '@qicore/agent-lib/agents/crypto-publisher-agent';
import { CryptoConsumerAgent } from '@qicore/agent-lib/agents/crypto-consumer-agent';

async function runCompletePlatform() {
  console.log('🚀 Starting Complete Crypto Data Platform');
  console.log('📋 Platform Purpose: Get data from data source → Data pushed to data stream → Users get data and do their jobs');

  // STEP 1: Initialize Publisher Agent (Get data from data source → Publish data into data stream)
  const publisherAgent = new CryptoPublisherAgent({
    coinGeckoApiKey: process.env.COINGECKO_API_KEY,
    redpandaBrokers: ['localhost:9092']
  });
  
  await publisherAgent.initialize();
  console.log('✅ Publisher Agent initialized');

  // STEP 2: Initialize Consumer Agent (Get data from data stream → Store data into data store)
  const consumerAgent = new CryptoConsumerAgent({
    postgresConnectionString: process.env.TIMESCALE_CONNECTION_STRING,
    redpandaBrokers: ['localhost:9092']
  });
  
  await consumerAgent.initialize();
  console.log('✅ Consumer Agent initialized');

  // STEP 3: Start complete data pipeline
  setInterval(async () => {
    console.log('📊 Publisher Agent: Getting data from data source...');
    // Publisher Agent: Get data from data source → Publish data into data stream
    await publisherAgent.collectCryptoData(['bitcoin', 'ethereum', 'cardano']);
    
    console.log('🔄 Data pushed to data stream (Redpanda topics)');
    
    console.log('💾 Consumer Agent: Getting data from data stream and storing...');
    // Consumer Agent: Get data from data stream → Store data into data store  
    await consumerAgent.processStreamData();
    
    console.log('✅ Complete platform cycle completed');
  }, 60000);

  console.log('🎯 Platform running: Data Sources → Publisher Agents → Data Stream → Consumer Agents → Data Stores');
}
```

### Publisher Agent Usage (Get data from data source → Publish data into data stream)
```typescript
// Publisher agent specifically for data collection and publishing
const publisherAgent = new CryptoPublisherAgent(config);

// Functionality: Get data from data source
await publisherAgent.collectFromCoinGecko(['bitcoin', 'ethereum']);
await publisherAgent.collectFromTwelveData(['AAPL', 'GOOGL']);

// Functionality: Publish data into data stream
// (Automatically done after data collection via Custom MCP Tools)
```

### Consumer Agent Usage (Get data from data stream → Store data into data store)
```typescript
// Consumer agent specifically for data consumption and storage
const consumerAgent = new CryptoConsumerAgent(config);

// Functionality: Get data from data stream + Store data into data store
await consumerAgent.startConsuming(['crypto-prices', 'crypto-ohlcv']);
// Data automatically stored in TimescaleDB via Official PostgreSQL MCP
```

### Data Stream Users (Get data and do their jobs)
```typescript
// Example: Real-time alerting system
const alertingService = new RedpandaConsumer('alerting-group');
alertingService.subscribe(['crypto-prices'], (priceData) => {
  if (priceData.change_24h > 10) {
    sendAlert(`${priceData.symbol} up ${priceData.change_24h}%!`);
  }
});

// Example: Analytics dashboard
const analyticsService = new RedpandaConsumer('analytics-group');  
analyticsService.subscribe(['crypto-analytics'], (analytics) => {
  updateDashboard(analytics);
});

// Example: Trading bot
const tradingBot = new RedpandaConsumer('trading-group');
tradingBot.subscribe(['crypto-ohlcv'], (ohlcvData) => {
  analyzeMarketTrends(ohlcvData);
  executeTradeIfSignal(ohlcvData);
});
```

## Architecture Benefits

### Agent/MCP Centric Advantages
- **🤖 AI-Powered**: Agents make intelligent decisions via LLM
- **🔌 Standardized**: MCP protocol ensures tool interoperability
- **📈 Scalable**: Add new agents/tools without changing core architecture
- **🛠️ Maintainable**: Clear separation of concerns (agents, tools, services)

### Official MCP First Benefits
- **🚀 Production Ready**: Enterprise-grade reliability
- **📉 Zero Maintenance**: Auto-updates from vendors
- **⚡ Performance**: Vendor-optimized implementations
- **🔒 Security**: Maintained by service providers

## Implementation Status

### ✅ Completed Components
- **Physical Infrastructure**: Redpanda, TimescaleDB, Redis
- **High-Performance Components**: CryptoDataProducer, CryptoDataConsumer, RedpandaClient
- **Agent Layer**: CryptoPlatformAgent with real QiCore framework integration
- **Custom MCP Tools**: StreamCryptoDataTool, ConsumeStreamDataTool, ProcessCryptoStreamTool
- **MCP Tool Registry**: Centralized tool management

### 🔄 Current Focus
- **MCP Integration**: Refactoring existing agents to use QiCore MCP interfaces
- **Tool Registry**: Implementing standardized MCP tool discovery
- **Agent Orchestration**: Complete workflow automation via AI agents

## Summary

The QiCore Crypto Data Platform follows a **Agent/MCP Centric Architecture** with clearly defined agent functionalities and platform purpose:

### Platform Purpose
**Get data from data source → Data pushed to data stream to be used → Users of the data stream get the data and do their jobs**

### Agent Functionalities

#### Publisher Agent Type
- **Functionality**: Get data from data source → Publish data into data stream
- **Implementation**: External APIs → Official MCP Servers → Agent Processing → Custom Stream Tools → Redpanda Topics
- **Examples**: CoinGecko Publisher, CryptoCompare Publisher, TwelveData Publisher

#### Consumer Agent Type  
- **Functionality**: Get data from data stream → Store data into data store
- **Implementation**: Redpanda Topics → Custom Stream Tools → Agent Processing → Official MCP Servers → Databases
- **Examples**: TimescaleDB Consumer, ClickHouse Consumer, Analytics Consumer

### Complete Data Flow
```
Data Sources → Publisher Agents → Data Stream (Redpanda) → Consumer Agents → Data Stores → Stream Users
```

### Key Architecture Components
1. **Publisher Agents**: Collect data from external sources, publish to stream
2. **Data Stream (Redpanda)**: High-performance message broker for data distribution  
3. **Consumer Agents**: Subscribe to stream, store data in databases
4. **Stream Users**: Applications that consume data for specific use cases
5. **MCP Integration**: Official servers (90%+) + Custom tools (streaming only)

This architecture ensures **clear separation of concerns**, **production-ready performance**, and **AI-powered intelligence** while maintaining **standardized tool interfaces** through the MCP protocol.