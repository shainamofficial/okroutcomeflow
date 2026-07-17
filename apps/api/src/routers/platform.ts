import { asc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { organizations, platformAdmins, userRoles, usersProfile } from "../db/schema";
import { isCallerPlatformAdmin } from "../lib/roles";
import { platformProcedure, router, userProcedure } from "../trpc";

const appRole = z.enum(["admin", "manager", "contributor", "viewer"]);
const userStatus = z.enum(["pending", "active", "inactive"]);

const conflict = (message: string) => new TRPCError({ code: "CONFLICT", message });

export const platformRouter = router({
  // Whether the caller is a platform admin. Auth-only (NOT platformProcedure)
  // so any signed-in user can learn their own status — backs PlatformAdminContext.
  amIAdmin: userProcedure.query(({ ctx }) => isCallerPlatformAdmin(ctx.userId)),

  // --- platform admins ---
  admins: router({
    list: platformProcedure.query(() =>
      db
        .select({ id: platformAdmins.id, email: platformAdmins.email, created_at: platformAdmins.createdAt })
        .from(platformAdmins)
        .orderBy(asc(platformAdmins.createdAt))
    ),

    add: platformProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        try {
          await db.insert(platformAdmins).values({ email: input.email.trim().toLowerCase() });
        } catch (e) {
          if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "23505") {
            throw conflict("That email is already a platform admin");
          }
          throw e;
        }
        return { ok: true };
      }),

    remove: platformProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const [{ count }] = (await db.execute(
          sql`SELECT count(*)::int AS count FROM platform_admins`
        )) as unknown as [{ count: number }];
        if (count <= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove the last platform admin" });
        }
        await db.delete(platformAdmins).where(eq(platformAdmins.id, input.id));
        return { ok: true };
      }),
  }),

  // --- organizations ---
  orgs: router({
    list: platformProcedure.query(
      () =>
        db.execute(sql`
          SELECT o.id, o.name, o.logo_url, o.created_at,
            (SELECT count(*) FROM users_profile up WHERE up.organization_id = o.id)::int AS user_count,
            (SELECT count(*) FROM teams t WHERE t.organization_id = o.id)::int AS team_count,
            (SELECT count(*) FROM objectives ob WHERE ob.organization_id = o.id)::int AS objective_count
          FROM organizations o
          ORDER BY o.created_at DESC
        `) as unknown as Promise<unknown[]>
    ),

    detail: platformProcedure
      .input(z.object({ orgId: z.string().uuid() }))
      .query(async ({ input }) => {
        const rows = (await db.execute(sql`
          SELECT jsonb_build_object(
            'id', o.id, 'name', o.name, 'logo_url', o.logo_url, 'created_at', o.created_at,
            'domains', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', d.id, 'domain', d.domain, 'verified', d.verified))
                                 FROM organization_domains d WHERE d.organization_id = o.id), '[]'::jsonb),
            'users', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                 'id', up.id, 'name', up.name, 'email', up.email, 'status', up.status,
                                 'created_at', up.created_at,
                                 'roles', COALESCE((SELECT jsonb_agg(ur.role) FROM user_roles ur WHERE ur.user_id = up.id), '[]'::jsonb)))
                               FROM users_profile up WHERE up.organization_id = o.id), '[]'::jsonb),
            'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                 'id', t.id, 'name', t.name,
                                 'member_count', (SELECT count(*)::int FROM team_members tm WHERE tm.team_id = t.id)))
                               FROM teams t WHERE t.organization_id = o.id), '[]'::jsonb),
            'objectives', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                 'id', ob.id, 'title', ob.title,
                                 'key_results_count', (SELECT count(*)::int FROM key_results kr WHERE kr.objective_id = ob.id)))
                               FROM objectives ob WHERE ob.organization_id = o.id), '[]'::jsonb)
          ) AS payload
          FROM organizations o WHERE o.id = ${input.orgId}
        `)) as unknown as Array<{ payload: unknown }>;
        return rows[0]?.payload ?? null;
      }),

    delete: platformProcedure
      .input(z.object({ orgId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await db.delete(organizations).where(eq(organizations.id, input.orgId));
        return { ok: true };
      }),
  }),

  // --- users (cross-org) ---
  users: router({
    list: platformProcedure.query(
      () =>
        db.execute(sql`
          SELECT up.id, up.name, up.email, up.status, up.created_at, up.organization_id,
            o.name AS organization_name,
            COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
          FROM users_profile up
          LEFT JOIN organizations o ON o.id = up.organization_id
          LEFT JOIN user_roles ur ON ur.user_id = up.id
          GROUP BY up.id, o.name
          ORDER BY up.created_at DESC
        `) as unknown as Promise<unknown[]>
    ),

    updateStatus: platformProcedure
      .input(z.object({ userId: z.string().uuid(), status: userStatus }))
      .mutation(async ({ input }) => {
        await db.update(usersProfile).set({ status: input.status }).where(eq(usersProfile.id, input.userId));
        return { ok: true };
      }),

    updateRole: platformProcedure
      .input(z.object({ userId: z.string().uuid(), role: appRole }))
      .mutation(async ({ input }) => {
        // Scope the replacement to the target user's org (the old client path
        // cleared all rows and inserted without an org).
        const [profile] = await db
          .select({ orgId: usersProfile.organizationId })
          .from(usersProfile)
          .where(eq(usersProfile.id, input.userId))
          .limit(1);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        await db.transaction(async (tx) => {
          await tx.delete(userRoles).where(eq(userRoles.userId, input.userId));
          await tx
            .insert(userRoles)
            .values({ userId: input.userId, role: input.role, organizationId: profile.orgId });
        });
        return { ok: true };
      }),

    delete: platformProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await db.delete(usersProfile).where(eq(usersProfile.id, input.userId));
        return { ok: true };
      }),
  }),
});
