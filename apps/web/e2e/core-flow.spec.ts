import { test, expect, type Page } from "@playwright/test";

// Unique per run (matches the e2e-%@e2e.example pattern the teardown cleans up).
const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const email = `e2e-${stamp}@e2e.example`;
const password = "e2e-test-pw-123";

// The first-run onboarding modal can overlay the app; dismiss it if present.
async function dismissOnboarding(page: Page) {
  const skip = page.getByRole("button", { name: /^skip$/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("sign up, create an objective, add a key result", async ({ page }) => {
  // --- Sign up (Better Auth auto-signs-in + provisions an org) ---
  await page.goto("/signup");
  await page.getByPlaceholder("Your name").fill("E2E Bot");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 20_000 });
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await dismissOnboarding(page);

  // --- Create an objective ---
  await page.goto("/app/okrs");
  await dismissOnboarding(page);
  await page.getByRole("button", { name: /create objective/i }).click();

  const objectiveTitle = `E2E Objective ${stamp}`;
  const objDialog = page.getByRole("dialog");
  await objDialog.getByRole("textbox").first().fill(objectiveTitle);
  await objDialog.getByRole("button", { name: /^create/i }).click();

  await expect(page.getByText(objectiveTitle)).toBeVisible({ timeout: 15_000 });

  // --- Add a key result under it ---
  await page.getByRole("button", { name: /add key result/i }).first().click();

  const krTitle = `E2E KR ${stamp}`;
  const krDialog = page.getByRole("dialog");
  await krDialog.getByRole("textbox").first().fill(krTitle);
  await krDialog.getByRole("button", { name: /^create/i }).click();

  await expect(page.getByText(krTitle)).toBeVisible({ timeout: 15_000 });
});
