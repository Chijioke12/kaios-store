import fs from 'fs';
import path from 'path';

// Get source and output paths from command-line arguments or use defaults
const sourceFile = process.argv[2] || 'apphub.html';
const outputFile = process.argv[3] || 'apphub.js';

const sourcePath = path.resolve(sourceFile);
const outputPath = path.resolve(outputFile);

console.log(`Starting extraction:
- Source: ${sourcePath}
- Output: ${outputPath}
`);

try {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file not found at ${sourcePath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(sourcePath, 'utf8');

  // Regex to match inline script contents
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const scriptBlocks = [];
  let match;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const inlineCode = match[1].trim();
    if (inlineCode) {
      scriptBlocks.push(inlineCode);
    }
  }

  if (scriptBlocks.length === 0) {
    console.error('Extraction failed: No inline <script> tags with code found in the source HTML file.');
    process.exit(1);
  }

  // Combine extracted script blocks with clear separation
  const extractedCode = scriptBlocks.join('\n\n// ==========================================\n// NEXT SCRIPT BLOCK\n// ==========================================\n\n');

  // Verify parent folder exists
  const parentDir = path.dirname(outputPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, extractedCode, 'utf8');
  console.log(`Successfully extracted ${scriptBlocks.length} script block(s)!`);
  console.log(`Result saved to file: ${outputPath}`);
} catch (err) {
  console.error(`Extraction failed due to an error: ${err.message}`);
  process.exit(1);
}
