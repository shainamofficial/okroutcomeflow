import { createAuthClient } from "better-auth/react";

// Points at the owned API where Better Auth is mounted (/api/auth/*).
// Session cookies are set on that origin and sent with credentials.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8787",
});
