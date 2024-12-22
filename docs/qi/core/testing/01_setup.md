# Unit Testing Tutorial - Part 1: Setup

## Introduction to Unit Testing with Vitest

Unit testing is a fundamental practice in software development that involves testing individual components of your code to ensure they work as expected. By writing unit tests, you can catch bugs early, facilitate code maintenance, and improve overall code quality.

**Vitest** is a modern and fast testing framework for JavaScript and TypeScript, designed to work seamlessly with Vite projects. It offers a rich feature set similar to Jest but optimized for performance and integration with Vite, making it an excellent choice for both frontend and backend projects.

### Benefits of Using Vitest

- **Speed:** Vitest is optimized for fast test execution, enabling rapid feedback during development.
- **Integration with Vite:** Seamlessly integrates with Vite, a build tool tailored for modern web projects.
- **Parallel Testing:** Runs tests in parallel to maximize performance.
- **Rich Feature Set:** Supports mocking, coverage reporting, and a friendly API for writing tests.

## 1. Environment Setup

Before writing and running tests, you need to set up your development environment correctly. This section guides you through installing necessary tools and configuring your project for Vitest.

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js and npm:**
  - **Node.js** is a JavaScript runtime that allows you to run JavaScript on the server side.
  - **npm (Node Package Manager)** manages project dependencies.
  - **Installation:**
    - Download from the [Node.js official website](https://nodejs.org/) and follow the installation instructions for your operating system.
    - Verify installation by running:
      ```bash
      node -v
      npm -v
      ```
- **Code Editor:**
  - [Visual Studio Code (VS Code)](https://code.visualstudio.com/) is highly recommended for its robust support for TypeScript and Vitest integrations.

### Step-by-Step Setup

Follow these steps to set up your project with Vitest:

#### 1. Initialize Your Project Directory

Create a new directory for your project and navigate into it.

```bash
mkdir my-project
cd my-project
```

#### 2. Initialize npm

Initialize a new npm project. This creates a 

package.json

 file to manage your project's dependencies and scripts.

```bash
npm init -y
```

- **`-y` Flag:** Automatically accepts default configurations. You can customize 

package.json

 later as needed.

#### 3. Install Development Dependencies

Install Vitest, TypeScript, and Node type definitions as development dependencies.

```bash
npm install -D vitest @types/node typescript
```

- **`vitest`:** The testing framework.
- **`@types/node`:** Type definitions for Node.js, essential for TypeScript projects.
- **`typescript`:** Adds TypeScript support to your project.

#### 4. Initialize TypeScript Configuration

If you plan to use TypeScript (recommended for better type safety), initialize a `tsconfig.json` file.

```bash
npx tsc --init
```

This command generates a default `tsconfig.json`. You can modify it to suit your project's needs. Here's a basic configuration:

```jsonc
// filepath: tsconfig.json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src", "tests"]
}
```

- **`target`:** Specifies the ECMAScript target version.
- **`module`:** Defines the module system (`ESNext` for modern JavaScript modules).
- **`strict`:** Enables strict type-checking options.
- **`esModuleInterop`:** Allows compatibility between CommonJS and ES Modules.
- **`outDir`:** Directory for compiled JavaScript files.
- **`rootDir`:** Root directory of your source files.
- **`include`:** Specifies directories to include in the compilation.

## 2. Project Structure

A well-organized project structure enhances maintainability and scalability. Here's a recommended layout:

```bash
.
├── src/
│   └── utils/
│       └── index.ts
├── tests/
│   └── unit/
│       └── utils.test.ts
├── .vscode/
│   └── settings.json
├── package.json
├── vitest.config.ts
└── tsconfig.json
```

### Directory Breakdown

- **`src/`:** Contains your source code.
  - **`utils/`:** A sample utility module.
    - **`index.ts`:** The utility functions you want to test.
- **`tests/`:** Contains all your test files.
  - **`unit/`:** Unit tests for individual modules.
    - **`utils.test.ts`:** Unit tests for the `utils` module.
- **`.vscode/`:** VS Code-specific configurations.
  - **`settings.json`:** Configuration settings for Vitest integration.
- **`package.json`:** Manages project dependencies and scripts.
- **`vitest.config.ts`:** Configuration file for Vitest.
- **`tsconfig.json`:** TypeScript configuration file.

### Creating the Project Structure

You can create the necessary directories and files using the following commands:

```bash
mkdir -p src/utils
mkdir -p tests/unit
mkdir -p .vscode
touch src/utils/index.ts
touch tests/unit/utils.test.ts
touch vitest.config.ts
touch .vscode/settings.json
```

## 3. Basic Configuration

Proper configuration ensures that Vitest operates correctly within your project. This section guides you through setting up `vitest.config.ts`.

### vitest.config.ts

Create and configure the `vitest.config.ts` file to tailor Vitest to your project's needs.

```typescript
// filepath: vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // Allows using global test functions like describe and it without importing them
    environment: 'node', // Sets the testing environment to Node.js
    coverage: {
      provider: 'c8', // Uses 'c8' for coverage reporting
      reporter: ['text', 'html'], // Generates text and HTML coverage reports
      include: ['src/**/*.ts'], // Include source files for coverage
      exclude: ['tests/**', 'node_modules/**'], // Exclude test and dependency files
    },
    coverageDirectory: 'coverage', // Directory to store coverage reports
  },
})
```

#### Configuration Breakdown

- **`globals`:** When set to `true`, you don't need to import `describe`, `it`, and `expect` in every test file.
- **`environment`:** Specifies the environment in which the tests run. `'node'` is suitable for backend projects, while `'jsdom'` can be used for frontend testing.
- **`coverage`:** Configures code coverage reporting.
  - **`provider`:** `c8` is a coverage tool integrated with Vitest.
  - **`reporter`:** Specifies the format of coverage reports. `text` outputs to the console, and `html` generates a detailed HTML report.
  - **`include`:** Defines which files to include in coverage reporting.
  - **`exclude`:** Defines which files or directories to exclude from coverage.
- **`coverageDirectory`:** Specifies where to save the coverage reports.

### 

package.json

 Scripts

Adding scripts to your 

package.json

 simplifies running tests and generating coverage reports.

```jsonc
// filepath: package.json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

- **`test`:** Runs all your tests once.
- **`test:watch`:** Runs tests in watch mode, re-running them on file changes.
- **`test:coverage`:** Runs tests and generates a code coverage report.

## 4. First Test File

Creating your first test ensures that your setup is correct and that Vitest is functioning as expected. This section walks you through writing a basic test.

### Writing a Basic Test

Create a simple utility function and write a corresponding test.

#### src/utils/index.ts

```typescript
// filepath: src/utils/index.ts
export function add(a: number, b: number): number {
  return a + b
}
```

#### tests/unit/utils.test.ts

```typescript
// filepath: tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest'
import { add } from '../../src/utils'

describe('add Function', () => {
  it('should correctly add two numbers', () => {
    const result = add(2, 3)
    expect(result).toBe(5)
  })

  it('should handle adding negative numbers', () => {
    const result = add(-2, -3)
    expect(result).toBe(-5)
  })

  it('should return the same number when adding zero', () => {
    const result = add(5, 0)
    expect(result).toBe(5)
  })
})
```

### Understanding the Test

- **`describe`:** Groups related tests. Here, it's grouping all tests related to the `add` function.
- **`it`:** Defines an individual test case with a description of what it's testing.
- **`expect`:** Asserts that a value meets certain conditions.

### Running the Test

Execute the following command to run your tests:

```bash
npm run test
```

**Expected Output:**

```
 PASS  tests/unit/utils.test.ts
  add Function
    ✓ should correctly add two numbers (2ms)
    ✓ should handle adding negative numbers
    ✓ should return the same number when adding zero

Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  10:00:00 AM
   Duration  100ms
```

This output indicates that all tests have passed successfully.

### Interpreting Test Results

- **PASS:** Indicates that the test has passed.
- **FAIL:** Indicates that the test has failed, along with error messages and stack traces to help identify issues.
- **Coverage Report:** If you run `npm run test:coverage`, Vitest generates a coverage report showing which parts of your code are covered by tests.

## 5. Running Tests

Executing and managing your tests is straightforward with npm scripts. This section explains how to run tests, watch for changes, and generate coverage reports.

### Adding Test Scripts

Ensure your 

package.json

 includes the following scripts:

```jsonc
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Executing Tests

#### Run All Tests

To run all tests once, execute:

```bash
npm run test
```

#### Watch Mode

To run tests in watch mode, automatically re-running tests when files change:

```bash
npm run test:watch
```

**Benefits of Watch Mode:**

- Provides immediate feedback as you develop.
- Automatically detects changes and re-runs relevant tests.
- Enhances productivity by reducing manual test execution.

#### Running Coverage Reports

To generate code coverage reports, execute:

```bash
npm run test:coverage
```

**Coverage Reports:**

- **Text Report:** Displays coverage statistics in the terminal.
- **HTML Report:** Generates a detailed, browsable report in the `coverage` directory.

**Viewing the HTML Report:**

1. Navigate to the `coverage` directory:
   ```bash
   cd coverage
   ```
2. Open the `index.html` file in your browser to view detailed coverage information.

### Interpreting Coverage Reports

Coverage reports help you understand which parts of your code are tested and which aren't. Key metrics include:

- **Statements:** Percentage of executable statements tested.
- **Branches:** Percentage of control flow branches (e.g., `if` statements) tested.
- **Functions:** Percentage of functions tested.
- **Lines:** Percentage of code lines tested.

Aim for high coverage, but focus on meaningful tests that cover critical paths and edge cases.

## 6. VS Code Integration

Integrating Vitest with Visual Studio Code enhances your testing workflow by providing seamless test execution, debugging, and inline results.

### Configuring VS Code Settings

Create or open the `.vscode/settings.json` file in your project and add the following configurations:

```jsonc
// filepath: .vscode/settings.json
{
  "vitest.enable": true, // Enables Vitest extension features
  "vitest.commandLine": "npm run test", // Command to run tests
  "typescript.tsdk": "node_modules/typescript/lib" // Points to the TypeScript SDK in your project
}
```

#### Configuration Breakdown

- **`vitest.enable`:** Activates Vitest extension features within VS Code.
- **`vitest.commandLine`:** Specifies the command Vitest should run to execute tests.
- **`typescript.tsdk`:** Ensures VS Code uses the TypeScript version installed in your project, avoiding conflicts with globally installed versions.

### Benefits of Integration

- **Test Explorer:**
  - View and run tests directly from the VS Code interface.
  - Organize tests hierarchically for better visibility.
- **Inline Test Results:**
  - See test results and coverage information within the editor.
  - Quickly identify passing and failing tests.
- **Debugging:**
  - Easily set breakpoints and debug tests using VS Code's debugging tools.
  - Inspect variables and call stacks during test execution.

### Installing Vitest Extension

For enhanced functionality, consider installing the [Vitest Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=your-extension).

1. **Open VS Code.**
2. **Go to the Extensions view:**
   - Click the Extensions icon in the Activity Bar on the side of VS Code.
   - Or press `Ctrl+Shift+X`.
3. **Search for "Vitest" and select the official extension.**
4. **Click "Install."**
5. **Reload VS Code if prompted.**

### Using the Vitest Extension

- **Running Tests:**
  - Use the Test Explorer panel to run all tests or individual test suites.
- **Viewing Results:**
  - Inline results appear next to your test code.
  - Hover over test functions to see status indicators.
- **Debugging Tests:**
  - Right-click on a test and select "Debug Test" to start a debugging session.
  - Use breakpoints and VS Code's debugging tools to inspect test execution.

## 7. Additional Tips

### TypeScript Support

If you're using TypeScript, ensure your `tsconfig.json` is correctly configured to work with Vitest and your project structure.

```jsonc
// filepath: tsconfig.json
{
  "compilerOptions": {
    // ...previous configurations...
    "types": ["vitest/globals"], // Adds Vitest global types
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src", "tests"]
}
```

- **`types`:** Includes Vitest's global types, allowing you to use `describe`, `it`, and `expect` without explicit imports.

### Watch Mode

Vitest supports watch mode out of the box. To start watching for file changes and automatically re-running tests, use:

```bash
npm run test:watch
```

**Usage Tips:**

- **Focused Testing:** Use `test.only` or `it.only` to run specific tests while in watch mode.
- **Skipping Tests:** Use `test.skip` or `it.skip` to exclude certain tests temporarily.

### Documentation and Community Resources

- **Vitest Documentation:** Refer to the [Vitest Documentation](https://vitest.dev/) for comprehensive guides, API references, and advanced configurations.
- **Community Forums:** Engage with the Vitest community through forums, GitHub issues, and discussion boards for support and best practices.
- **Tutorials and Articles:** Explore additional tutorials and articles to deepen your understanding of Vitest and unit testing principles.

### Best Practices

- **Write Descriptive Test Names:** Clearly describe what each test is verifying to enhance readability.
- **Keep Tests Isolated:** Ensure tests do not depend on each other and can run independently.
- **Mock External Dependencies:** Use mocking to isolate the unit of code being tested, avoiding reliance on external systems.
- **Maintain High Coverage:** Strive for high code coverage but focus on testing critical and complex parts of your codebase.
- **Regularly Run Tests:** Incorporate test running into your development workflow to catch issues early.

## 8. Troubleshooting Common Setup Issues

Encountering issues during setup is common. Here are solutions to some frequent problems:

### Issue 1: Tests Not Recognized

**Symptom:** Vitest doesn't detect your test files.

**Solution:**

- Ensure your test files follow the naming convention (e.g., `.test.ts` or `.spec.ts`).
- Verify the `include` path in `tsconfig.json` covers your test directories.
- Check the `vitest.config.ts` for correct configuration settings.

### Issue 2: Type Errors in Tests

**Symptom:** TypeScript raises errors in your test files.

**Solution:**

- Ensure `@types/node` and `vitest` types are installed.
- Add `"types": ["vitest/globals"]` to your `tsconfig.json`.
- Restart your TypeScript server in VS Code if issues persist.

### Issue 3: Mocking Not Working as Expected

**Symptom:** Mocked functions don't behave as intended.

**Solution:**

- Verify that mocks are set up before importing the modules that use them.
- Use `vi.resetAllMocks()` in `beforeEach` to clear previous mock states.
- Ensure the mock implementation matches the expected function signatures.

### Issue 4: Coverage Reports Incomplete

**Symptom:** Coverage reports miss certain files or lines.

**Solution:**

- Check the `include` and `exclude` settings in `vitest.config.ts`.
- Ensure all relevant source files are within the included directories.
- Verify that your tests execute all critical paths in your code.

### Seeking Help

If you encounter issues not covered here:

- **Check Documentation:** Revisit the [Vitest Documentation](https://vitest.dev/) for detailed guides.
- **Community Support:** Ask questions on forums or GitHub repositories related to Vitest.
- **Review Configuration:** Double-check your configuration files for any discrepancies.

---

### Recap of Steps

1. **Environment Setup:** Installed necessary tools including Vitest, TypeScript, and Node type definitions.
2. **Project Structure:** Organized your project directories for clarity and scalability.
3. **Basic Configuration:** Configured Vitest with essential settings to tailor it to your project's needs.
4. **First Test File:** Wrote and ran your first simple test to verify the setup.
5. **Running Tests:** Learned how to execute tests, use watch mode, and generate coverage reports.
6. **VS Code Integration:** Enhanced your development workflow by integrating Vitest with Visual Studio Code for seamless testing and debugging.
7. **Troubleshooting:** Addressed common setup issues to ensure a smooth testing experience.

**Additional Resources:**

- [Vitest Official Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Visual Studio Code Documentation](https://code.visualstudio.com/docs)
