import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor, Role } from "@okroutcomeflow/shared";

// Verifies custom-fields authz: definitions are manager-only, but VALUES
// may be edited by contributors too (the tested editValues quirk).
const { getActorMock, rolesMock, selectRows, writeSpy } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  rolesMock: vi.fn(() => [] as Role[]),
  selectRows: vi.fn(() => [{ id: "def" }]),
  writeSpy: vi.fn(),
}));

vi.mock("../lib/roles", () => ({
  getActor: getActorMock,
  getCallerRoles: rolesMock,
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
    },
  };
});

import { appRouter } from "../router";

const member = { userId: "user-1", orgId: "org-1" };
const ID = "1b671a64-40d5-491e-99b0-da01ff1f3341";
const ID2 = "2b671a64-40d5-491e-99b0-da01ff1f3341";
const actor = (roles: Role[]): Actor => ({ userId: "user-1", roles });

beforeEach(() => {
  getActorMock.mockReset();
  rolesMock.mockReset().mockReturnValue([]);
  selectRows.mockReset().mockReturnValue([{ id: "def" }]);
  writeSpy.mockReset();
});

describe("customFields.createDefinition (manager-only)", () => {
  it("FORBIDDEN for a contributor", async () => {
    rolesMock.mockResolvedValue(["contributor"]);
    await expect(
      appRouter.createCaller(member).customFields.createDefinition({
        entityType: "task",
        name: "Priority",
        fieldType: "text",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a manager", async () => {
    rolesMock.mockResolvedValue(["manager"]);
    await appRouter.createCaller(member).customFields.createDefinition({
      entityType: "task",
      name: "Priority",
      fieldType: "text",
    });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});

describe("customFields.upsertValue (contributors allowed)", () => {
  it("QUIRK: a contributor may edit a value", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    await appRouter.createCaller(member).customFields.upsertValue({
      fieldDefinitionId: ID,
      entityType: "task",
      entityId: ID2,
      value: "high",
    });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("FORBIDDEN for a viewer", async () => {
    getActorMock.mockResolvedValue(actor(["viewer"]));
    await expect(
      appRouter.createCaller(member).customFields.upsertValue({
        fieldDefinitionId: ID,
        entityType: "task",
        entityId: ID2,
        value: "high",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("NOT_FOUND when the definition isn't in the org", async () => {
    getActorMock.mockResolvedValue(actor(["contributor"]));
    selectRows.mockReturnValue([]);
    await expect(
      appRouter.createCaller(member).customFields.upsertValue({
        fieldDefinitionId: ID,
        entityType: "task",
        entityId: ID2,
        value: "high",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
