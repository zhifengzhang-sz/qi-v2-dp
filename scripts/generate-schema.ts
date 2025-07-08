#!/usr/bin/env bun

/**
 * Schema Generation Script
 *
 * Generates database schemas from DSL types and updates services configuration
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TIMESCALE_GENERATOR = path.join(PROJECT_ROOT, "lib/src/generators/schema-generator.ts");
const REDPANDA_GENERATOR = path.join(
  PROJECT_ROOT,
  "lib/src/generators/redpanda-schema-generator.ts",
);
const GENERATED_TIMESCALE_SCHEMA = path.join(
  PROJECT_ROOT,
  "services/database/init-timescale-generated.sql",
);
const REDPANDA_OUTPUT_DIR = path.join(PROJECT_ROOT, "services/redpanda/");

async function main() {
  console.log("🚀 QiCore Schema Generation");
  console.log("==========================");

  // Step 1: Verify generators exist
  if (!existsSync(TIMESCALE_GENERATOR)) {
    console.error("❌ TimescaleDB generator not found:", TIMESCALE_GENERATOR);
    process.exit(1);
  }

  if (!existsSync(REDPANDA_GENERATOR)) {
    console.error("❌ Redpanda generator not found:", REDPANDA_GENERATOR);
    process.exit(1);
  }

  console.log("📝 Generating TimescaleDB schema from DSL types...");

  try {
    // Step 2: Run TimescaleDB schema generator
    const timescaleResult = execSync(
      `bun run ${TIMESCALE_GENERATOR} ${GENERATED_TIMESCALE_SCHEMA}`,
      {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
      },
    );

    console.log(timescaleResult.trim());

    // Step 3: Run Redpanda schema generator
    console.log("\n🔴 Generating Redpanda topic schemas from DSL types...");
    const redpandaResult = execSync(`bun run ${REDPANDA_GENERATOR} ${REDPANDA_OUTPUT_DIR}`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });

    console.log(redpandaResult.trim());

    // Step 4: Verify generated files
    if (!existsSync(GENERATED_TIMESCALE_SCHEMA)) {
      console.error("❌ Failed to generate TimescaleDB schema file");
      process.exit(1);
    }

    console.log("\n✅ Schema generation complete!");
    console.log("");
    console.log("📄 Files updated:");
    console.log(`   - ${GENERATED_TIMESCALE_SCHEMA}`);
    console.log(`   - ${REDPANDA_OUTPUT_DIR}topics.yml`);
    console.log(`   - ${REDPANDA_OUTPUT_DIR}schemas.json`);
    console.log(`   - ${REDPANDA_OUTPUT_DIR}generated-mappings.ts`);
    console.log("");
    console.log("🔄 Next steps:");
    console.log("   1. Review the generated schemas");
    console.log("   2. Restart services: docker-compose down && docker-compose up");
    console.log("   3. Test with demos to verify everything works");
    console.log("");
    console.log("ℹ️  All schemas automatically derived from DSL types in:");
    console.log("   lib/src/abstract/dsl/MarketDataTypes.ts");
    console.log("");
    console.log("🏗️ Architecture:");
    console.log("   DSL Schema (source of truth) → Auto-generates → Database + Topic schemas");
  } catch (error) {
    console.error("❌ Schema generation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
