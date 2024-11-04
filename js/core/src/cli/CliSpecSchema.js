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
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-10-31
 */

/**
 * @fileoverview Defines JSON schema validation for CLI specifications
 * @module CliSpecSchema
 * 
 * @requires ajv
 */
import Ajv from "ajv";

// Define schemas in a consistent and structured manner
const schemas = {
  Param: {
    $id: "qi://core/cli/param.schema",
    type: "object",
    properties: {
      name: { type: "string" },
      option: {
        type: "object",
        properties: {
          type: { type: "string" },
          short: { type: "string" },
          default: { type: "string" },
        },
        required: ["type", "short", "default"],
        additionalProperties: false,
      },
      range: { type: "array", items: { type: "string" } },
      title: { type: "string" },
      usage: { type: "string" },
      class: { type: "string" },
    },
    required: ["name", "option", "title", "usage", "class"],
    additionalProperties: false,
  },
  /*
    anyOf: [
      { required: ["name", "title", "usage", "class"] },
      { required: ["name", "option", "title", "usage", "class"] },
    ],
  },
  */
  QICliSystemValue: {
    $id: "qi://core/cli/system.value.schema",
    type: "object",
    required: ["title", "usage", "class"],
    properties: {
      title: { type: "string" },
      usage: { type: "string" },
      class: { type: "string" },
    },
  },
  QICliSystemCommand: {
    $id: "qi://core/cli/system.command.schema",
    type: "object",
    required: ["quit", "?", "param"],
    properties: {
      quit: { $ref: "system.value.schema" },
      "?": { $ref: "system.value.schema" },
      param: { $ref: "system.value.schema" },
    },
  },
  QICliParamCommand: {
    $id: "qi://core/cli/param.command.schema",
    type: "array",
    items: {
      type: "object",
      required: ["name", "params"],
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        usage: { type: "string" },
        params: { type: "array", items: { $ref: "param.schema" } },
      },
    },
  },
  QICliUserCommand: {
    $id: "qi://core/cli/user.command.schema",
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
  QICliUserSpec: {
    $id: "qi://core/cli/user.spec.schema",
    type: "object",
    required: ["cmd", "prompt"],
    properties: {
      cmd: {
        type: "object",
        minProperties: 1,
        properties: {
          param_cmd: { $ref: "param.command.schema" },
          user_cmd: { $ref: "user.command.schema" },
        },
      },
      prompt: { type: "string" },
    },
  },
  QICliCommand: {
    $id: "qi://core/cli/command.schema",
    type: "object",
    anyOf: [
      { required: ["system_cmd", "param_cmd"] },
      { required: ["system_cmd", "user_cmd"] },
      { required: ["system_cmd", "param_cmd", "user_cmd"] },
    ],
    properties: {
      system_cmd: { $ref: "system.command.schema" },
      param_cmd: { $ref: "param.command.schema" },
      user_cmd: { $ref: "user.command.schema" },
    },
  },
  QICliMain: {
    $id: "qi://core/cli/main.schema",
    type: "object",
    required: ["cmd", "prompt"],
    properties: {
      cmd: { $ref: "command.schema" },
      prompt: { type: "string" },
    },
  },

  // Schema for the 'set' command arguments
  SetCommandArgs: {
    $id: "qi://core/cli/set.command.args.schema",
    type: "object",
    properties: {
      name: { type: "string" },
      value: { type: "string" }, // Adjust type as needed
    },
    required: ["name", "value"],
    additionalProperties: false,
  },

  // Schema for the 'get' and 'reset' command arguments
  GetResetCommandArgs: {
    $id: "qi://core/cli/get.reset.command.args.schema",
    type: "object",
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
    additionalProperties: false,
  },
};

const ajv = new Ajv({ allErrors: true });

// Function to compile and install a schema
export const install = (schema) => ajv.compile(schema);

// Initialize all schemas and return compiled validators
export const init = () =>
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, install(schema)])
  );

export { schemas };
