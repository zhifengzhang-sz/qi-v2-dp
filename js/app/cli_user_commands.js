/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

/**
 * @fileoverview Example usage of CLI configuration and command handling.
 * @module cli_user_commands
 * 
 * @requires CliConfig
 * @requires SpecHandler
 * @requires userCmdHandler
 */

import { CliConfig, SpecHandler, userCommandHandler } from "@qi/core/cli";

// Usage example
try {
  // Initialize CLI configuration
  const cliConfig = new CliConfig("./config/cli.json");

  // Create a SpecHandler instance with the CLI configuration
  const specHandler = new SpecHandler(cliConfig);

  // Retrieve the list of allowed user commands from the SpecHandler
  const allowedCommands = specHandler.master_info.user_cmd;

  // Example command execution
  // Executes the 'ls -la' command if it is allowed
  userCommandHandler(allowedCommands, "ls", ["-la"]);
} catch (error) {
  // Handle configuration errors
  console.error("Configuration error:", error.message);
  process.exit(1);
}