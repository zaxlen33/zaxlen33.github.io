const fs = require('fs');
const path = require('path');

const targetDir = __dirname;

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Rename variables
  content = content.replace(/--accent-cyan-rgb/g, '--accent-cyan-rgb');
  content = content.replace(/--accent-cyan/g, '--accent-cyan');
  
  // 2. Replace the static hex fallbacks in JS files
  content = content.replace(/#06b6d4/gi, '#06b6d4');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.css') || fullPath.endsWith('.js') || fullPath.endsWith('.html') || fullPath.endsWith('.md')) {
        replaceInFile(fullPath);
      }
    }
  }
}

walkDir(targetDir);

// Now update the specific definitions in styles.css
const stylesPath = path.join(targetDir, 'css', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

// For dark mode (which used to be #06b6d4 but might be already replaced by the regex to #06b6d4)
stylesContent = stylesContent.replace(/--accent-cyan:\s*#06b6d4;/g, '--accent-cyan: #06b6d4;');
stylesContent = stylesContent.replace(/--accent-cyan-rgb:\s*88,\s*166,\s*255;/g, '--accent-cyan-rgb: 6, 182, 212;');

// For light mode
stylesContent = stylesContent.replace(/--accent-cyan:\s*#0969da;/g, '--accent-cyan: #0891b2;');
stylesContent = stylesContent.replace(/--accent-cyan-rgb:\s*9,\s*105,\s*218;/g, '--accent-cyan-rgb: 8, 145, 178;');

fs.writeFileSync(stylesPath, stylesContent, 'utf8');
console.log('Fixed values in styles.css');
