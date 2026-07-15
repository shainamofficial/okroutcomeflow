import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { teamMembers, teams, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

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
});
