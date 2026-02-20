const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputFilePath = path.join(rootDir, 'full_project_code.txt');

// Custom skip settings
const skipDirs = [
  '.git',
  '.next',
  'node_modules',
  '.gemini',
  'public',
  'consolidate.js',
  'full_project_code.txt',
  '.env',
  '.env.local',
  'package-lock.json'
];

const skipFiles = [
  'full_project_code.txt',
  'consolidate.js'
];

let fullCode = '';

function traverseDir(currDir) {
  const files = fs.readdirSync(currDir);

  files.forEach(file => {
    const filePath = path.join(currDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (!skipDirs.includes(file)) {
        traverseDir(filePath);
      }
    } else {
      if (!skipFiles.includes(file)) {
        const relativePath = path.relative(rootDir, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        fullCode += `\n\n--- FILE: ${relativePath} ---\n\n${content}`;
      }
    }
  });
}

try {
  console.log('Consolidating code...');
  traverseDir(rootDir);
  fs.writeFileSync(outputFilePath, fullCode, 'utf8');
  console.log(`Success! All code consolidated into ${outputFilePath}`);
} catch (err) {
  console.error('Error during consolidation:', err);
}
