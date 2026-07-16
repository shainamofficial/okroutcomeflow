import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Better Auth constructs its instance at module load and needs a db handle;
// mock the client so the test never opens a connection.
vi.mock("../db/client", () => ({ db: {} }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-value-at-least-32-chars-long");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:8787");
  vi.stubEnv("CORS_ORIGINS", "http://localhost:8080");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Better Auth instance", () => {
  it("builds and exposes a request handler", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    const { auth } = await import("./auth");
    expect(typeof auth.handler).toBe("function");
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it("registers Google only when both credentials are present", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    const { auth } = await import("./auth");
    expect(auth.options.socialProviders?.google).toBeDefined();
  });

  it("omits Google when credentials are absent", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    const { auth } = await import("./auth");
    expect(auth.options.socialProviders?.google).toBeUndefined();
  });
});
