## shell commands
1. pandoc: `bin/pandoc`
2. xelatex: `bin/xelatex`
3. lualatex: `bin/lualatex`
4. pdflatex: `bin/pdflatex`

## Javascript and typescript
We can replace shell commands with JavaScript or TypeScript using Node.js. This approach is useful if we want the cross-platform capabilities of Node.js or need to integrate these actions into a larger JavaScript application. Here's how we can achieve this:

To execute Docker commands from JavaScript or TypeScript, we'll primarily make use of Node.js' `child_process` module to run commands as if we were executing them in the shell, while capturing output, handling errors, and passing arguments.

### Prerequisites

1. **Node.js**: Ensure Node.js is installed on the system.
2. **Docker**: Docker should be installed and accessible from the command line.

### Using JavaScript with Node.js

Here’s a basic example of how we might implement the functionality using JavaScript:

#### JavaScript Example

```javascript
const { exec } = require('child_process');

function runCommand(containerImage, command, args = []) {
    const cmd = `docker run --rm -v "${process.cwd()}:/workspace" -w /workspace ${containerImage} ${command} ${args.join(' ')}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}

// Example usage for Pandoc
function runPandoc(markdownFile, outputFile, additionalArgs = []) {
    const containerImage = 'blackgolfer/pandoc-texlive:latest';
    const command = `pandoc ${markdownFile} -o ${outputFile}`;
    runCommand(containerImage, command, additionalArgs);
}

// Example usage for XeLaTeX
function runXeLaTeX(texFile, additionalArgs = []) {
    const containerImage = 'blackgolfer/pandoc-texlive:latest';
    const command = `xelatex ${texFile}`;
    runCommand(containerImage, command, additionalArgs);
}
```

### Using TypeScript

If we prefer TypeScript for additional type safety, we can do the following:

#### TypeScript Example

1. **Setup a Node.js+TypeScript Project**: Create a Node.js project with TypeScript by running `npm init` and installing TypeScript and types for Node.js.
   ```bash
   npm init -y
   npm install typescript @types/node --save-dev
   ```

2. **Create a TypeScript Script** (e.g., `script.ts`):

```typescript
import { exec } from 'child_process';

function runCommand(containerImage: string, command: string, args: string[] = []): void {
    const cmd = `docker run --rm -v "${process.cwd()}:/workspace" -w /workspace ${containerImage} ${command} ${args.join(' ')}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}

// Example usage for Pandoc
function runPandoc(markdownFile: string, outputFile: string, additionalArgs: string[] = []): void {
    const containerImage = 'blackgolfer/pandoc-texlive:latest';
    const command = `pandoc ${markdownFile} -o ${outputFile}`;
    runCommand(containerImage, command, additionalArgs);
}

// Example usage for XeLaTeX
function runXeLaTeX(texFile: string, additionalArgs: string[] = []): void {
    const containerImage = 'blackgolfer/pandoc-texlive:latest';
    const command = `xelatex ${texFile}`;
    runCommand(containerImage, command, additionalArgs);
}

// Example calls
runPandoc('example.md', 'example.pdf');
runXeLaTeX('example.tex');
```

3. **Compile and Run**:

- First, compile the TypeScript file to JavaScript:
  ```bash
  npx tsc script.ts
  ```

- Run the compiled JavaScript file using Node.js:
  ```bash
  node script.js
  ```

### Key Considerations

- **Error Handling**: Ensure robust error handling since shells might behave differently across systems, and Docker might not be installed or running correctly.
- **Performance**: Keep in mind that spawning processes can be costly, especially if these scripts are intended to run frequently.
- **Dependencies**: Users will need both Node.js and Docker installed, which should be specified in the project’s documentation.

This approach not only brings the scripts into a more versatile and maintainable format through JavaScript or TypeScript but also ensures that they are readily integrable with other Node.js-based components of the projects.