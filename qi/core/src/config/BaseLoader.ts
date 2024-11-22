/**
 * @fileoverview
 * @module BaseLoader
 *
 * @description
 * This module defines the abstract BaseLoader class, which provides a foundational
 * implementation for configuration loaders. It handles configuration watching and
 * change notifications, ensuring that derived classes implement the specific loading
 * and watcher initialization logic.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "./types.js";
import { IConfigLoader } from "./IConfig.js";

/**
 * Abstract class representing a base configuration loader.
 *
 * @abstract
 * @class BaseLoader
 * @implements {IConfigLoader<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a foundational implementation for configuration loaders, including methods
 * for watching configuration changes and notifying registered callbacks. Derived classes
 * must implement the specific loading logic and watcher initialization.
 */
export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  /**
   * The file system watcher for monitoring configuration changes.
   *
   * @protected
   * @type {FSWatcher | undefined}
   */
  protected watcher?: FSWatcher;

  /**
   * A set of callback functions to be invoked when a configuration change event occurs.
   *
   * @protected
   * @type {Set<(event: ConfigChangeEvent<T>) => void>}
   */
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();

  /**
   * The current configuration object.
   *
   * @protected
   * @type {T | undefined}
   */
  protected currentConfig?: T;

  /**
   * Abstract method to load the configuration.
   *
   * @abstract
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   * @throws {Error} - Throws an error if the configuration fails to load.
   * @description
   * Derived classes must implement this method to define the specific logic
   * for loading the configuration from the desired source (e.g., file, database).
   */
  abstract load(): Promise<T>;

  /**
   * Registers a callback to be invoked on configuration changes and initializes the watcher.
   *
   * @method watch
   * @param {(event: ConfigChangeEvent<T>) => void} callback - The callback function to handle configuration change events.
   * @returns {void}
   * @description
   * Adds the provided callback to the set of callbacks and initializes the file system watcher
   * if it hasn't been initialized already. This ensures that any changes to the configuration
   * are detected and the callbacks are notified accordingly.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }

  /**
   * Unregisters all callbacks and stops watching for configuration changes.
   *
   * @method unwatch
   * @returns {void}
   * @description
   * Closes the file system watcher if it exists, clears all registered callbacks,
   * and disables further notifications of configuration changes.
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  /**
   * Abstract method to initialize the file system watcher.
   *
   * @protected
   * @abstract
   * @method initializeWatcher
   * @returns {void}
   * @description
   * Derived classes must implement this method to define how the configuration
   * should be watched for changes (e.g., watching a specific file or directory).
   * This method is responsible for setting up the FSWatcher and handling its events.
   */
  protected abstract initializeWatcher(): void;

  /**
   * Notifies all registered callbacks of a configuration change event.
   *
   * @protected
   * @method notifyChange
   * @param {T} previous - The previous state of the configuration.
   * @param {T} current - The current state of the configuration.
   * @param {string} source - The source identifier where the change originated.
   * @returns {void}
   * @description
   * Constructs a configuration change event object and invokes each registered callback
   * with this event. This facilitates reactive updates based on configuration changes.
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
