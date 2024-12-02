/**
 * @fileoverview
 * @module generate-config
 *
 * @author zhifengzhang-sz
 * @created 2024-12-02
 * @modified 2024-12-02
 */

// scripts/generate-config.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

class ConfigGenerator {
  constructor(version) {
    this.version = version;
    this.timestamp = new Date().toISOString();
    this.sensitiveKeys = [
      "POSTGRES_PASSWORD",
      "PGADMIN_DEFAULT_PASSWORD",
      "REDIS_PASSWORD", 
      "GF_SECURITY_ADMIN_PASSWORD"
    ];
  }

  generateRandomPassword(length = 12) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  loadExistingEnv(envPath) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            env[key.trim()] = value.trim();
          }
        });
        return env;
      }
    } catch (error) {
      console.warn(`Warning: Could not load env file from ${envPath}:`, error.message);
    }
    return null;
  }

  generatePasswords() {
    // Try to load existing passwords from services/.env first
    const existingEnv = this.loadExistingEnv('services/.env');
    if (existingEnv) {
      const hasAllPasswords = this.sensitiveKeys.every(key => existingEnv[key]);
      if (hasAllPasswords) {
        return this.sensitiveKeys.reduce((acc, key) => {
          acc[key] = existingEnv[key];
          return acc;
        }, {});
      }
    }

    return {
      POSTGRES_PASSWORD: this.generateRandomPassword(),
      PGADMIN_DEFAULT_PASSWORD: this.generateRandomPassword(),
      REDIS_PASSWORD: this.generateRandomPassword(),
      GF_SECURITY_ADMIN_PASSWORD: this.generateRandomPassword()
    };
  }

  generateServiceConfig() {
    return {
      type: "services",
      version: this.version,
      databases: {
        postgres: {
          host: "timescaledb",
          port: 5432,
          database: "postgres",
          user: "postgres",
          maxConnections: 100
        },
        questdb: {
          host: "questdb",
          httpPort: 9000,
          pgPort: 8812,
          influxPort: 9009
        },
        redis: {
          host: "redis",
          port: 6379,
          maxRetries: 3
        }
      },
      messageQueue: {
        redpanda: {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082
        }
      },
      monitoring: {
        grafana: {
          host: "grafana",
          port: 3000
        },
        pgAdmin: {
          host: "pgadmin",
          port: 80
        }
      },
      networking: {
        networks: {
          db: "qi_db",
          redis: "redis_network",
          redpanda: "redpanda_network"
        }
      }
    };
  }

  generateEnvConfig(passwords) {
    return {
      // Database credentials
      POSTGRES_PASSWORD: passwords.POSTGRES_PASSWORD,
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "postgres",

      // Redis configuration
      REDIS_PASSWORD: passwords.REDIS_PASSWORD,

      // Monitoring credentials
      GF_SECURITY_ADMIN_PASSWORD: passwords.GF_SECURITY_ADMIN_PASSWORD,
      GF_INSTALL_PLUGINS: "",
      PGADMIN_DEFAULT_EMAIL: "qi@tianyi.com",
      PGADMIN_DEFAULT_PASSWORD: passwords.PGADMIN_DEFAULT_PASSWORD,

      // QuestDB configuration
      QDB_TELEMETRY_ENABLED: "false",

      // Redpanda configuration
      REDPANDA_BROKER_ID: "0",
      REDPANDA_ADVERTISED_KAFKA_API: "redpanda",
      REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: "redpanda",
      REDPANDA_ADVERTISED_PANDAPROXY_API: "redpanda"
    };
  }

  formatEnvContent(env) {
    return Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }

  // Step 1: Generate initial environment file
  generateInitialEnv() {
    const passwords = this.generatePasswords();
    const envConfig = this.generateEnvConfig(passwords);
    const envContent = this.formatEnvContent(envConfig);

    // Ensure services directory exists
    if (!fs.existsSync('services')) {
      fs.mkdirSync('services', { recursive: true });
    }

    // Write to services/.env
    const servicesEnvPath = path.join('services', '.env');
    fs.writeFileSync(servicesEnvPath, envContent);
    console.log(`Generated initial environment file: ${servicesEnvPath}`);
  }

  // Step 2: Map environment to configuration files
  mapEnvToConfig() {
    // Load existing environment file
    const existingEnv = this.loadExistingEnv('services/.env');
    if (!existingEnv) {
      throw new Error('services/.env file not found. Run generate-config init first.');
    }

    // Generate configurations
    const serviceConfig = this.generateServiceConfig();
    const envContent = this.formatEnvContent(existingEnv);

    // Ensure config directory exists
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config', { recursive: true });
    }

    // Write service configuration file
    const configPath = path.join('config', `services-${this.version}.json`);
    fs.writeFileSync(configPath, JSON.stringify(serviceConfig, null, 2));
    console.log(`Generated service configuration: ${configPath}`);

    // Write to config/services.env
    const configEnvPath = path.join('config', 'services.env');
    fs.writeFileSync(configEnvPath, envContent);
    console.log(`Generated config environment file: ${configEnvPath}`);
  }

  // Combined execution
  generateAll() {
    this.generateInitialEnv();
    this.mapEnvToConfig();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let command = 'all';
  let version = '1.0.0';

  if (args.length >= 1) {
    // First argument is a command
    if (['init', 'map', 'all'].includes(args[0])) {
      command = args[0];
      // Check for version as second argument
      if (args[1]) {
        version = args[1];
      }
    } else {
      // First argument is a version for default 'all' command
      version = args[0];
    }
  }

  return { command, version };
}

// Example usage messages
const usage = `
Usage: 
  npm run config -- [command] [version]
  npm run config:version -- [command] <version>
  npm run config:init
  npm run config:map -- <version>

Commands:
  init      Generate initial services/.env file
  map       Map services/.env to config files
  all       Generate all configuration files (default)

Examples:
  npm run config:map -- 1.0.0          # Map with specific version
  npm run config:version -- map 1.0.0   # Alternative way to map with version
  npm run config -- map 2.0.0           # Another way to map with version
`;

try {
  const { command, version } = parseArgs();
  console.log(`Executing ${command} command with version ${version}`);
  
  const generator = new ConfigGenerator(version);

  switch (command) {
    case 'init':
      generator.generateInitialEnv();
      break;
    case 'map':
      generator.mapEnvToConfig();
      break;
    case 'all':
      generator.generateAll();
      break;
    default:
      console.log(usage);
      process.exit(1);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.log(usage);
  process.exit(1);
}
