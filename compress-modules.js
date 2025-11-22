const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createReadStream, createWriteStream } = fs;

// Simple tar-like compression tanpa dependencies
console.log('🔄 Compressing node_modules...');

const archiver = require('archiver');
const output = fs.createWriteStream('node_modules.zip');
const archive = archiver('zip', { zlib: { level: 6 } });

output.on('close', () => {
  const size = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Done! Size: ${size} MB`);
  console.log(`📦 File: node_modules.zip`);
});

archive.on('error', (err) => {
  console.error('❌ Error:', err);
});

archive.pipe(output);
archive.directory('node_modules/', 'node_modules');
archive.finalize();
