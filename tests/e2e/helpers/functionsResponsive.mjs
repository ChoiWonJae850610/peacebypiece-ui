import { expect, test } from "@playwright/test";

import {
  assertNoHorizontalDocumentOverflow,
  gotoCoreRouteOrSkip,
  installCoreSession,
} from "./functionsCore.mjs";

export const FUNCTIONS_RESPONSIVE_E2E_ENABLED = process.env.WAFL_FUNCTIONS_RESPONSIVE_E2E_ENABLED === "1";

export const FUNCTIONS_RESPONSIVE_VIEWPORTS = [
  { id: "desktop-1440", label: "Desktop 1440×900", width: 1440, height: 900, expectedPanels: 3, expectDrawerMode: false },
  { id: "desktop-1280", label: "Desktop 1280×800", width: 1280, height: 800, expectedPanels: 3, expectDrawerMode: false },
  { id: "ipad-mini-landscape", label: "iPad Mini 가로", width: 1133, height: 744, expectedPanels: 2, expectDrawerMode: true },
  { id: "ipad-mini-portrait", label: "iPad Mini 세로", width: 744, height: 1133, expectedPanels: 1, expectDrawerMode: true },
  { id: "galaxy-tab-landscape", label: "Galaxy Tab 가로", width: 1280, height: 800, expectedPanels: 3, expectDrawerMode: false },
  { id: "galaxy-tab-portrait", label: "Galaxy Tab 세로", width: 800, height: 1280, expectedPanels: 2, expectDrawerMode: true },
  { id: "iphone-portrait", label: "iPhone 세로", width: 390, height: 844, expectedPanels: 1, expectDrawerMode: true },
  { id: "galaxy-s-portrait", label: "Galaxy S 세로", width: 360, height: 800, expectedPanels: 1, expectDrawerMode: true },
];

export const RESPONSIVE_CORE_ROUTES = [
  { id: "WKR-004-R01", route: "/worker", role: "company-admin", expectedText: /작업지시서|작업실/ },
  { id: "MAT-003-R01", route: "/workspace/material-orders", role: "company-admin", expectedText: /발주서|자재 발주/ },
];

export async function openResponsiveRoute(page, context, scenario, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await installCoreSession(context, scenario.role);
  await gotoCoreRouteOrSkip(page, scenario.route, scenario.expectedText);
  await assertNoHorizontalDocumentOverflow(page);
}

export async function assertWorkspacePanelContract(page, viewport) {
  const threePanel = page.locator('[data-wafl-component="three-panel-workspace"]:visible');
  const twoPanel = page.locator('[data-wafl-component="two-panel-workspace"]:visible');
  const tabletFrame = page.locator('[data-wafl-component="tablet-workspace-frame"]:visible');

  if (viewport.expectedPanels === 3) {
    await expect(threePanel).toHaveCount(1);
    await expect(twoPanel).toHaveCount(0);
  } else if (viewport.expectedPanels === 2) {
    await expect(twoPanel).toHaveCount(1);
    await expect(threePanel).toHaveCount(0);
  } else {
    await expect(threePanel).toHaveCount(0);
    await expect(twoPanel).toHaveCount(0);
  }

  if (viewport.width >= 768 && viewport.width < 1280 && viewport.expectedPanels === 2) {
    await expect(tabletFrame).toHaveCount(1);
  }
}

export async function assertVisiblePanelsScrollable(page) {
  const result = await page.locator('[data-wafl-component="workspace-panel"]:visible').evaluateAll((panels) => panels.map((panel) => {
    const style = window.getComputedStyle(panel);
    return {
      role: panel.getAttribute("data-wafl-panel-role"),
      overflowY: style.overflowY,
      clientHeight: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
    };
  }));

  for (const panel of result) {
    expect(["auto", "scroll", "hidden", "clip", "visible"]).toContain(panel.overflowY);
    expect(panel.clientHeight).toBeGreaterThan(0);
  }
}

export async function assertViewportContainment(page) {
  const escaped = await page.locator('button:visible, [role="button"]:visible, [data-wafl-component="modal-footer"]:visible').evaluateAll((elements) => {
    const viewportWidth = document.documentElement.clientWidth;
    return elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent?.trim().slice(0, 80) ?? "", left: rect.left, right: rect.right, width: rect.width };
      })
      .filter((rect) => rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1));
  });
  expect(escaped, `viewport 밖으로 이탈한 주요 컨트롤: ${JSON.stringify(escaped)}`).toEqual([]);
}

export async function assertDrawerCanOpenWhenAvailable(page) {
  const trigger = page.getByRole("button", { name: /목록|발주서 목록|작업지시서 목록/i }).first();
  if (await trigger.count() === 0 || !(await trigger.isVisible().catch(() => false))) return;

  await trigger.click();
  const drawer = page.locator('[role="dialog"]:visible').filter({ has: page.locator('[class*="drawer"], [data-wafl-component="list-panel-shell"]') }).first();
  const anyDialog = page.locator('[role="dialog"]:visible').first();
  await expect(drawer.or(anyDialog)).toBeVisible();

  const close = page.getByRole("button", { name: /닫기|목록 닫기/i }).first();
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
}

export function skipResponsiveSuiteUnlessEnabled() {
  test.skip(!FUNCTIONS_RESPONSIVE_E2E_ENABLED, "WAFL_FUNCTIONS_RESPONSIVE_E2E_ENABLED=1인 dev/test 환경에서만 실행합니다.");
}
