/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

/**
 * @fileoverview Handles system commands by validating and executing them.
 * @module CliSystemCommands
 * 
 * @requires logger
 * @requires SpecHandler
 * @requires readline
 */

import { logger } from "qi/core/utils/logger";

/**
 * Validates the command and its parameters.
 * @param {string[]} allowedCommands - The list of allowed commands.
 * @param {string} cmd - The base command.
 * @param {string[]} params - The command parameters.
 * @returns {boolean} - True if valid, else false.
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
 * @param {string[]} cmd - The command and its parameters.
 * @param {SpecHandler} specHandler - An instance of the SpecHandler class.
 * @param {readline.Interface} rl - The readline interface for handling input/output.
 * @returns {Promise<{ stdout: string, stderr: string }>} - The command outputs.
 * @throws {Error} - If command execution fails.
 */
const executeCommand = async (cmd, specHandler, rl) => {
  try {
    const allAllowedCommands = [
      ...specHandler.master_info.system_cmd,
      ...specHandler.master_info.user_cmd,
      ...specHandler.master_info.param_cmd,
    ];

    switch (cmd[0]) {
      case "?":
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
      case "quit":
        rl.close();
        return { stdout: "", stderr: "" }; // should not be here
      default:
        throw new Error(`Unknown system command "${cmd[0]}"`);
    }
  } catch (error) {
    throw new Error(`Command execution failed: ${error.message}`);
  }
};

/**
 * Handles system commands by validating and executing them.
 * @param {string} cmd - The base command.
 * @param {string[]} [params=[]] - The parameters for the command.
 * @param {SpecHandler} specHandler - An instance of the SpecHandler class.
 * @param {readline.Interface} rl - The readline interface for handling input/output.
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