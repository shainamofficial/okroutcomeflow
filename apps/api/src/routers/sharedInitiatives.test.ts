import { beforeEach, describe, expect, it, vi } from "vitest";

// Public share viewer — gated by an active token + an allow-listed viewer
// email. Mock the sequential db.select calls.
const { selectQueue } = vi.hoisted(() => ({ selectQueue: vi.fn(() => [] as unknown[]) }));

vi.mock("../lib/roles", () => ({
  getActor: vi.fn(),
  getCallerRoles: vi.fn().mockResolvedValue([]),
  isCallerPlatformAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("../db/client", () => {
  const thenable = (resolve: () => unknown): unknown =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then") {
            return (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
              Promise.resolve(resolve()).then(onF, onR);
          }
          return () => thenable(resolve);
        },
      }
    );
  return { db: { select: () => thenable(() => selectQueue()) } };
});

import { appRouter } from "../router";

const anon = { userId: null, orgId: null };
const call = (token: string, email: string) =>
  appRouter.createCaller(anon).sharedInitiatives.get({ token, email });

beforeEach(() => {
  selectQueue.mockReset().mockReturnValue([]);
});

describe("sharedInitiatives.get", () => {
  it("NOT_FOUND when the token doesn't match a link", async () => {
    selectQueue.mockReturnValueOnce([]); // link miss
    await expect(call("bad", "a@co.com")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("FORBIDDEN when the link is deactivated", async () => {
    selectQueue.mockReturnValueOnce([{ id: "l1", initiativeId: "i1", isActive: false }]);
    await expect(call("t", "a@co.com")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("FORBIDDEN when the email is not an allow-listed viewer", async () => {
    selectQueue
      .mockReturnValueOnce([{ id: "l1", initiativeId: "i1", isActive: true }]) // link
      .mockReturnValueOnce([]); // viewer miss
    await expect(call("t", "a@co.com")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns the shaped shared data for an authorized viewer", async () => {
    selectQueue
      .mockReturnValueOnce([{ id: "l1", initiativeId: "i1", isActive: true }]) // link
      .mockReturnValueOnce([{ id: "v1" }]) // viewer
      .mockReturnValueOnce([
        {
          id: "i1",
          title: "Launch",
          description: null,
          status: "in_progress",
          start_date: null,
          end_date: null,
          created_at: "now",
          owner_id: "u1",
          owner_name: "Owner",
        },
      ]) // initiative
      .mockReturnValueOnce([]) // tasks
      .mockReturnValueOnce([]) // krLinks (no KRs -> skips metric queries)
      .mockReturnValueOnce([]); // updates
    const res = await call("t", "A@co.com");
    expect(res.initiative).toMatchObject({ id: "i1", title: "Launch", owner: { id: "u1", name: "Owner" } });
    expect(res.tasks).toEqual([]);
    expect(res.krLinks).toEqual([]);
    expect(res.updates).toEqual([]);
  });
});
