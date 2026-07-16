import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor, EntityRef } from "@okroutcomeflow/shared";

// Verifies the updates router wires perms.updates.* correctly — comments
// open to all, other kinds + pinning need canManageEntity, delete is
// author-or-elevated. loadEntityRef and getActor are mocked; the rules
// themselves are proven in permissions.test.ts.
const { getActorMock, entityRefMock, selectRows, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  entityRefMock: vi.fn(),
  selectRows: vi.fn(() => [] as unknown[]),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  getActor: getActorMock,
  getCallerRoles: vi.fn().mockResolvedValue([]),
}));
vi.mock("../lib/entity", () => ({ loadEntityRef: entityRefMock }));

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
const ID = "1b671a64-40d5-491e-99b0-da01ff1f3341";
const actor = (roles: Actor["roles"]): Actor => ({ userId: ME, roles });
const krRef = (ownerId: string | null): EntityRef => ({ type: "kr", ownerId });
const taskRef = (assigneeUserId: string | null, team: boolean): EntityRef => ({
  type: "task",
  assigneeUserId,
  actorIsAssigneeTeamMember: team,
});

beforeEach(() => {
  getActorMock.mockReset().mockResolvedValue(actor(["viewer"]));
  entityRefMock.mockReset().mockResolvedValue(krRef(OTHER));
  selectRows.mockReset().mockReturnValue([{ entityType: "kr", entityId: ID, authorId: OTHER, id: ID }]);
  writeSpy.mockReset();
});

describe("updates.create", () => {
  it("a viewer may post a COMMENT on an entity they don't own", async () => {
    await appRouter
      .createCaller(member)
      .updates.create({ entityType: "kr", entityId: ID, updateKind: "comment", content: "hi" });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("a viewer may NOT post a non-comment (progress) on a KR they don't own", async () => {
    entityRefMock.mockResolvedValue(krRef(OTHER));
    await expect(
      appRouter
        .createCaller(member)
        .updates.create({ entityType: "kr", entityId: ID, updateKind: "progress", content: "p" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("an owner may post a non-comment on their own KR", async () => {
    entityRefMock.mockResolvedValue(krRef(ME));
    await appRouter
      .createCaller(member)
      .updates.create({ entityType: "kr", entityId: ID, updateKind: "blocker", content: "b" });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("QUIRK: a task assignee-team member may post a non-comment", async () => {
    entityRefMock.mockResolvedValue(taskRef(OTHER, true));
    await appRouter
      .createCaller(member)
      .updates.create({ entityType: "task", entityId: ID, updateKind: "decision", content: "d" });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("NOT_FOUND when the entity isn't in the org", async () => {
    entityRefMock.mockResolvedValue(null);
    await expect(
      appRouter
        .createCaller(member)
        .updates.create({ entityType: "kr", entityId: ID, updateKind: "comment", content: "c" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("updates.delete (author or elevated)", () => {
  it("the author may delete", async () => {
    selectRows.mockReturnValue([{ authorId: ME }]);
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await appRouter.createCaller(member).updates.delete({ updateId: ID });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });

  it("a non-author non-elevated user may NOT delete", async () => {
    selectRows.mockReturnValue([{ authorId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await expect(
      appRouter.createCaller(member).updates.delete({ updateId: ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("a manager may delete anyone's update", async () => {
    selectRows.mockReturnValue([{ authorId: OTHER }]);
    getActorMock.mockResolvedValue(actor(["manager"]));
    await appRouter.createCaller(member).updates.delete({ updateId: ID });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });
});

describe("updates.togglePin (canManageEntity)", () => {
  it("FORBIDDEN for a viewer who doesn't control the entity", async () => {
    selectRows.mockReturnValue([{ entityType: "kr", entityId: ID }]);
    entityRefMock.mockResolvedValue(krRef(OTHER));
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await expect(
      appRouter.createCaller(member).updates.togglePin({ updateId: ID, pinned: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allowed for the entity owner", async () => {
    selectRows.mockReturnValue([{ entityType: "kr", entityId: ID }]);
    entityRefMock.mockResolvedValue(krRef(ME));
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await appRouter.createCaller(member).updates.togglePin({ updateId: ID, pinned: true });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });
});

describe("updates.toggleReaction (any org member)", () => {
  it("inserts when no reaction exists", async () => {
    selectRows.mockReturnValueOnce([{ id: ID }]).mockReturnValueOnce([]);
    const res = await appRouter
      .createCaller(member)
      .updates.toggleReaction({ updateId: ID, reactionType: "like" });
    expect(res).toEqual({ reacted: true });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("NOT_FOUND when the update isn't in the org", async () => {
    selectRows.mockReturnValue([]);
    await expect(
      appRouter.createCaller(member).updates.toggleReaction({ updateId: ID, reactionType: "like" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
