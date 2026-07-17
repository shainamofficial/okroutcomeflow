import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@okroutcomeflow/shared";

// Share-link ops are gated by canManageInitiative (elevated OR the initiative
// owner). Mock getActor and the db select/write chains.
const { actorMock, selectQueue, insertReturn, writeSpy } = vi.hoisted(() => ({
  actorMock: vi.fn(),
  selectQueue: vi.fn(() => [] as unknown[]),
  insertReturn: vi.fn(() => [{}] as unknown[]),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  getActor: actorMock,
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
  return {
    db: {
      select: () => thenable(() => selectQueue()),
      insert: () => {
        writeSpy("insert");
        return thenable(() => insertReturn());
      },
      update: () => {
        writeSpy("update");
        return thenable(() => undefined);
      },
      delete: () => {
        writeSpy("delete");
        return thenable(() => undefined);
      },
    },
  };
});

import { appRouter } from "../router";

const caller = { userId: "user-1", orgId: "org-1" };
const asRoles = (roles: Role[]) =>
  actorMock.mockResolvedValue({ userId: "user-1", roles, isPlatformAdmin: false });

const INIT_ID = "11111111-1111-1111-1111-111111111111";
const LINK_ID = "22222222-2222-2222-2222-222222222222";
const VIEWER_ID = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  actorMock.mockReset();
  selectQueue.mockReset().mockReturnValue([]);
  insertReturn.mockReset().mockReturnValue([{}]);
  writeSpy.mockReset();
});

describe("initiativeShares.link", () => {
  it("returns null when the initiative is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    const res = await appRouter.createCaller(caller).initiativeShares.link({ initiativeId: INIT_ID });
    expect(res).toBeNull();
  });

  it("FORBIDDEN for a viewer who does not own the initiative", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: "another" }]);
    asRoles(["viewer"]);
    await expect(
      appRouter.createCaller(caller).initiativeShares.link({ initiativeId: INIT_ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns the latest link for a manager", async () => {
    selectQueue
      .mockReturnValueOnce([{ ownerId: null }]) // initiativeById
      .mockReturnValueOnce([{ id: LINK_ID, initiative_id: INIT_ID, is_active: true }]); // link
    asRoles(["manager"]);
    const res = await appRouter.createCaller(caller).initiativeShares.link({ initiativeId: INIT_ID });
    expect(res).toMatchObject({ id: LINK_ID, is_active: true });
  });
});

describe("initiativeShares.createLink", () => {
  it("NOT_FOUND when the initiative is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).initiativeShares.createLink({ initiativeId: INIT_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates for the initiative owner (contributor)", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: "user-1" }]);
    asRoles(["contributor"]);
    insertReturn.mockReturnValueOnce([{ id: LINK_ID, initiative_id: INIT_ID, is_active: true }]);
    const res = await appRouter
      .createCaller(caller)
      .initiativeShares.createLink({ initiativeId: INIT_ID });
    expect(res).toMatchObject({ id: LINK_ID });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});

describe("initiativeShares viewers", () => {
  it("viewers returns [] when the link is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    const res = await appRouter.createCaller(caller).initiativeShares.viewers({ shareLinkId: LINK_ID });
    expect(res).toEqual([]);
  });

  it("addViewer NOT_FOUND when the link is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).initiativeShares.addViewer({ shareLinkId: LINK_ID, email: "a@co.com" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("addViewer succeeds for a manager and lowercases the email", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: null }]);
    asRoles(["manager"]);
    insertReturn.mockReturnValueOnce([{ id: VIEWER_ID, share_link_id: LINK_ID, email: "a@co.com" }]);
    const res = await appRouter
      .createCaller(caller)
      .initiativeShares.addViewer({ shareLinkId: LINK_ID, email: "A@CO.com" });
    expect(res).toMatchObject({ id: VIEWER_ID, share_link_id: LINK_ID });
  });

  it("removeViewer NOT_FOUND when the viewer is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).initiativeShares.removeViewer({ id: VIEWER_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("removeViewer succeeds for a manager", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: null }]);
    asRoles(["manager"]);
    const res = await appRouter.createCaller(caller).initiativeShares.removeViewer({ id: VIEWER_ID });
    expect(res).toEqual({ ok: true });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });
});
