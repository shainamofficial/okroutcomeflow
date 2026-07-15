import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { keyResults, krReviewCadence, krReviewSessions, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

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
});
