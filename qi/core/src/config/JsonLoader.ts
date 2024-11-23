/**
 * @fileoverview
 * @module JsonLoader
 *
 * @description
 * This module defines the JsonLoader class, which extends BaseLoader to load configurations
 * from JSON sources. It provides functionality to read, parse, validate, and monitor JSON
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-23
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
import { CONFIG_LOADER_CODES, ConfigLoaderError } from "./errors.js";
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
      // If it's already a ConfigLoaderError, re-throw it directly
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      // Otherwise, wrap it as a CONFIG_LOAD_ERROR
      throw new ConfigLoaderError(
        error instanceof Error ? error.message : String(error),
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: typeof this.source === "string" ? this.source : "object",
          error: String(error),
        }
      );
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
      try {
        return JSON.parse(content);
      } catch (error) {
        // Use CONFIG_PARSE_ERROR (2010) instead of PARSE_ERROR (1002)
        throw new ConfigLoaderError(
          "Invalid JSON syntax",
          CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
          {
            source: path,
            content,
            parseError: String(error),
          }
        );
      }
    } catch (error) {
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      throw new ConfigLoaderError(
        "Failed to read file",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: path,
          error: String(error),
        }
      );
    }
  }
}
