/**
 * @fileoverview
 * @module generateDoc
 *
 * @author zhifengzhang-sz
 * @created 2024-12-08
 * @modified 2025-01-02
 */

const fs = require('fs');
const path = require('path');

// Get root directory and output file from command-line arguments or use defaults
const projectDir = process.argv[2] || './src';
const outputFile = process.argv[3] || 'PROJECT_DOCUMENTATION.md';
const excludeDirs = ['cli', 'data', 'networks']; // Directories to skip

/**
 * Recursively traverses the directory and generates markdown sections.
 * @param {string} dir - Current directory path.
 * @param {number} currentDepth - Current depth for heading levels.
 * @returns {string} - Generated markdown content.
 */
function generateMarkdown(dir, currentDepth = 2) {
  let markdown = '';
  let items;

  try {
    items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    return markdown;
  }

  // Separate directories and files
  const directories = items.filter(item => item.isDirectory());
  const files = items.filter(item => item.isFile() && item.name.endsWith('.ts'));

  if (directories.length > 0 || files.length > 0) {
    // Add directory as a heading at current depth
    const dirName = path.basename(dir);
    markdown += `${'#'.repeat(currentDepth)} ${dirName}\n\n`;
  }

  // Process files at current depth + 1
  files.forEach((item) => {
    const itemPath = path.join(dir, item.name);
    let code;
    try {
      code = fs.readFileSync(itemPath, 'utf-8');
    } catch (err) {
      console.error(`Error reading file ${itemPath}:`, err);
      return;
    }
    // Add file name as a heading (one level deeper than directory)
    markdown += `${'#'.repeat(currentDepth + 1)} ${item.name}\n\n`;
    // Add code block
    markdown += '```typescript\n';
    markdown += code;
    markdown += '\n```\n\n';
  });

  // Recursively process subdirectories
  directories.forEach((item) => {
    if (excludeDirs.includes(item.name.toLowerCase())) {
      return; // Skip excluded directories
    }
    const itemPath = path.join(dir, item.name);
    // Recursively generate markdown for the subdirectory with increased depth
    markdown += generateMarkdown(itemPath, currentDepth + 1);
  });

  return markdown;
}

// Initialize markdown content with the main title
let markdownContent = '# Project Source Code Documentation\n\n';

// Generate markdown content starting from the root directory
markdownContent += generateMarkdown(projectDir);

// Write the generated markdown to the output file
try {
  fs.writeFileSync(outputFile, markdownContent, 'utf-8');
  console.log(`Documentation successfully generated in ${outputFile}`);
} catch (err) {
  console.error(`Error writing to file ${outputFile}:`, err);
}