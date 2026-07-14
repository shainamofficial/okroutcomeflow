import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { initiatives, keyResults, tasks, teams, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

// Drizzle nullifies nested selections on unmatched left joins, matching
// the Supabase response shape (owner: null) with no post-processing.
export const myItemsRouter = router({
  keyResults: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: keyResults.id,
        organization_id: keyResults.organizationId,
        objective_id: keyResults.objectiveId,
        parent_kr_id: keyResults.parentKrId,
        title: keyResults.title,
        description: keyResults.description,
        owner_id: keyResults.ownerId,
        created_by: keyResults.createdBy,
        created_at: keyResults.createdAt,
        updated_at: keyResults.updatedAt,
        owner: {
          id: usersProfile.id,
          name: usersProfile.name,
          email: usersProfile.email,
        },
      })
      .from(keyResults)
      .leftJoin(usersProfile, eq(usersProfile.id, keyResults.ownerId))
      .where(and(eq(keyResults.organizationId, ctx.orgId), eq(keyResults.ownerId, ctx.userId)))
      .orderBy(desc(keyResults.createdAt))
  ),

  initiatives: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: initiatives.id,
        organization_id: initiatives.organizationId,
        title: initiatives.title,
        description: initiatives.description,
        owner_id: initiatives.ownerId,
        status: initiatives.status,
        start_date: initiatives.startDate,
        end_date: initiatives.endDate,
        created_by: initiatives.createdBy,
        created_at: initiatives.createdAt,
        color: initiatives.color,
        owner: {
          id: usersProfile.id,
          name: usersProfile.name,
          email: usersProfile.email,
        },
      })
      .from(initiatives)
      .leftJoin(usersProfile, eq(usersProfile.id, initiatives.ownerId))
      .where(and(eq(initiatives.organizationId, ctx.orgId), eq(initiatives.ownerId, ctx.userId)))
      .orderBy(desc(initiatives.createdAt))
  ),

  tasks: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: tasks.id,
        initiative_id: tasks.initiativeId,
        title: tasks.title,
        description: tasks.description,
        assignee_user_id: tasks.assigneeUserId,
        assignee_team_id: tasks.assigneeTeamId,
        status: tasks.status,
        start_date: tasks.startDate,
        due_date: tasks.dueDate,
        created_by: tasks.createdBy,
        created_at: tasks.createdAt,
        color: tasks.color,
        parent_task_id: tasks.parentTaskId,
        assignee_user: {
          id: usersProfile.id,
          name: usersProfile.name,
          email: usersProfile.email,
        },
        assignee_team: {
          id: teams.id,
          name: teams.name,
        },
        initiative: {
          organization_id: initiatives.organizationId,
        },
      })
      .from(tasks)
      .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
      .leftJoin(usersProfile, eq(usersProfile.id, tasks.assigneeUserId))
      .leftJoin(teams, eq(teams.id, tasks.assigneeTeamId))
      .where(
        and(eq(initiatives.organizationId, ctx.orgId), eq(tasks.assigneeUserId, ctx.userId))
      )
      .orderBy(desc(tasks.createdAt))
  ),
});
