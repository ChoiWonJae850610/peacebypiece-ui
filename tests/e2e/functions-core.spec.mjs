import { expect, test } from "@playwright/test";

import {
  FUNCTIONS_CORE_E2E_ENABLED,
  assertNoHorizontalDocumentOverflow,
  gotoCoreRouteOrSkip,
  installCoreSession,
} from "./helpers/functionsCore.mjs";

/**
 * WAFL 핵심 기능 E2E 기반.
 *
 * 기본 실행에서는 환경·seed 없이 운영 데이터에 접근하지 않도록 전체 suite를 skip한다.
 * WAFL_FUNCTIONS_E2E_ENABLED=1과 로그인 세션 secret, 전용 dev/test 데이터가 준비된 경우에만 실행한다.
 */
test.describe("functions core e2e", () => {
  test.skip(!FUNCTIONS_CORE_E2E_ENABLED, "WAFL_FUNCTIONS_E2E_ENABLED=1인 dev/test 환경에서만 실행합니다.");

  test("WKR-001-N01 작업지시서 목록 화면 진입", async ({ context, page }) => {
    await installCoreSession(context, "company-admin");
    const body = await gotoCoreRouteOrSkip(page, "/worker", /작업지시서|작업실/);

    await expect(body).toBeVisible();
    await assertNoHorizontalDocumentOverflow(page);
  });

  test("MAT-001-N01 자재 발주 화면 진입", async ({ context, page }) => {
    await installCoreSession(context, "company-admin");
    const body = await gotoCoreRouteOrSkip(page, "/workspace/material-orders", /발주서|자재 발주/);

    await expect(body).toBeVisible();
    await assertNoHorizontalDocumentOverflow(page);
  });

  test("ADM-001-N01 고객사 관리자 멤버 관리 진입", async ({ context, page }) => {
    await installCoreSession(context, "company-admin");
    const body = await gotoCoreRouteOrSkip(page, "/workspace/settings", /설정|멤버 관리/);

    await expect(body).toBeVisible();
    await assertNoHorizontalDocumentOverflow(page);
  });

  test("SYS-001-N01 시스템관리자 고객사 승인 화면 진입", async ({ context, page }) => {
    await installCoreSession(context, "system-admin");
    const body = await gotoCoreRouteOrSkip(page, "/system/companies", /고객사|회사/);

    await expect(body).toBeVisible();
    await assertNoHorizontalDocumentOverflow(page);
  });

  test("USR-001-N01 개인 설정 화면 진입", async ({ context, page }) => {
    await installCoreSession(context, "company-admin");
    const body = await gotoCoreRouteOrSkip(page, "/me/settings", /개인 설정|개인 환경설정/);

    await expect(body).toBeVisible();
    await assertNoHorizontalDocumentOverflow(page);
  });
});
