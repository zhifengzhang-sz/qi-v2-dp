1. First, let's create a better pre-commit hook that checks for existing headers and only updates dates:



```bash
#!/bin/bash

# Function to process file headers
process_file_header() {
    local file=$1
    local author_name=$(git config user.name)
    local current_date=$(date +"%Y-%m-%d")
    local temp_file=$(mktemp)
    
    # Check if file already has a header
    if grep -q "@fileoverview" "$file"; then
        # Update modified date if it exists, otherwise add it
        if grep -q "@modified" "$file"; then
            sed "s|@modified .*|@modified $current_date|" "$file" > "$temp_file"
        else
            sed "/@author/a\ * @modified $current_date" "$file" > "$temp_file"
        fi
    else
        # Add new header if none exists
        cat > "$temp_file" << EOF
/**
 * @fileoverview
 * @module $(basename "$file" .js)
 *
 * @author $author_name
 * @created $(date +"%Y-%m-%d")
 * @modified $(date +"%Y-%m-%d")
 */

EOF
        cat "$file" >> "$temp_file"
    fi
    
    mv "$temp_file" "$file"
    git add "$file"
}

# Process each staged JavaScript/TypeScript file
for file in $(git diff --cached --name-only | grep -E '\.(js|ts)$'); do
    if [ -f "$file" ]; then
        process_file_header "$file"
    fi
done

```

2. Now, let's create a comprehensive documentation template for the configuration system:





# File Documentation Templates

## For Main Module Files (index.ts)
```typescript
/**
 * @fileoverview Configuration management system providing type-safe, schema-validated
 * configuration handling with support for multiple sources and caching.
 * @module @qi/core/config
 *
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 */
```

## For Schema Files (Schema.ts)
```typescript
/**
 * @fileoverview Schema validation implementation using AJV with support for
 * JSON Schema validation, custom formats, and runtime type checking.
 * @module @qi/core/config/schema
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 * 
 * @example
 * ```typescript
 * const schema = new Schema({ formats: true });
 * schema.registerSchema('config', {
 *   type: 'object',
 *   properties: {
 *     port: { type: 'number' }
 *   }
 * });
 * ```
 */
```

## For Loader Files (JsonLoader.ts, EnvLoader.ts)
```typescript
/**
 * @fileoverview Configuration loader implementation for [JSON/ENV] files with
 * support for file watching, validation, and change detection.
 * @module @qi/core/config/loaders
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 * 
 * @example
 * ```typescript
 * const loader = new JsonLoader(
 *   'config.json',
 *   schema,
 *   'config-schema'
 * );
 * const config = await loader.load();
 * ```
 */
```

## For Cache Files (ConfigCache.ts)
```typescript
/**
 * @fileoverview Configuration cache implementation with TTL support,
 * refresh policies, and cache invalidation strategies.
 * @module @qi/core/config/cache
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 * 
 * @example
 * ```typescript
 * const cache = new ConfigCache({
 *   ttl: 60000,
 *   refreshOnAccess: true
 * });
 * ```
 */
```

## For Interface Files (IConfig.ts)
```typescript
/**
 * @fileoverview Core interfaces for the configuration system defining
 * contracts for loaders, validators, and cache implementations.
 * @module @qi/core/config/interfaces
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 */
```

## For Type Files (types.ts)
```typescript
/**
 * @fileoverview Type definitions for configuration system including
 * configuration objects, schema types, and supporting types.
 * @module @qi/core/config/types
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 */
```

## For Error Files (errors.ts)
```typescript
/**
 * @fileoverview Error definitions for the configuration system with
 * typed error codes and detailed error context.
 * @module @qi/core/config/errors
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Modified Date]
 */
```

## Documentation Best Practices

1. Always include:
   - File overview (@fileoverview)
   - Module path (@module)
   - Author (@author)
   - Creation date (@created)
   - Last modified date (@modified)

2. When appropriate, add:
   - Examples (@example)
   - Parameters (@param)
   - Return values (@returns)
   - Throws clauses (@throws)
   - Type information (@type, @typedef)
   - Dependencies (@requires)

3. For complex functions/classes:
   - Document public methods
   - Explain parameters and return types
   - Provide usage examples
   - Document errors that may be thrown


To make this easier to use in VS Code:

1. Install the "Document This" extension for VS Code
2. Create custom snippets for your documentation templates
3. Create a VS Code workspace setting:

```json
{
  "javascript.suggest.jsdoc.generateReturns": true,
  "typescript.suggest.jsdoc.generateReturns": true,
  "docthis.includeTypes": true,
  "docthis.includeDescriptionTag": true,
  "docthis.includeMemberOfOnClassMembers": true,
  "docthis.includeAuthorTag": true,
  "docthis.authorName": "${GIT_USER_NAME}",
  // Custom snippets
  "editor.snippets": {
    "qi-file-header": {
      "scope": "typescript,javascript",
      "prefix": "qihead",
      "body": [
        "/**",
        " * @fileoverview $1",
        " * @module @qi/core/$2",
        " *",
        " * @author ${GIT_USER_NAME}",
        " * @created ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
        " * @modified ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
        " */\n"
      ]
    }
  }
}

```

This setup will:
1. Use the pre-commit hook to maintain file headers
2. Provide consistent documentation templates
3. Make it easy to add documentation through VS Code
4. Automatically track modifications

Would you like me to:
1. Provide more specific documentation examples for any of your files?
2. Explain how to set up additional VS Code automation?
3. Show how to implement custom documentation checks?


I'll create a custom documentation checker that can be integrated into your workflow. This will help enforce documentation standards and can be run as part of CI/CD or pre-commit checks.



```typescript
/**
 * @fileoverview Documentation checker for enforcing documentation standards
 * @module @qi/core/tools/doc-checker
 */

import { parse as parseComment } from 'comment-parser';
import { readFileSync, existsSync } from 'fs';
import glob from 'glob';
import path from 'path';
import { logger } from '@qi/core/logger';

interface DocCheckOptions {
  // Required tags that must be present
  requiredTags: string[];
  // Optional tags that may be present
  optionalTags?: string[];
  // Minimum description length
  minDescriptionLength?: number;
  // Files to exclude
  exclude?: string[];
  // Custom validators
  validators?: DocValidator[];
}

interface DocValidator {
  name: string;
  validate: (comment: ParsedComment) => DocValidationResult;
}

interface DocValidationResult {
  valid: boolean;
  message?: string;
}

interface ParsedComment {
  description: string;
  tags: {
    tag: string;
    name: string;
    description: string;
  }[];
}

class DocumentationChecker {
  private readonly defaultOptions: DocCheckOptions = {
    requiredTags: ['fileoverview', 'module', 'author', 'created', 'modified'],
    optionalTags: ['example', 'typedef', 'param', 'returns'],
    minDescriptionLength: 10,
    exclude: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    validators: []
  };

  constructor(private options: DocCheckOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Run documentation checks on specified files
   */
  async checkDocumentation(pattern: string): Promise<boolean> {
    const files = await this.getFiles(pattern);
    let success = true;

    for (const file of files) {
      const result = this.checkFile(file);
      if (!result.valid) {
        success = false;
        logger.error(`Documentation issues in ${file}:`, {
          message: result.message
        });
      }
    }

    return success;
  }

  /**
   * Check a single file for documentation issues
   */
  private checkFile(filePath: string): DocValidationResult {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const fileComment = this.extractFileComment(content);

      if (!fileComment) {
        return {
          valid: false,
          message: 'No file-level documentation found'
        };
      }

      // Check required tags
      const missingTags = this.checkRequiredTags(fileComment);
      if (missingTags.length > 0) {
        return {
          valid: false,
          message: `Missing required tags: ${missingTags.join(', ')}`
        };
      }

      // Check description length
      if (fileComment.description.length < this.options.minDescriptionLength!) {
        return {
          valid: false,
          message: `Description too short (${fileComment.description.length} chars)`
        };
      }

      // Run custom validators
      for (const validator of this.options.validators || []) {
        const result = validator.validate(fileComment);
        if (!result.valid) {
          return {
            valid: false,
            message: `${validator.name}: ${result.message}`
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Error processing file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Extract the first JSDoc comment from file content
   */
  private extractFileComment(content: string): ParsedComment | null {
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (!commentMatch) return null;

    const parsed = parseComment(commentMatch[0])[0];
    return {
      description: parsed.description,
      tags: parsed.tags.map(tag => ({
        tag: tag.tag,
        name: tag.name,
        description: tag.description
      }))
    };
  }

  /**
   * Check if all required tags are present
   */
  private checkRequiredTags(comment: ParsedComment): string[] {
    const presentTags = new Set(comment.tags.map(t => t.tag));
    return this.options.requiredTags.filter(tag => !presentTags.has(tag));
  }

  private async getFiles(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob(pattern, {
        ignore: this.options.exclude,
        absolute: true
      }, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }
}

// Example custom validators
const customValidators: DocValidator[] = [
  {
    name: 'ModulePathValidator',
    validate: (comment: ParsedComment) => {
      const moduleTag = comment.tags.find(t => t.tag === 'module');
      if (!moduleTag?.description.startsWith('@qi/')) {
        return {
          valid: false,
          message: 'Module path must start with @qi/'
        };
      }
      return { valid: true };
    }
  },
  {
    name: 'ExampleValidator',
    validate: (comment: ParsedComment) => {
      const hasExample = comment.tags.some(t => t.tag === 'example');
      if (!hasExample) {
        return {
          valid: false,
          message: 'Missing example in documentation'
        };
      }
      return { valid: true };
    }
  }
];

export const createChecker = (options?: Partial<DocCheckOptions>) => {
  return new DocumentationChecker({
    ...options,
    validators: [...(options?.validators || []), ...customValidators]
  });
};

// Usage example:
/*
const checker = createChecker({
  minDescriptionLength: 20,
  exclude: ['**/dist/**', '**/node_modules/**']
});

const isValid = await checker.checkDocumentation('src/**/*.ts');
if (!isValid) {
  process.exit(1);
}
*/

```

Now, let's create a CLI tool to run these checks:

```typescript
/**
 * @fileoverview CLI tool for running documentation checks
 * @module @qi/core/tools/doc-checker-cli
 */

import { Command } from 'commander';
import { createChecker } from './doc-checker';
import { logger } from '@qi/core/logger';
import path from 'path';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

interface CliConfig {
  include: string[];
  exclude?: string[];
  minDescriptionLength?: number;
  requiredTags?: string[];
  optionalTags?: string[];
}

const program = new Command();

program
  .name('qi-doc-check')
  .description('QI Documentation Standards Checker')
  .version('1.0.0')
  .option('-c, --config <path>', 'Path to config file')
  .option('-f, --fix', 'Attempt to fix documentation issues')
  .option('-p, --pattern <pattern>', 'File pattern to check')
  .option('-e, --exclude <pattern>', 'Pattern to exclude')
  .action(async (options) => {
    try {
      let config: CliConfig;

      // Load config file if provided
      if (options.config) {
        const configPath = path.resolve(process.cwd(), options.config);
        const configContent = readFileSync(configPath, 'utf-8');
        config = yaml.load(configContent) as CliConfig;
      } else {
        config = {
          include: [options.pattern || 'src/**/*.ts'],
          exclude: options.exclude ? [options.exclude] : undefined
        };
      }

      const checker = createChecker({
        exclude: config.exclude,
        minDescriptionLength: config.minDescriptionLength,
        requiredTags: config.requiredTags
      });

      let success = true;
      for (const pattern of config.include) {
        const result = await checker.checkDocumentation(pattern);
        if (!result) {
          success = false;
        }
      }

      if (!success) {
        logger.error('Documentation check failed');
        process.exit(1);
      }

      logger.info('Documentation check passed');
    } catch (error) {
      logger.error('Error running documentation check', {
        error: error instanceof Error ? error.message : String(error)
      });
      process.exit(1);
    }
  });

program.parse();

```

And finally, a configuration file for the documentation checker:

```yaml
# doc-check.yaml
---
# Patterns to include in documentation check
include:
  - "src/**/*.ts"
  - "src/**/*.js"

# Patterns to exclude
exclude:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/generated/**"

# Minimum length for file descriptions
minDescriptionLength: 20

# Required documentation tags
requiredTags:
  - fileoverview
  - module
  - author
  - created
  - modified

# Optional but recommended tags
optionalTags:
  - example
  - typedef
  - param
  - returns
  - throws
  - see
  - since

# Custom validation rules
rules:
  modulePrefix: "@qi/"
  requireExample: true
  requireDescription: true

```

To use this documentation checker:

1. Install as a development dependency:
```bash
npm install --save-dev @qi/doc-checker
```

2. Add to your package.json scripts:
```json
{
  "scripts": {
    "doc:check": "qi-doc-check --config doc-check.yaml",
    "doc:check:fix": "qi-doc-check --config doc-check.yaml --fix"
  }
}
```

3. Add to your pre-commit hook or CI pipeline:
```bash
#!/bin/bash
# Pre-commit hook
npm run doc:check || exit 1
```

4. Run manually:
```bash
npm run doc:check
```

The checker will:
1. Validate file-level documentation
2. Ensure required tags are present
3. Check description lengths
4. Validate module paths
5. Check for examples
6. Report any issues found

Would you like me to:
1. Add more custom validators?
2. Show how to integrate this with specific CI/CD platforms?
3. Add automatic fixing capabilities?