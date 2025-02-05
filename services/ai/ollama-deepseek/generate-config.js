/**
 * @fileoverview
 * @module generate-config
 *
 * @author zhifengzhang-sz
 * @created 2025-02-01
 * @modified 2025-02-05
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
  // Extract parameters with proper type conversion
  const envParams = {
    num_thread: parseInt(process.env.OLLAMA_NUM_THREAD) || 12,
    num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || 2048,
    num_batch: parseInt(process.env.OLLAMA_NUM_BATCH) || 512
  };

  return {
    name: model.name,
    displayName: model.displayName || model.name,
    description: model.description,
    parameters: {
      ...model.parameters || {},  // Ensure model.parameters exists and comes first
      temperature: model.parameters?.temperature || 0.7,
      top_p: model.parameters?.top_p || 0.95,
      repetition_penalty: model.parameters?.repetition_penalty || 1.2,
      num_thread: model.parameters?.num_thread || envParams.num_thread,
      num_ctx: model.parameters?.num_ctx || envParams.num_ctx,
      num_batch: model.parameters?.num_batch || envParams.num_batch,
      tokenizer: model.parameters?.tokenizer || {
        type: "llama-bpe",
        model: "gpt2"
      }
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
