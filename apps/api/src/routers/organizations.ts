import { and, asc, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import {
  genericDomains,
  organizationDomains,
  organizationMemberships,
  organizations,
  userRoles,
} from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router, userProcedure } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });

const orgShape = {
  id: organizations.id,
  name: organizations.name,
  logo_url: organizations.logoUrl,
  created_at: organizations.createdAt,
};

const domainShape = {
  id: organizationDomains.id,
  organization_id: organizationDomains.organizationId,
  domain: organizationDomains.domain,
  verified: organizationDomains.verified,
  created_at: organizationDomains.createdAt,
};

/** Mirrors the client normalizeDomain: trim, lowercase, strip a leading '@'. */
const normalizeDomain = (input: string) => {
  const d = input.trim().toLowerCase();
  return d.startsWith("@") ? d.slice(1) : d;
};

export const organizationsRouter = router({
  // The caller's active organization.
  current: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db.select(orgShape).from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1);
    return row ?? null;
  }),

  // Every organization the caller is a member of (for the org switcher).
  mine: protectedProcedure.query(({ ctx }) =>
    db
      .select(orgShape)
      .from(organizations)
      .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.userId, ctx.userId))
  ),

  domains: protectedProcedure.query(({ ctx }) =>
    db
      .select(domainShape)
      .from(organizationDomains)
      .where(eq(organizationDomains.organizationId, ctx.orgId))
      .orderBy(asc(organizationDomains.createdAt))
  ),

  // Admin-only, mirrors the "Admins can update their organization" policy.
  update: protectedProcedure
    .input(
      z.object({ name: z.string().min(1).optional(), logoUrl: z.string().nullish() }).refine(
        (v) => v.name !== undefined || v.logoUrl !== undefined,
        { message: "Nothing to update" }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.organization.update(actor)) throw forbidden();
      const set: { name?: string; logoUrl?: string | null } = {};
      if (input.name !== undefined) set.name = input.name.trim();
      if (input.logoUrl !== undefined) set.logoUrl = input.logoUrl ?? null;
      const [row] = await db
        .update(organizations)
        .set(set)
        .where(eq(organizations.id, ctx.orgId))
        .returning(orgShape);
      return row;
    }),

  // Any authenticated user may spin up a new org (becomes its admin). Port of
  // the create_new_organization RPC: org + inactive membership + admin role.
  create: userProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: "BAD_REQUEST", message: "Organization name is required" });
      const id = await db.transaction(async (tx) => {
        const [org] = await tx.insert(organizations).values({ name }).returning({ id: organizations.id });
        if (!org) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create organization" });
        await tx
          .insert(organizationMemberships)
          .values({ userId: ctx.userId, organizationId: org.id, isActive: false });
        await tx.insert(userRoles).values({ userId: ctx.userId, role: "admin", organizationId: org.id });
        return org.id;
      });
      return { id };
    }),

  addDomain: protectedProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.organization.manageDomains(actor)) throw forbidden();

      const domain = normalizeDomain(input.domain);
      if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Please enter a valid domain" });

      const [generic] = await db
        .select({ id: genericDomains.id })
        .from(genericDomains)
        .where(eq(genericDomains.domain, domain))
        .limit(1);
      if (generic) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Generic email domains like gmail.com, outlook.com, etc. cannot be added. Please use a corporate domain.",
        });
      }

      const [claimed] = await db
        .select({ id: organizationDomains.id })
        .from(organizationDomains)
        .where(and(eq(organizationDomains.domain, domain), ne(organizationDomains.organizationId, ctx.orgId)))
        .limit(1);
      if (claimed) {
        throw new TRPCError({ code: "CONFLICT", message: "Domain already claimed by another organization" });
      }

      const [created] = await db
        .insert(organizationDomains)
        .values({ organizationId: ctx.orgId, domain, verified: false })
        .returning(domainShape);
      return created;
    }),

  removeDomain: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.organization.manageDomains(actor)) throw forbidden();
      const [row] = await db
        .select({ id: organizationDomains.id })
        .from(organizationDomains)
        .where(and(eq(organizationDomains.id, input.id), eq(organizationDomains.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found in your organization" });
      await db.delete(organizationDomains).where(eq(organizationDomains.id, input.id));
      return { ok: true };
    }),

  setDomainVerified: protectedProcedure
    .input(z.object({ id: z.string().uuid(), verified: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.organization.manageDomains(actor)) throw forbidden();
      const [row] = await db
        .select({ id: organizationDomains.id })
        .from(organizationDomains)
        .where(and(eq(organizationDomains.id, input.id), eq(organizationDomains.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found in your organization" });
      await db
        .update(organizationDomains)
        .set({ verified: input.verified })
        .where(eq(organizationDomains.id, input.id));
      return { ok: true };
    }),
});
