import path from "path";
import { ConfigLoader } from "@qi/core/config";
import * as CliSpecSchema from "@qi/core/cli/schemas/CliSpecSchema";
import type { CliConfig } from "@qi/core/cli/schemas/CliSpecSchema"; // Type-only import
import * as ServiceSchema from "@qi/core/services/schemas/ServiceSchema";
import type { ServiceConfig } from "@qi/core/services/schemas/ServiceSchema"; // Type-only import
import { TSDBConnection } from "@qi/core/services/timescaledb";
import { RedisCache } from "@qi/core/cache";
import { KafkaService } from "@qi/core/services/kafka";
import { logger } from "@qi/core/logger";
import dotenv from 'dotenv';
dotenv.config();

// Import ConfigHandler globally if needed
import { ConfigHandler } from "./config/ConfigHandler.js";

/**
 * Initialize Configurations and Services
 */
(async () => {
  try {
    // Initialize CLI Configuration
    ConfigLoader.loadConfig<CliConfig>(
      path.resolve(__dirname, "../config/cliConfig.json"),
      CliSpecSchema,
      "cli"
    );

    // Initialize Service Configuration
    ConfigLoader.loadConfig<ServiceConfig>(
      path.resolve(__dirname, "../config/serviceConfig.json"),
      ServiceSchema,
      "service"
    );

    logger.info("All configurations loaded successfully.");

    // Initialize Database Connection
    const db = TSDBConnection.getInstance();
    await db.initialize();
    logger.info("Database initialized successfully.");

    // Initialize Redis Cache
    const cache = RedisCache.getInstance();
    await cache.connect();
    logger.info("Redis cache connected successfully.");

    // Initialize Kafka Service
    const kafkaService = KafkaService.getInstance();
    await kafkaService.connect();
    logger.info("Kafka service connected successfully.");

    // Example Usage
    const cliConfig = ConfigHandler.getInstance<CliConfig>("cli").getConfig();
    const serviceConfig = ConfigHandler.getInstance<ServiceConfig>("service").getConfig();
    console.log("CLI Prompt:", cliConfig.prompt);
    console.log("Service DB Host:", serviceConfig.database.dbHost);
  } catch (error) {
    logger.error("Initialization failed:", error);
    process.exit(1); // Exit the process if initialization fails
  }
})();

/**
 * Graceful Shutdown
 */
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  try {
    const db = TSDBConnection.getInstance();
    await db.close();
    logger.info('Database connection closed.');

    const cache = RedisCache.getInstance();
    await cache.disconnect();
    logger.info('Redis cache disconnected.');

    const kafkaService = KafkaService.getInstance();
    await kafkaService.disconnect();
    logger.info('Kafka service disconnected.');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Export modules as needed
export * from './cache/index.js';
export * from './cli/index.js';
export * from './config/index.js';
export * from './errors/index.js';
export * from './services/index.js';
export * from './utils/index.js';