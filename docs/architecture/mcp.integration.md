# MCP Integration Patterns

## Overview

This document details specific patterns for integrating Model Context Protocol (MCP) servers with streaming data infrastructure in the QiCore platform.

## MCP Server Architecture Patterns

### 1. **Stateless MCP Servers**
MCP servers should be stateless and act as adapters between AI agents and physical infrastructure.

```typescript
// Pattern: Stateless MCP server
export abstract class StatelessMCPServer extends MCPServer {
  // No instance state - all state in external systems
  abstract get tools(): Record<string, MCPTool>;
  
  // Connection management only
  protected abstract async connect(): Promise<void>;
  protected abstract async disconnect(): Promise<void>;
}
```

### 2. **Resource-Specific MCP Servers**
Each MCP server should focus on a single resource type or service.

```typescript
// Good: Focused on Kafka operations only
class KafkaMCPServer extends StatelessMCPServer {
  tools = {
    list_topics: { /* Kafka-specific */ },
    create_topic: { /* Kafka-specific */ },
    get_metadata: { /* Kafka-specific */ }
  };
}

// Avoid: Mixed responsibilities
class DataPlatformMCPServer extends StatelessMCPServer {
  tools = {
    // Don't mix Kafka, database, and API operations
    kafka_create_topic: { /* ... */ },
    db_query: { /* ... */ },
    api_fetch: { /* ... */ }
  };
}
```

### 3. **Error Handling Patterns**
```typescript
// Pattern: Consistent error handling across MCP tools
export class MCPToolError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'MCPToolError';
  }
}

// Tool implementation with error handling
async handler(params: any) {
  try {
    const result = await this.externalService.operation(params);
    return { success: true, data: result };
  } catch (error) {
    throw new MCPToolError(
      'EXTERNAL_SERVICE_ERROR',
      `Operation failed: ${error.message}`,
      { params, originalError: error }
    );
  }
}
```

## Streaming Integration Patterns

### 1. **Producer Control Pattern**
```typescript
// MCP server controls producer lifecycle
class StreamingProducerMCP extends StatelessMCPServer {
  private producers = new Map<string, Producer>();

  tools = {
    start_producer: {
      description: 'Start a data producer for a specific source',
      parameters: {
        sourceId: 'string',
        config: 'object'
      },
      handler: async (params) => {
        const producer = new CryptoDataProducer(params.config);
        await producer.start();
        this.producers.set(params.sourceId, producer);
        
        return { 
          success: true, 
          sourceId: params.sourceId,
          status: 'running'
        };
      }
    },

    stop_producer: {
      description: 'Stop a running producer',
      parameters: {
        sourceId: 'string'
      },
      handler: async (params) => {
        const producer = this.producers.get(params.sourceId);
        if (producer) {
          await producer.stop();
          this.producers.delete(params.sourceId);
          return { success: true, status: 'stopped' };
        }
        throw new MCPToolError('PRODUCER_NOT_FOUND', 'Producer not found');
      }
    },

    get_producer_status: {
      description: 'Get status of all producers',
      parameters: {},
      handler: async () => {
        const statuses = Array.from(this.producers.entries()).map(([id, producer]) => ({
          sourceId: id,
          status: producer.isRunning() ? 'running' : 'stopped',
          metrics: producer.getMetrics()
        }));
        
        return { producers: statuses };
      }
    }
  };
}
```

### 2. **Consumer Monitoring Pattern**
```typescript
// MCP server monitors consumer health and performance
class StreamingConsumerMCP extends StatelessMCPServer {
  tools = {
    get_consumer_lag: {
      description: 'Get consumer lag for all consumer groups',
      parameters: {
        topic: 'string'
      },
      handler: async (params) => {
        const admin = this.kafka.admin();
        const offsets = await admin.fetchOffsets({
          groupId: 'crypto-group',
          topic: params.topic
        });
        
        const lag = await this.calculateLag(offsets);
        return { lag, topic: params.topic };
      }
    },

    reset_consumer_offset: {
      description: 'Reset consumer offset to handle backlog',
      parameters: {
        groupId: 'string',
        topic: 'string',
        partition: 'number',
        offset: 'string' // 'earliest', 'latest', or specific offset
      },
      handler: async (params) => {
        const admin = this.kafka.admin();
        await admin.resetOffsets({
          groupId: params.groupId,
          topic: params.topic,
          partitions: [{
            partition: params.partition,
            offset: params.offset
          }]
        });
        
        return { success: true, reset: params };
      }
    }
  };
}
```

### 3. **Real-time Query Pattern**
```typescript
// MCP server provides real-time data access
class RealTimeDataMCP extends StatelessMCPServer {
  tools = {
    get_live_prices: {
      description: 'Get real-time price data',
      parameters: {
        symbols: 'array',
        timeout: 'number'
      },
      handler: async (params) => {
        const consumer = this.kafka.consumer({ 
          groupId: `live-query-${Date.now()}` 
        });
        
        await consumer.subscribe({ topic: 'crypto-ohlcv' });
        
        const prices = new Map();
        const timeout = params.timeout || 5000;
        
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            consumer.disconnect();
            resolve({ prices: Array.from(prices.values()) });
          }, timeout);
          
          consumer.run({
            eachMessage: async ({ message }) => {
              const data = JSON.parse(message.value.toString());
              if (params.symbols.includes(data.symbol)) {
                prices.set(data.symbol, data);
                
                // Return early if we have all requested symbols
                if (prices.size === params.symbols.length) {
                  clearTimeout(timer);
                  await consumer.disconnect();
                  resolve({ prices: Array.from(prices.values()) });
                }
              }
            }
          });
        });
      }
    }
  };
}
```

## Agent Integration Patterns

### 1. **Multi-MCP Agent Pattern**
```typescript
// Agent coordinates multiple MCP servers
export class DataPipelineAgent extends BaseAgent {
  private kafkaMCP: MCPClient;
  private dbMCP: MCPClient;
  private producerMCP: MCPClient;

  constructor() {
    super('data-pipeline-agent');
    this.kafkaMCP = new MCPClient('kafka-mcp-server');
    this.dbMCP = new MCPClient('timescale-mcp-server');
    this.producerMCP = new MCPClient('producer-mcp-server');
  }

  async orchestrateDataFlow(request: DataFlowRequest): Promise<void> {
    // 1. Setup infrastructure via Kafka MCP
    await this.kafkaMCP.call('create_topic', {
      name: request.topic,
      partitions: request.partitions
    });

    // 2. Start data collection via Producer MCP
    await this.producerMCP.call('start_producer', {
      sourceId: request.sourceId,
      config: request.producerConfig
    });

    // 3. Monitor data flow
    const monitoringInterval = setInterval(async () => {
      const lag = await this.kafkaMCP.call('get_consumer_lag', {
        topic: request.topic
      });
      
      if (lag.lag > request.maxLag) {
        await this.handleBacklog(request.topic, lag);
      }
    }, 30000);

    // 4. Setup cleanup
    this.registerCleanup(() => {
      clearInterval(monitoringInterval);
    });
  }

  private async handleBacklog(topic: string, lag: any): Promise<void> {
    // Scale consumers or reset offsets based on lag
    if (lag.lag > 100000) {
      await this.kafkaMCP.call('reset_consumer_offset', {
        groupId: 'crypto-group',
        topic: topic,
        partition: 0,
        offset: 'latest'
      });
    }
  }
}
```

### 2. **Event-Driven Agent Pattern**
```typescript
// Agent responds to streaming events
export class StreamingEventAgent extends BaseAgent {
  async handleStreamingEvent(event: StreamingEvent): Promise<void> {
    switch (event.type) {
      case 'CONSUMER_LAG':
        await this.handleConsumerLag(event);
        break;
      case 'PRODUCER_FAILURE':
        await this.handleProducerFailure(event);
        break;
      case 'DATA_ANOMALY':
        await this.handleDataAnomaly(event);
        break;
    }
  }

  private async handleConsumerLag(event: ConsumerLagEvent): Promise<void> {
    // Use MCP to diagnose and fix lag
    const metadata = await this.kafkaMCP.call('get_topic_metadata', {
      topic: event.topic
    });

    if (metadata.partitions.length < event.recommendedPartitions) {
      await this.kafkaMCP.call('add_partitions', {
        topic: event.topic,
        count: event.recommendedPartitions
      });
    }
  }
}
```

## Configuration Patterns

### 1. **MCP Server Registry**
```typescript
// Central registry for MCP servers
export class MCPServerRegistry {
  private servers = new Map<string, MCPServer>();
  
  register(name: string, server: MCPServer): void {
    this.servers.set(name, server);
  }

  async startAll(): Promise<void> {
    for (const [name, server] of this.servers) {
      try {
        await server.initialize();
        await server.start();
        console.log(`Started MCP server: ${name}`);
      } catch (error) {
        console.error(`Failed to start MCP server ${name}:`, error);
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const [name, server] of this.servers) {
      try {
        await server.stop();
        await server.cleanup();
        console.log(`Stopped MCP server: ${name}`);
      } catch (error) {
        console.error(`Failed to stop MCP server ${name}:`, error);
      }
    }
  }

  get(name: string): MCPServer | undefined {
    return this.servers.get(name);
  }
}
```

### 2. **Environment-based Configuration**
```typescript
// Configuration for MCP servers
export interface MCPServerConfig {
  name: string;
  enabled: boolean;
  port?: number;
  transport: 'stdio' | 'http' | 'sse';
  authentication?: {
    type: 'none' | 'api_key' | 'oauth';
    config: any;
  };
}

export class MCPServerFactory {
  static createFromConfig(config: MCPServerConfig): MCPServer {
    switch (config.name) {
      case 'kafka':
        return new KafkaMCPServer();
      case 'timescale':
        return new TimescaleMCPServer();
      case 'crypto-compare':
        return new CryptoCompareMCPServer();
      default:
        throw new Error(`Unknown MCP server: ${config.name}`);
    }
  }

  static async startFromEnvironment(): Promise<MCPServerRegistry> {
    const registry = new MCPServerRegistry();
    const configs = this.loadConfigFromEnv();

    for (const config of configs) {
      if (config.enabled) {
        const server = this.createFromConfig(config);
        registry.register(config.name, server);
      }
    }

    await registry.startAll();
    return registry;
  }

  private static loadConfigFromEnv(): MCPServerConfig[] {
    return [
      {
        name: 'kafka',
        enabled: process.env.KAFKA_MCP_ENABLED === 'true',
        transport: 'http',
        port: parseInt(process.env.KAFKA_MCP_PORT || '8081')
      },
      {
        name: 'timescale',
        enabled: process.env.TIMESCALE_MCP_ENABLED === 'true',
        transport: 'http',
        port: parseInt(process.env.TIMESCALE_MCP_PORT || '8082')
      }
    ];
  }
}
```

## Testing Patterns

### 1. **MCP Server Testing**
```typescript
// Testing MCP servers with mock infrastructure
describe('KafkaMCPServer', () => {
  let server: KafkaMCPServer;
  let mockKafka: jest.Mocked<Kafka>;

  beforeEach(() => {
    mockKafka = createMockKafka();
    server = new KafkaMCPServer();
    (server as any).kafka = mockKafka;
  });

  it('should create topic successfully', async () => {
    const result = await server.tools.create_topic.handler({
      name: 'test-topic',
      partitions: 3
    });

    expect(result.success).toBe(true);
    expect(mockKafka.admin().createTopics).toHaveBeenCalledWith({
      topics: [{
        topic: 'test-topic',
        numPartitions: 3,
        replicationFactor: 1
      }]
    });
  });
});
```

### 2. **Integration Testing**
```typescript
// End-to-end testing with real infrastructure
describe('Data Streaming Integration', () => {
  let registry: MCPServerRegistry;
  let testContainer: TestContainer;

  beforeAll(async () => {
    // Start test containers
    testContainer = await startTestContainers([
      'redpanda',
      'timescaledb'
    ]);

    // Start MCP servers
    registry = await MCPServerFactory.startFromEnvironment();
  });

  afterAll(async () => {
    await registry.stopAll();
    await testContainer.stop();
  });

  it('should handle complete data flow', async () => {
    const agent = new DataPipelineAgent();
    
    await agent.orchestrateDataFlow({
      topic: 'test-crypto-data',
      sourceId: 'test-source',
      partitions: 1,
      maxLag: 1000,
      producerConfig: { /* test config */ }
    });

    // Verify data flow
    const lag = await agent.kafkaMCP.call('get_consumer_lag', {
      topic: 'test-crypto-data'
    });

    expect(lag.lag).toBeLessThan(100);
  });
});
```

## Best Practices

### 1. **MCP Server Design**
- Keep servers stateless and focused on single resources
- Use consistent error handling across all tools
- Implement proper timeout and retry mechanisms
- Provide comprehensive tool descriptions for AI agents

### 2. **Streaming Integration**
- Use MCP for control operations, not data flow
- Implement proper monitoring and alerting via MCP
- Design for high availability and fault tolerance
- Separate concerns: data flow vs. control flow

### 3. **Agent Orchestration**
- Use multiple specialized MCP clients in agents
- Implement event-driven responses to streaming events
- Design for observability and debugging
- Handle partial failures gracefully

### 4. **Configuration Management**
- Use environment-based configuration
- Implement service discovery for MCP servers
- Support dynamic reconfiguration where possible
- Maintain clear separation between infrastructure and application config

This integration pattern ensures that MCP servers provide clean, AI-friendly interfaces to complex streaming infrastructure while maintaining high performance and reliability.