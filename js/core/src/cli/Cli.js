/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview Handles CLI command processing and dispatching to appropriate handlers
 * @module Cli
 * 
 * @requires ./CliCommandsHandler
 * @requires @qi/core/logger
 * @requires readline
 */

import readline from "readline";
import { CliCommandHandler } from "./CliCommandHandler.js";
import { SpecHandler } from "./SpecHandler.js";
import { logger } from "@qi/core/logger";

/**
 * @class Cli
 * @description Handles command processing and routing to appropriate command handlers
 */
export class Cli {
  /**
   * Creates a new Cli instance
   * @param {SpecHandler} specHandler - The specification handler instance
   */
  constructor(specHandler) {
    this.specHandler = specHandler;
  }

  /**
   * Runs the CLI application
   * @returns {Promise<void>}
   */
  async run() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.specHandler.prompt(),
    });
    rl.prompt();
    const cmdHandler = new CliCommandHandler(this.specHandler, rl);

    rl.on("line", async (line) => {
      const [cmd, args] = Cli.processInput(line);
      try {
        await cmdHandler.handleCommand(cmd, args);
      } catch (error) {
        logger.error(`${error.message}`);
      }
      rl.prompt();
    }).on("close", () => {
      logger.info("So long...");
      process.exit(0);
    });
  }

  /**
   * Processes command line input
   * @param {string} line - The input line to process
   * @returns {[string, string[]]} Tuple containing [command, arguments]
   */
  static processInput(line) {
    const tokens = line.trim().split(' ').filter(token => token !== '');
    if (tokens.length === 0) return ['', []];
    
    const [cmd, ...args] = tokens;
    return [cmd, args];
  }
}