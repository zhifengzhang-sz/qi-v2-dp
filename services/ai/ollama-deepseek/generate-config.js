/**
 * @fileoverview
 * @module generate-config
 *
 * @author zhifengzhang-sz
 * @created 2025-02-01
 * @modified 2025-02-04
 */

// generate-config.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if --multi flag is present
const isMultiMode = process.argv.includes("--multi");

// Load base environment variables
dotenv.config({ path: path.join(__dirname, "./.env") });

// Helper function to format model name
Handlebars.registerHelper("formatModelName", function (name, size, variant) {
  return `DeepSeek ${size}${variant ? ` ${variant}` : ""}`;
});

// Function to generate model config
function generateModelConfig(model) {
  // Parse the name to extract components (assuming format: name:size-variant)
  const [baseName, details] = model.name.split(":");
  const [size, ...variantParts] = details.split("-");
  const variant = variantParts.join("-");

  return {
    name: `DeepSeek ${size}${variant ? ` ${variant}` : ""}`,
    description: `DeepSeek Code Language Model - ${size}${
      variant ? ` (${variant})` : ""
    } Version`,
    parameters: {
      temperature: 0.7,
      top_p: 0.95,
      repetition_penalty: 1.2,
      ...model.parameters,
    },
    endpoints: model.endpoints.map((endpoint) => ({
      ...endpoint,
      url: endpoint.url || "http://ollama-service:11434",
    })),
  };
}

let output;
if (isMultiMode) {
  try {
    // Read multi-model config
    const multiConfigPath = path.join(__dirname, ".env-multi");
    console.log(`Reading multi-model config from ${multiConfigPath}`);
    const multiConfigContent = fs.readFileSync(multiConfigPath, "utf8");
    const multiConfig = JSON.parse(multiConfigContent);

    if (!multiConfig.MODELS || !Array.isArray(multiConfig.MODELS)) {
      throw new Error("Invalid .env-multi format: MODELS array not found");
    }

    const models = multiConfig.MODELS.map(generateModelConfig);
    console.log(`Processed ${models.length} models from .env-multi`);

    output = `MONGODB_URL="mongodb://${process.env.MONGO_ROOT_USER}:${
      process.env.MONGO_ROOT_PASSWORD
    }@qi-mongodb:27017/chat_db?authSource=admin"
HF_TOKEN="${process.env.HF_TOKEN}"
MODELS=\`${JSON.stringify(models, null, 2)}\``;
  } catch (error) {
    console.error("Error processing multi-model configuration:", error);
    process.exit(1);
  }
} else {
  // Single model mode - use template with env vars
  const templatePath = path.join(__dirname, ".env-local.template");
  const templateContent = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateContent);
  output = template(process.env);
}

// Write the output
const outputPath = path.join(__dirname, ".env-local");
fs.writeFileSync(outputPath, output, "utf8");

console.log(
  `Generated configuration file at ${outputPath} in ${
    isMultiMode ? "multi" : "single"
  } model mode`
);
