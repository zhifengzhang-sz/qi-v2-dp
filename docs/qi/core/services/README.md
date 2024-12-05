# Services Module
`@qi/core/services`

## Overview
The services module provides a comprehensive framework for managing service connections in a distributed system. It includes implementations for databases, caching, message queues, and monitoring services, all built on a common base architecture.

## Architecture

### Core Components

1. **Base Module** (`@qi/core/services/base`)
   - Provides foundation for all service implementations
   - Defines core interfaces and types
   - Manages service lifecycle
   - Implements health monitoring
   - Handles error management

2. **Configuration Module** (`@qi/core/services/config`)
   - Manages service configurations
   - Provides type-safe configuration access
   - Handles environment variables
   - Validates configuration schema
   - Generates connection strings

### Service Implementations

1. **TimescaleDB** (`@qi/core/services/timescaledb`)
   - Primary database service
   - Time-series data management
   - Sequelize ORM integration
   - Connection pooling
   - Query optimization

2. **QuestDB** (`@qi/core/services/questdb`)
   - Time-series database
   - High-performance queries
   - InfluxDB line protocol support
   - PostgreSQL wire protocol
   - HTTP REST API

3. **Redis** (`@qi/core/services/redis`)
   - Caching service
   - Key-value operations
   - Connection management
   - Health monitoring
   - Retry strategies

4. **RedPanda** (`@qi/core/services/redpanda`)
   - Message queue service
   - Kafka protocol compatibility
   - Producer/Consumer management
   - Schema registry integration
   - Message streaming

## Getting Started

### Installation
```bash
npm install @qi/core
```

### Basic Usage

```typescript
import { loadServiceConfig } from '@qi/core/services/config';
import { ServiceConnectionManager } from '@qi/core/services/base';
import { RedisService } from '@qi/core/services/redis';
import { RedPandaService } from '@qi/core/services/redpanda';

async function initializeServices() {
  // Load configuration
  const services = await loadServiceConfig({
    configPath: '/app/config/services.json',
    envPath: '/app/config/services.env'
  });

  // Initialize service manager
  const manager = new ServiceConnectionManager();

  // Initialize and register services
  const redis = new RedisService({
    enabled: true,
    connection: services.databases.redis
  });
  manager.registerService('redis', redis);

  const redpanda = new RedPandaService({
    enabled: true,
    connection: services.messageQueue,
    clientId: 'my-service'
  });
  manager.registerService('redpanda', redpanda);

  // Start all services
  await manager.connectAll();
  
  return manager;
}
```

## Configuration

### File Structure
```
config/
├── services-1.0.0.json     # Service configuration
└── services.env           # Environment variables
```

### Configuration Example
```json
{
  "type": "services",
  "version": "1.0",
  "databases": {
    "postgres": {
      "host": "timescaledb",
      "port": 5432,
      "database": "postgres",
      "user": "postgres",
      "maxConnections": 100
    },
    "redis": {
      "host": "redis",
      "port": 6379,
      "maxRetries": 3
    }
  }
}
```

## Service Management

### Health Monitoring
```typescript
const manager = await initializeServices();

// Check all services
const health = await manager.getHealthStatus();
console.log(health);
// {
//   redis: true,
//   redpanda: true
// }

// Check specific service
const redisService = manager.getService('redis');
const isHealthy = await redisService.isHealthy();
```

### Graceful Shutdown
```typescript
async function shutdown() {
  const manager = getServiceManager();
  await manager.disconnectAll();
}

process.on('SIGTERM', shutdown);
```

## Best Practices

### 1. Configuration Management
- Use environment variables for sensitive data
- Validate configurations before use
- Implement proper error handling
- Monitor service health
- Handle reconnection scenarios

### 2. Error Handling
```typescript
try {
  await service.connect();
} catch (error) {
  if (error instanceof ApplicationError) {
    logger.error('Service connection failed', {
      service: error.service,
      code: error.code,
      message: error.message
    });
  }
  // Handle recovery
}
```

### 3. Health Monitoring
```typescript
const healthCheck = {
  enabled: true,
  interval: 30000,  // 30 seconds
  timeout: 5000,    // 5 seconds
  retries: 3
};

const service = new RedisService({
  ...config,
  healthCheck
});
```

## Common Issues

### Connection Problems
1. Check network connectivity
2. Verify configuration
3. Inspect service logs
4. Check health status
5. Review error messages

### Performance Issues
1. Monitor connection pools
2. Check resource usage
3. Review query patterns
4. Optimize configurations
5. Implement caching

## Testing

### Unit Tests
```typescript
describe('ServiceManager', () => {
  let manager: ServiceConnectionManager;

  beforeEach(() => {
    manager = new ServiceConnectionManager();
  });

  it('should manage service lifecycle', async () => {
    const mockService = createMockService();
    manager.registerService('test', mockService);
    
    await manager.connectAll();
    expect(await mockService.isHealthy()).toBe(true);
  });
});
```

## Contributing

### Adding New Services
1. Extend BaseServiceClient
2. Implement required interfaces
3. Add configuration types
4. Write unit tests
5. Update documentation

### Development Setup
1. Clone repository
2. Install dependencies
3. Set up environment
4. Run test suite
5. Submit pull request

## Related Documentation
- [Base Service Module](docs/services/base.md)
- [Configuration Module](docs/services/config.md)
- [Redis Service](docs/services/redis.md)
- [RedPanda Service](docs/services/redpanda.md)
- [TimescaleDB Service](docs/services/timescaledb.md)

## Support
For issues and questions:
1. Check documentation
2. Review common issues
3. Submit detailed bug reports
4. Contact development team