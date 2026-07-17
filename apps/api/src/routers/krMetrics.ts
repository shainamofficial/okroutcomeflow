import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { keyResults, krMetricConfig, krMetricValues } from "../db/schema";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Metric not found in your organization" });

const direction = z.enum(["increase", "decrease", "maintain"]);

// numeric columns come back from drizzle as strings; the UI wants numbers.
const configShape = {
  id: krMetricConfig.id,
  key_result_id: krMetricConfig.keyResultId,
  metric_name: krMetricConfig.metricName,
  unit: krMetricConfig.unit,
  direction: krMetricConfig.direction,
  start_value: krMetricConfig.startValue,
  target_value: krMetricConfig.targetValue,
  start_date: krMetricConfig.startDate,
  end_date: krMetricConfig.endDate,
};
type ConfigRow = { start_value: string; target_value: string } & Record<string, unknown>;
const toConfig = (r: ConfigRow) => ({
  ...r,
  start_value: Number(r.start_value),
  target_value: Number(r.target_value),
});

const valueShape = {
  id: krMetricValues.id,
  kr_metric_config_id: krMetricValues.krMetricConfigId,
  date: krMetricValues.date,
  value: krMetricValues.value,
  created_by: krMetricValues.createdBy,
  created_at: krMetricValues.createdAt,
};
type ValueRow = { value: string } & Record<string, unknown>;
const toValue = (r: ValueRow) => ({ ...r, value: Number(r.value) });

/** KR owner for a key result, scoped to the caller's org (null = not visible). */
async function krByKeyResult(keyResultId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: keyResults.ownerId })
    .from(keyResults)
    .where(and(eq(keyResults.id, keyResultId), eq(keyResults.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/** KR owner for a metric config, via its key result, scoped to org. */
async function krByConfig(configId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: keyResults.ownerId })
    .from(krMetricConfig)
    .innerJoin(keyResults, eq(keyResults.id, krMetricConfig.keyResultId))
    .where(and(eq(krMetricConfig.id, configId), eq(keyResults.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/** KR owner for a metric value, via config + key result, scoped to org. */
async function krByValue(valueId: string, orgId: string) {
  const [row] = await db
    .select({ ownerId: keyResults.ownerId, configId: krMetricValues.krMetricConfigId })
    .from(krMetricValues)
    .innerJoin(krMetricConfig, eq(krMetricConfig.id, krMetricValues.krMetricConfigId))
    .innerJoin(keyResults, eq(keyResults.id, krMetricConfig.keyResultId))
    .where(and(eq(krMetricValues.id, valueId), eq(keyResults.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export const krMetricsRouter = router({
  // The single metric config for a key result (or null), org-scoped.
  config: protectedProcedure
    .input(z.object({ keyResultId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const kr = await krByKeyResult(input.keyResultId, ctx.orgId);
      if (!kr) return null;
      const [row] = await db
        .select(configShape)
        .from(krMetricConfig)
        .where(eq(krMetricConfig.keyResultId, input.keyResultId))
        .limit(1);
      return row ? toConfig(row as ConfigRow) : null;
    }),

  createConfig: protectedProcedure
    .input(
      z.object({
        key_result_id: z.string().uuid(),
        metric_name: z.string().min(1),
        unit: z.string(),
        direction,
        start_value: z.number(),
        target_value: z.number(),
        start_date: z.string(),
        end_date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const kr = await krByKeyResult(input.key_result_id, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.manageMetrics(actor, { ownerId: kr.ownerId })) throw forbidden();
      const [created] = await db
        .insert(krMetricConfig)
        .values({
          keyResultId: input.key_result_id,
          metricName: input.metric_name,
          unit: input.unit,
          direction: input.direction,
          startValue: String(input.start_value),
          targetValue: String(input.target_value),
          startDate: input.start_date,
          endDate: input.end_date,
        })
        .returning(configShape);
      return toConfig(created as ConfigRow);
    }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        metric_name: z.string().min(1),
        unit: z.string(),
        direction,
        start_value: z.number(),
        target_value: z.number(),
        start_date: z.string(),
        end_date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const kr = await krByConfig(input.id, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.manageMetrics(actor, { ownerId: kr.ownerId })) throw forbidden();
      await db
        .update(krMetricConfig)
        .set({
          metricName: input.metric_name,
          unit: input.unit,
          direction: input.direction,
          startValue: String(input.start_value),
          targetValue: String(input.target_value),
          startDate: input.start_date,
          endDate: input.end_date,
        })
        .where(eq(krMetricConfig.id, input.id));
      return { ok: true };
    }),

  deleteConfig: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const kr = await krByConfig(input.id, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.manageMetrics(actor, { ownerId: kr.ownerId })) throw forbidden();
      await db.delete(krMetricConfig).where(eq(krMetricConfig.id, input.id));
      return { ok: true };
    }),

  // Values for a config, ascending by date, org-scoped.
  values: protectedProcedure
    .input(z.object({ configId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const kr = await krByConfig(input.configId, ctx.orgId);
      if (!kr) return [];
      const rows = await db
        .select(valueShape)
        .from(krMetricValues)
        .where(eq(krMetricValues.krMetricConfigId, input.configId))
        .orderBy(asc(krMetricValues.date));
      return rows.map((r) => toValue(r as ValueRow));
    }),

  addValue: protectedProcedure
    .input(z.object({ configId: z.string().uuid(), date: z.string(), value: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const kr = await krByConfig(input.configId, ctx.orgId);
      if (!kr) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.manageMetrics(actor, { ownerId: kr.ownerId })) throw forbidden();
      const [created] = await db
        .insert(krMetricValues)
        .values({
          krMetricConfigId: input.configId,
          date: input.date,
          value: String(input.value),
          createdBy: ctx.userId,
        })
        .returning(valueShape);
      return toValue(created as ValueRow);
    }),

  deleteValue: protectedProcedure
    .input(z.object({ valueId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const found = await krByValue(input.valueId, ctx.orgId);
      if (!found) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.keyResults.manageMetrics(actor, { ownerId: found.ownerId })) throw forbidden();
      await db.delete(krMetricValues).where(eq(krMetricValues.id, input.valueId));
      return { ok: true };
    }),
});
