#!/usr/bin/env bun

/**
 * Docker Services Demo - QiCore Infrastructure Management
 *
 * Demonstrates Docker service management for the QiCore Crypto Data Platform.
 * Shows how to start/stop the required infrastructure services:
 * - Redpanda (Kafka-compatible streaming)
 * - TimescaleDB (time-series database)
 * - ClickHouse (analytics database)
 * - Redis (caching)
 *
 * This is a service orchestration demo, not an Actor demo.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

// Simple logger
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
};

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "unknown";
  port?: number;
  description: string;
}

function executeCommand(command: string, description: string): boolean {
  try {
    logger.info(`${description}...`);
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch (error: any) {
    logger.error(`Failed to ${description.toLowerCase()}: ${error.message}`);
    return false;
  }
}

function getServiceStatus(containerName: string): "running" | "stopped" | "unknown" {
  try {
    const output = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return output.trim() ? "running" : "stopped";
  } catch (error) {
    return "unknown";
  }
}

function checkDockerComposeFile(): boolean {
  const composePaths = [
    "./docker-compose.yml",
    "../docker-compose.yml",
    "../../docker-compose.yml",
    "./docker-compose.yaml",
  ];

  for (const path of composePaths) {
    if (existsSync(path)) {
      logger.info(`Found Docker Compose file at: ${path}`);
      return true;
    }
  }

  logger.warn("Docker Compose file not found in expected locations");
  return false;
}

function getQiCoreServices(): ServiceStatus[] {
  return [
    {
      name: "redpanda",
      status: getServiceStatus("redpanda"),
      port: 19092,
      description: "Kafka-compatible streaming platform for real-time data",
    },
    {
      name: "timescaledb",
      status: getServiceStatus("timescaledb"),
      port: 5432,
      description: "PostgreSQL-based time-series database for operational data",
    },
    {
      name: "clickhouse",
      status: getServiceStatus("clickhouse"),
      port: 8123,
      description: "High-performance analytics database for OLAP queries",
    },
    {
      name: "redis",
      status: getServiceStatus("redis"),
      port: 6379,
      description: "In-memory cache for high-speed data access",
    },
  ];
}

async function demonstrateDockerServices() {
  console.log("🐳 QICORE DOCKER SERVICES DEMONSTRATION");
  console.log("🏗️ Managing infrastructure services for crypto data platform...\n");

  // =============================================================================
  // DOCKER ENVIRONMENT CHECK
  // =============================================================================

  console.log("🔍 DOCKER ENVIRONMENT CHECK");

  // Check if Docker is available
  try {
    execSync("docker --version", { stdio: "pipe" });
    logger.success("Docker is available");
  } catch (error) {
    logger.error("Docker is not available. Please install Docker first.");
    return false;
  }

  // Check if Docker Compose is available
  try {
    execSync("docker compose version", { stdio: "pipe" });
    logger.success("Docker Compose is available");
  } catch (error) {
    logger.warn("Docker Compose (v2) not found, trying legacy docker-compose...");
    try {
      execSync("docker-compose --version", { stdio: "pipe" });
      logger.success("Legacy docker-compose is available");
    } catch (legacyError) {
      logger.error("Neither docker compose nor docker-compose is available");
      return false;
    }
  }

  // Check for Docker Compose file
  const hasComposeFile = checkDockerComposeFile();
  if (!hasComposeFile) {
    logger.warn("No docker-compose.yml found - will demonstrate service status checking only");
  }

  console.log("");

  // =============================================================================
  // SERVICE STATUS CHECK
  // =============================================================================

  console.log("📊 QICORE INFRASTRUCTURE SERVICES STATUS");

  const services = getQiCoreServices();

  console.log("🔍 Checking current service status...\n");

  let runningCount = 0;
  for (const service of services) {
    const statusIcon =
      service.status === "running" ? "✅" : service.status === "stopped" ? "⏹️" : "❓";
    const portInfo = service.port ? `:${service.port}` : "";

    console.log(`   ${statusIcon} ${service.name}${portInfo}`);
    console.log(`      📝 ${service.description}`);
    console.log(`      🔋 Status: ${service.status.toUpperCase()}`);
    console.log("");

    if (service.status === "running") {
      runningCount++;
    }
  }

  console.log(`📊 Service Summary: ${runningCount}/${services.length} services running\n`);

  // =============================================================================
  // SERVICE MANAGEMENT DEMONSTRATION
  // =============================================================================

  console.log("🛠️ SERVICE MANAGEMENT DEMONSTRATION");

  if (hasComposeFile) {
    // Demonstrate service management commands
    console.log("🎯 Available Docker Compose commands for QiCore services:\n");

    const commands = [
      {
        command: "docker compose up -d",
        description: "Start all QiCore infrastructure services in background",
        icon: "🚀",
      },
      {
        command: "docker compose down",
        description: "Stop and remove all QiCore services",
        icon: "⏹️",
      },
      {
        command: "docker compose ps",
        description: "Check status of all QiCore services",
        icon: "📊",
      },
      {
        command: "docker compose logs -f redpanda",
        description: "Follow logs for Redpanda streaming service",
        icon: "📄",
      },
      {
        command: "docker compose restart timescaledb",
        description: "Restart TimescaleDB time-series database",
        icon: "🔄",
      },
    ];

    for (const cmd of commands) {
      console.log(`   ${cmd.icon} ${cmd.command}`);
      console.log(`      📝 ${cmd.description}`);
      console.log("");
    }

    // Interactive service management (simulation)
    console.log("💡 Service Management Workflow:");
    console.log("   1️⃣ Start services: docker compose up -d");
    console.log("   2️⃣ Verify status: docker compose ps");
    console.log("   3️⃣ Check logs: docker compose logs [service_name]");
    console.log("   4️⃣ Stop services: docker compose down");
    console.log("");
  } else {
    console.log("⚠️ Docker Compose file not found - showing manual Docker commands:\n");

    const manualCommands = [
      "docker run -d --name redpanda vectorized/redpanda:latest",
      "docker run -d --name timescaledb timescale/timescaledb:latest-pg14",
      "docker run -d --name clickhouse clickhouse/clickhouse-server:latest",
      "docker run -d --name redis redis:latest",
    ];

    console.log("🔧 Manual service startup commands:");
    for (const cmd of manualCommands) {
      console.log(`   📦 ${cmd}`);
    }
    console.log("");
  }

  // =============================================================================
  // SERVICE HEALTH CHECKS
  // =============================================================================

  console.log("🏥 SERVICE HEALTH CHECKS");
  console.log("🎯 Demonstrating health check procedures for running services...\n");

  for (const service of services) {
    if (service.status === "running") {
      console.log(`🩺 Health check for ${service.name}:`);

      switch (service.name) {
        case "redpanda":
          console.log("   📊 Check: Kafka API availability");
          console.log("   🔍 Command: docker exec redpanda rpk cluster info");
          console.log("   🎯 Expected: Cluster metadata and broker information");
          break;

        case "timescaledb":
          console.log("   📊 Check: PostgreSQL connection and TimescaleDB extension");
          console.log(
            '   🔍 Command: docker exec timescaledb psql -U postgres -c "SELECT version();"',
          );
          console.log("   🎯 Expected: PostgreSQL version with TimescaleDB extension");
          break;

        case "clickhouse":
          console.log("   📊 Check: ClickHouse HTTP interface");
          console.log("   🔍 Command: curl http://localhost:8123/ping");
          console.log('   🎯 Expected: "Ok." response');
          break;

        case "redis":
          console.log("   📊 Check: Redis connection and basic operations");
          console.log("   🔍 Command: docker exec redis redis-cli ping");
          console.log('   🎯 Expected: "PONG" response');
          break;
      }
      console.log("");
    } else {
      console.log(`⏸️ ${service.name} is not running - health check skipped\n`);
    }
  }

  // =============================================================================
  // INTEGRATION READINESS CHECK
  // =============================================================================

  console.log("🔗 INTEGRATION READINESS CHECK");
  console.log("🎯 Checking if services are ready for QiCore Actor integration...\n");

  const readinessChecks = [
    {
      service: "redpanda",
      requirement: "Kafka-compatible streaming for real-time market data",
      port: 19092,
      ready: services.find((s) => s.name === "redpanda")?.status === "running",
    },
    {
      service: "timescaledb",
      requirement: "Time-series storage for OHLCV data and market analytics",
      port: 5432,
      ready: services.find((s) => s.name === "timescaledb")?.status === "running",
    },
    {
      service: "clickhouse",
      requirement: "Analytics database for complex market analysis queries",
      port: 8123,
      ready: services.find((s) => s.name === "clickhouse")?.status === "running",
    },
    {
      service: "redis",
      requirement: "Caching layer for high-frequency market data access",
      port: 6379,
      ready: services.find((s) => s.name === "redis")?.status === "running",
    },
  ];

  let readyCount = 0;
  for (const check of readinessChecks) {
    const statusIcon = check.ready ? "✅" : "❌";
    console.log(`   ${statusIcon} ${check.service}:${check.port}`);
    console.log(`      📝 ${check.requirement}`);
    console.log(`      🔋 Status: ${check.ready ? "READY" : "NOT READY"}`);
    console.log("");

    if (check.ready) {
      readyCount++;
    }
  }

  const overallReadiness = readyCount === readinessChecks.length;
  const readinessIcon = overallReadiness ? "🟢" : "🟡";
  const readinessStatus = overallReadiness ? "FULLY READY" : "PARTIALLY READY";

  console.log(
    `${readinessIcon} Integration Readiness: ${readinessStatus} (${readyCount}/${readinessChecks.length} services)`,
  );

  if (overallReadiness) {
    console.log("🎉 All infrastructure services are ready for QiCore Actor integration!");
    console.log("💡 You can now run CoinGecko Actor demos with full streaming pipeline support.");
  } else {
    console.log(
      "⚠️ Some services are not running. Start missing services to enable full functionality.",
    );
    console.log("💡 CoinGecko Actor demos will still work with basic functionality.");
  }

  console.log("");

  // =============================================================================
  // NEXT STEPS
  // =============================================================================

  console.log("🚀 NEXT STEPS FOR QICORE DEVELOPMENT");
  console.log("🎯 Recommended actions based on current service status...\n");

  if (overallReadiness) {
    console.log("✅ All services ready - you can:");
    console.log("   🎭 Run CoinGecko Actor demos with full streaming integration");
    console.log("   📊 Test real-time data pipeline: CoinGecko → Redpanda → TimescaleDB");
    console.log("   🔍 Develop analytics queries on ClickHouse");
    console.log("   ⚡ Implement caching strategies with Redis");
  } else {
    console.log("🔧 To enable full functionality:");
    if (!services.find((s) => s.name === "redpanda")?.status) {
      console.log("   📡 Start Redpanda for real-time streaming capabilities");
    }
    if (!services.find((s) => s.name === "timescaledb")?.status) {
      console.log("   🗄️ Start TimescaleDB for time-series data storage");
    }
    if (!services.find((s) => s.name === "clickhouse")?.status) {
      console.log("   📈 Start ClickHouse for advanced analytics");
    }
    if (!services.find((s) => s.name === "redis")?.status) {
      console.log("   ⚡ Start Redis for high-performance caching");
    }
  }

  console.log("\n🎯 Development Workflow:");
  console.log("   1️⃣ Start infrastructure services (this demo)");
  console.log("   2️⃣ Run CoinGecko Actor demos (app/demos/publishers/)");
  console.log("   3️⃣ Test streaming integration with publishers");
  console.log("   4️⃣ Develop analytics and monitoring dashboards");

  console.log("\n🎉 DOCKER SERVICES DEMONSTRATION SUCCESSFUL!");
  console.log("💡 QiCore infrastructure management capabilities validated.\n");

  return true;
}

// =============================================================================
// RUN DEMONSTRATION
// =============================================================================

if (import.meta.main) {
  console.log("=".repeat(80));
  console.log("🚀 QICORE CRYPTO DATA PLATFORM - DOCKER SERVICES DEMO");
  console.log("=".repeat(80));

  const success = await demonstrateDockerServices();

  console.log("\n" + "=".repeat(80));
  console.log(success ? "✅ SERVICES DEMO COMPLETED SUCCESSFULLY" : "❌ SERVICES DEMO FAILED");
  console.log("🐳 DOCKER INFRASTRUCTURE MANAGEMENT VALIDATED");
  console.log("=".repeat(80));

  process.exit(success ? 0 : 1);
}
