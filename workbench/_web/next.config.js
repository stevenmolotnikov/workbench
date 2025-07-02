/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    // This will load the .env.local file from the parent directory
    ENV_FILE: path.resolve(__dirname, '../.env.local'),
  },
  webpack: (config) => {
    // Fallbacks for @huggingface/transformers package
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      externals: ['@huggingface/transformers'],
    };

    return config;
  },
};

module.exports = nextConfig;
