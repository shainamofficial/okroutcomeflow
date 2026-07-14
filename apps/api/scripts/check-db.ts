// Connectivity smoke test: npm run db:check -w apps/api
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Create apps/api/.env first.");
  process.exit(1);
}

// prepare:false is required for the Supabase transaction pooler (port 6543),
// which does not support prepared statements.
const sql = postgres(url, { prepare: false, connect_timeout: 15 });

try {
  const [version] = await sql`select version()`;
  const [tables] = await sql`
    select count(*)::int as n
    from information_schema.tables
    where table_schema = 'public'
  `;
  console.log("CONNECTED OK");
  console.log("postgres:", String(version?.version ?? "").split(" ").slice(0, 2).join(" "));
  console.log("public tables:", tables?.n);
} finally {
  await sql.end();
}
