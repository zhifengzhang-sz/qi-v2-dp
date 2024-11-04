/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview CLI Entry Point
 * @module cli
 * 
 * @requires ../core/src/cli/Cli.js
 * @requires ../core/src/cli/SpecHandler.js
 */

import { Cli } from "@qi/core/cli";
import { SpecHandler } from "@qi/core/cli";
import { CliConfig } from "@qi/core/cli";
import { logger } from "@qi/core/logger";

async function main() {
  try {
    // Load configuration
    logger.info("Loading configuration...");
    const config = new CliConfig("./config/cli.json");

    // Initialize SpecHandler with configuration
    logger.info("Initializing SpecHandler...");
    const specHandler = new SpecHandler(config);

    // Initialize and run the CLI
    logger.info("Starting CLI...");
    const cli = new Cli(specHandler);
    await cli.run();
    logger.info("CLI started.");
  } catch (error) {
    logger.error(`Failed to start CLI: ${error.message}`);
    process.exit(1);
  }
}

main();