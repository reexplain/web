import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  authPool?: Pool;
};

export const authPool =
  globalForDatabase.authPool ??
  new Pool({
    host: process.env.POSTGRES_SERVER,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    max: 10,
    ssl: false
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.authPool = authPool;
}