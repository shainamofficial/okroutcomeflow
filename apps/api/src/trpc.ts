import { initTRPC, TRPCError } from "@trpc/server";
import { isElevated, type Role } from "@okroutcomeflow/shared";
import type { Context } from "./context";
import { getCallerRoles } from "./lib/roles";

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

/**
 * Mirrors the RLS pattern `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')`
 * used by admin/manager-gated tables.
 */
export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roles = (await getCallerRoles(ctx.userId, ctx.orgId)) as Role[];
  if (!isElevated({ userId: ctx.userId, roles })) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager or admin role required" });
  }
  return next({ ctx: { ...ctx, roles } });
});
