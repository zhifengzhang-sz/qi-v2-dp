// src/config/BaseConfig.ts

/**
 * Base configuration interface
 */
export interface BaseConfig {
  readonly type: string;
}

/**
 * Base schema interface
 */
export interface BaseSchema<T extends BaseConfig> {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

/**
 * Configuration validator interface
 */
export interface ConfigValidator<T extends BaseConfig> {
  validate(config: unknown): T;
  getSchema(): BaseSchema<T>;
}