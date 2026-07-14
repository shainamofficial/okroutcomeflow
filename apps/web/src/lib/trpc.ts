import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../api/src/router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Strangler-migration switch: when VITE_API_URL is set, hooks that have
 * been ported call the owned API instead of Supabase directly. Unset
 * (the default), everything behaves exactly as before.
 */
export const API_URL: string | undefined = import.meta.env.VITE_API_URL;

export const trpc = API_URL
  ? createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          async headers() {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  : null;
