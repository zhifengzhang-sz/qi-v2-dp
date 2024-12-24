/**
 * @fileoverview
 * @module EnvLoader
 *
 * @description
 * This module defines the EnvLoader class, which extends BaseLoader to load configurations
 * from environment files. It provides functionality to read, parse, validate, and monitor environment
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-12-25
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

/// <reference types="node" />

import { BaseLoader } from "./BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "./types.js";
import { ISchema } from "./IConfig.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";

export class EnvLoader<
  T extends BaseConfig & Record<string, string | undefined>,
> extends BaseLoader<T> {
  private readonly options: EnvOptions;
  private refreshTimer?: NodeJS.Timeout;
  private fileWatchers: FSWatcher[] = [];

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
      const mainWatcher = watch(this.options.path, async (eventType) => {
        if (eventType === "change") {
          await this.load();
        }
      });
      this.fileWatchers.push(mainWatcher);

      this.options.extraFiles?.forEach((file) => {
        const watcher = watch(file, async (eventType) => {
          if (eventType === "change") {
            await this.load();
          }
        });
        this.fileWatchers.push(watcher);
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

    // Close all file watchers
    for (const watcher of this.fileWatchers) {
      watcher.close();
    }
    this.fileWatchers = [];

    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async load(): Promise<T> {
    try {
      // Load new state
      const vars = await this.loadFromEnvFiles();
      this.schema.validate(vars, this.schemaId);
      const newConfig = vars as T;

      // Track state change
      const prevConfig = this.currentConfig;
      this.currentConfig = newConfig;

      // Notify watchers if state changed
      if (prevConfig) {
        this.notifyChange(
          prevConfig, // previous state
          this.currentConfig, // new state
          this.options.path || "process.env"
        );
      }

      return this.currentConfig;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        { source: this.options.path || "process.env" }
      );
    }
  }

  private async loadFromEnvFiles(): Promise<
    Record<string, string | undefined>
  > {
    if (!this.options?.path) return process.env;

    try {
      // Load main env file
      const mainEnvVars = await loadEnv(this.options.path, {
        override: this.options?.override ?? false,
      });

      if (!mainEnvVars && this.options?.required) {
        throw ConfigLoaderError.create(
          "Required environment file not found",
          CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
          this.options.path
        );
      }

      // Start with main env vars
      let envVars = { ...process.env, ...mainEnvVars };

      // Load and merge extra files
      for (const file of this.options?.extraFiles ?? []) {
        const extraVars = await loadEnv(file, {
          override: this.options?.override ?? false,
        });

        if (!extraVars && this.options?.required) {
          throw ConfigLoaderError.create(
            "Required extra environment file not found",
            CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
            file
          );
        }

        envVars = { ...envVars, ...extraVars };
      }

      return envVars;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        { source: this.options?.path }
      );
    }
  }
}
