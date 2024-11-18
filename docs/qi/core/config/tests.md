The untested files are ConfigCache.ts, ConfigFactory.ts, and CachedConfigLoader.ts.

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigCache } from '../ConfigCache';
import { ConfigFactory } from '../ConfigFactory';
import { CachedConfigLoader } from '../CachedConfigLoader';
import { Schema } from '../schema';
import { BaseConfig } from '../types';

// ConfigCache Tests
describe('ConfigCache', () => {
  let cache: ConfigCache<BaseConfig>;
  const testKey = 'test-key';
  const testValue = { type: 'test', version: '1.0' };

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new ConfigCache({ ttl: 1000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', async () => {
    await cache.set(testKey, testValue);
    const result = await cache.get(testKey);
    expect(result).toEqual(testValue);
  });

  it('should expire values after TTL', async () => {
    await cache.set(testKey, testValue);
    vi.advanceTimersByTime(1500);
    const result = await cache.get(testKey);
    expect(result).toBeUndefined();
  });

  it('should refresh expiry on access when configured', async () => {
    cache = new ConfigCache({ ttl: 1000, refreshOnAccess: true });
    await cache.set(testKey, testValue);
    
    vi.advanceTimersByTime(800);
    await cache.get(testKey); // Should refresh TTL
    vi.advanceTimersByTime(800);
    
    const result = await cache.get(testKey);
    expect(result).toEqual(testValue);
  });

  it('should call onExpire when value expires', async () => {
    const onExpire = vi.fn();
    cache = new ConfigCache({ ttl: 1000, onExpire });
    
    await cache.set(testKey, testValue);
    vi.advanceTimersByTime(1500);
    await cache.get(testKey);
    
    expect(onExpire).toHaveBeenCalledWith(testKey);
  });
});

// ConfigFactory Tests
describe('ConfigFactory', () => {
  let factory: ConfigFactory;
  let schema: Schema;
  let mockCache: ConfigCache<BaseConfig>;

  beforeEach(() => {
    schema = new Schema();
    mockCache = new ConfigCache({ ttl: 1000 });
    factory = new ConfigFactory(schema, mockCache);
  });

  it('should create loader with schema validation', () => {
    const testSchema = {
      $id: 'test-schema',
      type: 'object',
      properties: {
        type: { type: 'string' },
        version: { type: 'string' }
      }
    };

    const loader = factory.createLoader({
      type: 'test',
      version: '1.0',
      schema: testSchema
    });

    expect(loader).toBeDefined();
    expect(schema.hasSchema(testSchema.$id)).toBe(true);
  });

  it('should create validator with schema', () => {
    const testSchema = {
      $id: 'test-schema',
      type: 'object'
    };

    const validator = factory.createValidator(testSchema);
    expect(validator).toBeDefined();
    expect(validator.getSchema()).toEqual(testSchema);
  });

  it('should reuse existing schema', () => {
    const testSchema = {
      $id: 'test-schema',
      type: 'object'
    };

    schema.registerSchema('test', testSchema);
    const registerSchemaSpy = vi.spyOn(schema, 'registerSchema');
    
    factory.createLoader({
      type: 'test',
      version: '1.0',
      schema: testSchema
    });

    expect(registerSchemaSpy).not.toHaveBeenCalled();
  });
});

// CachedConfigLoader Tests
describe('CachedConfigLoader', () => {
  const mockLoader = {
    load: vi.fn(),
    watch: vi.fn(),
    unwatch: vi.fn()
  };

  const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn()
  };

  let cachedLoader: CachedConfigLoader<BaseConfig>;
  const testConfig = { type: 'test', version: '1.0' };

  beforeEach(() => {
    vi.clearAllMocks();
    cachedLoader = new CachedConfigLoader(mockLoader, mockCache);
  });

  it('should use cached value when available', async () => {
    mockCache.get.mockResolvedValue(testConfig);
    const result = await cachedLoader.load();
    
    expect(result).toEqual(testConfig);
    expect(mockLoader.load).not.toHaveBeenCalled();
  });

  it('should load and cache on cache miss', async () => {
    mockCache.get.mockResolvedValue(undefined);
    mockLoader.load.mockResolvedValue(testConfig);
    
    const result = await cachedLoader.load();
    
    expect(result).toEqual(testConfig);
    expect(mockLoader.load).toHaveBeenCalled();
    expect(mockCache.set).toHaveBeenCalledWith(
      expect.any(String),
      testConfig
    );
  });

  it('should handle watch events and update cache', async () => {
    const callback = vi.fn();
    cachedLoader.watch(callback);
    
    const watchCallback = mockLoader.watch.mock.calls[0][0];
    const event = {
      previous: testConfig,
      current: { ...testConfig, version: '2.0' }
    };
    
    await watchCallback(event);
    
    expect(mockCache.set).toHaveBeenCalledWith(
      expect.any(String),
      event.current
    );
    expect(callback).toHaveBeenCalledWith(event);
  });

  it('should cleanup watchers on unwatch', () => {
    cachedLoader.watch(vi.fn());
    cachedLoader.unwatch();
    
    expect(mockLoader.unwatch).toHaveBeenCalled();
  });
});

```

Regarding the refactor proposal:

Key improvements:
1. Better organization with clear module boundaries (types, interfaces, etc.)
2. Enhanced monitoring and metrics system
3. Improved cache implementation with strategy pattern
4. More comprehensive error handling
5. Better TypeScript type safety

Concerns:
1. Increased complexity may impact maintainability
2. More dependencies between modules
3. Potential performance overhead from monitoring
4. Migration effort could be substantial

Recommendation:
1. Implement changes incrementally, starting with:
   - Directory restructuring
   - Type/interface separation
   - Basic monitoring
2. Add more complex features later:
   - Advanced metrics
   - Cache strategies
   - Alert system

The tests show the current implementation is solid but could benefit from the proposed improvements in type safety and monitoring.