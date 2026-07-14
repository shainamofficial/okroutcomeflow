import { initTRPC, TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "./context";
import { db } from "./db/client";
import { objectives } from "./db/schema";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  if (!ctx.orgId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No active organization" });
  }
  // Narrowed: downstream resolvers see non-null userId/orgId.
  return next({ ctx: { userId: ctx.userId, orgId: ctx.orgId } });
});

export const appRouter = router({
  ping: publicProcedure
    .input(z.object({ echo: z.string().max(200).optional() }).optional())
    .query(({ input }) => ({
      pong: true,
      echo: input?.echo ?? null,
      at: new Date().toISOString(),
    })),

  objectives: router({
    // First strangler procedure. Snake_case aliases keep the response
    // shape identical to what useObjectives got from Supabase directly,
    // so the frontend swap is a pure transport change.
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
  }),
});

// The frontend imports only this type (never the runtime router) to get
// end-to-end typed procedure calls without bundling server code.
export type AppRouter = typeof appRouter;
