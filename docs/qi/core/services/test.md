# Testing and Docker Integration Guide

## Application Service Tests

### Configuration Tests
```typescript
describe('ConfigurationService', () => {
  describe('initializeConfig', () => {
    it('should load service configuration', async () => {
      const config = await initializeConfig();
      expect(config.databases.postgres).toBeDefined();
      expect(config.databases.redis).toBeDefined();
      expect(config.messageQueue).toBeDefined();
    });

    it('should validate environment variables', async () => {
      process.env.POSTGRES_PASSWORD = '';
      await expect(initializeConfig()).rejects.toThrow(ApplicationError);
    });
  });
});
```

### Redis Service Tests
```typescript
describe('RedisService', () => {
  describe('initialize', () => {
    it('should initialize with default options', async () => {
      const service = await initialize();
      expect(service.isEnabled()).toBe(true);
      expect(service.getClient()).toBeDefined();
    });

    it('should reuse existing singleton instance', async () => {
      const service1 = await initialize();
      const service2 = await initialize();
      expect(service1).toBe(service2);
    });
  });

  describe('getClient', () => {
    it('should throw if not initialized', () => {
      expect(() => getClient()).toThrow(ApplicationError);
    });
  });
});
```

### TimescaleDB Service Tests
```typescript
describe('TimescaleDBService', () => {
  describe('initialize', () => {
    it('should configure connection pool', async () => {
      const service = await initialize({
        pool: {
          max: 10,
          min: 2
        }
      });
      
      const sequelize = service.getSequelize();
      expect(sequelize.config.pool.max).toBe(10);
    });

    it('should handle connection failures', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      process.env.POSTGRES_HOST = 'invalid';
      
      await expect(initialize()).rejects.toThrow(ApplicationError);
    });
  });
});
```

### Cache Service Tests
```typescript
describe('CacheService', () => {
  describe('initialize', () => {
    it('should use redis in production', async () => {
      process.env.NODE_ENV = 'production';
      const cache = await initialize();
      expect(cache.getStorageType()).toBe('redis');
    });

    it('should use memory in development', async () => {
      process.env.NODE_ENV = 'development';
      const cache = await initialize();
      expect(cache.getStorageType()).toBe('memory');
    });
  });
});
```

### RedPanda Service Tests
```typescript
describe('RedPandaService', () => {
  describe('initialize', () => {
    it('should configure consumer and producer', async () => {
      const service = await initialize({
        consumer: {
          groupId: 'test-group',
          sessionTimeout: 30000
        },
        producer: {
          allowAutoTopicCreation: true
        }
      });

      expect(service.getConsumer()).toBeDefined();
      expect(service.getProducer()).toBeDefined();
    });
  });
});
```

## Integration Testing

### Service Initialization Flow
```typescript
describe('ServiceInitialization', () => {
  beforeAll(async () => {
    await startDockerServices();
  });

  afterAll(async () => {
    await stopDockerServices();
  });

  it('should initialize services in correct order', async () => {
    const initOrder: string[] = [];
    
    vi.spyOn(redis, 'initialize').mockImplementation(async () => {
      initOrder.push('redis');
      return {} as any;
    });

    vi.spyOn(timescaledb, 'initialize').mockImplementation(async () => {
      initOrder.push('timescaledb');
      return {} as any;
    });

    await initializeServices();
    
    expect(initOrder).toEqual([
      'redis',
      'cache',
      'timescaledb',
      'redpanda'
    ]);
  });

  it('should handle shutdown gracefully', async () => {
    const shutdownOrder: string[] = [];
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    
    await initializeServices();
    await gracefulShutdown();

    expect(shutdownOrder).toEqual([
      'cache',
      'redis',
      'redpanda',
      'timescaledb'
    ]);
  });
});
```

### Docker Environment
```typescript
import Docker from 'dockerode';
import { exec } from 'child_process';

async function startDockerServices() {
  return new Promise<void>((resolve, reject) => {
    exec('docker compose up -d', (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function stopDockerServices() {
  return new Promise<void>((resolve, reject) => {
    exec('docker compose down', (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

describe('DockerEnvironment', () => {
  let docker: Docker;

  beforeAll(async () => {
    docker = new Docker();
    await startDockerServices();
  });

  afterAll(async () => {
    await stopDockerServices();
  });

  it('should verify service health', async () => {
    const services = await docker.listContainers();
    const serviceNames = services.map(s => s.Names[0]);
    
    expect(serviceNames).toContain('/timescaledb');
    expect(serviceNames).toContain('/redis');
    expect(serviceNames).toContain('/redpanda');
  });
});
```

### Environment Variables
```typescript
describe('EnvironmentConfiguration', () => {
  const ENV_PATH = 'services/.env';
  const CONFIG_PATH = 'config/services-1.0.json';

  beforeEach(async () => {
    await loadTestEnv();
  });

  it('should map environment to service config', async () => {
    const config = await initializeConfig();
    
    expect(config.databases.postgres.getPassword())
      .toBe(process.env.POSTGRES_PASSWORD);
    
    expect(config.databases.redis.getPassword())
      .toBe(process.env.REDIS_PASSWORD);
  });

  it('should validate required variables', async () => {
    delete process.env.POSTGRES_PASSWORD;
    await expect(initializeConfig())
      .rejects.toThrow(/POSTGRES_PASSWORD.*required/);
  });
});
```

## Best Practices

1. Service Testing Strategy
- Test initialization flow and options
- Verify singleton patterns
- Mock external services
- Test error handling
- Validate configuration

2. Integration Testing
- Use Docker Compose for dependencies
- Verify service health
- Test service interactions
- Check environment mapping

3. Environment Management  
- Validate required variables
- Test configuration mapping
- Check sensitive data handling
- Verify default values

4. Startup/Shutdown Testing
- Verify initialization order
- Test graceful shutdown
- Check resource cleanup
- Validate error handling