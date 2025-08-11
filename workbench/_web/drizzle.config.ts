import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

const wantsSQLite =
  (process.env.DATABASE_DIALECT || '').toLowerCase() === 'sqlite' ||
  (process.env.USE_SQLITE || '').toLowerCase() === 'true' ||
  (process.env.DATABASE_URL || '').startsWith('file:');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: wantsSQLite ? 'sqlite' : 'postgresql',
  dbCredentials: wantsSQLite
    ? {
        url: process.env.DATABASE_URL || process.env.LOCAL_SQLITE_URL || 'file:../../scripts/test.db',
      }
    : {
        url: process.env.DATABASE_URL!,
      },
});
