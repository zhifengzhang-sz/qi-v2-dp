/**
 * @fileoverview
 * @module eslint.config
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-23
 */

import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  // Extend ESLint recommended rules
  js.configs.recommended,

  // TypeScript-specific configuration
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    ignores: ["node_modules"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Extend recommended TypeScript rules
      ...tsPlugin.configs.recommended.rules,

      // Custom rules
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      "prettier/prettier": "error",
    },
  },

  // Test-specific configuration
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, "tsconfig.test.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        vitest: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "prettier/prettier": "error",
    },
  },

  // Prettier configuration to enforce formatting
  prettierConfig,

  // Node.js-specific configuration
  {
    "env": {
      "node": true
    }
  }
];
