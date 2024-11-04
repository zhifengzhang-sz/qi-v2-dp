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

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@qi/core/logger";

// Promisify exec for cleaner async/await usage
const execAsync = promisify(exec);

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
 * Executes a shell command asynchronously.
 * @param {string} cmd - The full shell command to execute.
 * @returns {Promise<{ stdout: string, stderr: string }>} - The command outputs.
 * @throws {Error} - If command execution fails.
 */
const executeShellCommand = async (cmd) => {
  try {
    const { stdout, stderr } = await execAsync(cmd);
    return { stdout, stderr };
  } catch (error) {
    throw new Error(`Command execution failed: ${error.message}`);
  }
};

/**
 * Handles user commands by executing shell commands.
 * @param {string[]} allowedCommands - The list of allowed commands.
 * @param {string} cmd - The base command.
 * @param {string[]} [params=[]] - The parameters for the command.
 */
const userCommandHandler = async (allowedCommands, cmd, params = []) => {
  if (!validateCommand(allowedCommands, cmd, params)) return;

  // Construct the full command string
  const fullCommand = [cmd, ...params].join(" "); // e.g., 'ls -la'

  try {
    const { stdout, stderr } = await executeShellCommand(fullCommand);

    // Log stdout if available
    if (stdout.trim()) {
      logger.info(`Output of "${fullCommand}":\n${stdout}`);
    }

    // Log stderr if available
    if (stderr.trim()) {
      logger.error(`Error Output for "${fullCommand}":\n${stderr}`);
    }
  } catch (error) {
    logger.error(
      `Failed to execute command "${fullCommand}": ${error.message}`
    );
  }
};

export { userCommandHandler };