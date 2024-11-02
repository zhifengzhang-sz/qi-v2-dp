/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

/**
 * @fileoverview Example usage of CLI configuration and system command handling.
 * This file demonstrates how to set up and use the CLI system with proper error handling.
 * It shows the initialization of configuration, creation of necessary instances, and
 * execution of system commands.
 * 
 * @module cli_system_commands
 * 
 * @requires CliConfig - Configuration management for CLI
 * @requires SpecHandler - Handles CLI specifications and commands
 * @requires systemCommandHandler - Handles execution of system commands
 * @requires readline - Node.js readline interface
 * 
 * @example
 * // Basic usage
 * systemCommandHandler("?", [], specHandler, rl);
 * 
 * // Get help for specific commands
 * systemCommandHandler("?", ['quit', 'ls'], specHandler, rl);
 */

import { CliConfig } from "qi/core/cli/CliConfig";
import SpecHandler from "qi/core/cli/SpecHandler";
import { systemCommandHandler } from "qi/core/cli/CliSystemCommands";
import readline from "readline";

// Usage example
try {
  /**
   * Initialize CLI configuration with the specified JSON file
   * @type {CliConfig}
   */
  const cliConfig = new CliConfig("./config/cli.json");

  /**
   * Create a SpecHandler instance to manage CLI specifications
   * @type {SpecHandler}
   */
  const specHandler = new SpecHandler(cliConfig);

  /**
   * Create a readline interface for handling user input/output
   * @type {readline.Interface}
   */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  /**
   * Example system command execution
   * Executes the '?' command with multiple command arguments to display help information
   * This will show help for: quit, ?, ls, cryptocompare, query commands
   * And show error for: foo (invalid command)
   */
  systemCommandHandler("?", ['quit','?','ls','cryptocompare','query','foo'], specHandler, rl);
  rl.close();
} catch (error) {
  // Handle configuration errors with proper logging and exit
  console.error("Configuration error:", error.message);
  process.exit(1);
}