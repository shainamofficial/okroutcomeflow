import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@okroutcomeflow/shared";

// delete is uploader-or-elevated (perms.attachments.delete); downloadUrl +
// delete hit R2. Mock getActor, the R2 helpers, and the db chains.
const { actorMock, selectQueue, writeSpy, presignMock, deleteObjectMock } = vi.hoisted(() => ({
  actorMock: vi.fn(),
  selectQueue: vi.fn(() => [] as unknown[]),
  writeSpy: vi.fn(),
  presignMock: vi.fn(() => Promise.resolve("https://r2.example/signed")),
  deleteObjectMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("../lib/roles", () => ({
  getActor: actorMock,
  getCallerRoles: vi.fn().mockResolvedValue([]),
  isCallerPlatformAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("../lib/r2", () => ({
  presignDownload: presignMock,
  deleteObject: deleteObjectMock,
  isR2Configured: () => true,
  putObject: vi.fn(),
  R2_BUCKET: "test-bucket",
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
      delete: () => {
        writeSpy("delete");
        return thenable(() => undefined);
      },
    },
  };
});

import { appRouter } from "../router";

const caller = { userId: "user-1", orgId: "org-1" };
const asRoles = (roles: Role[]) =>
  actorMock.mockResolvedValue({ userId: "user-1", roles, isPlatformAdmin: false });
const ATT_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  actorMock.mockReset();
  selectQueue.mockReset().mockReturnValue([]);
  writeSpy.mockReset();
  presignMock.mockReset().mockResolvedValue("https://r2.example/signed");
  deleteObjectMock.mockReset().mockResolvedValue(undefined);
});

describe("attachments.list", () => {
  it("returns the entity's attachments", async () => {
    const rows = [{ id: ATT_ID, file_name: "a.pdf", storage_path: "k" }];
    selectQueue.mockReturnValueOnce(rows);
    const res = await appRouter
      .createCaller(caller)
      .attachments.list({ entityType: "task", entityId: "22222222-2222-2222-2222-222222222222" });
    expect(res).toEqual(rows);
  });
});

describe("attachments.downloadUrl", () => {
  it("NOT_FOUND when the attachment is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).attachments.downloadUrl({ id: ATT_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns a presigned url", async () => {
    selectQueue.mockReturnValueOnce([{ storagePath: "org-1/task/x/abc.pdf", fileName: "abc.pdf" }]);
    const res = await appRouter.createCaller(caller).attachments.downloadUrl({ id: ATT_ID });
    expect(res).toEqual({ url: "https://r2.example/signed" });
    expect(presignMock).toHaveBeenCalledWith("org-1/task/x/abc.pdf", "abc.pdf");
  });
});

describe("attachments.delete", () => {
  it("NOT_FOUND when the attachment is not in the org", async () => {
    selectQueue.mockReturnValueOnce([]);
    await expect(
      appRouter.createCaller(caller).attachments.delete({ id: ATT_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("FORBIDDEN for a non-uploader viewer", async () => {
    selectQueue.mockReturnValueOnce([{ storagePath: "k", uploadedBy: "someone-else" }]);
    asRoles(["viewer"]);
    await expect(
      appRouter.createCaller(caller).attachments.delete({ id: ATT_ID })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deleteObjectMock).not.toHaveBeenCalled();
  });

  it("lets the uploader delete (removes the object then the row)", async () => {
    selectQueue.mockReturnValueOnce([{ storagePath: "org-1/task/x/abc.pdf", uploadedBy: "user-1" }]);
    asRoles(["viewer"]);
    const res = await appRouter.createCaller(caller).attachments.delete({ id: ATT_ID });
    expect(res).toEqual({ ok: true });
    expect(deleteObjectMock).toHaveBeenCalledWith("org-1/task/x/abc.pdf");
    expect(writeSpy).toHaveBeenCalledWith("delete");
  });

  it("lets a manager delete someone else's attachment", async () => {
    selectQueue.mockReturnValueOnce([{ storagePath: "k", uploadedBy: "someone-else" }]);
    asRoles(["manager"]);
    const res = await appRouter.createCaller(caller).attachments.delete({ id: ATT_ID });
    expect(res).toEqual({ ok: true });
  });
});
