/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview Handles CLI command processing and dispatching to appropriate handlers
 * @module CliCommandHandler
 * 
 * @requires ./CliSystemCommands
 * @requires ./CliUserCommands
 * @requires ./CliParamCommandHandler
 * @requires @qi/core/logger
 * @requires readline
 */

import { systemCommandHandler } from "./CliSystemCommandHandler.js";
import { userCommandHandler } from "./CliUserCommandHandler.js";
import { paramCommandHandler } from "./CliParamCommandHandler.js";
import { logger } from "@qi/core/logger";
import { Interface as ReadlineInterface } from "readline";

/**
 * @class CliCommandHandler
 * @description Handles command processing and routing to appropriate command handlers
 */
export class CliCommandHandler {
  /**
   * Creates a new CliCommandHandler instance
   * @param {SpecHandler} specHandler - The specification handler instance
   * @param {ReadlineInterface} rl - The readline interface instance
   */
  constructor(specHandler, rl) {
    this.specHandler = specHandler;
    this.rl = rl;
  }

  /**
   * Handle command based on its type
   * @async
   * @param {string} cmd - The command to execute
   * @param {string[]} args - Array of command arguments
   * @returns {Promise<void>}
   * @throws {Error} When command execution fails
   */
  async handleCommand(cmd, args) {
    if (!cmd) return;

    try {
      const cmdType = this.specHandler.commandType(cmd);

      switch (cmdType) {
        case "system_cmd":
          await systemCommandHandler(cmd, args, this.specHandler, this.rl);
          break;

        case "user_cmd":
          await userCommandHandler(
            this.specHandler.master_info.user_cmd,
            cmd,
            args
          );
          break;

        case "param_cmd":
          await paramCommandHandler(
            this.specHandler.master_info.param_cmd,
            cmd,
            args,
            this.specHandler
          );
          break;

        default:
          logger.error(`Unknown command: ${cmd}`);
          logger.info("Type '?' for help");
      }
    } catch (error) {
      logger.error(`Error executing command: ${error.message}`);
    }
  }
}

