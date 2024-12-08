/**
 * @fileoverview
 * @module generateDoc.v1
 *
 * @author zhifengzhang-sz
 * @created 2024-12-08
 * @modified 2024-12-08
 */

const fs = require('fs');
const path = require('path');

const projectDir = '../../../qi/core/src'; // Adjust the source directory
const outputFile = 'qi.core.base.md';

const excludeDirs = ['cli', 'data']; // Directories to skip

/**
 * Recursively traverses the directory and generates markdown sections.
 * @param {string} dir - Current directory path.
 * @param {number} depth - Current depth for heading levels.
 * @param {string} relativePath - Relative path from the project root.
 * @returns {string} - Generated markdown content.
 */
function generateMarkdown(dir, depth = 2, relativePath = '') {
  let markdown = '';
  const items = fs.readdirSync(dir, { withFileTypes: true }).sort();

  items.forEach(item => {
    const itemPath = path.join(dir, item.name);
    const itemRelativePath = path.join(relativePath, item.name);

    if (item.isDirectory()) {
      if (excludeDirs.includes(item.name.toLowerCase())) {
        return; // Skip excluded directories
      }
      const heading = '#'.repeat(depth) + ` ${item.name}\n\n`;
      markdown += heading;
      markdown += generateMarkdown(itemPath, depth + 1, itemRelativePath);
    } else if (item.isFile() && item.name.endsWith('.ts')) {
      const code = fs.readFileSync(itemPath, 'utf-8');
      const fileHeading = '#'.repeat(depth + 1) + ` ${item.name}\n\n`;
      markdown += fileHeading;
      markdown += '```typescript\n';
      markdown += `${code}\n`;
      markdown += '```\n\n';
    }
  });

  return markdown;
}

let markdownContent = '# Project Source Code Documentation\n\n';
markdownContent += generateMarkdown(projectDir);

fs.writeFileSync(outputFile, markdownContent, 'utf-8');
console.log(`Documentation generated in ${outputFile}`);