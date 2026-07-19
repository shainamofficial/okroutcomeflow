import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error tracking, opt-in via VITE_SENTRY_DSN. Loaded lazily so the SDK is
// excluded from the main bundle when unconfigured.
if (import.meta.env.VITE_SENTRY_DSN) {
  void import("./lib/sentry").then((m) => m.initSentry());
}

createRoot(document.getElementById("root")!).render(<App />);
