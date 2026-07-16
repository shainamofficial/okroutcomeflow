import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { notifications } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const notificationsRouter = router({
  // The caller's 50 most recent notifications — matches useNotifications.
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: notifications.id,
        user_id: notifications.userId,
        type: notifications.type,
        entity_type: notifications.entityType,
        entity_id: notifications.entityId,
        message: notifications.message,
        read: notifications.read,
        created_at: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, ctx.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50)
  ),

  // Both scoped to the caller's own notifications (mirrors the RLS
  // user_id = auth.uid() policy); no role check needed.
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.userId)));
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.userId), eq(notifications.read, false)));
    return { ok: true };
  }),
});
