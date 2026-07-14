import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router";

const app = new Hono();

app.use(logger());

// The web app runs on a different origin (Vite :8080, API :8787) in dev,
// and likely different hosts in production.
app.use(
  "/trpc/*",
  cors({
    origin: (origin) => {
      const allowed = (process.env.CORS_ORIGINS ?? "http://localhost:8080")
        .split(",")
        .map((o) => o.trim());
      return allowed.includes(origin) ? origin : null;
    },
  })
);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

app.use("/trpc/*", trpcServer({ router: appRouter }));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`OKRoutcomeFlow API listening on http://localhost:${info.port}`);
});
