import * as Sentry from "@sentry/node";

// Error tracking, opt-in via SENTRY_DSN. Without it, this is a no-op and the
// SDK never initializes. Imported first in index.ts so init runs before the
// app handles requests.
const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    // Errors only; turn on tracing later if you want performance data.
    tracesSampleRate: 0,
  });
}

export { Sentry };
