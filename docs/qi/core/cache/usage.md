# Cache Module (@qi/core/cache)

A flexible caching system supporting both Redis (production) and in-memory (development) storage backends with TypeScript support.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Architecture](#architecture)
- [Usage Guide](#usage-guide)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Development Tools](#development-tools)
- [Performance Considerations](#performance-considerations)
- [Testing Guide](#testing-guide)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features

- **Multiple Storage Backends**

  - Redis for production environments
  - In-memory caching (node-cache) for development
  - Consistent API across backends
  - Automatic backend selection based on environment

- **Type Safety**

  - Full TypeScript support
  - Generic type parameters for cached values
  - Type inference for nested objects
  - Compile-time type checking

- **Performance**

  - Optimized Redis operations
  - Efficient memory usage in development
  - Batch operations support
  - Connection pooling for Redis

- **Developer Experience**
  - Clear error messages
  - Development-time statistics
  - Easy debugging
  - Comprehensive logging

### Additional Features

- TTL (Time-To-Live) support
- Namespace isolation
- Bulk operations
- Automatic cleanup
- Error handling
- Statistics and monitoring
- Atomic operations (Redis)

## Installation

### NPM

```bash
npm install @qi/core/cache ioredis node-cache
npm install --save-dev @types/node-cache
```

### Yarn

```bash
yarn add @qi/core/cache ioredis node-cache
yarn add -D @types/node-cache
```

### PNPM

```bash
pnpm add @qi/core/cache ioredis node-cache
pnpm add -D @types/node-cache
```

## Architecture

### Storage Backend Design

```
┌─────────────────────────┐
│      Cache Client       │
└─────────────────────────┘
           ▲  ▲
           │  │
    ┌──────┘  └──────┐
    │               │
┌─────────┐   ┌─────────┐
│  Redis  │   │ Memory  │
└─────────┘   └─────────┘
```

### Key Components

1. **Cache Client**

   - Handles type safety
   - Manages configuration
   - Routes operations

2. **Storage Backends**

   - Redis implementation
   - Memory implementation
   - Consistent interface

3. **Error Handling**
   - Custom error types
   - Detailed error info
   - Recovery strategies

## Usage Guide

### Basic Usage

#### Production Setup

```typescript
import { Cache } from "@qi/core/cache";
import { Redis } from "ioredis";

const cache = new Cache({
  storage: "redis",
  prefix: "myapp:",
  ttl: 3600,
  redis: new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  }),
});
```

#### Development Setup

```typescript
const cache = new Cache({
  storage: "memory",
  prefix: "myapp:",
  ttl: 3600,
});
```

### Working with Types

#### Simple Types

```typescript
// String
await cache.set("greeting", "Hello, World!");
const greeting = await cache.get<string>("greeting");

// Number
await cache.set("count", 42);
const count = await cache.get<number>("count");

// Boolean
await cache.set("isActive", true);
const isActive = await cache.get<boolean>("isActive");
```

#### Complex Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  preferences: {
    theme: "light" | "dark";
    notifications: boolean;
  };
  lastLogin: Date;
}

// Store user
const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  preferences: {
    theme: "dark",
    notifications: true,
  },
  lastLogin: new Date(),
};

await cache.set(`user:${user.id}`, user);

// Retrieve user with type safety
const cachedUser = await cache.get<User>(`user:${user.id}`);
if (cachedUser) {
  console.log(cachedUser.preferences.theme); // TypeScript knows this is 'light' | 'dark'
}
```

### Namespace Organization

#### Using Constants

```typescript
const CACHE_KEYS = {
  USERS: {
    PREFIX: "users:",
    PROFILE: (id: number) => `users:${id}:profile`,
    SETTINGS: (id: number) => `users:${id}:settings`,
    SESSIONS: (id: number) => `users:${id}:sessions`,
  },
  SYSTEM: {
    PREFIX: "system:",
    CONFIG: "system:config",
    STATUS: "system:status",
  },
} as const;

// Usage
await cache.set(CACHE_KEYS.USERS.PROFILE(123), userProfile);
await cache.set(CACHE_KEYS.SYSTEM.CONFIG, systemConfig);
```

#### Using Classes

```typescript
class UserCache {
  private cache: Cache;
  private prefix = "users:";

  constructor(cache: Cache) {
    this.cache = cache;
  }

  async getProfile(userId: number): Promise<UserProfile | null> {
    return this.cache.get<UserProfile>(`${this.prefix}${userId}:profile`);
  }

  async setProfile(userId: number, profile: UserProfile): Promise<void> {
    await this.cache.set(`${this.prefix}${userId}:profile`, profile);
  }
}
```

## Advanced Usage

### Caching Patterns

#### Cache-Aside Pattern

```typescript
class UserService {
  constructor(private cache: Cache, private db: Database) {}

  async getUser(id: number): Promise<User | null> {
    // Try cache first
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    // Cache miss - get from database
    const user = await this.db.users.findById(id);
    if (user) {
      // Store in cache for next time
      await this.cache.set(`user:${id}`, user);
    }

    return user;
  }
}
```

#### Write-Through Pattern

```typescript
class ProductService {
  constructor(private cache: Cache, private db: Database) {}

  async updateProduct(id: number, data: ProductUpdate): Promise<Product> {
    // Update database first
    const updated = await this.db.products.update(id, data);

    // Update cache immediately after
    await this.cache.set(`product:${id}`, updated);

    return updated;
  }
}
```

### Working with Collections

#### Caching Lists

```typescript
interface CachedList<T> {
  items: T[];
  metadata: {
    total: number;
    lastUpdated: string;
  };
}

class ListCache<T> {
  constructor(private cache: Cache, private prefix: string) {}

  async getList(page: number, size: number): Promise<CachedList<T> | null> {
    return this.cache.get<CachedList<T>>(`${this.prefix}:list:${page}:${size}`);
  }

  async setList(
    page: number,
    size: number,
    data: CachedList<T>
  ): Promise<void> {
    await this.cache.set(`${this.prefix}:list:${page}:${size}`, data);
  }

  async invalidateAll(): Promise<void> {
    await this.cache.clear();
  }
}
```

### Handling Expiration

#### Soft vs Hard Expiration

```typescript
interface CacheItem<T> {
  data: T;
  metadata: {
    created: number;
    softExpiry: number;
    hardExpiry: number;
  };
}

class ExpiringCache {
  constructor(private cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const item = await this.cache.get<CacheItem<T>>(key);
    if (!item) return null;

    const now = Date.now();

    // Hard expiry - return null
    if (now > item.metadata.hardExpiry) {
      await this.cache.delete(key);
      return null;
    }

    // Soft expiry - trigger background refresh
    if (now > item.metadata.softExpiry) {
      void this.refreshInBackground(key);
    }

    return item.data;
  }

  private async refreshInBackground(key: string): Promise<void> {
    // Implement background refresh logic
  }
}
```

### Batch Operations

#### Bulk Loading

```typescript
class BatchCache {
  constructor(private cache: Cache) {}

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    // Process in parallel
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.cache.get<T>(key);
        if (value) results.set(key, value);
      })
    );

    return results;
  }

  async setBatch<T>(items: Map<string, T>): Promise<void> {
    await Promise.all(
      Array.from(items.entries()).map(([key, value]) =>
        this.cache.set(key, value)
      )
    );
  }
}
```

## API Reference

### Cache Class

#### Constructor

```typescript
constructor(options: CacheOptions)
```

Options:

```typescript
interface CacheOptions {
  storage: "redis" | "memory";
  prefix: string;
  ttl?: number;
  redis?: Redis;
}
```

#### Methods

##### `get<T>`

```typescript
async get<T>(key: string): Promise<T | null>
```

- Purpose: Retrieves a value from cache
- Generic: T - Type of the cached value
- Parameters: key - Cache key to retrieve
- Returns: Promise resolving to value or null if not found
- Throws: ApplicationError on operation failure

##### `set<T>`

```typescript
async set<T>(key: string, value: T): Promise<void>
```

- Purpose: Stores a value in cache
- Generic: T - Type of the value to cache
- Parameters:
  - key - Cache key
  - value - Value to store
- Returns: Promise resolving when complete
- Throws: ApplicationError on operation failure

##### `delete`

```typescript
async delete(key: string): Promise<boolean>
```

- Purpose: Removes a value from cache
- Parameters: key - Cache key to delete
- Returns: Promise resolving to true if deleted, false if not found
- Throws: ApplicationError on operation failure

##### `clear`

```typescript
async clear(): Promise<void>
```

- Purpose: Clears all cached values with this cache's prefix
- Returns: Promise resolving when complete
- Throws: ApplicationError on operation failure

##### `getStats`

```typescript
getStats(): NodeCache.Stats | null
```

- Purpose: Returns cache statistics (memory storage only)
- Returns: Cache statistics or null for Redis storage

## Configuration

### Service Configuration Setup

#### Using Service Configuration Files

The cache module integrates with the Qi service configuration system using two main files:

1. `services-1.0.json`:
```json
{
  "databases": {
    "redis": {
      "host": "redis",
      "port": 6379,
      "maxRetries": 3
    }
  }
}
```

2. `services.env`:
```env
REDIS_PASSWORD=eqFlzRQV25YJ
```

To initialize the cache using these service configurations:

```typescript
import { Cache } from "@qi/core/cache";
import { initializeConfig } from "@qi/core/services/config";
import { getClient as getRedisClient } from "@qi/core/services/redis";

async function setupCache() {
  // Initialize with service configuration
  const cache = new Cache({
    storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
    prefix: "qi:",
    ttl: 3600,
    // In production, use the Redis client from service configuration
    redis: process.env.NODE_ENV === "production" ? getRedisClient().client : undefined
  });

  return cache;
}
```

#### Application-Level Integration

For better integration at the application level, create a dedicated cache service:

```typescript
// src/services/cache/index.ts
import { Cache, type CacheOptions } from "@qi/core/cache";
import { getClient as getRedisClient } from "../redis/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { initializeConfig } from "../config/index.js";

const DEFAULT_CACHE_OPTIONS = {
  prefix: "qi:",
  ttl: 3600,
  maxRetries: 3,
} as const;

let cacheClient: Cache | undefined;

export async function initialize(
  options: Partial<typeof DEFAULT_CACHE_OPTIONS> = {}
): Promise<Cache> {
  try {
    if (cacheClient) return cacheClient;

    const services = await initializeConfig();
    const redisConfig = services.databases.redis;

    const config: CacheOptions = {
      storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    };

    if (config.storage === "redis") {
      if (!redisConfig) {
        throw new ApplicationError(
          "Redis configuration missing",
          ErrorCode.CONFIGURATION_ERROR,
          500
        );
      }
      
      const redisClient = getRedisClient();
      config.redis = redisClient.getRedisInstance();
    }

    cacheClient = new Cache(config);
    return cacheClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Cache service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
        storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
      }
    );
  }
}

export function getClient(): Cache {
  if (!cacheClient) {
    throw new ApplicationError(
      "Cache service not initialized. Call initialize() first.",
      ErrorCode.NOT_INITIALIZED,
      500
    );
  }
  return cacheClient;
}

export async function close(): Promise<void> {
  if (cacheClient) {
    await cacheClient.clear();
    cacheClient = undefined;
  }
}
```

Using the cache service in your application:

```typescript
import { getClient as getCache } from './services/cache';

async function example() {
  const cache = getCache();
  
  interface UserData {
    id: string;
    name: string;
    lastActive: Date;
  }
  
  // Cache will automatically use Redis in production
  // or memory cache in development
  await cache.set<UserData>('user:123', {
    id: '123',
    name: 'John Doe',
    lastActive: new Date()
  });
  
  const user = await cache.get<UserData>('user:123');
}
```

### Redis Configuration

#### Basic Redis Setup

```typescript
const cache = new Cache({
  storage: "redis",
  prefix: "myapp:",
  redis: new Redis({
    host: "localhost",
    port: 6379,
  }),
});
```

#### Advanced Redis Setup

```typescript
const cache = new Cache({
  storage: "redis",
  prefix: "myapp:",
  ttl: 3600,
  redis: new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0"),
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    lazyConnect: true,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  }),
});
```

### Memory Cache Configuration

#### Basic Memory Setup

```typescript
const cache = new Cache({
  storage: "memory",
  prefix: "myapp:",
  ttl: 3600,
});
```

#### Environment-Based Configuration

```typescript
const cache = new Cache({
  storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
  prefix: `${process.env.APP_NAME}:${process.env.NODE_ENV}:`,
  ttl: parseInt(process.env.CACHE_TTL || "3600"),
  redis:
    process.env.NODE_ENV === "production"
      ? new Redis(process.env.REDIS_URL)
      : undefined,
});
```

#

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  CACHE_ERROR = "CACHE_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  OPERATION_ERROR = "OPERATION_ERROR",
}

interface ErrorDetails {
  operation?: string;
  key?: string;
  error?: string;
  [key: string]: unknown;
}
```

### Error Handling Patterns

#### Basic Error Handling

```typescript
try {
  await cache.set("key", "value");
} catch (error) {
  if (error instanceof ApplicationError) {
    console.error(`Cache error: ${error.message}`, error.details);
    // Handle specific error types
    switch (error.code) {
      case ErrorCode.CACHE_ERROR:
        // Handle cache errors
        break;
      case ErrorCode.CONFIGURATION_ERROR:
        // Handle configuration errors
        break;
      case ErrorCode.OPERATION_ERROR:
        // Handle operation errors
        break;
    }
  }
}
```

#### Error Handler Class

```typescript
class CacheErrorHandler {
  constructor(private logger: Logger) {}

  async handle<T>(
    operation: () => Promise<T>,
    context: Record<string, unknown>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ApplicationError) {
        this.logger.error("Cache operation failed", {
          ...context,
          errorCode: error.code,
          errorDetails: error.details,
        });

        // Implement retry logic if needed
        if (this.shouldRetry(error)) {
          return this.retry(operation, context);
        }
      }
      return null;
    }
  }

  private shouldRetry(error: ApplicationError): boolean {
    // Implement retry decision logic
    return false;
  }

  private async retry<T>(
    operation: () => Promise<T>,
    context: Record<string, unknown>
  ): Promise<T | null> {
    // Implement retry logic
    return null;
  }
}
```

## Development Tools

### Cache Inspector

```typescript
class CacheInspector {
  constructor(private cache: Cache) {}

  async inspect(prefix: string): Promise<void> {
    const stats = this.cache.getStats();
    console.log("Cache Stats:", stats);

    if (this.cache.storage === "redis") {
      // Implement Redis-specific inspection
    } else {
      // Implement memory-specific inspection
    }
  }
}
```

### Cache Monitor

```typescript
class CacheMonitor {
  private metrics: Map<string, number> = new Map();
  private startTime: number;

  constructor(private cache: Cache) {
    this.startTime = Date.now();
  }

  recordOperation(operation: string): void {
    const current = this.metrics.get(operation) || 0;
    this.metrics.set(operation, current + 1);
  }

  getMetrics(): CacheMetrics {
    const stats = this.cache.getStats();
    const uptime = Date.now() - this.startTime;

    return {
      operations: Object.fromEntries(this.metrics),
      stats: stats || null,
      uptime,
      operationsPerSecond: this.calculateOpsPerSecond(),
    };
  }

  private calculateOpsPerSecond(): number {
    const totalOps = Array.from(this.metrics.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    return totalOps / ((Date.now() - this.startTime) / 1000);
  }
}
```

### Debug Helper

```typescript
class CacheDebugger {
  constructor(private cache: Cache, private logger: Logger) {}

  enableDebug(): void {
    const originalGet = this.cache.get.bind(this.cache);
    const originalSet = this.cache.set.bind(this.cache);

    // Wrap get method
    this.cache.get = async <T>(key: string): Promise<T | null> => {
      const start = performance.now();
      const result = await originalGet<T>(key);
      const duration = performance.now() - start;

      this.logger.debug("Cache Get Operation", {
        key,
        hit: result !== null,
        duration: `${duration.toFixed(2)}ms`,
      });

      return result;
    };

    // Wrap set method
    this.cache.set = async <T>(key: string, value: T): Promise<void> => {
      const start = performance.now();
      await originalSet(key, value);
      const duration = performance.now() - start;

      this.logger.debug("Cache Set Operation", {
        key,
        valueType: typeof value,
        duration: `${duration.toFixed(2)}ms`,
      });
    };
  }
}
```

## Performance Considerations

### Redis Performance Tips

1. **Batch Operations**

```typescript
class BatchOptimizer {
  private batchSize = 100;
  private queue: [string, unknown][] = [];

  async enqueueCacheOperation(key: string, value: unknown): Promise<void> {
    this.queue.push([key, value]);

    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    const batch = this.queue.splice(0, this.batchSize);
    await Promise.all(batch.map(([key, value]) => this.cache.set(key, value)));
  }
}
```

2. **Connection Pooling**

```typescript
const pool = new Redis.Cluster(
  [
    {
      host: "redis-1",
      port: 6379,
    },
    {
      host: "redis-2",
      port: 6379,
    },
  ],
  {
    maxRedirections: 16,
    retryDelayOnFailover: 100,
    scaleReads: "slave",
  }
);

const cache = new Cache({
  storage: "redis",
  prefix: "myapp:",
  redis: pool,
});
```

### Memory Usage Optimization

1. **Selective Caching**

```typescript
class SelectiveCache {
  private readonly maxValueSize = 1024 * 100; // 100KB

  async set<T>(key: string, value: T): Promise<void> {
    const size = this.calculateSize(value);

    if (size > this.maxValueSize) {
      this.logger.warn("Value too large for cache", { key, size });
      return;
    }

    await this.cache.set(key, value);
  }

  private calculateSize(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  }
}
```

2. **Memory Monitoring**

```typescript
class MemoryMonitor {
  private readonly memoryThreshold = 0.8; // 80%

  async monitor(): Promise<void> {
    const stats = this.cache.getStats();
    if (!stats) return;

    const memoryUsage = process.memoryUsage();
    const usageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (usageRatio > this.memoryThreshold) {
      await this.handleHighMemory();
    }
  }

  private async handleHighMemory(): Promise<void> {
    // Implement memory reduction strategy
  }
}
```

## Testing Guide

### Unit Testing

#### Mock Factory

```typescript
class CacheMockFactory {
  static createMockCache(): jest.Mocked<Cache> {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getStats: vi.fn(),
    } as unknown as jest.Mocked<Cache>;
  }
}
```

#### Test Examples

```typescript
describe("Cache", () => {
  let cache: Cache;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    cache = new Cache({
      storage: "redis",
      prefix: "test:",
      redis: mockRedis as unknown as Redis,
    });
  });

  describe("get", () => {
    it("should handle cache hits", async () => {
      const value = { test: "data" };
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      const result = await cache.get("key");
      expect(result).toEqual(value);
    });

    it("should handle cache misses", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cache.get("key");
      expect(result).toBeNull();
    });
  });
});
```

### Integration Testing

```typescript
describe("Cache Integration", () => {
  let cache: Cache;

  beforeAll(async () => {
    // Setup real Redis for integration tests
    const redis = new Redis({
      host: "localhost",
      port: 6379,
      db: 15, // Use separate DB for tests
    });

    cache = new Cache({
      storage: "redis",
      prefix: "integration-test:",
      redis,
    });
  });

  afterEach(async () => {
    await cache.clear();
  });

  afterAll(async () => {
    await redis.quit();
  });

  // Test cases...
});
```

### Performance Testing

```typescript
describe("Cache Performance", () => {
  it("should handle high concurrency", async () => {
    const operations = Array(1000)
      .fill(null)
      .map((_, i) => cache.set(`key:${i}`, { data: `value:${i}` }));

    const start = performance.now();
    await Promise.all(operations);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Issues**

```typescript
class ConnectionTroubleshooter {
  async diagnose(): Promise<DiagnosticResult> {
    try {
      // Test basic connectivity
      await this.cache.set("health-check", "ping");
      const value = await this.cache.get("health-check");

      return {
        status: "healthy",
        connectivity: value === "ping",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: this.analyzeError(error),
      };
    }
  }

  private analyzeError(error: unknown): string {
    // Implement error analysis
    return "";
  }
}
```

2. **Performance Issues**

```typescript
class PerformanceTroubleshooter {
  async diagnose(): Promise<PerformanceDiagnostics> {
    const results = await this.runBenchmark();

    return {
      averageLatency: results.latency,
      operationsPerSecond: results.ops,
      recommendations: this.generateRecommendations(results),
    };
  }

  private async runBenchmark(): Promise<BenchmarkResults> {
    // Implement benchmark
    return {} as BenchmarkResults;
  }
}
```

## Additional Resources

1. **Documentation**

   - [Redis Documentation](https://redis.io/documentation)
   - [Node Cache Documentation](https://github.com/node-cache/node-cache#readme)
   - [IORedis Documentation](https://github.com/luin/ioredis#readme)

2. **Monitoring & Tools**
   - Redis Commander: Web management tool
   - Redis Insights: Performance monitoring
   - Node Cache Dashboard: Memory cache visualization

## License

MIT License - see LICENSE.md for details

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
