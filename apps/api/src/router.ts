import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { dashboardRouter } from "./routers/dashboard";
import { myItemsRouter } from "./routers/my-items";
import { objectivesRouter } from "./routers/objectives";
import { orgUsersRouter } from "./routers/org-users";
import { reviewsRouter } from "./routers/reviews";
import { searchRouter } from "./routers/search";
import { teamsRouter } from "./routers/teams";

export const appRouter = router({
  ping: publicProcedure
    .input(z.object({ echo: z.string().max(200).optional() }).optional())
    .query(({ input }) => ({
      pong: true,
      echo: input?.echo ?? null,
      at: new Date().toISOString(),
    })),

  objectives: objectivesRouter,
  myItems: myItemsRouter,
  orgUsers: orgUsersRouter,
  search: searchRouter,
  teams: teamsRouter,
  reviews: reviewsRouter,
  dashboard: dashboardRouter,
});

// The frontend imports only this type (never the runtime router) to get
// end-to-end typed procedure calls without bundling server code.
export type AppRouter = typeof appRouter;
