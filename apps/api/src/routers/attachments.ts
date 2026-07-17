import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as perms from "@okroutcomeflow/shared";
import { db } from "../db/client";
import { fileAttachments } from "../db/schema";
import { deleteObject, presignDownload } from "../lib/r2";
import { getActor } from "../lib/roles";
import { protectedProcedure, router } from "../trpc";

const entityType = z.enum(["kr", "initiative", "task"]);

const shape = {
  id: fileAttachments.id,
  organization_id: fileAttachments.organizationId,
  entity_type: fileAttachments.entityType,
  entity_id: fileAttachments.entityId,
  file_name: fileAttachments.fileName,
  file_size: fileAttachments.fileSize,
  file_type: fileAttachments.fileType,
  storage_path: fileAttachments.storagePath,
  uploaded_by: fileAttachments.uploadedBy,
  created_at: fileAttachments.createdAt,
};

// Uploads are handled by the POST /files/upload route (multipart proxy to R2);
// this router serves listing, presigned downloads, and deletes.
export const attachmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ entityType, entityId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      db
        .select(shape)
        .from(fileAttachments)
        .where(
          and(
            eq(fileAttachments.organizationId, ctx.orgId),
            eq(fileAttachments.entityType, input.entityType),
            eq(fileAttachments.entityId, input.entityId)
          )
        )
        .orderBy(desc(fileAttachments.createdAt))
    ),

  // Short-lived presigned GET URL for one attachment, org-scoped.
  downloadUrl: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select({ storagePath: fileAttachments.storagePath, fileName: fileAttachments.fileName })
        .from(fileAttachments)
        .where(and(eq(fileAttachments.id, input.id), eq(fileAttachments.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" });
      return { url: await presignDownload(row.storagePath, row.fileName) };
    }),

  // Delete: uploader or elevated (perms.attachments.delete). Removes the R2
  // object then the row.
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select({ storagePath: fileAttachments.storagePath, uploadedBy: fileAttachments.uploadedBy })
        .from(fileAttachments)
        .where(and(eq(fileAttachments.id, input.id), eq(fileAttachments.organizationId, ctx.orgId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" });

      const actor = await getActor(ctx);
      if (!perms.attachments.delete(actor, { uploadedBy: row.uploadedBy })) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to do that" });
      }
      await deleteObject(row.storagePath);
      await db.delete(fileAttachments).where(eq(fileAttachments.id, input.id));
      return { ok: true };
    }),
});
