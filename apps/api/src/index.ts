import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router";
import { createContext, type Context } from "./context";
import { auth } from "./auth/auth";
import { db } from "./db/client";
import { fileAttachments } from "./db/schema";
import { loadEntityRef, type EntityType } from "./lib/entity";
import { isR2Configured, putObject } from "./lib/r2";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB, matches the client cap.

const app = new Hono();

app.use(logger());

// The web app runs on a different origin (Vite :8080, API :8787) in dev,
// and likely different hosts in production. Better Auth sets session
// cookies, so its routes need credentialed CORS with an explicit origin.
const allowedOrigin = (origin: string) => {
  const allowed = (process.env.CORS_ORIGINS ?? "http://localhost:8080")
    .split(",")
    .map((o) => o.trim());
  return allowed.includes(origin) ? origin : null;
};

// Credentialed on both: /api/auth sets the session cookie, and /trpc reads
// it back (Better Auth session).
app.use("/trpc/*", cors({ origin: allowedOrigin, credentials: true }));
app.use("/api/auth/*", cors({ origin: allowedOrigin, credentials: true }));
app.use("/files/*", cors({ origin: allowedOrigin, credentials: true }));

// File-attachment upload proxy: the browser POSTs multipart form-data here so
// it never needs R2 bucket CORS; we stream the bytes to R2 and record the
// row. Downloads/deletes go through the tRPC attachments router.
app.post("/files/upload", async (c) => {
  const ctx: Context = await createContext({ req: c.req.raw } as Parameters<typeof createContext>[0]);
  if (!ctx.userId) return c.json({ error: "Unauthorized" }, 401);
  if (!ctx.orgId) return c.json({ error: "No active organization" }, 403);
  if (!isR2Configured()) return c.json({ error: "File storage is not configured" }, 503);

  const form = await c.req.formData();
  const file = form.get("file");
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");

  if (!(file instanceof File)) return c.json({ error: "No file provided" }, 400);
  if (!["kr", "initiative", "task"].includes(entityType) || !entityId) {
    return c.json({ error: "Invalid entity" }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: "File too large (max 20MB)" }, 413);

  const ref = await loadEntityRef(entityType as EntityType, entityId, ctx.orgId, ctx.userId);
  if (!ref) return c.json({ error: "Entity not found in your organization" }, 404);

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const key = `${ctx.orgId}/${entityType}/${entityId}/${randomUUID()}${ext ? "." + ext : ""}`;
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type || undefined);

  const [created] = await db
    .insert(fileAttachments)
    .values({
      organizationId: ctx.orgId,
      entityType: entityType as EntityType,
      entityId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || null,
      storagePath: key,
      uploadedBy: ctx.userId,
    })
    .returning({
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
    });

  return c.json(created);
});

app.get("/health", (c) =>
  c.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

// Better Auth owns everything under /api/auth (signup, login, OAuth,
// session). It takes and returns Web Request/Response, so Hono hands the
// raw request straight through.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("/trpc/*", trpcServer({ router: appRouter, createContext }));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`OKRoutcomeFlow API listening on http://localhost:${info.port}`);
});
