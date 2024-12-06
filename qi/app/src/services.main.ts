/**
 * @fileoverview
 * @module services.main.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-06
 * @modified 2024-12-06
 */

// services.main.ts
import { logger } from "@qi/core/logger";
import { ApplicationError } from "@qi/core/errors";
import * as redis from "./services/redis/index.js";
import * as cache from "./services/cache/index.js";
import * as timescaledb from "./services/timescaledb/index.js";
import * as redpanda from "./services/redpanda/index.js";

interface ServiceState {
  isInitialized: boolean;
  services: {
    redis?: boolean;
    cache?: boolean;
    timescaledb?: boolean;
    redpanda?: boolean;
  };
}

const state: ServiceState = {
  isInitialized: false,
  services: {},
};

async function initializeServices(): Promise<void> {
  try {
    logger.info("Loading service configuration...");

    // Initialize Redis service
    logger.info("Initializing Redis service...");
    await redis.initialize();
    state.services.redis = true;
    logger.info("Redis service initialized successfully");

    // Initialize Cache service
    logger.info("Initializing Cache service...");
    await cache.initialize();
    state.services.cache = true;
    logger.info("Cache service initialized successfully");

    // Initialize TimescaleDB first (other services might depend on it)
    logger.info("Initializing TimescaleDB service...");
    await timescaledb.initialize();
    state.services.timescaledb = true;
    logger.info("TimescaleDB service initialized successfully");

    // Initialize RedPanda service
    logger.info("Initializing RedPanda service...");
    await redpanda.initialize({
      enabled: true,
      consumer: {
        groupId: process.env.CONSUMER_GROUP_ID || "qi-consumer-group",
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000,
      },
      producer: {
        allowAutoTopicCreation: true,
        maxInFlightRequests: 5,
        idempotent: false,
      },
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        retries: 3,
      },
    });
    state.services.redpanda = true;
    logger.info("RedPanda service initialized successfully");

    state.isInitialized = true;
    logger.info("All services initialized successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Service initialization failed", { error: errorMessage });
    throw error;
  }
}

async function shutdownServices(): Promise<void> {
  logger.info("Beginning service shutdown...");

  try {
    if (state.services.cache) {
      logger.info("Shutting down Cache service...");
      await cache.close();
      state.services.cache = false;
      logger.info("Cache service shutdown complete");
    }

    if (state.services.redis) {
      logger.info("Shutting down Redis service...");
      await redis.close();
      state.services.redis = false;
      logger.info("Redis service shutdown complete");
    }

    if (state.services.redpanda) {
      logger.info("Shutting down RedPanda service...");
      await redpanda.close();
      state.services.redpanda = false;
      logger.info("RedPanda service shutdown complete");
    }

    if (state.services.timescaledb) {
      logger.info("Shutting down TimescaleDB service...");
      await timescaledb.close();
      state.services.timescaledb = false;
      logger.info("TimescaleDB service shutdown complete");
    }

    state.isInitialized = false;
    logger.info("All services shutdown successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error during service shutdown", { error: errorMessage });
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await initializeServices();

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error("Unhandled error in main", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
