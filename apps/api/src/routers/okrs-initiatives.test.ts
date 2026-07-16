import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@okroutcomeflow/shared";

// Verifies the objectives / okrs / initiatives routers wire the shared
// permission rules correctly. Rules themselves are proven in
// permissions.test.ts; here we mock the db + getActor and assert the
// FORBIDDEN / NOT_FOUND / allowed branches.
const { getActorMock, selectRows, insertReturning, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  selectRows: vi.fn(() => [] as unknown[]),
  insertReturning: vi.fn(() => [{ id: "new-id" }]),
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
    insert: () => thenable(() => insertReturning()),
    update: () => {
      writeSpy("update");
      return thenable(() => undefined);
    },
    delete: () => {
      writeSpy("delete");
      return thenable(() => undefined);
    },
  };
  return {
    db: {
      ...handle,
      transaction: async (cb: (tx: typeof handle) => unknown) => cb(handle),
    },
  };
});

import { appRouter } from "../router";

const ME = "user-1";
const OTHER = "user-2";
const member = { userId: ME, orgId: "org-1" };
const ID = "1b671a64-40d5-491e-99b0-da01ff1f3341";

const actor = (roles: Actor["roles"], overrides: Partial<Actor> = {}): Actor => ({
  userId: ME,
  roles,
  ...overrides,
});

beforeEach(() => {
  getActorMock.mockReset();
  selectRows.mockReset().mockReturnValue([{ id: ID, ownerId: OTHER }]);
  insertReturning.mockReset().mockReturnValue([{ id: "new-id" }]);
  writeSpy.mockReset();
});

describe("objectives mutations (elevated-only)", () => {
  it("create: FORBIDDEN for a contributor", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).objectives.create({ title: "O" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("create: manager allowed", async () => {
    getActorMock.mockResolvedValue(actor(["manager"]));
    await expect(
      appRouter.createCaller(member).objectives.create({ title: "O" })
    ).resolves.toMatchObject({ id: "new-id" });
  });

  it("delete: FORBIDDEN for a contributor", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).objectives.delete({ id: ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("key result mutations", () => {
  it("createKeyResult: FORBIDDEN for a contributor", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).okrs.createKeyResult({ title: "KR", objectiveId: ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("createKeyResult: rejects when neither objective nor parent is given", async () => {
    getActorMock.mockResolvedValue(actor(["manager"]));
    await expect(
      appRouter.createCaller(member).okrs.createKeyResult({ title: "KR" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updateKeyResult QUIRK: a contributor may update a KR they own", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await appRouter.createCaller(member).okrs.updateKeyResult({ id: ID, title: "KR2" });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });

  it("updateKeyResult QUIRK: a contributor may NOT update a KR they don't own", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).okrs.updateKeyResult({ id: ID, title: "KR2" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("updateKeyResult: NOT_FOUND when the KR isn't in the org", async () => {
    selectRows.mockReturnValue([]);
    getActorMock.mockResolvedValue(actor(["admin"]));
    await expect(
      appRouter.createCaller(member).okrs.updateKeyResult({ id: ID, title: "KR2" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deleteKeyResult: FORBIDDEN for a contributor even if they own it", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).okrs.deleteKeyResult({ id: ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("initiative mutations", () => {
  it("create: FORBIDDEN for a contributor", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).initiatives.create({ title: "I" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("update QUIRK: a viewer who owns the initiative may update it", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await appRouter.createCaller(member).initiatives.update({ id: ID, title: "I2" });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });

  it("update: FORBIDDEN for a contributor who doesn't own it", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).initiatives.update({ id: ID, title: "I2" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("delete: FORBIDDEN for an owner who is only a contributor", async () => {
    selectRows.mockReturnValue([{ ownerId: ME }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).initiatives.delete({ id: ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
