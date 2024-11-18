/**
 * @fileoverview Type definitions for CLI configuration and command handling
 * @module cli/config/types
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-19
 */

import { BaseConfig } from "@qi/core/config";

/**
 * CLI option definition for command parameters
 */
export interface CliOption {
  type: string; // Type of option (e.g. 'string', 'number')
  short: string; // Short form flag (e.g. '-p')
  default: string; // Default value if not specified
}

/**
 * CLI parameter definition containing option metadata
 */
export interface CliParam {
  name: string; // Parameter identifier
  option: CliOption; // Option configuration
  range?: string[]; // Valid value range if applicable
  title: string; // Display title
  usage: string; // Usage instructions
  class: string; // Parameter class/category
}

/**
 * System command value containing documentation
 */
export interface CliSystemValue {
  title: string; // Command title
  usage: string; // Usage instructions
  class: string; // Command class/category
}

/**
 * System command collection with required commands
 */
export interface CliSystemCommand {
  quit: CliSystemValue; // Exit command
  "?": CliSystemValue; // Help command
  [key: string]: CliSystemValue; // Additional system commands
}

/**
 * Parameter-based command definition
 */
export interface CliParamCommandItem {
  name: string; // Command identifier
  title?: string; // Display title
  usage?: string; // Usage instructions
  params: CliParam[]; // Command parameters
}

/**
 * User-defined command definition
 */
export interface CliUserCommandItem {
  name: string; // Command identifier
  title: string; // Display title
  usage?: string; // Usage instructions
  class: string; // Command class/category
}

/**
 * Complete CLI command configuration
 */
export interface CliCommand {
  system_cmd: CliSystemCommand; // Built-in system commands
  param_cmd?: CliParamCommandItem[]; // Parameter-based commands
  user_cmd?: CliUserCommandItem[]; // User-defined commands
}

/**
 * CLI configuration extending base config
 */
export interface CliConfig extends BaseConfig {
  type: "cli"; // Configuration type identifier
  version: string; // CLI version
  cmd: CliCommand; // Command definitions
  prompt: string; // CLI prompt string
}

/**
 * Arguments for set command operations
 */
export interface CliSetCommandArgs {
  command: string; // Target command
  param: string; // Parameter name
  value: string; // New value
}

/**
 * Arguments for get/reset command operations
 */
export interface CliGetResetCommandArgs {
  command: string; // Target command
  param: string; // Parameter name
}
