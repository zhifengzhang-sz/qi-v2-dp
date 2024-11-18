/**
 * @fileoverview Defines the CliConfigHandler class for processing CLI configuration
 * @module handler
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2024-11-19
 */

import { IConfigHandler } from "@qi/core/config";
import { logger } from "@qi/core/logger";
import { CliConfig, CliOption } from "./types.js";

/**
 * Interface representing the master configuration information.
 *
 * @description
 * Stores processed CLI configuration including command lists,
 * options, usage info, titles, and parameter defaults.
 *
 * @example
 * ```typescript
 * const masterInfo: MasterInfo = {
 *   user_cmd: ["status", "help"],
 *   param_cmd: ["config", "run"],
 *   system_cmd: ["exit", "version"],
 *   options: {
 *     config: {
 *       mode: { short: "m", default: "dev" }
 *     }
 *   },
 *   usages: { config: { mode: "Set runtime mode" } },
 *   titles: { config: { mode: "Runtime Mode" } },
 *   parameters: { config: { mode: "dev" } }
 * };
 * ```
 */
export interface MasterInfo {
  user_cmd: string[];
  param_cmd: string[];
  system_cmd: string[];
  options: Record<string, Record<string, CliOption>>;
  usages: Record<string, Record<string, string>>;
  titles: Record<string, Record<string, string>>;
  parameters: Record<string, Record<string, string>>;
}

/**
 * Handler class for processing CLI configuration and managing command information.
 *
 * @description
 * Processes raw CLI configuration into structured format and provides methods
 * for command validation, usage info, and help message generation.
 *
 * @example
 * ```typescript
 * const handler = new CliConfigHandler(config);
 * const usage = handler.getCommandUsage(config, masterInfo, "config");
 * const isValid = handler.validateCommand(config, "config", ["--mode", "dev"]);
 * ```
 */
export class CliConfigHandler implements IConfigHandler<CliConfig, MasterInfo> {
  private readonly masterInfo: MasterInfo;

  constructor(private readonly config: CliConfig) {
    this.masterInfo = this.handle(config);
  }

  /**
   * Processes the CLI configuration and generates the MasterInfo object
   * @param config - The CliConfig object to process
   * @returns The generated MasterInfo object
   */
  handle(config: CliConfig): MasterInfo {
    logger.info("Processing CLI configuration");
    return this.buildMasterInfo(config);
  }

  /**
   * Builds the MasterInfo object from the CliConfig
   * @param config - The CliConfig object
   * @returns The generated MasterInfo object
   */
  private buildMasterInfo(config: CliConfig): MasterInfo {
    const { cmd } = config;
    const masterInfo: MasterInfo = {
      user_cmd: cmd.user_cmd?.map((c) => c.name) ?? [],
      param_cmd: cmd.param_cmd?.map((c) => c.name) ?? [],
      system_cmd: Object.keys(cmd.system_cmd),
      options: {},
      usages: {},
      titles: {},
      parameters: {},
    };

    cmd.param_cmd?.forEach((command) => {
      if (!command.params) return;

      masterInfo.options[command.name] = {};
      masterInfo.usages[command.name] = {};
      masterInfo.titles[command.name] = {};
      masterInfo.parameters[command.name] = {};

      command.params.forEach((param) => {
        masterInfo.options[command.name][param.name] = param.option;
        masterInfo.usages[command.name][param.name] = param.usage;
        masterInfo.titles[command.name][param.name] = param.title;
        masterInfo.parameters[command.name][param.name] = param.option.default;
      });
    });

    return masterInfo;
  }

  /**
   * Builds the help message for the CLI
   * @param config - The CliConfig object
   * @returns The generated help message
   */
  private buildHelpMessage(config: CliConfig): string {
    const { cmd } = config;
    const sections = [
      {
        title: "System commands:",
        items: Object.entries(cmd.system_cmd).map(
          ([key, val]) => ` - ${key}: ${val.title}`
        ),
      },
      {
        title: "Parameter commands:",
        items:
          cmd.param_cmd?.map((c) => ` - ${c.name}: ${c.title || c.name}`) ?? [],
      },
      {
        title: "Commands without param:",
        items: cmd.user_cmd?.map((c) => ` - ${c.name}: ${c.title}`) ?? [],
      },
    ];

    return sections
      .filter((section) => section.items.length > 0)
      .map((section) => [section.title, ...section.items].join("\n"))
      .join("\n\n");
  }

  /**
   * Determines the type of a given command
   * @param masterInfo - The MasterInfo object
   * @param cmd - The command to check
   * @returns The command type ('user_cmd', 'param_cmd', 'system_cmd', or undefined)
   */
  getCommandType(
    masterInfo: MasterInfo,
    cmd: string
  ): "user_cmd" | "param_cmd" | "system_cmd" | undefined {
    if (masterInfo.user_cmd.includes(cmd)) return "user_cmd";
    if (masterInfo.param_cmd.includes(cmd)) return "param_cmd";
    if (masterInfo.system_cmd.includes(cmd)) return "system_cmd";
    return undefined;
  }

  /**
   * Retrieves the usage information for a given command
   * @param config - The CliConfig object
   * @param masterInfo - The MasterInfo object
   * @param cmd - The command to get the usage for
   * @returns The usage information for the command
   */
  getCommandUsage(
    config: CliConfig,
    masterInfo: MasterInfo,
    cmd: string
  ): string {
    const cmdType = this.getCommandType(masterInfo, cmd);
    if (!cmdType) throw new Error(`Unknown command: ${cmd}`);

    if (cmdType === "param_cmd") {
      const options = Object.entries(masterInfo.options[cmd])
        .map(
          ([name, opt]) =>
            ` -${opt.short}, --${name}: ${masterInfo.usages[cmd][name]}`
        )
        .join("\n  ");

      return (
        `${cmd} [run|set|ls] [args]\nargs:\n  ${options}\n` +
        "If args not specified, last set value will be used, otherwise default value."
      );
    }

    if (cmdType === "system_cmd") {
      return `${cmd}: ${config.cmd.system_cmd[cmd].title}`;
    }

    const userCmd = config.cmd.user_cmd?.find((c) => c.name === cmd);
    return userCmd ? userCmd.title : cmd;
  }

  /**
   * Validates a given command and its arguments
   * @param config - The CliConfig object
   * @param cmd - The command to validate
   * @param args - The command arguments to validate
   * @returns True if the command and arguments are valid, false otherwise
   */
  validateCommand(config: CliConfig, cmd: string, args: string[]): boolean {
    const command = config.cmd.param_cmd?.find((c) => c.name === cmd);
    if (!command?.params) {
      logger.error(`Invalid command: ${cmd}`);
      return false;
    }

    for (let i = 0; i < args.length; i += 2) {
      const name = args[i].replace(/^-+/, "");
      const value = args[i + 1];
      const param = command.params.find((p) => p.name === name);

      if (!param) {
        logger.error(`Unknown parameter: ${name}`);
        return false;
      }

      if (param.range && !param.range.includes(value)) {
        logger.error(
          `Invalid value for ${name}: ${value}. Valid: ${param.range.join(", ")}`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves the CLI prompt
   * @param config - The CliConfig object
   * @returns The CLI prompt
   */
  getPrompt(config: CliConfig): string {
    return config.prompt;
  }

  /**
   * Retrieves the CLI help message
   * @param config - The CliConfig object
   * @returns The CLI help message
   */
  getHelpMessage(config: CliConfig): string {
    return this.buildHelpMessage(config);
  }
}
