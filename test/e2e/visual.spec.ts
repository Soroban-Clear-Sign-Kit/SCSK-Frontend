import { test, expect } from "@playwright/test";

const states = [
  "loading",
  "ready",
  "review",
  "blocked",
  "error",
  "success",
] as const;

const themes = ["light", "dark"] as const;

test.describe("ClearSignModal Visual Regression Tests", () => {
  for (const theme of themes) {
    for (const state of states) {
      test(`modal visual snapshot: ${state} (${theme})`, async ({ page }) => {
        await page.goto(`/?state=${state}&theme=${theme}`);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Ensure animations have finished settling
        await page.waitForTimeout(200);

        await expect(dialog).toHaveScreenshot(`${state}-${theme}.png`);
      });
    }
  }
});
