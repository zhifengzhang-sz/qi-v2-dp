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
The service uses a type-safe configuration interface:

```typescript
interface RedPandaServiceConfig {
  enabled: boolean;                 // Enable/disable the service
  connection: KafkaConnection;      // Connection configuration
  clientId: string;                // Unique client identifier
  consumer?: {
    groupId: string;               // Consumer group ID
    sessionTimeout?: number;       // Session timeout in ms
    rebalanceTimeout?: number;     // Rebalance timeout in ms
    heartbeatInterval?: number;    // Heartbeat interval in ms
    maxBytesPerPartition?: number; // Max bytes per partition
    maxWaitTimeInMs?: number;      // Max wait time for fetch
  };
  producer?: {
    allowAutoTopicCreation?: boolean; // Auto-create topics
    maxInFlightRequests?: number;     // Max in-flight requests
    idempotent?: boolean;             // Enable idempotent producer
    transactionalId?: string;         // Transaction ID
    transactionTimeout?: number;      // Transaction timeout
    metadataMaxAge?: number;          // Metadata max age
  };
  healthCheck?: {
    enabled: boolean;              // Enable health checks
    interval: number;              // Check interval in ms
    timeout: number;              // Check timeout in ms
    retries: number;              // Number of retries
  };
}
```

## Usage Examples

### Basic Usage
```typescript
import { RedPandaService } from '@qi/core/services/redpanda';

// Create service instance
const service = new RedPandaService({
  enabled: true,
  connection: redpandaConnection,
  clientId: 'my-service',
  consumer: {
    groupId: 'my-consumer-group'
  }
});

// Connect to RedPanda
await service.connect();

// Get producer and consumer instances
const producer = service.getProducer();
const consumer = service.getConsumer();
```

### Producing Messages
```typescript
// Send messages to a topic
await service.send('my-topic', [
  { value: 'message-1' },
  { value: 'message-2', key: 'key-1' }
]);
```

### Consuming Messages
```typescript
// Subscribe to topics
await service.subscribe(['topic-1', 'topic-2']);

// Get consumer for manual operations
const consumer = service.getConsumer();
```

### Health Monitoring
```typescript
// Check service health
const isHealthy = await service.isHealthy();

// Get detailed health status
const health = await service.checkHealth();
console.log(health.status);    // 'healthy' or 'unhealthy'
console.log(health.details);   // Connection details
```

## Architecture

### Class Structure
- `RedPandaService`: Main service class extending `BaseServiceClient`
  - Manages Kafka client lifecycle
  - Handles producer/consumer connections
  - Implements health checks
  - Provides message operations

### Connection Management
The service manages three main components:
1. Kafka client instance
2. Producer instance
3. Consumer instance (optional)

Each component is initialized during connection and cleaned up during disconnection.

### Health Monitoring
The service implements health checks by:
1. Verifying client connection
2. Testing admin operations
3. Monitoring producer/consumer status
4. Checking broker connectivity

### Error Handling
Errors are wrapped in `ApplicationError` with specific error codes:
- `MESSAGE_QUEUE_ERROR`: Connection/operation failures
- `SERVICE_NOT_INITIALIZED`: Access before initialization
- `REDPANDA_CONFIG_INVALID`: Configuration errors
- `CONNECTION_ERROR`: Network issues
- `OPERATION_ERROR`: Message operation failures

## Best Practices

### Configuration
1. Use meaningful client and group IDs
2. Configure appropriate timeouts
3. Enable health checks in production
4. Set reasonable retry policies

### Operations
1. Always close connections properly
2. Handle reconnection scenarios
3. Monitor health status
4. Implement error handling
5. Use consumer groups for scalability

### Performance
1. Configure appropriate batch sizes
2. Use compression when beneficial
3. Set proper timeout values
4. Monitor in-flight requests
5. Use idempotent producers for reliability

## Common Issues and Solutions

### Connection Issues
- Verify broker endpoints
- Check network connectivity
- Ensure proper authentication
- Monitor connection timeouts

### Consumer Groups
- Use unique group IDs
- Handle rebalancing events
- Monitor consumer lag
- Configure appropriate timeouts

### Message Operations
- Handle send failures
- Implement retry logic
- Monitor batch operations
- Handle partition assignments

## Testing
The service includes comprehensive unit tests:
```typescript
import { describe, it, expect } from 'vitest';
import { RedPandaService } from '@qi/core/services/redpanda';

describe('RedPandaService', () => {
  // See unit test implementation for details
});
```

## Related Components
- MessageQueueConnection: Base connection interface
- BaseServiceClient: Base service implementation
- KafkaConnection: Extended connection interface
- ServiceStatus: Service status enumeration

## Future Improvements
1. Schema validation integration
2. Enhanced monitoring metrics
3. Circuit breaker implementation
4. Improved error recovery
5. Transaction support

## Support
For issues and feature requests, please:
1. Check existing documentation
2. Review common issues
3. Submit detailed bug reports
4. Contact the development team

## Contributing
1. Follow coding standards
2. Add unit tests
3. Update documentation
4. Submit pull requests