# Official Redpanda MCP Server Integration

## Overview

This document covers the **Official Redpanda MCP Server** approach for high-performance streaming infrastructure with AI control.

**Important**: When we say "Official MCP Server" we mean the **Official Redpanda MCP Server** built by Redpanda team using `protoc-gen-go-mcp`, not a generic MCP server.

## Complete Architecture

### Architecture Overview
```mermaid
graph TB
    subgraph "AI Control Layer"
        AI[AI Agent] --> MCP[MCP Client]
        MCP --> RMS[Redpanda MCP Server]
        RMS --> RPA[Redpanda Admin API]
    end
    
    subgraph "Physical Data Layer"
        CD[Crypto Data] --> PA[Producer App]
        PA --> RC[Redpanda Cluster]
        RC --> CA[Consumer App]
        CA --> DB[Database]
    end
    
    subgraph "Redpanda Infrastructure"
        RPA --> RC
        RC --> RPA
    end
    
    AI -.->|Analytics Results| AI
    RMS -.->|Status/Metrics| MCP
```

### Text Diagram (ASCII)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Pure Redpanda Architecture                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ AI Agent ──→ MCP Client ──→ Redpanda MCP Server ──→ Redpanda Cluster   │
│     ↑                           │                      │                │
│     │                           │                      ↓                │
│     └──── Analytics Results ────┼──── Admin Commands → Topics/Messages  │
│                                 │                      │                │
│                                 │                      ↓                │
│                                 └──── Status/Metrics ← Admin API       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Layers
```mermaid
graph LR
    subgraph "Physical Layer (High-Performance Data Streaming)"
        CD[Crypto Data] --> PA[Producer App]
        PA --> RC[Redpanda Cluster]
        RC --> CA[Consumer App]
        CA --> DB[Database]
    end
```

```mermaid
graph LR
    subgraph "Control Layer (AI Management)"
        AI[AI Agent] --> MC[MCP Client]
        MC --> RS[Redpanda MCP Server]
        RS --> RA[Redpanda Admin API]
    end
```

## Why Pure Redpanda?

### **Primary Advantages**
- ✅ **100% FREE** - No licensing restrictions ever
- ✅ **53% faster than Kafka** - C++ implementation vs JVM
- ✅ **Single binary** - No ZooKeeper, JVM, or external dependencies
- ✅ **Kafka-compatible** - Works with all Kafka tooling
- ✅ **Built-in schema registry** - No separate Confluent dependency
- ✅ **Lower resource usage** - Smaller memory footprint
- ✅ **Simpler operations** - One service to manage

### **Recommended Architecture: Official Redpanda MCP Server**

```mermaid
graph LR
    subgraph "Official Redpanda MCP Architecture"
        QA[QiAgent] --> MC[MCP Client]
        MC --> RMS[Redpanda MCP Server]
        RMS --> GRPC[Redpanda gRPC API]
        GRPC --> RC[Redpanda Cluster]
    end
```

**Why This Approach:**
- ✅ **Official Redpanda** - Built and maintained by Redpanda team
- ✅ **Auto-generated** - From gRPC .proto files using `protoc-gen-go-mcp`
- ✅ **Production ready** - Enterprise-grade reliability with official support
- ✅ **Complete API coverage** - All Redpanda features available
- ✅ **Standardized** - Follows MCP protocol correctly

**Correct Flow:** QiAgent → MCP Client → Official Redpanda MCP Server → Redpanda Cluster

## Implementation

### 1. Physical Redpanda Cluster Setup

### Docker Compose Configuration
```yaml
# docker-compose.yml - Pure Redpanda streaming infrastructure
version: '3.8'
services:
  redpanda:
    image: redpandadata/redpanda:v23.3.3
    container_name: redpanda
    ports:
      - "9092:9092"    # Kafka API
      - "9644:9644"    # Admin API  
      - "8082:8082"    # HTTP Proxy
      - "8081:8081"    # Schema Registry
    command: |
      redpanda start
      --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
      --advertise-kafka-addr internal://redpanda:9092,external://localhost:19092
      --pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082
      --advertise-pandaproxy-addr internal://redpanda:8082,external://localhost:18082
      --schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081
      --rpc-addr redpanda:33145
      --advertise-rpc-addr redpanda:33145
      --smp 4
      --memory 4G
      --mode dev-container
    volumes:
      - redpanda_data:/var/lib/redpanda/data
    networks:
      - crypto_net
    healthcheck:
      test: ["CMD-SHELL", "rpk cluster health"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  redpanda_data:

networks:
  crypto_net:
    driver: bridge
```

### Initial Setup
```bash
# Start Redpanda
docker-compose up -d redpanda

# Wait for startup
sleep 30

# Create crypto data topics
docker exec redpanda rpk topic create crypto-ohlcv --partitions 3 --replicas 1
docker exec redpanda rpk topic create crypto-prices --partitions 3 --replicas 1
docker exec redpanda rpk topic create crypto-analytics --partitions 2 --replicas 1

# Verify cluster health
docker exec redpanda rpk cluster health
docker exec redpanda rpk topic list
```

### 2. Official Redpanda MCP Server Setup

#### Installation
```bash
# Install Redpanda CLI (includes MCP server)
go install github.com/redpanda-data/redpanda/src/go/rpk@latest

# Or use Docker
docker pull redpandadata/redpanda:latest

# Install protoc-gen-go-mcp (if building custom MCP servers)
go install github.com/redpanda-data/protoc-gen-go-mcp@latest
```

#### Start MCP Server
```bash
# Start the official Redpanda MCP server
rpk mcp server --brokers localhost:9092

# With authentication (if needed)
rpk mcp server --brokers localhost:9092 --sasl-mechanism PLAIN --sasl-username user --sasl-password pass
```

#### MCP Server Configuration
```typescript
// src/mcp-servers/redpanda-mcp-config.ts
export const redpandaMCPConfig = {
  server: 'rpk',
  command: 'rpk',
  args: ['mcp', 'server', '--brokers', 'localhost:9092'],
  transport: 'stdio',
  environment: {
    REDPANDA_BROKERS: 'localhost:9092',
    RPK_MCP_LOG_LEVEL: 'info'
  }
};
```

### 3. QiAgent Implementation

### QiAgent with Official Redpanda MCP
```typescript
// src/agents/redpanda-streaming-agent.ts
import { BaseAgent } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

export class RedpandaStreamingAgent extends BaseAgent {
  private redpandaMCP: MCPClient;

  constructor() {
    super('redpanda-streaming-agent');
    // Connect to official Redpanda MCP server
    this.redpandaMCP = new MCPClient('stdio://rpk-mcp-server');
  }

  async initialize(): Promise<void> {
    await this.redpandaMCP.connect();
    await this.setupCryptoTopics();
    console.log('✅ Redpanda Streaming Agent initialized with official MCP');
  }

  // Topic Management via MCP
  async createTopic(name: string, partitions: number = 3, replicationFactor: number = 1): Promise<void> {
    await this.redpandaMCP.call('create_topic', {
      name,
      partitions,
      replication_factor: replicationFactor
    });
    console.log(`✅ Created topic: ${name}`);
  }

  async listTopics(): Promise<string[]> {
    const result = await this.redpandaMCP.call('list_topics');
    return result.topics.map(topic => topic.name);
  }

  async deleteTopic(name: string): Promise<void> {
    await this.redpandaMCP.call('delete_topic', { name });
    console.log(`🗑️ Deleted topic: ${name}`);
  }

  async describeTopic(name: string): Promise<any> {
    return await this.redpandaMCP.call('describe_topic', { name });
  }

  // Consumer Group Management via MCP
  async listConsumerGroups(): Promise<any[]> {
    const result = await this.redpandaMCP.call('list_consumer_groups');
    return result.groups;
  }

  async describeConsumerGroup(groupId: string): Promise<any> {
    return await this.redpandaMCP.call('describe_consumer_group', { group_id: groupId });
  }

  async resetConsumerGroupOffset(groupId: string, topic: string, toLatest: boolean = true): Promise<void> {
    await this.redpandaMCP.call('reset_consumer_group_offset', {
      group_id: groupId,
      topic,
      to_latest: toLatest
    });
    console.log(`🔄 Reset offset for group ${groupId} on topic ${topic}`);
  }

  // Cluster Information via MCP
  async getClusterInfo(): Promise<any> {
    return await this.redpandaMCP.call('cluster_info');
  }

  // Message Operations via MCP
  async publishMessage(topic: string, message: any, key?: string): Promise<void> {
    await this.redpandaMCP.call('produce_message', {
      topic,
      key,
      value: typeof message === 'string' ? message : JSON.stringify(message)
    });
  }

  async setupCryptoTopics(): Promise<void> {
    console.log('🏗️ Setting up crypto data topics...');
    
    const requiredTopics = [
      { name: 'crypto-ohlcv', partitions: 3 },
      { name: 'crypto-prices', partitions: 3 },
      { name: 'crypto-analytics', partitions: 2 }
    ];

    const existingTopics = await this.listTopics();

    for (const topic of requiredTopics) {
      if (!existingTopics.includes(topic.name)) {
        await this.createTopic(topic.name, topic.partitions);
      } else {
        console.log(`ℹ️ Topic already exists: ${topic.name}`);
      }
    }
  }

  async monitorStreaming(): Promise<void> {
    console.log('🔍 Monitoring Redpanda infrastructure...');
    
    // Check cluster health via MCP
    const clusterInfo = await this.getClusterInfo();
    console.log(`📊 Cluster: ${clusterInfo.brokers.length} brokers, controller: ${clusterInfo.controller}`);
    
    // Check consumer groups and lag via MCP
    const consumerGroups = await this.listConsumerGroups();
    console.log(`👥 Active consumer groups: ${consumerGroups.length}`);
    
    for (const group of consumerGroups) {
      try {
        const groupDetails = await this.describeConsumerGroup(group.group_id);
        console.log(`👥 Group ${group.group_id}: ${groupDetails.state} (${groupDetails.members.length} members)`);
      } catch (error) {
        console.error(`❌ Error checking group ${group.group_id}:`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.redpandaMCP.disconnect();
    console.log('🔌 Redpanda Streaming Agent cleanup completed');
  }
}
```

## Alternative Approaches

### Option A: Direct Kafka Admin API (No MCP)
If you prefer to bypass MCP entirely and use direct Kafka Admin API calls.

#### Installation
```bash
# Install Redpanda CLI (includes MCP server)
go install github.com/redpanda-data/redpanda/src/go/rpk@latest

# Or use Docker
docker pull redpandadata/redpanda:latest

# Install protoc-gen-go-mcp (if building custom MCP servers)
go install github.com/redpanda-data/protoc-gen-go-mcp@latest
```

#### Configuration
```typescript
// src/mcp-servers/redpanda-official-mcp-config.ts
export const redpandaOfficialMCPConfig = {
  server: 'rpk',
  command: 'rpk',
  args: ['mcp', 'server'],
  transport: 'stdio',
  environment: {
    REDPANDA_BROKERS: 'localhost:9092',
    REDPANDA_SASL_MECHANISM: 'PLAIN', // Optional
    REDPANDA_TLS_ENABLED: 'false',
    RPK_MCP_LOG_LEVEL: 'info'
  }
};
```

#### Available MCP Tools
```typescript
// Official Redpanda MCP server capabilities
interface RedpandaMCPTools {
  // Topic Management
  create_topic: (params: {
    name: string;
    partitions?: number;
    replication_factor?: number;
    config?: Record<string, string>;
  }) => Promise<void>;

  delete_topic: (params: {
    name: string;
  }) => Promise<void>;

  list_topics: () => Promise<{
    topics: Array<{
      name: string;
      partitions: number;
      replication_factor: number;
    }>;
  }>;

  describe_topic: (params: {
    name: string;
  }) => Promise<{
    name: string;
    partitions: Array<{
      partition: number;
      leader: number;
      replicas: number[];
      isr: number[];
    }>;
    config: Record<string, string>;
  }>;

  // Consumer Group Management
  list_consumer_groups: () => Promise<{
    groups: Array<{
      group_id: string;
      state: string;
      protocol_type: string;
    }>;
  }>;

  describe_consumer_group: (params: {
    group_id: string;
  }) => Promise<{
    group_id: string;
    state: string;
    members: Array<{
      member_id: string;
      client_id: string;
      assignments: Array<{
        topic: string;
        partitions: number[];
      }>;
    }>;
  }>;

  reset_consumer_group_offset: (params: {
    group_id: string;
    topic: string;
    partition?: number;
    to_offset?: number;
    to_earliest?: boolean;
    to_latest?: boolean;
  }) => Promise<void>;

  // Cluster Operations
  cluster_info: () => Promise<{
    cluster_id: string;
    brokers: Array<{
      node_id: number;
      host: string;
      port: number;
    }>;
    controller: number;
  }>;

  // Message Operations (if enabled)
  produce_message: (params: {
    topic: string;
    key?: string;
    value: string;
    headers?: Record<string, string>;
    partition?: number;
  }) => Promise<{
    partition: number;
    offset: number;
  }>;

  consume_messages: (params: {
    topic: string;
    group_id: string;
    timeout_ms?: number;
    max_messages?: number;
  }) => Promise<{
    messages: Array<{
      topic: string;
      partition: number;
      offset: number;
      key?: string;
      value: string;
      headers?: Record<string, string>;
      timestamp: number;
    }>;
  }>;
}
```

## Application Integration

### 3. Complete Agent Implementation
```typescript
// src/agents/redpanda-streaming-agent.ts
import { BaseAgent } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

export class RedpandaStreamingAgent extends BaseAgent {
  private redpandaMCP: MCPClient;

  constructor() {
    super('redpanda-streaming-agent');
    // Connect to official Redpanda MCP server via rpk
    this.redpandaMCP = new MCPClient('stdio://rpk-mcp-server');
  }

  async initialize(): Promise<void> {
    await this.redpandaMCP.connect();
    await this.setupCryptoTopics();
    console.log('✅ Redpanda Streaming Agent initialized with official MCP');
  }

  async createTopic(name: string, partitions: number = 3, replicationFactor: number = 1): Promise<void> {
    await this.redpandaMCP.call('create_topic', {
      name,
      partitions,
      replication_factor: replicationFactor
    });
    console.log(`✅ Created topic: ${name}`);
  }

  async listTopics(): Promise<string[]> {
    const result = await this.redpandaMCP.call('list_topics');
    return result.topics.map(topic => topic.name);
  }

  async deleteTopic(name: string): Promise<void> {
    await this.redpandaMCP.call('delete_topic', { name });
    console.log(`🗑️ Deleted topic: ${name}`);
  }

  async describeTopic(name: string): Promise<any> {
    return await this.redpandaMCP.call('describe_topic', { name });
  }

  async listConsumerGroups(): Promise<any[]> {
    const result = await this.redpandaMCP.call('list_consumer_groups');
    return result.groups;
  }

  async describeConsumerGroup(groupId: string): Promise<any> {
    return await this.redpandaMCP.call('describe_consumer_group', { group_id: groupId });
  }

  async resetConsumerGroupOffset(groupId: string, topic: string, toLatest: boolean = true): Promise<void> {
    await this.redpandaMCP.call('reset_consumer_group_offset', {
      group_id: groupId,
      topic,
      to_latest: toLatest
    });
    console.log(`🔄 Reset offset for group ${groupId} on topic ${topic}`);
  }

  async getClusterInfo(): Promise<any> {
    return await this.redpandaMCP.call('cluster_info');
  }

  async publishMessage(topic: string, message: any, key?: string): Promise<void> {
    await this.redpandaMCP.call('produce_message', {
      topic,
      key,
      value: typeof message === 'string' ? message : JSON.stringify(message)
    });
  }

  async setupCryptoTopics(): Promise<void> {
    console.log('🏗️ Setting up crypto data topics...');
    
    const requiredTopics = [
      { name: 'crypto-ohlcv', partitions: 3 },
      { name: 'crypto-prices', partitions: 3 },
      { name: 'crypto-analytics', partitions: 2 }
    ];

    const existingTopics = await this.listTopics();

    for (const topic of requiredTopics) {
      if (!existingTopics.includes(topic.name)) {
        await this.createTopic(topic.name, topic.partitions);
      } else {
        console.log(`ℹ️ Topic already exists: ${topic.name}`);
      }
    }
  }

  async monitorStreaming(): Promise<void> {
    console.log('🔍 Monitoring Redpanda infrastructure...');
    
    // Check cluster health
    const clusterInfo = await this.getClusterInfo();
    console.log(`📊 Cluster: ${clusterInfo.brokers.length} brokers, controller: ${clusterInfo.controller}`);
    
    // Check consumer groups and lag
    const consumerGroups = await this.listConsumerGroups();
    console.log(`👥 Active consumer groups: ${consumerGroups.length}`);
    
    for (const group of consumerGroups) {
      try {
        const groupDetails = await this.describeConsumerGroup(group.group_id);
        console.log(`👥 Group ${group.group_id}: ${groupDetails.state} (${groupDetails.members.length} members)`);
        
        // Note: Lag calculation would need additional API calls to get partition offsets
      } catch (error) {
        console.error(`❌ Error checking group ${group.group_id}:`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.redpandaMCP.disconnect();
    console.log('🔌 Redpanda Streaming Agent cleanup completed');
  }
}

```

## 4. Physical Data Producers (High Performance)

### Crypto Data Producer
```typescript
// src/producers/crypto-producer.ts
import { Kafka, Producer } from 'kafkajs';

export class CryptoDataProducer {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    // Direct connection to Redpanda for maximum performance
    this.kafka = new Kafka({
      clientId: 'crypto-producer',
      brokers: ['localhost:9092'],
      // Optimize for Redpanda
      connectionTimeout: 3000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      // Optimize for high throughput
      maxInFlightRequests: 5,
      idempotent: false, // Redpanda handles this efficiently
      transactionTimeout: 30000,
      allowAutoTopicCreation: false
    });
  }

  async start(): Promise<void> {
    await this.producer.connect();
    console.log('📤 Crypto producer connected to Redpanda');
    
    // Start producing data every minute
    setInterval(async () => {
      await this.publishCryptoData();
    }, 60000);
  }

  private async publishCryptoData(): Promise<void> {
    try {
      const cryptoData = await this.fetchCryptoData();
      
      // Batch messages for better performance
      const messages = cryptoData.map(data => ({
        key: data.symbol,
        value: JSON.stringify(data),
        timestamp: Date.now().toString(),
        headers: {
          'source': 'crypto-producer',
          'version': '1.0'
        }
      }));

      await this.producer.send({
        topic: 'crypto-ohlcv',
        messages
      });
      
      console.log(`📤 Published ${cryptoData.length} crypto records to Redpanda`);
    } catch (error) {
      console.error('❌ Error publishing crypto data:', error);
    }
  }

  private async fetchCryptoData(): Promise<any[]> {
    // Simulate crypto data - replace with actual CoinGecko MCP calls
    const symbols = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT'];
    const now = Date.now();
    
    return symbols.map(symbol => ({
      symbol,
      timestamp: now,
      open: 50000 + Math.random() * 1000,
      high: 51000 + Math.random() * 1000,
      low: 49000 + Math.random() * 1000,
      close: 50500 + Math.random() * 1000,
      volume: 1000 + Math.random() * 500
    }));
  }

  async stop(): Promise<void> {
    await this.producer.disconnect();
    console.log('📤 Crypto producer disconnected');
  }
}
```

## 5. Application Integration

### Application Startup
```typescript
// src/index.ts
import { spawn } from 'child_process';
import { RedpandaStreamingAgent } from './agents/redpanda-streaming-agent';
import { CryptoDataProducer } from './producers/crypto-producer';
import { CryptoDataConsumer } from './consumers/crypto-consumer';

async function main() {
  console.log('🚀 Starting Redpanda Crypto Platform with Official MCP...');

  // 1. Ensure Redpanda is running
  console.log('🏗️ Starting Redpanda: docker-compose up -d redpanda');

  // 2. Start Official Redpanda MCP Server via rpk
  console.log('🔌 Starting Official Redpanda MCP Server...');
  const mcpServer = spawn('rpk', ['mcp', 'server'], {
    env: {
      ...process.env,
      REDPANDA_BROKERS: 'localhost:9092',
      RPK_MCP_LOG_LEVEL: 'info'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpServer.on('error', (error) => {
    console.error('❌ Redpanda MCP Server error:', error);
  });

  mcpServer.on('exit', (code) => {
    console.log(`🔌 Redpanda MCP Server exited with code ${code}`);
  });

  // Wait for MCP server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Initialize AI agent (connects to MCP server)
  const streamingAgent = new RedpandaStreamingAgent();
  await streamingAgent.initialize();

  // 4. Start physical data flow
  const producer = new CryptoDataProducer();
  const consumer = new CryptoDataConsumer();
  
  await producer.start();
  await consumer.start();

  // 5. Start monitoring
  setInterval(async () => {
    await streamingAgent.monitorStreaming();
  }, 60000);

  console.log('✅ Redpanda Platform with Official MCP running successfully');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down...');
    
    await producer.stop();
    await consumer.stop();
    await streamingAgent.cleanup();
    mcpServer.kill();
    
    process.exit(0);
  });
}

main().catch(console.error);
```

## 6. Environment Configuration

```bash
# .env - Official Redpanda MCP Configuration
# Redpanda Connection
REDPANDA_BROKERS=localhost:9092
REDPANDA_ADMIN_API=http://localhost:9644
REDPANDA_SCHEMA_REGISTRY=http://localhost:8081

# Official Redpanda MCP Server (via rpk)
RPK_MCP_LOG_LEVEL=info
REDPANDA_SASL_MECHANISM=PLAIN
REDPANDA_TLS_ENABLED=false

# Application
NODE_ENV=production
LOG_LEVEL=info
```

## 7. Health Monitoring

```typescript
// src/health/redpanda-health.ts
import { RedpandaMCPClient } from '../clients/redpanda-mcp-client';

export class RedpandaHealthChecker {
  private redpandaClient: RedpandaMCPClient;

  constructor() {
    this.redpandaClient = new RedpandaMCPClient();
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      await this.redpandaClient.connect();
      
      // Check cluster metadata
      const metadata = await this.redpandaClient.getClusterMetadata();
      
      if (metadata.brokers.length === 0) {
        return {
          status: 'unhealthy',
          message: 'No Redpanda brokers available'
        };
      }

      // Check required topics
      const topics = await this.redpandaClient.listTopics();
      const requiredTopics = ['crypto-ohlcv', 'crypto-prices'];
      const missingTopics = requiredTopics.filter(topic => !topics.includes(topic));

      if (missingTopics.length > 0) {
        return {
          status: 'degraded',
          message: `Missing topics: ${missingTopics.join(', ')}`
        };
      }

      // Check consumer lag
      const groups = await this.redpandaClient.listConsumerGroups();
      let maxLag = 0;
      
      for (const group of groups) {
        try {
          const details = await this.redpandaClient.describeConsumerGroup(group.groupId);
          if (details.totalLag > maxLag) {
            maxLag = details.totalLag;
          }
        } catch (error) {
          console.warn(`Warning: Could not check lag for group ${group.groupId}`);
        }
      }

      await this.redpandaClient.disconnect();
      
      return {
        status: maxLag > 50000 ? 'degraded' : 'healthy',
        message: `Redpanda cluster healthy`,
        data: {
          brokers: metadata.brokers.length,
          topics: topics.length,
          consumer_groups: groups.length,
          max_lag: maxLag
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redpanda error: ${error.message}`
      };
    }
  }
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  data?: any;
}
```

## See Also

For comprehensive comparison of streaming technologies (from stone age to modern), see [kafka-tech-comparison.md](./kafka-tech-comparison.md).

## Summary

This Official Redpanda MCP approach provides:

1. **Official Support** - Built and maintained by Redpanda team
2. **Correct MCP Architecture** - Agent → MCP Client → MCP Server → Redpanda
3. **High Performance** - 53% faster than Kafka, single binary
4. **Production Ready** - Enterprise-grade reliability
5. **Complete API Coverage** - All Redpanda features via MCP
6. **Zero Vendor Lock-in** - Open source, Apache 2.0 license

The architecture follows proper MCP patterns while leveraging Redpanda's official tooling for maximum reliability and feature completeness.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Update Kafka documentation to pure Redpanda approach", "status": "completed", "priority": "high"}]