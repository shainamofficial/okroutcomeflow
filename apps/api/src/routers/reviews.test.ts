import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@okroutcomeflow/shared";

// Review writes gate on canManageKr (elevated or the KR's owner). Mock the
// KR-owner lookup (db.select) and getActor, then assert the branches.
const { getActorMock, selectRows, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  selectRows: vi.fn(() => [{ ownerId: "user-2" }]),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  getActor: getActorMock,
  getCallerRoles: vi.fn().mockResolvedValue([]),
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
  const handle = {
    select: () => thenable(() => selectRows()),
    insert: () => {
      writeSpy("insert");
      return thenable(() => [{ id: "new" }]);
    },
    update: () => {
      writeSpy("update");
      return thenable(() => undefined);
    },
    delete: () => {
      writeSpy("delete");
      return thenable(() => undefined);
    },
  };
  return { db: { ...handle, transaction: async (cb: (tx: typeof handle) => unknown) => cb(handle) } };
});

import { appRouter } from "../router";

const ME = "user-1";
const OTHER = "user-2";
const member = { userId: ME, orgId: "org-1" };
const KR = "1b671a64-40d5-491e-99b0-da01ff1f3341";
const actor = (roles: Actor["roles"]): Actor => ({ userId: ME, roles });

beforeEach(() => {
  getActorMock.mockReset();
  selectRows.mockReset().mockReturnValue([{ ownerId: OTHER }]);
  writeSpy.mockReset();
});

describe("reviews.deleteCadence (canManageKr)", () => {
  it("allows the KR owner even as a contributor", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await appRouter.createCaller(member).reviews.deleteCadence({ keyResultId: KR });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });

  it("FORBIDDEN for a contributor who doesn't own the KR", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).reviews.deleteCadence({ keyResultId: KR })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("allows a manager on someone else's KR", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["manager"]));
    await appRouter.createCaller(member).reviews.deleteCadence({ keyResultId: KR });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });

  it("NOT_FOUND when the KR isn't in the org", async () => {
    selectRows.mockReturnValue([]);
    getActorMock.mockResolvedValue(actor(["admin"]));
    await expect(
      appRouter.createCaller(member).reviews.deleteCadence({ keyResultId: KR })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("reviews.createSession (canManageKr)", () => {
  it("FORBIDDEN for a viewer who doesn't own the KR", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await expect(
      appRouter.createCaller(member).reviews.createSession({ keyResultId: KR, reviewDate: "2026-08-01" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows the KR owner", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await appRouter.createCaller(member).reviews.createSession({ keyResultId: KR, reviewDate: "2026-08-01" });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});
