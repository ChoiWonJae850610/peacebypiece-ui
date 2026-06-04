import { expect, test } from "@playwright/test";

test.describe("public entry smoke", () => {
  test("login page renders the WAFL public entry", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/WAFL/);
    await expect(page.getByRole("heading", { name: /Google 계정으로 계속하세요/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Google로 계속하기/ })).toHaveAttribute(
      "href",
      /\/api\/auth\/google\/start\?requestType=login/,
    );
  });
});
