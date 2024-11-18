/**
 * @fileoverview JSON Schema definitions for CLI configuration validation
 * @module cli/config/schema
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-19
 */

import { JsonSchema } from "@qi/core/config";

export const CLI_SCHEMAS = {
  /**
   * Schema for set command arguments validation
   * Validates command, parameter, and value inputs
   */
  CliSetCommandArgs: {
    $id: "qi://core/cli/set.command.args.schema",
    type: "object",
    required: ["command", "param", "value"],
    properties: {
      command: { type: "string" },
      param: { type: "string" },
      value: { type: "string" },
    },
    additionalProperties: false,
  } as JsonSchema,

  /**
   * Schema for get/reset command arguments validation
   * Validates command and parameter inputs
   */
  CliGetResetCommandArgs: {
    $id: "qi://core/cli/get.reset.command.args.schema",
    type: "object",
    required: ["command", "param"],
    properties: {
      command: { type: "string" },
      param: { type: "string" },
    },
    additionalProperties: false,
  } as JsonSchema,

  /**
   * Core CLI configuration schema
   * Defines structure for system commands, parameter commands, and user commands
   */
  CliConfig: {
    $id: "qi://core/cli/config.schema",
    type: "object",
    required: ["type", "version", "cmd", "prompt"],
    properties: {
      // CLI type identifier
      type: {
        type: "string",
        const: "cli",
      },
      // CLI version string
      version: { type: "string" },
      // Command configuration object
      cmd: {
        type: "object",
        required: ["system_cmd", "param_cmd", "user_cmd"],
        properties: {
          // System commands like quit, help
          system_cmd: {
            type: "object",
            required: ["quit", "?"],
            properties: {
              // Quit command schema
              quit: {
                type: "object",
                required: ["title", "usage", "class"],
                properties: {
                  title: { type: "string" },
                  usage: { type: "string" },
                  class: { type: "string" },
                },
                additionalProperties: false,
              },
              // Help command schema
              "?": {
                type: "object",
                required: ["title", "usage", "class"],
                properties: {
                  title: { type: "string" },
                  usage: { type: "string" },
                  class: { type: "string" },
                },
                additionalProperties: false,
              },
            },
            // Schema for additional system commands
            additionalProperties: {
              type: "object",
              required: ["title", "usage", "class"],
              properties: {
                title: { type: "string" },
                usage: { type: "string" },
                class: { type: "string" },
              },
              additionalProperties: false,
            },
          },
          // Parameter-based commands
          param_cmd: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "params"],
              properties: {
                name: { type: "string" },
                title: { type: "string" },
                usage: { type: "string" },
                params: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["name", "option", "title", "usage", "class"],
                    properties: {
                      name: { type: "string" },
                      // Parameter option configuration
                      option: {
                        type: "object",
                        required: ["type", "short", "default"],
                        properties: {
                          type: { type: "string" },
                          short: { type: "string" },
                          default: { type: "string" },
                        },
                        additionalProperties: false,
                      },
                      // Optional value range
                      range: {
                        type: "array",
                        items: { type: "string" },
                      },
                      title: { type: "string" },
                      usage: { type: "string" },
                      class: { type: "string" },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          // User-defined commands
          user_cmd: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "title", "class"],
              properties: {
                name: { type: "string" },
                title: { type: "string" },
                usage: { type: "string" },
                class: { type: "string" },
              },
            },
          },
        },
      },
      // CLI prompt string
      prompt: { type: "string" },
    },
    additionalProperties: false,
  } as JsonSchema,
};
