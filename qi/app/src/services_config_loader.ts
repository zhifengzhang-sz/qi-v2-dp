/**
 * @fileoverview Application configuration loader
 * @module app/services_config_loader
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-21
 * @created 2024-11-20
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "@qi/core/logger";
import { ServiceConfigLoader } from "@qi/core/services/config/loader";
import type { ServiceDSL } from "@qi/core/services/config/types";
import { formatJsonWithColor } from "@qi/core/utils";
import { ApplicationError } from "@qi/core/errors";
import { existsSync, readdirSync } from "fs";

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global configuration instance
let globalConfig: ServiceDSL | null = null;
let configLoader: ServiceConfigLoader | null = null;

/**
 * Gets the project root directory (where package.json is located)
 */
function getProjectRoot(): string {
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at ${projectRoot}`);
  }

  logger.debug("Found project root:", { projectRoot, packageJsonPath });
  return projectRoot;
}

/**
 * Initializes the application configuration
 */
export async function initializeAppConfig(): Promise<ServiceDSL> {
  logger.debug("Starting config initialization...");

  try {
    if (globalConfig) {
      logger.debug("Using cached global configuration");
      return globalConfig;
    }

    // Get project root and config paths
    const projectRoot = getProjectRoot();
    const configDir = join(projectRoot, "config");

    if (!existsSync(configDir)) {
      throw new Error(`Config directory not found: ${configDir}`);
    }

    // Log available config files
    const configFiles = readdirSync(configDir);
    logger.debug("Found config files:", { configDir, files: configFiles });

    const serviceConfigPath = join(configDir, "services.json");
    const envConfigPath = join(configDir, "services.env");

    // Create loader if needed
    if (!configLoader) {
      configLoader = new ServiceConfigLoader();
    }

    // Load configuration
    const result = await configLoader.load({
      serviceConfigPath,
      envConfigPath,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    });

    // Log non-sensitive parts of config in development
    if (process.env.NODE_ENV !== "production") {
      const configSummary = {
        databases: Object.keys(result.dsl.databases),
        messaging: Object.keys(result.dsl.messageQueue),
        monitoring: Object.keys(result.dsl.monitoring.endpoints),
        networks: result.dsl.networking.networks,
      };

      console.log("\nConfiguration Summary:");
      console.log(formatJsonWithColor(configSummary));
    }

    // Cache and return the DSL
    globalConfig = result.dsl;
    return result.dsl;
  } catch (error) {
    logger.error("Failed to initialize application configuration", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        cwd: process.cwd(),
        dirname: __dirname,
        configDir: join(process.cwd(), "config"),
        files: existsSync(join(process.cwd(), "config"))
          ? readdirSync(join(process.cwd(), "config"))
          : [],
      },
    });

    throw new ApplicationError(
      `Configuration initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      "CONFIG_INIT_ERROR",
      500
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
  logger.info("Configuration cache cleared");
}

// Auto-initialize if this is the main module
if (import.meta.url === import.meta.resolve("./services_config_loader.ts")) {
  initializeAppConfig()
    .then((config) => {
      logger.info("Configuration loaded successfully", {
        databases: Object.keys(config.databases).length,
        networks: Object.keys(config.networking.networks),
      });
    })
    .catch((error) => {
      logger.error("Fatal error loading configuration", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    });
}
