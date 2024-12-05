# Services Base Module
`@qi/core/services/base`

## Overview
The services base module provides the foundation for all service implementations in the system. It defines core interfaces, types, and base classes that ensure consistent behavior and proper lifecycle management across different service types.

## Components

### 1. Base Service Types (`types.ts`)
Core type definitions for all services.

#### ServiceConfig
```typescript
interface ServiceConfig {
  enabled: boolean;                // Enable/disable service
  healthCheck?: {
    enabled: boolean;             // Enable health checks
    interval: number;            // Check interval in ms
    timeout: number;            // Check timeout in ms
    retries: number;           // Number of retries
  };
}
```

#### ServiceStatus
```typescript
enum ServiceStatus {
  INITIALIZING = "initializing",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error"
}
```

#### HealthCheckResult
```typescript
interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
```

#### ConnectionConfig
```typescript
interface ConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}
```

### 2. Base Service Client (`client.ts`)
Abstract base class implementing common service functionality.

#### Key Features
- Lifecycle management
- Health monitoring
- Configuration validation
- Status tracking
- Error handling

#### Implementation
```typescript
abstract class BaseServiceClient<T extends ServiceConfig> {
  protected status: ServiceStatus;
  protected lastHealthCheck?: HealthCheckResult;

  constructor(protected config: T, protected serviceName: string) {
    this.validateConfig();
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  protected abstract checkHealth(): Promise<HealthCheckResult>;

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async isHealthy(): Promise<boolean>;
  getConfig(): T;
  protected setStatus(status: ServiceStatus): void;
  protected validateConfig(): void;
  protected startHealthCheck(): Promise<void>;
}
```

### 3. Service Connection Manager (`manager.ts`)
Manages multiple service connections centrally.

#### Features
- Service registration
- Connection lifecycle coordination
- Health status monitoring
- Coordinated startup/shutdown

```typescript
class ServiceConnectionManager {
  private services: Map<string, ServiceClient<ServiceConfig>>;

  registerService(name: string, service: ServiceClient<ServiceConfig>): void;
  async connectAll(): Promise<void>;
  async disconnectAll(): Promise<void>;
  async getHealthStatus(): Promise<Record<string, boolean>>;
}
```

## Usage Examples

### 1. Implementing a Custom Service
```typescript
class MyService extends BaseServiceClient<MyConfig> {
  constructor(config: MyConfig) {
    super(config, 'MyService');
  }

  async connect(): Promise<void> {
    if (!this.isEnabled()) return;
    
    try {
      // Connection logic
      this.setStatus(ServiceStatus.CONNECTED);
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError('Connection failed', 'MyService', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Disconnection logic
      this.setStatus(ServiceStatus.DISCONNECTED);
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError('Disconnection failed', 'MyService', error);
    }
  }

  protected async checkHealth(): Promise<HealthCheckResult> {
    // Health check implementation
  }
}
```

### 2. Using Service Manager
```typescript
const manager = new ServiceConnectionManager();

// Register services
manager.registerService('redis', redisService);
manager.registerService('db', dbService);

// Start all services
await manager.connectAll();

// Monitor health
const status = await manager.getHealthStatus();
```

## Health Check Implementation
Health checks follow a standardized pattern:

1. Basic Availability
```typescript
protected async checkHealth(): Promise<HealthCheckResult> {
  if (!this.isConnected()) {
    return {
      status: "unhealthy",
      message: "Service not connected",
      timestamp: new Date()
    };
  }
}
```

2. Detailed Health Check
```typescript
protected async checkHealth(): Promise<HealthCheckResult> {
  try {
    // Perform service-specific check
    await this.checkConnection();
    
    return {
      status: "healthy",
      message: "Service is responsive",
      details: {
        // Service-specific metrics
      },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date()
    };
  }
}
```

## Error Handling
The module provides a standardized error handling approach:

```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
```

Common error scenarios:
1. Configuration validation
2. Connection failures
3. Operation timeouts
4. Health check failures

## Best Practices

### 1. Configuration Management
- Validate all required fields
- Provide sensible defaults
- Document configuration options
- Handle environmental overrides

### 2. Health Monitoring
- Implement meaningful health checks
- Set appropriate check intervals
- Include relevant metrics
- Handle transient failures

### 3. Error Handling
- Use appropriate error types
- Include contextual information
- Log errors properly
- Handle cleanup on failures

### 4. Status Management
- Track state transitions
- Update status promptly
- Log status changes
- Handle edge cases

## Implementation Guidelines

### 1. Service Creation
1. Extend BaseServiceClient
2. Define service-specific config
3. Implement required methods
4. Add custom functionality

### 2. Connection Management
1. Handle connection lifecycle
2. Implement proper cleanup
3. Track connection state
4. Handle reconnection

### 3. Health Checks
1. Define service-specific checks
2. Include relevant metrics
3. Set appropriate timeouts
4. Handle failure cases

## Testing
Essential test cases for service implementations:

```typescript
describe('BaseService', () => {
  describe('initialization', () => {
    // Configuration tests
  });

  describe('connection lifecycle', () => {
    // Connect/disconnect tests
  });

  describe('health checks', () => {
    // Health monitoring tests
  });

  describe('error handling', () => {
    // Error condition tests
  });
});
```

## Common Patterns

### 1. Graceful Shutdown
```typescript
async disconnect(): Promise<void> {
  try {
    await this.stopHealthCheck();
    await this.closeConnections();
    this.setStatus(ServiceStatus.DISCONNECTED);
  } catch (error) {
    this.handleDisconnectError(error);
  }
}
```

### 2. Health Check Loop
```typescript
protected async startHealthCheck(): Promise<void> {
  if (!this.config.healthCheck?.enabled) return;

  setInterval(async () => {
    try {
      await this.isHealthy();
    } catch (error) {
      this.handleHealthCheckError(error);
    }
  }, this.config.healthCheck.interval);
}
```

## Extension Points
The base module provides several extension points:

1. Custom health checks
2. Enhanced error handling
3. Additional lifecycle hooks
4. Custom status tracking
5. Extended configuration validation

## Related Components
- Logger integration
- Configuration system
- Error handling framework
- Metrics collection

## Future Improvements
1. Circuit breaker pattern
2. Enhanced metrics collection
3. Improved error recovery
4. Dynamic configuration
5. Advanced health checks
