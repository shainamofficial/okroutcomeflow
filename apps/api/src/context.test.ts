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
