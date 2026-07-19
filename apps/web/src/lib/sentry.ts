import * as Sentry from "@sentry/react";

// Loaded dynamically only when VITE_SENTRY_DSN is set (see main.tsx), so the
// SDK lands in its own lazy chunk and never bloats the main bundle when
// Sentry isn't configured. Sentry's init installs global error +
// unhandledrejection handlers, so most runtime errors are captured.
export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });
}
