const fs = require('fs');
const path = require('path');

// Path to the external .env.local file (in the root directory)
const externalEnvPath = path.resolve(__dirname, '../../../.env.local');
// Path to the Next.js .env.local file
const nextEnvPath = path.resolve(__dirname, '../.env.local');

// Read the external .env.local file
const envContent = fs.readFileSync(externalEnvPath, 'utf8');

// Write to the Next.js .env.local file
fs.writeFileSync(nextEnvPath, envContent);

console.log('Environment variables copied successfully!');