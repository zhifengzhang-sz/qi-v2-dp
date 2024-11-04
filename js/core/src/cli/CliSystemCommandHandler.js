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
 * @fileoverview Handles system commands by validating and executing them.
 * This module provides functionality for handling system-level CLI commands
 * such as help (?), quit, and other system operations. It includes validation,
 * execution, and proper error handling for all system commands.
 * 
 * @module CliSystemCommands
 * 
 * @requires logger - Winston logger instance for output handling
 * @requires SpecHandler - Handles CLI specifications and command validation
 * @requires readline - Node.js readline interface for I/O handling
 * 
 * @example
 * // Basic usage with help command
 * systemCommandHandler("?", [], specHandler, rl);
 * 
 * // Get help for specific commands
 * systemCommandHandler("?", ["quit", "ls"], specHandler, rl);
 * 
 * // Quit the application
 * systemCommandHandler("quit", [], specHandler, rl);
 */

import { logger } from "@qi/core/logger";

/**
 * List of supported system commands
 * @constant {Object}
 */
const SYSTEM_COMMANDS = {
  HELP: "?",
  QUIT: "quit"
};

/**
 * Validates the command and its parameters.
 * @param {string[]} allowedCommands - The list of allowed commands.
 * @param {string} cmd - The base command.
 * @param {string[]} params - The command parameters.
 * @returns {boolean} - True if valid, else false.
 * 
 * @example
 * validateCommand(["?", "quit"], "?", []);  // returns true
 * validateCommand(["?", "quit"], "invalid", []);  // returns false
 */
const validateCommand = (allowedCommands, cmd, params) => {
  if (!allowedCommands.includes(cmd)) {
    logger.error(`Invalid or disallowed command "${cmd}" attempted.`);
    return false;
  }
  // Add more validation rules as needed (e.g., sanitize params)
  return true;
};

/**
 * Executes a system command based on the provided command and parameters.
 * Handles help and quit commands, with proper error handling for unknown commands.
 * 
 * @param {string[]} cmd - The command and its parameters.
 * @param {SpecHandler} specHandler - An instance of the SpecHandler class.
 * @param {readline.Interface} rl - The readline interface for handling input/output.
 * @returns {Promise<{ stdout: string, stderr: string }>} - The command outputs.
 * @throws {Error} - If command execution fails.
 * 
 * @example
 * // Execute help command
 * const result = await executeCommand(["?"], specHandler, rl);
 * // result = { stdout: "help message", stderr: "" }
 */
const executeCommand = async (cmd, specHandler, rl) => {
  try {
    const allAllowedCommands = [
      ...specHandler.master_info.system_cmd,
      ...specHandler.master_info.user_cmd,
      ...specHandler.master_info.param_cmd,
    ];

    switch (cmd[0]) {
      case SYSTEM_COMMANDS.HELP:
        if (cmd.length === 1) {
          return { stdout: specHandler.help_message, stderr: "" };
        } else {
          let helpMessage = "";
          let errorMessage = "";
          cmd.slice(1).forEach((helpCommand) => {
            if (validateCommand(allAllowedCommands, helpCommand, [])) {
              helpMessage += "\n" + specHandler.commandUsage(helpCommand);
            } else {
              errorMessage += `Invalid command "${helpCommand}"\n`;
            }
          });
          return { stdout: helpMessage, stderr: errorMessage };
        }
      case SYSTEM_COMMANDS.QUIT:
        rl.close();
        return { stdout: "Goodbye!", stderr: "" };
      default:
        throw new Error(`Unknown system command "${cmd[0]}"`);
    }
  } catch (error) {
    throw new Error(`Command execution failed: ${error.message}`);
  }
};

/**
 * Handles system commands by validating and executing them.
 * This is the main entry point for handling system commands in the CLI.
 * 
 * @param {string} cmd - The base command.
 * @param {string[]} [params=[]] - The parameters for the command.
 * @param {SpecHandler} specHandler - An instance of the SpecHandler class.
 * @param {readline.Interface} rl - The readline interface for handling input/output.
 * 
 * @example
 * // Show help for multiple commands
 * systemCommandHandler("?", ["quit", "ls"], specHandler, rl);
 * 
 * // Quit the application
 * systemCommandHandler("quit", [], specHandler, rl);
 */
const systemCommandHandler = async (cmd, params = [], specHandler, rl) => {
  const allowedCommands = specHandler.master_info.system_cmd;

  if (!validateCommand(allowedCommands, cmd, params)) return;

  // Construct the full command string
  const fullCommand = [cmd, ...params];

  try {
    const { stdout, stderr } = await executeCommand(fullCommand, specHandler, rl);

    // Log stdout if available
    if (stdout.trim()) {
      logger.info(`Output of "${fullCommand.join(" ")}":\n${stdout}`);
    }

    // Log stderr if available
    if (stderr.trim()) {
      logger.error(`Error Output for "${fullCommand.join(" ")}":\n${stderr}`);
    }
  } catch (error) {
    logger.error(`Failed to execute command "${fullCommand.join(" ")}": ${error.message}`);
  }
};

export { systemCommandHandler };