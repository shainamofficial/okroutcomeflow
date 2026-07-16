import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth/auth";
import { db } from "./db/client";
import { organizationMemberships } from "./db/schema";

// Type alias (not interface) so it satisfies the adapter's
// Record<string, unknown> constraint on context objects.
export type Context = {
  userId: string | null;
  orgId: string | null;
};

interface SupabaseUser {
  id?: string;
}

/** Better Auth session (cookie or bearer) — the target auth. */
async function betterAuthUserId(req: Request): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Supabase access token — kept during the auth cutover so the app keeps
 * working while the frontend still authenticates with Supabase. */
async function supabaseUserId(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const authHeader = req.headers.get("authorization");
  if (!supabaseUrl || !anonKey || !authHeader?.startsWith("Bearer ")) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, authorization: authHeader },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as SupabaseUser;
    return user.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the caller's identity — Better Auth session first, then a
 * Supabase token as fallback — and their active organization.
 * Unauthenticated requests get a null context (rejected by the procedures,
 * not here).
 */
export async function createContext({ req }: FetchCreateContextFnOptions): Promise<Context> {
  const userId = (await betterAuthUserId(req)) ?? (await supabaseUserId(req));
  if (!userId) return { userId: null, orgId: null };

  const membership = await db
    .select({ orgId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.isActive, true)
      )
    )
    .limit(1);

  return { userId, orgId: membership[0]?.orgId ?? null };
}
