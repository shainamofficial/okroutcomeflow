import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { automations } from "../db/schema";
import { managerProcedure, protectedProcedure, router } from "../trpc";

const triggerType = z.enum([
  "task_status_change",
  "all_tasks_done",
  "initiative_status_change",
  "due_date_passed",
]);
const actionType = z.enum([
  "change_initiative_status",
  "change_task_status",
  "send_notification",
  "create_update",
]);

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Automation not found in your organization" });

async function assertInOrg(id: string, orgId: string) {
  const [row] = await db
    .select({ id: automations.id })
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.organizationId, orgId)))
    .limit(1);
  if (!row) throw notFound();
}

export const automationsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: automations.id,
        organization_id: automations.organizationId,
        name: automations.name,
        trigger_type: automations.triggerType,
        trigger_config: automations.triggerConfig,
        action_type: automations.actionType,
        action_config: automations.actionConfig,
        enabled: automations.enabled,
        created_by: automations.createdBy,
        created_at: automations.createdAt,
      })
      .from(automations)
      .where(eq(automations.organizationId, ctx.orgId))
      .orderBy(desc(automations.createdAt))
  ),

  // All admin/manager-only (perms.automations.manage = isElevated).
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        triggerType,
        triggerConfig: z.record(z.unknown()).default({}),
        actionType,
        actionConfig: z.record(z.unknown()).default({}),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(automations)
        .values({
          organizationId: ctx.orgId,
          name: input.name,
          triggerType: input.triggerType,
          triggerConfig: input.triggerConfig,
          actionType: input.actionType,
          actionConfig: input.actionConfig,
          createdBy: ctx.userId,
        })
        .returning();
      return created;
    }),

  toggle: managerProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertInOrg(input.id, ctx.orgId);
      await db.update(automations).set({ enabled: input.enabled }).where(eq(automations.id, input.id));
      return { ok: true };
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertInOrg(input.id, ctx.orgId);
      await db.delete(automations).where(eq(automations.id, input.id));
      return { ok: true };
    }),
});
