import { describe, expect, it } from "vitest";
import {
  type Actor,
  type Role,
  attachments,
  automations,
  canManageEntity,
  canManageInitiative,
  canManageKeyResult,
  canManageTask,
  customFields,
  initiatives,
  invitations,
  isAdmin,
  isElevated,
  keyResults,
  objectives,
  organization,
  orgUsers,
  platform,
  tasks,
  teams,
  updates,
} from "./permissions";

const ME = "user-me";
const OTHER = "user-other";

const actor = (roles: Role[], overrides: Partial<Actor> = {}): Actor => ({
  userId: ME,
  roles,
  ...overrides,
});

const admin = actor(["admin"]);
const manager = actor(["manager"]);
const contributor = actor(["contributor"]);
const viewer = actor(["viewer"]);
const platformAdmin = actor([], { isPlatformAdmin: true });

const everyone = { admin, manager, contributor, viewer, platformAdmin } as const;
type ActorName = keyof typeof everyone;

/** Assert an allow-set: named actors must pass, all others must fail. */
function expectAllowed(allowed: ActorName[], check: (a: Actor) => boolean) {
  for (const [name, a] of Object.entries(everyone) as [ActorName, Actor][]) {
    expect(check(a), `${name} should be ${allowed.includes(name) ? "allowed" : "denied"}`).toBe(
      allowed.includes(name)
    );
  }
}

describe("role primitives", () => {
  it("isElevated: admin, manager, platform admin", () => {
    expectAllowed(["admin", "manager", "platformAdmin"], isElevated);
  });

  it("isAdmin: admin and platform admin only", () => {
    expectAllowed(["admin", "platformAdmin"], isAdmin);
  });
});

describe("objectives: elevated-only for all writes", () => {
  for (const action of ["create", "update", "delete"] as const) {
    it(action, () => expectAllowed(["admin", "manager", "platformAdmin"], objectives[action]));
  }
});

describe("key results", () => {
  it("create/delete: elevated only", () => {
    expectAllowed(["admin", "manager", "platformAdmin"], keyResults.create);
    expectAllowed(["admin", "manager", "platformAdmin"], keyResults.delete);
  });

  it("update: elevated, or contributor who owns the KR", () => {
    expectAllowed(["admin", "manager", "platformAdmin", "contributor"], (a) =>
      keyResults.update(a, { ownerId: ME })
    );
  });

  it("update: contributor does NOT get someone else's KR", () => {
    expect(keyResults.update(contributor, { ownerId: OTHER })).toBe(false);
  });

  it("QUIRK: a viewer-owner cannot update the KR row itself…", () => {
    expect(keyResults.update(viewer, { ownerId: ME })).toBe(false);
  });

  it("…but CAN manage its metrics and reviews (can_manage_kr has no role check)", () => {
    expect(keyResults.manageMetrics(viewer, { ownerId: ME })).toBe(true);
    expect(keyResults.manageReviews(viewer, { ownerId: ME })).toBe(true);
  });

  it("canManageKeyResult: never matches a null owner", () => {
    expect(canManageKeyResult(actor([], { userId: null as unknown as string }), { ownerId: null })).toBe(false);
    expect(canManageKeyResult(viewer, { ownerId: null })).toBe(false);
  });
});

describe("initiatives", () => {
  it("create/delete: elevated only", () => {
    expectAllowed(["admin", "manager", "platformAdmin"], initiatives.create);
    expectAllowed(["admin", "manager", "platformAdmin"], initiatives.delete);
  });

  it("update: elevated or owner of any role", () => {
    expectAllowed(["admin", "manager", "platformAdmin", "contributor", "viewer"], (a) =>
      initiatives.update(a, { ownerId: ME })
    );
    expect(initiatives.update(contributor, { ownerId: OTHER })).toBe(false);
  });

  it("share links and KR links follow can_manage_initiative", () => {
    expect(initiatives.manageShareLinks(viewer, { ownerId: ME })).toBe(true);
    expect(initiatives.linkKeyResults(contributor, { ownerId: OTHER })).toBe(false);
    expect(canManageInitiative(manager, { ownerId: OTHER })).toBe(true);
  });
});

describe("tasks", () => {
  it("create: elevated or the initiative's owner", () => {
    expectAllowed(["admin", "manager", "platformAdmin", "contributor", "viewer"], (a) =>
      tasks.create(a, { ownerId: ME })
    );
    expect(tasks.create(contributor, { ownerId: OTHER })).toBe(false);
  });

  it("update: elevated, initiative owner, or assignee", () => {
    expect(canManageTask(contributor, { assigneeUserId: ME, initiativeOwnerId: OTHER })).toBe(true);
    expect(canManageTask(viewer, { assigneeUserId: OTHER, initiativeOwnerId: ME })).toBe(true);
    expect(canManageTask(contributor, { assigneeUserId: OTHER, initiativeOwnerId: OTHER })).toBe(false);
  });

  it("delete: assignee alone is NOT enough", () => {
    expect(tasks.delete(contributor, { initiativeOwnerId: OTHER })).toBe(false);
    expect(tasks.delete(contributor, { initiativeOwnerId: ME })).toBe(true);
    expect(tasks.delete(manager, { initiativeOwnerId: OTHER })).toBe(true);
  });
});

describe("canManageEntity (update pinning / non-comment gating)", () => {
  it("kr/initiative branches match ownership", () => {
    expect(canManageEntity(viewer, { type: "kr", ownerId: ME })).toBe(true);
    expect(canManageEntity(viewer, { type: "initiative", ownerId: OTHER })).toBe(false);
  });

  it("QUIRK: task branch honors team membership but not initiative ownership", () => {
    expect(
      canManageEntity(viewer, {
        type: "task",
        assigneeUserId: OTHER,
        actorIsAssigneeTeamMember: true,
      })
    ).toBe(true);
    expect(
      canManageEntity(viewer, {
        type: "task",
        assigneeUserId: OTHER,
        actorIsAssigneeTeamMember: false,
      })
    ).toBe(false);
  });
});

describe("updates", () => {
  const foreignTask = {
    type: "task",
    assigneeUserId: OTHER,
    actorIsAssigneeTeamMember: false,
  } as const;

  it("comments are open to every org member", () => {
    expectAllowed(["admin", "manager", "contributor", "viewer", "platformAdmin"], (a) =>
      updates.create(a, "comment", foreignTask)
    );
  });

  it("non-comment kinds require entity control", () => {
    expect(updates.create(viewer, "progress", foreignTask)).toBe(false);
    expect(updates.create(viewer, "blocker", { type: "kr", ownerId: ME })).toBe(true);
    expect(updates.create(manager, "decision", foreignTask)).toBe(true);
  });

  it("delete: author or elevated", () => {
    expect(updates.delete(viewer, { authorId: ME })).toBe(true);
    expect(updates.delete(viewer, { authorId: OTHER })).toBe(false);
    expect(updates.delete(admin, { authorId: OTHER })).toBe(true);
  });
});

describe("org administration", () => {
  it("teams / invitations / automations / user list: elevated only", () => {
    expectAllowed(["admin", "manager", "platformAdmin"], teams.manage);
    expectAllowed(["admin", "manager", "platformAdmin"], invitations.create);
    expectAllowed(["admin", "manager", "platformAdmin"], automations.manage);
    expectAllowed(["admin", "manager", "platformAdmin"], orgUsers.view);
  });

  it("role/status changes and org settings: admin only", () => {
    expectAllowed(["admin", "platformAdmin"], orgUsers.updateRole);
    expectAllowed(["admin", "platformAdmin"], orgUsers.updateStatus);
    expectAllowed(["admin", "platformAdmin"], organization.update);
    expectAllowed(["admin", "platformAdmin"], organization.manageDomains);
  });

  it("org deletion and platform surfaces: platform admin only", () => {
    expectAllowed(["platformAdmin"], organization.delete);
    expectAllowed(["platformAdmin"], platform.manageAdmins);
    expectAllowed(["platformAdmin"], platform.manageOrganizations);
  });
});

describe("custom fields and attachments", () => {
  it("QUIRK: contributors edit values; only elevated manage definitions", () => {
    expectAllowed(["admin", "manager", "platformAdmin"], customFields.manageDefinitions);
    expectAllowed(["admin", "manager", "contributor", "platformAdmin"], customFields.editValues);
  });

  it("attachments: anyone uploads; uploader or elevated deletes", () => {
    expect(attachments.upload()).toBe(true);
    expect(attachments.delete(viewer, { uploadedBy: ME })).toBe(true);
    expect(attachments.delete(viewer, { uploadedBy: OTHER })).toBe(false);
    expect(attachments.delete(manager, { uploadedBy: OTHER })).toBe(true);
    expect(attachments.delete(viewer, { uploadedBy: null })).toBe(false);
  });
});

describe("multi-role actors", () => {
  it("a contributor+manager gets elevated behavior", () => {
    const both = actor(["contributor", "manager"]);
    expect(isElevated(both)).toBe(true);
    expect(objectives.create(both)).toBe(true);
  });

  it("platform admin with zero org roles passes every elevated check", () => {
    expect(keyResults.update(platformAdmin, { ownerId: OTHER })).toBe(true);
    expect(tasks.delete(platformAdmin, { initiativeOwnerId: OTHER })).toBe(true);
  });
});
