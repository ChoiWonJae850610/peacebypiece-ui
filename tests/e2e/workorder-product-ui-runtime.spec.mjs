import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { addWaflSessionCookie, buildCompanyAdminSession } from "./helpers/waflSession.mjs";

const artifactRoot = path.join("artifacts", "ui-qa", "0.24.34.4");
const workOrderId = "wafl-fn-company-a-workorder-00001";
const nowIso = "2026-07-03T13:00:00.000Z";

const workOrder = {
  id: workOrderId,
  title: "0.24.34.4 런타임 검증 작업지시서",
  displayTitle: "0.24.34.4 런타임 검증 작업지시서",
  baseTitle: "0.24.34.4 런타임 검증 작업지시서",
  workOrderKind: "normal",
  isDefectOrder: false,
  reorderGroupId: null,
  reorderRound: 1,
  parentSpecSheetId: null,
  category1: "의류",
  category2: "상의",
  category3: "티셔츠",
  category1Id: "category-apparel",
  category2Id: "category-top",
  category3Id: "category-tshirt",
  season: "2026 SS",
  priority: "normal",
  vendor: "검증 봉제공장",
  manager: "기본 운영사 관리자",
  managerId: "wafl-fn-company-a-user-001",
  createdById: "wafl-fn-company-a-user-001",
  createdByRole: "admin",
  dueDate: "2026-07-20",
  quantity: 120,
  laborCost: 0,
  lossCost: 0,
  orderEntries: [],
  inventoryQuantity: 0,
  inventoryStatus: "none",
  materials: [],
  outsourcing: [],
  attachments: [],
  workflowState: "review",
  workflowPath: "standard_review",
  lastSavedAt: nowIso,
  factoryOrderRequest: null,
  hasDetailSnapshot: true,
  summaryAttachmentCount: 0,
};

const workOrderSummary = {
  ...workOrder,
  orderEntryCount: 0,
  representativeFactory: "검증 봉제공장",
  materialCount: 0,
  materialFabricCount: 0,
  materialSubmaterialCount: 0,
  materialSummary: "",
  materialItems: [],
  outsourcingCount: 0,
  attachmentCount: 0,
  createdAt: nowIso,
  updatedAt: nowIso,
};

async function mockWorkOrderReadApis(page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        user: {
          id: "wafl-fn-company-a-user-001",
          name: "기본 운영사 관리자",
          email: "wafl-fn-company-a-user-001@example.test",
          role: "company_admin",
          roles: ["company_admin"],
          companyId: "wafl-fn-company-a",
        },
      }),
    });
  });

  await page.route("**/api/workorders/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "connected", source: "e2e-mock" }),
    });
  });

  await page.route("**/api/admin/settings/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        users: [
          {
            id: "wafl-fn-company-a-user-001",
            name: "기본 운영사 관리자",
            email: "wafl-fn-company-a-user-001@example.test",
            role: "admin",
            roles: ["company_admin"],
          },
        ],
      }),
    });
  });

  await page.route("**/api/workorders/summary**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ workOrders: [workOrderSummary] }),
    });
  });

  await page.route(`**/api/workorders/${workOrderId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ workOrder }),
    });
  });

  await page.route(`**/api/workorders/${workOrderId}/factory-instruction`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        instruction: {
          workOrderId,
          content: "라벨 위치와 포장 단위를 확인해 주세요.",
          includeInFactoryPdf: true,
          updatedAt: nowIso,
        },
      }),
    });
  });

  await page.route(`**/api/workorders/${workOrderId}/size-spec`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          spec: {
          workOrderId,
          sizeSetCode: "apparel-basic",
          measurementUnit: "inch",
          sizes: [
            { code: "S", displayLabel: "S", sortOrder: 1 },
            { code: "M", displayLabel: "M", sortOrder: 2 },
          ],
          poms: [
            { code: "chest", displayName: "가슴둘레", measurementType: "circumference", instruction: null, sortOrder: 1 },
            { code: "length", displayName: "총장", measurementType: "length", instruction: null, sortOrder: 2 },
          ],
          values: [
            { sizeCode: "S", pomCode: "chest", displayValue: "34 1/8" },
            { sizeCode: "M", pomCode: "chest", displayValue: "36 7/8" },
          ],
            updatedAt: nowIso,
          },
          editPolicy: {
            editable: true,
            code: null,
            message: null,
          },
        },
      }),
    });
  });
}

function ensureArtifactRoot() {
  fs.mkdirSync(artifactRoot, { recursive: true });
}

async function attachSimulatorCompanyAdmin(page) {
  const result = await addWaflSessionCookie(
    page.context(),
    buildCompanyAdminSession({
      userId: "wafl-fn-company-a-user-001",
      companyId: "wafl-fn-company-a",
      companyMemberId: "wafl-fn-company-a-member-001",
      companyName: "기본 운영사",
      role: "company_admin",
      email: "wafl-fn-company-a-user-001@example.test",
      name: "기본 운영사 관리자",
    }),
  );
  test.skip(!result.ok, result.reason || "WAFL session secret is unavailable");
}

async function revealSizePanel(page) {
  const sizePanel = page.locator('[data-workorder-size-panel="side"]').first();
  if (await sizePanel.isVisible().catch(() => false)) return;

  const relatedButton = page.getByRole("button", { name: /추가정보|첨부|디자인|관련|정보 열기/ }).last();
  if (await relatedButton.isVisible().catch(() => false)) {
    await relatedButton.click();
  }

  const sizeTab = page.getByRole("tab", { name: /\uC0AC\uC774\uC988/ });
  if (await sizeTab.isVisible().catch(() => false)) {
    await sizeTab.click();
  }
}

test.describe("0.24.34.4 workorder product UI runtime evidence", () => {
  test("side-panel size editor renders after attachments and factory instruction", async ({ page }, testInfo) => {
    ensureArtifactRoot();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const observedRequests = [];
    const observedResponses = [];
    const httpErrors = [];
    const redirects = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push({
          text: message.text(),
          location: message.location(),
        });
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push({
        message: error.message,
        name: error.name,
        stack: error.stack ?? null,
      });
    });
    page.on("request", (request) => {
      if (request.url().includes("/api/workorders")) observedRequests.push(`${request.method()} ${request.url()}`);
    });
    page.on("response", (response) => {
      if (response.url().includes("/api/workorders")) observedResponses.push(`${response.status()} ${response.url()}`);
      if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
      const request = response.request();
      const redirectedFrom = request.redirectedFrom();
      if (redirectedFrom) redirects.push(`${redirectedFrom.url()} -> ${request.url()}`);
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`);
    });

    await attachSimulatorCompanyAdmin(page);
    await mockWorkOrderReadApis(page);
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.__waflFetchCalls = [];
      window.fetch = async (...args) => {
        const input = args[0];
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
        window.__waflFetchCalls.push(url);
        return originalFetch(...args);
      };
    });
    const startedAt = Date.now();
    await page.goto(`/workspace/workorders?workOrderId=${encodeURIComponent(workOrderId)}`);
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").innerText();
    const currentUrl = page.url();
    const nextOverlayText = await page.locator("nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-dialog], [data-nextjs-toast]").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? "").filter(Boolean),
    );
    const clientRootState = await page.evaluate(() => ({
      hasBody: Boolean(document.body),
      hasMain: Boolean(document.querySelector("main")),
      hasWorkorderShell: Boolean(document.querySelector('[data-workorder-size-panel="side"]') || document.body.textContent?.includes("작업지시서")),
      hasNextOverlay: Boolean(document.querySelector("nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-dialog], [data-nextjs-toast]")),
      readyState: document.readyState,
    }));
    const fetchCalls = await page.evaluate(() => window.__waflFetchCalls ?? []);
    test.skip(/login|SESSION_REQUIRED|service-paused/i.test(bodyText), "simulator company-admin session could not enter the workspace");
    const precheckManifestPath = path.join(artifactRoot, `${testInfo.project.name}-workorder-precheck.json`);
    fs.writeFileSync(
      precheckManifestPath,
      JSON.stringify(
        {
          project: testInfo.project.name,
          route: `/workspace/workorders?workOrderId=${workOrderId}`,
          currentUrl,
          redirects,
          observedRequests,
          observedResponses,
          fetchCalls,
          httpErrors,
          firstConsoleError: consoleErrors[0] ?? null,
          consoleErrors,
          firstPageError: pageErrors[0] ?? null,
          pageErrors,
          nextOverlayText,
          clientRootState,
          bodyPreview: bodyText.slice(0, 1000),
          consoleErrorCount: consoleErrors.length,
          pageErrorCount: pageErrors.length,
          failedRequestCount: failedRequests.length,
          failedRequests,
        },
        null,
        2,
      ),
    );

    await revealSizePanel(page);
    await expect(page.locator('[data-workorder-size-panel="side"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "치수 입력 및 수정" })).toBeVisible();

    const factoryInstructionTop = await page.locator("text=공장 전달사항").first().boundingBox();
    const sizePanelTop = await page.locator('[data-workorder-size-panel="side"]').first().boundingBox();
    if (factoryInstructionTop && sizePanelTop) {
      expect(sizePanelTop.y).toBeGreaterThanOrEqual(factoryInstructionTop.y);
    }

    await page.getByRole("button", { name: "치수 입력 및 수정" }).click();
    const sizeEditorDialog = page.getByRole("dialog");
    await expect(sizeEditorDialog).toBeVisible();
    await expect(sizeEditorDialog).toContainText("1/8");
    await expect(sizeEditorDialog).toContainText("7/8");

    const screenshotPath = path.join(artifactRoot, `${testInfo.project.name}-workorder-size-panel.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const workorderFailedRequests = failedRequests.filter((request) => request.includes("/api/workorders"));

    const manifestPath = path.join(artifactRoot, `${testInfo.project.name}-workorder-size-panel.json`);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          project: testInfo.project.name,
          route: `/workspace/workorders?workOrderId=${workOrderId}`,
          screenshotPath,
          durationMs: Date.now() - startedAt,
          consoleErrorCount: consoleErrors.length,
          failedRequestCount: failedRequests.length,
          workorderFailedRequestCount: workorderFailedRequests.length,
          httpErrorCount: httpErrors.length,
          consoleErrors: consoleErrors.slice(0, 10),
          failedRequests: failedRequests.slice(0, 10),
          workorderFailedRequests,
          httpErrors,
        },
        null,
        2,
      ),
    );

    expect(consoleErrors, "browser console errors").toHaveLength(0);
    expect(workorderFailedRequests, "failed workorder browser requests").toHaveLength(0);
    expect(httpErrors, "HTTP 4xx/5xx responses").toHaveLength(0);
  });
});
