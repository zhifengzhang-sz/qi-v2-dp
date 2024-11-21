/**
 * @fileoverview Configuration system exports for managing application configurations.
 * Provides comprehensive configuration management including loading, validation,
 * caching, and monitoring capabilities.
 * @module @qi/core/config
 *
 * Key features:
 * - Configuration loading from JSON files and environment variables
 * - JSON Schema validation with custom validators
 * - In-memory caching with TTL support
 * - Real-time configuration change monitoring
 * - Type-safe configuration handling
 *
 * @example
 * ```typescript
 * // Initialize configuration factory
 * const factory = new ConfigFactory(schema, cache);
 *
 * // Create loader with schema validation
 * const loader = factory.createLoader({
 *   type: 'app',
 *   version: '1.0',
 *   schema: appSchema
 * });
 *
 * // Load and validate configuration
 * const config = await loader.load();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-21
 */

// Configuration factory for creating loaders and validators
export { ConfigFactory } from "./ConfigFactory.js";

// Cache implementation for configuration storage
export { ConfigCache } from "./ConfigCache.js";

// Configuration loaders for different sources
export { JsonLoader } from "./JsonLoader.js"; // JSON file loader
export { EnvLoader } from "./EnvLoader.js"; // Environment variables loader
export { CachedConfigLoader } from "./CachedConfigLoader.js"; // Cached loader wrapper

// Schema validation components
export { SchemaValidator } from "./SchemaValidator.js";
export { Schema } from "./schema.js";

// Error handling
export { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";

/**
 * Configuration type definitions:
 * - BaseConfig: Base interface for all configuration objects
 * - JsonSchema: JSON Schema type definitions for validation
 * - EnvOptions: Options for environment variable loading
 * - CacheOptions: Configuration cache settings
 */
export { BaseConfig, JsonSchema, EnvOptions, CacheOptions } from "./types.js";

/**
 * Core configuration interfaces:
 * - IConfigFactory: Factory for creating configuration loaders/validators
 * - IConfigLoader: Generic configuration loader interface
 * - IConfigValidator: Configuration validation interface
 * - ISchema: Schema management interface
 * - IConfigCache: Configuration caching interface
 * - IConfigHandler: Configuration processing interface
 */
export {
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
  IConfigCache,
  IConfigHandler,
} from "./IConfig.js";
