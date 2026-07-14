import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { and, eq } from "drizzle-orm";
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

/**
 * Verifies the caller's Supabase access token by asking Supabase Auth
 * directly (no JWT secret needed server-side), then resolves the user's
 * active organization. Unauthenticated requests get a null context and
 * are rejected by protectedProcedure, not here.
 */
export async function createContext({ req }: FetchCreateContextFnOptions): Promise<Context> {
  const anonymous: Context = { userId: null, orgId: null };

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const authHeader = req.headers.get("authorization");

  if (!supabaseUrl || !anonKey || !authHeader?.startsWith("Bearer ")) {
    return anonymous;
  }

  let user: SupabaseUser;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, authorization: authHeader },
    });
    if (!res.ok) return anonymous;
    user = (await res.json()) as SupabaseUser;
  } catch {
    return anonymous;
  }
  if (!user.id) return anonymous;

  const membership = await db
    .select({ orgId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, user.id),
        eq(organizationMemberships.isActive, true)
      )
    )
    .limit(1);

  return { userId: user.id, orgId: membership[0]?.orgId ?? null };
}
