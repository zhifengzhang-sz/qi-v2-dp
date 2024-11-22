/**
 * @fileoverview Application configuration loader
 * @module app/services_config_loader
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-22
 * @created 2024-11-20
 */

import { join } from "path";
import { ServiceConfigLoader } from "@qi/core/services/config/loader";
import type { ServiceDSL } from "@qi/core/services/config/types";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { existsSync } from "fs";

// Global configuration instance
let globalConfig: ServiceDSL | null = null;
let configLoader: ServiceConfigLoader | null = null;

/**
 * Initializes the application configuration
 */
export async function initializeAppConfig(): Promise<ServiceDSL> {
  try {
    if (globalConfig) {
      return globalConfig;
    }

    const configDir = join(process.cwd(), "config");
    if (!existsSync(configDir)) {
      throw new ApplicationError(
        `Config directory not found: ${configDir}`,
        ErrorCode.SERVICE_CONFIG_MISSING,
        500,
        { path: configDir }
      );
    }

    const serviceConfigPath = join(configDir, "services.json");
    const envConfigPath = join(configDir, "services.env");

    if (!configLoader) {
      configLoader = new ServiceConfigLoader();
    }

    const result = await configLoader.load({
      serviceConfigPath,
      envConfigPath,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    });

    globalConfig = result.dsl;
    return result.dsl;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError(
      `Configuration initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      ErrorCode.SERVICE_CONFIG_INVALID,
      500,
      {
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Gets the current configuration DSL
 */
export async function getConfig(): Promise<ServiceDSL> {
  if (!globalConfig) {
    return initializeAppConfig();
  }
  return globalConfig;
}

/**
 * Clears the global configuration cache
 */
export function clearConfigCache(): void {
  globalConfig = null;
  configLoader = null;
}
