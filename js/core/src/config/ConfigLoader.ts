// src/config/ConfigLoader.ts

import fs, { PathLike } from "fs";
import path from "path";
import { ConfigHandler } from "./ConfigHandler.js";
import { BaseConfig, ConfigValidator } from "./BaseConfig.js";
import { logger } from "@qi/core/logger";
import { SchemaModule } from "./SchemaModule.js"; // Adjust path if necessary
import { ValidateFunction } from "ajv";

/**
 * Generic ConfigLoader class
 */
export class ConfigLoader {
  /**
   * Loads and validates a configuration file, then initializes the ConfigHandler.
   * @param configPath - Path to the configuration file.
   * @param schemaModule - Schema module to use for validation.
   * @param type - The type identifier for the configuration (e.g., 'cli', 'service').
   */
  public static loadConfig<T extends BaseConfig>(
    configPath: PathLike,
    schemaModule: SchemaModule<T>,
    type: string
  ): void {
    // Initialize AJV and compile schemas
    const validators: Record<string, ValidateFunction> = schemaModule.init();

    // Determine the main schema based on type
    let mainSchemaKey: string;
    switch (type) {
      case "cli":
        mainSchemaKey = "QICliMain";
        break;
      case "service":
        mainSchemaKey = "ServiceConfig";
        break;
      default:
        throw new Error(`Unknown configuration type: ${type}`);
    }

    const validate = validators[mainSchemaKey];
    if (!validate) {
      throw new Error(
        `ConfigSchema validator for "${mainSchemaKey}" is not available in the schema module`
      );
    }

    // Read and parse the configuration file
    const configRaw = JSON.parse(fs.readFileSync(configPath, "utf8"));

    // Validate the configuration
    if (!validate(configRaw)) {
      throw new Error(
        `Configuration validation failed: ${JSON.stringify(validate.errors)}`
      );
    }

    // Ensure the config type matches
    if ((configRaw as BaseConfig).type !== type) {
      throw new Error(
        `Configuration type mismatch: expected "${type}", got "${
          (configRaw as BaseConfig).type
        }"`
      );
    }

    const config: T = Object.freeze(configRaw) as T;

    // Create a ConfigValidator instance
    const configValidator: ConfigValidator<T> = {
      validate: (config: unknown): T => {
        if (!validate(config)) {
          throw new Error(
            `Configuration validation failed: ${JSON.stringify(validate.errors)}`
          );
        }
        return config as T;
      },
      getSchema: () => ({
        type: "object",
        properties: schemaModule.schemas,
        required: Object.keys(schemaModule.schemas),
        additionalProperties: false,
      }),
    };

    // Initialize the ConfigHandler with the validated configuration
    ConfigHandler.initialize<T>(type, configRaw, configValidator);
    logger.info(`Configuration for "${type}" loaded and initialized.`);
  }
}