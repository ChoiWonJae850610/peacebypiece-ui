import { expect, test } from "@playwright/test";

import {
  clearPublicSignupFixtureSession,
  createApprovedPublicSignupCompanyAdminSession,
  createPublicSignupApplicantSession,
  createPublicSignupSystemAdminSession,
  expectNoRawPublicSignupSecrets,
} from "./helpers/publicSignupAuth.mjs";

test.describe("authenticated public signup QA automation", () => {
  test.afterEach(async ({ page }) => {
    await clearPublicSignupFixtureSession(page);
  });

  test("applicant fixture opens the public signup flow without raw cookies", async ({ page }) => {
    const fixture = await createPublicSignupApplicantSession(page);
    test.skip(fixture.blocked, "dev/test fixture route is blocked in this runtime");

    await page.goto("/signup");
    await expect(page).toHaveTitle(/WAFL/);
    await expect(page.getByRole("heading", { name: /7/ })).toBeVisible();
    await expectNoRawPublicSignupSecrets(page);
  });

  test("system-admin fixture keeps system signup review routes guarded by server session", async ({ page }) => {
    const fixture = await createPublicSignupSystemAdminSession(page);
    test.skip(fixture.blocked, "dev/test fixture route is blocked in this runtime");

    await page.goto("/system/signup-applications");
    await expect(page).toHaveURL(/\/system\/signup-applications/);
    await expectNoRawPublicSignupSecrets(page);
  });

  test("approved company-admin fixture can reach the authenticated app shell", async ({ page }) => {
    const fixture = await createApprovedPublicSignupCompanyAdminSession(page);
    test.skip(fixture.blocked, "dev/test fixture route is blocked in this runtime");

    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/workspace|\/login|\/pending/);
    await expectNoRawPublicSignupSecrets(page);
  });

  test("public signup and invitation entry points remain separated", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("body")).toContainText(/Trial|100MB|3/);
    await expect(page.getByRole("link", { name: /Google|가입|signup/i })).toHaveAttribute("href", /intent=signup/);
    await expectNoRawPublicSignupSecrets(page);
  });
});
