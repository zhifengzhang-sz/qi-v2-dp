// src/config/schemas/CliSpecSchema.ts

import Ajv, { ValidateFunction } from "ajv";
import { BaseConfig } from "../BaseConfig.js";

/**
 * @fileoverview Defines JSON schema validation for CLI specifications
 * @module CliSpecSchema
 */

/**
 * Interfaces for CLI Configuration
 */
export interface QICliSystemValue {
  title: string;
  usage: string;
  class: "info" | "exec";
}

export interface QICliParam {
  name: string;
  option: {
    type: string;
    short: string;
    default: string;
  };
  range?: string[];
}

export interface QICliParamCommand {
  name: string;
  title: string;
  usage: string;
  class: "info" | "exec";
  params: QICliParam[];
}

export interface QICliUserCommand {
  name: string;
  title: string;
  usage: string;
  class: "info" | "exec";
}

interface CliConfig extends BaseConfig {
  type: "cli";
  prompt: string;
  cmd: {
    system_cmd: Record<string, QICliSystemValue>;
    param_cmd: QICliParamCommand[];
    user_cmd: QICliUserCommand[];
  };
}

/**
 * Define schemas in a consistent and structured manner
 */
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
  QICliSystemValue: {
    $id: "qi://core/cli/system.value.schema",
    type: "object",
    required: ["title", "usage", "class"],
    properties: {
      title: { type: "string" },
      usage: { type: "string" },
      class: { type: "string", enum: ["info", "exec"] },
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
      additionalProperties: false,
    },
  },
  QICliMain: {
    $id: "qi://core/cli/main.schema",
    type: "object",
    required: ["type", "prompt", "cmd"],
    properties: {
      type: { type: "string", const: "cli" },
      prompt: { type: "string" },
      cmd: { $ref: "qi://core/cli/system.command.schema" },
    },
    additionalProperties: false,
  },
};

/**
 * Schema Module Implementation
 */
export const install = (schema: object): ValidateFunction => {
  const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
  Object.values(schemas).forEach((sch) => ajv.addSchema(sch));
  return ajv.compile(schema);
};

/**
 * Initialize all schemas and return compiled validators
 * @returns {Record<string, ValidateFunction>} Object containing all compiled validators
 */
export const init = (): Record<string, ValidateFunction> =>
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, install(schema)])
  );

export { schemas };

export type { CliConfig }; // Export the interface