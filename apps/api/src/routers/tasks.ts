import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import {
  initiatives,
  taskDependencies,
  taskWatchers,
  tasks,
  teams,
  usersProfile,
} from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Task or initiative not found in your organization" });
const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });

/** Loads an initiative's owner + org, scoped to the caller's org. */
async function loadInitiative(initiativeId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: initiatives.ownerId, organizationId: initiatives.organizationId })
    .from(initiatives)
    .where(and(eq(initiatives.id, initiativeId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/** Loads a task's assignee + its initiative's owner, scoped to the caller's org. */
async function loadTaskContext(taskId: string, orgId: string) {
  const [row] = await db
    .select({
      assigneeUserId: tasks.assigneeUserId,
      initiativeOwnerId: initiatives.ownerId,
    })
    .from(tasks)
    .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
    .where(and(eq(tasks.id, taskId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

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

  create: protectedProcedure
    .input(
      z.object({
        initiativeId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().nullish(),
        assigneeUserId: z.string().uuid().nullish(),
        assigneeTeamId: z.string().uuid().nullish(),
        status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
        startDate: z.string().nullish(),
        dueDate: z.string().nullish(),
        parentTaskId: z.string().uuid().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const initiative = await loadInitiative(input.initiativeId, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.tasks.create(actor, { ownerId: initiative.ownerId })) throw forbidden();

      const [created] = await db
        .insert(tasks)
        .values({
          initiativeId: input.initiativeId,
          title: input.title,
          description: input.description ?? null,
          assigneeUserId: input.assigneeUserId ?? null,
          assigneeTeamId: input.assigneeTeamId ?? null,
          status: input.status ?? "todo",
          startDate: input.startDate ?? null,
          dueDate: input.dueDate ?? null,
          parentTaskId: input.parentTaskId ?? null,
          createdBy: ctx.userId,
        })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().nullish(),
        assigneeUserId: z.string().uuid().nullish(),
        assigneeTeamId: z.string().uuid().nullish(),
        status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
        startDate: z.string().nullish(),
        dueDate: z.string().nullish(),
        color: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await loadTaskContext(input.id, ctx.orgId);
      if (!task) throw notFound();
      const actor = await getActor(ctx);
      if (
        !perms.canManageTask(actor, {
          assigneeUserId: task.assigneeUserId,
          initiativeOwnerId: task.initiativeOwnerId,
        })
      ) {
        throw forbidden();
      }

      // Only touch columns explicitly provided (null is a real value = clear).
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.description !== undefined) patch.description = input.description ?? null;
      if (input.assigneeUserId !== undefined) patch.assigneeUserId = input.assigneeUserId ?? null;
      if (input.assigneeTeamId !== undefined) patch.assigneeTeamId = input.assigneeTeamId ?? null;
      if (input.status !== undefined) patch.status = input.status;
      if (input.startDate !== undefined) patch.startDate = input.startDate ?? null;
      if (input.dueDate !== undefined) patch.dueDate = input.dueDate ?? null;
      if (input.color !== undefined) patch.color = input.color ?? null;

      if (Object.keys(patch).length > 0) {
        await db.update(tasks).set(patch).where(eq(tasks.id, input.id));
      }
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await loadTaskContext(input.id, ctx.orgId);
      if (!task) throw notFound();
      const actor = await getActor(ctx);
      // Plain assignees can't delete — only elevated or the initiative owner.
      if (!perms.tasks.delete(actor, { initiativeOwnerId: task.initiativeOwnerId })) {
        throw forbidden();
      }
      await db.delete(tasks).where(eq(tasks.id, input.id));
      return { ok: true };
    }),

  // --- watchers & dependencies ---

  watchers: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      db
        .select({
          id: taskWatchers.id,
          task_id: taskWatchers.taskId,
          user_id: taskWatchers.userId,
          created_at: taskWatchers.createdAt,
          user: {
            id: usersProfile.id,
            name: usersProfile.name,
            email: usersProfile.email,
            avatar_url: usersProfile.avatarUrl,
          },
        })
        .from(taskWatchers)
        .innerJoin(tasks, eq(tasks.id, taskWatchers.taskId))
        .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
        .leftJoin(usersProfile, eq(usersProfile.id, taskWatchers.userId))
        .where(and(eq(taskWatchers.taskId, input.taskId), eq(initiatives.organizationId, ctx.orgId)))
    ),

  // Any org member may watch/unwatch a task for THEMSELVES (perms.tasks.watch).
  toggleWatch: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await loadTaskContext(input.taskId, ctx.orgId);
      if (!task) throw notFound();
      const [existing] = await db
        .select({ id: taskWatchers.id })
        .from(taskWatchers)
        .where(and(eq(taskWatchers.taskId, input.taskId), eq(taskWatchers.userId, ctx.userId)))
        .limit(1);
      if (existing) {
        await db.delete(taskWatchers).where(eq(taskWatchers.id, existing.id));
        return { watching: false };
      }
      await db.insert(taskWatchers).values({ taskId: input.taskId, userId: ctx.userId });
      return { watching: true };
    }),

  dependencies: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: taskDependencies.id,
        task_id: taskDependencies.taskId,
        depends_on_task_id: taskDependencies.dependsOnTaskId,
        dependency_type: taskDependencies.dependencyType,
        created_at: taskDependencies.createdAt,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(tasks.id, taskDependencies.taskId))
      .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
      .where(eq(initiatives.organizationId, ctx.orgId))
  ),
});
