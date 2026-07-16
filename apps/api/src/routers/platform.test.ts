import { beforeEach, describe, expect, it, vi } from "vitest";

// Platform ops require isCallerPlatformAdmin. Also verify last-admin
// protection on removal.
const { isPlatformAdminMock, executeMock, writeSpy } = vi.hoisted(() => ({
  isPlatformAdminMock: vi.fn(() => Promise.resolve(false)),
  executeMock: vi.fn((): Promise<unknown[]> => Promise.resolve([{ count: 2 }])),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  isCallerPlatformAdmin: isPlatformAdminMock,
  getCallerRoles: vi.fn().mockResolvedValue([]),
  getActor: vi.fn(),
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
    select: () => thenable(() => [{ orgId: "org-1" }]),
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
    execute: () => executeMock(),
  };
  return { db: { ...handle, transaction: async (cb: (tx: typeof handle) => unknown) => cb(handle) } };
});

import { appRouter } from "../router";

const caller = () => appRouter.createCaller({ userId: "user-1", orgId: null });
const ID = "1b671a64-40d5-491e-99b0-da01ff1f3341";

beforeEach(() => {
  isPlatformAdminMock.mockReset().mockResolvedValue(false);
  executeMock.mockReset().mockResolvedValue([{ count: 2 }]);
  writeSpy.mockReset();
});

describe("platform gate", () => {
  it("FORBIDDEN for a non-platform-admin (even an org admin)", async () => {
    isPlatformAdminMock.mockResolvedValue(false);
    await expect(caller().platform.admins.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a platform admin", async () => {
    isPlatformAdminMock.mockResolvedValue(true);
    await expect(caller().platform.admins.list()).resolves.toBeDefined();
  });
});

describe("platform.admins.remove last-admin protection", () => {
  it("BAD_REQUEST when only one platform admin remains", async () => {
    isPlatformAdminMock.mockResolvedValue(true);
    executeMock.mockResolvedValue([{ count: 1 }]);
    await expect(caller().platform.admins.remove({ id: ID })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("removes when more than one remains", async () => {
    isPlatformAdminMock.mockResolvedValue(true);
    executeMock.mockResolvedValue([{ count: 3 }]);
    await caller().platform.admins.remove({ id: ID });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });
});
