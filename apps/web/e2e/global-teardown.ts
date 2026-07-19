import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Deletes any e2e-*@e2e.example users (and their auto-provisioned org + data)
// created during the run, so tests leave the database clean. Reads
// DATABASE_URL from the API's .env (E2E hits the local API's DB).
export default async function globalTeardown() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try {
      const here = path.dirname(fileURLToPath(import.meta.url));
      const env = readFileSync(path.resolve(here, "../../api/.env"), "utf8");
      dbUrl = env
        .match(/^DATABASE_URL=(.+)$/m)?.[1]
        ?.trim()
        .replace(/^["']|["']$/g, "");
    } catch {
      /* ignore */
    }
  }
  if (!dbUrl) {
    console.warn("[e2e teardown] no DATABASE_URL — skipping cleanup");
    return;
  }

  const sql = postgres(dbUrl, { prepare: false });
  try {
    const users = await sql<{ id: string }[]>`
      SELECT id FROM ba_user WHERE email LIKE 'e2e-%@e2e.example'`;
    for (const { id: uid } of users) {
      const [profile] = await sql<{ organization_id: string | null }[]>`
        SELECT organization_id FROM users_profile WHERE id = ${uid}::uuid`;
      const oid = profile?.organization_id ?? null;
      if (oid) {
        await sql`DELETE FROM key_results WHERE organization_id = ${oid}::uuid`;
        await sql`DELETE FROM objectives WHERE organization_id = ${oid}::uuid`;
      }
      await sql`DELETE FROM user_roles WHERE user_id = ${uid}::uuid ${oid ? sql`OR organization_id = ${oid}::uuid` : sql``}`;
      await sql`DELETE FROM organization_memberships WHERE user_id = ${uid}::uuid ${oid ? sql`OR organization_id = ${oid}::uuid` : sql``}`;
      if (oid) {
        await sql`DELETE FROM organization_domains WHERE organization_id = ${oid}::uuid`;
        await sql`DELETE FROM organizations WHERE id = ${oid}::uuid`;
      }
      await sql`DELETE FROM users_profile WHERE id = ${uid}::uuid`;
      await sql`DELETE FROM ba_session WHERE user_id = ${uid}`;
      await sql`DELETE FROM ba_account WHERE user_id = ${uid}`;
      await sql`DELETE FROM ba_user WHERE id = ${uid}`;
    }
    console.log(`[e2e teardown] cleaned ${users.length} test user(s)`);
  } finally {
    await sql.end();
  }
}
