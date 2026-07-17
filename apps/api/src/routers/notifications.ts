import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { notificationPreferences, notifications } from "../db/schema";
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

  // Per-user notification-channel preferences (org-independent). Mirrors the
  // RLS user_id = auth.uid() policy — always scoped to the caller.
  preferences: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        id: notificationPreferences.id,
        user_id: notificationPreferences.userId,
        notification_type: notificationPreferences.notificationType,
        in_app_enabled: notificationPreferences.inAppEnabled,
        email_enabled: notificationPreferences.emailEnabled,
      })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.userId))
  ),

  upsertPreference: protectedProcedure
    .input(
      z.object({
        notification_type: z.string().min(1),
        in_app_enabled: z.boolean(),
        email_enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(notificationPreferences)
        .values({
          userId: ctx.userId,
          notificationType: input.notification_type,
          inAppEnabled: input.in_app_enabled,
          emailEnabled: input.email_enabled,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [notificationPreferences.userId, notificationPreferences.notificationType],
          set: {
            inAppEnabled: input.in_app_enabled,
            emailEnabled: input.email_enabled,
            updatedAt: new Date().toISOString(),
          },
        });
      return { ok: true };
    }),
});
