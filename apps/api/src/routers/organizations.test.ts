import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@okroutcomeflow/shared";

// Org update + domain management are admin-only; create is auth-only. Mock
// getActor and the db select/write chains (incl. transaction for create).
const { actorMock, selectQueue, returnRows, writeSpy } = vi.hoisted(() => ({
  actorMock: vi.fn(),
  selectQueue: vi.fn(() => [] as unknown[]),
  returnRows: vi.fn(() => [{}] as unknown[]),
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
  const tx = {
    insert: () => {
      writeSpy("tx-insert");
      return thenable(() => returnRows());
    },
  };
  return {
    db: {
      select: () => thenable(() => selectQueue()),
      insert: () => {
        writeSpy("insert");
        return thenable(() => returnRows());
      },
      update: () => {
        writeSpy("update");
        return thenable(() => returnRows());
      },
      delete: () => {
        writeSpy("delete");
        return thenable(() => undefined);
      },
      transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    },
  };
});

import { appRouter } from "../router";

const caller = { userId: "user-1", orgId: "org-1" };
const asRoles = (roles: Role[]) =>
  actorMock.mockResolvedValue({ userId: "user-1", roles, isPlatformAdmin: false });

const DOMAIN_ID = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
  actorMock.mockReset();
  selectQueue.mockReset().mockReturnValue([]);
  returnRows.mockReset().mockReturnValue([{}]);
  writeSpy.mockReset();
});

describe("organizations queries", () => {
  it("current returns the caller's active org (null logo stays null)", async () => {
    selectQueue.mockReturnValueOnce([{ id: "org-1", name: "Acme", logo_url: null, created_at: "now" }]);
    const res = await appRouter.createCaller(caller).organizations.current();
    expect(res).toMatchObject({ id: "org-1", name: "Acme", logo_url: null });
  });

  it("current projects a stored logo key to the redirect endpoint", async () => {
    selectQueue.mockReturnValueOnce([
      { id: "org-1", name: "Acme", logo_url: "org-1/logo/abc.png", created_at: "now" },
    ]);
    const res = await appRouter.createCaller(caller).organizations.current();
    expect(res?.logo_url).toMatch(/\/files\/org-logo\/org-1$/);
  });

  it("domains returns the org's domains", async () => {
    const rows = [{ id: DOMAIN_ID, organization_id: "org-1", domain: "acme.com", verified: true, created_at: "now" }];
    selectQueue.mockReturnValueOnce(rows);
    const res = await appRouter.createCaller(caller).organizations.domains();
    expect(res).toEqual(rows);
  });
});

describe("organizations.update", () => {
  it("FORBIDDEN for a non-admin", async () => {
    asRoles(["manager"]);
    await expect(
      appRouter.createCaller(caller).organizations.update({ name: "New" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updates the name for an admin", async () => {
    asRoles(["admin"]);
    returnRows.mockReturnValueOnce([{ id: "org-1", name: "New", logo_url: null, created_at: "now" }]);
    const res = await appRouter.createCaller(caller).organizations.update({ name: "New" });
    expect(res).toMatchObject({ name: "New" });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });
});

describe("organizations.create", () => {
  it("creates an org + membership + admin role and returns the id", async () => {
    returnRows.mockReturnValue([{ id: "new-org" }]);
    const res = await appRouter.createCaller(caller).organizations.create({ name: "Fresh Co" });
    expect(res).toEqual({ id: "new-org" });
    expect(writeSpy).toHaveBeenCalledWith("tx-insert");
  });
});

describe("organizations.addDomain", () => {
  it("FORBIDDEN for a non-admin", async () => {
    asRoles(["contributor"]);
    await expect(
      appRouter.createCaller(caller).organizations.addDomain({ domain: "acme.com" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("BAD_REQUEST for a generic domain", async () => {
    asRoles(["admin"]);
    selectQueue.mockReturnValueOnce([{ id: "generic" }]); // generic hit
    await expect(
      appRouter.createCaller(caller).organizations.addDomain({ domain: "gmail.com" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: /Generic/ });
  });

  it("CONFLICT when claimed by another org", async () => {
    asRoles(["admin"]);
    selectQueue
      .mockReturnValueOnce([]) // not generic
      .mockReturnValueOnce([{ id: "other" }]); // claimed elsewhere
    await expect(
      appRouter.createCaller(caller).organizations.addDomain({ domain: "acme.com" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("normalizes and adds a domain for an admin", async () => {
    asRoles(["admin"]);
    selectQueue.mockReturnValueOnce([]).mockReturnValueOnce([]);
    returnRows.mockReturnValueOnce([
      { id: DOMAIN_ID, organization_id: "org-1", domain: "acme.com", verified: false, created_at: "now" },
    ]);
    const res = await appRouter.createCaller(caller).organizations.addDomain({ domain: "@Acme.com" });
    expect(res).toMatchObject({ domain: "acme.com", verified: false });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});

describe("organizations domain mutations", () => {
  it("removeDomain NOT_FOUND when not in the org", async () => {
    asRoles(["admin"]);
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).organizations.removeDomain({ id: DOMAIN_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("setDomainVerified succeeds for an admin", async () => {
    asRoles(["admin"]);
    selectQueue.mockReturnValueOnce([{ id: DOMAIN_ID }]);
    const res = await appRouter
      .createCaller(caller)
      .organizations.setDomainVerified({ id: DOMAIN_ID, verified: true });
    expect(res).toEqual({ ok: true });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });
});
