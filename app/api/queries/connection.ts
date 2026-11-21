import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

let instance: ReturnType<typeof createDatabase> | undefined;

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  return drizzle(pool, { schema });
}

export function getDb() {
  instance ??= createDatabase(env.databaseUrl);
  return instance;
}

export type Database = ReturnType<typeof getDb>;
