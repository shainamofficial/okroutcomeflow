import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  ping: publicProcedure
    .input(z.object({ echo: z.string().max(200).optional() }).optional())
    .query(({ input }) => ({
      pong: true,
      echo: input?.echo ?? null,
      at: new Date().toISOString(),
    })),
});

// The frontend imports only this type (never the runtime router) to get
// end-to-end typed procedure calls without bundling server code.
export type AppRouter = typeof appRouter;
