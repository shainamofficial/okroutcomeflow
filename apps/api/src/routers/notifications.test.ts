import { beforeEach, describe, expect, it, vi } from "vitest";

// Notification preferences are per-user (protectedProcedure). Mock the db
// select/write chains; roles are mocked so appRouter imports cleanly.
const { selectQueue, writeSpy } = vi.hoisted(() => ({
  selectQueue: vi.fn(() => [] as unknown[]),
  writeSpy: vi.fn(),
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
  return {
    db: {
      select: () => thenable(() => selectQueue()),
      insert: () => {
        writeSpy("insert");
        return thenable(() => undefined);
      },
      update: () => {
        writeSpy("update");
        return thenable(() => undefined);
      },
    },
  };
});

import { appRouter } from "../router";

const caller = { userId: "user-1", orgId: "org-1" };

beforeEach(() => {
  selectQueue.mockReset().mockReturnValue([]);
  writeSpy.mockReset();
});

describe("notifications.preferences", () => {
  it("UNAUTHORIZED without a session", async () => {
    await expect(
      appRouter.createCaller({ userId: null, orgId: null }).notifications.preferences()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the caller's preferences", async () => {
    const rows = [
      { id: "p1", user_id: "user-1", notification_type: "mention", in_app_enabled: true, email_enabled: false },
    ];
    selectQueue.mockReturnValueOnce(rows);
    const res = await appRouter.createCaller(caller).notifications.preferences();
    expect(res).toEqual(rows);
  });
});

describe("notifications.upsertPreference", () => {
  it("upserts and returns ok", async () => {
    const res = await appRouter.createCaller(caller).notifications.upsertPreference({
      notification_type: "task_assigned",
      in_app_enabled: true,
      email_enabled: true,
    });
    expect(res).toEqual({ ok: true });
    expect(writeSpy).toHaveBeenCalledWith("insert");
  });
});
