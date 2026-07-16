import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../api/src/router";

/**
 * The owned API is now the app's data + auth backend. The tRPC client
 * always exists and sends the Better Auth session cookie (credentials).
 * The `trpc` export stays non-null so ported hooks (`if (trpc)`) always
 * take the API path.
 */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});
