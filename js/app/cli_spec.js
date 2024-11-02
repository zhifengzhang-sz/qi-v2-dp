/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-10-31
 */

import { CliConfig } from "qi/core/cli/CliConfig";
import SpecHandler from "qi/core/cli/SpecHandler";

// Usage example
try {
  const cliConfig = new CliConfig("./config/cli.json");
  const validationResults = cliConfig.validateSpec();
  
  validationResults.forEach(({componentId, result}) => {
    console.log(`Component ${componentId}: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
  });

  const specHandler = new SpecHandler(cliConfig);

  console.log("Master information:", specHandler.master_info);
  console.log("Help message:", specHandler.help_message);
  console.log(specHandler.commandUsage('cryptocompare'));
} catch (error) {
  console.error("Configuration error:", error.message);
  process.exit(1);
}