import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@okroutcomeflow/shared";

// These tests verify the tasks router WIRES the shared permission rules
// correctly — the rules themselves are proven in permissions.test.ts. We
// mock the db (row lookups + writes) and getActor, then assert the
// FORBIDDEN / NOT_FOUND / success branches.
const { getActorMock, selectRows, insertReturning, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  selectRows: vi.fn(),
  insertReturning: vi.fn(),
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
  return {
    db: {
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
    },
  };
});

import { appRouter } from "../router";

const ME = "user-1";
const OTHER = "user-2";
const member = { userId: ME, orgId: "org-1" };
const TASK_ID = "1b671a64-40d5-491e-99b0-da01ff1f3341";
const INIT_ID = "2b671a64-40d5-491e-99b0-da01ff1f3341";

const actor = (roles: Actor["roles"], overrides: Partial<Actor> = {}): Actor => ({
  userId: ME,
  roles,
  ...overrides,
});

beforeEach(() => {
  getActorMock.mockReset();
  selectRows.mockReset();
  insertReturning.mockReset();
  writeSpy.mockReset();
});

describe("tasks.create authz", () => {
  it("NOT_FOUND when the initiative isn't in the caller's org", async () => {
    selectRows.mockReturnValue([]); // loadInitiative → none
    getActorMock.mockResolvedValue(actor(["manager"]));
    const caller = appRouter.createCaller(member);
    await expect(
      caller.tasks.create({ initiativeId: INIT_ID, title: "t" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("FORBIDDEN for a contributor who does not own the initiative", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER, organizationId: "org-1" }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await expect(
      caller.tasks.create({ initiativeId: INIT_ID, title: "t" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a manager and inserts the task", async () => {
    selectRows.mockReturnValue([{ ownerId: OTHER, organizationId: "org-1" }]);
    insertReturning.mockReturnValue([{ id: TASK_ID, title: "t" }]);
    getActorMock.mockResolvedValue(actor(["manager"]));
    const caller = appRouter.createCaller(member);
    await expect(
      caller.tasks.create({ initiativeId: INIT_ID, title: "t" })
    ).resolves.toMatchObject({ id: TASK_ID });
  });

  it("allows the initiative owner even as a plain contributor", async () => {
    selectRows.mockReturnValue([{ ownerId: ME, organizationId: "org-1" }]);
    insertReturning.mockReturnValue([{ id: TASK_ID }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await expect(
      caller.tasks.create({ initiativeId: INIT_ID, title: "t" })
    ).resolves.toBeDefined();
  });
});

describe("tasks.update authz", () => {
  it("allows the assignee even when they don't own the initiative", async () => {
    selectRows.mockReturnValue([{ assigneeUserId: ME, initiativeOwnerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await caller.tasks.update({ id: TASK_ID, status: "done" });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });

  it("FORBIDDEN for a contributor who is neither assignee nor owner", async () => {
    selectRows.mockReturnValue([{ assigneeUserId: OTHER, initiativeOwnerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await expect(
      caller.tasks.update({ id: TASK_ID, status: "done" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe("tasks.delete authz", () => {
  it("FORBIDDEN for a plain assignee (delete needs owner or elevated)", async () => {
    selectRows.mockReturnValue([{ assigneeUserId: ME, initiativeOwnerId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await expect(caller.tasks.delete({ id: TASK_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("allows the initiative owner to delete", async () => {
    selectRows.mockReturnValue([{ assigneeUserId: OTHER, initiativeOwnerId: ME }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    const caller = appRouter.createCaller(member);
    await caller.tasks.delete({ id: TASK_ID });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });

  it("allows a platform admin with no org roles", async () => {
    selectRows.mockReturnValue([{ assigneeUserId: OTHER, initiativeOwnerId: OTHER }]);
    getActorMock.mockResolvedValue(actor([], { isPlatformAdmin: true }));
    const caller = appRouter.createCaller(member);
    await caller.tasks.delete({ id: TASK_ID });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });
});
