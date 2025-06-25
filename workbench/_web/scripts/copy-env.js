const fs = require('fs');
const path = require('path');

// Path to the external .env file (in the root directory)
const externalEnvPath = path.resolve(__dirname, '../../../.env');
// Path to the Next.js .env file
const nextEnvPath = path.resolve(__dirname, '../.env');

// Read the external .env file
const envContent = fs.readFileSync(externalEnvPath, 'utf8');

// Write to the Next.js .env file
fs.writeFileSync(nextEnvPath, envContent);

console.log('Environment variables copied successfully!');