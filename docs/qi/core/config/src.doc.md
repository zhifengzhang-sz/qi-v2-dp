### `qi/core/src/config/validation`

Ah yes, I apologize for missing proper JSDoc documentation! You're absolutely right. Let me show you quickly how the documentation should have looked for just one file as an example:

```typescript
/**
 * @fileoverview Schema validator implementation providing JSON Schema validation with additional
 * features like meta-schema validation, format validation, and detailed error reporting.
 * @module @qi/core/config/validation/validator
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { JsonSchema } from '../types';
import { ISchemaValidator } from '../interfaces';
import { ConfigError, CONFIG_ERROR_CODES } from '../errors';
import { logger } from '@qi/core/logger';

/**
 * Options for configuring the schema validator behavior
 * 
 * @interface ValidatorOptions
 * @property {boolean} [strict=true] - Enable strict mode for schema validation
 * @property {boolean} [formats=false] - Enable extended format validation
 * @property {boolean} [coerceTypes=false] - Automatically coerce value types to match schema
 * @property {boolean|'all'|'failing'} [removeAdditional=false] - Remove additional properties from validated objects
 * @property {boolean} [useDefaults=true] - Apply default values from schema during validation
 */
export interface ValidatorOptions {
  strict?: boolean;
  formats?: boolean;
  coerceTypes?: boolean;
  removeAdditional?: boolean | 'all' | 'failing';
  useDefaults?: boolean;
}

/**
 * Schema validator implementation using AJV
 * Provides JSON Schema validation with support for meta-schemas and format validation
 * 
 * @class SchemaValidator
 * @implements {ISchemaValidator}
 * 
 * @example
 * ```typescript
 * const validator = new SchemaValidator({ formats: true });
 * 
 * validator.addSchema({
 *   $id: 'config-schema',
 *   type: 'object',
 *   properties: {
 *     port: { type: 'number' }
 *   }
 * });
 * 
 * validator.validate(config, 'config-schema');
 * ```
 */
export class SchemaValidator implements ISchemaValidator {
  private readonly ajv: Ajv;
  private readonly validators = new Map<string, ValidateFunction>();
  private readonly metaValidators = new Map<string, ValidateFunction>();

  /**
   * Creates a new schema validator instance
   * 
   * @param {ValidatorOptions} [options={}] - Validator configuration options
   * @throws {ConfigError} If meta-schema initialization fails
   */
  constructor(options: ValidatorOptions = {}) {
    // ... rest of the implementation ...
  }

  /**
   * Validates a configuration object against a registered schema
   * 
   * @param {unknown} config - Configuration object to validate
   * @param {string} schemaId - ID of the schema to validate against
   * @throws {ConfigError} If validation fails or schema not found
   * 
   * @example
   * ```typescript
   * try {
   *   validator.validate(config, 'app-config');
   * } catch (error) {
   *   if (error instanceof ConfigError) {
   *     console.error('Validation failed:', error.details);
   *   }
   * }
   * ```
   */
  validate(config: unknown, schemaId: string): void {
    // ... rest of the implementation ...
  }

  // ... rest of the class implementation ...
}

```

Every source file should have had:
1. File overview comment
2. Interface/type documentation
3. Class documentation with examples
4. Method documentation with parameters, return values, and examples
5. Error documentation
6. Usage examples


### `qi/core/src/config/cache`

Let me show you how the cache module should have been properly documented:

```typescript
// qi/core/src/config/cache/strategies.ts
/**
 * @fileoverview Cache strategy implementations providing different storage mechanisms
 * for configuration caching. Includes base interface and memory-based implementation.
 * @module @qi/core/config/cache/strategies
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { CacheOptions } from '../types';

/**
 * Generic cache strategy interface defining the contract for cache implementations.
 * Implementations can provide different storage mechanisms (memory, redis, etc).
 * 
 * @interface ICacheStrategy
 * @template T Type of values stored in cache
 */
export interface ICacheStrategy<T> {
  /**
   * Retrieves a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<T | undefined>} Cached value or undefined if not found/expired
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Stores a value in cache
   * @param {string} key - Cache key
   * @param {T} value - Value to cache
   * @param {CacheOptions} [options] - Cache options (TTL, metadata)
   */
  set(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Checks if a key exists and is not expired
   * @param {string} key - Cache key
   */
  has?(key: string): Promise<boolean>;

  /**
   * Removes a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if value was removed
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clears all cached values
   */
  clear(): Promise<void>;
}

/**
 * In-memory cache implementation using Map
 * Provides time-based expiration and optional metadata storage
 * 
 * @class MemoryCacheStrategy
 * @implements {ICacheStrategy<T>}
 * @template T Type of values stored in cache
 * 
 * @example
 * ```typescript
 * const cache = new MemoryCacheStrategy<AppConfig>(60000); // 1 minute TTL
 * await cache.set('config', appConfig);
 * const config = await cache.get('config');
 * ```
 */
export class MemoryCacheStrategy<T> implements ICacheStrategy<T> {
  private cache = new Map<string, {
    value: T;
    expires: number;
    metadata?: Record<string, unknown>;
  }>();

  /**
   * Creates a new memory cache instance
   * @param {number} defaultTTL - Default time-to-live in milliseconds
   */
  constructor(private defaultTTL: number = 60000) {}

  /**
   * Retrieves a value from cache if not expired
   * @param {string} key - Cache key
   * @returns {Promise<T | undefined>} Cached value or undefined
   */
  async get(key: string): Promise<T | undefined> {
    // ... implementation ...
  }

  // ... rest of implementation ...
}

// qi/core/src/config/cache/manager.ts
/**
 * @fileoverview Cache manager implementation providing high-level caching operations
 * with support for different storage strategies and lifecycle hooks.
 * @module @qi/core/config/cache/manager
 */

import { BaseConfig, CacheOptions } from '../types';
import { IConfigCache } from '../interfaces';
import { ICacheStrategy } from './strategies';
import { logger } from '@qi/core/logger';

/**
 * Configuration options for cache manager
 * 
 * @interface CacheManagerOptions
 * @extends CacheOptions
 * @property {string} [prefix] - Key prefix for namespacing cached values
 * @property {Function} [onHit] - Called when cache hit occurs
 * @property {Function} [onMiss] - Called when cache miss occurs
 * @property {Function} [onSet] - Called when value is cached
 * @property {Function} [onDelete] - Called when value is deleted
 * @property {Function} [onError] - Called when error occurs
 */
export interface CacheManagerOptions extends CacheOptions {
  prefix?: string;
  onHit?(key: string): void;
  onMiss?(key: string): void;
  onSet?(key: string, value: unknown): void;
  onDelete?(key: string): void;
  onError?(error: Error, operation: string, key: string): void;
}

/**
 * High-level cache manager implementing strategy pattern for flexible storage options
 * Provides lifecycle hooks and error handling
 * 
 * @class CacheManager
 * @implements {IConfigCache<T>}
 * @template T Type of configuration objects being cached
 * 
 * @example
 * ```typescript
 * const strategy = new MemoryCacheStrategy<AppConfig>();
 * const cache = new CacheManager(strategy, {
 *   prefix: 'app',
 *   onHit: key => console.log(`Cache hit: ${key}`),
 *   onMiss: key => console.log(`Cache miss: ${key}`)
 * });
 * 
 * await cache.set('config', appConfig);
 * const config = await cache.get('config');
 * ```
 */
export class CacheManager<T extends BaseConfig> implements IConfigCache<T> {
  /**
   * Creates a new cache manager instance
   * @param {ICacheStrategy<T>} strategy - Cache storage strategy
   * @param {CacheManagerOptions} [options] - Cache manager options
   */
  constructor(
    private strategy: ICacheStrategy<T>,
    private options: CacheManagerOptions = {}
  ) {}

  /**
   * Retrieves a value from cache
   * Handles cache hits/misses and triggers appropriate lifecycle hooks
   * 
   * @param {string} key - Cache key
   * @returns {Promise<T | undefined>} Cached value or undefined
   * @fires onHit when cache hit occurs
   * @fires onMiss when cache miss occurs
   * @fires onError when error occurs
   */
  async get(key: string): Promise<T | undefined> {
    // ... implementation ...
  }

  // ... rest of implementation ...
}

// qi/core/src/config/cache/cached-loader.ts
/**
 * @fileoverview Cached configuration loader implementation providing caching layer
 * for any configuration loader.
 * @module @qi/core/config/cache/cached-loader
 */

import { BaseConfig } from '../types';
import { IConfigLoader, IConfigCache } from '../interfaces';

/**
 * Decorator for adding caching capabilities to configuration loaders
 * Implements cache-aside pattern with automatic cache updates on config changes
 * 
 * @class CachedConfigLoader
 * @implements {IConfigLoader<T>}
 * @template T Type of configuration being loaded
 * 
 * @example
 * ```typescript
 * const baseLoader = new JsonLoader<AppConfig>(configPath);
 * const cache = new CacheManager(new MemoryCacheStrategy());
 * const loader = new CachedConfigLoader(baseLoader, cache, 'app-config');
 * 
 * // Will check cache first, then fallback to baseLoader
 * const config = await loader.load();
 * ```
 */
export class CachedConfigLoader<T extends BaseConfig> implements IConfigLoader<T> {
  /**
   * Creates a new cached loader instance
   * @param {IConfigLoader<T>} loader - Base configuration loader
   * @param {IConfigCache<T>} cache - Cache implementation
   * @param {string} cacheKey - Key for caching loaded configuration
   */
  constructor(
    private loader: IConfigLoader<T>,
    private cache: IConfigCache<T>,
    private cacheKey: string
  ) {}

  /**
   * Loads configuration with caching
   * Implements cache-aside pattern: check cache first, fallback to loader
   * 
   * @returns {Promise<T>} Loaded configuration
   * @throws {ConfigError} If loading fails
   */
  async load(): Promise<T> {
    // ... implementation ...
  }

  /**
   * Sets up configuration change watching with cache updates
   * @param {Function} callback - Change notification callback
   */
  watch(callback: (event: any) => void): void {
    // ... implementation ...
  }

  /**
   * Removes configuration change watchers
   */
  unwatch(): void {
    // ... implementation ...
  }
}

// qi/core/src/config/cache/index.ts
/**
 * @fileoverview Cache module exports providing configuration caching capabilities.
 * @module @qi/core/config/cache
 */

export * from './strategies';
export * from './manager';
export * from './cached-loader';

```

Key documentation elements included:

1. **File Headers**:
   - Module description
   - File path
   - Author info
   - Creation/modification dates

2. **Interface Documentation**:
   - Purpose description
   - Method descriptions
   - Parameter/return types
   - Generic type parameters

3. **Class Documentation**:
   - Class purpose
   - Implementation details
   - Usage examples
   - Generic type parameters
   - Constructor parameters

4. **Method Documentation**:
   - Parameter descriptions
   - Return value descriptions
   - Thrown errors
   - Event notifications
   - Usage examples

5. **Type Documentation**:
   - Property descriptions
   - Optional/required status
   - Type constraints

6. **Examples**:
   - Practical usage examples
   - Common scenarios
   - Error handling

### `qi/core/src/config/loaders`

I'll add comprehensive documentation for the loaders module:

```typescript
// qi/core/src/config/loaders/base/BaseLoader.ts
/**
 * @fileoverview Abstract base loader implementation providing common functionality
 * for configuration loading and change detection.
 * @module @qi/core/config/loaders/base/BaseLoader
 * 
 * @author [Your Name]
 * @created 2024-03-18
 * @modified 2024-03-18
 */

import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "../../types/config.js";
import { IConfigLoader } from "../../interfaces/ILoader.js";

/**
 * Abstract base class for configuration loaders.
 * Provides common functionality for loading configurations and watching for changes.
 * 
 * @abstract
 * @class BaseLoader
 * @implements {IConfigLoader<T>}
 * @template T Configuration type extending BaseConfig
 * 
 * @example
 * ```typescript
 * class CustomLoader extends BaseLoader<MyConfig> {
 *   async load(): Promise<MyConfig> {
 *     // Custom loading logic
 *   }
 *   
 *   protected initializeWatcher(): void {
 *     // Custom watch logic
 *   }
 * }
 * ```
 */
export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  /** File system watcher instance */
  protected watcher?: FSWatcher;
  /** Change notification callbacks */
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();
  /** Current configuration state */
  protected currentConfig?: T;

  /**
   * Loads configuration from the implementing source
   * @abstract
   * @returns {Promise<T>} Loaded configuration
   * @throws {ConfigError} If loading fails
   */
  abstract load(): Promise<T>;

  /**
   * Registers a callback for configuration changes
   * @param {Function} callback Change notification callback
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }

  /**
   * Removes all watch callbacks and cleans up resources
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  /**
   * Initializes watching for configuration changes
   * Must be implemented by derived classes if they support watching
   * @abstract
   * @protected
   */
  protected abstract initializeWatcher(): void;

  /**
   * Notifies registered callbacks of configuration changes
   * @protected
   * @param {T} previous Previous configuration
   * @param {T} current New configuration
   * @param {string} source Source of the change
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

// qi/core/src/config/loaders/JsonLoader.ts
/**
 * @fileoverview JSON configuration loader implementation supporting file and object sources
 * with change detection for file-based configurations.
 * @module @qi/core/config/loaders/JsonLoader
 */

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
 * Supports loading from both file paths and direct objects with schema validation.
 * 
 * @class JsonLoader
 * @extends {BaseLoader<T>}
 * @template T Configuration type extending BaseConfig
 * 
 * @example
 * ```typescript
 * // Load from file
 * const fileLoader = new JsonLoader<AppConfig>(
 *   '/path/to/config.json',
 *   schema,
 *   'app-schema'
 * );
 * 
 * // Load from object
 * const objectLoader = new JsonLoader<AppConfig>(
 *   { port: 3000 },
 *   schema,
 *   'app-schema'
 * );
 * ```
 */
export class JsonLoader<T extends BaseConfig> extends BaseLoader<T> {
  /**
   * Creates a new JSON loader instance
   * @param {string | Record<string, unknown>} source Configuration source (file path or object)
   * @param {ISchema} schema Schema validator
   * @param {string} schemaId Schema identifier
   */
  constructor(
    private readonly source: string | Record<string, unknown>,
    private readonly schema: ISchema,
    private readonly schemaId: string
  ) {
    super();
  }

  /**
   * Loads and validates configuration from source
   * @returns {Promise<T>} Loaded and validated configuration
   * @throws {ConfigError} If loading or validation fails
   */
  async load(): Promise<T> {
    // ... implementation ...
  }

  /**
   * Sets up file watching for file-based configurations
   * @protected
   */
  protected initializeWatcher(): void {
    // ... implementation ...
  }

  /**
   * Loads configuration from JSON file
   * @private
   * @param {string} path File path
   * @returns {Promise<unknown>} Parsed JSON content
   * @throws {ConfigError} If file read or parse fails
   */
  private async loadFromFile(path: string): Promise<unknown> {
    // ... implementation ...
  }
}

// qi/core/src/config/loaders/EnvLoader.ts
/**
 * @fileoverview Environment variable configuration loader with support for
 * .env files and process.env variables.
 * @module @qi/core/config/loaders/EnvLoader
 */

import { watch } from "fs";
import { BaseLoader } from "./base/BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "../types/config.js";
import { ISchema } from "../interfaces/IConfig.js";
import { CONFIG_ERROR_CODES } from "../errors/codes.js";
import { ConfigError } from "../errors/ConfigError.js";

/**
 * Loader implementation for environment variables.
 * Supports loading from .env files and process.env with validation.
 * 
 * @class EnvLoader
 * @extends {BaseLoader<T>}
 * @template T Configuration type extending BaseConfig and string record
 * 
 * @example
 * ```typescript
 * const loader = new EnvLoader(schema, 'env-schema', {
 *   path: '.env',
 *   required: true,
 *   watch: true,
 *   refreshInterval: 30000
 * });
 * 
 * const config = await loader.load();
 * loader.watch(event => console.log('Env changed:', event));
 * ```
 */
export class EnvLoader
  T extends BaseConfig & Record<string, string | undefined>
> extends BaseLoader<T> {
  private readonly options: Required<EnvOptions>;
  private refreshTimer?: NodeJS.Timeout;

  /**
   * Creates a new environment loader instance
   * @param {ISchema} schema Schema validator
   * @param {string} schemaId Schema identifier
   * @param {EnvOptions} [options] Loader options
   */
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

  /**
   * Initializes file watching and refresh timer
   * @protected
   */
  protected initializeWatcher(): void {
    // ... implementation ...
  }

  /**
   * Removes watchers and cleans up refresh timer
   */
  override unwatch(): void {
    super.unwatch();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Loads environment variables from files and process.env
   * @returns {Promise<T>} Loaded and validated environment configuration
   * @throws {ConfigError} If loading or validation fails
   */
  async load(): Promise<T> {
    // ... implementation ...
  }

  /**
   * Loads and merges environment variables from all configured files
   * @private
   * @returns {Promise<Record<string, string | undefined>>} Loaded environment variables
   * @throws {ConfigError} If required file is missing or load fails
   */
  private async loadFromEnvFiles(): Promise<Record<string, string | undefined>> {
    // ... implementation ...
  }
}

// qi/core/src/config/loaders/index.ts
/**
 * @fileoverview Configuration loader module exports providing various
 * configuration loading implementations.
 * @module @qi/core/config/loaders
 */

export * from "./base/BaseLoader.js";
export * from "./JsonLoader.js";
export * from "./EnvLoader.js";

```

Key documentation features added:

1. **Module Documentation**:
   - Purpose and responsibilities
   - File organization
   - Module relationships

2. **Class Documentation**:
   - Inheritance relationships
   - Generic type constraints
   - Implementation requirements
   - Usage examples

3. **Method Documentation**:
   - Parameter descriptions
   - Return values
   - Error conditions
   - Protected/private visibility
   - Abstract method requirements

4. **Interface Documentation**:
   - Type parameters
   - Method contracts
   - Implementation requirements

5. **Examples**:
   - Common usage patterns
   - Configuration options
   - Error handling
   - Watch setup

6. **Property Documentation**:
   - Visibility modifiers
   - Type information
   - Usage context

The documentation provides:
- Clear understanding of each loader's purpose
- Implementation requirements for derived classes
- Usage examples for common scenarios
- Error handling guidance
- Type safety information

