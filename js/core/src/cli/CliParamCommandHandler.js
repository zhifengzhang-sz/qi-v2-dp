/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview Handles parameter-related CLI commands based on the specification schema.
 * @module CliParamCommandHandler
 * 
 * @requires @qi/core/logger
 * 
 * @date 2024-11-03
 */

import { logger } from "@qi/core/logger";

/**
 * Executes a parameter command based on the provided command name and arguments.
 * 
 * @async
 * @function paramCommandHandler
 * @param {Object} paramCommands - The parameter commands from the specification.
 * @param {string} cmd - The command to execute.
 * @param {string[]} args - The arguments for the command.
 * @param {SpecHandler} specHandler - The specification handler instance for validation and context.
 * @returns {Promise<void>} - Resolves when the command execution is complete.
 */
export async function paramCommandHandler(paramCommands, cmd, args, specHandler) {
  if (!paramCommands.includes(cmd)) {
    logger.error(`Parameter command not found: '${cmd}'`);
    return;
  }

  try {
    // Validate arguments against the schema
    const isValid = specHandler.validateParamCommand(cmd, args);
    if (!isValid) {
      logger.error(`Invalid arguments for parameter command: '${cmd}'`);
      return;
    }

    // Execute the command logic based on the specification
    await executeParamCommand(cmd, args, specHandler);
    logger.info(`Parameter command '${cmd}' executed successfully.`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error executing parameter command '${cmd}': ${error.message}`);
    } else {
      logger.error(`Unknown error executing parameter command '${cmd}': ${String(error)}`);
    }
  }
}

/**
 * Executes the logic for a specific parameter command.
 * 
 * @async
 * @function executeParamCommand
 * @param {Object} commandSpec - The specification for the command.
 * @param {string[]} args - The arguments provided for the command.
 * @param {SpecHandler} specHandler - The specification handler instance.
 * @returns {Promise<void>} - Resolves when the command logic is complete.
 */
async function executeParamCommand(cmd, args, specHandler) {
  logger.info(`Executing parameter command '${cmd}' with arguments: ${args.join(" ")}`);
  if (args.length<1) {
    // execute the user defined command, to be implemented
    logger.info(`Executing user defined command '${cmd}', to be implemented.`);
    return;
  }
  switch (args[0]) {
    case "set":
      await handleSetCommand(args, specHandler);
      break;
    case "get":
      await handleGetCommand(args, specHandler);
      break;
    case "reset":
      await handleResetCommand(args, specHandler);
      break;
    default:
      logger.error(`Unsupported action '${commandSpec.action}' for parameter command.`);
  }
}

/**
 * Handles the 'set' action for a parameter command.
 * 
 * @async
 * @function handleSetCommand
 * @param {string[]} args - The arguments provided for the 'set' command.
 * @param {SpecHandler} specHandler - The specification handler instance.
 * @returns {Promise<void>} - Resolves when the 'set' action is complete.
 */
async function handleSetCommand(args, specHandler) {
  const [paramName, paramValue] = args;

  if (!paramName || !paramValue) {
    logger.error("Usage: set <paramName> <paramValue>");
    return;
  }

  // Example: Update the parameter in the configuration
  specHandler.updateParam(paramName, paramValue);
  logger.info(`Parameter '${paramName}' set to '${paramValue}'.`);
}

/**
 * Handles the 'get' action for a parameter command.
 * 
 * @async
 * @function handleGetCommand
 * @param {string[]} args - The arguments provided for the 'get' command.
 * @param {SpecHandler} specHandler - The specification handler instance.
 * @returns {Promise<void>} - Resolves when the 'get' action is complete.
 */
async function handleGetCommand(args, specHandler) {
  const [paramName] = args;

  if (!paramName) {
    logger.error("Usage: get <paramName>");
    return;
  }

  // Example: Retrieve the parameter value from the configuration
  const paramValue = specHandler.getParam(paramName);
  if (paramValue !== undefined) {
    logger.info(`Parameter '${paramName}': '${paramValue}'`);
  } else {
    logger.error(`Parameter '${paramName}' not found.`);
  }
}

/**
 * Handles the 'reset' action for a parameter command.
 * 
 * @async
 * @function handleResetCommand
 * @param {string[]} args - The arguments provided for the 'reset' command.
 * @param {SpecHandler} specHandler - The specification handler instance.
 * @returns {Promise<void>} - Resolves when the 'reset' action is complete.
 */
async function handleResetCommand(args, specHandler) {
  const [paramName] = args;

  if (!paramName) {
    logger.error("Usage: reset <paramName>");
    return;
  }

  // Example: Reset the parameter to its default value
  const success = specHandler.resetParam(paramName);
  if (success) {
    logger.info(`Parameter '${paramName}' has been reset to its default value.`);
  } else {
    logger.error(`Failed to reset parameter '${paramName}'.`);
  }
}