# QI Data Platform Project Structure

## The master structure
```
qi/
├── core/
│   ├── src/
│   │   ├── config/           # Your current config module
│   │   ├── errors/           # Common error handling
│   │   ├── logger/           # Logging module
│   │   └── utils/            # Common utilities
│   └── package.json
├── [other-projects]/
└── package.json
```

## QI Core 

### Config Module Structure

```
core/src/config/
├── factory/
│   ├── ConfigFactory.ts        # Main factory implementation
│   └── index.ts
├── loaders/
│   ├── base/
│   │   └── BaseLoader.ts       # Abstract base loader
│   ├── JsonLoader.ts           # JSON file loader
│   ├── EnvLoader.ts            # Environment loader
│   └── index.ts
├── cache/
│   ├── ConfigCache.ts          # Main cache implementation
│   ├── CachedConfigLoader.ts   # Cache-aware loader
│   └── index.ts
├── schema/
│   ├── Schema.ts              # Schema implementation
│   └── index.ts
├── validation/
│   ├── SchemaValidator.ts     # Validation logic
│   └── index.ts
├── errors/
│   ├── codes.ts              # Error codes
│   ├── ConfigError.ts        # Error classes
│   └── index.ts
├── types/
│   ├── config.ts             # Config type definitions
│   ├── schema.ts             # Schema type definitions
│   └── index.ts
├── interfaces/
│   ├── IConfig.ts            # Core interfaces
│   ├── ILoader.ts            # Loader interfaces
│   └── index.ts
└── index.ts                  # Main entry point
```

#### Key Improvements

##### 1. Factory Pattern Enhancement
```typescript
// core/src/config/factory/ConfigFactory.ts
export class ConfigFactory {
  constructor(
    private readonly schema: ISchema,
    private readonly cache?: IConfigCache,
    private readonly options: FactoryOptions = {}
  ) {}

  async createServiceConfig(options: ServiceConfigOptions): Promise<ServiceConfig> {
    const serviceLoader = this.createLoader<ServiceConfig>({
      type: 'service',
      schema: serviceConfigSchema,
      source: options.configPath
    });

    const envLoader = this.createEnvLoader({
      schema: envConfigSchema,
      path: options.envPath
    });

    return this.loadAndMergeConfigs(serviceLoader, envLoader);
  }

  private async loadAndMergeConfigs(
    serviceLoader: IConfigLoader<ServiceConfig>,
    envLoader: IConfigLoader<EnvConfig>
  ): Promise<ServiceConfig> {
    const [service, env] = await Promise.all([
      serviceLoader.load(),
      envLoader.load()
    ]);

    return this.mergeConfigs(service, env);
  }
}
```

##### 2. Enhanced Caching Strategy
```typescript
// core/src/config/cache/ConfigCache.ts
export class ConfigCache implements IConfigCache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private options: CacheOptions) {}

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    if (this.options.refreshOnAccess) {
      entry.expires = Date.now() + this.options.ttl;
    }

    return entry.value as T;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }
}

// core/src/config/cache/CachedConfigLoader.ts
export class CachedConfigLoader<T extends BaseConfig> implements IConfigLoader<T> {
  constructor(
    private readonly loader: IConfigLoader<T>,
    private readonly cache: IConfigCache
  ) {}

  async load(): Promise<T> {
    const cacheKey = this.getCacheKey();
    const cached = await this.cache.get<T>(cacheKey);

    if (cached) {
      return cached;
    }

    const config = await this.loader.load();
    await this.cache.set(cacheKey, config);
    
    return config;
  }
}
```

##### 3. Improved Error Handling
```typescript
// core/src/config/errors/ConfigError.ts
export class ConfigError extends ApplicationError {
  constructor(
    message: string,
    code: ConfigErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message, code, details);
    this.name = 'ConfigError';
  }

  static createLoader(source: string, error: Error): ConfigError {
    return new ConfigError(
      `Failed to load config from ${source}`,
      CONFIG_ERROR_CODES.LOAD_ERROR,
      { source, originalError: error.message }
    );
  }
}
```

##### 4. Type-Safe Schema Validation
```typescript
// core/src/config/validation/SchemaValidator.ts
export class SchemaValidator implements ISchemaValidator {
  constructor(private schema: ISchema) {}

  validate<T extends BaseConfig>(
    config: unknown, 
    schemaId: string
  ): asserts config is T {
    const validator = this.schema.getValidator(schemaId);
    
    if (!validator(config)) {
      throw ConfigError.validation(
        'Configuration validation failed',
        schemaId,
        validator.errors
      );
    }
  }
}
```

#### Usage Example

```typescript
// Example service initialization
async function initializeServiceConfig(): Promise<ServiceConfig> {
  const schema = new Schema({ formats: true });
  const cache = new ConfigCache({ ttl: 60000 });
  const factory = new ConfigFactory(schema, cache);

  return factory.createServiceConfig({
    configPath: 'config/services.json',
    envPath: 'config/services.env'
  });
}
```


Here are the key improvements while maintaining the existing structure:

1. **Better Factory Usage**:
   - Factory becomes the central point for creating configurations
   - Handles the loading and merging of different config sources
   - Provides type-safe config creation

2. **Efficient Cache Implementation**:
   - Cache is now properly integrated with the factory
   - Supports different caching strategies
   - Handles cache invalidation and refresh policies

3. **Type Safety**:
   - Better TypeScript integration
   - Stronger type checking for config objects
   - Improved error handling with typed errors

To implement this in your current structure:

1. First move files to their new locations under `core/src/config`
2. Update imports to reflect new structure
3. Gradually refactor each component starting with the factory
4. Add new features while maintaining backward compatibility

## Details

### `qi/core/src/config/types`
Let's organize the types in a more modular way under `qi/core/src/config/types/`:

```typescript
// qi/core/src/config/types/base.ts
/**
 * @fileoverview Base configuration types and common interfaces
 * @module @qi/core/config/types/base
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export type SchemaVersion = "2019-09" | "2020-12";

export interface BaseConfig {
  readonly type: string;
  readonly version: string;
  readonly schemaVersion?: SchemaVersion;
}

export interface ConfigChangeEvent<T> {
  previous: T;
  current: T;
  timestamp: number;
  source: string;
}

// qi/core/src/config/types/schema.ts
/**
 * @fileoverview JSON Schema related type definitions
 * @module @qi/core/config/types/schema
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export interface JsonSchemaValidation {
  // String validations
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number validations
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // Array validations
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object validations
  minProperties?: number;
  maxProperties?: number;
}

export interface JsonSchema extends JsonSchemaValidation {
  $id?: string;
  $schema?: string;
  $ref?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchema | { type: string }>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  default?: unknown;
  examples?: unknown[];
  deprecated?: boolean;
}

// qi/core/src/config/types/options.ts
/**
 * @fileoverview Configuration options and settings types
 * @module @qi/core/config/types/options
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export interface EnvOptions {
  path?: string;
  override?: boolean;
  extraFiles?: string[];
  required?: boolean;
  watch?: boolean;
  refreshInterval?: number;
}

export interface CacheOptions {
  ttl: number;
  refreshOnAccess?: boolean;
  onExpire?: (key: string) => void;
}

export interface FactoryOptions {
  strict?: boolean;
  formats?: boolean;
  cache?: CacheOptions;
}

export interface LoadConfigOptions {
  type: string;
  schema: JsonSchema;
  source: string | Record<string, unknown>;
  cache?: CacheOptions;
}

// qi/core/src/config/types/cache.ts
/**
 * @fileoverview Cache-related type definitions
 * @module @qi/core/config/types/cache
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export interface CacheEntry<T = unknown> {
  value: T;
  expires: number;
  metadata?: Record<string, unknown>;
}

// qi/core/src/config/types/index.ts
/**
 * @fileoverview Main entry point for configuration type definitions
 * @module @qi/core/config/types
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export * from './base';
export * from './schema';
export * from './options';
export * from './cache';

```

This structure provides several benefits:
1. Better organization by concern
2. Easier to maintain and extend
3. Clearer dependencies
4. More focused documentation
5. Better code splitting

Each file focuses on a specific aspect of the type system:
- `base.ts`: Core configuration types
- `schema.ts`: JSON Schema related types
- `options.ts`: Configuration options
- `cache.ts`: Cache-related types
- `index.ts`: Re-exports everything

### `qi/core/src/config/interfaces`

I'll create the interfaces structure for `qi/core/src/config/interfaces/`:

```typescript
// qi/core/src/config/interfaces/config.ts
/**
 * @fileoverview Core configuration interfaces defining the contract for
 * configuration objects and their lifecycle.
 * @module @qi/core/config/interfaces/config
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { BaseConfig, ConfigChangeEvent, JsonSchema } from '../types';

/**
 * Configuration factory interface for creating configuration instances
 * 
 * @example
 * ```typescript
 * const factory: IConfigFactory = new ConfigFactory(schema, cache);
 * const loader = factory.createLoader<AppConfig>({
 *   type: 'app',
 *   version: '1.0',
 *   schema: appSchema
 * });
 * ```
 */
export interface IConfigFactory {
  /**
   * Create a new configuration loader
   * @param options Configuration options
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T>;

  /**
   * Create a new configuration validator
   * @param schema JSON Schema for validation
   */
  createValidator<T extends BaseConfig>(schema: JsonSchema): IConfigValidator<T>;
}

/**
 * Interface for handling configuration processing
 * 
 * @example
 * ```typescript
 * class DatabaseConfigHandler implements IConfigHandler<DbConfig, DbConnection> {
 *   handle(config: DbConfig): DbConnection {
 *     return new DbConnection(config);
 *   }
 * }
 * ```
 */
export interface IConfigHandler<T, R> {
  handle(config: T): R | Promise<R>;
}

// qi/core/src/config/interfaces/loader.ts
/**
 * @fileoverview Configuration loader interfaces defining how configurations
 * are loaded and watched for changes.
 * @module @qi/core/config/interfaces/loader
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { BaseConfig, ConfigChangeEvent } from '../types';

/**
 * Configuration loader interface
 * 
 * @example
 * ```typescript
 * class JsonLoader<T extends BaseConfig> implements IConfigLoader<T> {
 *   async load(): Promise<T> {
 *     const data = await readFile(this.path);
 *     return JSON.parse(data);
 *   }
 * 
 *   watch(callback: (event: ConfigChangeEvent<T>) => void): void {
 *     // Watch for file changes
 *   }
 * }
 * ```
 */
export interface IConfigLoader<T extends BaseConfig> {
  /**
   * Load configuration data
   * @returns Promise resolving to configuration
   * @throws ConfigError if loading fails
   */
  load(): Promise<T>;

  /**
   * Watch for configuration changes
   * @param callback Function to call when config changes
   */
  watch?(callback: (event: ConfigChangeEvent<T>) => void): void;

  /**
   * Stop watching for changes
   */
  unwatch?(): void;
}

// qi/core/src/config/interfaces/validator.ts
/**
 * @fileoverview Validation interfaces for configuration schema validation
 * @module @qi/core/config/interfaces/validator
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { BaseConfig, JsonSchema } from '../types';

/**
 * Configuration validator interface
 * 
 * @example
 * ```typescript
 * class SchemaValidator<T extends BaseConfig> implements IConfigValidator<T> {
 *   validate(config: unknown): asserts config is T {
 *     if (!this.validator(config)) {
 *       throw new ValidationError('Invalid config');
 *     }
 *   }
 * }
 * ```
 */
export interface IConfigValidator<T extends BaseConfig> {
  /**
   * Validate configuration data
   * @param config Configuration to validate
   * @throws ValidationError if validation fails
   */
  validate(config: unknown): asserts config is T;

  /**
   * Get the validation schema
   */
  getSchema(): JsonSchema;
}

/**
 * Schema validator interface for JSON Schema validation
 */
export interface ISchemaValidator {
  /**
   * Validate configuration against schema
   * @param config Configuration to validate
   * @param schemaId Schema identifier
   */
  validate(config: unknown, schemaId: string): void;

  /**
   * Validate schema definition
   * @param schema Schema to validate
   */
  validateSchema(schema: JsonSchema): void;
}

// qi/core/src/config/interfaces/cache.ts
/**
 * @fileoverview Cache interfaces for configuration caching
 * @module @qi/core/config/interfaces/cache
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { BaseConfig } from '../types';

/**
 * Configuration cache interface
 * 
 * @example
 * ```typescript
 * class ConfigCache implements IConfigCache<AppConfig> {
 *   async get(key: string): Promise<AppConfig | undefined> {
 *     const cached = await this.store.get(key);
 *     if (cached && !this.isExpired(cached)) {
 *       return cached.value;
 *     }
 *     return undefined;
 *   }
 * }
 * ```
 */
export interface IConfigCache<T extends BaseConfig> {
  /**
   * Get cached configuration
   * @param key Cache key
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Cache configuration
   * @param key Cache key
   * @param value Configuration to cache
   */
  set(key: string, value: T): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete cached configuration
   * @param key Cache key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cached configurations
   */
  clear(): Promise<void>;
}

// qi/core/src/config/interfaces/index.ts
/**
 * @fileoverview Main entry point for configuration interfaces
 * @module @qi/core/config/interfaces
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export * from './config';
export * from './loader';
export * from './validator';
export * from './cache';

```

This interface structure provides:
1. Clear separation of concerns
2. Comprehensive documentation
3. Practical examples for each interface
4. Type safety with generics
5. Modular organization

Each file focuses on a specific aspect:
- `config.ts`: Core configuration interfaces
- `loader.ts`: Configuration loading interfaces
- `validator.ts`: Validation interfaces
- `cache.ts`: Caching interfaces
- `index.ts`: Re-exports all interfaces

### `qi/core/src/config/errors`

Excellent question! We should definitely implement testing alongside our refactoring. Let me show you the errors structure along with corresponding tests:

```typescript
// qi/core/src/config/errors/codes.ts
/**
 * @fileoverview Error codes for configuration system
 * @module @qi/core/config/errors/codes
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export const CONFIG_ERROR_CODES = {
  INVALID_SCHEMA: "INVALID_SCHEMA",
  SCHEMA_NOT_FOUND: "SCHEMA_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  ENV_LOAD_ERROR: "ENV_LOAD_ERROR",
  ENV_MISSING_ERROR: "ENV_MISSING_ERROR",
  CONFIG_LOAD_ERROR: "CONFIG_LOAD_ERROR",
  CONFIG_PARSE_ERROR: "CONFIG_PARSE_ERROR",
} as const;

export type ConfigErrorCode = typeof CONFIG_ERROR_CODES[keyof typeof CONFIG_ERROR_CODES];

// qi/core/src/config/errors/ConfigError.ts
/**
 * @fileoverview Configuration error classes
 * @module @qi/core/config/errors/ConfigError
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { ValidationError } from "@qi/core/errors";
import { CONFIG_ERROR_CODES, ConfigErrorCode } from "./codes";

export class ConfigError extends ValidationError {
  constructor(
    message: string,
    code: ConfigErrorCode,
    context: Record<string, unknown>
  ) {
    super(message, {
      constraint: code,
      ...context,
    });
    this.name = "ConfigError";
  }

  static fromError(
    error: unknown,
    code: ConfigErrorCode,
    context: Record<string, unknown>
  ): ConfigError {
    const message = error instanceof Error ? error.message : String(error);
    return new ConfigError(message, code, context);
  }

  static schemaError(
    message: string,
    schemaId: string,
    details?: Record<string, unknown>
  ) {
    return new ConfigError(message, CONFIG_ERROR_CODES.INVALID_SCHEMA, {
      key: schemaId,
      ...details,
    });
  }

  static validationError(
    message: string,
    schemaId: string,
    details?: Record<string, unknown>
  ) {
    return new ConfigError(message, CONFIG_ERROR_CODES.VALIDATION_FAILED, {
      key: schemaId,
      ...details,
    });
  }

  static loadError(
    message: string,
    source: string,
    details?: Record<string, unknown>
  ) {
    return new ConfigError(message, CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR, {
      key: source,
      ...details,
    });
  }
}

// qi/core/src/config/errors/index.ts
/**
 * @fileoverview Error exports for configuration system
 * @module @qi/core/config/errors
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export * from './codes';
export * from './ConfigError';

```

Now, let's create corresponding tests to ensure our refactored code maintains functionality:

```typescript
// qi/core/src/config/errors/__tests__/ConfigError.test.ts
/**
 * @fileoverview Tests for configuration error system
 * @module @qi/core/config/errors/__tests__/ConfigError
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { ConfigError, CONFIG_ERROR_CODES } from '..';

describe('ConfigError', () => {
  // Test basic error creation
  test('creates error with correct properties', () => {
    const error = new ConfigError('Test error', CONFIG_ERROR_CODES.INVALID_SCHEMA, {
      test: 'value'
    });

    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
    expect(error.details).toEqual({
      constraint: CONFIG_ERROR_CODES.INVALID_SCHEMA,
      test: 'value'
    });
  });

  // Test static factory methods
  describe('static factories', () => {
    test('fromError creates ConfigError from Error instance', () => {
      const originalError = new Error('Original error');
      const error = ConfigError.fromError(
        originalError,
        CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR,
        { source: 'test' }
      );

      expect(error.message).toBe('Original error');
      expect(error.details.constraint).toBe(CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR);
      expect(error.details.source).toBe('test');
    });

    test('schemaError creates error with schema context', () => {
      const error = ConfigError.schemaError(
        'Invalid schema',
        'test-schema',
        { additionalDetail: 'test' }
      );

      expect(error.message).toBe('Invalid schema');
      expect(error.details.constraint).toBe(CONFIG_ERROR_CODES.INVALID_SCHEMA);
      expect(error.details.key).toBe('test-schema');
      expect(error.details.additionalDetail).toBe('test');
    });

    test('validationError creates error with validation context', () => {
      const error = ConfigError.validationError(
        'Validation failed',
        'test-schema',
        { field: 'testField' }
      );

      expect(error.message).toBe('Validation failed');
      expect(error.details.constraint).toBe(CONFIG_ERROR_CODES.VALIDATION_FAILED);
      expect(error.details.key).toBe('test-schema');
      expect(error.details.field).toBe('testField');
    });

    test('loadError creates error with load context', () => {
      const error = ConfigError.loadError(
        'Failed to load',
        'config.json',
        { reason: 'file not found' }
      );

      expect(error.message).toBe('Failed to load');
      expect(error.details.constraint).toBe(CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR);
      expect(error.details.key).toBe('config.json');
      expect(error.details.reason).toBe('file not found');
    });
  });

  // Test error inheritance
  test('extends ValidationError', () => {
    const error = new ConfigError('Test error', CONFIG_ERROR_CODES.INVALID_SCHEMA, {});
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(ValidationError);
  });

  // Test real-world scenarios
  describe('real-world scenarios', () => {
    test('handles schema validation failure', () => {
      const mockValidationErrors = [
        { keyword: 'required', params: { missingProperty: 'name' } }
      ];

      const error = ConfigError.validationError(
        'Schema validation failed',
        'app-config',
        { errors: mockValidationErrors }
      );

      expect(error.message).toBe('Schema validation failed');
      expect(error.details.errors).toEqual(mockValidationErrors);
    });

    test('handles environment loading failure', () => {
      const originalError = new Error('ENOENT: no such file or directory');
      const error = ConfigError.fromError(
        originalError,
        CONFIG_ERROR_CODES.ENV_LOAD_ERROR,
        { path: '.env' }
      );

      expect(error.message).toBe('ENOENT: no such file or directory');
      expect(error.details.path).toBe('.env');
    });
  });
});

```

And a script to verify our refactoring hasn't broken existing functionality:

```typescript
// qi/core/src/config/__tests__/migration.test.ts
/**
 * @fileoverview Integration tests to verify refactored code maintains compatibility
 * @module @qi/core/config/__tests__/migration
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import path from 'path';
import { ConfigError, CONFIG_ERROR_CODES } from '../errors';
import { Schema } from '../schema';
import { JsonLoader } from '../loaders';
import { EnvLoader } from '../loaders';

describe('Configuration System Migration', () => {
  // Test data
  const testConfig = {
    type: 'test',
    version: '1.0',
    data: { key: 'value' }
  };

  const testSchema = {
    $id: 'test-schema',
    type: 'object',
    required: ['type', 'version', 'data'],
    properties: {
      type: { type: 'string' },
      version: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          key: { type: 'string' }
        }
      }
    }
  };

  // Write test config to temp file
  beforeAll(async () => {
    const fs = require('fs').promises;
    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'config.json'),
      JSON.stringify(testConfig)
    );
  });

  // Test schema validation
  test('validates schema correctly', () => {
    const schema = new Schema({ formats: true });
    
    // Should not throw
    expect(() => {
      schema.validateSchema(testSchema);
    }).not.toThrow();

    // Should throw for invalid schema
    expect(() => {
      schema.validateSchema({
        $id: 'invalid',
        type: 'invalid-type'
      });
    }).toThrow(ConfigError);
  });

  // Test JSON loading
  test('loads JSON config correctly', async () => {
    const schema = new Schema({ formats: true });
    schema.registerSchema('test-schema', testSchema);

    const loader = new JsonLoader(
      path.join(__dirname, 'temp', 'config.json'),
      schema,
      'test-schema'
    );

    const config = await loader.load();
    expect(config).toEqual(testConfig);
  });

  // Test environment loading
  test('loads environment variables correctly', async () => {
    const schema = new Schema({ formats: true });
    const envSchema = {
      $id: 'env-schema',
      type: 'object',
      properties: {
        TEST_VAR: { type: 'string' }
      }
    };

    schema.registerSchema('env-schema', envSchema);

    process.env.TEST_VAR = 'test-value';

    const loader = new EnvLoader(schema, 'env-schema');
    const config = await loader.load();

    expect(config.TEST_VAR).toBe('test-value');
  });

  // Clean up
  afterAll(async () => {
    const fs = require('fs').promises;
    const rimraf = require('rimraf');
    await new Promise(resolve => rimraf(path.join(__dirname, 'temp'), resolve));
  });
});

```

This testing approach provides:

1. **Unit Tests**
   - Test each error type independently
   - Verify error inheritance
   - Check error properties and methods

2. **Integration Tests**
   - Verify compatibility with existing code
   - Test real-world scenarios
   - Ensure no regression

3. **Migration Verification**
   - Test full configuration flow
   - Verify schema validation
   - Check loader functionality

To run the tests during refactoring:

```bash
# Add to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:migration": "jest migration.test.ts"
  }
}

# Run during refactoring
npm run test:watch
```

### `qi/core/src/config/schema`

I'll create the schema implementation while maintaining our testing approach. Let's build the schema module:

```typescript
// qi/core/src/config/schema/validators.ts
/**
 * @fileoverview Schema validator implementations using AJV
 * @module @qi/core/config/schema/validators
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { JsonSchema } from '../types';
import { ConfigError, CONFIG_ERROR_CODES } from '../errors';
import { logger } from '@qi/core/logger';

export interface ValidatorOptions {
  strict?: boolean;
  formats?: boolean;
}

export class SchemaValidators {
  private readonly ajv: Ajv;
  private readonly validators = new Map<string, ValidateFunction>();

  constructor(options: ValidatorOptions = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      validateSchema: true,
      validateFormats: true,
    });

    if (options.formats) {
      addFormats(this.ajv);
    }
  }

  /**
   * Compile and register a new validator
   */
  compileValidator(schema: JsonSchema): ValidateFunction {
    try {
      return this.ajv.compile(schema);
    } catch (error) {
      throw ConfigError.schemaError(
        'Failed to compile schema',
        schema.$id ?? 'unknown',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Register a validator for a schema
   */
  registerValidator(id: string, schema: JsonSchema): void {
    try {
      const validator = this.compileValidator(schema);
      this.validators.set(id, validator);
      logger.debug('Registered validator', { id, schema: schema.$id });
    } catch (error) {
      logger.error('Failed to register validator', { id, error });
      throw error;
    }
  }

  /**
   * Get a registered validator
   */
  getValidator(id: string): ValidateFunction {
    const validator = this.validators.get(id);
    if (!validator) {
      throw new ConfigError(
        `Validator not found: ${id}`,
        CONFIG_ERROR_CODES.SCHEMA_NOT_FOUND,
        { schemaId: id }
      );
    }
    return validator;
  }

  /**
   * Remove a registered validator
   */
  removeValidator(id: string): void {
    this.validators.delete(id);
    this.ajv.removeSchema(id);
  }

  /**
   * Check if a validator exists
   */
  hasValidator(id: string): boolean {
    return this.validators.has(id);
  }
}

// qi/core/src/config/schema/Schema.ts
/**
 * @fileoverview Main schema implementation providing schema management and validation
 * @module @qi/core/config/schema/Schema
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { ISchema } from '../interfaces';
import { JsonSchema } from '../types';
import { ConfigError, CONFIG_ERROR_CODES } from '../errors';
import { SchemaValidators, ValidatorOptions } from './validators';
import { logger } from '@qi/core/logger';

export class Schema implements ISchema {
  private readonly validators: SchemaValidators;
  private readonly schemas = new Map<string, JsonSchema>();

  constructor(options: ValidatorOptions = {}) {
    this.validators = new SchemaValidators(options);
  }

  /**
   * Validate a configuration against a schema
   */
  validate(config: unknown, schemaId: string): void {
    const validator = this.validators.getValidator(schemaId);
    
    if (!validator(config)) {
      throw new ConfigError(
        'Validation failed',
        CONFIG_ERROR_CODES.VALIDATION_FAILED,
        {
          schemaId,
          errors: validator.errors
        }
      );
    }
  }

  /**
   * Validate a schema definition
   */
  validateSchema(schema: JsonSchema): void {
    try {
      if (!this.validators.hasValidator('meta-schema')) {
        // Register meta-schema for validating schemas
        this.validators.registerValidator('meta-schema', {
          $id: 'meta-schema',
          type: 'object',
          required: ['$id', 'type'],
          properties: {
            $id: { type: 'string' },
            type: { type: 'string' }
          }
        });
      }

      const metaValidator = this.validators.getValidator('meta-schema');
      if (!metaValidator(schema)) {
        throw ConfigError.schemaError(
          'Invalid schema definition',
          schema.$id ?? 'unknown',
          { errors: metaValidator.errors }
        );
      }
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      throw ConfigError.schemaError(
        'Schema validation failed',
        schema.$id ?? 'unknown',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Register a new schema
   */
  registerSchema(name: string, schema: JsonSchema): void {
    try {
      if (this.schemas.has(name)) {
        throw ConfigError.schemaError(
          'Schema already registered',
          name,
          { existingSchema: true }
        );
      }

      this.validateSchema(schema);
      this.schemas.set(name, schema);
      this.validators.registerValidator(name, schema);

      logger.info('Registered schema', { name, schemaId: schema.$id });
    } catch (error) {
      logger.error('Failed to register schema', {
        name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Remove a registered schema
   */
  removeSchema(name: string): void {
    this.schemas.delete(name);
    this.validators.removeValidator(name);
  }

  /**
   * Check if a schema exists
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get a registered schema
   */
  getSchema(name: string): JsonSchema | undefined {
    return this.schemas.get(name);
  }
}

// qi/core/src/config/schema/index.ts
/**
 * @fileoverview Schema module exports
 * @module @qi/core/config/schema
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

export * from './Schema';
export * from './validators';

```

And here are the corresponding tests:

```typescript
// qi/core/src/config/schema/__tests__/Schema.test.ts
/**
 * @fileoverview Tests for schema implementation
 * @module @qi/core/config/schema/__tests__
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { Schema } from '../Schema';
import { ConfigError, CONFIG_ERROR_CODES } from '../../errors';

describe('Schema', () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({ formats: true });
  });

  // Test schema registration
  describe('schema registration', () => {
    const validSchema = {
      $id: 'test-schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    };

    test('registers valid schema', () => {
      expect(() => {
        schema.registerSchema('test', validSchema);
      }).not.toThrow();
      
      expect(schema.hasSchema('test')).toBe(true);
    });

    test('prevents duplicate schema registration', () => {
      schema.registerSchema('test', validSchema);
      
      expect(() => {
        schema.registerSchema('test', validSchema);
      }).toThrow(ConfigError);
    });

    test('validates schema during registration', () => {
      const invalidSchema = {
        $id: 'invalid-schema',
        type: 'invalid-type'
      };

      expect(() => {
        schema.registerSchema('invalid', invalidSchema);
      }).toThrow(ConfigError);
    });
  });

  // Test configuration validation
  describe('configuration validation', () => {
    beforeEach(() => {
      schema.registerSchema('person', {
        $id: 'person',
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          age: { type: 'number', minimum: 0 }
        },
        required: ['name', 'email']
      });
    });

    test('validates valid config', () => {
      const validConfig = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      expect(() => {
        schema.validate(validConfig, 'person');
      }).not.toThrow();
    });

    test('throws on invalid config', () => {
      const invalidConfig = {
        name: 'John Doe',
        email: 'invalid-email',
        age: -1
      };

      expect(() => {
        schema.validate(invalidConfig, 'person');
      }).toThrow(ConfigError);
    });

    test('throws on missing required fields', () => {
      const incompleteConfig = {
        name: 'John Doe'
      };

      expect(() => {
        schema.validate(incompleteConfig, 'person');
      }).toThrow(ConfigError);
    });
  });

  // Test schema management
  describe('schema management', () => {
    const testSchema = {
      $id: 'test',
      type: 'object',
      properties: { test: { type: 'string' } }
    };

    test('removes schema correctly', () => {
      schema.registerSchema('test', testSchema);
      expect(schema.hasSchema('test')).toBe(true);

      schema.removeSchema('test');
      expect(schema.hasSchema('test')).toBe(false);
    });

    test('gets schema correctly', () => {
      schema.registerSchema('test', testSchema);
      const retrieved = schema.getSchema('test');
      expect(retrieved).toEqual(testSchema);
    });

    test('returns undefined for non-existent schema', () => {
      const retrieved = schema.getSchema('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  // Test with real-world examples
  describe('real-world scenarios', () => {
    test('validates complex nested schema', () => {
      const databaseConfigSchema = {
        $id: 'database-config',
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
          credentials: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' }
            },
            required: ['username', 'password']
          },
          options: {
            type: 'object',
            additionalProperties: true
          }
        },
        required: ['host', 'port', 'credentials']
      };

      const validConfig = {
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'admin',
          password: 'secret'
        },
        options: {
          maxConnections: 100,
          ssl: true
        }
      };

      schema.registerSchema('database', databaseConfigSchema);
      expect(() => {
        schema.validate(validConfig, 'database');
      }).not.toThrow();
    });

    test('handles format validation', () => {
      const userSchema = {
        $id: 'user-schema',
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          website: { type: 'string', format: 'uri' },
          birthDate: { type: 'string', format: 'date' }
        },
        required: ['email']
      };

      schema.registerSchema('user', userSchema);

      expect(() => {
        schema.validate({
          email: 'invalid-email',
          website: 'not-a-url',
          birthDate: 'not-a-date'
        }, 'user');
      }).toThrow(ConfigError);

      expect(() => {
        schema.validate({
          email: 'user@example.com',
          website: 'https://example.com',
          birthDate: '2000-01-01'
        }, 'user');
      }).not.toThrow();
    });
  });
});

```

Key features of this implementation:

1. **Schema Management**
   - Registration and validation of schemas
   - Schema caching and retrieval
   - Schema removal

2. **Validation**
   - AJV-based validation
   - Custom format support
   - Detailed error reporting

3. **Error Handling**
   - Type-safe error handling
   - Detailed error context
   - Logging integration

4. **Testing**
   - Unit tests for core functionality
   - Integration tests for real-world scenarios
   - Edge case handling

To use this in your application:

```typescript
const schema = new Schema({ formats: true });

// Register a schema
schema.registerSchema('app-config', {
  $id: 'app-config',
  type: 'object',
  properties: {
    port: { type: 'number' },
    host: { type: 'string' },
    database: { 
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
});

// Validate configuration
try {
  schema.validate(config, 'app-config');
} catch (error) {
  if (error instanceof ConfigError) {
    logger.error('Configuration validation failed', {
      errors: error.details.errors
    });
  }
}
```

### `qi/core/src/config/loaders`

Let's refactor the loaders while maintaining their functionality. We'll move them to the new directory structure:

1. First, let's create the new directory structure for loaders:
```
core/src/config/loaders/
├── base/
│   └── BaseLoader.ts
├── JsonLoader.ts
├── EnvLoader.ts
└── index.ts
```

Here's the refactored code:

```typescript
// core/src/config/loaders/base/BaseLoader.ts
import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "../../types/config.js";
import { IConfigLoader } from "../../interfaces/ILoader.js";

/**
 * Abstract base class for configuration loaders.
 * Provides common functionality for loading and watching configurations.
 */
export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  protected watcher?: FSWatcher;
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();
  protected currentConfig?: T;

  /**
   * Loads configuration from the implementing source.
   * Must be implemented by derived classes.
   */
  abstract load(): Promise<T>;

  /**
   * Registers a callback for configuration changes.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }

  /**
   * Removes all watch callbacks and cleans up resources.
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  /**
   * Initializes watching for configuration changes.
   * Must be implemented by derived classes if they support watching.
   */
  protected abstract initializeWatcher(): void;

  /**
   * Notifies registered callbacks of configuration changes.
   */
  protected notifyChange(previous: T, current: T, source: string): void {
    const event: ConfigChangeEvent<T> = {
      previous,
      current,
      timestamp: Date.now(),
      source,
    };
    this.callbacks.forEach((cb) => cb(event));
  }
}

```

```typescript
// core/src/config/loaders/JsonLoader.ts
import { watch } from "fs";
import { readFile } from "fs/promises";
import { ISchema } from "../interfaces/IConfig.js";
import { BaseConfig } from "../types/config.js";
import { logger } from "@qi/core/logger";
import { CONFIG_ERROR_CODES } from "../errors/codes.js";
import { ConfigError } from "../errors/ConfigError.js";
import { BaseLoader } from "./base/BaseLoader.js";

/**
 * Loader implementation for JSON configurations.
 * Supports loading from both file paths and direct objects.
 */
export class JsonLoader<T extends BaseConfig> extends BaseLoader<T> {
  constructor(
    private readonly source: string | Record<string, unknown>,
    private readonly schema: ISchema,
    private readonly schemaId: string
  ) {
    super();
  }

  async load(): Promise<T> {
    try {
      const config =
        typeof this.source === "string"
          ? await this.loadFromFile(this.source)
          : this.source;

      this.schema.validate(config, this.schemaId);
      const previous = this.currentConfig;
      this.currentConfig = config as T;

      if (previous) {
        this.notifyChange(
          previous,
          this.currentConfig,
          typeof this.source === "string" ? this.source : "object"
        );
      }

      return this.currentConfig;
    } catch (error) {
      throw ConfigError.fromError(error, CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR, {
        source: this.source,
      });
    }
  }

  protected initializeWatcher(): void {
    if (typeof this.source !== "string") return;

    if (!this.watcher) {
      this.watcher = watch(this.source, async () => {
        try {
          await this.load();
        } catch (error) {
          logger.error("Error during configuration reload", { error });
        }
      });
    }
  }

  private async loadFromFile(path: string): Promise<unknown> {
    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      throw ConfigError.loadError("Failed to read configuration file", path, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

```

```typescript
// core/src/config/loaders/EnvLoader.ts
import { watch } from "fs";
import { BaseLoader } from "./base/BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "../types/config.js";
import { ISchema } from "../interfaces/IConfig.js";
import { CONFIG_ERROR_CODES } from "../errors/codes.js";
import { ConfigError } from "../errors/ConfigError.js";

/**
 * Loader implementation for environment variables.
 * Supports loading from .env files and process.env.
 */
export class EnvLoader
  T extends BaseConfig & Record<string, string | undefined>
> extends BaseLoader<T> {
  private readonly options: Required<EnvOptions>;
  private refreshTimer?: NodeJS.Timeout;

  constructor(
    private readonly schema: ISchema,
    private readonly schemaId: string,
    options: EnvOptions = {}
  ) {
    super();
    this.options = {
      path: undefined,
      override: false,
      extraFiles: [],
      required: false,
      watch: false,
      refreshInterval: undefined,
      ...options,
    };
  }

  protected initializeWatcher(): void {
    if (!this.options.watch) return;

    if (this.options.path) {
      watch(this.options.path, () => void this.load());
      this.options.extraFiles?.forEach((file) => {
        watch(file, () => void this.load());
      });
    }

    if (this.options.refreshInterval != null) {
      this.refreshTimer = setInterval(
        () => void this.load(),
        this.options.refreshInterval
      );
    }
  }

  override unwatch(): void {
    super.unwatch();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async load(): Promise<T> {
    try {
      const vars = await this.loadFromEnvFiles();
      this.schema.validate(vars, this.schemaId);

      const config = vars as T;
      if (this.currentConfig) {
        this.notifyChange(
          this.currentConfig,
          config,
          this.options.path || "process.env"
        );
      }
      this.currentConfig = config;

      return config;
    } catch (error) {
      throw ConfigError.fromError(error, CONFIG_ERROR_CODES.ENV_LOAD_ERROR, {
        source: this.options.path || "process.env",
      });
    }
  }

  private async loadFromEnvFiles(): Promise<Record<string, string | undefined>> {
    if (!this.options?.path) return process.env;

    try {
      const mainEnvVars = await loadEnv(this.options.path, {
        override: this.options?.override ?? false,
      });

      if (!mainEnvVars && this.options?.required) {
        throw new ConfigError(
          "Required environment file not found",
          CONFIG_ERROR_CODES.ENV_LOAD_ERROR,
          { path: this.options.path }
        );
      }

      for (const file of this.options?.extraFiles ?? []) {
        const extraVars = await loadEnv(file, {
          override: this.options?.override ?? false,
        });

        if (!extraVars && this.options?.required) {
          throw new ConfigError(
            "Required extra environment file not found",
            CONFIG_ERROR_CODES.ENV_LOAD_ERROR,
            { path: file }
          );
        }
      }

      return process.env;
    } catch (error) {
      throw ConfigError.fromError(error, CONFIG_ERROR_CODES.ENV_LOAD_ERROR, {
        source: this.options?.path,
      });
    }
  }
}

```

```typescript
// core/src/config/loaders/index.ts
export * from "./base/BaseLoader.js";
export * from "./JsonLoader.js";
export * from "./EnvLoader.js";

```

Key changes made:
1. Organized loaders into their own directory structure
2. Updated import paths to reflect new structure
3. Added better documentation
4. Fixed type imports
5. Made error handling more consistent
6. Added proper exports in index.ts


Unit Tests:

```typescript
// core/src/config/loaders/__tests__/BaseLoader.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FSWatcher } from "fs";
import { BaseLoader } from "../base/BaseLoader.js";
import { BaseConfig, ConfigChangeEvent } from "../../types/config.js";

// Test implementation of BaseLoader
class TestLoader extends BaseLoader<BaseConfig> {
  watcher: FSWatcher | undefined;
  initializeWatcherCalled = false;

  async load(): Promise<BaseConfig> {
    return { test: "value" };
  }

  protected initializeWatcher(): void {
    this.initializeWatcherCalled = true;
  }

  // Expose protected methods for testing
  public testNotifyChange(previous: BaseConfig, current: BaseConfig, source: string): void {
    this.notifyChange(previous, current, source);
  }
}

describe("BaseLoader", () => {
  let loader: TestLoader;

  beforeEach(() => {
    loader = new TestLoader();
  });

  afterEach(() => {
    loader.unwatch();
  });

  describe("watch", () => {
    it("should add callback and initialize watcher", () => {
      const callback = vi.fn();
      loader.watch(callback);

      expect(loader.initializeWatcherCalled).toBe(true);
      expect(loader["callbacks"].size).toBe(1);
    });

    it("should support multiple watchers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      loader.watch(callback1);
      loader.watch(callback2);

      expect(loader["callbacks"].size).toBe(2);
    });
  });

  describe("unwatch", () => {
    it("should clear all callbacks", () => {
      const callback = vi.fn();
      loader.watch(callback);
      loader.unwatch();

      expect(loader["callbacks"].size).toBe(0);
    });

    it("should close watcher if exists", () => {
      const mockClose = vi.fn();
      loader["watcher"] = { close: mockClose } as unknown as FSWatcher;

      loader.unwatch();

      expect(mockClose).toHaveBeenCalled();
      expect(loader["watcher"]).toBeUndefined();
    });
  });

  describe("notifyChange", () => {
    it("should notify all callbacks with change event", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const previous = { test: "old" };
      const current = { test: "new" };
      const source = "test";

      loader.watch(callback1);
      loader.watch(callback2);
      loader.testNotifyChange(previous, current, source);

      const expectedEvent: ConfigChangeEvent<BaseConfig> = {
        previous,
        current,
        source,
        timestamp: expect.any(Number),
      };

      expect(callback1).toHaveBeenCalledWith(expectedEvent);
      expect(callback2).toHaveBeenCalledWith(expectedEvent);
    });

    it("should handle callback errors gracefully", () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      const normalCallback = vi.fn();
      
      loader.watch(errorCallback);
      loader.watch(normalCallback);

      const previous = { test: "old" };
      const current = { test: "new" };
      
      // Should not throw
      expect(() => loader.testNotifyChange(previous, current, "test")).not.toThrow();
      
      // Second callback should still be called
      expect(normalCallback).toHaveBeenCalled();
    });
  });
});

```

```typescript
// core/src/config/loaders/__tests__/JsonLoader.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFile } from "fs/promises";
import { watch } from "fs";
import { JsonLoader } from "../JsonLoader.js";
import { ISchema } from "../../interfaces/IConfig.js";
import { CONFIG_ERROR_CODES, ConfigError } from "../../errors/index.js";

vi.mock("fs/promises");
vi.mock("fs");

// Mock schema implementation
const mockSchema: ISchema = {
  validate: vi.fn(),
  addSchema: vi.fn(),
};

describe("JsonLoader", () => {
  const mockConfig = { test: "value" };
  const mockPath = "/path/to/config.json";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockConfig));
  });

  describe("load", () => {
    it("should load config from file path", async () => {
      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      const config = await loader.load();

      expect(readFile).toHaveBeenCalledWith(mockPath, "utf-8");
      expect(mockSchema.validate).toHaveBeenCalledWith(mockConfig, "test-schema");
      expect(config).toEqual(mockConfig);
    });

    it("should accept direct object as source", async () => {
      const loader = new JsonLoader(mockConfig, mockSchema, "test-schema");
      const config = await loader.load();

      expect(readFile).not.toHaveBeenCalled();
      expect(mockSchema.validate).toHaveBeenCalledWith(mockConfig, "test-schema");
      expect(config).toEqual(mockConfig);
    });

    it("should throw ConfigError on file read error", async () => {
      const error = new Error("File read error");
      vi.mocked(readFile).mockRejectedValue(error);

      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      
      await expect(loader.load()).rejects.toThrow(ConfigError);
      await expect(loader.load()).rejects.toHaveProperty("code", CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR);
    });

    it("should throw ConfigError on invalid JSON", async () => {
      vi.mocked(readFile).mockResolvedValue("invalid json");

      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      
      await expect(loader.load()).rejects.toThrow(ConfigError);
      await expect(loader.load()).rejects.toHaveProperty("code", CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR);
    });

    it("should throw ConfigError on schema validation failure", async () => {
      const validationError = new Error("Validation failed");
      vi.mocked(mockSchema.validate).mockImplementation(() => { throw validationError; });

      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      
      await expect(loader.load()).rejects.toThrow(ConfigError);
      await expect(loader.load()).rejects.toHaveProperty("code", CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR);
    });
  });

  describe("watch functionality", () => {
    let mockWatcher: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockWatcher = { close: vi.fn() };
      vi.mocked(watch).mockReturnValue(mockWatcher as any);
    });

    it("should initialize file watcher when watch is called", () => {
      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      const callback = vi.fn();

      loader.watch(callback);

      expect(watch).toHaveBeenCalledWith(mockPath, expect.any(Function));
    });

    it("should not initialize watcher for object source", () => {
      const loader = new JsonLoader(mockConfig, mockSchema, "test-schema");
      const callback = vi.fn();

      loader.watch(callback);

      expect(watch).not.toHaveBeenCalled();
    });

    it("should notify watchers on file change", async () => {
      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      const callback = vi.fn();
      
      // Initial load
      await loader.load();
      
      loader.watch(callback);

      // Simulate file change
      const watchCallback = vi.mocked(watch).mock.calls[0][1];
      const newConfig = { test: "new value" };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(newConfig));
      
      await watchCallback();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        previous: mockConfig,
        current: newConfig,
        source: mockPath,
      }));
    });

    it("should handle watch errors gracefully", async () => {
      const loader = new JsonLoader(mockPath, mockSchema, "test-schema");
      const callback = vi.fn();
      
      loader.watch(callback);

      // Simulate file change with error
      const watchCallback = vi.mocked(watch).mock.calls[0][1];
      vi.mocked(readFile).mockRejectedValue(new Error("Read error"));
      
      await watchCallback();

      // Should not throw and callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

```

```typescript
// core/src/config/loaders/__tests__/EnvLoader.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { watch } from "fs";
import { EnvLoader } from "../EnvLoader.js";
import { loadEnv } from "@qi/core/utils";
import { ISchema } from "../../interfaces/IConfig.js";
import { CONFIG_ERROR_CODES, ConfigError } from "../../errors/index.js";

vi.mock("fs");
vi.mock("@qi/core/utils", () => ({
  loadEnv: vi.fn(),
}));

const mockSchema: ISchema = {
  validate: vi.fn(),
  addSchema: vi.fn(),
};

describe("EnvLoader", () => {
  const mockEnvPath = "/path/to/.env";
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  describe("load", () => {
    it("should load from process.env when no path is specified", async () => {
      process.env.TEST_VAR = "test_value";
      const loader = new EnvLoader(mockSchema, "test-schema");

      await loader.load();

      expect(loadEnv).not.toHaveBeenCalled();
      expect(mockSchema.validate).toHaveBeenCalledWith(process.env, "test-schema");
    });

    it("should load from env file when path is specified", async () => {
      const mockEnvVars = { TEST_VAR: "from_file" };
      vi.mocked(loadEnv).mockResolvedValue(mockEnvVars);

      const loader = new EnvLoader(mockSchema, "test-schema", { path: mockEnvPath });
      await loader.load();

      expect(loadEnv).toHaveBeenCalledWith(mockEnvPath, { override: false });
      expect(mockSchema.validate).toHaveBeenCalled();
    });

    it("should handle required env file not found", async () => {
      vi.mocked(loadEnv).mockResolvedValue(null);

      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        required: true,
      });

      await expect(loader.load()).rejects.toThrow(ConfigError);
      await expect(loader.load()).rejects.toHaveProperty(
        "code",
        CONFIG_ERROR_CODES.ENV_LOAD_ERROR
      );
    });

    it("should load multiple env files", async () => {
      const extraPath = "/path/to/extra.env";
      vi.mocked(loadEnv).mockResolvedValue({ TEST_VAR: "value" });

      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        extraFiles: [extraPath],
      });

      await loader.load();

      expect(loadEnv).toHaveBeenCalledWith(mockEnvPath, { override: false });
      expect(loadEnv).toHaveBeenCalledWith(extraPath, { override: false });
    });
  });

  describe("watch functionality", () => {
    let mockWatcher: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockWatcher = { close: vi.fn() };
      vi.mocked(watch).mockReturnValue(mockWatcher as any);
      vi.useFakeTimers();
    });

    it("should initialize file watchers when watch option is true", () => {
      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        watch: true,
      });

      const callback = vi.fn();
      loader.watch(callback);

      expect(watch).toHaveBeenCalledWith(mockEnvPath, expect.any(Function));
    });

    it("should watch extra files", () => {
      const extraPath = "/path/to/extra.env";
      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        extraFiles: [extraPath],
        watch: true,
      });

      const callback = vi.fn();
      loader.watch(callback);

      expect(watch).toHaveBeenCalledWith(mockEnvPath, expect.any(Function));
      expect(watch).toHaveBeenCalledWith(extraPath, expect.any(Function));
    });

    it("should setup refresh interval when specified", () => {
      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        watch: true,
        refreshInterval: 5000,
      });

      const callback = vi.fn();
      loader.watch(callback);

      vi.advanceTimersByTime(5000);

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it("should cleanup watchers and timer on unwatch", () => {
      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        watch: true,
        refreshInterval: 5000,
      });

      const callback = vi.fn();
      loader.watch(callback);
      loader.unwatch();

      expect(mockWatcher.close).toHaveBeenCalled();
      // Verify timer is cleared
      expect(clearInterval).toHaveBeenCalled();
    });

    it("should notify watchers on env file change", async () => {
      process.env.TEST_VAR = "initial";
      const loader = new EnvLoader(mockSchema, "test-schema", {
        path: mockEnvPath,
        watch: true,
      });

      const callback = vi.fn();
      
      // Initial load
      await loader.load();
      
      loader.watch(callback);

      // Simulate file change
      process.env.TEST_VAR = "updated";
      const watchCallback = vi.mocked(watch).mock.calls[0][1];
      await watchCallback();

      expect(callback).toHaveBeenCalledWith
```

### `qi/core/src/config/cache`

We'll implement the cache system with the proposed strategy pattern. Let's organize it under `config/cache/`:



```typescript
// qi/core/src/config/cache/strategies.ts
import { CacheOptions } from '../types';

/**
 * Generic cache strategy interface
 */
export interface ICacheStrategy<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has?(key: string): Promise<boolean>;
}

/**
 * In-memory cache strategy implementation
 */
export class MemoryCacheStrategy<T> implements ICacheStrategy<T> {
  private cache = new Map<string, {
    value: T;
    expires: number;
    metadata?: Record<string, unknown>;
  }>();

  constructor(private defaultTTL: number = 60000) {}

  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set(
    key: string, 
    value: T, 
    options: CacheOptions = { ttl: this.defaultTTL }
  ): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (options.ttl ?? this.defaultTTL),
      metadata: options.metadata
    });
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// qi/core/src/config/cache/manager.ts
import { BaseConfig, CacheOptions } from '../types';
import { IConfigCache } from '../interfaces';
import { ICacheStrategy } from './strategies';
import { logger } from '@qi/core/logger';

export interface CacheManagerOptions extends CacheOptions {
  prefix?: string;
  onHit?(key: string): void;
  onMiss?(key: string): void;
  onSet?(key: string, value: unknown): void;
  onDelete?(key: string): void;
  onError?(error: Error, operation: string, key: string): void;
}

/**
 * Enhanced cache manager with strategy pattern
 */
export class CacheManager<T extends BaseConfig> implements IConfigCache<T> {
  constructor(
    private strategy: ICacheStrategy<T>,
    private options: CacheManagerOptions = {}
  ) {}

  async get(key: string): Promise<T | undefined> {
    const cacheKey = this.formatKey(key);
    
    try {
      const value = await this.strategy.get(cacheKey);
      
      if (value) {
        this.options.onHit?.(key);
        logger.debug('Cache hit', { key: cacheKey });
        return value;
      }

      this.options.onMiss?.(key);
      logger.debug('Cache miss', { key: cacheKey });
      return undefined;
      
    } catch (error) {
      this.handleError(error as Error, 'get', key);
      return undefined;
    }
  }

  async set(key: string, value: T): Promise<void> {
    const cacheKey = this.formatKey(key);
    
    try {
      await this.strategy.set(cacheKey, value, {
        ttl: this.options.ttl,
        metadata: this.options.metadata
      });
      
      this.options.onSet?.(key, value);
      logger.debug('Cache set', { key: cacheKey });
      
    } catch (error) {
      this.handleError(error as Error, 'set', key);
    }
  }

  async has(key: string): Promise<boolean> {
    const cacheKey = this.formatKey(key);
    
    try {
      if (this.strategy.has) {
        return await this.strategy.has(cacheKey);
      }
      
      const value = await this.strategy.get(cacheKey);
      return value !== undefined;
      
    } catch (error) {
      this.handleError(error as Error, 'has', key);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = this.formatKey(key);
    
    try {
      const result = await this.strategy.delete(cacheKey);
      
      if (result) {
        this.options.onDelete?.(key);
        logger.debug('Cache delete', { key: cacheKey });
      }
      
      return result;
      
    } catch (error) {
      this.handleError(error as Error, 'delete', key);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.strategy.clear();
      logger.debug('Cache cleared');
      
    } catch (error) {
      this.handleError(error as Error, 'clear', '*');
    }
  }

  private formatKey(key: string): string {
    return `${this.options.prefix || 'config'}:${key}`;
  }

  private handleError(error: Error, operation: string, key: string): void {
    logger.error('Cache operation failed', {
      operation,
      key,
      error: error.message
    });
    
    this.options.onError?.(error, operation, key);
  }
}

// qi/core/src/config/cache/cached-loader.ts
import { BaseConfig } from '../types';
import { IConfigLoader, IConfigCache } from '../interfaces';

/**
 * Decorator for adding caching to any config loader
 */
export class CachedConfigLoader<T extends BaseConfig> implements IConfigLoader<T> {
  constructor(
    private loader: IConfigLoader<T>,
    private cache: IConfigCache<T>,
    private cacheKey: string
  ) {}

  async load(): Promise<T> {
    // Try cache first
    const cached = await this.cache.get(this.cacheKey);
    if (cached) {
      return cached;
    }

    // Load fresh and cache
    const config = await this.loader.load();
    await this.cache.set(this.cacheKey, config);
    return config;
  }

  watch(callback: (event: any) => void): void {
    if (this.loader.watch) {
      this.loader.watch(async (event) => {
        // Update cache on changes
        await this.cache.set(this.cacheKey, event.current);
        callback(event);
      });
    }
  }

  unwatch(): void {
    if (this.loader.unwatch) {
      this.loader.unwatch();
    }
  }
}

// qi/core/src/config/cache/index.ts
export * from './strategies';
export * from './manager';
export * from './cached-loader';

```

Now let's add the tests:

```typescript
// qi/core/src/config/cache/__tests__/strategies.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCacheStrategy } from '../strategies';

describe('MemoryCacheStrategy', () => {
  let strategy: MemoryCacheStrategy<unknown>;
  const testKey = 'test';
  const testValue = { data: 'test' };

  beforeEach(() => {
    vi.useFakeTimers();
    strategy = new MemoryCacheStrategy(1000); // 1 second TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', async () => {
    await strategy.set(testKey, testValue);
    const result = await strategy.get(testKey);
    expect(result).toEqual(testValue);
  });

  it('should expire values after TTL', async () => {
    await strategy.set(testKey, testValue);
    
    vi.advanceTimersByTime(1500); // Advance past TTL
    
    const result = await strategy.get(testKey);
    expect(result).toBeUndefined();
  });

  it('should support custom TTL per set operation', async () => {
    await strategy.set(testKey, testValue, { ttl: 2000 });
    
    vi.advanceTimersByTime(1500);
    let result = await strategy.get(testKey);
    expect(result).toEqual(testValue);
    
    vi.advanceTimersByTime(1000);
    result = await strategy.get(testKey);
    expect(result).toBeUndefined();
  });

  it('should handle has check correctly', async () => {
    await strategy.set(testKey, testValue);
    expect(await strategy.has(testKey)).toBe(true);
    
    vi.advanceTimersByTime(1500);
    expect(await strategy.has(testKey)).toBe(false);
  });

  it('should handle delete operation', async () => {
    await strategy.set(testKey, testValue);
    expect(await strategy.has(testKey)).toBe(true);
    
    await strategy.delete(testKey);
    expect(await strategy.has(testKey)).toBe(false);
  });

  it('should handle clear operation', async () => {
    await strategy.set(testKey, testValue);
    await strategy.set('other', testValue);
    
    await strategy.clear();
    expect(await strategy.has(testKey)).toBe(false);
    expect(await strategy.has('other')).toBe(false);
  });
});

// qi/core/src/config/cache/__tests__/manager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CacheManager } from '../manager';
import { ICacheStrategy } from '../strategies';
import { BaseConfig } from '../../types';

describe('CacheManager', () => {
  // Mock strategy
  const mockStrategy: ICacheStrategy<BaseConfig> = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn()
  };

  const testKey = 'test';
  const testValue = { type: 'test', version: '1.0' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format keys with prefix', async () => {
    const manager = new CacheManager(mockStrategy, { prefix: 'test-prefix' });
    await manager.get(testKey);
    
    expect(mockStrategy.get).toHaveBeenCalledWith('test-prefix:test');
  });

  it('should call lifecycle hooks', async () => {
    const onHit = vi.fn();
    const onMiss = vi.fn();
    const onSet = vi.fn();
    
    const manager = new CacheManager(mockStrategy, {
      onHit,
      onMiss,
      onSet
    });

    // Test hit
    vi.mocked(mockStrategy.get).mockResolvedValueOnce(testValue);
    await manager.get(testKey);
    expect(onHit).toHaveBeenCalledWith(testKey);

    // Test miss
    vi.mocked(mockStrategy.get).mockResolvedValueOnce(undefined);
    await manager.get(testKey);
    expect(onMiss).toHaveBeenCalledWith(testKey);

    // Test set
    await manager.set(testKey, testValue);
    expect(onSet).toHaveBeenCalledWith(testKey, testValue);
  });

  it('should handle errors gracefully', async () => {
    const onError = vi.fn();
    const manager = new CacheManager(mockStrategy, { onError });

    const error = new Error('Test error');
    vi.mocked(mockStrategy.get).mockRejectedValueOnce(error);
    
    const result = await manager.get(testKey);
    expect(result).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(error, 'get', testKey);
  });
});

// qi/core/src/config/cache/__tests__/cached-loader.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CachedConfigLoader } from '../cached-loader';
import { IConfigLoader, IConfigCache } from '../../interfaces';
import { BaseConfig } from '../../types';

describe('CachedConfigLoader', () => {
  // Mock implementations
  const mockLoader: IConfigLoader<BaseConfig> = {
    load: vi.fn(),
    watch: vi.fn(),
    unwatch: vi.fn()
  };

  const mockCache: IConfigCache<BaseConfig> = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn()
  };

  const testConfig = { type: 'test', version: '1.0' };
  const cacheKey = 'test-config';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use cached value when available', async () => {
    vi.mocked(mockCache.get).mockResolvedValueOnce(testConfig);
    
    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    const result = await loader.load();
    
    expect(result).toEqual(testConfig);
    expect(mockLoader.load).not.toHaveBeenCalled();
  });

  it('should load and cache when no cached value', async () => {
    vi.mocked(mockCache.get).mockResolvedValueOnce(undefined);
    vi.mocked(mockLoader.load).mockResolvedValueOnce(testConfig);
    
    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    const result = await loader.load();
    
    expect(result).toEqual(testConfig);
    expect(mockLoader.load).toHaveBeenCalled();
    expect(mockCache.set).toHaveBeenCalledWith(cacheKey, testConfig);
  });

  it('should update cache on watch events', async () => {
    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    const callback = vi.fn();
    
    loader.watch(callback);
    
    // Get the watch callback passed to the loader
    const watchCallback = vi.mocked(mockLoader.watch).mock.calls[0][0];
    
    // Simulate config change event
    const event = {
      previous: testConfig,
      current: { ...testConfig, version: '1.1' },
      timestamp: Date.now(),
      source: 'test'
    };
    
    await watchCallback(event);
    
    expect(mockCache.set).toHaveBeenCalledWith(cacheKey, event.current);
    expect(callback).toHaveBeenCalledWith(event);
  });

  it('should handle unwatch', () => {
    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    loader.unwatch();
    expect(mockLoader.unwatch).toHaveBeenCalled();
  });

  it('should handle missing watch/unwatch methods gracefully', () => {
    const basicLoader: IConfigLoader<BaseConfig> = {
      load: vi.fn()
    };

    const loader = new CachedConfigLoader(basicLoader, mockCache, cacheKey);
    
    // Should not throw
    expect(() => loader.watch(vi.fn())).not.toThrow();
    expect(() => loader.unwatch()).not.toThrow();
  });

  it('should handle load errors gracefully', async () => {
    vi.mocked(mockCache.get).mockResolvedValueOnce(undefined);
    vi.mocked(mockLoader.load).mockRejectedValueOnce(new Error('Load failed'));

    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    
    await expect(loader.load()).rejects.toThrow('Load failed');
    expect(mockCache.set).not.toHaveBeenCalled();
  });

  it('should handle cache errors gracefully during load', async () => {
    vi.mocked(mockCache.get).mockRejectedValueOnce(new Error('Cache failed'));
    vi.mocked(mockLoader.load).mockResolvedValueOnce(testConfig);

    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    const result = await loader.load();

    expect(result).toEqual(testConfig);
    expect(mockLoader.load).toHaveBeenCalled();
  });

  it('should maintain watch registration across multiple calls', () => {
    const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    loader.watch(callback1);
    loader.watch(callback2);

    expect(mockLoader.watch).toHaveBeenCalledTimes(2);
  });

  describe('Integration scenarios', () => {
    it('should handle complete load-cache-update cycle', async () => {
      // Initial state
      vi.mocked(mockCache.get).mockResolvedValueOnce(undefined);
      vi.mocked(mockLoader.load).mockResolvedValueOnce(testConfig);

      const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);
      const callback = vi.fn();

      // Initial load
      const initialConfig = await loader.load();
      expect(initialConfig).toEqual(testConfig);
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, testConfig);

      // Setup watch
      loader.watch(callback);
      const watchCallback = vi.mocked(mockLoader.watch).mock.calls[0][0];

      // Simulate config update
      const updatedConfig = { ...testConfig, version: '2.0' };
      const updateEvent = {
        previous: testConfig,
        current: updatedConfig,
        timestamp: Date.now(),
        source: 'test'
      };

      await watchCallback(updateEvent);

      // Verify cache update and callback
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, updatedConfig);
      expect(callback).toHaveBeenCalledWith(updateEvent);

      // Subsequent load should use cached value
      vi.mocked(mockCache.get).mockResolvedValueOnce(updatedConfig);
      const cachedConfig = await loader.load();
      expect(cachedConfig).toEqual(updatedConfig);
      expect(mockLoader.load).toHaveBeenCalledTimes(1); // Only called during initial load
    });

    it('should handle concurrent loads correctly', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(undefined);
      vi.mocked(mockLoader.load).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return testConfig;
      });

      const loader = new CachedConfigLoader(mockLoader, mockCache, cacheKey);

      // Initiate multiple concurrent loads
      const loadPromises = [
        loader.load(),
        loader.load(),
        loader.load()
      ];

      const results = await Promise.all(loadPromises);

      // All loads should return the same config
      results.forEach(result => expect(result).toEqual(testConfig));
      // Loader should only be called once
      expect(mockLoader.load).toHaveBeenCalledTimes(1);
      // Cache should be set once with final value
      expect(mockCache.set).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, testConfig);
    });
  });
});
```

The original `ConfigCache` has been renamed and enhanced as `CacheManager` to better reflect its role in managing different caching strategies. Here's the key architectural changes:

1. **Separation of Concerns**:
   - `CacheManager` is now the high-level cache coordinator
   - `MemoryCacheStrategy` handles the actual storage logic (what was originally in ConfigCache)
   - `ICacheStrategy` interface allows for different storage implementations

2. **Enhanced Features**:
   - Strategy pattern allows for different cache implementations
   - Better lifecycle hooks (onHit, onMiss, onSet, etc)
   - Improved error handling
   - Key prefixing support

The relationship works like this:

```typescript
// Before (old way):
const cache = new ConfigCache({ ttl: 60000 });

// After (new way):
const strategy = new MemoryCacheStrategy(60000);
const cache = new CacheManager(strategy, {
  prefix: 'myapp',
  onHit: (key) => console.log(`Cache hit: ${key}`),
  onMiss: (key) => console.log(`Cache miss: ${key}`)
});

// Usage remains similar:
await cache.get('mykey');
await cache.set('mykey', value);
```

This change allows for:
1. Easy swapping of cache implementations (memory, redis, etc)
2. Better monitoring through hooks
3. More flexible configuration
4. Cleaner separation between cache management and storage


### `qi/core/src/config/validation`

I'll help you refactor and enhance the validation system while incorporating the proposed improvements. Let's organize it under `config/validation/`:

```typescript
// qi/core/src/config/validation/validator.ts
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { JsonSchema } from '../types';
import { ISchemaValidator } from '../interfaces';
import { ConfigError, CONFIG_ERROR_CODES } from '../errors';
import { logger } from '@qi/core/logger';

export interface ValidatorOptions {
  strict?: boolean;
  formats?: boolean;
  coerceTypes?: boolean;
  removeAdditional?: boolean | 'all' | 'failing';
  useDefaults?: boolean;
}

/**
 * Schema validator implementation using AJV
 */
export class SchemaValidator implements ISchemaValidator {
  private readonly ajv: Ajv;
  private readonly validators = new Map<string, ValidateFunction>();
  private readonly metaValidators = new Map<string, ValidateFunction>();

  constructor(options: ValidatorOptions = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      coerceTypes: options.coerceTypes ?? false,
      removeAdditional: options.removeAdditional ?? false,
      useDefaults: options.useDefaults ?? true,
      validateFormats: true,
    });

    if (options.formats) {
      addFormats(this.ajv);
    }

    this.initializeMetaValidators();
  }

  private initializeMetaValidators(): void {
    // Basic meta-schema for config schemas
    const baseMetaSchema: JsonSchema = {
      $id: 'base-meta-schema',
      type: 'object',
      required: ['$id', 'type'],
      properties: {
        $id: { type: 'string' },
        type: { type: 'string' },
        properties: { type: 'object' },
        required: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };

    // Strict meta-schema for service configs
    const serviceMetaSchema: JsonSchema = {
      $id: 'service-meta-schema',
      type: 'object',
      required: ['$id', 'type', 'version'],
      properties: {
        $id: { type: 'string' },
        type: { 
          type: 'string',
          enum: ['service']
        },
        version: { 
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        environment: {
          type: 'object',
          required: ['required'],
          properties: {
            required: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    };

    this.registerMetaValidator('base', baseMetaSchema);
    this.registerMetaValidator('service', serviceMetaSchema);
  }

  private registerMetaValidator(name: string, schema: JsonSchema): void {
    try {
      const validator = this.ajv.compile(schema);
      this.metaValidators.set(name, validator);
    } catch (error) {
      throw ConfigError.schemaError(
        'Failed to compile meta-schema',
        name,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  validateSchema(schema: JsonSchema, type: string = 'base'): void {
    const metaValidator = this.metaValidators.get(type);
    if (!metaValidator) {
      throw ConfigError.schemaError(
        `Meta-schema not found: ${type}`,
        schema.$id ?? 'unknown',
        { type }
      );
    }

    if (!metaValidator(schema)) {
      const errors = this.formatValidationErrors(metaValidator.errors ?? []);
      throw ConfigError.schemaError(
        'Invalid schema definition',
        schema.$id ?? 'unknown',
        { errors }
      );
    }

    try {
      // Also compile the schema to validate it's a valid JSON Schema
      this.ajv.compile(schema);
    } catch (error) {
      throw ConfigError.schemaError(
        'Invalid JSON Schema',
        schema.$id ?? 'unknown',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  validate(config: unknown, schemaId: string): void {
    const validator = this.getValidator(schemaId);
    
    if (!validator(config)) {
      const errors = this.formatValidationErrors(validator.errors ?? []);
      throw ConfigError.validationError(
        'Configuration validation failed',
        schemaId,
        { errors }
      );
    }
  }

  private getValidator(schemaId: string): ValidateFunction {
    let validator = this.validators.get(schemaId);
    
    if (!validator) {
      const schema = this.ajv.getSchema(schemaId);
      if (!schema) {
        throw new ConfigError(
          `Schema not found: ${schemaId}`,
          CONFIG_ERROR_CODES.SCHEMA_NOT_FOUND,
          { schemaId }
        );
      }
      validator = schema;
      this.validators.set(schemaId, validator);
    }

    return validator;
  }

  private formatValidationErrors(errors: ErrorObject[]): unknown[] {
    return errors.map(error => ({
      path: error.instancePath,
      keyword: error.keyword,
      message: error.message,
      params: error.params
    }));
  }

  /**
   * Register a new schema for validation
   */
  addSchema(schema: JsonSchema, type?: string): void {
    try {
      // Validate the schema itself first
      this.validateSchema(schema, type);
      
      // Register with AJV
      this.ajv.addSchema(schema);
      
      logger.debug('Registered schema', {
        id: schema.$id,
        type: type ?? 'base'
      });
    } catch (error) {
      logger.error('Failed to register schema', {
        id: schema.$id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Remove a registered schema
   */
  removeSchema(schemaId: string): void {
    this.validators.delete(schemaId);
    this.ajv.removeSchema(schemaId);
  }
}

// qi/core/src/config/validation/typed-validator.ts
import { BaseConfig, JsonSchema } from '../types';
import { IConfigValidator, ISchemaValidator } from '../interfaces';

/**
 * Type-safe validator implementation
 */
export class TypedValidator<T extends BaseConfig> implements IConfigValidator<T> {
  constructor(
    private readonly schemaValidator: ISchemaValidator,
    private readonly schema: JsonSchema
  ) {
    this.schemaValidator.validateSchema(this.schema);
  }

  validate(config: unknown): asserts config is T {
    this.schemaValidator.validate(config, this.schema.$id ?? 'default');
  }

  getSchema(): JsonSchema {
    return this.schema;
  }
}

// qi/core/src/config/validation/index.ts
export * from './validator';
export * from './typed-validator';

```

Now let's add the tests:

```typescript
// qi/core/src/config/validation/__tests__/validator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaValidator } from '../validator';
import { ConfigError, CONFIG_ERROR_CODES } from '../../errors';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator({ formats: true });
  });

  describe('schema validation', () => {
    it('validates basic schema correctly', () => {
      const schema = {
        $id: 'test-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      expect(() => validator.validateSchema(schema)).not.toThrow();
    });

    it('validates service schema correctly', () => {
      const schema = {
        $id: 'service-config',
        type: 'service',
        version: '1.0.0',
        environment: {
          required: ['NODE_ENV', 'PORT']
        }
      };

      expect(() => validator.validateSchema(schema, 'service')).not.toThrow();
    });

    it('throws on invalid schema', () => {
      const invalidSchema = {
        $id: 'invalid',
        type: 123 // Should be string
      };

      expect(() => validator.validateSchema(invalidSchema))
        .toThrow(ConfigError);
    });

    it('throws on invalid service schema', () => {
      const invalidSchema = {
        $id: 'service-config',
        type: 'service',
        version: 'invalid' // Should match semver pattern
      };

      expect(() => validator.validateSchema(invalidSchema, 'service'))
        .toThrow(ConfigError);
    });
  });

  describe('config validation', () => {
    beforeEach(() => {
      validator.addSchema({
        $id: 'test-config',
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          age: { type: 'number', minimum: 0 }
        },
        required: ['name', 'email']
      });
    });

    it('validates correct config', () => {
      const config = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      };

      expect(() => validator.validate(config, 'test-config')).not.toThrow();
    });

    it('throws on missing required fields', () => {
      const config = {
        name: 'Test User'
      };

      expect(() => validator.validate(config, 'test-config'))
        .toThrow(ConfigError);
    });

    it('throws on invalid format', () => {
      const config = {
        name: 'Test User',
        email: 'invalid-email'
      };

      expect(() => validator.validate(config, 'test-config'))
        .toThrow(ConfigError);
    });

    it('throws on invalid number constraint', () => {
      const config = {
        name: 'Test User',
        email: 'test@example.com',
        age: -1
      };

      expect(() => validator.validate(config, 'test-config'))
        .toThrow(ConfigError);
    });
  });

  describe('schema management', () => {
    const schema = {
      $id: 'test',
      type: 'object',
      properties: {
        test: { type: 'string' }
      }
    };

    it('adds and removes schemas correctly', () => {
      validator.addSchema(schema);
      expect(() => validator.validate({ test: 'value' }, 'test')).not.toThrow();

      validator.removeSchema('test');
      expect(() => validator.validate({ test: 'value' }, 'test'))
        .toThrow(ConfigError);
    });

    it('throws on unknown schema', () => {
      expect(() => validator.validate({}, 'unknown'))
        .toThrow(ConfigError);
    });
  });
});

// qi/core/src/config/validation/__tests__/typed-validator.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TypedValidator } from '../typed-validator';
import { ISchemaValidator } from '../../interfaces';
import { BaseConfig } from '../../types';

interface TestConfig extends BaseConfig {
  name: string;
  value: number;
}

describe('TypedValidator', () => {
  const mockSchemaValidator: ISchemaValidator = {
    validate: vi.fn(),
    validateSchema: vi.fn(),
    addSchema: vi.fn(),
    removeSchema: vi.fn()
  };

  const schema = {
    $id: 'test',
    type: 'object',
    properties: {
      name: { type: 'string' },
      value: { type: 'number' }
    },
    required: ['name', 'value']
  };

  it('validates schema on construction', () => {
    new TypedValidator<TestConfig>(mockSchemaValidator, schema);
    expect(mockSchemaValidator.validateSchema).toHaveBeenCalledWith(schema);
  });

  it('delegates validation to schema validator', () => {
    const validator = new TypedValidator<TestConfig>(mockSchemaValidator, schema);
    const config = { name: 'test', value: 42 };

    validator.validate(config);
    expect(mockSchemaValidator.validate).toHaveBeenCalledWith(config, 'test');
  });

  it('returns schema through getter', () => {
    const validator = new TypedValidator<TestConfig>(mockSchemaValidator, schema);
    expect(validator.getSchema()).toBe(schema);
  });

  it('maintains type safety', () => {
    const validator = new TypedValidator<TestConfig>(mockSchemaValidator, schema);
    const config: unknown = { name: 'test', value: 42 };

    validator.validate(config);
    // TypeScript should now know that config is TestConfig
    const typedConfig = config as TestConfig;
    expect(typedConfig.name).toBe('test');
    expect(typedConfig.value).toBe(42);
  });
});

```

Key improvements in this implementation:

1. **Enhanced Schema Validation**:
   - Support for different schema types (base, service)
   - Meta-schema validation
   - Better error messages and formatting
   - Type safety through generics

2. **Flexible Validation Options**:
   - Format validation support
   - Type coercion options
   - Additional property handling
   - Default value handling

3. **Better Error Handling**:
   - Detailed validation errors
   - Type-safe error messages
   - Proper error context

4. **Improved Schema Management**:
   - Schema caching
   - Schema lifecycle management
   - Meta-schema validation

Usage example:

```typescript
// Create a validator
const validator = new SchemaValidator({ formats: true });

// Register a schema
validator.addSchema({
  $id: 'app-config',
  type: 'service',
  version: '1.0.0',
  properties: {
    port: { type: 'number', minimum: 1024 },
    host: { type: 'string' },
    database: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' }
      },
      required: ['url']
    }
  },
  required: ['port', 'host']
}, 'service');

// Create a typed validator
interface AppConfig extends BaseConfig {
  port: number;
  host: string;
  database: {
    url: string;
  };
}

const typedValidator = new TypedValidator<AppConfig>(validator, schema);

// Validate configuration
try {
  typedValidator.validate(config);
  // config is now typed as AppConfig
} catch (error) {
  if (error instanceof ConfigError) {
    logger.error('Configuration validation failed', {
      errors: error.details.errors
    });
  }
}
```

### `qi/core/src/config/monitoring`

Let me create a comprehensive monitoring module that provides health checks, metrics collection, and operational insights for the configuration system.

```typescript
// qi/core/src/config/monitoring/types.ts
import { BaseConfig } from '../types';

export interface MonitoringOptions {
  enabled?: boolean;
  healthCheck?: HealthCheckOptions;
  metrics?: MetricsOptions;
  alerts?: AlertOptions;
}

export interface HealthCheckOptions {
  interval?: number;
  timeout?: number;
  failureThreshold?: number;
  components?: string[];
}

export interface MetricsOptions {
  enabled?: boolean;
  interval?: number;
  maxHistory?: number;
  customMetrics?: Record<string, MetricDefinition>;
}

export interface AlertOptions {
  enabled?: boolean;
  handlers?: AlertHandler[];
  rules?: AlertRule[];
}

export interface MetricDefinition {
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels?: string[];
}

export interface AlertRule {
  name: string;
  condition: (metrics: ConfigMetrics) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AlertHandler {
  handle(alert: Alert): Promise<void>;
}

export interface Alert {
  name: string;
  message: string;
  severity: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  components: Record<string, ComponentHealth>;
  details?: Record<string, unknown>;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  lastSuccess?: number;
  consecutiveFailures: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfigMetrics {
  timestamp: number;
  loaderMetrics: LoaderMetrics;
  cacheMetrics: CacheMetrics;
  validationMetrics: ValidationMetrics;
  customMetrics: Record<string, number>;
}

export interface LoaderMetrics {
  totalLoads: number;
  failedLoads: number;
  loadLatency: HistogramMetric;
  activeLoaders: number;
  lastLoadTimestamp?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  size: number;
  evictions: number;
  totalOperations: number;
}

export interface ValidationMetrics {
  totalValidations: number;
  failedValidations: number;
  validationErrors: Record<string, number>;
  avgValidationTime: number;
}

export interface HistogramMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
}

// qi/core/src/config/monitoring/metrics.ts
import { MetricsOptions, ConfigMetrics, HistogramMetric } from './types';
import { logger } from '@qi/core/logger';

export class MetricsCollector {
  private metrics: ConfigMetrics;
  private history: ConfigMetrics[] = [];
  private customMetrics: Map<string, number> = new Map();
  private histogramData: Map<string, number[]> = new Map();

  constructor(private options: MetricsOptions = {}) {
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): ConfigMetrics {
    return {
      timestamp: Date.now(),
      loaderMetrics: {
        totalLoads: 0,
        failedLoads: 0,
        loadLatency: this.createHistogram(),
        activeLoaders: 0
      },
      cacheMetrics: {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0,
        totalOperations: 0
      },
      validationMetrics: {
        totalValidations: 0,
        failedValidations: 0,
        validationErrors: {},
        avgValidationTime: 0
      },
      customMetrics: {}
    };
  }

  private createHistogram(): HistogramMetric {
    return {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      p95: 0,
      p99: 0
    };
  }

  recordLoadAttempt(duration: number, error?: Error): void {
    const metrics = this.metrics.loaderMetrics;
    metrics.totalLoads++;
    if (error) metrics.failedLoads++;

    this.updateHistogram('loadLatency', duration);
    metrics.lastLoadTimestamp = Date.now();

    logger.debug('Recorded load attempt', {
      duration,
      success: !error,
      totalLoads: metrics.totalLoads
    });
  }

  recordCacheOperation(hit: boolean): void {
    const metrics = this.metrics.cacheMetrics;
    if (hit) metrics.hits++;
    else metrics.misses++;

    metrics.totalOperations++;
    metrics.hitRatio = metrics.hits / metrics.totalOperations;
  }

  recordValidation(duration: number, success: boolean, errorType?: string): void {
    const metrics = this.metrics.validationMetrics;
    metrics.totalValidations++;
    if (!success) {
      metrics.failedValidations++;
      if (errorType) {
        metrics.validationErrors[errorType] = 
          (metrics.validationErrors[errorType] || 0) + 1;
      }
    }

    const totalTime = metrics.avgValidationTime * (metrics.totalValidations - 1) + duration;
    metrics.avgValidationTime = totalTime / metrics.totalValidations;
  }

  setCustomMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
    this.metrics.customMetrics[name] = value;
  }

  private updateHistogram(name: string, value: number): void {
    let data = this.histogramData.get(name) || [];
    data.push(value);

    // Keep histogram data size manageable
    const maxDataPoints = this.options.maxHistory || 1000;
    if (data.length > maxDataPoints) {
      data = data.slice(-maxDataPoints);
    }

    this.histogramData.set(name, data);

    const histogram = this.calculateHistogram(data);
    if (name === 'loadLatency') {
      this.metrics.loaderMetrics.loadLatency = histogram;
    }
  }

  private calculateHistogram(data: number[]): HistogramMetric {
    const sorted = [...data].sort((a, b) => a - b);
    const count = sorted.length;

    if (count === 0) {
      return this.createHistogram();
    }

    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  snapshot(): ConfigMetrics {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  }

  getHistory(): ConfigMetrics[] {
    return [...this.history];
  }

  collect(): void {
    const snapshot = this.snapshot();
    this.history.push(snapshot);

    if (this.options.maxHistory && this.history.length > this.options.maxHistory) {
      this.history = this.history.slice(-this.options.maxHistory);
    }
  }

  reset(): void {
    this.metrics = this.initializeMetrics();
    this.history = [];
    this.customMetrics.clear();
    this.histogramData.clear();
  }
}

// qi/core/src/config/monitoring/health.ts
import { 
  HealthCheckOptions, 
  HealthStatus, 
  ComponentHealth 
} from './types';
import { logger } from '@qi/core/logger';

export class HealthChecker {
  private checks = new Map<string, () => Promise<ComponentHealth>>();
  private status: HealthStatus;
  private checkInterval?: NodeJS.Timeout;

  constructor(private options: HealthCheckOptions = {}) {
    this.status = this.createInitialStatus();
    this.registerDefaultChecks();
  }

  private createInitialStatus(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      components: {},
      details: {}
    };
  }

  private registerDefaultChecks(): void {
    this.registerCheck('cache', async () => {
      // Implement cache health check
      return {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0
      };
    });

    this.registerCheck('loader', async () => {
      // Implement loader health check
      return {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0
      };
    });

    this.registerCheck('validator', async () => {
      // Implement validator health check
      return {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0
      };
    });
  }

  registerCheck(
    name: string, 
    check: () => Promise<ComponentHealth>
  ): void {
    this.checks.set(name, check);
  }

  async check(): Promise<HealthStatus> {
    const components: Record<string, ComponentHealth> = {};
    let overallStatus: HealthStatus['status'] = 'healthy';

    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await Promise.race([
          check(),
          this.timeout(this.options.timeout || 5000)
        ]);

        components[name] = result;

        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        components[name] = {
          status: 'unhealthy',
          lastCheck: Date.now(),
          consecutiveFailures: 
            (this.status.components[name]?.consecutiveFailures || 0) + 1,
          error: error instanceof Error ? error.message : String(error)
        };
        overallStatus = 'unhealthy';
      }
    }

    this.status = {
      status: overallStatus,
      timestamp: Date.now(),
      components,
      details: {
        lastCheck: Date.now(),
        checkCount: Object.keys(components).length
      }
    };

    return this.status;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Health check timed out after ${ms}ms`)), ms);
    });
  }

  startChecks(): void {
    if (this.options.interval && !this.checkInterval) {
      this.checkInterval = setInterval(async () => {
        try {
          const status = await this.check();
          if (status.status !== 'healthy') {
            logger.warn('Unhealthy status detected', { status });
          }
        } catch (error) {
          logger.error('Health check failed', { error });
        }
      }, this.options.interval);
    }
  }

  stopChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }
}

// qi/core/src/config/monitoring/alerts.ts
import { AlertOptions, Alert, AlertRule, ConfigMetrics } from './types';
import { logger } from '@qi/core/logger';

export class AlertManager {
  private readonly rules: AlertRule[];
  private readonly handlers: AlertOptions['handlers'];

  constructor(options: AlertOptions = {}) {
    this.rules = options.rules || [];
    this.handlers = options.handlers || [];
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.rules.push({
      name: 'high-error-rate',
      condition: (metrics: ConfigMetrics) => {
        const errorRate = metrics.loaderMetrics.failedLoads / 
          metrics.loaderMetrics.totalLoads;
        return errorRate > 0.1;
      },
      message: 'High configuration load error rate detected',
      severity: 'warning'
    });

    this.rules.push({
      name: 'low-cache-hit-ratio',
      condition: (metrics: ConfigMetrics) => {
        return metrics.cacheMetrics.hitRatio < 0.5;
      },
      message: 'Low cache hit ratio detected',
      severity: 'info'
    });
  }

  async checkAlerts(metrics: ConfigMetrics): Promise<void> {
    for (const rule of this.rules) {
      try {
        if (rule.condition(metrics)) {
          const alert: Alert = {
            name: rule.name,
            message: rule.message,
            severity: rule.severity,
            timestamp: Date.now(),
            metadata: { metrics }
          };

          await this.handleAlert(alert);
        }
      } catch (error) {
        logger.error('Alert check failed', {
          rule: rule.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async handleAlert(alert: Alert): Promise<void> {
    logger.warn('Alert triggered', { alert });

    for (const handler of this.handlers || []) {
      try {
        await handler.handle(alert);
      } catch (error) {
        logger.error('Alert handler failed', {
          handler: handler.constructor.name,
          alert: alert.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}

// qi/core/src/config/monitoring/index.ts
export * from './types';
export * from './metrics';
export * from './health';
export * from './alerts';

```

Let's also add comprehensive tests for the monitoring system:

```typescript
// qi/core/src/config/monitoring/__tests__/metrics.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsCollector } from '../metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector({
      enabled: true,
      maxHistory: 10
    });
  });

  describe('load metrics', () => {
    it('records successful load attempts', () => {
      collector.recordLoadAttempt(100);
      const metrics = collector.snapshot();

      expect(metrics.loaderMetrics.totalLoads).toBe(1);
      expect(metrics.loaderMetrics.failedLoads).toBe(0);
      expect(metrics.loaderMetrics.loadLatency.avg).toBe(100);
    });

    it('records failed load attempts', () => {
      collector.recordLoadAttempt(100, new Error('Load failed'));
      const metrics = collector.snapshot();

      expect(metrics.loaderMetrics.totalLo
```

### `qi/core/src/config/factory`

I'll update the factory module to better integrate with the new monitoring system:

```typescript
// qi/core/src/config/factory/types.ts
import { BaseConfig, CacheOptions, JsonSchema } from '../types';
import { MonitoringOptions } from '../monitoring/types';

export interface FactoryOptions {
  strict?: boolean;
  formats?: boolean;
  cache?: CacheOptions;
  monitoring?: MonitoringOptions;
}

export interface LoaderOptions<T extends BaseConfig> {
  source: string | Record<string, unknown>;
  schema: JsonSchema;
  type?: string;
  watch?: boolean;
  transform?: (data: unknown) => T | Promise<T>;
}

// qi/core/src/config/factory/ConfigFactory.ts
import { ISchema, IConfigCache, IConfigLoader } from '../interfaces';
import { BaseConfig, JsonSchema } from '../types';
import { JsonLoader } from '../loaders/JsonLoader';
import { EnvLoader } from '../loaders/EnvLoader';
import { CachedConfigLoader } from '../cache/cached-loader';
import { FactoryOptions, LoaderOptions } from './types';
import { MetricsCollector } from '../monitoring/metrics';
import { HealthChecker } from '../monitoring/health';
import { AlertManager } from '../monitoring/alerts';
import { ConfigError } from '../errors';
import { logger } from '@qi/core/logger';

/**
 * Generic configuration factory with integrated monitoring
 */
export class ConfigFactory {
  private readonly metrics: MetricsCollector;
  private readonly health: HealthChecker;
  private readonly alerts: AlertManager;

  constructor(
    private readonly schema: ISchema,
    private readonly cache?: IConfigCache<BaseConfig>,
    private readonly options: FactoryOptions = {}
  ) {
    // Initialize monitoring components
    this.metrics = new MetricsCollector(options.monitoring?.metrics);
    this.health = new HealthChecker(options.monitoring?.healthCheck);
    this.alerts = new AlertManager(options.monitoring?.alerts);

    // Register health checks
    this.registerHealthChecks();

    // Start monitoring if enabled
    if (options.monitoring?.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Creates a monitored configuration loader
   */
  createLoader<T extends BaseConfig>(options: LoaderOptions<T>): IConfigLoader<T> {
    const startTime = Date.now();
    try {
      // Register schema if needed
      const schemaId = options.schema.$id ?? options.type ?? 'config';
      if (!this.schema.hasSchema(schemaId)) {
        this.schema.registerSchema(schemaId, options.schema);
      }

      // Create base loader
      const baseLoader = typeof options.source === 'string' && options.source.endsWith('.env')
        ? new EnvLoader<T>(this.schema, schemaId, { path: options.source, watch: options.watch })
        : new JsonLoader<T>(options.source, this.schema, schemaId);

      // Add transformation if needed
      const transformedLoader = options.transform
        ? this.wrapWithTransform(baseLoader, options.transform)
        : baseLoader;

      // Add monitoring wrapper
      const monitoredLoader = this.wrapWithMonitoring(transformedLoader, schemaId);

      // Add caching if configured
      if (this.cache) {
        return new CachedConfigLoader(
          monitoredLoader,
          this.cache,
          typeof options.source === 'string' ? options.source : schemaId
        );
      }

      return monitoredLoader;
    } catch (error) {
      this.metrics.recordLoadAttempt(Date.now() - startTime, error as Error);
      throw error;
    }
  }

  /**
   * Combines multiple loaders with monitoring
   */
  combineLoaders<T extends BaseConfig>(...loaders: IConfigLoader<Partial<T>>[]): IConfigLoader<T> {
    return this.wrapWithMonitoring({
      async load(): Promise<T> {
        const configs = await Promise.all(loaders.map(loader => loader.load()));
        return configs.reduce((merged, config) => ({ ...merged, ...config }), {}) as T;
      },

      watch(callback: (event: any) => void): void {
        loaders.forEach(loader => {
          if (loader.watch) {
            loader.watch(callback);
          }
        });
      },

      unwatch(): void {
        loaders.forEach(loader => {
          if (loader.unwatch) {
            loader.unwatch();
          }
        });
      }
    }, 'combined');
  }

  /**
   * Wraps a loader with monitoring capabilities
   */
  private wrapWithMonitoring<T extends BaseConfig>(
    loader: IConfigLoader<T>,
    id: string
  ): IConfigLoader<T> {
    return {
      async load(): Promise<T> {
        const startTime = Date.now();
        try {
          const config = await loader.load();
          const duration = Date.now() - startTime;
          this.metrics.recordLoadAttempt(duration);
          await this.alerts.checkAlerts(this.metrics.snapshot());
          return config;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.metrics.recordLoadAttempt(duration, error as Error);
          throw error;
        }
      },

      watch(callback: (event: any) => void): void {
        if (loader.watch) {
          loader.watch(async (event) => {
            try {
              this.metrics.setCustomMetric(`${id}_changes`, 
                (this.metrics.snapshot().customMetrics[`${id}_changes`] || 0) + 1
              );
              callback(event);
            } catch (error) {
              logger.error('Watch callback failed', { 
                id, 
                error: error instanceof Error ? error.message : String(error)
              });
            }
          });
        }
      },

      unwatch(): void {
        if (loader.unwatch) {
          loader.unwatch();
        }
      }
    };
  }

  /**
   * Wraps a loader with transformation capabilities
   */
  private wrapWithTransform<T extends BaseConfig>(
    loader: IConfigLoader<unknown>,
    transform: (data: unknown) => T | Promise<T>
  ): IConfigLoader<T> {
    return {
      async load(): Promise<T> {
        const startTime = Date.now();
        try {
          const data = await loader.load();
          const transformed = await transform(data);
          this.metrics.setCustomMetric('transform_time', Date.now() - startTime);
          return transformed;
        } catch (error) {
          this.metrics.setCustomMetric('transform_errors',
            (this.metrics.snapshot().customMetrics['transform_errors'] || 0) + 1
          );
          throw error;
        }
      },

      watch(callback: (event: any) => void): void {
        if (loader.watch) {
          loader.watch(async (event) => {
            try {
              const transformedEvent = {
                ...event,
                current: await transform(event.current),
                previous: event.previous ? await transform(event.previous) : undefined
              };
              callback(transformedEvent);
            } catch (error) {
              logger.error('Transform failed in watch', {
                error: error instanceof Error ? error.message : String(error)
              });
            }
          });
        }
      },

      unwatch: loader.unwatch?.bind(loader)
    };
  }

  /**
   * Registers health checks for monitoring
   */
  private registerHealthChecks(): void {
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

    // Register loader health check
    this.health.registerCheck('loader', async () => {
      const metrics = this.metrics.snapshot();
      const errorRate = metrics.loaderMetrics.failedLoads / metrics.loaderMetrics.totalLoads;

      return {
        status: errorRate < 0.05 ? 'healthy' : errorRate < 0.1 ? 'degraded' : 'unhealthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        metadata: { errorRate }
      };
    });

    // Register validation health check
    this.health.registerCheck('validator', async () => {
      const metrics = this.metrics.snapshot();
      const errorRate = metrics.validationMetrics.failedValidations / 
        metrics.validationMetrics.totalValidations;

      return {
        status: errorRate < 0.01 ? 'healthy' : errorRate < 0.05 ? 'degraded' : 'unhealthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        metadata: { errorRate }
      };
    });
  }

  /**
   * Starts the monitoring system
   */
  private startMonitoring(): void {
    this.health.startChecks();
  }

  /**
   * Gets current monitoring metrics
   */
  getMetrics() {
    return this.metrics.snapshot();
  }

  /**
   * Gets current health status
   */
  getHealth() {
    return this.health.getStatus();
  }

  /**
   * Cleans up resources
   */
  cleanup(): void {
    this.health.stopChecks();
  }
}

```

Key improvements in this updated factory implementation:

1. **Integrated Monitoring**
   - Metrics collection for all loader operations
   - Health checks for different components
   - Alert system for detecting issues

2. **Enhanced Observability**
   - Detailed metrics for load times, cache hits, validation errors
   - Component health monitoring
   - Custom metric support

3. **Better Error Handling**
   - Error tracking in metrics
   - Health status degradation on errors
   - Alert triggering for error conditions

4. **Performance Tracking**
   - Load time measurements
   - Transform time tracking
   - Cache performance metrics

Usage example:

```typescript
// Create factory with monitoring
const factory = new ConfigFactory(schema, cache, {
  monitoring: {
    enabled: true,
    healthCheck: {
      interval: 30000,  // Check health every 30s
      timeout: 5000     // Health check timeout
    },
    metrics: {
      enabled: true,
      interval: 10000,  // Collect metrics every 10s
      maxHistory: 100   // Keep last 100 metric points
    },
    alerts: {
      enabled: true,
      handlers: [
        // Custom alert handlers
        {
          async handle(alert) {
            console.log(`Alert: ${alert.message}`);
          }
        }
      ]
    }
  }
});

// Create monitored loader
const loader = factory.createLoader({
  source: 'config/app.json',
  schema: appSchema,
  watch: true
});

// Load configuration with monitoring
try {
  const config = await loader.load();
  
  // Check metrics
  const metrics = factory.getMetrics();
  console.log('Load time:', metrics.loaderMetrics.loadLatency.avg);
  
  // Check health
  const health = factory.getHealth();
  console.log('System health:', health.status);
  
} catch (error) {
  console.error('Load failed:', error);
}
```

This implementation provides comprehensive monitoring capabilities while maintaining the clean separation of concerns in the factory module.

