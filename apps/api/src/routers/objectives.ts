import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { objectives } from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Objective not found in your organization" });

/** Confirms an objective belongs to the caller's org. */
async function assertInOrg(id: string, orgId: string) {
  const [row] = await db
    .select({ id: objectives.id })
    .from(objectives)
    .where(and(eq(objectives.id, id), eq(objectives.organizationId, orgId)))
    .limit(1);
  if (!row) throw notFound();
}

export const objectivesRouter = router({
  // Snake_case aliases keep the response shape identical to what
  // useObjectives got from Supabase directly.
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: objectives.id,
        organization_id: objectives.organizationId,
        title: objectives.title,
        description: objectives.description,
        created_by: objectives.createdBy,
        created_at: objectives.createdAt,
        updated_at: objectives.updatedAt,
      })
      .from(objectives)
      .where(eq(objectives.organizationId, ctx.orgId))
      .orderBy(desc(objectives.createdAt))
  ),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.objectives.create(actor)) throw forbidden();
      const [created] = await db
        .insert(objectives)
        .values({
          organizationId: ctx.orgId,
          title: input.title,
          description: input.description ?? null,
          createdBy: ctx.userId,
        })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), title: z.string().min(1), description: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.objectives.update(actor)) throw forbidden();
      await assertInOrg(input.id, ctx.orgId);
      await db
        .update(objectives)
        .set({ title: input.title, description: input.description ?? null })
        .where(eq(objectives.id, input.id));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.objectives.delete(actor)) throw forbidden();
      await assertInOrg(input.id, ctx.orgId);
      await db.delete(objectives).where(eq(objectives.id, input.id));
      return { ok: true };
    }),
});
