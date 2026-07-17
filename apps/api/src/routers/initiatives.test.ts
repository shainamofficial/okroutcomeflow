import { beforeEach, describe, expect, it, vi } from "vitest";

// Covers the initiative<->KR link read endpoints (krLinks, initiativeLinks).
// getActor is mocked; only org-scoping + shaping are exercised here.
const { selectQueue } = vi.hoisted(() => ({
  selectQueue: vi.fn(() => [] as unknown[]),
}));

vi.mock("../lib/roles", () => ({
  getActor: vi.fn(),
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
  return { db: { select: () => thenable(() => selectQueue()) } };
});

import { appRouter } from "../router";

const caller = { userId: "user-1", orgId: "org-1" };
const INIT_ID = "11111111-1111-1111-1111-111111111111";
const KR_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  selectQueue.mockReset().mockReturnValue([]);
});

describe("initiatives.krLinks", () => {
  it("returns [] when the initiative is not in the caller's org", async () => {
    selectQueue.mockReturnValueOnce([]); // loadInitiative miss
    const res = await appRouter.createCaller(caller).initiatives.krLinks({ initiativeId: INIT_ID });
    expect(res).toEqual([]);
  });

  it("returns the links with weight coerced to a number", async () => {
    selectQueue
      .mockReturnValueOnce([{ ownerId: null }]) // loadInitiative hit
      .mockReturnValueOnce([
        {
          id: "link-1",
          initiative_id: INIT_ID,
          key_result_id: KR_ID,
          weight: "0.5",
          created_at: "now",
          key_result: { id: KR_ID, title: "Grow", objective_id: null },
        },
      ]);
    const res = await appRouter.createCaller(caller).initiatives.krLinks({ initiativeId: INIT_ID });
    expect(res).toEqual([
      {
        id: "link-1",
        initiative_id: INIT_ID,
        key_result_id: KR_ID,
        weight: 0.5,
        created_at: "now",
        key_result: { id: KR_ID, title: "Grow", objective_id: null },
      },
    ]);
  });

  it("UNAUTHORIZED without a session", async () => {
    await expect(
      appRouter.createCaller({ userId: null, orgId: null }).initiatives.krLinks({ initiativeId: INIT_ID })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("initiatives.initiativeLinks", () => {
  it("shapes the flat rows into { ...link, initiative: { ...owner } }", async () => {
    selectQueue.mockReturnValueOnce([
      {
        id: "link-1",
        initiative_id: INIT_ID,
        key_result_id: KR_ID,
        weight: null,
        created_at: "now",
        i_id: INIT_ID,
        i_org: "org-1",
        i_title: "Launch",
        i_desc: null,
        i_ownerId: "owner-1",
        i_status: "in_progress",
        i_start: null,
        i_end: null,
        i_createdBy: "user-1",
        i_createdAt: "then",
        o_id: "owner-1",
        o_name: "Owner",
        o_email: "owner@co.com",
      },
    ]);
    const res = await appRouter.createCaller(caller).initiatives.initiativeLinks({ keyResultId: KR_ID });
    expect(res).toEqual([
      {
        id: "link-1",
        initiative_id: INIT_ID,
        key_result_id: KR_ID,
        weight: null,
        created_at: "now",
        initiative: {
          id: INIT_ID,
          organization_id: "org-1",
          title: "Launch",
          description: null,
          owner_id: "owner-1",
          status: "in_progress",
          start_date: null,
          end_date: null,
          created_by: "user-1",
          created_at: "then",
          owner: { id: "owner-1", name: "Owner", email: "owner@co.com" },
        },
      },
    ]);
  });

  it("sets initiative.owner to null when there is no owner", async () => {
    selectQueue.mockReturnValueOnce([
      {
        id: "link-2",
        initiative_id: INIT_ID,
        key_result_id: KR_ID,
        weight: null,
        created_at: "now",
        i_id: INIT_ID,
        i_org: "org-1",
        i_title: "Launch",
        i_desc: null,
        i_ownerId: null,
        i_status: "not_started",
        i_start: null,
        i_end: null,
        i_createdBy: null,
        i_createdAt: "then",
        o_id: null,
        o_name: null,
        o_email: null,
      },
    ]);
    const res = await appRouter.createCaller(caller).initiatives.initiativeLinks({ keyResultId: KR_ID });
    expect(res[0]?.initiative.owner).toBeNull();
  });
});
