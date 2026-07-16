import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { teamMembers, teams, usersProfile } from "../db/schema";
import { managerProcedure, protectedProcedure, router } from "../trpc";

const notFound = (what = "Team") =>
  new TRPCError({ code: "NOT_FOUND", message: `${what} not found in your organization` });

/** Rethrows Postgres unique-violation (23505) as a friendly CONFLICT. */
function asConflict(e: unknown, message: string): never {
  if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "23505") {
    throw new TRPCError({ code: "CONFLICT", message });
  }
  throw e;
}

/** Confirms a team is in the caller's org. */
async function assertTeamInOrg(teamId: string, orgId: string) {
  const [row] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, orgId)))
    .limit(1);
  if (!row) throw notFound();
}

export const teamsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: teams.id,
        name: teams.name,
        created_at: teams.createdAt,
        organization_id: teams.organizationId,
      })
      .from(teams)
      .where(eq(teams.organizationId, ctx.orgId))
      .orderBy(asc(teams.name))
  ),

  members: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      // The join on teams enforces that the requested team belongs to the
      // caller's org (the RLS policy did this in the Supabase path).
      db
        .select({
          id: teamMembers.id,
          team_id: teamMembers.teamId,
          user_id: teamMembers.userId,
          created_at: teamMembers.createdAt,
          user: {
            id: usersProfile.id,
            name: usersProfile.name,
            email: usersProfile.email,
          },
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teams.id, teamMembers.teamId))
        .innerJoin(usersProfile, eq(usersProfile.id, teamMembers.userId))
        .where(and(eq(teamMembers.teamId, input.teamId), eq(teams.organizationId, ctx.orgId)))
    ),

  // All team management is admin/manager-only (perms.teams.manage =
  // isElevated), which managerProcedure already enforces.
  create: managerProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [created] = await db
          .insert(teams)
          .values({ organizationId: ctx.orgId, name: input.name.trim() })
          .returning();
        return created;
      } catch (e) {
        asConflict(e, "A team with this name already exists");
      }
    }),

  rename: managerProcedure
    .input(z.object({ teamId: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertTeamInOrg(input.teamId, ctx.orgId);
      try {
        await db.update(teams).set({ name: input.name.trim() }).where(eq(teams.id, input.teamId));
      } catch (e) {
        asConflict(e, "A team with this name already exists");
      }
      return { ok: true };
    }),

  remove: managerProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertTeamInOrg(input.teamId, ctx.orgId);
      await db.delete(teams).where(eq(teams.id, input.teamId));
      return { ok: true };
    }),

  addMember: managerProcedure
    .input(z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertTeamInOrg(input.teamId, ctx.orgId);
      try {
        await db.insert(teamMembers).values({ teamId: input.teamId, userId: input.userId });
      } catch (e) {
        asConflict(e, "User is already a member of this team");
      }
      return { ok: true };
    }),

  removeMember: managerProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete only if the membership's team is in the caller's org.
      const [row] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .innerJoin(teams, eq(teams.id, teamMembers.teamId))
        .where(and(eq(teamMembers.id, input.memberId), eq(teams.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw notFound("Membership");
      await db.delete(teamMembers).where(eq(teamMembers.id, input.memberId));
      return { ok: true };
    }),
});
