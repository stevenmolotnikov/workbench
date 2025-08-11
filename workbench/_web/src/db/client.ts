/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: '.env' });

const wantsSQLite =
  (process.env.DATABASE_DIALECT || '').toLowerCase() === 'sqlite' ||
  (process.env.USE_SQLITE || '').toLowerCase() === 'true' ||
  (process.env.DATABASE_URL || '').startsWith('file:');

let database: any;

if (wantsSQLite) {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');

  const sqliteUrl = process.env.LOCAL_SQLITE_URL || process.env.DATABASE_URL || '';
  const sqlitePath = sqliteUrl.startsWith('file:')
    ? sqliteUrl.replace('file:', '')
    : sqliteUrl || path.resolve(process.cwd(), '../../scripts', 'test.db');

  const client = new Database(sqlitePath);
  database = drizzle(client);
} else {
  const { drizzle } = require('drizzle-orm/postgres-js');
  const postgres = require('postgres');

  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, { prepare: false });
  database = drizzle({ client });
}

export const db = database;
