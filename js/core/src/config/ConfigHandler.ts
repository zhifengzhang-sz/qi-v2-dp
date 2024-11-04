// src/config/ConfigHandler.ts

import { BaseConfig, ConfigValidator } from "./BaseConfig.js";
import { logger } from "@qi/core/logger";

/**
 * ConfigHandler class to manage configuration instances
 */
export class ConfigHandler<T extends BaseConfig> {
  private static instances = new Map<string, ConfigHandler<any>>();
  private readonly config: T;
  private readonly validator: ConfigValidator<T>;

  private constructor(config: T, validator: ConfigValidator<T>) {
    this.config = Object.freeze({ ...config });
    this.validator = validator;
  }

  /**
   * Initializes a configuration handler instance
   * @param type - The type identifier for the configuration
   * @param configRaw - The raw configuration object
   * @param validator - The ConfigValidator instance
   */
  public static initialize<T extends BaseConfig>(
    type: string,
    configRaw: unknown,
    validator: ConfigValidator<T>
  ): void {
    if (this.instances.has(type)) {
      throw new Error(`Configuration for ${type} is already initialized`);
    }

    const validConfig = validator.validate(configRaw);
    const handler = new ConfigHandler(validConfig, validator);
    this.instances.set(type, handler);
    logger.info(`Configuration handler for "${type}" initialized`);
  }

  /**
   * Retrieves a configuration handler instance
   * @param type - The type identifier for the configuration
   * @returns ConfigHandler instance
   */
  public static getInstance<T extends BaseConfig>(
    type: string
  ): ConfigHandler<T> {
    const instance = this.instances.get(type);
    if (!instance) {
      throw new Error(`Configuration for "${type}" is not initialized`);
    }
    return instance as ConfigHandler<T>;
  }

  /**
   * Retrieves the configuration object
   * @returns Readonly configuration object
   */
  public getConfig(): Readonly<T> {
    return this.config;
  }

  /**
   * Retrieves the validator
   * @returns ConfigValidator instance
   */
  public getValidator(): ConfigValidator<T> {
    return this.validator;
  }
}
