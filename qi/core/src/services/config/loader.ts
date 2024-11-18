/**
 * @fileoverview Defines the config loaders for the service module
 * @module loader
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2024-11-19
 */

import { Schema, JsonLoader, EnvLoader } from "@qi/core/config";
import { serviceConfigSchema, envConfigSchema } from "./schemas.js";
import { ServiceConfig, EnvConfig } from "./types.js";

/**
 * Creates the service config and environment config loaders
 * @param schema - The configuration schema instance
 * @returns An object with the service config loader and env config loader
 */
export function createServiceLoader(schema: Schema) {
  // Register schemas
  schema.registerSchema("service-config", serviceConfigSchema);
  schema.registerSchema("env-config", envConfigSchema);

  // Create service config loader
  const serviceLoader = new JsonLoader<ServiceConfig>(
    "config/service-1.0.json",
    schema,
    "service-config"
  );

  // Create env config loader
  const envLoader = new EnvLoader<EnvConfig>(schema, "env-config", {
    path: "services.env",
    required: true,
    watch: true,
    refreshInterval: 30000,
  });

  return {
    serviceLoader,
    envLoader,
  };
}
