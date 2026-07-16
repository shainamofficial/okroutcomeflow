import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@okroutcomeflow/shared";

// orgUsers status/role changes are admin-only (perms.orgUsers.updateStatus /
// updateRole = isAdmin). Verify managers are blocked and admins allowed.
const { getActorMock, selectRows, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  selectRows: vi.fn(() => [{ id: "target" }]),
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
      return thenable(() => undefined);
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

const member = { userId: "user-1", orgId: "org-1" };
const TARGET = "2b671a64-40d5-491e-99b0-da01ff1f3341";
const actor = (roles: Actor["roles"]): Actor => ({ userId: "user-1", roles });

beforeEach(() => {
  getActorMock.mockReset();
  selectRows.mockReset().mockReturnValue([{ id: "target" }]);
  writeSpy.mockReset();
});

describe("orgUsers.updateStatus", () => {
  it("FORBIDDEN for a manager (admin-only)", async () => {
    getActorMock.mockResolvedValue(actor(["manager"]));
    await expect(
      appRouter.createCaller(member).orgUsers.updateStatus({ userId: TARGET, status: "inactive" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("allows an admin and writes", async () => {
    getActorMock.mockResolvedValue(actor(["admin"]));
    await appRouter.createCaller(member).orgUsers.updateStatus({ userId: TARGET, status: "inactive" });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });

  it("NOT_FOUND when the target isn't in the caller's org", async () => {
    selectRows.mockReturnValue([]);
    getActorMock.mockResolvedValue(actor(["admin"]));
    await expect(
      appRouter.createCaller(member).orgUsers.updateStatus({ userId: TARGET, status: "active" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("orgUsers.updateRole", () => {
  it("FORBIDDEN for a manager", async () => {
    getActorMock.mockResolvedValue(actor(["manager"]));
    await expect(
      appRouter.createCaller(member).orgUsers.updateRole({ userId: TARGET, newRole: "admin" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin (delete + insert in a transaction)", async () => {
    getActorMock.mockResolvedValue(actor(["admin"]));
    await appRouter.createCaller(member).orgUsers.updateRole({ userId: TARGET, newRole: "contributor" });
    expect(writeSpy).toHaveBeenCalledWith("delete");
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});
