# RedPanda Service Module
`@qi/core/services/redpanda`

## Overview
The RedPanda service provides a wrapper around RedPanda using the Kafka protocol, enabling message streaming capabilities in a distributed system. It implements the base service client interface and provides robust message queue functionality with health monitoring.

## Key Features
- Full Kafka protocol compatibility
- Message production and consumption
- Topic management
- Consumer group coordination
- Schema registry integration
- Health monitoring
- Configurable compression
- Batch processing
- Error handling and recovery

## Installation
The service is part of the core package and requires the following dependencies:
```json
{
  "dependencies": {
    "kafkajs": "^2.0.0"
  }
}
```

## Configuration
Service initialization can be done in two ways:

### Method 1: Using the initialize function
```typescript
import { initialize } from '@qi/core/services/redpanda';

const options = {
  consumer: {
    groupId: 'my-consumer-group',
    sessionTimeout: 30000
  },
  producer: {
    allowAutoTopicCreation: true
  }
};

const service = await initialize(options);
```

### Method 2: Direct instantiation with RedPandaConfig
```typescript
interface RedPandaConfig {
  type: "redpanda";
  version: string;
  kafka: {
    brokers: string[];
    clientId: string;
    connectionTimeout?: number;
  };
  producer?: Partial<ProducerConfig>;
  consumer?: Partial<ConsumerConfig>;
}

const config: RedPandaConfig = {
  type: "redpanda",
  version: "1.0",
  kafka: {
    brokers: [brokerEndpoint],
    clientId: "my-service"
  }
};

const service = new RedPandaService(config);
await service.connect();
```

## Usage Examples

### Basic Usage
```typescript
// Get an initialized service instance
const service = getService();

// Get producer and consumer instances
const producer = service.getProducer();
const consumer = service.getConsumer();
```

### Producing Messages
```typescript
const producer = service.getProducer();
await producer.send({
  topic: 'my-topic',
  messages: [
    { value: 'message-1' },
    { value: 'message-2', key: 'key-1' }
  ]
});
```

### Consuming Messages
```typescript
const consumer = service.getConsumer();
await consumer.subscribe({ topic: 'my-topic' });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      topic,
      partition,
      value: message.value.toString()
    });
  }
});
```

### Cleanup
```typescript
// Close connections
await close();
```

## Error Handling
The service uses ApplicationError with specific error codes:
- `CONFIGURATION_ERROR`: Missing or invalid configuration
- `INITIALIZATION_ERROR`: Service initialization failures
- `SERVICE_NOT_INITIALIZED`: Access before initialization
- `MESSAGE_QUEUE_ERROR`: Connection/operation failures
- `CONNECTION_ERROR`: Network issues
- `OPERATION_ERROR`: Message operation failures

## Best Practices

### Configuration
1. Use meaningful client and group IDs
2. Configure appropriate timeouts
3. Set reasonable retry policies
4. Use environment variables for sensitive values

### Operations
1. Always call initialize() before getService()
2. Handle reconnection scenarios
3. Implement error handling
4. Use consumer groups for scalability
5. Close connections properly using close()

### Performance
1. Configure appropriate batch sizes
2. Use compression when beneficial
3. Set proper timeout values
4. Monitor in-flight requests
5. Use idempotent producers for reliability

## Testing

### Setup
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedPandaService } from '@qi/core/services/redpanda';

// Mock dependencies
vi.mock('@qi/core/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock connection configuration
const mockConnection = {
  getBrokerEndpoint: vi.fn(() => 'localhost:9092'),
  getSchemaRegistryEndpoint: vi.fn(() => 'http://localhost:8081'),
  getSSLConfig: vi.fn(() => ({})),
  getSASLConfig: vi.fn(() => undefined),
  getConnectionTimeout: vi.fn(() => 5000),
  getRequestTimeout: vi.fn(() => 30000),
};

const defaultConfig = {
  enabled: true,
  connection: mockConnection,
  clientId: 'test-client',
  consumer: {
    groupId: 'test-group'
  }
};
```

### Test Cases
```typescript
describe('RedPandaService', () => {
  let service: RedPandaService;

  beforeEach(() => {
    service = new RedPandaService(defaultConfig);
  });

  // Test initialization
  it('creates service with correct config', () => {
    expect(service.isEnabled()).toBe(true);
  });

  // Test connections
  it('establishes connection successfully', async () => {
    await service.connect();
    expect(producer.connect).toHaveBeenCalled();
    expect(consumer.connect).toHaveBeenCalled();
  });

  // Test health checks
  it('returns healthy when connected', async () => {
    await service.connect();
    const health = await service.checkHealth();
    expect(health.status).toBe('healthy');
  });

  // Test message operations
  it('sends messages successfully', async () => {
    await service.connect();
    await service.send('test-topic', [{ value: 'test-message' }]);
    expect(producer.send).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'test-topic'
    }));
  });

  // Test error handling
  it('handles connection failures', async () => {
    producer.connect.mockRejectedValueOnce(new Error());
    await expect(service.connect()).rejects.toThrow(ApplicationError);
  });
});
```

### Key Test Areas
1. Service initialization and configuration
2. Connection lifecycle (connect/disconnect)
3. Health check functionality
4. Message operations (send/subscribe)
5. Error handling scenarios

### Mocking Strategies
1. External dependencies (logger, config)
2. Kafka client and its components
3. Network operations
4. Connection configurations

### Test Coverage
Ensure tests cover:
- Success scenarios
- Error conditions
- Connection states
- Message operations
- Health monitoring
- Configuration validation

## Support
For issues and feature requests:
1. Check existing documentation
2. Review common issues
3. Submit detailed bug reports
4. Contact the development team

## Contributing
1. Follow coding standards
2. Add unit tests
3. Update documentation
4. Submit pull requests