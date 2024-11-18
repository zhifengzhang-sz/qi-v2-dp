/**
 * @fileoverview
 * @module EnvLoader
 *
 * @description
 * This module defines the EnvLoader class, which extends BaseLoader to load configurations
 * from environment files. It provides functionality to read, parse, validate, and monitor environment
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @created 2024-11-16
 * @modified 2024-11-19
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { BaseLoader } from "./BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "./types.js";
import { ISchema } from "./IConfig.js";
import { CONFIG_ERROR_CODES, ConfigError } from "./errors.js";
import { watch } from "fs";

/**
 * EnvLoader class.
 *
 * @class EnvLoader
 * @extends {BaseLoader<T>}
 * @template T - The type of the configuration object, extending BaseConfig and including environment variables.
 * @description
 * Loads configuration objects from environment files, supports watching for file changes,
 * and periodically refreshes the configuration based on specified intervals.
 */
export class EnvLoader<
  T extends BaseConfig & Record<string, string | undefined>,
> extends BaseLoader<T> {
  /**
   * Configuration loader options.
   *
   * @private
   * @type {EnvOptions}
   */
  private readonly options: EnvOptions;

  /**
   * Timer reference for periodic configuration refresh.
   *
   * @private
   * @type {NodeJS.Timeout | undefined}
   */
  private refreshTimer?: NodeJS.Timeout;

  /**
   * Creates an instance of EnvLoader.
   *
   * @constructor
   * @param {ISchema} schema - The schema used to validate the configuration.
   * @param {string} schemaId - The identifier of the schema.
   * @param {EnvOptions} [options={}] - Optional settings for the EnvLoader.
   * @property {boolean} [options.override=false] - Whether to override existing environment variables.
   * @property {string[]} [options.extraFiles=[]] - Additional environment files to load.
   * @property {boolean} [options.required=false] - Whether the environment files are required.
   * @property {boolean} [options.watch=false] - Whether to watch environment files for changes.
   * @property {number} [options.refreshInterval] - Interval in milliseconds to refresh the configuration.
   * @description
   * Initializes the EnvLoader with the provided schema, schema ID, and optional settings.
   * Sets default values for options if they are not provided.
   */
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

  /**
   * Initializes watchers and refresh timers based on the provided options.
   *
   * @protected
   * @method initializeWatcher
   * @returns {void}
   * @description
   * Sets up file watchers for the main environment file and any extra files.
   * Initializes a refresh timer if a refresh interval is specified.
   */
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

  /**
   * Stops watching for configuration changes and clears the refresh timer if set.
   *
   * @override
   * @method unwatch
   * @returns {void}
   * @description
   * Invokes the superclass's unwatch method to close file watchers and clears the refresh timer,
   * ensuring that no further configuration changes are monitored or loaded.
   */
  override unwatch(): void {
    super.unwatch();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Loads and validates the configuration from environment files or process.env.
   *
   * @async
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded and validated configuration.
   * @throws {ConfigError} - Throws an error if loading or validation fails.
   * @description
   * Attempts to load configuration variables from specified environment files.
   * Validates the loaded variables against the provided schema. If a previous configuration exists,
   * it notifies registered callbacks of the change. Updates the current configuration with the new values.
   */
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

  /**
   * Loads environment variables from the main and extra environment files.
   *
   * @private
   * @async
   * @method loadFromEnvFiles
   * @returns {Promise<Record<string, string | undefined>>} - A promise that resolves to the merged environment variables.
   * @throws {ConfigError} - Throws an error if required environment files are missing or fail to load.
   * @description
   * Reads environment variables from the specified main environment file and any additional files.
   * If the main file or any extra files are required but not found, it throws a ConfigError.
   * Merges all loaded environment variables with process.env before returning.
   */
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
