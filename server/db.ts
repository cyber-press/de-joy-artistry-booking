import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DATABASE_POOL_SIZE || 10),
});

export async function migrate() {
  const sql = await fs.readFile(path.resolve("server/schema.sql"), "utf8");
  await pool.query(sql);
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  return pool.query<T & pg.QueryResultRow>(text, params);
}
