import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';

import * as schema from './schema';

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
});

export type DatabaseClient = PostgresJsDatabase<typeof schema>;
export interface DatabaseBundle {
  sql: postgres.Sql;
  db: DatabaseClient;
}

let cachedDatabase: DatabaseBundle | null | undefined;

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return databaseEnvSchema.parse(env).DATABASE_URL;
}

export function isDatabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getDatabaseUrl(env));
}

export function getDatabase(): DatabaseBundle | null {
  if (cachedDatabase !== undefined) {
    return cachedDatabase;
  }

  const url = getDatabaseUrl();
  if (!url) {
    cachedDatabase = null;
    return cachedDatabase;
  }

  const sqlClient = postgres(url, {
    max: 10,
    prepare: false,
    transform: {
      undefined: null,
    },
  });

  cachedDatabase = {
    sql: sqlClient,
    db: drizzle(sqlClient, { schema }),
  };

  return cachedDatabase;
}

export async function closeDatabase(): Promise<void> {
  if (cachedDatabase?.sql) {
    await cachedDatabase.sql.end({ timeout: 5 });
  }
  cachedDatabase = undefined;
}
