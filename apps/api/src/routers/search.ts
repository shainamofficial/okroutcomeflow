import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { initiatives, keyResults, objectives, tasks } from "../db/schema";
import { escapeLike } from "../lib/sql";
import { protectedProcedure, router } from "../trpc";

const RESULT_LIMIT = 5;

export const searchRouter = router({
  /**
   * Returns the same GroupedSearchResults shape useGlobalSearch built
   * client-side. Search input is escaped so % and _ match literally
   * (the old client version interpolated raw input into ilike).
   */
  global: protectedProcedure
    .input(z.object({ query: z.string().trim().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      const pattern = `%${escapeLike(input.query.toLowerCase())}%`;

      const [objectiveRows, krRows, initiativeRows, taskRows] = await Promise.all([
        db
          .select({ id: objectives.id, title: objectives.title, description: objectives.description })
          .from(objectives)
          .where(and(eq(objectives.organizationId, ctx.orgId), ilike(objectives.title, pattern)))
          .limit(RESULT_LIMIT),
        db
          .select({
            id: keyResults.id,
            title: keyResults.title,
            description: keyResults.description,
            objective_id: keyResults.objectiveId,
            objective_title: objectives.title,
          })
          .from(keyResults)
          .leftJoin(objectives, eq(objectives.id, keyResults.objectiveId))
          .where(and(eq(keyResults.organizationId, ctx.orgId), ilike(keyResults.title, pattern)))
          .limit(RESULT_LIMIT),
        db
          .select({ id: initiatives.id, title: initiatives.title, description: initiatives.description })
          .from(initiatives)
          .where(and(eq(initiatives.organizationId, ctx.orgId), ilike(initiatives.title, pattern)))
          .limit(RESULT_LIMIT),
        db
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            initiative_id: tasks.initiativeId,
            initiative_title: initiatives.title,
          })
          .from(tasks)
          .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
          .where(and(eq(initiatives.organizationId, ctx.orgId), ilike(tasks.title, pattern)))
          .limit(RESULT_LIMIT),
      ]);

      return {
        objectives: objectiveRows.map((o) => ({
          id: o.id,
          type: "objective" as const,
          title: o.title,
          description: o.description ?? undefined,
        })),
        keyResults: krRows.map((kr) => ({
          id: kr.id,
          type: "key_result" as const,
          title: kr.title,
          description: kr.description ?? undefined,
          parentId: kr.objective_id ?? undefined,
          parentTitle: kr.objective_title ?? undefined,
        })),
        initiatives: initiativeRows.map((i) => ({
          id: i.id,
          type: "initiative" as const,
          title: i.title,
          description: i.description ?? undefined,
        })),
        tasks: taskRows.map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          description: t.description ?? undefined,
          parentId: t.initiative_id,
          parentTitle: t.initiative_title ?? undefined,
        })),
      };
    }),
});
