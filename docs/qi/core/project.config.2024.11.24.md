## The `qi` configurations
  
### `package.json`
  
#### `qi/package.json`
  
```json
{
  "name": "qi",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "core",
    "producers",
    "consumers",
    "app"
  ],
  "type": "module",
  "scripts": {
    "clean": "npm run clean --workspaces",
    "build": "npm run build --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "npm run format --workspaces",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@types/node": "^22.9.3",
    "eslint": "^9.14.0",
    "glob": "^9.3.5",
    "prettier": "^3.0.3",
    "typescript": "5.6.3"
  },
  "overrides": {
    "typescript": "5.6.3"
  },
  "dependencies": {
    "lru-cache": "^11.0.2"
  }
}
  
```  
  
- **name**: Project name is "qi".
- **version**: Current version is "1.0.0".
- **private**: Set to `true` to prevent the package from being published to npm.
- **workspaces**: Defines a monorepo structure with four sub-projects:
  - `core`
  - `producers`
  - `consumers`
  - `app`
- **type**: Set to `"module"` to use ES module syntax.
- **scripts**:
  - `clean`: Runs the `clean` script in all workspaces.
  - `build`: Runs the `build` script in all workspaces.
  - `lint`: Runs the `lint` script in all workspaces.
  - `format`: Runs the `format` script in all workspaces.
  - `test`: Executes tests using Vitest.
  - `test:run`: Runs Vitest tests.
  - `test:coverage`: Runs Vitest tests with coverage reporting.
- **devDependencies**:
  - `eslint`: Linting tool for identifying and fixing problems in JavaScript/TypeScript code.
  - `prettier`: Code formatter to enforce consistent style.
  - `typescript`: Adds TypeScript support for static type checking.
  
#### `qi/core/package.json`
  
```json
{
  "name": "@qi/core",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "build": "npm run clean && tsc -b",
    "lint": "eslint './src/**/*.{ts,js}'",
    "format": "prettier --write './src/**/*.ts'",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@types/ioredis": "^4.28.10",
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "bytes": "^3.1.2",
    "dotenv": "^16.4.5",
    "fs-extra": "^11.2.0",
    "ioredis": "^5.4.1",
    "lodash-es": "^4.17.21",
    "node": "^20.18.1",
    "retry": "^0.13.1",
    "winston": "^3.16.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.14.0",
    "@types/bytes": "^3.1.4",
    "@types/chai": "^5.0.1",
    "@types/fs-extra": "^11.0.4",
    "@types/lodash": "^4.17.13",
    "@types/lodash-es": "^4.17.12",
    "@types/mocha": "^10.0.9",
    "@types/node": "^22.9.1",
    "@types/redis-mock": "^0.17.3",
    "@types/retry": "^0.12.5",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "chai": "^5.1.2",
    "eslint": "^9.15.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "globals": "^15.12.0",
    "lodash": "^4.17.21",
    "mocha": "^10.8.2",
    "prettier": "^3.3.3",
    "redis-mock": "^0.56.3",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./*": {
      "import": "./dist/*/index.js",
      "require": "./dist/*/index.js"
    },
    "./cli/config/*": {
      "import": "./dist/cli/config/*.js",
      "require": "./dist/cli/config/*.js"
    },
    "./services/config/*": {
      "import": "./dist/services/config/*.js",
      "require": "./dist/services/config/*.js"
    },
    "./services/utils": {
      "import": "./dist/services/utils/index.js",
      "require": "./dist/services/utils/index.js"
    }
  }
}
  
```  
  
- **name**: `@qi/core`
  - The name of the package, scoped under `@qi`.
  
- **version**: `1.0.0`
  - Indicates the current version of the package.
  
- **type**: `"module"`
  - Specifies that the package uses ES Module syntax.
  
- **main**: `"dist/index.js"`
  - Entry point for CommonJS modules.
  
- **types**: `"dist/index.d.ts"`
  - Entry point for TypeScript type definitions.
  
- **scripts**:
  - **clean**: Removes the `dist` directory and TypeScript build info file.
    ```bash
    rm -rf dist tsconfig.tsbuildinfo
    ```
  - **build**: Runs the `clean` script and then builds the project using TypeScript in build mode.
    ```bash
    npm run clean && tsc -b
    ```
  - **lint**: Runs ESLint on all `.ts` and `.js` files within the `src` directory.
    ```bash
    eslint './src/**/*.{ts,js}'
    ```
  - **format**: Formats all `.ts` files within the `src` directory using Prettier.
    ```bash
    prettier --write './src/**/*.ts'
    ```
  - **test**: Runs tests using Vitest.
    ```bash
    vitest
    ```
  - **test:run**: Executes Vitest tests.
    ```bash
    vitest run
    ```
  - **test:coverage**: Runs Vitest tests with coverage reporting.
    ```bash
    vitest run --coverage
    ```
  
- **dependencies**:
  - **@types/ioredis**: Type definitions for `ioredis`.
  - **ajv** & **ajv-formats**: JSON schema validator and format extensions.
  - **bytes**: Utility for parsing and formatting byte sizes.
  - **dotenv**: Loads environment variables from a 
  
.env
  
 file.
  - **fs-extra**: Extended file system methods.
  - **ioredis**: Redis client.
  - **lodash-es**: Lodash utility library with ES modules.
  - **node**: Node.js version dependency.
  - **retry**: Retry utility for asynchronous operations.
  - **winston**: Logging library.
  - **zod**: TypeScript-first schema validation library.
  
- **devDependencies**:
  - **@eslint/js**, **eslint**, **@typescript-eslint/eslint-plugin**, **@typescript-eslint/parser**: ESLint and TypeScript ESLint plugins for linting.
  - **@types/** packages: Type definitions for various libraries to aid TypeScript.
  - **chai**, **mocha**, **vitest**: Testing frameworks and libraries.
  - **eslint-config-prettier**, **eslint-plugin-prettier**: Integrations between ESLint and Prettier.
  - **globals**: Collection of global variable declarations.
  - **lodash**, **redis-mock**, etc.: Development utilities and mocks.
  - **prettier**: Code formatter.
  - **typescript**: TypeScript compiler.
  
- **exports**:
  - Defines entry points for different import types (ESM and CommonJS).
  - **"."**: Root import pointing to `dist/index.js`.
  - **"./*"**: Wildcard imports within subdirectories.
  - **"./errors/*"**, **"./cli/config/*"**, **"./services/config/*"**: Specific paths for errors, CLI config, and service config modules.
  - **"./services/utils"**: Direct import for utilities within services.
  
This `package.json` is configured for a TypeScript-based project using a monorepo structure with scoped packages. It includes scripts for cleaning, building, linting, formatting, and testing the codebase. Dependencies and devDependencies are organized to support development and runtime functionalities, including testing, linting, and type checking. The `exports` field ensures proper module resolution for different parts of the package, supporting both ESM and CommonJS consumers.
  
#### `qi/app/package.json`
  
```json
{
  "name": "@qi/app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc -b",
    "clean": "rm -rf dist",
    "lint": "eslint './src/**/*.ts'",
    "format": "prettier --write './src/**/*.{ts,js}'",
    "start:cli": "node --loader ts-node/esm --experimental-specifier-resolution=node src/cli.loader.main.ts",
    "start:services": "node --loader ts-node/esm --experimental-specifier-resolution=node src/services.main.ts"
  },
  "dependencies": {
    "@qi/core": "*",
    "yargs": "^17.7.2"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.6.3"
  }
}
  
```  
  
- **name**: `@qi/app`
  - Name of the package, scoped under `@qi`.
  
- **version**: `1.0.0`
  - Current version of the package.
  
- **type**: `"module"`
  - Indicates the use of ES Module syntax.
  
- **scripts**:
  - **build**: Compiles the TypeScript project using the build mode.
    ```bash
    tsc -b
    ```
  - **clean**: Removes the `dist` directory.
    ```bash
    rm -rf dist
    ```
  - **lint**: Runs ESLint on all `.ts` files within the `src` directory.
    ```bash
    eslint './src/**/*.ts'
    ```
  - **format**: Formats all `.ts` and `.js` files within the `src` directory using Prettier.
    ```bash
    prettier --write './src/**/*.{ts,js}'
    ```
  - **start:cli**: Starts the CLI application using `ts-node` with ES Module support and Node.js specifier resolution.
    ```bash
    node --loader ts-node/esm --experimental-specifier-resolution=node src/cli.loader.main.ts
    ```
  - **start:services**: Starts the services application using `ts-node` with ES Module support and Node.js specifier resolution.
    ```bash
    node --loader ts-node/esm --experimental-specifier-resolution=node src/services.main.ts
    ```
  
- **dependencies**:
  - **@qi/core**: `"*"`
    - Depends on the `@qi/core` package within the monorepo.
  - **yargs**: `"^17.7.2"`
    - Command-line argument parsing library.
  
- **devDependencies**:
  - **ts-node**: `"^10.9.2"`
    - TypeScript execution environment for Node.js.
  - **tsconfig-paths**: `"^4.2.0"`
    - Adds support for path mapping in `tsconfig.json`.
  - **typescript**: `"^5.6.3"`
    - TypeScript compiler.
  
This `package.json` is configured for the `@qi/app` package within a monorepo. It includes scripts for building, cleaning, linting, formatting, and starting both CLI and services components using `ts-node`. Dependencies include the core package (`@qi/core`) and `yargs` for command-line interfaces. Development dependencies support TypeScript compilation and path resolution.
  
  
### `tsconfig.ts`
  
#### `qi/tsconfig.ts`
  
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "types": ["node"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@qi/core/*": ["core/src/*"],
      "@qi/producers/*": ["producers/src/*"],
      "@qi/consumers/*": ["consumers/src/*"],
      "@qi/app/*": ["app/src/*"]
    }
  },
  "references": [
    { "path": "./core" },
    { "path": "./producers" },
    { "path": "./consumers" },
    { "path": "./app" }
  ],
  "include": [],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```  
  
- **compilerOptions**:
  - **target**: `"ES2023"`
    - Specifies ECMAScript target version.
  - **module**: `"NodeNext"`
    - Uses Node.js ESM resolution.
  - **moduleResolution**: `"NodeNext"`
    - Resolves modules using Node.js ESM.
  - **lib**: `["ES2023"]`
    - Includes ES2023 library definitions.
  - **types**: `["node"]`
    - Includes Node.js type definitions.
  - **outDir**: `"./dist"`
    - Output directory for compiled files.
  - **strict**: `true`
    - Enables strict type-checking options.
  - **esModuleInterop**: `true`
    - Enables interoperability between CommonJS and ES Modules.
  - **skipLibCheck**: `true`
    - Skips type checking of declaration files.
  - **forceConsistentCasingInFileNames**: `true`
    - Ensures consistent casing in file names.
  - **resolveJsonModule**: `true`
    - Allows importing JSON modules.
  - **allowSyntheticDefaultImports**: `true`
    - Allows default imports from modules with no default export.
  - **declaration**: `true`
    - Generates `.d.ts` declaration files.
  - **sourceMap**: `true`
    - Generates source maps for debugging.
  - **baseUrl**: `"."`
    - Base directory for resolving non-relative module names.
  - **paths**:
    - Maps module aliases to specific paths.
    - `"@qi/core/*": ["core/src/*"]`
    - `"@qi/producers/*": ["producers/src/*"]`
    - `"@qi/consumers/*": ["consumers/src/*"]`
    - `"@qi/app/*": ["app/src/*"]`
  
- **references**:
  - References to project subdirectories for composite builds.
  - `{ "path": "./core" }`
  - `{ "path": "./producers" }`
  - `{ "path": "./consumers" }`
  - `{ "path": "./app" }`
  
- **include**: `[]`
  - No additional files included by default.
  
- **exclude**:
  - Excludes specified directories and test files from compilation.
  - `"node_modules"`
  - `"dist"`
  - `"**/*.test.ts"`
  - `"**/*.spec.ts"`
  
This `tsconfig.json` is configured for a monorepo setup with multiple packages (`core`, `producers`, `consumers`, `app`). It uses strict TypeScript settings, ES2023 target, and Node.js ESM modules. Path aliases are defined for easier imports, and project references are set for efficient builds. Test files and build artifacts are excluded from the compilation process.
  
#### `qi/core/tsconfig.ts`
  
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "emitDeclarationOnly": false,      // Ensure JavaScript files are emitted
    "noEmit": false                     // Ensure TypeScript emits files
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```  
  
- **extends**: `tsconfig.json`
  - Inherits configurations from the root `tsconfig.json`.
  
- **compilerOptions**:
  - **outDir**: `"dist"`
    - Specifies the output directory for compiled JavaScript files.
  - **rootDir**: `"src"`
    - Defines the root directory of input TypeScript files.
  - **declaration**: `true`
    - Generates `.d.ts` declaration files for TypeScript.
  - **declarationMap**: `true`
    - Creates source maps for declaration files.
  - **composite**: `true`
    - Enables project references for incremental builds.
  - **emitDeclarationOnly**: `false`
    - Ensures that JavaScript files are emitted alongside declaration files.
  - **noEmit**: `false`
    - Allows TypeScript to emit compiled files.
  
- **include**:
  - `["src/**/*.ts"]`
    - Includes all `.ts` files within the `src` directory and its subdirectories.
  
- **exclude**:
  - `["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]`
    - Excludes `node_modules`, `dist` directories, and test files from compilation.
  
This `tsconfig.json` is configured for a specific package within a monorepo, extending the root configuration. It ensures that TypeScript compiles source files from the `src` directory to the `dist` directory, generates type declarations with source maps, and supports composite projects for efficient builds. Test files and build artifacts are excluded from the compilation process.
  
#### `qi/core/tsconfig.test.json`
  
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true,
    "types": ["vitest/globals", "node"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts",
    "vitest.setup.ts",
    "vitest.config.ts"
  ],
  "exclude": ["node_modules"]
}
```  
  
- **extends**: `./tsconfig.json`
  - Inherits configurations from the root `tsconfig.json`.
  
- **compilerOptions**:
  - **rootDir**: `"."`
    - Sets the root directory for input files to the current directory.
  - **noEmit**: `true`
    - Prevents TypeScript from emitting compiled JavaScript files.
  - **types**: `["vitest/globals", "node"]`
    - Includes type definitions for Vitest globals and Node.js.
  - **target**: `"ES2022"`
    - Specifies ECMAScript target version for the compilation.
  - **module**: `"NodeNext"`
    - Uses Node.js ESM module resolution.
  - **moduleResolution**: `"NodeNext"`
    - Resolves modules using Node.js ESM.
  
- **include**:
  - `["src/**/*.ts", "tests/**/*.ts", "vitest.setup.ts", "vitest.config.ts"]`
    - Includes all `.ts` files in `src` and `tests` directories, along with `vitest.setup.ts` and `vitest.config.ts`.
  
- **exclude**:
  - `["node_modules"]`
    - Excludes the `node_modules` directory from compilation.
  
This `tsconfig.test.json` is tailored for testing with Vitest in a TypeScript project. It extends the base `tsconfig.json` to inherit common configurations while specifying additional settings suitable for the testing environment. Key configurations include:
  
- **noEmit**: Ensures that TypeScript does not generate JavaScript files during testing.
- **types**: Incorporates Vitest and Node.js type definitions to recognize global testing functions and Node.js APIs.
- **include**: Specifies the directories and files relevant to tests, ensuring that both source and test files are included.
- **exclude**: Omits `node_modules` to avoid unnecessary compilation of external dependencies.
  
This setup facilitates a seamless testing workflow by providing TypeScript support tailored for Vitest.
  
  
#### `qi/app/tsconfig.ts`
  
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "emitDeclarationOnly": false,
    "composite": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "references": [
    { "path": "../core" }
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifiers": true
  },
  "include": ["src/**/*.ts", "src/**/*.js"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```  
  
- **extends**: `tsconfig.json`
  - Inherits base configurations from the root `tsconfig.json`.
  
- **compilerOptions**:
  - **outDir**: `"dist"`
    - Output directory for compiled files.
  - **rootDir**: `"src"`
    - Root directory of input TypeScript files.
  - **types**: `["node"]`
    - Includes Node.js type definitions.
  - **allowJs**: `true`
    - Allows JavaScript files to be compiled.
  - **checkJs**: `false`
    - Disables type checking for JavaScript files.
  - **declaration**: `true`
    - Generates `.d.ts` declaration files.
  - **emitDeclarationOnly**: `false`
    - Emits both JavaScript and declaration files.
  - **composite**: `true`
    - Enables project references for incremental builds.
  - **module**: `"NodeNext"`
    - Uses Node.js ESM module resolution.
  - **moduleResolution**: `"NodeNext"`
    - Resolves modules using Node.js ESM.
  - **esModuleInterop**: `true`
    - Enables interoperability between CommonJS and ES Modules.
  - **resolveJsonModule**: `true`
    - Allows importing JSON modules.
  
- **references**:
  - `{ "path": "../core" }`
    - References the `core` project for composite builds.
  
- **ts-node**:
  - **esm**: `true`
    - Enables ES Module support in `ts-node`.
  - **experimentalSpecifiers**: `true`
    - Allows experimental specifier resolution.
  
- **include**:
  - `["src/**/*.ts", "src/**/*.js"]`
    - Includes all `.ts` and `.js` files in the `src` directory.
  
- **exclude**:
  - `["node_modules", "**/*.test.ts", "**/*.spec.ts"]`
    - Excludes `node_modules` and test files from compilation.
  
This `tsconfig.json` is tailored for a package within a monorepo, extending the root configuration. It supports both TypeScript and JavaScript files, generates declaration files, and uses Node.js ESM module resolution. Project references are set for efficient builds, and specific directories and test files are excluded from the compilation process.
  
### `eslint.config.js`
  
This is for `eslint 9`, for older versions, we need to use `.eslintrc.js`.
  
#### `qi/core/eslint.config.js`
  
```js
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
import nodePlugin from "eslint-plugin-node";
  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  
export default [
  js.configs.recommended,
  
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
      ...tsPlugin.configs.recommended.rules,
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
        vitest: "readonly",
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
  
  prettierConfig,
  
  {
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
  },
];
```  
  
- **File Header**:
  - **@fileoverview**: Provides a brief description of the file.
  - **@module eslint.config**: Specifies the module name.
  - **@created & @modified**: Metadata about the creation and last modification dates.
  - **Author**: `Zhifeng Zhang`.
  
- **Imports**:
  - **ESLint and Plugins**:
    - `@eslint/js`: Core ESLint configurations.
    - `@typescript-eslint/eslint-plugin`: TypeScript-specific linting rules.
    - `@typescript-eslint/parser`: Parses TypeScript code for ESLint.
    - `eslint-plugin-prettier`: Integrates Prettier with ESLint.
    - `eslint-config-prettier`: Disables ESLint rules that might conflict with Prettier.
  - **Utilities**:
    - `globals`: Provides predefined global variables for different environments.
    - `url` & `path`: Node.js modules for handling file paths.
  
- **Path Definitions**:
  - **__filename & __dirname**:
    - Defined using `fileURLToPath` and `path.dirname` since they are not available by default in ES modules.
  
- **Exported Configuration Array**:
  - **Extending Recommended Rules**:
    - `js.configs.recommended`: Inherits ESLint's recommended JavaScript rules.
  
  - **TypeScript-specific Configuration**:
    - **files**: Targets `.ts` and `.js` files in the `src` directory.
    - **ignores**: Excludes `node_modules`.
    - **languageOptions**:
      - **parser**: Uses `@typescript-eslint/parser` to parse TypeScript.
      - **parserOptions**:
        - **project**: Path to `tsconfig.json` for type information.
        - **tsconfigRootDir**: Root directory for the TypeScript configuration.
        - **ecmaVersion**: Latest ECMAScript features.
        - **sourceType**: Uses ES modules.
      - **globals**: Merges Node.js globals and sets `NodeJS` as read-only.
    - **plugins**:
      - Integrates TypeScript and Prettier plugins.
    - **rules**:
      - **Extends Recommended TypeScript Rules**:
        - Inherits rules from `@typescript-eslint` recommended configuration.
      - **Custom Rules**:
        - **no-unused-vars**: Errors on unused variables.
        - **no-unused-expressions**: Restricts unused expressions but allows short circuiting, ternaries, and tagged templates.
        - **prettier/prettier**: Enforces Prettier formatting as ESLint errors.
  
  - **Test-specific Configuration**:
    - **files**: Targets `.ts` files in the `tests` directory.
    - **languageOptions**:
      - Similar to TypeScript config but uses `tsconfig.test.json`.
      - **globals**: Adds `jest` as a global variable for testing.
    - **plugins**:
      - Integrates TypeScript and Prettier plugins for test files.
  
This `eslint.config.js` is tailored for a project using TypeScript within an ES module environment. It extends ESLint's recommended settings, integrates TypeScript-specific linting, and incorporates Prettier for code formatting. The configuration separates general source files from test files, applying appropriate parsing and global definitions to each. This setup ensures consistent code quality and styling across the codebase.
  
  
#### `qi/app/eslint.config.js`
  
```js
/**
 * @fileoverview
 * @module eslint.config
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-21
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
  
  // Prettier configuration to enforce formatting
  prettierConfig,
];
  
```  
  
##### Overview
  
This `eslint.config.js` file configures ESLint for a TypeScript project with Prettier integration. It sets up linting rules for both source and JavaScript files, ensuring code quality and consistent formatting.
  
##### Breakdown
  
1. **File Header**
   - **@fileoverview & @module**: Provides a description and module name.
   - **Author & Dates**: Metadata about the creator and modification dates.
  
2. **Imports**
   - **ESLint Core & Plugins**:
     - `@eslint/js`: Core ESLint recommended rules.
     - `@typescript-eslint/eslint-plugin`: TypeScript-specific linting rules.
     - `@typescript-eslint/parser`: Parses TypeScript code for ESLint.
     - `eslint-plugin-prettier`: Integrates Prettier with ESLint.
     - `eslint-config-prettier`: Disables ESLint rules that might conflict with Prettier.
   - **Utilities**:
     - `globals`: Provides predefined global variables for different environments.
     - `url` & `path`: Node.js modules for handling file paths.
  
3. **Path Definitions**
   - **__filename & __dirname**:
     - Defined using `fileURLToPath` and `path.dirname` to obtain file and directory names in ES modules.
  
4. **Exported Configuration Array**
   - **Extend ESLint Recommended Rules**:
     ```javascript
     js.configs.recommended,
     ```
     - Inherits ESLint's recommended JavaScript rules.
  
   - **TypeScript-specific Configuration**:
     ```javascript
     {
       files: ["src/**/*.ts", "src/**/*.js"],
       ignores: ["node_modules"],
       languageOptions: { ... },
       plugins: { ... },
       rules: { ... },
     },
     ```
     - **files**: Targets `.ts` and `.js` files within the `src` directory.
     - **ignores**: Excludes the `node_modules` directory from linting.
     - **languageOptions**:
       - **parser**: Uses `@typescript-eslint/parser` to parse TypeScript.
       - **parserOptions**:
         - **project**: Points to `tsconfig.json` for type information.
         - **tsconfigRootDir**: Sets the root directory for TypeScript configuration.
         - **ecmaVersion**: Uses the latest ECMAScript version.
         - **sourceType**: Specifies module type as ES modules.
       - **globals**: Merges Node.js globals and sets `NodeJS` as read-only.
     - **plugins**:
       - Integrates TypeScript and Prettier plugins.
     - **rules**:
       - **Extends Recommended TypeScript Rules**:
         ```javascript
         ...tsPlugin.configs.recommended.rules,
         ```
       - **Custom Rules**:
         - **no-unused-vars**: Errors on unused variables.
         - **no-unused-expressions**: Restricts unused expressions but allows certain patterns like short circuiting and ternaries.
         - **prettier/prettier**: Enforces Prettier formatting as ESLint errors.
  
   - **Prettier Configuration**
     ```javascript
     prettierConfig,
     ```
     - Applies Prettier's configuration to enforce consistent code formatting.
  
##### Summary
  
This ESLint configuration ensures that:
- **Code Quality**: By extending recommended ESLint and TypeScript rules.
- **Consistent Formatting**: Through Prettier integration.
- **Project Structure**: Targets specific directories and file types, excluding unnecessary files like those in `node_modules`.
- **Type Safety**: Utilizes TypeScript parser and plugins for robust linting in a TypeScript environment.
  
### `.prettierrc.json`
  
#### `qi/core/.prettierrc.json`
  
```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5",
  "endOfLine": "auto"
}
```  
  
#### `qi/core/.prettierrc.json`
  
```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5",
  "endOfLine": "auto"
}
```  
  
  
### `vitest.config.ts`
  
#### `qi/core/vitest.config.ts`
  
```ts
/**
 * @fileoverview
 * @module vitest.config.ts
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-21
 */
  
import { defineConfig } from "vite";
import { resolve } from "path";
  
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.ts"],
    setupFiles: ["tests/vitest.setup.ts"],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    }
  },
  resolve: {
    alias: {
      "@qi/core": resolve(__dirname, "./src"),
    },
  },
});
```  
  
##### Overview
  
This `vitest.config.ts` file configures Vitest, a Vite-native unit testing framework, for a TypeScript project. It sets up the testing environment, specifies test file patterns, integrates setup files, and defines module aliases for streamlined imports.
  
##### Breakdown
  
1. **File Header**
   - **@fileoverview & @module**: Provides a brief description and module name.
   - **Author & Dates**: Metadata about the creator and modification dates.
  
2. **Imports**
   - **defineConfig from "vite"**:
     - Utility to define and export Vite configurations.
   - **resolve from "path"**:
     - Node.js module to handle and transform file paths.
  
3. **Exported Configuration**
   - **defineConfig({...})**:
     - Wraps the configuration object to provide type checking and IntelliSense support.
  
4. **Test Configuration (`test` Section)**
   - **globals: true**
     - Enables Vitest's global APIs (e.g., `describe`, `it`, `expect`) without needing to import them in each test file.
  
   - **environment: "node"**
     - Sets the testing environment to Node.js, suitable for backend or server-side applications.
  
   - **include: ["tests/unit/**/*.{test,spec}.ts"]**
     - Specifies the glob patterns for locating test files.
     - Targets all `.test.ts` and `.spec.ts` files within the `tests/unit` directory and its subdirectories.
  
   - **setupFiles: ["tests/vitest.setup.ts"]**
     - Specifies setup files to be executed before running the tests.
     - Useful for initializing global configurations, mocks, or any setup required for tests.
  
   - **typecheck: { tsconfig: './tsconfig.test.json' }**
     - Integrates TypeScript type checking with Vitest using the specified `tsconfig.test.json`.
     - Ensures that tests adhere to the project's type definitions and configurations.
  
5. **Module Resolution (`resolve` Section)**
   - **alias: { "@qi/core": resolve(__dirname, "./src") }**
     - Defines module aliases to simplify import statements.
     - Allows importing modules using `@qi/core` instead of relative paths like `../../src`.
     - Enhances readability and maintainability of import paths.
  
#### Summary
  
- **Testing Environment**: Configured to use Node.js, making it suitable for backend development.
- **Global APIs**: Enabled for ease of writing tests without repetitive imports.
- **Test File Patterns**: Clearly defined to include all relevant test files within the `tests/unit` directory.
- **Setup Files**: Integrated to handle any necessary pre-test configurations or initializations.
- **Type Checking**: Ensured through a dedicated TypeScript configuration, maintaining type safety within tests.
- **Module Aliasing**: Simplified import paths through defined aliases, enhancing code clarity.
  
Ensure that all referenced files (e.g., `vitest.setup.ts` and `tsconfig.test.json`) exist and are correctly configured to leverage the benefits of this Vitest setup fully.
  