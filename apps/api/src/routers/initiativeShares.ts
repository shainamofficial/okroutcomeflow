import { and, asc, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { initiatives, initiativeShareLinks, initiativeShareViewers } from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Not found in your organization" });

const linkShape = {
  id: initiativeShareLinks.id,
  initiative_id: initiativeShareLinks.initiativeId,
  token: initiativeShareLinks.token,
  created_by: initiativeShareLinks.createdBy,
  is_active: initiativeShareLinks.isActive,
  created_at: initiativeShareLinks.createdAt,
};

const viewerShape = {
  id: initiativeShareViewers.id,
  share_link_id: initiativeShareViewers.shareLinkId,
  email: initiativeShareViewers.email,
  created_at: initiativeShareViewers.createdAt,
};

/** Initiative owner, scoped to the caller's org (null = not visible). */
async function initiativeById(initiativeId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: initiatives.ownerId })
    .from(initiatives)
    .where(and(eq(initiatives.id, initiativeId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/** Initiative owner for a share link, via the link, scoped to org. */
async function initiativeByLink(linkId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: initiatives.ownerId })
    .from(initiativeShareLinks)
    .innerJoin(initiatives, eq(initiatives.id, initiativeShareLinks.initiativeId))
    .where(and(eq(initiativeShareLinks.id, linkId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/** Initiative owner for a viewer, via link + initiative, scoped to org. */
async function initiativeByViewer(viewerId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: initiatives.ownerId })
    .from(initiativeShareViewers)
    .innerJoin(initiativeShareLinks, eq(initiativeShareLinks.id, initiativeShareViewers.shareLinkId))
    .innerJoin(initiatives, eq(initiatives.id, initiativeShareLinks.initiativeId))
    .where(and(eq(initiativeShareViewers.id, viewerId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

const canManage = (actor: perms.Actor, ownerId: string | null) =>
  perms.initiatives.manageShareLinks(actor, { ownerId });

export const initiativeSharesRouter = router({
  // Latest share link for an initiative (or null). Viewing is a manage
  // action per RLS, so it requires initiative-manage rights.
  link: protectedProcedure
    .input(z.object({ initiativeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const initiative = await initiativeById(input.initiativeId, ctx.orgId);
      if (!initiative) return null;
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      const [row] = await db
        .select(linkShape)
        .from(initiativeShareLinks)
        .where(eq(initiativeShareLinks.initiativeId, input.initiativeId))
        .orderBy(desc(initiativeShareLinks.createdAt))
        .limit(1);
      return row ?? null;
    }),

  viewers: protectedProcedure
    .input(z.object({ shareLinkId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const initiative = await initiativeByLink(input.shareLinkId, ctx.orgId);
      if (!initiative) return [];
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      return db
        .select(viewerShape)
        .from(initiativeShareViewers)
        .where(eq(initiativeShareViewers.shareLinkId, input.shareLinkId))
        .orderBy(asc(initiativeShareViewers.createdAt));
    }),

  createLink: protectedProcedure
    .input(z.object({ initiativeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const initiative = await initiativeById(input.initiativeId, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      const [created] = await db
        .insert(initiativeShareLinks)
        .values({ initiativeId: input.initiativeId, createdBy: ctx.userId })
        .returning(linkShape);
      return created;
    }),

  toggleLink: protectedProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const initiative = await initiativeByLink(input.id, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      await db
        .update(initiativeShareLinks)
        .set({ isActive: input.isActive })
        .where(eq(initiativeShareLinks.id, input.id));
      return { ok: true };
    }),

  addViewer: protectedProcedure
    .input(z.object({ shareLinkId: z.string().uuid(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const initiative = await initiativeByLink(input.shareLinkId, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      const [created] = await db
        .insert(initiativeShareViewers)
        .values({ shareLinkId: input.shareLinkId, email: input.email.toLowerCase().trim() })
        .returning(viewerShape);
      return created;
    }),

  removeViewer: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const initiative = await initiativeByViewer(input.id, ctx.orgId);
      if (!initiative) throw notFound();
      const actor = await getActor(ctx);
      if (!canManage(actor, initiative.ownerId)) throw forbidden();
      await db.delete(initiativeShareViewers).where(eq(initiativeShareViewers.id, input.id));
      return { ok: true };
    }),
});
