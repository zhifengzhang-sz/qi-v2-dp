/**
 * @fileoverview
 * @module cli_config_loader.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import { Schema, JsonLoader } from "@qi/core/config";
import { CliConfig } from "@qi/core/cli/config/types";
import { CliConfigHandler } from "@qi/core/cli/config/handler";
import { CLI_SCHEMAS } from "@qi/core/cli/config/schema";
import { join } from "path";
import { logger } from "@qi/core/logger";
import { formatJsonWithColor, retryOperation } from "@qi/core/utils";
import {
  ConfigurationError,
  ValidationError,
  NotFoundError,
  ApplicationError,
} from "@qi/core/errors";

async function loadAndProcessConfig() {
  try {
    const schema = new Schema();
    schema.registerSchema("cli-config", CLI_SCHEMAS.CliConfig);

    const configPath = join(process.cwd(), "config", "cli.json");
    const loader = new JsonLoader<CliConfig>(
      configPath,
      schema,
      "qi://core/cli/config.schema"
    );

    // Wrap config loading with retry mechanism
    const config = await retryOperation(async () => await loader.load(), {
      retries: 3,
      minTimeout: 1000,
    });

    if (!config) {
      throw new NotFoundError("Configuration file not found", {
        path: configPath,
        resource: "cli-config",
      });
    }

    const handler = new CliConfigHandler(config);
    const masterInfo = handler.handle(config);
    /*
    // Use logger for detailed debug output
    logger.info("=== Master Info Details ===");

    logger.info("Command Lists:", {
      systemCommands: masterInfo.system_cmd,
      parameterCommands: masterInfo.param_cmd,
      userCommands: masterInfo.user_cmd,
    });

    // Log parameter command details using color formatting
    for (const cmd of masterInfo.param_cmd) {
      const cmdDetails = {
        options: masterInfo.options[cmd],
        usages: masterInfo.usages[cmd],
        titles: masterInfo.titles[cmd],
        parameters: masterInfo.parameters[cmd],
      };

      logger.info(`${cmd} command details:`, {
        details: formatJsonWithColor(cmdDetails),
      });
    }

    logger.info("=== End Master Info ===");
    */
    return { config, masterInfo };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === "ValidationError") {
        throw new ValidationError("Configuration validation failed", {
          details: error.message,
        });
      } else if (error.name === "ConfigurationError") {
        throw new ConfigurationError("Invalid configuration structure", {
          details: error.message,
        });
      }

      // Handle any other errors
      throw new ApplicationError(
        "Failed to load and process configuration",
        "CONFIG_PROCESSING_ERROR",
        500,
        { originalError: error.message }
      );
    }

    // Handle unknown error types
    throw new ApplicationError(
      "Unknown error occurred while processing configuration",
      "UNKNOWN_ERROR",
      500,
      { error: String(error) }
    );
  }
}

// Usage with error handling
async function initializeConfig() {
  try {
    const { config, masterInfo } = await loadAndProcessConfig();
    logger.info("Configuration loaded successfully", {
      configSize: Object.keys(config).length,
      commandCount: masterInfo.param_cmd.length,
    });
    return { config, masterInfo };
  } catch (error) {
    if (error instanceof ApplicationError) {
      logger.error("Failed to initialize configuration", {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      });
    } else {
      logger.error("Unexpected error during configuration initialization", {
        error: String(error),
      });
    }
    throw error;
  }
}

async function main() {
  try {
    const { config, masterInfo } = await initializeConfig();
    // Use the configuration...
    return { config, masterInfo };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Error already logged
  } catch (error) {
    // Error is already logged, handle as needed...
    process.exit(1);
  }
}

main()
  .then(({ config, masterInfo }) => {
    console.log(
      "\nConfiguration loaded successfully:\n",
      formatJsonWithColor(config)
    );
    console.log("\nMaster Info:\n", formatJsonWithColor(masterInfo));
  })
  .catch(console.error);
