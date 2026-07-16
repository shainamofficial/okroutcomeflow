import { beforeEach, describe, expect, it, vi } from "vitest";

const { rolesMock, selectMock } = vi.hoisted(() => ({
  rolesMock: vi.fn(),
  selectMock: vi.fn(),
}));

vi.mock("./lib/roles", () => ({ getCallerRoles: rolesMock }));
vi.mock("./db/client", () => ({ db: { select: selectMock } }));

import { appRouter } from "./router";

/** Thenable chainable stand-in for a drizzle query builder: any method
 * call returns itself; awaiting it resolves to the given rows. */
function rowsChain(rows: unknown[]) {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
            Promise.resolve(rows).then(onFulfilled, onRejected);
        }
        return () => proxy;
      },
    }
  );
  return proxy;
}

const anon = { userId: null, orgId: null };
const noOrg = { userId: "user-1", orgId: null };
const member = { userId: "user-1", orgId: "org-1" };

beforeEach(() => {
  rolesMock.mockReset();
  selectMock.mockReset();
});

describe("protectedProcedure gating", () => {
  const cases: Array<[string, (caller: ReturnType<typeof appRouter.createCaller>) => Promise<unknown>]> = [
    ["objectives.list", (c) => c.objectives.list()],
    ["myItems.keyResults", (c) => c.myItems.keyResults()],
    ["myItems.initiatives", (c) => c.myItems.initiatives()],
    ["myItems.tasks", (c) => c.myItems.tasks()],
    ["orgUsers.list", (c) => c.orgUsers.list()],
    ["search.global", (c) => c.search.global({ query: "ab" })],
    ["teams.list", (c) => c.teams.list()],
    ["teams.members", (c) => c.teams.members({ teamId: "1b671a64-40d5-491e-99b0-da01ff1f3341" })],
    ["reviews.cadence", (c) => c.reviews.cadence({ keyResultId: "1b671a64-40d5-491e-99b0-da01ff1f3341" })],
    ["reviews.sessions", (c) => c.reviews.sessions({ keyResultId: "1b671a64-40d5-491e-99b0-da01ff1f3341" })],
    ["reviews.allSessions", (c) => c.reviews.allSessions()],
    ["dashboard.get", (c) => c.dashboard.get()],
  ];

  it.each(cases)("%s rejects anonymous callers with UNAUTHORIZED", async (_name, call) => {
    await expect(call(appRouter.createCaller(anon))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it.each(cases)("%s rejects callers without an active org with FORBIDDEN", async (_name, call) => {
    await expect(call(appRouter.createCaller(noOrg))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("managerProcedure (orgUsers.list)", () => {
  it("rejects contributors with FORBIDDEN", async () => {
    rolesMock.mockResolvedValue(["contributor"]);
    const caller = appRouter.createCaller(member);
    await expect(caller.orgUsers.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(rolesMock).toHaveBeenCalledWith("user-1", "org-1");
  });

  it("allows managers and groups one row per user with collected roles", async () => {
    rolesMock.mockResolvedValue(["manager"]);
    selectMock.mockReturnValue(
      rowsChain([
        { id: "u1", name: "Alice", email: "a@x.co", status: "active", created_at: "t1", role: "admin" },
        { id: "u1", name: "Alice", email: "a@x.co", status: "active", created_at: "t1", role: "manager" },
        { id: "u2", name: "Bob", email: "b@x.co", status: "pending", created_at: "t2", role: null },
      ])
    );

    const caller = appRouter.createCaller(member);
    const users = await caller.orgUsers.list();

    expect(users).toEqual([
      { id: "u1", name: "Alice", email: "a@x.co", status: "active", created_at: "t1", roles: ["admin", "manager"] },
      { id: "u2", name: "Bob", email: "b@x.co", status: "pending", created_at: "t2", roles: [] },
    ]);
  });
});

describe("uuid input validation", () => {
  it("teams.members rejects a non-uuid teamId", async () => {
    const caller = appRouter.createCaller(member);
    await expect(caller.teams.members({ teamId: "not-a-uuid" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("reviews.cadence rejects a non-uuid keyResultId", async () => {
    const caller = appRouter.createCaller(member);
    await expect(caller.reviews.cadence({ keyResultId: "42" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("search.global input validation", () => {
  it("rejects queries shorter than 2 characters", async () => {
    const caller = appRouter.createCaller(member);
    await expect(caller.search.global({ query: "a" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("rejects queries longer than 100 characters", async () => {
    const caller = appRouter.createCaller(member);
    await expect(caller.search.global({ query: "x".repeat(101) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("public procedures", () => {
  it("ping responds without authentication", async () => {
    const caller = appRouter.createCaller(anon);
    const res = await caller.ping({ echo: "hello" });
    expect(res.pong).toBe(true);
    expect(res.echo).toBe("hello");
  });

  it("ping rejects oversized echo input", async () => {
    const caller = appRouter.createCaller(anon);
    await expect(caller.ping({ echo: "x".repeat(201) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
