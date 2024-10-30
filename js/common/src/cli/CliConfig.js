/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-10-31
 */

/**
 * @fileoverview CLI configuration management module that handles loading and validating CLI specifications.
 * @module CliConfig
 */
import * as fs from "fs";
import * as S from "./CliSpecSchema.js";
import { zip } from "qi/common/utils/utils";

/**
 * @class UserSpecLoader
 * @description Loads user-specific CLI configuration from a JSON file.
 */

/**
 * @constructor
 * @param {string} configPath - Path to the CLI configuration file
 */

/**
 * @method load
 * @description Reads and parses the CLI configuration file
 * @returns {Object} Parsed JSON configuration object
 * @throws {Error} If file reading or parsing fails
 */
class UserSpecLoader {
  constructor(configPath) {
    this.configPath = configPath;
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
    } catch (error) {
      throw new Error(
        `Failed to load CLI config from ${this.configPath}: ${error.message}`
      );
    }
  }
}

/**
 * @class SpecBuilder
 * @description Builds a complete CLI specification by combining system and user commands
 */
class SpecBuilder {
  /**
   * Defines the system-level CLI commands available in the application.
   * @static
   * @readonly
   * @type {Object.<string, {
   *   title: string,      - Brief description of the command
   *   usage: string,      - Command usage syntax
   *   class: 'info'|'exec' - Command classification type
   * }>}
   * @property {Object} ? - Help command showing information about other commands
   * @property {Object} param - Command for displaying and managing parameters
   * @property {Object} quit - Command to exit the CLI application
   */
  static SYSTEM_COMMANDS = {
    "?": {
      title: "help information",
      usage: "? [cmd]...",
      class: "info",
    },
    param: {
      title: "show the current parameters",
      usage: "param [param_cmd]...",
      class: "info",
    },
    quit: {
      title: "quit cli",
      usage: "quit",
      class: "exec",
    },
  };

  /**
   * @constructor
   * @param {Object} userSpec - User-defined CLI specification
   */
  constructor(userSpec) {
    this.userSpec = userSpec;
  }

  /**
   * @method build
   * @description Combines system commands with user-specified commands
   * @returns {Object} Complete CLI specification
   */
  build() {
    return {
      cmd: {
        param_cmd: this.userSpec.cmd.param_cmd,
        user_cmd: this.userSpec.cmd.user_cmd,
        system_cmd: SpecBuilder.SYSTEM_COMMANDS,
      },
      prompt: this.userSpec.prompt,
    };
  }
}

/**
 * @class CliConfig
 * @description Main configuration class that manages CLI specifications and validation
 */
export class CliConfig {
  /**
   * @constructor
   * @param {string} [configPath='./config/cli.json'] - Path to the CLI configuration file
   */
  constructor(configPath = "./config/cli.json") {
    this.configPath = configPath;
    this.schemas = S.init();
    this.userSpec = new UserSpecLoader(configPath).load();
    this.spec = new SpecBuilder(this.userSpec).build();
  }

  /**
   * @method validateSpec
   * @description Validates different components of the CLI specification
   * @returns {Array<{componentId: number, result: string|Object}>} Array of validation results
   */
  validateSpec() {
    const validators = Object.values(this.schemas);
    const components = [
      this.spec.cmd.param_cmd[0].params[0],
      this.spec.cmd.system_cmd.quit,
      this.spec.cmd.system_cmd,
      this.spec.cmd.param_cmd,
      this.spec.cmd.user_cmd,
      this.userSpec,
      this.spec.cmd,
      this.spec,
    ];

    return zip(components, validators).map(([component, validator], index) => ({
      componentId: index,
      result: validator(component) ? "Pass!" : validator.errors,
    }));
  }

  /**
   * @method getSpec
   * @description Returns the complete CLI specification
   * @returns {Object} The CLI specification object
   */
  getSpec() {
    return this.spec;
  }
  /**
   * @method getValidationSchema
   * @description Returns the validation schemas
   * @returns {Object} The validation schema object
   */
  getValidationSchema() {
    return this.schemas;
  }
}
