/**
 * The authorization model of OKRoutcomeFlow as pure functions.
 *
 * This is the executable spec of the database's 22 SECURITY DEFINER
 * functions and 111 RLS policies (see docs/schema-baseline.sql). During
 * the Phase 3 auth cutover and Phase 4 hook porting, the API enforces
 * THESE rules; the RLS policies remain as defense-in-depth until Phase 6.
 *
 * Faithfulness notes — the model has quirks we deliberately preserve:
 * - `canManageKeyResult` (SQL can_manage_kr) allows ANY owner regardless
 *   of role, but the key_results UPDATE policy only lets owners update
 *   when they hold the `contributor` role. So a viewer-owner may manage
 *   a KR's metrics/cadence but not edit the KR row itself.
 * - `canManageEntity`'s task branch (SQL can_manage_entity) checks
 *   assignee/team membership — NOT initiative ownership — while
 *   `canManageTask` (SQL can_manage_task) checks initiative ownership
 *   and direct assignment but NOT team membership.
 * - Contributors may edit custom field VALUES; definitions are
 *   admin/manager only.
 */

export const ROLES = ["admin", "manager", "contributor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export interface Actor {
  userId: string;
  /** Roles held in the actor's ACTIVE organization. */
  roles: readonly Role[];
  isPlatformAdmin?: boolean;
}

export type UpdateKind = "comment" | "progress" | "blocker" | "decision";

export type EntityRef =
  | { type: "kr"; ownerId: string | null }
  | { type: "initiative"; ownerId: string | null }
  | {
      type: "task";
      assigneeUserId: string | null;
      /** Whether the actor belongs to the task's assignee team (if any). */
      actorIsAssigneeTeamMember: boolean;
    };

export function hasRole(actor: Actor, role: Role): boolean {
  return actor.roles.includes(role);
}

/** Platform admin, org admin, or manager — the recurring RLS short-circuit. */
export function isElevated(actor: Actor): boolean {
  return actor.isPlatformAdmin === true || hasRole(actor, "admin") || hasRole(actor, "manager");
}

/** Platform admin or org admin (e.g. role/status changes, org settings). */
export function isAdmin(actor: Actor): boolean {
  return actor.isPlatformAdmin === true || hasRole(actor, "admin");
}

/** SQL: can_manage_kr — admin, manager, or the KR's owner (any role). */
export function canManageKeyResult(actor: Actor, kr: { ownerId: string | null }): boolean {
  return isElevated(actor) || (kr.ownerId !== null && kr.ownerId === actor.userId);
}

/** SQL: can_manage_initiative — admin, manager, or the initiative's owner. */
export function canManageInitiative(
  actor: Actor,
  initiative: { ownerId: string | null }
): boolean {
  return isElevated(actor) || (initiative.ownerId !== null && initiative.ownerId === actor.userId);
}

/** SQL: can_manage_task — admin, manager, initiative owner, or assignee. */
export function canManageTask(
  actor: Actor,
  task: { assigneeUserId: string | null; initiativeOwnerId: string | null }
): boolean {
  return (
    isElevated(actor) ||
    (task.initiativeOwnerId !== null && task.initiativeOwnerId === actor.userId) ||
    (task.assigneeUserId !== null && task.assigneeUserId === actor.userId)
  );
}

/** SQL: can_manage_entity — gates non-comment updates and pinning. */
export function canManageEntity(actor: Actor, entity: EntityRef): boolean {
  if (isElevated(actor)) return true;
  switch (entity.type) {
    case "kr":
    case "initiative":
      return entity.ownerId !== null && entity.ownerId === actor.userId;
    case "task":
      return (
        (entity.assigneeUserId !== null && entity.assigneeUserId === actor.userId) ||
        entity.actorIsAssigneeTeamMember
      );
  }
}

export const objectives = {
  create: isElevated,
  update: isElevated,
  delete: isElevated,
};

export const keyResults = {
  create: isElevated,
  /** RLS: admins/managers any KR; contributors only KRs they own. */
  update(actor: Actor, kr: { ownerId: string | null }): boolean {
    return (
      isElevated(actor) ||
      (hasRole(actor, "contributor") && kr.ownerId !== null && kr.ownerId === actor.userId)
    );
  },
  delete: isElevated,
  /** Metric config/values and review cadence/sessions all gate on can_manage_kr. */
  manageMetrics: canManageKeyResult,
  manageReviews: canManageKeyResult,
};

export const initiatives = {
  create: isElevated,
  update: canManageInitiative,
  delete: isElevated,
  linkKeyResults: canManageInitiative,
  manageShareLinks: canManageInitiative,
};

export const tasks = {
  /** RLS: admins, managers, and the initiative's owner may create tasks. */
  create(actor: Actor, initiative: { ownerId: string | null }): boolean {
    return canManageInitiative(actor, initiative);
  },
  update: canManageTask,
  /** Deletion excludes plain assignees — initiative owner or elevated only. */
  delete(actor: Actor, task: { initiativeOwnerId: string | null }): boolean {
    return (
      isElevated(actor) ||
      (task.initiativeOwnerId !== null && task.initiativeOwnerId === actor.userId)
    );
  },
  manageDependencies: canManageTask,
  watch: () => true, // any org member may watch/unwatch for themselves
  manageWatchers: isElevated,
};

export const updates = {
  /** Comments are open to all org members; other kinds need entity control. */
  create(actor: Actor, kind: UpdateKind, entity: EntityRef): boolean {
    return kind === "comment" || canManageEntity(actor, entity);
  },
  pin: canManageEntity,
  delete(actor: Actor, update: { authorId: string }): boolean {
    return isElevated(actor) || update.authorId === actor.userId;
  },
};

export const teams = {
  manage: isElevated, // create/rename/delete teams, add/remove members
};

export const orgUsers = {
  view: isElevated,
  updateStatus: isAdmin,
  updateRole: isAdmin,
};

export const invitations = {
  view: isElevated,
  create: isElevated,
  revoke: isElevated,
};

export const automations = {
  manage: isElevated,
};

export const customFields = {
  manageDefinitions: isElevated,
  /** RLS explicitly includes contributors for values (not viewers). */
  editValues(actor: Actor): boolean {
    return isElevated(actor) || hasRole(actor, "contributor");
  },
};

export const attachments = {
  upload: () => true, // any org member, recorded as uploader
  delete(actor: Actor, attachment: { uploadedBy: string | null }): boolean {
    return (
      isElevated(actor) ||
      (attachment.uploadedBy !== null && attachment.uploadedBy === actor.userId)
    );
  },
};

export const organization = {
  update: isAdmin,
  manageDomains: isAdmin,
  delete: (actor: Actor) => actor.isPlatformAdmin === true,
};

export const platform = {
  manageAdmins: (actor: Actor) => actor.isPlatformAdmin === true,
  manageOrganizations: (actor: Actor) => actor.isPlatformAdmin === true,
};
