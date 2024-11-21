/**
 * @fileoverview
 * @module cli_config_loader.ts
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-21
 */

import { JsonLoader, Schema } from "@qi/core/config";
import { CLI_SCHEMAS } from "@qi/core/cli/config/schema";
import { CliConfigHandler } from "@qi/core/cli/config/handler";
import { CliConfig } from "@qi/core/cli/config/types";
import { logger } from "@qi/core/logger";

export async function initializeCliConfig(configPath: string, schema: Schema) {
  try {
    // Throw if schema ID is undefined
    if (!CLI_SCHEMAS.CliConfig.$id) {
      throw new Error("CLI schema must have an $id");
    }

    const schemaId = CLI_SCHEMAS.CliConfig.$id;
    if (!schema.hasSchema(schemaId)) {
      schema.registerSchema(schemaId, CLI_SCHEMAS.CliConfig);
    }

    const loader = new JsonLoader<CliConfig>(configPath, schema, schemaId);
    const config = await loader.load();
    const handler = new CliConfigHandler(config);
    const masterInfo = handler.handle(config);

    logger.info("CLI configuration loaded successfully", {
      configSize: Object.keys(config).length,
      commandCount: masterInfo.param_cmd.length,
    });

    return { config, masterInfo };
  } catch (error) {
    logger.error("Failed to initialize CLI configuration", { error });
    throw error;
  }
}
