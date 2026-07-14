import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { objectives } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

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
});
