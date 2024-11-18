/**
 * @fileoverview
 * @module JsonLoader
 *
 * @description
 * This module defines the JsonLoader class, which extends BaseLoader to load configurations
 * from JSON sources. It provides functionality to read, parse, validate, and monitor JSON
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @created 2024-11-16
 * @modified 2024-11-19
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { watch } from "fs";
import { readFile } from "fs/promises";
import { ISchema } from "./IConfig.js";
import { BaseConfig } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_ERROR_CODES, ConfigError } from "./errors.js";
import { BaseLoader } from "./BaseLoader.js";

/**
 * JsonLoader class.
 *
 * @class JsonLoader
 * @extends {BaseLoader<T>}
 * @implements {IConfigValidator<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides functionality to load configuration objects from JSON sources, including file-based sources.
 * It handles reading JSON files, parsing them, validating against a schema, and watching for changes.
 */
export class JsonLoader<T extends BaseConfig> extends BaseLoader<T> {
  /**
   * Creates an instance of JsonLoader.
   *
   * @constructor
   * @param {string | Record<string, unknown>} source - The source of the configuration, either a file path or an object.
   * @param {ISchema} schema - The schema used to validate the configuration.
   * @param {string} schemaId - The identifier of the schema.
   * @description
   * Initializes the JsonLoader with the provided source, schema, and schema ID.
   */
  constructor(
    private readonly source: string | Record<string, unknown>,
    private readonly schema: ISchema,
    private readonly schemaId: string
  ) {
    super();
  }

  /**
   * Loads and validates the configuration.
   *
   * @async
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded and validated configuration.
   * @throws {ConfigError} - Throws an error if loading or validation fails.
   * @description
   * Loads the configuration from the source, validates it against the schema, and returns the validated configuration.
   */
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

  /**
   * Initializes the file system watcher for the configuration source.
   *
   * @protected
   * @method initializeWatcher
   * @returns {void}
   * @description
   * Sets up a watcher on the configuration file to detect changes and reload the configuration.
   */
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

  /**
   * Stops watching for configuration changes.
   *
   * @method unwatch
   * @returns {void}
   * @description
   * Closes the file system watcher and clears all registered callbacks.
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  /**
   * Loads the configuration from a JSON file.
   *
   * @private
   * @async
   * @method loadFromFile
   * @param {string} path - The file path to load the configuration from.
   * @returns {Promise<unknown>} - A promise that resolves to the parsed configuration object.
   * @throws {ConfigError} - Throws an error if reading or parsing the file fails.
   * @description
   * Reads the JSON configuration file and parses its content.
   */
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
