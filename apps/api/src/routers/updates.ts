import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { updateMentions, updateReactions, updates, usersProfile } from "../db/schema";
import { loadEntityRef } from "../lib/entity";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const entityType = z.enum(["kr", "initiative", "task"]);
const updateKind = z.enum(["comment", "progress", "blocker", "decision"]);

const forbidden = () =>
  new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
const notFound = (what = "Item") =>
  new TRPCError({ code: "NOT_FOUND", message: `${what} not found in your organization` });

export const updatesRouter = router({
  // Updates for one entity with user, mentions, and reactions — matches
  // the shape useUpdates got from Supabase. Assembled from three queries
  // (relational nesting) rather than one big join.
  list: protectedProcedure
    .input(z.object({ entityType, entityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          id: updates.id,
          organization_id: updates.organizationId,
          entity_type: updates.entityType,
          entity_id: updates.entityId,
          user_id: updates.userId,
          update_kind: updates.updateKind,
          content: updates.content,
          pinned: updates.pinned,
          created_at: updates.createdAt,
          user: {
            id: usersProfile.id,
            name: usersProfile.name,
            email: usersProfile.email,
            avatar_url: usersProfile.avatarUrl,
          },
        })
        .from(updates)
        .leftJoin(usersProfile, eq(usersProfile.id, updates.userId))
        .where(
          and(
            eq(updates.organizationId, ctx.orgId),
            eq(updates.entityType, input.entityType),
            eq(updates.entityId, input.entityId)
          )
        )
        .orderBy(desc(updates.pinned), desc(updates.createdAt));

      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.id);

      const [mentionRows, reactionRows] = await Promise.all([
        db
          .select({
            id: updateMentions.id,
            update_id: updateMentions.updateId,
            mentioned_user: {
              id: usersProfile.id,
              name: usersProfile.name,
              email: usersProfile.email,
              avatar_url: usersProfile.avatarUrl,
            },
          })
          .from(updateMentions)
          .leftJoin(usersProfile, eq(usersProfile.id, updateMentions.mentionedUserId))
          .where(inArray(updateMentions.updateId, ids)),
        db
          .select({
            id: updateReactions.id,
            update_id: updateReactions.updateId,
            user_id: updateReactions.userId,
            reaction_type: updateReactions.reactionType,
          })
          .from(updateReactions)
          .where(inArray(updateReactions.updateId, ids)),
      ]);

      return rows.map((r) => ({
        ...r,
        mentions: mentionRows
          .filter((m) => m.update_id === r.id)
          .map(({ id, mentioned_user }) => ({ id, mentioned_user })),
        reactions: reactionRows
          .filter((x) => x.update_id === r.id)
          .map(({ id, user_id, reaction_type }) => ({ id, user_id, reaction_type })),
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        entityType,
        entityId: z.string().uuid(),
        updateKind,
        content: z.string().min(1),
        mentionedUserIds: z.array(z.string().uuid()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = await loadEntityRef(input.entityType, input.entityId, ctx.orgId, ctx.userId);
      if (!ref) throw notFound();
      const actor = await getActor(ctx);
      // Comments are open to any org member; other kinds need entity control.
      if (!perms.updates.create(actor, input.updateKind, ref)) throw forbidden();

      return db.transaction(async (tx) => {
        const [created] = await tx
          .insert(updates)
          .values({
            organizationId: ctx.orgId,
            entityType: input.entityType,
            entityId: input.entityId,
            userId: ctx.userId,
            updateKind: input.updateKind,
            content: input.content,
          })
          .returning();
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.mentionedUserIds.length) {
          await tx.insert(updateMentions).values(
            input.mentionedUserIds.map((uid) => ({ updateId: created.id, mentionedUserId: uid }))
          );
        }
        return created;
      });
    }),

  togglePin: protectedProcedure
    .input(z.object({ updateId: z.string().uuid(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ entityType: updates.entityType, entityId: updates.entityId })
        .from(updates)
        .where(and(eq(updates.id, input.updateId), eq(updates.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw notFound("Update");
      const ref = await loadEntityRef(
        row.entityType as "kr" | "initiative" | "task",
        row.entityId,
        ctx.orgId,
        ctx.userId
      );
      if (!ref) throw notFound();
      const actor = await getActor(ctx);
      if (!perms.updates.pin(actor, ref)) throw forbidden();
      await db.update(updates).set({ pinned: input.pinned }).where(eq(updates.id, input.updateId));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ authorId: updates.userId })
        .from(updates)
        .where(and(eq(updates.id, input.updateId), eq(updates.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw notFound("Update");
      const actor = await getActor(ctx);
      if (!perms.updates.delete(actor, { authorId: row.authorId })) throw forbidden();
      await db.delete(updates).where(eq(updates.id, input.updateId));
      return { ok: true };
    }),

  // Any org member may react on an update in their org (RLS: org member +
  // own user_id). Toggles the reaction for the caller.
  toggleReaction: protectedProcedure
    .input(z.object({ updateId: z.string().uuid(), reactionType: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const [upd] = await db
        .select({ id: updates.id })
        .from(updates)
        .where(and(eq(updates.id, input.updateId), eq(updates.organizationId, ctx.orgId)))
        .limit(1);
      if (!upd) throw notFound("Update");

      const [existing] = await db
        .select({ id: updateReactions.id })
        .from(updateReactions)
        .where(
          and(
            eq(updateReactions.updateId, input.updateId),
            eq(updateReactions.userId, ctx.userId),
            eq(updateReactions.reactionType, input.reactionType)
          )
        )
        .limit(1);

      if (existing) {
        await db.delete(updateReactions).where(eq(updateReactions.id, existing.id));
        return { reacted: false };
      }
      await db.insert(updateReactions).values({
        updateId: input.updateId,
        userId: ctx.userId,
        reactionType: input.reactionType,
      });
      return { reacted: true };
    }),
});
