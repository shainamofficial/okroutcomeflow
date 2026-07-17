import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { automationsRouter } from "./routers/automations";
import { customFieldsRouter } from "./routers/custom-fields";
import { dashboardRouter } from "./routers/dashboard";
import { initiativesRouter } from "./routers/initiatives";
import { initiativeSharesRouter } from "./routers/initiativeShares";
import { invitationsRouter } from "./routers/invitations";
import { krMetricsRouter } from "./routers/krMetrics";
import { myItemsRouter } from "./routers/my-items";
import { notificationsRouter } from "./routers/notifications";
import { objectivesRouter } from "./routers/objectives";
import { okrsRouter } from "./routers/okrs";
import { platformRouter } from "./routers/platform";
import { orgUsersRouter } from "./routers/org-users";
import { reviewsRouter } from "./routers/reviews";
import { searchRouter } from "./routers/search";
import { sessionRouter } from "./routers/session";
import { tasksRouter } from "./routers/tasks";
import { teamsRouter } from "./routers/teams";
import { updatesRouter } from "./routers/updates";

export const appRouter = router({
  ping: publicProcedure
    .input(z.object({ echo: z.string().max(200).optional() }).optional())
    .query(({ input }) => ({
      pong: true,
      echo: input?.echo ?? null,
      at: new Date().toISOString(),
    })),

  objectives: objectivesRouter,
  okrs: okrsRouter,
  krMetrics: krMetricsRouter,
  initiatives: initiativesRouter,
  initiativeShares: initiativeSharesRouter,
  tasks: tasksRouter,
  notifications: notificationsRouter,
  myItems: myItemsRouter,
  orgUsers: orgUsersRouter,
  search: searchRouter,
  teams: teamsRouter,
  reviews: reviewsRouter,
  dashboard: dashboardRouter,
  updates: updatesRouter,
  customFields: customFieldsRouter,
  automations: automationsRouter,
  invitations: invitationsRouter,
  platform: platformRouter,
  session: sessionRouter,
});

// The frontend imports only this type (never the runtime router) to get
// end-to-end typed procedure calls without bundling server code.
export type AppRouter = typeof appRouter;
