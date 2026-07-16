import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router";
import { createContext } from "./context";
import { auth } from "./auth/auth";

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

app.use("/trpc/*", cors({ origin: allowedOrigin }));
app.use("/api/auth/*", cors({ origin: allowedOrigin, credentials: true }));

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
