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
  js.configs.recommended,
  {
    ignores: ["node_modules/**/*", "dist/**/*"]
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        NodeJS: true,
        WebSocket: true,
        URL: true,
        crypto: true,
        setTimeout: true,
        setInterval: true,
        clearInterval: true,
        clearTimeout: true,
        console: true
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-unused-expressions": ["error"],
      "prettier/prettier": "error"
    }
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, "tsconfig.test.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        NodeJS: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        vi: true
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off"
    }
  },
  prettierConfig
];