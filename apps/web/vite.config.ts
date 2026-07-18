import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the large, stable vendor libs out of the main entry chunk so
        // they cache across app deploys and load in parallel. Only the
        // always-needed vendors are named; heavier optional libs (recharts,
        // framer-motion) are left to Rollup, which already keeps them in
        // on-demand chunks pulled by the lazy-loaded routes.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tanstack") || id.includes("@trpc")) return "data";
          if (id.includes("better-auth")) return "auth";
          // everything else: leave to Rollup's default chunking
        },
      },
    },
  },
}));
