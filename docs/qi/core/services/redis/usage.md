# Redis Service Module
`@qi/core/services/redis`

## Overview
The Redis service module provides a comprehensive wrapper around the ioredis client, integrating with the core service infrastructure while maintaining full cache module compatibility. It manages connection lifecycle, health monitoring, and error handling with proper integration into the application's logging and error management systems.

## Key Features
- Complete ioredis client compatibility
- Service infrastructure integration
- Connection lifecycle management
- Health monitoring and reporting
- Event handling and logging
- Secure password extraction
- Retry strategy implementation
- Command timeout handling
- Key prefix support

## Configuration

### Interface Definition
```typescript
interface RedisServiceConfig {
  enabled: boolean;                // Enable/disable service
  connection: RedisConnection;     // Connection configuration
  options?: {
    keyPrefix?: string;           // Prefix for all Redis keys
    commandTimeout?: number;      // Command timeout in ms
  };
  healthCheck?: {
    enabled: boolean;             // Enable health checks
    interval: number;             // Check interval in ms
    timeout: number;              // Check timeout in ms
    retries: number;             // Number of retries
  };
}
```

### Connection Interface
```typescript
interface RedisConnection {
  getHost(): string;              // Redis host
  getPort(): number;              // Redis port
  getConnectionString(): string;  // Full connection string
  getPassword(): string;          // Redis password
  getDatabase(): string;          // Database number
  getUser(): string;             // Redis user
  getMaxRetries(): number;       // Max retry attempts
}
```

## Usage Examples

### Basic Usage
```typescript
import { RedisService } from '@qi/core/services/redis';

const service = new RedisService({
  enabled: true,
  connection: redisConnection,
  options: {
    keyPrefix: 'myapp:',
    commandTimeout: 5000
  }
});

await service.connect();
const client = service.getClient();
```

### With Health Checks
```typescript
const service = new RedisService({
  enabled: true,
  connection: redisConnection,
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    retries: 3
  }
});

await service.connect();
const isHealthy = await service.isHealthy();
```

### Direct Client Operations
```typescript
const service = new RedisService(config);
await service.connect();

const client = service.getClient();
await client.set('key', 'value');
await client.get('key');
```

## Implementation Details

### Connection Management
The service handles connection lifecycle:

1. Initialization
```typescript
this.client = new Redis({
  host: this.config.connection.getHost(),
  port: this.config.connection.getPort(),
  password: this.getPassword(),
  maxRetriesPerRequest: 3,
  keyPrefix: this.config.options?.keyPrefix,
  commandTimeout: this.config.options?.commandTimeout,
  retryStrategy: (times) => {
    const delay = Math.min(times * 1000, 3000);
    return delay;
  }
});
```

2. Event Handling
```typescript
this.client.on('connect', () => {
  logger.info('Redis connected', {
    host: this.config.connection.getHost(),
    port: this.config.connection.getPort()
  });
});

this.client.on('error', (error) => {
  logger.error('Redis error', {
    error: error.message,
    host: this.config.connection.getHost(),
    port: this.config.connection.getPort()
  });
});
```

### Health Monitoring
The service implements comprehensive health checks:

```typescript
protected async checkHealth(): Promise<HealthCheckResult> {
  if (!this.client) {
    return {
      status: "unhealthy",
      message: "Redis client not initialized",
      timestamp: new Date()
    };
  }

  try {
    const isPing = await this.client.ping() === "PONG";
    return {
      status: isPing ? "healthy" : "unhealthy",
      message: isPing ? "Redis is responsive" : "Redis ping failed",
      details: {
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort()
      },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: `Health check failed: ${error.message}`,
      timestamp: new Date()
    };
  }
}
```

### Password Management
Secure password extraction from connection strings:

```typescript
private getPassword(): string {
  const connectionString = this.config.connection.getConnectionString();
  try {
    const matches = connectionString.match(/redis:\/\/:([^@]+)@/);
    if (matches && matches[1]) {
      return decodeURIComponent(matches[1]);
    }
    const url = new URL(connectionString);
    if (url.password) {
      return decodeURIComponent(url.password);
    }
    return this.config.connection.getPassword();
  } catch {
    return this.config.connection.getPassword();
  }
}
```

## Best Practices

### Configuration
1. Always enable health checks in production
2. Set appropriate command timeouts
3. Use key prefixes to prevent conflicts
4. Configure reasonable retry limits

### Connection Management
1. Handle connection events properly
2. Implement graceful disconnection
3. Monitor connection health
4. Handle reconnection scenarios

### Error Handling
1. Use ApplicationError with proper codes
2. Log errors with context
3. Implement retry strategies
4. Handle timeout scenarios

### Health Monitoring
1. Configure appropriate check intervals
2. Set reasonable timeout values
3. Monitor health status changes
4. Handle degraded states

## Common Issues and Solutions

### Connection Issues
- Verify host and port
- Check authentication
- Validate connection string
- Monitor network stability

### Performance
- Configure command timeouts
- Set appropriate retry limits
- Use key prefixes effectively
- Monitor memory usage

### Authentication
- Secure password handling
- Connection string parsing
- ACL configuration
- SSL/TLS setup

## Testing

### Unit Tests
```typescript
describe('RedisService', () => {
  describe('initialization', () => {
    // Configuration tests
  });

  describe('connection lifecycle', () => {
    // Connect/disconnect tests
  });

  describe('health checks', () => {
    // Health monitoring tests
  });

  describe('client operations', () => {
    // Redis operations tests
  });
});
```

## Related Components
- BaseServiceClient
- MessageQueueConnection
- ServiceStatus
- HealthCheckResult
- ApplicationError

## Future Improvements
1. Cluster support
2. Enhanced monitoring
3. Circuit breaker pattern
4. Connection pooling
5. Enhanced security features

## Support and Maintenance
For issues and maintenance:
1. Check connection status
2. Verify configuration
3. Monitor health checks
4. Review error logs
5. Check Redis server status

Would you like me to elaborate on any section or provide additional examples?