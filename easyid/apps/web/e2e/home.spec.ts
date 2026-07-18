import { expect, test } from "@playwright/test";

test("home page renders the compliance headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Compliance Matters." })).toBeVisible();
});
