/**
 * @fileoverview
 * @module generate-config
 *
 * @author zhifengzhang-sz
 * @created 2025-02-01
 * @modified 2025-02-01
 */

// generate-config.js (ES Module version)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Handlebars from "handlebars";

// Compute __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust the path to your .env file if needed.
// For example, if your .env is in the project root and this script is in services/ai/ollama-deepseek,
// you might need to go up one or two directories:
dotenv.config({ path: path.join(__dirname, "./.env") });

// Read the template file (.env-local.template) from the current directory.
const templatePath = path.join(__dirname, ".env-local.template");
const templateContent = fs.readFileSync(templatePath, "utf8");

// Compile the template using Handlebars.
const template = Handlebars.compile(templateContent);

// Render the template with process.env as the context.
const output = template(process.env);

// Write the rendered template to .env-local.
const outputPath = path.join(__dirname, ".env-local");
fs.writeFileSync(outputPath, output, "utf8");

console.log(`Generated configuration file at ${outputPath}`);
