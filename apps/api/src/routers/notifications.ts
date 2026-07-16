import { desc, eq } from "drizzle-orm";
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
});
