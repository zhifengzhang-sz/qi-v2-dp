/**
 * @fileoverview
 * @module cli.loader.main.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

import { join } from "path";
import { Schema } from "@qi/core/config";
import { initializeCliConfig } from "./cli_config_loader.js";
import { formatJsonWithColor } from "@qi/core/utils";

async function main() {
  try {
    const configPath = join(process.cwd(), "config", "cli.json");
    const schema = new Schema();
    const { config, masterInfo } = await initializeCliConfig(
      configPath,
      schema
    );

    console.log("\nConfiguration:", formatJsonWithColor(config));
    console.log("\nMaster Info:", formatJsonWithColor(masterInfo));
  } catch (error) {
    console.error("Failed to initialize CLI:", error);
    process.exit(1);
  }
}

main();
