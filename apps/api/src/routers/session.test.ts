import { beforeEach, describe, expect, it, vi } from "vitest";

const { selectRows, writeSpy } = vi.hoisted(() => ({
  selectRows: vi.fn(() => [] as unknown[]),
  writeSpy: vi.fn(),
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
    update: () => {
      writeSpy("update");
      return thenable(() => undefined);
    },
  };
  return { db: { ...handle, transaction: async (cb: (tx: typeof handle) => unknown) => cb(handle) } };
});

import { appRouter } from "../router";

const anon = appRouter.createCaller({ userId: null, orgId: null });
const user = appRouter.createCaller({ userId: "user-1", orgId: "org-1" });
const ORG = "1b671a64-40d5-491e-99b0-da01ff1f3341";

beforeEach(() => {
  selectRows.mockReset().mockReturnValue([]);
  writeSpy.mockReset();
});

describe("session.me", () => {
  it("requires authentication", async () => {
    await expect(anon.session.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns null profile when the user has none yet", async () => {
    selectRows.mockReturnValue([]); // no profile row
    const res = await user.session.me();
    expect(res).toEqual({ profile: null, roles: [], memberships: [] });
  });
});

describe("session.switchOrganization", () => {
  it("requires authentication", async () => {
    await expect(anon.session.switchOrganization({ targetOrgId: ORG })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("FORBIDDEN when the user is not a member of the target org", async () => {
    selectRows.mockReturnValue([]); // no membership
    await expect(user.session.switchOrganization({ targetOrgId: ORG })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("switches when the membership exists", async () => {
    selectRows.mockReturnValue([{ id: "m1" }]);
    await user.session.switchOrganization({ targetOrgId: ORG });
    expect(writeSpy).toHaveBeenCalledWith("update");
  });
});
