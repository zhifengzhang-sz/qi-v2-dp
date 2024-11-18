/**
 * @fileoverview
 * @module generate-envs.v1
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// scripts/generate-envs.js

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Generates a random password
function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

// Function to create an .env file with specified content
function createEnvFile(directory, content) {
  const filePath = path.join(directory, ".env");
  fs.writeFileSync(filePath, content.trim());
  console.log(`.env file created in ${directory} directory.`);
}

// Generate the shared POSTGRES_PASSWORD once
const sharedPostgresPassword = generateRandomPassword();

// Generate other shared passwords if needed
const sharedPgAdminPassword = generateRandomPassword();
const sharedRedisPassword = generateRandomPassword();
const sharedGrafanaPassword = generateRandomPassword();

// Content for the .devcontainer/.env file
const devcontainerEnvContent = `
USERNAME=${process.env.USERNAME || process.env.USER}
UID=${process.getuid()}
GID=${process.getgid()}
REGISTRY=blackgolfer
VERSION=latest
`;

// Content for the services/.env file
const servicesEnvContent = `
# === PGAdmin Configuration ===
PGADMIN_DEFAULT_EMAIL=qi@tianyi.com
PGADMIN_DEFAULT_PASSWORD=${sharedPgAdminPassword}

# === TimescaleDB/PostgreSQL Configuration ===
POSTGRES_HOST=timescaledb
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${sharedPostgresPassword}
PGDATA=/var/lib/postgresql/data

# === QuestDB Configuration ===
QDB_TELEMETRY_ENABLED=false

# === Grafana Configuration ===
GF_SECURITY_ADMIN_PASSWORD=${sharedGrafanaPassword}
GF_INSTALL_PLUGINS=questdb-questdb-datasource;grafana-postgresql-datasource

# === Redis Configuration ===
REDIS_PASSWORD=${sharedRedisPassword}

# === Redpanda Configuration ===
REDPANDA_BROKER_ID=0
REDPANDA_ADVERTISED_KAFKA_API=localhost
REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=localhost
REDPANDA_ADVERTISED_PANDAPROXY_API=localhost
`;

// Content for the js/.env file
const jsEnvContent = `
# Node environment
NODE_ENV=development

# Database configuration
DB_HOST=timescaledb
DB_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${sharedPostgresPassword}
PGDATA=/var/lib/postgresql/data

# PGAdmin configuration
PGADMIN_DEFAULT_EMAIL=qi@tianyi.com
PGADMIN_DEFAULT_PASSWORD=${sharedPgAdminPassword}

# QuestDB configuration
QDB_TELEMETRY_ENABLED=false

# Grafana configuration
GF_SECURITY_ADMIN_PASSWORD=${sharedGrafanaPassword}
GF_INSTALL_PLUGINS=questdb-questdb-datasource;grafana-postgresql-datasource

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${sharedRedisPassword}

# Logging
LOG_LEVEL=info

# API configuration
API_PORT=3000

# Kafka/Redpanda configuration
KAFKA_BROKERS=redpanda:9092
KAFKA_CLIENT_ID=qi-client
KAFKA_GROUP_ID=qi-group

# Redpanda specific configuration
REDPANDA_BROKER_ID=0
REDPANDA_ADVERTISED_KAFKA_API=localhost
REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=localhost
REDPANDA_ADVERTISED_PANDAPROXY_API=localhost
`;

// Ensure the directories exist
const directories = ['.devcontainer', 'services', 'js'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create the .env files
createEnvFile(".devcontainer", devcontainerEnvContent);
createEnvFile("services", servicesEnvContent);
createEnvFile("js", jsEnvContent);

console.log("All .env files have been generated successfully!");
