import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { userInvitations, usersProfile } from "../db/schema";
import { managerProcedure, router } from "../trpc";

const appRole = z.enum(["admin", "manager", "contributor", "viewer"]);

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
});
