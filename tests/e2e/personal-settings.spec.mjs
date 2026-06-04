import { expect, test } from "@playwright/test";

import { addWaflSessionCookie, buildCompanyAdminSession } from "./helpers/waflSession.mjs";

async function mockPersonalProfileApi(page) {
  await page.route("**/api/me/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          userId: "e2e-company-admin-user",
          email: "e2e.admin@example.test",
          name: "E2E 고객사 관리자",
          phone: "01012345678",
          birthday: "",
          companyId: "e2e-company",
          companyName: "E2E 테스트 회사",
          companyMemberId: "e2e-company-admin-member",
          roleTemplateCode: "company_admin",
          memberStatus: "active",
          profileComplete: true,
        },
      }),
    });
  });
}

async function gotoPersonalSettingsOrSkip(page) {
  await page.goto("/me/settings", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

  const currentUrl = page.url();
  if (!currentUrl.includes("/me/settings")) {
    test.skip(true, `테스트 세션으로 /me/settings에 진입하지 못했습니다. currentUrl=${currentUrl}`);
  }

  const body = page.locator("body");
  await expect(body).toContainText(/개인 설정|개인 환경설정/, { timeout: 15_000 });
  return body;
}

test.describe("personal settings smoke", () => {
  test("personal profile hides the language switcher from the customer UI", async ({ context, page }) => {
    const session = await addWaflSessionCookie(context, buildCompanyAdminSession());
    test.skip(!session.ok, session.reason);

    await mockPersonalProfileApi(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "peacebypiece.personal.settings",
        JSON.stringify({ language: "en", theme: "beige-atelier", density: "comfortable", defaultHome: "workspace" }),
      );
    });

    const body = await gotoPersonalSettingsOrSkip(page);

    await expect(body).toContainText("개인 프로필", { timeout: 15_000 });
    await expect(body).toContainText("테마", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "English" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "한국어" })).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  });
});
