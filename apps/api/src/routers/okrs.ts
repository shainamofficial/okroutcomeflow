import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { keyResults, usersProfile } from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Key result not found in your organization" });

/** Loads a KR's owner, scoped to the caller's org. */
async function loadKeyResult(id: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: keyResults.ownerId })
    .from(keyResults)
    .where(and(eq(keyResults.id, id), eq(keyResults.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

const keyResultColumns = {
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
};

export const okrsRouter = router({
  // Org-scoped key results, optionally narrowed to one objective. Ordered
  // created_at ascending, matching useKeyResults / useAllKeyResults.
  keyResults: protectedProcedure
    .input(z.object({ objectiveId: z.string().uuid().optional() }).optional())
    .query(({ ctx, input }) =>
      db
        .select(keyResultColumns)
        .from(keyResults)
        .leftJoin(usersProfile, eq(usersProfile.id, keyResults.ownerId))
        .where(
          input?.objectiveId
            ? and(
                eq(keyResults.organizationId, ctx.orgId),
                eq(keyResults.objectiveId, input.objectiveId)
              )
            : eq(keyResults.organizationId, ctx.orgId)
        )
        .orderBy(asc(keyResults.createdAt))
    ),

  createKeyResult: protectedProcedure
    .input(
      z
        .object({
          title: z.string().min(1),
          description: z.string().nullish(),
          objectiveId: z.string().uuid().optional(),
          parentKrId: z.string().uuid().optional(),
          ownerId: z.string().uuid().nullish(),
        })
        .refine((v) => !!v.objectiveId !== !!v.parentKrId, {
          message: "A key result must belong to exactly one of an objective or a parent key result",
        })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.keyResults.create(actor)) throw forbidden();
      const [created] = await db
        .insert(keyResults)
        .values({
          organizationId: ctx.orgId,
          title: input.title,
          description: input.description ?? null,
          objectiveId: input.objectiveId ?? null,
          parentKrId: input.parentKrId ?? null,
          ownerId: input.ownerId ?? null,
          createdBy: ctx.userId,
        })
        .returning();
      return created;
    }),

  updateKeyResult: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().nullish(),
        ownerId: z.string().uuid().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const kr = await loadKeyResult(input.id, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      // elevated OR contributor who owns this KR (the tested quirk)
      if (!perms.keyResults.update(actor, { ownerId: kr.ownerId })) throw forbidden();
      await db
        .update(keyResults)
        .set({
          title: input.title,
          description: input.description ?? null,
          ownerId: input.ownerId ?? null,
        })
        .where(eq(keyResults.id, input.id));
      return { ok: true };
    }),

  deleteKeyResult: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const kr = await loadKeyResult(input.id, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.delete(actor)) throw forbidden();
      await db.delete(keyResults).where(eq(keyResults.id, input.id));
      return { ok: true };
    }),
});
