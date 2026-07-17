import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// email.ts reads RESEND_API_KEY at import time, so re-import per case with the
// env set/unset via vi.resetModules.
const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterEach(() => {
  process.env = OLD_ENV;
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("falls back to console.log and does NOT fetch when no key is set", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendEmail, isEmailConfigured } = await import("./email");

    expect(isEmailConfigured()).toBe(false);
    await sendEmail({ to: "a@co.com", subject: "Hi", html: "<p>x</p>", text: "x" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("POSTs to Resend with the bearer token when a key is set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "OF <no-reply@of.test>";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendEmail, isEmailConfigured } = await import("./email");

    expect(isEmailConfigured()).toBe(true);
    await sendEmail({ to: "a@co.com", subject: "Hi", html: "<p>x</p>", text: "x" });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ from: "OF <no-reply@of.test>", to: "a@co.com", subject: "Hi" });
  });

  it("throws when Resend returns a non-2xx", async () => {
    process.env.RESEND_API_KEY = "re_test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 422 }));
    const { sendEmail } = await import("./email");
    await expect(
      sendEmail({ to: "a@co.com", subject: "Hi", html: "<p>x</p>" })
    ).rejects.toThrow(/422/);
  });
});

describe("resetPasswordEmail", () => {
  it("includes the url and greets by name when provided", async () => {
    const { resetPasswordEmail } = await import("./email");
    const withName = resetPasswordEmail("https://app/reset?token=abc", "Sam");
    expect(withName.html).toContain("https://app/reset?token=abc");
    expect(withName.html).toContain("Hi Sam,");
    expect(withName.text).toContain("https://app/reset?token=abc");

    const noName = resetPasswordEmail("https://app/reset?token=abc");
    expect(noName.html).toContain("Hi,");
  });
});
