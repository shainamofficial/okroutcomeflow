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
  const tx = {
    insert: () => {
      writeSpy("tx-insert");
      return thenable(() => undefined);
    },
    update: () => {
      writeSpy("tx-update");
      return thenable(() => undefined);
    },
    delete: () => {
      writeSpy("tx-delete");
      return thenable(() => undefined);
    },
  };
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
      transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
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

// byToken is public; anon caller (no userId/orgId).
const anon = { userId: null, orgId: null };

describe("invitations.byToken", () => {
  it("returns the invitation row when the token matches", async () => {
    const row = { id: "inv-1", organization_id: "org-9", email: "a@co.com", role: "viewer", status: "pending" };
    selectQueue.mockReturnValueOnce([row]);
    const res = await appRouter.createCaller(anon).invitations.byToken({ token: "sometoken" });
    expect(res).toEqual(row);
  });

  it("returns null when no invitation matches (bad/expired token)", async () => {
    selectQueue.mockReturnValueOnce([]);
    const res = await appRouter.createCaller(anon).invitations.byToken({ token: "nope" });
    expect(res).toBeNull();
  });
});

describe("invitations.accept", () => {
  const caller = { userId: "user-1", orgId: null };
  const pendingInv = {
    id: "inv-1",
    organizationId: "org-9",
    email: "invitee@co.com",
    role: "manager",
    status: "pending",
    expiresAt: null,
  };

  it("UNAUTHORIZED when not signed in", async () => {
    await expect(
      appRouter.createCaller(anon).invitations.accept({ token: "t" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("NOT_FOUND for an unknown token", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).invitations.accept({ token: "t" })
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Invalid invitation token" });
  });

  it("BAD_REQUEST for an expired invitation", async () => {
    selectQueue.mockReturnValueOnce([{ ...pendingInv, expiresAt: "2000-01-01T00:00:00Z" }]);
    await expect(
      appRouter.createCaller(caller).invitations.accept({ token: "t" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: /expired/ });
  });

  it("BAD_REQUEST for an already-accepted invitation", async () => {
    selectQueue.mockReturnValueOnce([{ ...pendingInv, status: "accepted" }]);
    await expect(
      appRouter.createCaller(caller).invitations.accept({ token: "t" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: /already been used/ });
  });

  it("FORBIDDEN when the caller's email differs from the invite", async () => {
    selectQueue
      .mockReturnValueOnce([pendingInv]) // inv lookup
      .mockReturnValueOnce([{ email: "someone-else@co.com" }]); // ba_user lookup
    await expect(
      appRouter.createCaller(caller).invitations.accept({ token: "t" })
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: /does not match/ });
  });

  it("new user: re-homes profile to the invited org and burns the token", async () => {
    selectQueue
      .mockReturnValueOnce([pendingInv]) // inv
      .mockReturnValueOnce([{ email: "Invitee@co.com" }]) // ba_user (case-insensitive match)
      .mockReturnValueOnce([{ organizationId: null }]); // profile (no org yet)
    const res = await appRouter
      .createCaller(caller)
      .invitations.accept({ token: "t", name: "New Person" });
    expect(res).toMatchObject({ ok: true, organizationId: "org-9" });
    // new-user branch replaces roles: update profile, delete roles, insert role+membership, burn token
    expect(writeSpy).toHaveBeenCalledWith("tx-update");
    expect(writeSpy).toHaveBeenCalledWith("tx-delete");
    expect(writeSpy).toHaveBeenCalledWith("tx-insert");
  });

  it("existing user: adds an inactive membership without deleting roles", async () => {
    selectQueue
      .mockReturnValueOnce([pendingInv]) // inv
      .mockReturnValueOnce([{ email: "invitee@co.com" }]) // ba_user
      .mockReturnValueOnce([{ organizationId: "org-existing" }]); // profile already has an org
    const res = await appRouter.createCaller(caller).invitations.accept({ token: "t" });
    expect(res).toMatchObject({ ok: true, organizationId: "org-9" });
    // existing-user branch must NOT delete roles
    expect(writeSpy).not.toHaveBeenCalledWith("tx-delete");
    expect(writeSpy).toHaveBeenCalledWith("tx-insert");
  });
});
