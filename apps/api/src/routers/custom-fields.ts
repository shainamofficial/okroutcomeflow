import { and, asc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { customFieldDefinitions, customFieldValues } from "../db/schema";
import { getActor } from "../lib/roles";
import { managerProcedure, protectedProcedure, router } from "../trpc";

const entityType = z.enum(["kr", "initiative", "task"]);
const fieldType = z.enum(["text", "number", "select", "multi_select", "date", "checkbox"]);

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Field not found in your organization" });

export const customFieldsRouter = router({
  definitions: protectedProcedure
    .input(z.object({ entityType }))
    .query(({ ctx, input }) =>
      db
        .select({
          id: customFieldDefinitions.id,
          organization_id: customFieldDefinitions.organizationId,
          name: customFieldDefinitions.name,
          field_type: customFieldDefinitions.fieldType,
          options: customFieldDefinitions.options,
          entity_type: customFieldDefinitions.entityType,
          created_by: customFieldDefinitions.createdBy,
          created_at: customFieldDefinitions.createdAt,
        })
        .from(customFieldDefinitions)
        .where(
          and(
            eq(customFieldDefinitions.organizationId, ctx.orgId),
            eq(customFieldDefinitions.entityType, input.entityType)
          )
        )
        .orderBy(asc(customFieldDefinitions.createdAt))
    ),

  // Values for the given entities, scoped to the caller's org via the
  // definition join (mirrors the RLS org check).
  values: protectedProcedure
    .input(z.object({ entityIds: z.array(z.string().uuid()) }))
    .query(({ ctx, input }) => {
      if (input.entityIds.length === 0) return [];
      return db
        .select({
          id: customFieldValues.id,
          field_definition_id: customFieldValues.fieldDefinitionId,
          entity_type: customFieldValues.entityType,
          entity_id: customFieldValues.entityId,
          value: customFieldValues.value,
          updated_at: customFieldValues.updatedAt,
        })
        .from(customFieldValues)
        .innerJoin(
          customFieldDefinitions,
          eq(customFieldDefinitions.id, customFieldValues.fieldDefinitionId)
        )
        .where(
          and(
            inArray(customFieldValues.entityId, input.entityIds),
            eq(customFieldDefinitions.organizationId, ctx.orgId)
          )
        );
    }),

  // Definitions are admin/manager-only (managerProcedure = isElevated).
  createDefinition: managerProcedure
    .input(
      z.object({
        entityType,
        name: z.string().min(1),
        fieldType,
        options: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(customFieldDefinitions)
        .values({
          organizationId: ctx.orgId,
          name: input.name,
          fieldType: input.fieldType,
          options: input.options,
          entityType: input.entityType,
          createdBy: ctx.userId,
        })
        .returning();
      return created;
    }),

  deleteDefinition: managerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ id: customFieldDefinitions.id })
        .from(customFieldDefinitions)
        .where(
          and(
            eq(customFieldDefinitions.id, input.id),
            eq(customFieldDefinitions.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      if (!row) throw notFound();
      await db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, input.id));
      return { ok: true };
    }),

  // Values: contributors may edit too (perms.customFields.editValues).
  upsertValue: protectedProcedure
    .input(
      z.object({
        fieldDefinitionId: z.string().uuid(),
        entityType,
        entityId: z.string().uuid(),
        value: z.unknown(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await getActor(ctx);
      if (!perms.customFields.editValues(actor)) throw forbidden();
      // The field definition must be in the caller's org.
      const [def] = await db
        .select({ id: customFieldDefinitions.id })
        .from(customFieldDefinitions)
        .where(
          and(
            eq(customFieldDefinitions.id, input.fieldDefinitionId),
            eq(customFieldDefinitions.organizationId, ctx.orgId)
          )
        )
        .limit(1);
      if (!def) throw notFound();

      await db
        .insert(customFieldValues)
        .values({
          fieldDefinitionId: input.fieldDefinitionId,
          entityType: input.entityType,
          entityId: input.entityId,
          value: input.value ?? "",
        })
        .onConflictDoUpdate({
          target: [customFieldValues.fieldDefinitionId, customFieldValues.entityId],
          set: { value: input.value ?? "", updatedAt: new Date().toISOString() },
        });
      return { ok: true };
    }),
});
