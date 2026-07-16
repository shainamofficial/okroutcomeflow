import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { Actor, Role } from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { platformAdmins, userRoles, usersProfile } from "../db/schema";

/**
 * Roles the user holds in their active organization. Mirrors the SQL
 * has_role() semantics: rows with a NULL organization_id (pre-multi-org
 * legacy rows) count for whatever org is active.
 */
export async function getCallerRoles(userId: string, orgId: string): Promise<Role[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, orgId))
      )
    );
  return rows.map((r) => r.role as Role);
}

/** Mirrors is_platform_admin(): the user's email is in platform_admins. */
export async function isCallerPlatformAdmin(userId: string): Promise<boolean> {
  const rows = await db
    .select({ one: sql<number>`1` })
    .from(platformAdmins)
    .innerJoin(usersProfile, eq(sql`lower(${usersProfile.email})`, platformAdmins.email))
    .where(eq(usersProfile.id, userId))
    .limit(1);
  return rows.length > 0;
}

/** Builds the permission Actor for a caller: their org roles + platform-admin flag. */
export async function getActor(ctx: { userId: string; orgId: string }): Promise<Actor> {
  const [roles, isPlatformAdmin] = await Promise.all([
    getCallerRoles(ctx.userId, ctx.orgId),
    isCallerPlatformAdmin(ctx.userId),
  ]);
  return { userId: ctx.userId, roles, isPlatformAdmin };
}
