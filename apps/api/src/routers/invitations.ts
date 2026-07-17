import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { user as baUser } from "../auth/schema";
import {
  organizationMemberships,
  userInvitations,
  userRoles,
  usersProfile,
} from "../db/schema";
import { managerProcedure, publicProcedure, router, userProcedure } from "../trpc";

const appRole = z.enum(["admin", "manager", "contributor", "viewer"]);

/** sha256 hex of the raw token — mirrors the DB's
 * `encode(digest(token, 'sha256'), 'hex')` so lookups match token_hash. */
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const invitationsRouter = router({
  // Excludes token/token_hash (the sensitive columns the user_invitations_safe
  // view hid). managerProcedure enforces admin/manager.
  list: managerProcedure.query(({ ctx }) =>
    db
      .select({
        id: userInvitations.id,
        email: userInvitations.email,
        role: userInvitations.role,
        status: userInvitations.status,
        created_at: userInvitations.createdAt,
        expires_at: userInvitations.expiresAt,
      })
      .from(userInvitations)
      .where(eq(userInvitations.organizationId, ctx.orgId))
      .orderBy(desc(userInvitations.createdAt))
  ),

  create: managerProcedure
    .input(z.object({ email: z.string().email(), role: appRole }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const [existingUser] = await db
        .select({ id: usersProfile.id })
        .from(usersProfile)
        .where(eq(usersProfile.email, email))
        .limit(1);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      }

      const [existingInvite] = await db
        .select({ id: userInvitations.id })
        .from(userInvitations)
        .where(
          and(
            eq(userInvitations.email, email),
            eq(userInvitations.status, "pending"),
            eq(userInvitations.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invitation already exists for this email",
        });
      }

      // Plaintext token for the share link; the hash_invitation_token BEFORE
      // INSERT trigger derives token_hash and sets expires_at.
      const token = randomBytes(32).toString("hex");
      const [created] = await db
        .insert(userInvitations)
        .values({ organizationId: ctx.orgId, email, role: input.role, token, status: "pending" })
        .returning({
          id: userInvitations.id,
          email: userInvitations.email,
          role: userInvitations.role,
          status: userInvitations.status,
          created_at: userInvitations.createdAt,
          expires_at: userInvitations.expiresAt,
          token: userInvitations.token,
        });
      return created;
    }),

  revoke: managerProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ id: userInvitations.id })
        .from(userInvitations)
        .where(
          and(
            eq(userInvitations.id, input.invitationId),
            eq(userInvitations.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      await db
        .update(userInvitations)
        .set({ status: "revoked" })
        .where(eq(userInvitations.id, input.invitationId));
      return { ok: true };
    }),

  // Public — validates a share-link token and returns the (non-sensitive)
  // invitation so the accept page can render before the user authenticates.
  // Port of get_invitation_by_token: hash-lookup + not-expired filter.
  byToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const [inv] = await db
        .select({
          id: userInvitations.id,
          organization_id: userInvitations.organizationId,
          email: userInvitations.email,
          role: userInvitations.role,
          status: userInvitations.status,
        })
        .from(userInvitations)
        .where(
          and(
            eq(userInvitations.tokenHash, hashToken(input.token)),
            or(isNull(userInvitations.expiresAt), gt(userInvitations.expiresAt, sql`now()`))
          )
        )
        .limit(1);
      return inv ?? null;
    }),

  // Accept an invitation for the authenticated caller. Port of the
  // accept_invitation RPC: same validation and the same two-branch
  // provisioning (existing user gets an inactive membership to the new org;
  // a freshly-provisioned user is re-homed to the invited org as active).
  accept: userProcedure
    .input(z.object({ token: z.string().min(1), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [inv] = await db
        .select({
          id: userInvitations.id,
          organizationId: userInvitations.organizationId,
          email: userInvitations.email,
          role: userInvitations.role,
          status: userInvitations.status,
          expiresAt: userInvitations.expiresAt,
        })
        .from(userInvitations)
        .where(eq(userInvitations.tokenHash, hashToken(input.token)))
        .limit(1);

      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation token" });
      if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired" });
      }
      if (inv.status === "revoked") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has been revoked" });
      }
      if (inv.status === "accepted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has already been used" });
      }

      const [authUser] = await db
        .select({ email: baUser.email })
        .from(baUser)
        .where(eq(baUser.id, ctx.userId))
        .limit(1);
      if (!authUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      if (inv.email.trim().toLowerCase() !== authUser.email.trim().toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invitation email does not match user email",
        });
      }

      const [profile] = await db
        .select({ organizationId: usersProfile.organizationId })
        .from(usersProfile)
        .where(eq(usersProfile.id, ctx.userId))
        .limit(1);

      const name = (input.name ?? "").trim();

      await db.transaction(async (tx) => {
        if (profile?.organizationId) {
          // Existing user joining a new org: add role + an INACTIVE membership
          // (don't steal their active org). Idempotent.
          await tx
            .insert(organizationMemberships)
            .values({ userId: ctx.userId, organizationId: inv.organizationId, isActive: false })
            .onConflictDoNothing();
          await tx
            .insert(userRoles)
            .values({ userId: ctx.userId, role: inv.role, organizationId: inv.organizationId })
            .onConflictDoNothing();
        } else {
          // Freshly-provisioned user: re-home to the invited org as active,
          // replacing the auto-provisioned role with the invited one.
          await tx
            .update(usersProfile)
            .set({
              organizationId: inv.organizationId,
              status: "active",
              ...(name ? { name } : {}),
            })
            .where(eq(usersProfile.id, ctx.userId));
          await tx.delete(userRoles).where(eq(userRoles.userId, ctx.userId));
          await tx
            .insert(userRoles)
            .values({ userId: ctx.userId, role: inv.role, organizationId: inv.organizationId });
          await tx
            .insert(organizationMemberships)
            .values({ userId: ctx.userId, organizationId: inv.organizationId, isActive: true })
            .onConflictDoUpdate({
              target: [organizationMemberships.userId, organizationMemberships.organizationId],
              set: { isActive: true },
            });
        }

        // Burn the token so the link can't be reused.
        await tx
          .update(userInvitations)
          .set({ status: "accepted", token: null, tokenHash: null })
          .where(eq(userInvitations.id, inv.id));
      });

      return { ok: true, organizationId: inv.organizationId };
    }),
});
