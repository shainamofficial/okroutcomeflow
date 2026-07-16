import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { initiatives, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

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
});
