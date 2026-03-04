import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;
const isNeonHosted = databaseUrl.includes('neon.tech');

// Use Neon HTTP driver only for Neon-hosted databases.
// For local/standard Postgres URLs, use node-postgres to avoid TLS/fetch issues.
if (isNeonHosted) {
  neonConfig.fetchConnectionCache = true;
}

export const sql = isNeonHosted ? neon(databaseUrl) : null;
const pgPool = isNeonHosted ? null : new Pool({ connectionString: databaseUrl });

export const db = isNeonHosted
  ? drizzleNeon(sql!, { schema })
  : drizzlePg(pgPool!, { schema });

export default db;
