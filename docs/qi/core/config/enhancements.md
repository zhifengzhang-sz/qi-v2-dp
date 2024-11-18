Looking at the proposal, there are several key functionalities that could be implemented. Let's create a comprehensive implementation for some of the main ones:

### Event System for Configuration: `qi/core/src/config/events`

```typescript
// qi/core/src/config/events/types.ts
export type ConfigEventType = 
  | 'config.loaded'
  | 'config.validated'
  | 'config.cached'
  | 'config.error'
  | 'config.changed'
  | 'cache.hit'
  | 'cache.miss'
  | 'validation.success'
  | 'validation.error';

export interface ConfigEventData {
  type: ConfigEventType;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ConfigChangeEvent extends ConfigEventData {
  type: 'config.changed';
  previous: unknown;
  current: unknown;
}

export interface ConfigErrorEvent extends ConfigEventData {
  type: 'config.error';
  error: Error;
}

export type ConfigEventHandler = (event: ConfigEventData) => void | Promise<void>;

// qi/core/src/config/events/ConfigEventEmitter.ts
import { EventEmitter } from 'events';
import { 
  ConfigEventType, 
  ConfigEventData, 
  ConfigEventHandler 
} from './types';
import { logger } from '@qi/core/logger';

export class ConfigEventEmitter {
  private readonly emitter = new EventEmitter();
  private readonly handlers = new Map<string, Set<ConfigEventHandler>>();

  constructor(private readonly options: { maxListeners?: number } = {}) {
    if (options.maxListeners) {
      this.emitter.setMaxListeners(options.maxListeners);
    }
  }

  on(event: ConfigEventType, handler: ConfigEventHandler): void {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }
    handlers.add(handler);
    this.emitter.on(event, handler);
  }

  off(event: ConfigEventType, handler: ConfigEventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      this.emitter.off(event, handler);
    }
  }

  async emit(event: ConfigEventType, data: ConfigEventData): Promise<void> {
    try {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const eventData = {
          ...data,
          timestamp: Date.now()
        };

        await Promise.all(
          Array.from(handlers).map(handler => 
            this.safeExecute(handler, eventData)
          )
        );
      }
    } catch (error) {
      logger.error('Event emission failed', { 
        event, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async safeExecute(
    handler: ConfigEventHandler, 
    data: ConfigEventData
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      logger.error('Event handler failed', {
        event: data.type,
        handler: handler.name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  getHandlerCount(event: ConfigEventType): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  removeAllHandlers(event?: ConfigEventType): void {
    if (event) {
      this.handlers.delete(event);
      this.emitter.removeAllListeners(event);
    } else {
      this.handlers.clear();
      this.emitter.removeAllListeners();
    }
  }
}

// qi/core/src/config/events/index.ts
export * from './types';
export * from './ConfigEventEmitter';

```

### Core ConfigManager Implementation: `qi/core/src/config/manager`

```typescript
// qi/core/src/config/manager/types.ts
import { BaseConfig, CacheOptions } from '../types';
import { IConfigFactory, IConfigCache, ISchema } from '../interfaces';
import { MonitoringOptions } from '../monitoring/types';

export interface ConfigManagerOptions {
  schema: ISchema;
  cache?: IConfigCache<BaseConfig>;
  factory?: IConfigFactory;
  monitoring?: MonitoringOptions;
  ttl?: number;
}

export interface LoadConfigOptions {
  type: string;
  version: string;
  source: string | Record<string, unknown>;
  watch?: boolean;
}

// qi/core/src/config/manager/ConfigManager.ts
import { EventEmitter } from 'events';
import { ConfigManagerOptions, LoadConfigOptions } from './types';
import { ConfigFactory } from '../factory/ConfigFactory';
import { ConfigEventEmitter } from '../events/ConfigEventEmitter';
import { MetricsCollector } from '../monitoring/metrics';
import { HealthChecker } from '../monitoring/health';
import { ConfigError } from '../errors';
import { logger } from '@qi/core/logger';

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly factory: IConfigFactory;
  private readonly cache?: IConfigCache<BaseConfig>;
  private readonly events: ConfigEventEmitter;
  private readonly metrics: MetricsCollector;
  private readonly health: HealthChecker;

  private constructor(private readonly options: ConfigManagerOptions) {
    this.factory = options.factory ?? new ConfigFactory(
      options.schema, 
      options.cache,
      { monitoring: options.monitoring }
    );
    this.cache = options.cache;
    this.events = new ConfigEventEmitter();
    this.metrics = new MetricsCollector(options.monitoring?.metrics);
    this.health = new HealthChecker(options.monitoring?.healthCheck);

    this.initializeHealthChecks();
  }

  static getInstance(options: ConfigManagerOptions): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(options);
    }
    return ConfigManager.instance;
  }

  async getConfig<T extends BaseConfig>(options: LoadConfigOptions): Promise<T> {
    const startTime = Date.now();
    try {
      const cacheKey = this.generateCacheKey(options);

      // Try cache first
      if (this.cache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.metrics.recordCacheOperation(true);
          await this.events.emit('cache.hit', {
            type: 'cache.hit',
            timestamp: Date.now(),
            source: cacheKey
          });
          return cached as T;
        }
        this.metrics.recordCacheOperation(false);
        await this.events.emit('cache.miss', {
          type: 'cache.miss',
          timestamp: Date.now(),
          source: cacheKey
        });
      }

      // Load fresh config
      const loader = this.factory.createLoader<T>({
        type: options.type,
        version: options.version,
        source: options.source,
        watch: options.watch
      });

      if (options.watch) {
        this.setupConfigWatcher(loader, cacheKey);
      }

      const config = await loader.load();
      const duration = Date.now() - startTime;
      this.metrics.recordLoadAttempt(duration);

      // Cache the result
      if (this.cache) {
        await this.cache.set(cacheKey, config);
        await this.events.emit('config.cached', {
          type: 'config.cached',
          timestamp: Date.now(),
          source: cacheKey
        });
      }

      await this.events.emit('config.loaded', {
        type: 'config.loaded',
        timestamp: Date.now(),
        source: cacheKey,
        metadata: { duration }
      });

      return config;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordLoadAttempt(duration, error as Error);

      await this.events.emit('config.error', {
        type: 'config.error',
        timestamp: Date.now(),
        source: options.source.toString(),
        error: error as Error
      });

      throw error;
    }
  }

  private generateCacheKey(options: LoadConfigOptions): string {
    return `${options.type}:${options.version}:${
      typeof options.source === 'string' ? options.source : 'object'
    }`;
  }

  private setupConfigWatcher<T extends BaseConfig>(
    loader: IConfigLoader<T>,
    cacheKey: string
  ): void {
    if (loader.watch) {
      loader.watch(async (event) => {
        try {
          // Update cache if exists
          if (this.cache) {
            await this.cache.set(cacheKey, event.current);
          }

          // Emit change event
          await this.events.emit('config.changed', {
            type: 'config.changed',
            timestamp: Date.now(),
            source: cacheKey,
            previous: event.previous,
            current: event.current
          });
        } catch (error) {
          logger.error('Config watch handler failed', {
            cacheKey,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    }
  }

  private initializeHealthChecks(): void {
    // Register cache health check
    if (this.cache) {
      this.health.registerCheck('cache', async () => {
        const metrics = this.metrics.snapshot();
        const hitRatio = metrics.cacheMetrics.hitRatio;

        return {
          status: hitRatio > 0.8 ? 'healthy' : hitRatio > 0.5 ? 'degraded' : 'unhealthy',
          lastCheck: Date.now(),
          consecutiveFailures: 0,
          metadata: { hitRatio }
        };
      });
    }

    // Start health checks if monitoring is enabled
    if (this.options.monitoring?.enabled) {
      this.health.startChecks();
    }
  }

  getMetrics() {
    return this.metrics.snapshot();
  }

  getHealth() {
    return this.health.getStatus();
  }

  onEvent(event: string, handler: (data: any) => void): void {
    this.events.on(event as any, handler);
  }

  cleanup(): void {
    this.health.stopChecks();
    this.events.removeAllHandlers();
  }
}

// qi/core/src/config/manager/index.ts
export * from './types';
export * from './ConfigManager';

```

This implementation provides:

1. **Event System**
   - Typed events for configuration changes
   - Async event handling
   - Error handling for event handlers
   - Event monitoring and metrics

2. **Config Manager**
   - Singleton pattern for global access
   - Integrated caching
   - Configuration watching
   - Health monitoring
   - Metrics collection
   - Event emission

3. **Enhanced Features**
   - Cache key generation
   - Watch setup for config changes
   - Health check initialization
   - Metrics tracking
   - Error handling
   - Cleanup utilities

Usage example:

```typescript
// Initialize the configuration manager
const configManager = ConfigManager.getInstance({
  schema: new Schema(),
  cache: new CacheManager(new MemoryCacheStrategy()),
  monitoring: {
    enabled: true,
    healthCheck: {
      interval: 30000
    },
    metrics: {
      enabled: true
    }
  }
});

// Subscribe to events
configManager.onEvent('config.changed', async (event) => {
  console.log('Config changed:', event);
});

// Get configuration
const config = await configManager.getConfig({
  type: 'service',
  version: '1.0',
  source: 'config/service.json',
  watch: true
});

// Monitor health
const health = configManager.getHealth();
console.log('System health:', health);

// Get metrics
const metrics = configManager.getMetrics();
console.log('Cache hit ratio:', metrics.cacheMetrics.hitRatio);
```

### Handler: `qi/core/src/config/handler`

We'll implement the handlers system and enhanced validation features:

```typescript
// qi/core/src/config/handlers/types.ts
import { BaseConfig } from '../types';

export interface HandlerContext {
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface HandlerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface IConfigHandler<TInput extends BaseConfig, TOutput = TInput> {
  handle(config: TInput, context: HandlerContext): Promise<HandlerResult<TOutput>>;
}

// qi/core/src/config/handlers/base/BaseHandler.ts
import { BaseConfig } from '../../types';
import { HandlerContext, HandlerResult, IConfigHandler } from '../types';
import { ConfigError } from '../../errors';
import { logger } from '@qi/core/logger';

export abstract class BaseHandler<TInput extends BaseConfig, TOutput = TInput> 
implements IConfigHandler<TInput, TOutput> {
  constructor(protected readonly options: Record<string, unknown> = {}) {}

  async handle(
    config: TInput, 
    context: HandlerContext
  ): Promise<HandlerResult<TOutput>> {
    const startTime = Date.now();
    try {
      // Pre-processing hook
      await this.beforeHandle(config, context);

      // Main processing
      const result = await this.processConfig(config, context);

      // Post-processing hook
      const finalResult = await this.afterHandle(result, context);

      // Log success
      logger.debug('Handler completed successfully', {
        handler: this.constructor.name,
        duration: Date.now() - startTime,
        source: context.source
      });

      return {
        success: true,
        data: finalResult,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      // Log error
      logger.error('Handler failed', {
        handler: this.constructor.name,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        source: context.source
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    }
  }

  protected abstract processConfig(
    config: TInput,
    context: HandlerContext
  ): Promise<TOutput>;

  protected async beforeHandle(
    config: TInput,
    context: HandlerContext
  ): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async afterHandle(
    result: TOutput,
    context: HandlerContext
  ): Promise<TOutput> {
    // Default implementation - can be overridden
    return result;
  }
}

// qi/core/src/config/handlers/HandlerRegistry.ts
import { BaseConfig } from '../types';
import { IConfigHandler, HandlerContext, HandlerResult } from './types';
import { logger } from '@qi/core/logger';

export class HandlerRegistry {
  private handlers = new Map<string, IConfigHandler<any, any>>();

  registerHandler<TInput extends BaseConfig, TOutput>(
    type: string,
    handler: IConfigHandler<TInput, TOutput>
  ): void {
    if (this.handlers.has(type)) {
      logger.warn('Handler already registered, overwriting', { type });
    }
    this.handlers.set(type, handler);
  }

  async processConfig<TInput extends BaseConfig, TOutput>(
    type: string,
    config: TInput,
    context: HandlerContext
  ): Promise<HandlerResult<TOutput>> {
    const handler = this.handlers.get(type);
    if (!handler) {
      return {
        success: false,
        error: new Error(`No handler registered for type: ${type}`)
      };
    }

    return handler.handle(config, context);
  }

  removeHandler(type: string): boolean {
    return this.handlers.delete(type);
  }

  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  getHandlerTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Example handlers:
// qi/core/src/config/handlers/EnvConfigHandler.ts
import { BaseHandler } from './base/BaseHandler';
import { HandlerContext } from './types';
import { BaseConfig } from '../types';

interface EnvConfig extends BaseConfig {
  environment: Record<string, string>;
}

export class EnvConfigHandler extends BaseHandler<EnvConfig> {
  protected async processConfig(
    config: EnvConfig,
    context: HandlerContext
  ): Promise<EnvConfig> {
    // Process environment variables
    const processedEnv = Object.entries(config.environment).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: this.processEnvValue(value)
      }),
      {} as Record<string, string>
    );

    return {
      ...config,
      environment: processedEnv
    };
  }

  private processEnvValue(value: string): string {
    // Replace ${VAR} with process.env.VAR
    return value.replace(/\${([^}]+)}/g, (_, varName) => {
      const envValue = process.env[varName];
      if (envValue === undefined) {
        throw new Error(`Environment variable not found: ${varName}`);
      }
      return envValue;
    });
  }
}

// qi/core/src/config/handlers/index.ts
export * from './types';
export * from './base/BaseHandler';
export * from './HandlerRegistry';
export * from './EnvConfigHandler';

```

### Updating validation module: `qi/core/src/config/validation`

And here's the enhanced validation system:

```typescript
// qi/core/src/config/validation/types.ts
import { JsonSchema } from '../types';

export interface ValidationContext {
  source: string;
  schemaId: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  metadata?: Record<string, unknown>;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  params?: Record<string, unknown>;
}

export interface ValidationRule {
  validate(value: unknown, context: ValidationContext): Promise<ValidationResult>;
}

// qi/core/src/config/validation/rules/index.ts
import { ValidationRule, ValidationContext, ValidationResult } from '../types';

export class RequiredFieldsRule implements ValidationRule {
  async validate(
    value: unknown,
    context: ValidationContext
  ): Promise<ValidationResult> {
    if (!value || typeof value !== 'object') {
      return {
        valid: false,
        errors: [{
          path: '',
          message: 'Value must be an object',
          code: 'INVALID_TYPE'
        }]
      };
    }

    const missingFields = this.findMissingFields(value as Record<string, unknown>);
    
    return {
      valid: missingFields.length === 0,
      errors: missingFields.map(field => ({
        path: field,
        message: `Required field "${field}" is missing`,
        code: 'REQUIRED_FIELD'
      }))
    };
  }

  private findMissingFields(obj: Record<string, unknown>): string[] {
    const missing: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) {
        missing.push(key);
      }
    }
    return missing;
  }
}

export class TypeValidationRule implements ValidationRule {
  async validate(
    value: unknown,
    context: ValidationContext
  ): Promise<ValidationResult> {
    if (!value || typeof value !== 'object') {
      return {
        valid: false,
        errors: [{
          path: '',
          message: 'Value must be an object',
          code: 'INVALID_TYPE'
        }]
      };
    }

    const typeErrors = this.validateTypes(value as Record<string, unknown>);
    
    return {
      valid: typeErrors.length === 0,
      errors: typeErrors
    };
  }

  private validateTypes(
    obj: Record<string, unknown>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const expectedType = this.getExpectedType(key);
      if (!this.checkType(value, expectedType)) {
        errors.push({
          path: key,
          message: `Invalid type for "${key}". Expected ${expectedType}`,
          code: 'TYPE_MISMATCH',
          params: { expectedType, actualType: typeof value }
        });
      }
    }
    
    return errors;
  }

  private getExpectedType(key: string): string {
    // This could be enhanced to use schema information
    switch (key) {
      case 'port': return 'number';
      case 'host': return 'string';
      case 'enabled': return 'boolean';
      default: return 'string';
    }
  }

  private checkType(value: unknown, expectedType: string): boolean {
    if (value === null) return false;
    return typeof value === expectedType;
  }
}

// qi/core/src/config/validation/ValidatorRegistry.ts
import { 
  ValidationRule, 
  ValidationContext,
  ValidationResult 
} from './types';
import { logger } from '@qi/core/logger';

export class ValidatorRegistry {
  private rules = new Map<string, ValidationRule[]>();

  addRule(schemaId: string, rule: ValidationRule): void {
    const rules = this.rules.get(schemaId) || [];
    rules.push(rule);
    this.rules.set(schemaId, rules);
  }

  async validate(
    value: unknown,
    schemaId: string,
    context: Omit<ValidationContext, 'schemaId'>
  ): Promise<ValidationResult> {
    const rules = this.rules.get(schemaId);
    if (!rules || rules.length === 0) {
      logger.warn('No validation rules found', { schemaId });
      return { valid: true };
    }

    const results = await Promise.all(
      rules.map(rule => 
        rule.validate(value, { ...context, schemaId })
      )
    );

    const errors = results.flatMap(result => result.errors || []);
    
    return {
      valid: errors.length === 0,
      errors,
      metadata: {
        timestamp: Date.now(),
        rulesApplied: rules.length
      }
    };
  }

  removeRules(schemaId: string): void {
    this.rules.delete(schemaId);
  }

  getRuleCount(schemaId: string): number {
    return this.rules.get(schemaId)?.length || 0;
  }
}

// qi/core/src/config/validation/SchemaValidator.ts
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { JsonSchema } from '../types';
import { 
  ValidationContext, 
  ValidationResult,
  ValidationError 
} from './types';
import { ValidatorRegistry } from './ValidatorRegistry';
import { ConfigError } from '../errors';
import { logger } from '@qi/core/logger';

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly validators = new Map<string, ValidateFunction>();
  private readonly registry: ValidatorRegistry;

  constructor(options: { 
    strict?: boolean;
    formats?: boolean;
  } = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      validateFormats: true
    });

    if (options.formats) {
      addFormats(this.ajv);
    }

    this.registry = new ValidatorRegistry();
  }

  addSchema(schema: JsonSchema): void {
    try {
      const validator = this.ajv.compile(schema);
      this.validators.set(schema.$id ?? 'default', validator);
    } catch (error) {
      throw new ConfigError(
        'Failed to compile schema',
        'SCHEMA_COMPILATION_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async validate(
    value: unknown,
    schemaId: string,
    context: Omit<ValidationContext, 'schemaId'>
  ): Promise<ValidationResult> {
    const validator = this.validators.get(schemaId);
    if (!validator) {
      throw new ConfigError(
        'Schema not found',
        'SCHEMA_NOT_FOUND',
        { schemaId }
      );
    }

    const startTime = Date.now();
    try {
      // JSON Schema validation
      const valid = validator(value);
      const schemaErrors = this.formatAjvErrors(validator.errors);

      // Custom rules validation
      const rulesResult = await this.registry.validate(
        value,
        schemaId,
        context
      );

      // Combine results
      const allErrors = [
        ...(schemaErrors || []),
        ...(rulesResult.errors || [])
      ];

      const result: ValidationResult = {
        valid: allErrors.length === 0,
        errors: allErrors,
        metadata: {
          duration: Date.now() - startTime,
          schemaId,
          source: context.source
        }
      };

      logger.debug('Validation completed', {
        schemaId,
        valid: result.valid,
        errorCount: allErrors.length,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      logger.error('Validation failed', {
        schemaId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  private formatAjvErrors(errors: any[] | null): ValidationError[] {
    if (!errors) return [];

    return errors.map(error => ({
      path: error.instancePath,
      message: error.message || 'Validation error',
      code: error.keyword.toUpperCase(),
      params: error.params
    }));
  }
}

// qi/core/src/config/validation/index.ts
export * from './types';
export * from './rules';
export * from './ValidatorRegistry';
export * from './SchemaValidator';

```

This implementation provides:

1. **Handler System**
   - Base handler with lifecycle hooks
   - Handler registry for managing multiple handlers
   - Context and result types
   - Error handling and logging
   - Example environment variable handler

2. **Enhanced Validation**
   - Schema-based validation using AJV
   - Custom validation rules
   - Validation registry
   - Detailed validation results
   - Error formatting and logging

Usage example:

```typescript
// Example usage of the entire system
import { ConfigManager } from './config/manager';
import { SchemaValidator } from './config/validation';
import { ValidatorRegistry } from './config/validation';
import { HandlerRegistry } from './config/handlers';
import { EnvConfigHandler } from './config/handlers';
import { RequiredFieldsRule, TypeValidationRule } from './config/validation/rules';
import { MemoryCacheStrategy } from './config/cache/strategies';
import { CacheManager } from './config/cache/manager';

// 1. Set up validation
const validator = new SchemaValidator({ formats: true });

// Add schemas
validator.addSchema({
  $id: 'service-config',
  type: 'object',
  required: ['name', 'port', 'environment'],
  properties: {
    name: { type: 'string' },
    port: { type: 'number' },
    environment: {
      type: 'object',
      additionalProperties: { type: 'string' }
    }
  }
});

// Add custom validation rules
const validatorRegistry = new ValidatorRegistry();
validatorRegistry.addRule('service-config', new RequiredFieldsRule());
validatorRegistry.addRule('service-config', new TypeValidationRule());

// 2. Set up handlers
const handlers = new HandlerRegistry();
handlers.registerHandler('env-config', new EnvConfigHandler({
  // handler options
}));

// 3. Set up caching
const cache = new CacheManager(
  new MemoryCacheStrategy(60000), // 1 minute TTL
  {
    prefix: 'config',
    onHit: (key) => console.log(`Cache hit: ${key}`),
    onMiss: (key) => console.log(`Cache miss: ${key}`)
  }
);

// 4. Initialize the config manager
const configManager = ConfigManager.getInstance({
  schema: validator,
  cache,
  monitoring: {
    enabled: true,
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000    // 5 seconds
    },
    metrics: {
      enabled: true,
      interval: 10000  // 10 seconds
    },
    alerts: {
      enabled: true,
      handlers: [
        {
          async handle(alert) {
            console.log(`Alert: ${alert.message}`);
          }
        }
      ]
    }
  }
});

// 5. Subscribe to events
configManager.onEvent('config.changed', async (event) => {
  console.log('Configuration changed:', event);
});

configManager.onEvent('validation.error', async (event) => {
  console.error('Validation failed:', event);
});

// 6. Load and process configuration
async function loadServiceConfig() {
  try {
    // Load configuration
    const config = await configManager.getConfig({
      type: 'service',
      version: '1.0',
      source: 'config/service.json',
      watch: true
    });

    // Process with handlers
    const result = await handlers.processConfig('env-config', config, {
      source: 'config/service.json',
      timestamp: Date.now()
    });

    if (!result.success) {
      throw result.error;
    }

    // Validate processed config
    const validationResult = await validator.validate(
      result.data,
      'service-config',
      {
        source: 'config/service.json'
      }
    );

    if (!validationResult.valid) {
      console.error('Validation errors:', validationResult.errors);
      throw new Error('Configuration validation failed');
    }

    return result.data;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

// 7. Monitor health and metrics
function monitorConfig() {
  setInterval(() => {
    const health = configManager.getHealth();
    const metrics = configManager.getMetrics();

    console.log('Health status:', health);
    console.log('Metrics:', {
      cacheHitRate: metrics.cacheMetrics.hitRatio,
      loadCount: metrics.loaderMetrics.totalLoads,
      errorRate: metrics.loaderMetrics.failedLoads / metrics.loaderMetrics.totalLoads
    });
  }, 60000); // Every minute
}

// 8. Example configuration
interface ServiceConfig {
  name: string;
  port: number;
  environment: {
    NODE_ENV: string;
    DB_URL: string;
    [key: string]: string;
  };
}

// Usage
async function main() {
  try {
    // Start monitoring
    monitorConfig();

    // Load configuration
    const config = await loadServiceConfig();
    
    console.log('Loaded configuration:', config);
    
    // Use configuration
    startServer(config);
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

function startServer(config: ServiceConfig) {
  console.log(`Starting server ${config.name} on port ${config.port}`);
  // Server initialization logic
}

// Run the application
main().catch(console.error);
```

This example demonstrates:

1. Complete System Integration

   - Validation with both schema and custom rules
   - Configuration handling with environment processing
   - Caching with monitoring
   - Event system usage
   - Health and metrics monitoring


2. Type Safety

   - Strongly typed configurations
   - Type-safe handlers and validators
   - Error handling with proper types


3. Monitoring and Observability

   - Health checks
   - Metrics collection
   - Event logging
   - Cache monitoring


4. Error Handling

   - Validation errors
   - Loading errors
   - Processing errors
   - Proper error propagation


5. Configuration Lifecycle

   - Loading
   - Validation
   - Processing
   - Caching
   - Monitoring
   - Usage

The system is modular and extensible, allowing you to:

- Add new validation rules
- Create custom handlers
- Implement different caching strategies
- Add custom monitoring metrics
- Define new event types
- Create specialized configuration types