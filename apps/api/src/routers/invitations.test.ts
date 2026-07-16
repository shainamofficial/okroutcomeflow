import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@okroutcomeflow/shared";

// invitations.create is manager-only and rejects duplicate users / pending
// invites. Mock getCallerRoles (managerProcedure) and the db lookups.
const { rolesMock, selectQueue, writeSpy } = vi.hoisted(() => ({
  rolesMock: vi.fn(() => [] as Role[]),
  selectQueue: vi.fn(() => [] as unknown[]),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  getCallerRoles: rolesMock,
  getActor: vi.fn(),
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
        return thenable(() => [{ id: "inv", token: "tok" }]);
      },
      update: () => {
        writeSpy("update");
        return thenable(() => undefined);
      },
    },
  };
});

import { appRouter } from "../router";

const member = { userId: "user-1", orgId: "org-1" };

beforeEach(() => {
  rolesMock.mockReset().mockResolvedValue(["manager"]);
  selectQueue.mockReset().mockReturnValue([]);
  writeSpy.mockReset();
});

describe("invitations.create", () => {
  it("FORBIDDEN for a contributor (manager-only)", async () => {
    rolesMock.mockResolvedValue(["contributor"]);
    await expect(
      appRouter.createCaller(member).invitations.create({ email: "new@co.com", role: "contributor" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("CONFLICT when a user with that email already exists", async () => {
    selectQueue.mockReturnValueOnce([{ id: "existing-user" }]);
    await expect(
      appRouter.createCaller(member).invitations.create({ email: "dupe@co.com", role: "viewer" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("CONFLICT when a pending invite already exists", async () => {
    selectQueue.mockReturnValueOnce([]).mockReturnValueOnce([{ id: "pending" }]);
    await expect(
      appRouter.createCaller(member).invitations.create({ email: "pending@co.com", role: "viewer" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("creates and returns the invite (with token) when clear", async () => {
    selectQueue.mockReturnValue([]);
    const res = await appRouter
      .createCaller(member)
      .invitations.create({ email: "ok@co.com", role: "manager" });
    expect(res).toMatchObject({ id: "inv", token: "tok" });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});
