import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userRoles, usersProfile } from "../db/schema";
import { managerProcedure, router } from "../trpc";

export const orgUsersRouter = router({
  /**
   * Replaces the old client-side pattern of fetching all visible role rows
   * and joining in the browser: one org-scoped query with a proper join.
   */
  list: managerProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: usersProfile.id,
        name: usersProfile.name,
        email: usersProfile.email,
        status: usersProfile.status,
        created_at: usersProfile.createdAt,
        role: userRoles.role,
      })
      .from(usersProfile)
      .leftJoin(userRoles, eq(userRoles.userId, usersProfile.id))
      .where(eq(usersProfile.organizationId, ctx.orgId));

    const byUser = new Map<
      string,
      { id: string; name: string; email: string; status: string; created_at: string | null; roles: string[] }
    >();
    for (const row of rows) {
      const existing = byUser.get(row.id);
      if (existing) {
        if (row.role) existing.roles.push(row.role);
      } else {
        byUser.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          status: row.status,
          created_at: row.created_at,
          roles: row.role ? [row.role] : [],
        });
      }
    }
    return [...byUser.values()];
  }),
});
