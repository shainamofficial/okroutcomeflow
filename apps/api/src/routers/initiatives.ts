import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { initiativeKrLinks, initiatives, usersProfile } from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Initiative not found in your organization" });

const initiativeStatus = z.enum(["not_started", "in_progress", "completed", "blocked"]);
const linkedKR = z.object({ krId: z.string().uuid(), weight: z.number().nullish() });

/** Loads an initiative's owner, scoped to the caller's org. */
async function loadInitiative(id: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: initiatives.ownerId })
    .from(initiatives)
    .where(and(eq(initiatives.id, id), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export const initiativesRouter = router({
  // Org-scoped initiatives with owner join, ordered created_at descending —
  // matches useInitiatives.
  list: protectedProcedure.query(({ ctx }) =>
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
      .where(eq(initiatives.organizationId, ctx.orgId))
      .orderBy(desc(initiatives.createdAt))
  ),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullish(),
        ownerId: z.string().uuid().nullish(),
        status: initiativeStatus.optional(),
        startDate: z.string().nullish(),
        endDate: z.string().nullish(),
        linkedKRs: z.array(linkedKR).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.initiatives.create(actor)) throw forbidden();

      // Initiative + its KR links land atomically. The DB trigger
      // check_initiative_kr_same_org still enforces that linked KRs share
      // the org.
      return db.transaction(async (tx) => {
        const [created] = await tx
          .insert(initiatives)
          .values({
            organizationId: ctx.orgId,
            title: input.title,
            description: input.description ?? null,
            ownerId: input.ownerId ?? null,
            status: input.status ?? "not_started",
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
            createdBy: ctx.userId,
          })
          .returning();
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.linkedKRs?.length) {
          await tx.insert(initiativeKrLinks).values(
            input.linkedKRs.map((l) => ({
              initiativeId: created.id,
              keyResultId: l.krId,
              weight: l.weight != null ? String(l.weight) : null,
            }))
          );
        }
        return created;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().nullish(),
        ownerId: z.string().uuid().nullish(),
        status: initiativeStatus.optional(),
        startDate: z.string().nullish(),
        endDate: z.string().nullish(),
        color: z.string().nullish(),
        linkedKRs: z.array(linkedKR).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const initiative = await loadInitiative(input.id, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.initiatives.update(actor, { ownerId: initiative.ownerId })) throw forbidden();

      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.description !== undefined) patch.description = input.description ?? null;
      if (input.ownerId !== undefined) patch.ownerId = input.ownerId ?? null;
      if (input.status !== undefined) patch.status = input.status;
      if (input.startDate !== undefined) patch.startDate = input.startDate ?? null;
      if (input.endDate !== undefined) patch.endDate = input.endDate ?? null;
      if (input.color !== undefined) patch.color = input.color ?? null;

      await db.transaction(async (tx) => {
        if (Object.keys(patch).length > 0) {
          await tx.update(initiatives).set(patch).where(eq(initiatives.id, input.id));
        }
        // linkedKRs provided (even []) = replace the whole link set.
        if (input.linkedKRs !== undefined) {
          await tx.delete(initiativeKrLinks).where(eq(initiativeKrLinks.initiativeId, input.id));
          if (input.linkedKRs.length) {
            await tx.insert(initiativeKrLinks).values(
              input.linkedKRs.map((l) => ({
                initiativeId: input.id,
                keyResultId: l.krId,
                weight: l.weight != null ? String(l.weight) : null,
              }))
            );
          }
        }
      });
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const initiative = await loadInitiative(input.id, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.initiatives.delete(actor)) throw forbidden();
      await db.delete(initiatives).where(eq(initiatives.id, input.id));
      return { ok: true };
    }),
});
