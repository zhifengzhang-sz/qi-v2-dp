/**
 * @fileoverview Services Entry Point
 * @module qi/app/src/services.main
 */

import { logger } from "@qi/core/logger";
import { ApplicationError } from "@qi/core/errors";
import * as redis from "./services/redis/index.js";
import * as cache from "./services/cache/index.js";

/**
 * Service initialization state
 */
interface ServiceState {
  isInitialized: boolean;
  services: {
    redis?: boolean;
    cache?: boolean;
  };
}

const state: ServiceState = {
  isInitialized: false,
  services: {},
};

/**
 * Initializes all services in the correct order
 */
async function initializeServices(): Promise<void> {
  try {
    // Load service configuration first
    logger.info("Loading service configuration...");

    logger.info("Service configuration loaded successfully", {
      type: "services",
      version: "1.0",
    });

    // Initialize Redis service first (required for production cache)
    logger.info("Initializing Redis service...");
    await redis.initialize();
    state.services.redis = true;
    logger.info("Redis service initialized successfully");

    // Initialize Cache service
    logger.info("Initializing Cache service...");
    await cache.initialize();
    state.services.cache = true;
    logger.info("Cache service initialized successfully");

    // Future: Initialize other services here
    // Maintain correct initialization order based on dependencies

    state.isInitialized = true;
    logger.info("All services initialized successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Service initialization failed", { error: errorMessage });
    throw error;
  }
}

/**
 * Gracefully shuts down all services in reverse order
 */
async function shutdownServices(): Promise<void> {
  logger.info("Beginning service shutdown...");

  try {
    // Shutdown Cache first
    if (state.services.cache) {
      logger.info("Shutting down Cache service...");
      await cache.close();
      state.services.cache = false;
      logger.info("Cache service shutdown complete");
    }

    // Shutdown Redis last (as other services might depend on it)
    if (state.services.redis) {
      logger.info("Shutting down Redis service...");
      await redis.close();
      state.services.redis = false;
      logger.info("Redis service shutdown complete");
    }

    // Future: Shutdown other services here
    // Maintain correct shutdown order (reverse of initialization)

    state.isInitialized = false;
    logger.info("All services shutdown successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error during service shutdown", { error: errorMessage });
    throw error;
  }
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    await initializeServices();

    // Handle shutdown signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    // Keep the process running
    process.stdin.resume();

    logger.info("Services are ready");
  } catch (error) {
    if (error instanceof ApplicationError) {
      logger.error("Application error during startup", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else {
      logger.error("Unexpected error during startup", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await gracefulShutdown();
  }
}

/**
 * Handles graceful shutdown process
 */
async function gracefulShutdown(): Promise<void> {
  try {
    await shutdownServices();
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start the application if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error("Unhandled error in main", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
