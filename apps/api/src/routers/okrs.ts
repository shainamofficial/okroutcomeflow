import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { keyResults, usersProfile } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

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
});
