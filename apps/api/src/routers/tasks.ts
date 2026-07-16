import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { initiatives, tasks, teams, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

const taskColumns = {
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
};

export const tasksRouter = router({
  // Tasks for one initiative, ordered created_at descending — matches
  // useTasks(initiativeId). The initiative join enforces org ownership.
  byInitiative: protectedProcedure
    .input(z.object({ initiativeId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      db
        .select(taskColumns)
        .from(tasks)
        .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
        .leftJoin(usersProfile, eq(usersProfile.id, tasks.assigneeUserId))
        .leftJoin(teams, eq(teams.id, tasks.assigneeTeamId))
        .where(
          and(eq(tasks.initiativeId, input.initiativeId), eq(initiatives.organizationId, ctx.orgId))
        )
        .orderBy(desc(tasks.createdAt))
    ),

  // Every org task with its initiative's org id, ordered created_at
  // descending — matches useAllTasks.
  listAll: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        ...taskColumns,
        initiative: {
          id: initiatives.id,
          organization_id: initiatives.organizationId,
        },
      })
      .from(tasks)
      .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
      .leftJoin(usersProfile, eq(usersProfile.id, tasks.assigneeUserId))
      .leftJoin(teams, eq(teams.id, tasks.assigneeTeamId))
      .where(eq(initiatives.organizationId, ctx.orgId))
      .orderBy(desc(tasks.createdAt))
  ),
});
