import type { Pool } from "pg";

export type DatabaseGlobal = typeof globalThis & {
  authPool?: Pool;
};
