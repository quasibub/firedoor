const fs = require('fs');
const path = require('path');

// Ensure dist/config directory exists
const distConfigDir = path.join(__dirname, '..', 'dist', 'config');
if (!fs.existsSync(distConfigDir)) {
  fs.mkdirSync(distConfigDir, { recursive: true });
}

// Copy all SQL files from src/config to dist/config
const srcConfigDir = path.join(__dirname, '..', 'src', 'config');
const sqlFiles = fs.readdirSync(srcConfigDir).filter(file => file.endsWith('.sql'));

console.log('Copying SQL files to dist/config...');
sqlFiles.forEach(file => {
  const srcPath = path.join(srcConfigDir, file);
  const destPath = path.join(distConfigDir, file);
  fs.copyFileSync(srcPath, destPath);
  console.log(`✓ Copied ${file}`);
});

console.log(`\nCopied ${sqlFiles.length} SQL files successfully!`);

