/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-10-31
 */

import { CliConfig } from "qi/common/cli/CliConfig";

// Usage example
try {
  const cliConfig = new CliConfig("./config/cli.json");
  const validationResults = cliConfig.validateSpec();
  
  validationResults.forEach(({componentId, result}) => {
    console.log(`Component ${componentId}: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
  });
} catch (error) {
  console.error("Configuration error:", error.message);
  process.exit(1);
}