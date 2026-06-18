import { expect, test } from "@playwright/test";

import {
  addWaflSessionCookie,
  buildCompanyAdminSession,
  buildWorkspaceMemberSession,
} from "./waflSession.mjs";

export const FUNCTIONS_CORE_E2E_ENABLED = process.env.WAFL_FUNCTIONS_E2E_ENABLED === "1";

export function buildSystemAdminSession(overrides = {}) {
  return {
    userId: "e2e-system-admin-user",
    companyId: null,
    companyMemberId: null,
    companyName: null,
    role: "system_admin",
    email: "e2e.system.admin@example.test",
    name: "E2E 시스템관리자",
    ...overrides,
  };
}

export async function installCoreSession(context, role) {
  const payload = role === "system-admin"
    ? buildSystemAdminSession()
    : role === "member"
      ? buildWorkspaceMemberSession({
          companyId: "functions-company-a",
          companyMemberId: "functions-company-a-member",
          companyName: "Functions 회사 A",
        })
      : buildCompanyAdminSession({
          companyId: "functions-company-a",
          companyMemberId: "functions-company-a-admin",
          companyName: "Functions 회사 A",
        });

  const session = await addWaflSessionCookie(context, payload);
  test.skip(!session.ok, session.reason);
  return payload;
}

export async function gotoCoreRouteOrSkip(page, route, expectedText) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

  const currentUrl = page.url();
  if (!currentUrl.includes(route.split("?")[0])) {
    test.skip(true, `핵심 E2E 세션으로 ${route}에 진입하지 못했습니다. currentUrl=${currentUrl}`);
  }

  const body = page.locator("body");
  await expect(body).toContainText(expectedText, { timeout: 15_000 });
  return body;
}

export async function assertNoHorizontalDocumentOverflow(page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}
