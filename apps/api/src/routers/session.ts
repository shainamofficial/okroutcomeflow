import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { organizationMemberships, userRoles, usersProfile } from "../db/schema";
import { router, userProcedure } from "../trpc";

export const sessionRouter = router({
  // Everything AuthContext needs about the signed-in user: profile, roles,
  // and org memberships. Available even without an active org.
  me: userProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select({
        id: usersProfile.id,
        organization_id: usersProfile.organizationId,
        email: usersProfile.email,
        name: usersProfile.name,
        avatar_url: usersProfile.avatarUrl,
        status: usersProfile.status,
        created_at: usersProfile.createdAt,
      })
      .from(usersProfile)
      .where(eq(usersProfile.id, ctx.userId))
      .limit(1);

    if (!profile) return { profile: null, roles: [], memberships: [] };

    const [roleRows, membershipRows] = await Promise.all([
      db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, ctx.userId)),
      db
        .select({
          id: organizationMemberships.id,
          organization_id: organizationMemberships.organizationId,
          is_active: organizationMemberships.isActive,
          joined_at: organizationMemberships.joinedAt,
        })
        .from(organizationMemberships)
        .where(eq(organizationMemberships.userId, ctx.userId)),
    ]);

    return {
      profile,
      roles: roleRows.map((r) => r.role),
      memberships: membershipRows,
    };
  }),

  // Port of the switch_organization RPC (which used auth.uid()): activates
  // the target membership and syncs the denormalized profile org.
  switchOrganization: userProcedure
    .input(z.object({ targetOrgId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [membership] = await db
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.userId, ctx.userId),
            eq(organizationMemberships.organizationId, input.targetOrgId)
          )
        )
        .limit(1);
      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this organization" });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(organizationMemberships)
          .set({ isActive: false })
          .where(eq(organizationMemberships.userId, ctx.userId));
        await tx
          .update(organizationMemberships)
          .set({ isActive: true })
          .where(
            and(
              eq(organizationMemberships.userId, ctx.userId),
              eq(organizationMemberships.organizationId, input.targetOrgId)
            )
          );
        await tx
          .update(usersProfile)
          .set({ organizationId: input.targetOrgId })
          .where(eq(usersProfile.id, ctx.userId));
      });
      return { ok: true };
    }),
});
