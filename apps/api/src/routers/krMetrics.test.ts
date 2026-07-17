import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@okroutcomeflow/shared";

// krMetrics writes are gated by canManageKeyResult (elevated OR the KR owner).
// Mock getActor (used by the resolvers) and the db select/write chains.
const { actorMock, selectQueue, insertReturn, writeSpy } = vi.hoisted(() => ({
  actorMock: vi.fn(),
  selectQueue: vi.fn(() => [] as unknown[]),
  insertReturn: vi.fn(() => [{}] as unknown[]),
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
  return {
    db: {
      select: () => thenable(() => selectQueue()),
      insert: () => {
        writeSpy("insert");
        return thenable(() => insertReturn());
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

const caller = { userId: "user-1", orgId: "org-1" };
const asRoles = (roles: Role[], isPlatformAdmin = false) =>
  actorMock.mockResolvedValue({ userId: "user-1", roles, isPlatformAdmin });

beforeEach(() => {
  actorMock.mockReset();
  selectQueue.mockReset().mockReturnValue([]);
  insertReturn.mockReset().mockReturnValue([{}]);
  writeSpy.mockReset();
});

const KR_ID = "11111111-1111-1111-1111-111111111111";
const CFG_ID = "22222222-2222-2222-2222-222222222222";
const VAL_ID = "33333333-3333-3333-3333-333333333333";

describe("krMetrics.config", () => {
  it("returns null when the key result is not in the caller's org", async () => {
    selectQueue.mockReturnValueOnce([]); // krByKeyResult miss
    const res = await appRouter.createCaller(caller).krMetrics.config({ keyResultId: KR_ID });
    expect(res).toBeNull();
  });

  it("returns the config with numeric fields coerced to numbers", async () => {
    selectQueue
      .mockReturnValueOnce([{ ownerId: "someone" }]) // krByKeyResult hit
      .mockReturnValueOnce([
        {
          id: CFG_ID,
          key_result_id: KR_ID,
          metric_name: "Revenue",
          unit: "USD",
          direction: "increase",
          start_value: "0",
          target_value: "100",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
        },
      ]);
    const res = await appRouter.createCaller(caller).krMetrics.config({ keyResultId: KR_ID });
    expect(res).toMatchObject({ start_value: 0, target_value: 100 });
    expect(typeof res?.start_value).toBe("number");
  });
});

describe("krMetrics.createConfig", () => {
  const input = {
    key_result_id: KR_ID,
    metric_name: "Revenue",
    unit: "USD",
    direction: "increase" as const,
    start_value: 0,
    target_value: 100,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  };

  it("FORBIDDEN for a viewer who does not own the KR", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: "another-user" }]);
    asRoles(["viewer"]);
    await expect(
      appRouter.createCaller(caller).krMetrics.createConfig(input)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writeSpy).not.toHaveBeenCalledWith("insert");
  });

  it("NOT_FOUND when the KR is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).krMetrics.createConfig(input)
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates for a manager and returns numeric fields", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: null }]);
    asRoles(["manager"]);
    insertReturn.mockReturnValueOnce([
      { ...input, id: CFG_ID, start_value: "0", target_value: "100" },
    ]);
    const res = await appRouter.createCaller(caller).krMetrics.createConfig(input);
    expect(res).toMatchObject({ id: CFG_ID, start_value: 0, target_value: 100 });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });

  it("allows the KR owner (contributor) to create", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: "user-1" }]); // caller owns the KR
    asRoles(["contributor"]);
    insertReturn.mockReturnValueOnce([
      { ...input, id: CFG_ID, start_value: "0", target_value: "100" },
    ]);
    const res = await appRouter.createCaller(caller).krMetrics.createConfig(input);
    expect(res).toMatchObject({ id: CFG_ID });
  });
});

describe("krMetrics.values / addValue / deleteValue", () => {
  it("values returns [] when the config is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]); // krByConfig miss
    const res = await appRouter.createCaller(caller).krMetrics.values({ configId: CFG_ID });
    expect(res).toEqual([]);
  });

  it("addValue NOT_FOUND when the config is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).krMetrics.addValue({ configId: CFG_ID, date: "2026-02-01", value: 5 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("addValue succeeds for a manager and coerces value to a number", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: null }]);
    asRoles(["manager"]);
    insertReturn.mockReturnValueOnce([
      { id: VAL_ID, kr_metric_config_id: CFG_ID, date: "2026-02-01", value: "42", created_by: "user-1", created_at: "now" },
    ]);
    const res = await appRouter
      .createCaller(caller)
      .krMetrics.addValue({ configId: CFG_ID, date: "2026-02-01", value: 42 });
    expect(res).toMatchObject({ id: VAL_ID, value: 42 });
    expect(typeof res.value).toBe("number");
  });

  it("deleteValue NOT_FOUND when the value is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).krMetrics.deleteValue({ valueId: VAL_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deleteValue succeeds for a manager", async () => {
    selectQueue.mockReturnValueOnce([{ ownerId: null, configId: CFG_ID }]);
    asRoles(["manager"]);
    const res = await appRouter.createCaller(caller).krMetrics.deleteValue({ valueId: VAL_ID });
    expect(res).toEqual({ ok: true });
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });
});
