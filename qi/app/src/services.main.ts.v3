/**
 * @fileoverview
 * @module services.main.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

import { initializeAppConfig } from "./services_config_loader.js";

async function main() {
  try {
    const config = await initializeAppConfig();
    // config now contains the processed DSL ready to use

    // Example: Access database configuration
    const { databases } = config;
    console.log("Postgres connection:", databases.postgres.connectionString);
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

main();
