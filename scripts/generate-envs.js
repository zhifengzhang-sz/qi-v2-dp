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
PGADMIN_DEFAULT_PASSWORD=${generateRandomPassword()}

# === TimescaleDB/PostgreSQL Configuration ===
POSTGRES_HOST=timescaledb
POSTGRES_PORT=5432
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${generateRandomPassword()}
PGDATA=/var/lib/postgresql/data

# === QuestDB Configuration ===
QDB_TELEMETRY_ENABLED=false

# === Grafana Configuration ===
GF_SECURITY_ADMIN_PASSWORD=${generateRandomPassword()}
GF_INSTALL_PLUGINS=questdb-questdb-datasource;grafana-postgresql-datasource

# === Redis Configuration ===
REDIS_PASSWORD=${generateRandomPassword()}

# === Redpanda Configuration ===
REDPANDA_BROKER_ID=0
REDPANDA_ADVERTISED_KAFKA_API=localhost
REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=localhost
REDPANDA_ADVERTISED_PANDAPROXY_API=localhost
`;

// Ensure the directories exist
if (!fs.existsSync(".devcontainer")) {
  fs.mkdirSync(".devcontainer");
}
if (!fs.existsSync("services")) {
  fs.mkdirSync("services");
}

// Create the .env files
createEnvFile(".devcontainer", devcontainerEnvContent);
createEnvFile("services", servicesEnvContent);