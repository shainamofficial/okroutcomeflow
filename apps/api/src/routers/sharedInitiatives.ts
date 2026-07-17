import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import {
  initiativeKrLinks,
  initiativeShareLinks,
  initiativeShareViewers,
  initiatives,
  keyResults,
  krMetricConfig,
  krMetricValues,
  tasks,
  teams,
  updates,
  usersProfile,
} from "../db/schema";
import { publicProcedure, router } from "../trpc";

const num = (v: string | null): number | null => (v === null ? null : Number(v));

// Public, read-only view of a shared initiative — port of the
// get-shared-initiative Supabase edge function. Access is gated by an active
// share-link token plus an allow-listed viewer email (no auth session).
export const sharedInitiativesRouter = router({
  get: publicProcedure
    .input(z.object({ token: z.string().min(1), email: z.string().email() }))
    .query(async ({ input }) => {
      const [link] = await db
        .select({
          id: initiativeShareLinks.id,
          initiativeId: initiativeShareLinks.initiativeId,
          isActive: initiativeShareLinks.isActive,
        })
        .from(initiativeShareLinks)
        .where(eq(initiativeShareLinks.token, input.token))
        .limit(1);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired share link" });
      if (!link.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This share link has been deactivated" });
      }

      const normalizedEmail = input.email.toLowerCase().trim();
      const [viewer] = await db
        .select({ id: initiativeShareViewers.id })
        .from(initiativeShareViewers)
        .where(
          and(
            eq(initiativeShareViewers.shareLinkId, link.id),
            eq(sql`lower(${initiativeShareViewers.email})`, normalizedEmail)
          )
        )
        .limit(1);
      if (!viewer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this initiative",
        });
      }

      const [init] = await db
        .select({
          id: initiatives.id,
          title: initiatives.title,
          description: initiatives.description,
          status: initiatives.status,
          start_date: initiatives.startDate,
          end_date: initiatives.endDate,
          created_at: initiatives.createdAt,
          owner_id: usersProfile.id,
          owner_name: usersProfile.name,
        })
        .from(initiatives)
        .leftJoin(usersProfile, eq(usersProfile.id, initiatives.ownerId))
        .where(eq(initiatives.id, link.initiativeId))
        .limit(1);
      if (!init) throw new TRPCError({ code: "NOT_FOUND", message: "Initiative not found" });

      const assigneeUser = usersProfile;
      const taskRows = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          start_date: tasks.startDate,
          due_date: tasks.dueDate,
          parent_task_id: tasks.parentTaskId,
          color: tasks.color,
          au_id: assigneeUser.id,
          au_name: assigneeUser.name,
          at_id: teams.id,
          at_name: teams.name,
        })
        .from(tasks)
        .leftJoin(assigneeUser, eq(assigneeUser.id, tasks.assigneeUserId))
        .leftJoin(teams, eq(teams.id, tasks.assigneeTeamId))
        .where(eq(tasks.initiativeId, link.initiativeId))
        .orderBy(asc(tasks.createdAt));

      const krRows = await db
        .select({
          id: initiativeKrLinks.id,
          weight: initiativeKrLinks.weight,
          kr_id: keyResults.id,
          kr_title: keyResults.title,
          kr_desc: keyResults.description,
          ko_id: usersProfile.id,
          ko_name: usersProfile.name,
        })
        .from(initiativeKrLinks)
        .leftJoin(keyResults, eq(keyResults.id, initiativeKrLinks.keyResultId))
        .leftJoin(usersProfile, eq(usersProfile.id, keyResults.ownerId))
        .where(eq(initiativeKrLinks.initiativeId, link.initiativeId));

      // Metric configs + the latest value per config for the linked KRs.
      const krIds = krRows.map((r) => r.kr_id).filter((v): v is string => !!v);
      let metricsByKr = new Map<string, unknown[]>();
      if (krIds.length > 0) {
        const configs = await db
          .select({
            id: krMetricConfig.id,
            key_result_id: krMetricConfig.keyResultId,
            metric_name: krMetricConfig.metricName,
            unit: krMetricConfig.unit,
            direction: krMetricConfig.direction,
            start_value: krMetricConfig.startValue,
            target_value: krMetricConfig.targetValue,
          })
          .from(krMetricConfig)
          .where(inArray(krMetricConfig.keyResultId, krIds));

        const configIds = configs.map((m) => m.id);
        const values = configIds.length
          ? await db
              .select({
                kr_metric_config_id: krMetricValues.krMetricConfigId,
                value: krMetricValues.value,
                date: krMetricValues.date,
              })
              .from(krMetricValues)
              .where(inArray(krMetricValues.krMetricConfigId, configIds))
              .orderBy(desc(krMetricValues.date))
          : [];

        metricsByKr = configs.reduce((acc, m) => {
          const latest = values.find((v) => v.kr_metric_config_id === m.id);
          const shaped = {
            metric_name: m.metric_name,
            unit: m.unit,
            direction: m.direction,
            start_value: num(m.start_value) ?? 0,
            target_value: num(m.target_value) ?? 0,
            latest_value: latest ? { value: num(latest.value) ?? 0, date: latest.date } : null,
          };
          const list = acc.get(m.key_result_id) ?? [];
          list.push(shaped);
          acc.set(m.key_result_id, list);
          return acc;
        }, new Map<string, unknown[]>());
      }

      const updateRows = await db
        .select({
          id: updates.id,
          content: updates.content,
          update_kind: updates.updateKind,
          pinned: updates.pinned,
          created_at: updates.createdAt,
          u_id: usersProfile.id,
          u_name: usersProfile.name,
          u_avatar: usersProfile.avatarUrl,
        })
        .from(updates)
        .leftJoin(usersProfile, eq(usersProfile.id, updates.userId))
        .where(and(eq(updates.entityType, "initiative"), eq(updates.entityId, link.initiativeId)))
        .orderBy(desc(updates.pinned), desc(updates.createdAt))
        .limit(50);

      return {
        initiative: {
          id: init.id,
          title: init.title,
          description: init.description,
          status: init.status,
          start_date: init.start_date,
          end_date: init.end_date,
          created_at: init.created_at,
          owner: init.owner_id ? { id: init.owner_id, name: init.owner_name } : null,
        },
        tasks: taskRows.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          start_date: t.start_date,
          due_date: t.due_date,
          parent_task_id: t.parent_task_id,
          color: t.color,
          assignee: t.au_id ? { id: t.au_id, name: t.au_name } : null,
          assignee_team: t.at_id ? { id: t.at_id, name: t.at_name } : null,
        })),
        krLinks: krRows.map((l) => ({
          id: l.id,
          weight: num(l.weight),
          key_result: l.kr_id
            ? {
                id: l.kr_id,
                title: l.kr_title,
                description: l.kr_desc,
                owner: l.ko_id ? { id: l.ko_id, name: l.ko_name } : null,
              }
            : null,
          metrics: (l.kr_id ? metricsByKr.get(l.kr_id) : []) ?? [],
        })),
        updates: updateRows.map((u) => ({
          id: u.id,
          content: u.content,
          update_kind: u.update_kind,
          pinned: u.pinned,
          created_at: u.created_at,
          user: u.u_id ? { id: u.u_id, name: u.u_name, avatar_url: u.u_avatar } : null,
        })),
      };
    }),
});
