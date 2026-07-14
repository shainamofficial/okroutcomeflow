import { describe, expect, it, vi } from "vitest";

// The router imports the db client at module level; mock it so tests never
// need a DATABASE_URL or a live connection. The gating tests below reject
// before any resolver (and therefore any query) runs.
vi.mock("./db/client", () => ({ db: {} }));

import { appRouter } from "./router";

describe("protectedProcedure gating", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller({ userId: null, orgId: null });
    await expect(caller.objectives.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects authenticated users without an active org with FORBIDDEN", async () => {
    const caller = appRouter.createCaller({ userId: "user-1", orgId: null });
    await expect(caller.objectives.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("public procedures", () => {
  it("ping responds without authentication", async () => {
    const caller = appRouter.createCaller({ userId: null, orgId: null });
    const res = await caller.ping({ echo: "hello" });
    expect(res.pong).toBe(true);
    expect(res.echo).toBe("hello");
  });

  it("ping rejects oversized echo input", async () => {
    const caller = appRouter.createCaller({ userId: null, orgId: null });
    await expect(caller.ping({ echo: "x".repeat(201) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
