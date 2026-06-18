import { test } from "@playwright/test";

import {
  FUNCTIONS_RESPONSIVE_VIEWPORTS,
  RESPONSIVE_CORE_ROUTES,
  assertDrawerCanOpenWhenAvailable,
  assertViewportContainment,
  assertVisiblePanelsScrollable,
  assertWorkspacePanelContract,
  openResponsiveRoute,
  skipResponsiveSuiteUnlessEnabled,
} from "./helpers/functionsResponsive.mjs";

/**
 * WAFL 반응형·기기 계약 E2E.
 * 명시적인 dev/test 환경, 로그인 session secret, 전용 fixture가 없으면 안전하게 skip한다.
 */
test.describe("functions responsive e2e", () => {
  skipResponsiveSuiteUnlessEnabled();

  for (const scenario of RESPONSIVE_CORE_ROUTES) {
    for (const viewport of FUNCTIONS_RESPONSIVE_VIEWPORTS) {
      test(`${scenario.id} ${viewport.label}`, async ({ context, page }, testInfo) => {
        await openResponsiveRoute(page, context, scenario, viewport);
        await assertWorkspacePanelContract(page, viewport);
        await assertVisiblePanelsScrollable(page);
        await assertViewportContainment(page);

        if (viewport.expectDrawerMode) await assertDrawerCanOpenWhenAvailable(page);

        await testInfo.attach("responsive-contract", {
          body: JSON.stringify({
            scenario: scenario.id,
            route: scenario.route,
            viewport,
            result: "assertions-completed",
          }, null, 2),
          contentType: "application/json",
        });
      });
    }
  }
});
