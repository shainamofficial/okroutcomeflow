import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/client";
import { userRoles } from "../db/schema";

/**
 * Roles the user holds in their active organization. Mirrors the SQL
 * has_role() semantics: rows with a NULL organization_id (pre-multi-org
 * legacy rows) count for whatever org is active.
 */
export async function getCallerRoles(userId: string, orgId: string): Promise<string[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, orgId))
      )
    );
  return rows.map((r) => r.role);
}
