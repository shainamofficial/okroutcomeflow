import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env on its own; Node 20.12+ can.
process.loadEnvFile?.(".env");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");

// The app connects through the transaction pooler (:6543), but schema
// introspection/migration tooling must use the session pooler (:5432) —
// the transaction pooler chokes on drizzle-kit's catalog queries.
const sessionPoolerUrl = url.replace(":6543/", ":5432/");

export default defineConfig({
  dialect: "postgresql",
  out: "./src/db",
  dbCredentials: {
    url: sessionPoolerUrl,
  },
  schemaFilter: ["public"],
});
