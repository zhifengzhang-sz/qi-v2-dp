## The `js/core/src/config`

### `types.ts`

```typescript
/**
 * Type definitions for configuration management
 */

/**
 * JSON Schema version identifier
 */
export type SchemaVersion = "2019-09" | "2020-12";

/**
 * Configuration change event type
 */
export type ConfigChangeEvent<T> = {
  previous: T;
  current: T;
  timestamp: number;
  source: string;
};

/**
 * Base interface for all configuration objects
 */
export interface BaseConfig {
  readonly type: string;
  readonly version: string;
  readonly schemaVersion?: SchemaVersion;
}

/**
 * Options for environment variable loading
 */
export interface EnvOptions {
  path?: string;
  override?: boolean;
  extraFiles?: string[];
  required?: boolean;
  watch?: boolean;
  refreshInterval?: number;
}

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

/**
 * Configuration cache options
 */
export interface CacheOptions {
  ttl: number;
  refreshOnAccess?: boolean;
  onExpire?: (key: string) => void;
}
```

### `IConfig.ts`

```typescript
/**
 * Core configuration management interfaces
 */

import { BaseConfig, ConfigChangeEvent, JsonSchema } from "./types.js";

/**
 * Configuration factory interface
 */
export interface IConfigFactory {
  /**
   * Create a new configuration loader
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T>;

  /**
   * Create a new configuration validator
   */
  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T>;
}

/**
 * Configuration handler interface
 */
export interface IConfigHandler<T, R> {
  handle(config: T): R | Promise<R>;
}

/**
 * Enhanced configuration loader interface
 */
export interface IConfigLoader<T extends BaseConfig> {
  /**
   * Load configuration
   */
  load(): Promise<T>;

  /**
   * Watch for configuration changes
   */
  watch?(callback: (event: ConfigChangeEvent<T>) => void): void;

  /**
   * Stop watching for changes
   */
  unwatch?(): void;
}

/**
 * Configuration validator interface
 */
export interface IConfigValidator<T extends BaseConfig> {
  /**
   * Validate configuration
   */
  validate(config: unknown): asserts config is T;

  /**
   * Get validation schema
   */
  getSchema(): JsonSchema;
}

/**
 * Schema validator interface
 */
export interface ISchemaValidator {
  validate(config: unknown, schemaId: string): void;
  validateSchema(schema: JsonSchema): void;
}

/**
 * Enhanced schema management interface
 */
export interface ISchema extends ISchemaValidator {
  getSchema(name: string): JsonSchema | undefined;
  registerSchema(name: string, schema: JsonSchema): void;
  removeSchema(name: string): void;
  hasSchema(name: string): boolean;
}

/**
 * Configuration cache interface
 */
export interface IConfigCache<T extends BaseConfig> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

### `schema.ts`

```typescript
import { Ajv, ValidateFunction } from "ajv";
import { ISchema } from "./IConfig.js";
import { JsonSchema } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_ERROR_CODES, ConfigError } from "./errors.js";
import addFormats from "ajv-formats";

export class Schema implements ISchema {
  private readonly ajv: Ajv;
  private readonly schemas = new Map<string, JsonSchema>();
  private readonly validators = new Map<string, ValidateFunction>();

  constructor(options: { strict?: boolean; formats?: boolean } = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      validateSchema: true,
      validateFormats: true,
    });

    if (options.formats) {
      addFormats.default(this.ajv);
    }
  }

  validate(config: unknown, schemaId: string): void {
    const validator = this.validators.get(schemaId);
    if (!validator) {
      throw new ConfigError(
        "Schema not found",
        CONFIG_ERROR_CODES.SCHEMA_NOT_FOUND,
        {
          schemaId,
        }
      );
    }

    if (!validator(config)) {
      throw new ConfigError(
        "Validation failed",
        CONFIG_ERROR_CODES.CONFIG_PARSE_ERROR,
        {
          schemaId,
          errors: validator.errors,
        }
      );
    }
  }

  validateSchema(schema: JsonSchema): void {
    if (!this.ajv.validateSchema(schema)) {
      throw ConfigError.schemaError(
        "Invalid schema definition",
        schema.$id ?? "unknown",
        { errors: this.ajv.errors }
      );
    }
  }

  registerSchema(name: string, schema: JsonSchema): void {
    try {
      // Check if schema already exists
      if (this.schemas.has(name)) {
        throw ConfigError.schemaError(
          "Schema with this name already exists",
          name,
          { existingSchema: true }
        );
      }

      // Check if schema ID already exists in AJV
      if (schema.$id && this.ajv.getSchema(schema.$id)) {
        throw ConfigError.schemaError(
          "Schema with this $id already exists",
          schema.$id,
          { existingId: true }
        );
      }

      this.validateSchema(schema);
      this.schemas.set(name, schema);
      const validator = this.ajv.compile(schema);
      this.validators.set(schema.$id ?? name, validator);
      logger.info("Registered schema", { name, schemaId: schema.$id });
    } catch (error) {
      logger.error("Failed to register schema", {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ConfigError) {
        throw error;
      }
      throw ConfigError.schemaError("Failed to register schema", name, {
        schema,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  removeSchema(name: string): void {
    const schema = this.schemas.get(name);
    if (schema) {
      this.ajv.removeSchema(schema.$id);
      this.schemas.delete(name);
      this.validators.delete(schema.$id ?? name);
    }
  }

  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  getSchema(name: string): JsonSchema | undefined {
    return this.schemas.get(name);
  }
}
```

### `ConfigCache.ts`

```typescript
import { IConfigCache } from "./IConfig.js";
import { BaseConfig, CacheOptions } from "./types.js";

/**
 * Configuration cache implementation
 */
export class ConfigCache<T extends BaseConfig> implements IConfigCache<T> {
  private cache: Map<string, { value: T; expires: number }> = new Map();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions) {
    this.options = {
      refreshOnAccess: false,
      onExpire: () => {},
      ...options,
    };
  }

  private isExpired(expires: number): boolean {
    return Date.now() > expires;
  }

  private setExpiry(): number {
    return Date.now() + this.options.ttl;
  }

  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
      return undefined;
    }

    if (this.options.refreshOnAccess) {
      entry.expires = this.setExpiry();
    }

    return entry.value;
  }

  async set(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      value,
      expires: this.setExpiry(),
    });
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
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
```

### `ConfigFactory.ts`

```typescript
import { CachedConfigLoader } from "./CachedConfigLoader.js";
import {
  IConfigCache,
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
} from "./IConfig.js";
import { JsonLoader } from "./JsonLoader.js";
import { SchemaValidator } from "./SchemaValidator.js";
import { BaseConfig, JsonSchema } from "./types.js";

/**
 * Configuration factory implementation
 */
export class ConfigFactory implements IConfigFactory {
  constructor(
    private readonly schema: ISchema,
    private readonly cache?: IConfigCache<BaseConfig>
  ) {}

  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T> {
    const { type, version, schema } = options;

    // Register schema if not already registered
    if (!this.schema.hasSchema(schema.$id ?? type)) {
      this.schema.registerSchema(type, schema);
    }

    return new CachedConfigLoader(
      new JsonLoader<T>(
        `config/${type}-${version}.json`,
        this.schema,
        schema.$id ?? type
      ),
      this.cache
    );
  }

  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T> {
    return new SchemaValidator<T>(this.schema, schema);
  }
}
```

### `BaseLoader.ts`

```typescript
import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "./types.js";
import { IConfigLoader } from "./IConfig.js";

export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  protected watcher?: FSWatcher;
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();
  protected currentConfig?: T;

  abstract load(): Promise<T>;

  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }

  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  protected abstract initializeWatcher(): void;

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

### `JsonLoader.ts`

```typescript
import { watch } from "fs";
import { readFile } from "fs/promises";
import { ISchema } from "./IConfig.js";
import { BaseConfig } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_ERROR_CODES, ConfigError } from "./errors.js";
import { BaseLoader } from "./BaseLoader.js";

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
      this.currentConfig = config as T;
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
          const previous = this.currentConfig;
          const current = await this.load();

          if (previous && current) {
            this.notifyChange(previous, current, this.source as string);
          }
        } catch (error) {
          logger.error("Error during configuration reload", { error });
        }
      });
    }
  }

  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
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

### `EnvLoader.ts`

```typescript
// js/core/src/config/EnvLoader.ts
import { BaseLoader } from "./BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "./types.js";
import { ISchema } from "./IConfig.js";
import { CONFIG_ERROR_CODES, ConfigError } from "./errors.js";
import { watch } from "fs";

export class EnvLoader<
  T extends BaseConfig & Record<string, string | undefined>,
> extends BaseLoader<T> {
  private readonly options: EnvOptions;
  private refreshTimer?: NodeJS.Timeout;

  constructor(
    private readonly schema: ISchema,
    private readonly schemaId: string,
    options: EnvOptions = {}
  ) {
    super();
    this.options = {
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

  private async loadFromEnvFiles(): Promise<
    Record<string, string | undefined>
  > {
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

### `CachedConfigLoader.ts`

```typescript
import { IConfigCache, IConfigLoader } from "./IConfig.js";
import { BaseConfig, ConfigChangeEvent } from "./types.js";

export class CachedConfigLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  constructor(
    private readonly loader: IConfigLoader<T>,
    private readonly cache?: IConfigCache<BaseConfig>
  ) {}

  async load(): Promise<T> {
    if (!this.cache) {
      return this.loader.load();
    }

    const cached = await this.cache.get(this.getCacheKey());
    if (cached) {
      return cached as T;
    }

    const config = await this.loader.load();
    await this.cache.set(this.getCacheKey(), config);
    return config;
  }

  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    if ("watch" in this.loader && typeof this.loader.watch === "function") {
      this.loader.watch(async (event) => {
        if (this.cache) {
          await this.cache.set(this.getCacheKey(), event.current);
        }
        callback(event);
      });
    }
  }

  unwatch(): void {
    if ("unwatch" in this.loader && typeof this.loader.unwatch === "function") {
      this.loader.unwatch();
    }
  }

  private getCacheKey(): string {
    return `config:${this.loader.constructor.name}`;
  }
}
```

### `SchemaValidator.ts`

```typescript
import { IConfigValidator, ISchemaValidator } from "./IConfig.js";
import { BaseConfig, JsonSchema } from "./types.js";

export class SchemaValidator<T extends BaseConfig>
  implements IConfigValidator<T>
{
  constructor(
    private readonly schemaValidator: ISchemaValidator,
    private readonly schema: JsonSchema
  ) {
    this.schemaValidator.validateSchema(this.schema);
  }

  validate(config: unknown): asserts config is T {
    this.schemaValidator.validate(config, this.schema.$id ?? "default");
  }

  getSchema(): JsonSchema {
    return this.schema;
  }
}
```

### `errors.ts`

```typescript
// js/core/src/config/errors.ts
import { ValidationError } from "@qi/core/errors";

export const CONFIG_ERROR_CODES = {
  INVALID_SCHEMA: "INVALID_SCHEMA",
  SCHEMA_NOT_FOUND: "SCHEMA_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  ENV_LOAD_ERROR: "ENV_LOAD_ERROR",
  ENV_MISSING_ERROR: "ENV_MISSING_ERROR",
  CONFIG_LOAD_ERROR: "CONFIG_LOAD_ERROR",
  CONFIG_PARSE_ERROR: "CONFIG_PARSE_ERROR",
} as const;

export type ConfigErrorCode =
  (typeof CONFIG_ERROR_CODES)[keyof typeof CONFIG_ERROR_CODES];

/**
 * Configuration-specific error class
 * Extends ValidationError to maintain error hierarchy
 */
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
  /**
   * Helper method to create schema-related errors
   */
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

  /**
   * Helper method to create validation errors
   */
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

  /**
   * Helper method to create environment loading errors
   */
  static envError(
    message: string,
    path: string,
    details?: Record<string, unknown>
  ) {
    return new ConfigError(message, CONFIG_ERROR_CODES.ENV_LOAD_ERROR, {
      key: path,
      ...details,
    });
  }

  /**
   * Helper method to create config loading errors
   */
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
```

### `index.ts`

```typescript
// js/core/src/config/index.js
export { ConfigFactory } from "./ConfigFactory.js";
export { ConfigCache } from "./ConfigCache.js";
export { BaseLoader } from "./BaseLoader.js";
export { JsonLoader } from "./JsonLoader.js";
export { EnvLoader } from "./EnvLoader.js";
export { CachedConfigLoader } from "./CachedConfigLoader.js";
export { SchemaValidator } from "./SchemaValidator.js";
export { Schema } from "./schema.js";
export { ConfigError, CONFIG_ERROR_CODES } from "./errors.js";
export { BaseConfig, JsonSchema, EnvOptions, CacheOptions } from "./types.js";
export {
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
  IConfigCache,
  IConfigHandler,
} from "./IConfig.js";
```

