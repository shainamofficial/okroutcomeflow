import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy apps/api/.env.example to .env and fill it in.");
}

// prepare:false — the Supabase transaction pooler (port 6543) does not
// support prepared statements.
const client = postgres(url, { prepare: false, max: 10 });

export const db = drizzle(client, { schema });
