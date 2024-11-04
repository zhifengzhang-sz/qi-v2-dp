import { ConfigHandler } from "@qi/core/config";
import { DatabaseConnection } from "@qi/core/db";
import config from "./config/services.json";
import { logger } from "@qi/core/logger";

/**
 * @function main
 * @description Entry point for initializing configuration and database connection
 */
async function main() {
  try {
    // Initialize configuration without casting
    ConfigHandler.initialize(config.development);
    logger.info("Configuration initialized");

    // Initialize database
    const db = DatabaseConnection.getInstance();
    await db.initialize();
    logger.info("Database initialized");

    // Perform database operations here

    await db.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Application error:", error);
    process.exit(1);
  }
}

main();
