import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { userRoles, usersProfile } from "../db/schema";
import { getActor } from "../lib/roles";
import { managerProcedure, protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "Admin role required" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "User not found in your organization" });

/** Confirms the target user is a member of the caller's org. */
async function assertInOrg(userId: string, orgId: string) {
  const [row] = await db
    .select({ id: usersProfile.id })
    .from(usersProfile)
    .where(and(eq(usersProfile.id, userId), eq(usersProfile.organizationId, orgId)))
    .limit(1);
  if (!row) throw notFound();
}

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

  updateStatus: protectedProcedure
    .input(z.object({ userId: z.string().uuid(), status: z.enum(["pending", "active", "inactive"]) }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.orgUsers.updateStatus(actor)) throw forbidden();
      await assertInOrg(input.userId, ctx.orgId);
      await db
        .update(usersProfile)
        .set({ status: input.status })
        .where(eq(usersProfile.id, input.userId));
      return { ok: true };
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        newRole: z.enum(["admin", "manager", "contributor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.orgUsers.updateRole(actor)) throw forbidden();
      await assertInOrg(input.userId, ctx.orgId);
      // Replace the user's role in THIS org (scoped, unlike the old client
      // path which cleared all rows) — invisible with a single org, correct
      // for multi-org.
      await db.transaction(async (tx) => {
        await tx
          .delete(userRoles)
          .where(and(eq(userRoles.userId, input.userId), eq(userRoles.organizationId, ctx.orgId)));
        await tx
          .insert(userRoles)
          .values({ userId: input.userId, role: input.newRole, organizationId: ctx.orgId });
      });
      return { ok: true };
    }),
});
