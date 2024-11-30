/**
 * @fileoverview Service configuration module entry point
 * @module @qi/core/services/config
 *
 * @description
 * Exports service configuration types and loader functionality.
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-30
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

export { ConfigLoader } from "./loader.js";
export type {
  ServiceConfig,
  EnvConfig,
  DatabaseConfigs,
  MessageQueueConfigs,
  MonitoringConfigs,
  NetworkingConfigs,
} from "./types.js";
