import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import {
  keyResults,
  krReviewCadence,
  krReviewParticipants,
  krReviewSessions,
  usersProfile,
} from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const sessionStatus = z.enum(["scheduled", "completed", "cancelled"]);
const frequency = z.enum(["weekly", "biweekly", "monthly", "quarterly"]);

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = (what = "Item") =>
  new TRPCError({ code: "NOT_FOUND", message: `${what} not found in your organization` });

/** Loads a KR's owner (org-scoped) and asserts the caller can manage its
 * reviews (elevated or KR owner). Throws NOT_FOUND / FORBIDDEN. */
async function assertCanManageKr(keyResultId: string, ctx: { userId: string; orgId: string }) {
  const [kr] = await db
    .select({ ownerId: keyResults.ownerId })
    .from(keyResults)
    .where(and(eq(keyResults.id, keyResultId), eq(keyResults.organizationId, ctx.orgId)))
    .limit(1);
  if (!kr) throw notFound("Key result");
  const actor = await getActor(ctx);
  if (!perms.keyResults.manageReviews(actor, { ownerId: kr.ownerId })) throw forbidden();
}

/** Resolves a session's key_result_id, org-scoped. */
async function keyResultIdForSession(sessionId: string, orgId: string): Promise<string | null> {
  const [row] = await db
    .select({ keyResultId: krReviewSessions.keyResultId })
    .from(krReviewSessions)
    .innerJoin(keyResults, eq(keyResults.id, krReviewSessions.keyResultId))
    .where(and(eq(krReviewSessions.id, sessionId), eq(keyResults.organizationId, orgId)))
    .limit(1);
  return row?.keyResultId ?? null;
}

const sessionColumns = {
  id: krReviewSessions.id,
  key_result_id: krReviewSessions.keyResultId,
  review_date: krReviewSessions.reviewDate,
  status: krReviewSessions.status,
  notes: krReviewSessions.notes,
  completed_at: krReviewSessions.completedAt,
  created_at: krReviewSessions.createdAt,
};

export const reviewsRouter = router({
  cadence: protectedProcedure
    .input(z.object({ keyResultId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          id: krReviewCadence.id,
          key_result_id: krReviewCadence.keyResultId,
          frequency: krReviewCadence.frequency,
          day_of_week: krReviewCadence.dayOfWeek,
          time: krReviewCadence.time,
          next_review_date: krReviewCadence.nextReviewDate,
          created_at: krReviewCadence.createdAt,
        })
        .from(krReviewCadence)
        .innerJoin(keyResults, eq(keyResults.id, krReviewCadence.keyResultId))
        .where(
          and(
            eq(krReviewCadence.keyResultId, input.keyResultId),
            eq(keyResults.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      return rows[0] ?? null;
    }),

  sessions: protectedProcedure
    .input(z.object({ keyResultId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      db
        .select({
          ...sessionColumns,
          key_result: {
            id: keyResults.id,
            title: keyResults.title,
            owner_id: keyResults.ownerId,
          },
          owner: {
            id: usersProfile.id,
            name: usersProfile.name,
            email: usersProfile.email,
          },
        })
        .from(krReviewSessions)
        .innerJoin(keyResults, eq(keyResults.id, krReviewSessions.keyResultId))
        .leftJoin(usersProfile, eq(usersProfile.id, keyResults.ownerId))
        .where(
          and(
            eq(krReviewSessions.keyResultId, input.keyResultId),
            eq(keyResults.organizationId, ctx.orgId)
          )
        )
        .orderBy(asc(krReviewSessions.reviewDate))
        .then((rows) =>
          rows.map(({ owner, key_result, ...s }) => ({
            ...s,
            key_result: { ...key_result, owner },
          }))
        )
    ),

  allSessions: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        ...sessionColumns,
        key_result: {
          id: keyResults.id,
          title: keyResults.title,
          owner_id: keyResults.ownerId,
          organization_id: keyResults.organizationId,
        },
        owner: {
          id: usersProfile.id,
          name: usersProfile.name,
          email: usersProfile.email,
        },
      })
      .from(krReviewSessions)
      .innerJoin(keyResults, eq(keyResults.id, krReviewSessions.keyResultId))
      .leftJoin(usersProfile, eq(usersProfile.id, keyResults.ownerId))
      .where(eq(keyResults.organizationId, ctx.orgId))
      .orderBy(asc(krReviewSessions.reviewDate))
      .then((rows) =>
        rows.map(({ owner, key_result, ...s }) => ({
          ...s,
          key_result: { ...key_result, owner },
        }))
      )
  ),

  // --- mutations (all canManageKr) ---

  // nextReviewDate is computed client-side (calculateNextReviewDate) and
  // passed in. Upserts the cadence and ensures a scheduled session exists
  // for that date, atomically.
  upsertCadence: protectedProcedure
    .input(
      z.object({
        keyResultId: z.string().uuid(),
        frequency,
        dayOfWeek: z.number().int().min(0).max(6).nullish(),
        time: z.string().default("09:00"),
        nextReviewDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageKr(input.keyResultId, ctx);
      return db.transaction(async (tx) => {
        const [cadence] = await tx
          .insert(krReviewCadence)
          .values({
            keyResultId: input.keyResultId,
            frequency: input.frequency,
            dayOfWeek: input.dayOfWeek ?? null,
            time: input.time,
            nextReviewDate: input.nextReviewDate,
          })
          .onConflictDoUpdate({
            target: krReviewCadence.keyResultId,
            set: {
              frequency: input.frequency,
              dayOfWeek: input.dayOfWeek ?? null,
              time: input.time,
              nextReviewDate: input.nextReviewDate,
            },
          })
          .returning();

        const [existing] = await tx
          .select({ id: krReviewSessions.id })
          .from(krReviewSessions)
          .where(
            and(
              eq(krReviewSessions.keyResultId, input.keyResultId),
              eq(krReviewSessions.reviewDate, input.nextReviewDate),
              eq(krReviewSessions.status, "scheduled")
            )
          )
          .limit(1);
        if (!existing) {
          await tx.insert(krReviewSessions).values({
            keyResultId: input.keyResultId,
            reviewDate: input.nextReviewDate,
            status: "scheduled",
          });
        }
        return cadence;
      });
    }),

  deleteCadence: protectedProcedure
    .input(z.object({ keyResultId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManageKr(input.keyResultId, ctx);
      await db.delete(krReviewCadence).where(eq(krReviewCadence.keyResultId, input.keyResultId));
      return { ok: true };
    }),

  createSession: protectedProcedure
    .input(
      z.object({
        keyResultId: z.string().uuid(),
        reviewDate: z.string(),
        status: sessionStatus.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageKr(input.keyResultId, ctx);
      const [created] = await db
        .insert(krReviewSessions)
        .values({
          keyResultId: input.keyResultId,
          reviewDate: input.reviewDate,
          status: input.status ?? "scheduled",
        })
        .returning();
      return created;
    }),

  updateSession: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reviewDate: z.string().optional(),
        status: sessionStatus.optional(),
        notes: z.string().nullish(),
        completedAt: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const krId = await keyResultIdForSession(input.id, ctx.orgId);
      if (!krId) throw notFound("Review session");
      await assertCanManageKr(krId, ctx);
      const patch: Record<string, unknown> = {};
      if (input.reviewDate !== undefined) patch.reviewDate = input.reviewDate;
      if (input.status !== undefined) patch.status = input.status;
      if (input.notes !== undefined) patch.notes = input.notes ?? null;
      if (input.completedAt !== undefined) patch.completedAt = input.completedAt ?? null;
      if (Object.keys(patch).length > 0) {
        await db.update(krReviewSessions).set(patch).where(eq(krReviewSessions.id, input.id));
      }
      return { ok: true };
    }),

  deleteSession: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const krId = await keyResultIdForSession(input.id, ctx.orgId);
      if (!krId) throw notFound("Review session");
      await assertCanManageKr(krId, ctx);
      await db.delete(krReviewSessions).where(eq(krReviewSessions.id, input.id));
      return { ok: true };
    }),

  participants: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      db
        .select({
          id: krReviewParticipants.id,
          review_session_id: krReviewParticipants.reviewSessionId,
          user_id: krReviewParticipants.userId,
          user: {
            id: usersProfile.id,
            name: usersProfile.name,
            email: usersProfile.email,
          },
        })
        .from(krReviewParticipants)
        .innerJoin(krReviewSessions, eq(krReviewSessions.id, krReviewParticipants.reviewSessionId))
        .innerJoin(keyResults, eq(keyResults.id, krReviewSessions.keyResultId))
        .leftJoin(usersProfile, eq(usersProfile.id, krReviewParticipants.userId))
        .where(
          and(
            eq(krReviewParticipants.reviewSessionId, input.sessionId),
            eq(keyResults.organizationId, ctx.orgId)
          )
        )
    ),

  addParticipant: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const krId = await keyResultIdForSession(input.sessionId, ctx.orgId);
      if (!krId) throw notFound("Review session");
      await assertCanManageKr(krId, ctx);
      const [created] = await db
        .insert(krReviewParticipants)
        .values({ reviewSessionId: input.sessionId, userId: input.userId })
        .returning();
      return created;
    }),

  removeParticipant: protectedProcedure
    .input(z.object({ participantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ keyResultId: krReviewSessions.keyResultId })
        .from(krReviewParticipants)
        .innerJoin(krReviewSessions, eq(krReviewSessions.id, krReviewParticipants.reviewSessionId))
        .innerJoin(keyResults, eq(keyResults.id, krReviewSessions.keyResultId))
        .where(
          and(
            eq(krReviewParticipants.id, input.participantId),
            eq(keyResults.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      if (!row) throw notFound("Participant");
      await assertCanManageKr(row.keyResultId, ctx);
      await db.delete(krReviewParticipants).where(eq(krReviewParticipants.id, input.participantId));
      return { ok: true };
    }),
});
