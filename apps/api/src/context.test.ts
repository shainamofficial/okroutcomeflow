import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

const limitMock = vi.fn();
vi.mock("./db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: limitMock }),
      }),
    }),
  },
}));

// Better Auth session lookup — these tests exercise the Supabase-token
// fallback, so getSession returns no session by default.
const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn().mockResolvedValue(null),
}));
vi.mock("./auth/auth", () => ({ auth: { api: { getSession: getSessionMock } } }));

import { createContext } from "./context";

const fetchMock = vi.fn();

function opts(headers: Record<string, string> = {}): FetchCreateContextFnOptions {
  return {
    req: new Request("http://localhost/trpc", { headers }),
    resHeaders: new Headers(),
  } as unknown as FetchCreateContextFnOptions;
}

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://test-project.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  limitMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createContext", () => {
  beforeEach(() => getSessionMock.mockReset().mockResolvedValue(null));

  it("uses the Better Auth session when present and does NOT call Supabase", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "ba-user" } });
    limitMock.mockResolvedValue([{ orgId: "org-ba" }]);
    const ctx = await createContext(opts({ authorization: "Bearer supabase-token" }));
    expect(ctx).toEqual({ userId: "ba-user", orgId: "org-ba" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the Supabase token when there is no Better Auth session", async () => {
    getSessionMock.mockResolvedValue(null);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "sb-user" }) });
    limitMock.mockResolvedValue([{ orgId: "org-sb" }]);
    const ctx = await createContext(opts({ authorization: "Bearer valid-token" }));
    expect(ctx).toEqual({ userId: "sb-user", orgId: "org-sb" });
  });

  it("is anonymous without an Authorization header and never calls Supabase", async () => {
    const ctx = await createContext(opts());
    expect(ctx).toEqual({ userId: null, orgId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is anonymous for non-Bearer Authorization schemes", async () => {
    const ctx = await createContext(opts({ authorization: "Basic dXNlcjpwYXNz" }));
    expect(ctx).toEqual({ userId: null, orgId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is anonymous when Supabase rejects the token", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    const ctx = await createContext(opts({ authorization: "Bearer forged-token" }));
    expect(ctx).toEqual({ userId: null, orgId: null });
  });

  it("is anonymous when the Supabase call throws (network failure)", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const ctx = await createContext(opts({ authorization: "Bearer some-token" }));
    expect(ctx).toEqual({ userId: null, orgId: null });
  });

  it("resolves userId and active orgId for a valid token with membership", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-123" }),
    });
    limitMock.mockResolvedValue([{ orgId: "org-456" }]);

    const ctx = await createContext(opts({ authorization: "Bearer valid-token" }));
    expect(ctx).toEqual({ userId: "user-123", orgId: "org-456" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test-project.supabase.co/auth/v1/user",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer valid-token" }),
      })
    );
  });

  it("resolves userId with null orgId when the user has no active membership", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-123" }),
    });
    limitMock.mockResolvedValue([]);

    const ctx = await createContext(opts({ authorization: "Bearer valid-token" }));
    expect(ctx).toEqual({ userId: "user-123", orgId: null });
  });

  it("is anonymous when server env is missing, even with a token", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    const ctx = await createContext(opts({ authorization: "Bearer valid-token" }));
    expect(ctx).toEqual({ userId: null, orgId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
