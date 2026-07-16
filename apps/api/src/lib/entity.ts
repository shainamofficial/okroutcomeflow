import { and, eq } from "drizzle-orm";
import type { EntityRef } from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { initiatives, keyResults, tasks, teamMembers } from "../db/schema";

export type EntityType = "kr" | "initiative" | "task";

/**
 * Resolves the permission EntityRef for an update's target, scoped to the
 * caller's org. Returns null when the entity isn't in the org (→ NOT_FOUND).
 * For tasks it also resolves whether the actor belongs to the assignee team
 * (the can_manage_entity task branch depends on team membership).
 */
export async function loadEntityRef(
  entityType: EntityType,
  entityId: string,
  orgId: string,
  actorUserId: string
): Promise<EntityRef | null> {
  if (entityType === "kr") {
    const [row] = await db
      .select({ ownerId: keyResults.ownerId })
      .from(keyResults)
      .where(and(eq(keyResults.id, entityId), eq(keyResults.organizationId, orgId)))
      .limit(1);
    return row ? { type: "kr", ownerId: row.ownerId } : null;
  }

  if (entityType === "initiative") {
    const [row] = await db
      .select({ ownerId: initiatives.ownerId })
      .from(initiatives)
      .where(and(eq(initiatives.id, entityId), eq(initiatives.organizationId, orgId)))
      .limit(1);
    return row ? { type: "initiative", ownerId: row.ownerId } : null;
  }

  // task — org is enforced through its initiative
  const [row] = await db
    .select({
      assigneeUserId: tasks.assigneeUserId,
      assigneeTeamId: tasks.assigneeTeamId,
    })
    .from(tasks)
    .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
    .where(and(eq(tasks.id, entityId), eq(initiatives.organizationId, orgId)))
    .limit(1);
  if (!row) return null;

  let actorIsAssigneeTeamMember = false;
  if (row.assigneeTeamId) {
    const [m] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, row.assigneeTeamId), eq(teamMembers.userId, actorUserId))
      )
      .limit(1);
    actorIsAssigneeTeamMember = !!m;
  }
  return { type: "task", assigneeUserId: row.assigneeUserId, actorIsAssigneeTeamMember };
}
