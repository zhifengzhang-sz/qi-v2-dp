# Redpanda Topic Design and Management (Layer 2)

## Overview

This guide covers how to design, create, and manage Redpanda topics for the QiCore cryptocurrency data platform. Topics are the fundamental unit of data organization in Redpanda/Kafka streaming systems.

**Architecture Context**: This is a **Layer 2** concern - topics are designed and managed by actors based on DSL requirements, not by Layer 1 infrastructure.

## Layer 1 vs Layer 2 vs MCP Server Approaches

### **Layer 1 (Base Infrastructure)**
- **Responsibility**: Provides basic Redpanda client connection and topic creation primitives
- **Files**: `lib/src/base/streaming/redpanda/`
- **What it does**: Raw Kafka/Redpanda client operations, basic topic management
- **What it doesn't do**: Business logic, schema design, exchange-specific routing

### **Layer 2 (Actor System)**  
- **Responsibility**: Defines topic structure based on DSL requirements and business needs
- **Files**: `lib/src/actors/sources/redpanda/`, `lib/src/actors/targets/redpanda/`
- **What it does**: Exchange-aware topic design, schema-driven topic creation, business logic routing
- **What it doesn't do**: Low-level client management (delegates to Layer 1)

### **MCP Server Approach**
- **Responsibility**: AI agent control over topic management through MCP protocol
- **Files**: `lib/src/actors/sources/redpanda-mcp/`, `lib/src/actors/targets/redpanda-mcp/`
- **What it does**: Dynamic topic creation via MCP tools, AI-controlled routing decisions
- **What it doesn't do**: Manual topic configuration (everything through MCP interface)

## Choosing the Right Approach

### **Use Layer 1 When:**
- Building custom streaming infrastructure
- Need direct Kafka/Redpanda client control
- Implementing new base functionality
- **Example**: Creating a custom topic manager utility

### **Use Layer 2 Actors When:**
- Implementing business logic with streaming
- Need exchange-aware topic routing
- Building data processing pipelines
- **Example**: Publishing crypto prices to exchange-specific topics

### **Use MCP Server When:**
- Need AI agent control over topic management
- Want dynamic, decision-based topic creation
- Building external tool integration
- **Example**: AI agent deciding which topics to create based on market conditions

## Topic Design Principles

### 1. Exchange-Aware Topic Architecture

All topics follow an exchange-aware naming convention to support multi-exchange data processing:

```
{data-type}-{exchange-id}
```

**Examples:**
- `crypto-prices-binance`
- `crypto-prices-coinbase`
- `crypto-ohlcv-kraken`
- `market-analytics-global`

### 2. Topic Categories

#### Core Data Topics

| Topic Pattern | Purpose | Partition Key | Retention |
|---------------|---------|---------------|-----------|
| `crypto-prices-{exchange}` | Real-time price data | `coinId` | 7 days |
| `crypto-ohlcv-{exchange}` | OHLCV candlestick data | `coinId-timeframe` | 30 days |
| `market-analytics-{scope}` | Market analytics | `timestamp` | 14 days |
| `level1-data-{exchange}` | Order book L1 data | `ticker` | 1 day |

#### Control Topics

| Topic Pattern | Purpose | Partition Key | Retention |
|---------------|---------|---------------|-----------|
| `actor-commands` | Actor control messages | `actorId` | 3 days |
| `system-events` | System monitoring | `eventType` | 7 days |
| `mcp-requests` | MCP server requests | `clientId` | 1 day |

### 3. Partitioning Strategy

#### Crypto Prices Partitioning
```bash
# Partition by coinId for parallel processing
# Example: bitcoin, ethereum, cardano each get dedicated partitions
crypto-prices-binance:
  - Partition 0: bitcoin, litecoin, monero (hash % 8 == 0)
  - Partition 1: ethereum, cardano, solana (hash % 8 == 1)
  - ... 8 partitions total
```

#### OHLCV Data Partitioning
```bash
# Partition by coinId-timeframe combination
crypto-ohlcv-binance:
  - Partition 0: bitcoin-1m, bitcoin-5m, bitcoin-1h
  - Partition 1: ethereum-1m, ethereum-5m, ethereum-1h
  - ... based on coin popularity
```

## Topic Configuration

### 1. Standard Topic Configuration

```typescript
// lib/src/base/streaming/redpanda/topic-config.ts
export interface TopicConfig {
  name: string;
  partitions: number;
  replicationFactor: number;
  retentionMs: number;
  cleanupPolicy: 'delete' | 'compact';
  compressionType: 'none' | 'gzip' | 'lz4' | 'snappy' | 'zstd';
  maxMessageBytes: number;
}

export const DEFAULT_TOPIC_CONFIGS: Record<string, TopicConfig> = {
  'crypto-prices': {
    name: 'crypto-prices-{exchange}',
    partitions: 8,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupPolicy: 'delete',
    compressionType: 'lz4',
    maxMessageBytes: 1048576, // 1MB
  },
  'crypto-ohlcv': {
    name: 'crypto-ohlcv-{exchange}',
    partitions: 12,
    replicationFactor: 3,
    retentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupPolicy: 'delete',
    compressionType: 'lz4',
    maxMessageBytes: 1048576,
  },
  'market-analytics': {
    name: 'market-analytics-{scope}',
    partitions: 4,
    replicationFactor: 3,
    retentionMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    cleanupPolicy: 'delete',
    compressionType: 'gzip',
    maxMessageBytes: 2097152, // 2MB
  }
};
```

### 2. Topic Creation Script

```bash
#!/bin/bash
# scripts/create-topics.sh

REDPANDA_BROKERS="localhost:9092"
EXCHANGES=("binance" "coinbase" "kraken" "bitstamp")

# Create exchange-specific price topics
for exchange in "${EXCHANGES[@]}"; do
  echo "Creating crypto-prices-${exchange} topic..."
  rpk topic create crypto-prices-${exchange} \
    --brokers ${REDPANDA_BROKERS} \
    --partitions 8 \
    --replicas 3 \
    --config retention.ms=604800000 \
    --config compression.type=lz4 \
    --config cleanup.policy=delete
done

# Create OHLCV topics
for exchange in "${EXCHANGES[@]}"; do
  echo "Creating crypto-ohlcv-${exchange} topic..."
  rpk topic create crypto-ohlcv-${exchange} \
    --brokers ${REDPANDA_BROKERS} \
    --partitions 12 \
    --replicas 3 \
    --config retention.ms=2592000000 \
    --config compression.type=lz4
done

# Create global analytics topic
rpk topic create market-analytics-global \
  --brokers ${REDPANDA_BROKERS} \
  --partitions 4 \
  --replicas 3 \
  --config retention.ms=1209600000 \
  --config compression.type=gzip

echo "All topics created successfully!"
```

## Topic Management Operations

### 1. Dynamic Topic Management

```typescript
// lib/src/base/streaming/redpanda/topic-manager.ts
import { Admin, Kafka } from 'kafkajs';

export class RedpandaTopicManager {
  private admin: Admin;

  constructor(private kafka: Kafka) {
    this.admin = kafka.admin();
  }

  async createExchangeTopics(exchangeId: string): Promise<void> {
    const topics = [
      {
        topic: `crypto-prices-${exchangeId}`,
        numPartitions: 8,
        replicationFactor: 3,
        configEntries: [
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'lz4' },
          { name: 'cleanup.policy', value: 'delete' }
        ]
      },
      {
        topic: `crypto-ohlcv-${exchangeId}`,
        numPartitions: 12,
        replicationFactor: 3,
        configEntries: [
          { name: 'retention.ms', value: '2592000000' }, // 30 days
          { name: 'compression.type', value: 'lz4' }
        ]
      }
    ];

    await this.admin.createTopics({ topics });
  }

  async listTopics(): Promise<string[]> {
    const metadata = await this.admin.fetchTopicMetadata();
    return metadata.topics.map(topic => topic.name);
  }

  async deleteExchangeTopics(exchangeId: string): Promise<void> {
    const topics = [
      `crypto-prices-${exchangeId}`,
      `crypto-ohlcv-${exchangeId}`
    ];
    
    await this.admin.deleteTopics({ topics });
  }

  async updateTopicConfig(topic: string, config: Record<string, string>): Promise<void> {
    const configEntries = Object.entries(config).map(([name, value]) => ({ name, value }));
    
    await this.admin.alterConfigs({
      validateOnly: false,
      resources: [{
        type: 2, // TOPIC
        name: topic,
        configEntries
      }]
    });
  }
}
```

### 2. Topic Monitoring

```typescript
// lib/src/base/streaming/redpanda/topic-monitor.ts
export class TopicMonitor {
  async getTopicMetrics(topicName: string): Promise<TopicMetrics> {
    const metadata = await this.admin.fetchTopicMetadata({ topics: [topicName] });
    const offsets = await this.admin.fetchTopicOffsets(topicName);
    
    return {
      name: topicName,
      partitions: metadata.topics[0].partitions.length,
      totalMessages: this.calculateTotalMessages(offsets),
      size: await this.getTopicSize(topicName),
      lag: await this.getConsumerLag(topicName)
    };
  }

  private calculateTotalMessages(offsets: any[]): number {
    return offsets.reduce((total, partition) => {
      return total + (partition.high - partition.low);
    }, 0);
  }
}
```

## Best Practices

### 1. Topic Naming Convention

```typescript
// Good: Exchange-specific, clear purpose
'crypto-prices-binance'
'crypto-ohlcv-coinbase'
'market-analytics-global'

// Bad: Generic, unclear scope
'prices'
'data'
'crypto'
```

### 2. Partition Key Selection

```typescript
// For crypto prices - use coinId for balanced distribution
const partitionKey = message.coinId;

// For OHLCV - use coinId + timeframe for temporal locality
const partitionKey = `${message.coinId}-${message.timeframe}`;

// For market analytics - use timestamp for chronological ordering
const partitionKey = message.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
```

### 3. Message Ordering Guarantees

```typescript
// Within partition: Messages are ordered by offset
// Across partitions: No ordering guarantee

// To maintain order for a specific coin across all timeframes:
producer.send({
  topic: 'crypto-ohlcv-binance',
  messages: [{
    key: 'bitcoin', // Same key = same partition = ordered
    value: JSON.stringify(ohlcvData),
    partition: hash('bitcoin') % numPartitions
  }]
});
```

### 4. Topic Lifecycle Management

```typescript
// 1. Create topics before producers start
await topicManager.createExchangeTopics('binance');

// 2. Monitor topic health
const metrics = await topicMonitor.getTopicMetrics('crypto-prices-binance');

// 3. Scale partitions when needed (only increase, never decrease)
await topicManager.updateTopicConfig('crypto-prices-binance', {
  'retention.ms': '1209600000' // Extend to 14 days
});

// 4. Clean up deprecated topics
await topicManager.deleteExchangeTopics('deprecated-exchange');
```

## Integration with MCP Actors

### 1. MCP-Controlled Topic Creation

```typescript
// MCP Tool: create_topic
async function createTopicViaMCP(request: MCPRequest): Promise<MCPResponse> {
  const { exchangeId, topicType } = request.arguments;
  
  await topicManager.createExchangeTopics(exchangeId);
  
  return {
    content: [{
      type: "text",
      text: `Created topics for exchange: ${exchangeId}`
    }]
  };
}
```

### 2. Actor-Driven Topic Management

```typescript
// Redpanda MCP Writer automatically creates topics
export class RedpandaMCPMarketDataWriter extends BaseWriter {
  async publishPrice(data: CryptoPriceData): Promise<Result<PublishResult>> {
    const topicName = `crypto-prices-${data.exchangeId}`;
    
    // Auto-create topic if it doesn't exist
    await this.ensureTopicExists(topicName);
    
    return this.publish(topicName, data);
  }
}
```

## Monitoring and Alerting

### 1. Key Metrics to Monitor

- **Message throughput**: Messages/second per topic
- **Consumer lag**: How far behind consumers are
- **Partition distribution**: Even message distribution
- **Disk usage**: Topic size and retention compliance
- **Error rates**: Failed produce/consume operations

### 2. Alerting Thresholds

```yaml
# monitoring/alerts.yml
topics:
  crypto-prices:
    max_lag_ms: 30000      # 30 seconds
    min_throughput: 100    # Messages/minute
    max_size_gb: 10        # 10GB per topic
  
  crypto-ohlcv:
    max_lag_ms: 300000     # 5 minutes (less time-sensitive)
    min_throughput: 50     # Messages/minute
    max_size_gb: 50        # 50GB per topic
```

## Troubleshooting

### Common Issues

1. **Uneven partition distribution**
   - Check partition key selection
   - Monitor partition metrics
   - Consider repartitioning strategy

2. **High consumer lag**
   - Scale consumer instances
   - Optimize message processing
   - Check for processing bottlenecks

3. **Topic size growth**
   - Review retention policies
   - Implement compaction if appropriate
   - Monitor data generation rates

### Diagnostic Commands

```bash
# List all topics
rpk topic list

# Describe topic configuration
rpk topic describe crypto-prices-binance

# Check consumer group lag
rpk group describe crypto-price-consumers

# Monitor partition distribution
rpk topic produce crypto-prices-binance --key="test" --value="test"
```

This comprehensive guide provides the foundation for effective Redpanda topic design and management in the QiCore platform.